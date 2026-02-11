#!/bin/bash
# Complete ML training pipeline - runs all steps in sequence

set -e  # Exit on error

echo "=========================================="
echo "Landmark Recognition Training Pipeline"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f "ml_training/.env" ]; then
    echo "Error: .env file not found"
    echo "Please copy .env.example to .env and fill in your Supabase credentials"
    exit 1
fi

# Check if venv exists
if [ ! -d "ml_training/venv" ]; then
    echo "Creating Python virtual environment..."
    cd ml_training
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    echo "✓ Virtual environment created and dependencies installed"
    echo ""
else
    echo "Activating virtual environment..."
    source ml_training/venv/bin/activate
    echo "✓ Virtual environment activated"
    echo ""
fi

# Step 1: Fetch landmarks
echo "=========================================="
echo "Step 1/5: Fetching landmarks from Supabase"
echo "=========================================="
python ml_training/scripts/fetch_landmarks.py
echo ""

# Check for training images
echo "=========================================="
echo "IMPORTANT: Training Images Required"
echo "=========================================="
echo "Please ensure you have placed training images in ml_training/data/train/"
echo ""
echo "Requirements:"
echo "  1. 20-50 images per landmark in ml_training/data/train/<landmark_name>/"
echo "  2. Diverse angles, lighting, and conditions"
echo "  3. Good quality (min 300x300px)"
echo ""
echo "See MANUAL_IMAGE_COLLECTION.md for detailed instructions."
echo ""
read -p "Press ENTER when your images are ready (or Ctrl+C to exit)..."
echo ""

# Step 2: Train model
echo "=========================================="
echo "Step 2/5: Training the model"
echo "=========================================="
echo "This will take 30-60 minutes..."
python ml_training/scripts/train_model.py
echo ""

# Step 3: Convert to Core ML
echo "=========================================="
echo "Step 3/5: Converting to Core ML format"
echo "=========================================="
python ml_training/scripts/convert_to_coreml.py
echo ""

# Step 4: Copy to Xcode
echo "=========================================="
echo "Step 4/5: Copying model to Xcode project"
echo "=========================================="
./ml_training/scripts/copy_model_to_xcode.sh
echo ""

# Step 5: Update VisionService
echo "=========================================="
echo "Step 5/5: Updating VisionService.swift"
echo "=========================================="
python ml_training/scripts/update_vision_service.py
echo ""

# Final summary
echo "=========================================="
echo "🎉 Training Pipeline Complete!"
echo "=========================================="
echo ""
echo "Your landmark recognition model is ready!"
echo ""
echo "Next steps:"
echo "  1. Open your Xcode project"
echo "  2. Verify ZurichLandmarkClassifier.mlmodel is in the project"
echo "  3. Build and run the app"
echo "  4. Point your camera at a landmark to test recognition"
echo ""
echo "Model location:"
echo "  iOS: ios/ARLandmarks/ARLandmarks/Models/ZurichLandmarkClassifier.mlmodel"
echo ""
echo "Troubleshooting:"
echo "  - If model doesn't load: Check Xcode build settings"
echo "  - If accuracy is low: Add more training images"
echo "  - For help: See ml_training/README.md"
echo ""
echo "=========================================="
