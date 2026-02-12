#!/bin/bash
# Copy the trained Core ML model to the Xcode project

set -e

# Auto-detect paths based on current directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ML_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$ML_DIR")"

MODEL_PACKAGE="$ML_DIR/models/LandmarkClassifier.mlpackage"
XCODE_MODELS_DIR="$PROJECT_DIR/ios/ARLandmarks/ARLandmarks/Models"

# Check if model exists
if [ ! -d "$MODEL_PACKAGE" ]; then
    echo "Error: Model not found at $MODEL_PACKAGE"
    echo "Run the training pipeline first:"
    echo "  1. python scripts/train_model.py"
    echo "  2. python scripts/convert_to_coreml.py"
    exit 1
fi

# Create models directory if it doesn't exist
mkdir -p "$XCODE_MODELS_DIR"

# Copy model package (it's a directory)
echo "Copying model to Xcode project..."
rm -rf "$XCODE_MODELS_DIR/LandmarkClassifier.mlpackage"
cp -R "$MODEL_PACKAGE" "$XCODE_MODELS_DIR/"

echo "✓ Model copied to $XCODE_MODELS_DIR/LandmarkClassifier.mlpackage"
echo ""
echo "Next steps:"
echo "  1. Open your Xcode project"
echo "  2. Add the model file to your project (if not already added)"
echo "  3. Build and run!"