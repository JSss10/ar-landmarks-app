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

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)

        let config = ARWorldTrackingConfiguration()
        config.planeDetection = [.horizontal, .vertical]
        config.environmentTexturing = .automatic
        config.worldAlignment = .gravityAndHeading
        arView.session.run(config)

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
        context.coordinator.landmarks = landmarks
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

    class Coordinator: NSObject, CLLocationManagerDelegate {
        var parent: ARViewContainer
        var arView: ARView?
        var landmarks: [Landmark] = []
        var placedLandmarkIds: Set<String> = []

        private let locationManager = CLLocationManager()
        private var currentLocation: CLLocation?
        private var currentHeading: CLHeading?

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

        // MARK: - POI Management

        private func updatePOIs() {
            guard let arView = arView,
                  let userLocation = currentLocation else {
                print("Location unavailable")
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

            let color = UIColor(Color(hex: landmark.category?.color ?? "#3B82F6"))
            let sphere = MeshResource.generateSphere(radius: 0.15)
            let material = SimpleMaterial(color: color, roughness: 0.3, isMetallic: false)
            let sphereEntity = ModelEntity(mesh: sphere, materials: [material])

            sphereEntity.name = landmark.id
            sphereEntity.generateCollisionShapes(recursive: false)

            anchorEntity.addChild(sphereEntity)
            arView.scene.addAnchor(anchorEntity)

            print("POI created: \(landmark.name) at \(position) with ID \(landmark.id)")
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
                print("Click on empty area - deselect")
                DispatchQueue.main.async {
                    self.parent.selectedLandmark = nil
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
