#!/bin/bash
# Copy the trained Core ML model to the Xcode project

set -e

# Paths
MODEL_FILE="ml_training/models/ZurichLandmarkClassifier.mlmodel"
XCODE_MODELS_DIR="ios/ARLandmarks/ARLandmarks/Models"

# Check if model exists
if [ ! -f "$MODEL_FILE" ]; then
    echo "Error: Model file not found at $MODEL_FILE"
    echo "Run the training pipeline first:"
    echo "  1. python scripts/fetch_landmarks.py"
    echo "  2. python scripts/download_images.py"
    echo "  3. python scripts/train_model.py"
    echo "  4. python scripts/convert_to_coreml.py"
    exit 1
fi

# Create models directory if it doesn't exist
mkdir -p "$XCODE_MODELS_DIR"

# Copy model
echo "Copying model to Xcode project..."
cp "$MODEL_FILE" "$XCODE_MODELS_DIR/"

echo "✓ Model copied to $XCODE_MODELS_DIR/ZurichLandmarkClassifier.mlmodel"
echo ""
echo "Next steps:"
echo "  1. Open your Xcode project"
echo "  2. Add the model file to your project (if not already added)"
echo "  3. Update VisionService.swift with the class-to-landmark mapping"
echo "  4. Uncomment the model loading code in VisionService.swift"
echo "  5. Build and run!"
