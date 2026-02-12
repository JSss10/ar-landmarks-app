//
//  VisionService.swift
//  ARLandmarks
//
//  Created by Jessica Schneiter on 17.01.2026.
//

import Vision
import CoreML
import UIKit
import Combine

@MainActor
class VisionService: ObservableObject {
    @Published var recognizedLandmark: String?
    @Published var confidence: Float = 0
    @Published var isProcessing: Bool = false
    @Published var error: String?
    
    private var model: VNCoreMLModel?
    private var lastProcessingTime: Date = .distantPast
    private let minimumInterval: TimeInterval = 0.5
    
    private let classToLandmarkID: [String: String] = [
        "fraumunster": "36fffbdf-f13f-4001-8e85-dae9ed6c206d",
        "grossmunster": "1668b72b-3d97-4490-9d92-c8b4ef4af604",
        "opera_house": "d0d0316b-980d-430a-8c4c-2ca830182838"
    ]
    
    init() {
        loadModel()
    }
    
    private func loadModel() {
        do {
            let config = MLModelConfiguration()
            let mlModel = try LandmarkClassifier(configuration: config).model
            model = try VNCoreMLModel(for: mlModel)
            print("✓ Vision Model loaded successfully")
        } catch {
            self.error = "Model could not be loaded: \(error.localizedDescription)"
            print("⚠️ Vision Model loading failed: \(error.localizedDescription)")
        }
    }

    private func softmax(_ values: [Float]) -> [Float] {
        let maxVal = values.max() ?? 0
        let expValues = values.map { exp($0 - maxVal) }
        let sumExp = expValues.reduce(0, +)
        return expValues.map { $0 / sumExp }
    }
    
    func classifyImage(_ pixelBuffer: CVPixelBuffer) async -> RecognitionResult? {
        guard Date().timeIntervalSince(lastProcessingTime) >= minimumInterval else {
            return nil
        }
        lastProcessingTime = Date()
        
        guard let model = model else {
            return nil
        }
        
        isProcessing = true
        defer { isProcessing = false }
        
        return await withCheckedContinuation { continuation in
            let request = VNCoreMLRequest(model: model) { [weak self] request, error in
                guard let self = self else {
                    continuation.resume(returning: nil)
                    return
                }
                
                if let error = error {
                    Task { @MainActor in
                        self.error = error.localizedDescription
                    }
                    continuation.resume(returning: nil)
                    return
                }
                
                guard let results = request.results as? [VNClassificationObservation],
                      !results.isEmpty else {
                    continuation.resume(returning: nil)
                    return
                }

                let rawConfidences = results.map { $0.confidence }
                let normalizedConfidences = self.softmax(rawConfidences)

                let normalizedResults = zip(results, normalizedConfidences)
                    .map { (observation: $0.0, confidence: $0.1) }
                    .sorted { $0.confidence > $1.confidence }

                guard let topResult = normalizedResults.first else {
                    continuation.resume(returning: nil)
                    return
                }

                print("🔍 Vision predictions:")
                for (index, item) in normalizedResults.prefix(3).enumerated() {
                    let percent = Int(item.confidence * 100)
                    print("  \(index + 1). \(item.observation.identifier): \(percent)%")
                }

                guard topResult.confidence > 0.90 else {
                    print("Top result below threshold: \(Int(topResult.confidence * 100))% < 90%")
                    Task { @MainActor in
                        self.recognizedLandmark = nil
                        self.confidence = 0
                    }
                    continuation.resume(returning: nil)
                    return
                }

                let landmarkID = self.classToLandmarkID[topResult.observation.identifier]
                let result = RecognitionResult(
                    identifier: topResult.observation.identifier,
                    confidence: topResult.confidence,
                    landmarkID: landmarkID
                )

                print("✅ Recognized: \(topResult.observation.identifier) (\(Int(topResult.confidence * 100))%) -> ID: \(landmarkID ?? "NOT_MAPPED")")

                Task { @MainActor in
                    self.recognizedLandmark = topResult.observation.identifier
                    self.confidence = topResult.confidence
                }

                continuation.resume(returning: result)
            }
            
            request.imageCropAndScaleOption = .centerCrop
            
            let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up)
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(returning: nil)
            }
        }
    }

    func classifyImage(_ image: UIImage) async -> RecognitionResult? {
        guard let cgImage = image.cgImage else { return nil }

        guard let model = model else { return nil }

        return await withCheckedContinuation { continuation in
            let request = VNCoreMLRequest(model: model) { [weak self] request, error in
                guard let self = self,
                      let results = request.results as? [VNClassificationObservation],
                      !results.isEmpty else {
                    continuation.resume(returning: nil)
                    return
                }

                let rawConfidences = results.map { $0.confidence }
                let normalizedConfidences = self.softmax(rawConfidences)

                let normalizedResults = zip(results, normalizedConfidences)
                    .map { (observation: $0.0, confidence: $0.1) }
                    .sorted { $0.confidence > $1.confidence }

                guard let topResult = normalizedResults.first else {
                    continuation.resume(returning: nil)
                    return
                }

                print("🔍 Vision (UIImage) predictions:")
                for (index, item) in normalizedResults.prefix(3).enumerated() {
                    print("  \(index + 1). \(item.observation.identifier): \(Int(item.confidence * 100))%")
                }

                guard topResult.confidence > 0.90 else {
                    print("Below threshold: \(Int(topResult.confidence * 100))%")
                    continuation.resume(returning: nil)
                    return
                }

                let result = RecognitionResult(
                    identifier: topResult.observation.identifier,
                    confidence: topResult.confidence,
                    landmarkID: self.classToLandmarkID[topResult.observation.identifier]
                )
                continuation.resume(returning: result)
            }
            
            let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up)
            try? handler.perform([request])
        }
    }
}

// MARK: - Recognition Result

struct RecognitionResult: Equatable {
    let identifier: String
    let confidence: Float
    let landmarkID: String?
    
    var confidencePercent: Int {
        Int(confidence * 100)
    }
}