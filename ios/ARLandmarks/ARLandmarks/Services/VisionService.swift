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
        "opernhaus": "7506e475-2e94-4e46-a0b3-06fe6d9cc6ab",
    ]
    
    init() {
        loadModel()
    }
    
    private func loadModel() {
        /*
        do {
            let config = MLModelConfiguration()
            let mlModel = try ZurichLandmarkClassifier(configuration: config).model
            model = try VNCoreMLModel(for: mlModel)
            print("Vision Model loaded")
        } catch {
            self.error = "Model could not be loaded: \(error.localizedDescription)"
        }
        */
        print("Vision Model: Waiting for trained Create ML Model")
        model = nil
    }
    
    /// Classifies image and returns recognized landmark
    func classifyImage(_ pixelBuffer: CVPixelBuffer) async -> RecognitionResult? {
        guard Date().timeIntervalSince(lastProcessingTime) >= minimumInterval else {
            return nil
        }
        lastProcessingTime = Date()
        
        guard let model = model else {
            // No model loaded - Fallback
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
                      let topResult = results.first,
                      topResult.confidence > 0.75 else {
                    Task { @MainActor in
                        self.recognizedLandmark = nil
                        self.confidence = 0
                    }
                    continuation.resume(returning: nil)
                    return
                }
                
                let result = RecognitionResult(
                    identifier: topResult.identifier,
                    confidence: topResult.confidence,
                    landmarkID: self.classToLandmarkID[topResult.identifier]
                )
                
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
    
    /// Classifies UIImage
    func classifyImage(_ image: UIImage) async -> RecognitionResult? {
        guard let cgImage = image.cgImage else { return nil }
        
        guard let model = model else { return nil }
        
        return await withCheckedContinuation { continuation in
            let request = VNCoreMLRequest(model: model) { request, error in
                guard let results = request.results as? [VNClassificationObservation],
                      let topResult = results.first,
                      topResult.confidence > 0.75 else {
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
