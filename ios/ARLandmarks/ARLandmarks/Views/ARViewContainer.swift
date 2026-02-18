//
//  ARViewContainer.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import SwiftUI
import ARKit
import RealityKit
import CoreLocation

struct ARViewContainer: UIViewRepresentable {
    let landmarks: [Landmark]
    @Binding var selectedLandmark: Landmark?
    let modeManager: ARModeManager
    let currentMode: ARModeManager.ARMode

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)

        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal, .vertical]
        config.environmentTexturing = .automatic
        config.worldAlignment = .gravityAndHeading
        arView.session.run(config)

        arView.session.delegate = context.coordinator

        context.coordinator.arView = arView
        context.coordinator.landmarks = landmarks
        context.coordinator.startLocationUpdates()

        let tapGesture = UITapGestureRecognizer(
            target: context.coordinator,
            action: #selector(Coordinator.handleTap(_:))
        )
        arView.addGestureRecognizer(tapGesture)

        print("Landmarks set: \(landmarks.count)")

        return arView
    }

    func updateUIView(_ arView: ARView, context: Context) {
        context.coordinator.parent = self
        context.coordinator.landmarks = landmarks

        if context.coordinator.lastMode != currentMode {
            context.coordinator.lastMode = currentMode
            context.coordinator.updatePOIs()
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    static func dismantleUIView(_ arView: ARView, coordinator: Coordinator) {
        arView.session.pause()

        coordinator.stopLocationUpdates()

        coordinator.cleanupAllPOIs()
    }

    // MARK: - Coordinator

    class Coordinator: NSObject, CLLocationManagerDelegate, ARSessionDelegate {
        var parent: ARViewContainer
        var arView: ARView?
        var landmarks: [Landmark] = []
        var placedLandmarkIds: Set<String> = []
        var lastMode: ARModeManager.ARMode?

        private let locationManager = CLLocationManager()
        private var currentLocation: CLLocation?
        private var currentHeading: CLHeading?
        private var lastVisionProcessTime: Date = .distantPast

        init(_ parent: ARViewContainer) {
            self.parent = parent
            super.init()

            locationManager.delegate = self
            locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
            locationManager.distanceFilter = 10
            locationManager.headingFilter = 10
            locationManager.activityType = .fitness
        }

        func startLocationUpdates() {
            locationManager.requestWhenInUseAuthorization()
            locationManager.startUpdatingLocation()
            locationManager.startUpdatingHeading()
        }

        func stopLocationUpdates() {
            locationManager.stopUpdatingLocation()
            locationManager.stopUpdatingHeading()
        }

        func cleanupAllPOIs() {
            guard let arView = arView else { return }
            arView.scene.anchors.removeAll()
            placedLandmarkIds.removeAll()
        }

        // MARK: - CLLocationManagerDelegate

        func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
            guard let location = locations.last else { return }
            currentLocation = location

            print("Location Update: \(location.coordinate.latitude), \(location.coordinate.longitude)")

            updatePOIs()
        }

        func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
            currentHeading = newHeading
        }

        func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
            print("Location error: \(error.localizedDescription)")
        }

        // MARK: - ARSessionDelegate

        func session(_ session: ARSession, didUpdate frame: ARFrame) {
            guard parent.modeManager.currentMode == .visualRecognition else { return }

            let now = Date()
            guard now.timeIntervalSince(lastVisionProcessTime) >= 0.5 else { return }
            lastVisionProcessTime = now

            let pixelBuffer = frame.capturedImage

            Task { @MainActor in
                if let result = await parent.modeManager.visionService.classifyImage(pixelBuffer) {
                    parent.modeManager.handleRecognition(result, landmarks: landmarks)
                } else {
                    parent.modeManager.handleNoRecognition()
                }
            }
        }

        // MARK: - POI Management

        func updatePOIs() {
            guard let arView = arView,
                  let userLocation = currentLocation else {
                print("Location unavailable")
                return
            }

            if parent.modeManager.currentMode == .visualRecognition {
                cleanupAllPOIs()
                return
            }

            let maxPOIDistance = 500.0
            let nearbyLandmarks = findNearbyLandmarks(userLocation: userLocation, radius: maxPOIDistance)

            for landmark in nearbyLandmarks {
                if !placedLandmarkIds.contains(landmark.id) {
                    placePOI(for: landmark, userLocation: userLocation, in: arView)
                    placedLandmarkIds.insert(landmark.id)
                }
            }

            cleanupDistantPOIs(userLocation: userLocation, maxDistance: maxPOIDistance * 1.5)
        }

        private func cleanupDistantPOIs(userLocation: CLLocation, maxDistance: Double) {
            guard let arView = arView else { return }

            var idsToRemove = Set<String>()

            for landmarkId in placedLandmarkIds {
                guard let landmark = landmarks.first(where: { $0.id == landmarkId }) else {
                    idsToRemove.insert(landmarkId)
                    continue
                }

                let landmarkLocation = CLLocation(
                    latitude: landmark.latitude,
                    longitude: landmark.longitude
                )
                let distance = userLocation.distance(from: landmarkLocation)

                if distance > maxDistance {
                    if let anchor = arView.scene.anchors.first(where: { anchor in
                        anchor.children.contains { $0.name == landmarkId }
                    }) {
                        arView.scene.removeAnchor(anchor)
                    }
                    idsToRemove.insert(landmarkId)
                }
            }

            placedLandmarkIds.subtract(idsToRemove)

            if !idsToRemove.isEmpty {
                print("Cleaned up \(idsToRemove.count) distant POIs")
            }
        }

        private func findNearbyLandmarks(userLocation: CLLocation, radius: Double) -> [Landmark] {
            print("Search for landmarks near: \(userLocation.coordinate.latitude), \(userLocation.coordinate.longitude)")
            print("Number of allLandmarks: \(landmarks.count)")

            let nearbyLandmarks = landmarks.filter { landmark in
                let landmarkLocation = CLLocation(
                    latitude: landmark.latitude,
                    longitude: landmark.longitude
                )
                let distance = userLocation.distance(from: landmarkLocation)
                print("   \(landmark.name): \(Int(distance))m")
                return distance <= radius
            }

            print("Nearby landmarks found: \(nearbyLandmarks.count)")
            return nearbyLandmarks
        }

        private func placePOI(for landmark: Landmark, userLocation: CLLocation, in arView: ARView) {
            let landmarkLocation = CLLocation(
                latitude: landmark.latitude,
                longitude: landmark.longitude
            )

            let distance = userLocation.distance(from: landmarkLocation)
            let bearing = calculateBearing(from: userLocation, to: landmarkLocation)

            let arDistance = min(Float(distance / 100), 10.0)

            let x = arDistance * Float(sin(bearing))
            let z = -arDistance * Float(cos(bearing))

            let y: Float = Float(distance / 5000)

            let position = SIMD3<Float>(x, y, z)

            let anchorEntity = AnchorEntity(world: position)

            let markerEntity = createBillboardMarker(for: landmark)
            markerEntity.name = landmark.id
            markerEntity.generateCollisionShapes(recursive: true)

            anchorEntity.addChild(markerEntity)
            arView.scene.addAnchor(anchorEntity)

            print("POI created: \(landmark.name) at \(position) with ID \(landmark.id)")
        }

        // Creates a flat plane with a circular marker image that always rotates to face the camera.
        // The image starts as a colored placeholder and gets replaced once the photo is downloaded.
        private func createBillboardMarker(for landmark: Landmark) -> ModelEntity {
            let placeholderImage = renderMarker(for: landmark, with: nil)

            let plane = MeshResource.generatePlane(width: 0.25, height: 0.25)

            var material = UnlitMaterial()
            if let cgImage = placeholderImage.cgImage {
                if let texture = try? TextureResource(image: cgImage, options: .init(semantic: .color)) {
                    material.color = .init(texture: .init(texture))
                }
            }
            material.blending = .transparent(opacity: 1.0)

            let entity = ModelEntity(mesh: plane, materials: [material])

            entity.components.set(BillboardComponent())

            if let imageUrlString = landmark.imageUrl, let imageUrl = URL(string: imageUrlString) {
                loadImage(from: imageUrl) { [weak self, weak entity] loadedImage in
                    guard let self = self, let entity = entity, let loadedImage = loadedImage else { return }

                    DispatchQueue.main.async {
                        let markerImage = self.renderMarker(for: landmark, with: loadedImage)

                        var updatedMaterial = UnlitMaterial()
                        if let cgImage = markerImage.cgImage {
                            if let texture = try? TextureResource(image: cgImage, options: .init(semantic: .color)) {
                                updatedMaterial.color = .init(texture: .init(texture))
                            }
                        }
                        updatedMaterial.blending = .transparent(opacity: 1.0)
                        entity.model?.materials = [updatedMaterial]
                    }
                }
            }

            return entity
        }

        private func loadImage(from url: URL, completion: @escaping @Sendable (UIImage?) -> Void) {
            URLSession.shared.dataTask(with: url) { data, _, error in
                if let error = error {
                    print("Failed to load image: \(error.localizedDescription)")
                    completion(nil)
                    return
                }

                if let data = data, let image = UIImage(data: data) {
                    completion(image)
                } else {
                    completion(nil)
                }
            }.resume()
        }

        // Draws a circle with a white border and either the landmark photo or a
        // category-colored icon. Returns a UIImage used as the AR marker texture.
        private func renderMarker(for landmark: Landmark, with landmarkImage: UIImage?) -> UIImage {
            let circleSize: CGFloat = 100
            let borderWidth: CGFloat = 4
            let padding: CGFloat = 8
            let size = CGSize(width: circleSize + borderWidth * 2 + padding * 2, height: circleSize + borderWidth * 2 + padding * 2)
            let renderer = UIGraphicsImageRenderer(size: size)

            return renderer.image { context in
                let ctx = context.cgContext

                let circleX = padding + borderWidth
                let circleY = padding + borderWidth

                ctx.saveGState()
                ctx.setShadow(offset: CGSize(width: 0, height: 4), blur: 10, color: UIColor.black.withAlphaComponent(0.4).cgColor)

                let outerCircleRect = CGRect(x: circleX - borderWidth, y: circleY - borderWidth, width: circleSize + borderWidth * 2, height: circleSize + borderWidth * 2)
                let outerCirclePath = UIBezierPath(ovalIn: outerCircleRect)
                UIColor.white.setFill()
                outerCirclePath.fill()

                ctx.restoreGState()

                let innerCircleRect = CGRect(x: circleX, y: circleY, width: circleSize, height: circleSize)
                let innerCirclePath = UIBezierPath(ovalIn: innerCircleRect)

                ctx.saveGState()
                innerCirclePath.addClip()

                if let image = landmarkImage {
                    let imageRect = aspectFillRect(for: image.size, in: innerCircleRect)
                    image.draw(in: imageRect)
                } else {
                    let color = UIColor(Color(hex: landmark.category?.color ?? "#3B82F6"))
                    color.setFill()
                    UIRectFill(innerCircleRect)

                    let iconName = landmark.category?.icon ?? "mappin.circle.fill"
                    let symbolConfig = UIImage.SymbolConfiguration(pointSize: 40, weight: .medium)
                    if let symbolImage = UIImage(systemName: iconName, withConfiguration: symbolConfig)?.withTintColor(.white, renderingMode: .alwaysOriginal) {
                        let iconSize = CGSize(width: 50, height: 50)
                        let iconOrigin = CGPoint(x: circleX + (circleSize - iconSize.width) / 2, y: circleY + (circleSize - iconSize.height) / 2)
                        symbolImage.draw(in: CGRect(origin: iconOrigin, size: iconSize))
                    }
                }

                ctx.restoreGState()
            }
        }

        // Scales the image so it fills the target rect completely (like UIView contentMode = .scaleAspectFill)
        private func aspectFillRect(for imageSize: CGSize, in targetRect: CGRect) -> CGRect {
            let widthRatio = targetRect.width / imageSize.width
            let heightRatio = targetRect.height / imageSize.height
            let scale = max(widthRatio, heightRatio)

            let scaledWidth = imageSize.width * scale
            let scaledHeight = imageSize.height * scale

            let x = targetRect.origin.x - (scaledWidth - targetRect.width) / 2
            let y = targetRect.origin.y - (scaledHeight - targetRect.height) / 2

            return CGRect(x: x, y: y, width: scaledWidth, height: scaledHeight)
        }

        private func calculateBearing(from: CLLocation, to: CLLocation) -> Double {
            let lat1 = from.coordinate.latitude.degreesToRadians
            let lon1 = from.coordinate.longitude.degreesToRadians
            let lat2 = to.coordinate.latitude.degreesToRadians
            let lon2 = to.coordinate.longitude.degreesToRadians

            let dLon = lon2 - lon1

            let y = sin(dLon) * cos(lat2)
            let x = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dLon)

            return atan2(y, x)
        }

        // MARK: - Tap Handling

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let arView = gesture.view as? ARView else { return }
            let location = gesture.location(in: arView)

            print("Clicked at: \(location)")

            let hits = arView.hitTest(location)
            print("Hit count: \(hits.count)")

            if let firstHit = hits.first {
                let entityName = firstHit.entity.name
                print("Match object name: '\(entityName)'")

                print("Available landmarks: \(landmarks.map { $0.id })")

                if let landmark = landmarks.first(where: { $0.id == entityName }) {
                    print("Landmark found: \(landmark.name)")
                    DispatchQueue.main.async {
                        self.parent.selectedLandmark = landmark
                    }
                } else {
                    print("No landmark found for ID: \(entityName)")
                }
            } else {
                print("Click on empty area - clear selection and restart scanning")
                DispatchQueue.main.async {
                    self.parent.selectedLandmark = nil
                    self.parent.modeManager.recognizedLandmark = nil
                    self.parent.modeManager.statusMessage = "Searching for landmarks..."
                }
            }
        }
    }
}

// MARK: - Extensions

extension Double {
    var degreesToRadians: Double { self * .pi / 180 }
    var radiansToDegrees: Double { self * 180 / .pi }
}