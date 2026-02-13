# Landmark Recognition ML Training Pipeline

This directory contains the complete machine learning pipeline for training a visual landmark recognition model using Core ML for iOS deployment.

## Overview

The pipeline creates a MobileNetV3-based image classifier that can recognize landmarks in real-time through the camera feed. The model uses transfer learning for efficient training and is optimized for mobile deployment.

## Architecture

- **Model**: MobileNetV3-Small (optimized for mobile devices)
- **Training Method**: Transfer Learning with fine-tuning
- **Input**: 224x224 RGB images
- **Output**: Landmark classification with confidence scores
- **Deployment**: Core ML for iOS (iOS 15+)

## Prerequisites

- Python 3.8 or later
- macOS (recommended for Core ML tools)
- 4GB+ RAM
- GPU optional (will train faster with CUDA)

## Quick Start

### 1. Setup

```bash
cd ml_training
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your SUPABASE_URL and SUPABASE_ANON_KEY
```

### 2. Run the Full Pipeline

```bash
./train_pipeline.sh
```

This will:
1. Fetch landmarks from your database
2. Pause for you to place training images
3. Train the model
4. Convert to Core ML format
5. Copy to Xcode project
6. Update VisionService.swift

### 3. Manual Step-by-Step

```bash
# 1. Fetch landmarks
python scripts/fetch_landmarks.py

# 2. Collect images manually (20-50 per landmark)
#    Place in ml_training/data/train/<landmark_name>/

# 3. Train model
python scripts/train_model.py

# 4. Convert to Core ML
python scripts/convert_to_coreml.py

# 5. Copy to Xcode
./scripts/copy_model_to_xcode.sh

# 6. Update VisionService
python scripts/update_vision_service.py
```

### 4. Verify in Xcode

1. Open `ios/ARLandmarks/ARLandmarks.xcodeproj`
2. Check that `Models/LandmarkClassifier.mlpackage` exists
3. Build and run

## Image Collection

### Requirements

- **Minimum**: 15 images per landmark
- **Recommended**: 20-30 images per landmark
- **Ideal**: 50+ images per landmark

### Image Sources

- **Google Images** (fastest): Search for `"Landmark Name Zurich"`
- **Flickr Creative Commons**: Higher quality, properly licensed
- **Unsplash / Pexels**: Professional quality, free to use
- **Your own photos** (best results!): Exactly matches real-world usage

### Folder Structure

```
ml_training/data/train/
├── grossmunster/
│   ├── grossmunster_001.jpg
│   ├── grossmunster_002.jpg
│   └── ... (20-50 images)
├── fraumunster/
│   ├── fraumunster_001.jpg
│   └── ...
└── ... (all other landmarks)
```

### Image Quality Guidelines

- Different angles (front, side, corner)
- Different distances (close-up, medium, far)
- Different times of day and weather
- Good resolution (min 300x300px)
- Landmark is the primary subject
- Clear, focused images (avoid blurry/dark)

### Suggested Starting Landmarks

| Landmark | Folder Name | Google Search Term |
|----------|-------------|-------------------|
| Grossmunster | `grossmunster` | "Grossmunster Zurich" |
| Fraumunster | `fraumunster` | "Fraumunster Zurich" |
| Opera House | `opera_house` | "Zurich Opera House" |
| Bahnhofstrasse | `bahnhofstrasse` | "Bahnhofstrasse Zurich" |
| ETH Zurich | `eth_zurich` | "ETH Zurich main building" |
| National Museum | `national_museum` | "Swiss National Museum Zurich" |

### Verify Images

```bash
cd ml_training/data/train
for dir in */; do
  count=$(ls "$dir"*.jpg "$dir"*.png 2>/dev/null | wc -l)
  echo "$dir: $count images"
done
```

## Directory Structure

```
ml_training/
├── scripts/
│   ├── fetch_landmarks.py          # Fetch landmarks from Supabase
│   ├── train_model.py              # Train the model
│   ├── convert_to_coreml.py        # Convert to Core ML
│   ├── copy_model_to_xcode.sh      # Copy model to Xcode
│   └── update_vision_service.py    # Update iOS VisionService
├── data/
│   ├── landmarks.json              # Landmark data (generated)
│   ├── class_mapping.json          # Class to landmark mapping (generated)
│   └── train/                      # Training images (you add these)
│       ├── landmark_1/
│       └── ...
├── models/
│   ├── best_model.pth              # Best PyTorch model (generated)
│   ├── LandmarkClassifier.mlpackage # Core ML model (generated)
│   └── training_history.json       # Training metrics (generated)
├── requirements.txt
├── train_pipeline.sh               # Full pipeline script
├── .env.example
└── README.md
```

## Training Configuration

Edit `scripts/train_model.py` to adjust:

| Parameter | Default | Description |
|-----------|---------|-------------|
| Epochs | 25 | Training iterations |
| Batch size | 32 | Decrease to 16 if OOM |
| Learning rate | 0.001 | Try 0.0001 for slower learning |
| Dropout | 0.2 | Increase to 0.3-0.4 to reduce overfitting |

## Testing

### Screen-Based Testing (Recommended First)

1. Find reference images for each landmark online
2. Display images full-screen on a monitor/TV
3. Build and run the iOS app
4. Enable "Visual Recognition" mode
5. Point iPhone camera at screen (30-60cm distance)
6. Check for recognition (should appear within 1-2 seconds)

**Screen testing tips:**
- Set screen brightness to 80-100%
- Hold phone steady for 2-3 seconds
- Test from 30-60cm distance
- Aim for confidence score > 0.75

### Real-World Testing

Once screen testing shows 80%+ recognition:

1. Visit actual landmarks
2. Test from different distances (5m, 20m, 50m)
3. Try different angles and lighting
4. Document failures and add those cases to training data

### Confidence Threshold

Adjust in `VisionService.swift`:

```swift
private let minimumConfidence: Float = 0.75  // Try: 0.70, 0.65, 0.80
```

## Improving Model Accuracy

1. **More data**: Add more diverse images per landmark
2. **Own photos**: Take iPhone photos at actual locations
3. **Data augmentation**: Already included (flips, rotations, color jitter)
4. **Hyperparameter tuning**: Adjust epochs, learning rate, dropout
5. **Model architecture**: Try `mobilenet_v3_large` or `efficientnet_b0` for better accuracy
6. **Class balancing**: Ensure similar image counts across landmarks

## Expected Performance

| Metric | Expected |
|--------|----------|
| Training Accuracy | 85-95% |
| Validation Accuracy | 70-85% |
| Inference Time | <50ms on iPhone |
| Model Size | ~2-5 MB |

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Low accuracy (<50%) | Not enough training data | Add more images (30+ per landmark) |
| Model not loading in iOS | Model file not in Xcode project | Run `copy_model_to_xcode.sh` |
| Out of memory during training | Batch size too large | Reduce `BATCH_SIZE` to 16 or 8 |
| Poor real-world recognition | Training data doesn't match real conditions | Add iPhone photos from actual locations |
| Classes not recognized | Class mapping mismatch | Verify mapping in VisionService.swift |
| SUPABASE_URL not found | Missing .env file | Copy .env.example to .env and fill in values |

## License

MIT License - See main project LICENSE file
