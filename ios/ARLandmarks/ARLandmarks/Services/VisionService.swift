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
    
    // Maps ML model class names to Supabase landmark IDs
    private let classToLandmarkID: [String: String] = [
        "fraumunster": "c7642023-c860-4f5f-ba62-b9155d895bf3",
        "grossmunster": "40e604d8-4179-4521-ae27-3e2918689db2",
        "opera_house": "bc4b1e54-f6ab-470f-80e3-6be4c832f12f"
    ]
    
    init() {
        loadModel()
    }
    
    private func loadModel() {
        do {
            let config = MLModelConfiguration()
            let mlModel = try ZurichLandmarkClassifier(configuration: config).model
            model = try VNCoreMLModel(for: mlModel)
            print("✓ Vision Model loaded successfully")
        } catch {
            self.error = "Model konnte nicht geladen werden: \(error.localizedDescription)"
            print("⚠️ Vision Model loading failed: \(error.localizedDescription)")
        }
    }
    
    /// Klassifiziert Bild und gibt erkannten Landmark zurück
    func classifyImage(_ pixelBuffer: CVPixelBuffer) async -> RecognitionResult? {
        guard Date().timeIntervalSince(lastProcessingTime) >= minimumInterval else {
            return nil
        }
        lastProcessingTime = Date()
        
        guard let model = model else {
            // Kein Model geladen - Fallback
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
                      let topResult = results.first else {
                    continuation.resume(returning: nil)
                    return
                }

                // Debug: Print top 3 predictions
                let top3 = results.prefix(3)
                print("🔍 Vision predictions:")
                for (index, result) in top3.enumerated() {
                    let percent = Int(result.confidence * 100)
                    print("  \(index + 1). \(result.identifier): \(percent)%")
                }

                guard topResult.confidence > 0.75 else {
                    print("⚠️ Top result below threshold: \(Int(topResult.confidence * 100))% < 75%")
                    Task { @MainActor in
                        self.recognizedLandmark = nil
                        self.confidence = 0
                    }
                    continuation.resume(returning: nil)
                    return
                }
                
                let landmarkID = self.classToLandmarkID[topResult.identifier]
                let result = RecognitionResult(
                    identifier: topResult.identifier,
                    confidence: topResult.confidence,
                    landmarkID: landmarkID
                )

                print("✅ Recognized: \(topResult.identifier) (\(Int(topResult.confidence * 100))%) -> ID: \(landmarkID ?? "NOT_MAPPED")")

                Task { @MainActor in
                    self.recognizedLandmark = topResult.identifier
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
    
    /// Klassifiziert UIImage
    func classifyImage(_ image: UIImage) async -> RecognitionResult? {
        guard let cgImage = image.cgImage else { return nil }
        
        guard let model = model else { return nil }
        
        return await withCheckedContinuation { continuation in
            let request = VNCoreMLRequest(model: model) { request, error in
                guard let results = request.results as? [VNClassificationObservation],
                      let topResult = results.first else {
                    continuation.resume(returning: nil)
                    return
                }

                // Debug: Print predictions
                print("🔍 Vision (UIImage) predictions:")
                for (index, result) in results.prefix(3).enumerated() {
                    print("  \(index + 1). \(result.identifier): \(Int(result.confidence * 100))%")
                }

                guard topResult.confidence > 0.75 else {
                    print("⚠️ Below threshold: \(Int(topResult.confidence * 100))%")
                    continuation.resume(returning: nil)
                    return
                }

                let result = RecognitionResult(
                    identifier: topResult.identifier,
                    confidence: topResult.confidence,
                    landmarkID: self.classToLandmarkID[topResult.identifier]
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
