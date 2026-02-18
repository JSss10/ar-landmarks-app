//
//  ARModeManager.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import SwiftUI
import Combine
import CoreLocation

@MainActor
class ARModeManager: ObservableObject {
    
    // MARK: - AR Mode
    
    enum ARMode: String, CaseIterable {
        case visualRecognition = "Visual Recognition"
        case geoBased = "Geo-based POIs"
        
        var icon: String {
            switch self {
            case .visualRecognition: return "arkit"
            case .geoBased: return "location.viewfinder"
            }
        }
        
        var description: String {
            switch self {
            case .visualRecognition:
                return "Point the camera at a landmark"
            case .geoBased:
                return "Shows nearby POIs based on GPS"
            }
        }
    }
    
    // MARK: - Published Properties
    
    @Published var currentMode: ARMode = .visualRecognition
    @Published var recognizedLandmark: Landmark?
    @Published var nearbyLandmarks: [Landmark] = []
    @Published var weather: Weather?
    @Published var isLoading: Bool = false
    @Published var statusMessage: String = "Ready"
    
    // MARK: - Services
    
    let locationService = LocationService()
    let visionService = VisionService()
    private let weatherService = WeatherService.shared
    
    // MARK: - Settings
    
    /// Maximum distance for Geo-POIs in meters
    let maxPOIDistance: Double = 2000
    
    /// Time without recognition before the overlay is hidden
    let recognitionTimeout: TimeInterval = 0.5
    
    private var lastRecognitionTime: Date = Date()
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    
    init() {
        setupBindings()
    }
    
    private func setupBindings() {
        locationService.$currentLocation
            .compactMap { $0 }
            .debounce(for: .seconds(1), scheduler: DispatchQueue.main)
            .sink { [weak self] location in
                self?.updateNearbyLandmarks()
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Public Methods
    
    func startSession() {
        locationService.requestPermission()
        fetchWeather()
    }
    
    func stopSession() {
        locationService.stopUpdating()
    }
    
    func handleRecognition(_ result: RecognitionResult, landmarks: [Landmark]) {
        lastRecognitionTime = Date()

        if currentMode != .visualRecognition {
            currentMode = .visualRecognition
        }

        if let landmarkID = result.landmarkID {
            print("🔎 Looking for landmark ID: \(landmarkID) in \(landmarks.count) landmarks")
            if let landmark = landmarks.first(where: { $0.id == landmarkID }) {
                recognizedLandmark = landmark
                statusMessage = "\(landmark.name) recognized (\(result.confidencePercent)%)"
                print("✅ Found and set recognizedLandmark: \(landmark.name)")
            } else {
                print("❌ Landmark ID not found in landmarks array!")
                // Try matching by name as fallback
                let searchName = result.identifier.replacingOccurrences(of: "_", with: " ")
                if let landmark = landmarks.first(where: { $0.name.lowercased().contains(searchName.lowercased()) }) {
                    recognizedLandmark = landmark
                    statusMessage = "\(landmark.name) recognized (\(result.confidencePercent)%)"
                    print("✅ Found by name match: \(landmark.name)")
                } else {
                    print("❌ No match by name either for: \(searchName)")
                }
            }
        }
    }
    
    func handleNoRecognition() {
        let timeSinceLastRecognition = Date().timeIntervalSince(lastRecognitionTime)

        if timeSinceLastRecognition > recognitionTimeout && currentMode == .visualRecognition && recognizedLandmark != nil {
            recognizedLandmark = nil
            statusMessage = "Searching for landmarks..."
        }
    }
    
    func switchToGeoMode() {
        currentMode = .geoBased
        recognizedLandmark = nil
        statusMessage = "Geo-Mode active"
        updateNearbyLandmarks()
    }
    
    func switchToVisualMode() {
        currentMode = .visualRecognition
        recognizedLandmark = nil
        lastRecognitionTime = Date()
        statusMessage = "Searching for landmarks..."
    }
    
    func updateNearbyLandmarks(allLandmarks: [Landmark] = []) {
        guard let location = locationService.currentLocation else { return }
        
        nearbyLandmarks = allLandmarks
            .filter { landmark in
                let landmarkLocation = CLLocation(
                    latitude: landmark.latitude,
                    longitude: landmark.longitude
                )
                return location.distance(from: landmarkLocation) <= maxPOIDistance
            }
            .sorted { landmark1, landmark2 in
                let loc1 = CLLocation(latitude: landmark1.latitude, longitude: landmark1.longitude)
                let loc2 = CLLocation(latitude: landmark2.latitude, longitude: landmark2.longitude)
                return location.distance(from: loc1) < location.distance(from: loc2)
            }
    }
    
    /// Fetches current weather for Zurich and stores it in the weather property
    func fetchWeather() {
        Task {
            do {
                let fetchedWeather = try await weatherService.fetchZurichWeather()
                self.weather = fetchedWeather
            } catch {
                print("Weather error: \(error.localizedDescription)")
            }
        }
    }
}