# Landmark Recognition ML Training Pipeline

This directory contains the complete machine learning pipeline for training a visual landmark recognition model using Core ML for iOS deployment.

## Overview

The pipeline creates a MobileNetV3-based image classifier that can recognize Zurich landmarks in real-time through the camera feed. The model uses transfer learning for efficient training and is optimized for mobile deployment.

## Architecture

- **Model**: MobileNetV3-Small (optimized for mobile devices)
- **Training Method**: Transfer Learning with fine-tuning
- **Input**: 224x224 RGB images
- **Output**: Landmark classification with confidence scores
- **Deployment**: Core ML for iOS (iOS 15+)

## Prerequisites

### System Requirements

- Python 3.8 or later
- macOS (recommended for Core ML tools)
- 4GB+ RAM
- GPU optional (will train faster with CUDA)

### Installation

1. **Set up Python environment**:

```bash
cd ml_training
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:

```bash
pip install -r requirements.txt
```

3. **Configure environment variables**:

```bash
cp .env.example .env
# Edit .env and add your Supabase credentials
```

## Training Pipeline

### Step 1: Fetch Landmarks

Fetches all active landmarks from your Supabase database and creates a class mapping.

```bash
python scripts/fetch_landmarks.py
```

**Output**:
- `data/landmarks.json` - All landmark data
- `data/class_mapping.json` - Class names to landmark IDs

### Step 2: Download Training Images

Downloads training images from Wikimedia Commons for each landmark.

```bash
python scripts/download_images.py
```

**Output**:
- `data/train/` - Training images organized by class
- `data/validation/` - Validation images (20% split)

**Important Notes**:
- Downloads ~15 images per landmark automatically
- **Recommended**: Manually add 20-50 high-quality images per landmark for better accuracy
- Ensure diverse angles, lighting conditions, and seasons
- Remove low-quality or incorrect images

### Step 3: Train the Model

Trains the landmark recognition model using transfer learning.

```bash
python scripts/train_model.py
```

**Configuration** (edit in script if needed):
- Epochs: 25
- Batch size: 32
- Learning rate: 0.001
- Optimizer: Adam with ReduceLROnPlateau scheduler

**Output**:
- `models/best_model.pth` - Best model checkpoint
- `models/landmark_model_final.pth` - Final model
- `models/training_history.json` - Training metrics
- `data/pytorch_class_mapping.json` - PyTorch class indices

**Training Tips**:
- Monitor validation accuracy - should reach 70%+ for good results
- If overfitting (train acc >> val acc), add more data or increase dropout
- Training takes ~30-60 minutes on CPU, ~10-20 minutes on GPU

### Step 4: Convert to Core ML

Converts the trained PyTorch model to Core ML format for iOS deployment.

```bash
python scripts/convert_to_coreml.py
```

**Output**:
- `models/ZurichLandmarkClassifier.mlmodel` - Core ML model
- `models/class_mapping_swift.json` - Class to landmark ID mapping for Swift

### Step 5: Deploy to iOS

Copy the model to your Xcode project:

```bash
./scripts/copy_model_to_xcode.sh
```

Then update `VisionService.swift`:

1. **Add the class mapping** (use the generated mapping from `class_mapping_swift.json`):

```swift
private let classToLandmarkID: [String: String] = [
    "fraumunster": "landmark-id-1",
    "grossmunster": "landmark-id-2",
    // ... add all landmarks
]
```

2. **Uncomment the model loading code** in `loadModel()`:

```swift
private func loadModel() {
    do {
        let config = MLModelConfiguration()
        let mlModel = try ZurichLandmarkClassifier(configuration: config).model
        model = try VNCoreMLModel(for: mlModel)
        print("Vision Model loaded")
    } catch {
        self.error = "Model could not be loaded: \(error.localizedDescription)"
    }
}
```

3. **Build and run** your iOS app!

## Directory Structure

```
ml_training/
├── scripts/
│   ├── fetch_landmarks.py          # Fetch landmarks from Supabase
│   ├── download_images.py          # Download training images
│   ├── train_model.py              # Train the model
│   ├── convert_to_coreml.py        # Convert to Core ML
│   └── copy_model_to_xcode.sh      # Copy model to Xcode
├── data/
│   ├── landmarks.json              # Landmark data
│   ├── class_mapping.json          # Class to landmark mapping
│   ├── train/                      # Training images
│   │   ├── landmark_1/
│   │   ├── landmark_2/
│   │   └── ...
│   └── validation/                 # Validation images
│       ├── landmark_1/
│       └── ...
├── models/
│   ├── best_model.pth              # Best PyTorch model
│   ├── ZurichLandmarkClassifier.mlmodel  # Core ML model
│   └── training_history.json       # Training metrics
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## Improving Model Accuracy

### 1. Collect More Training Data

- **Minimum**: 15-20 images per landmark
- **Recommended**: 30-50 images per landmark
- **Ideal**: 100+ images per landmark

**Image Sources**:
- Wikimedia Commons (already automated)
- Google Images (manual download)
- Flickr Creative Commons
- Your own photos

**Image Quality Guidelines**:
- Different times of day (morning, afternoon, evening)
- Different weather conditions (sunny, cloudy, rain)
- Different seasons (if applicable)
- Different angles and distances
- Different crowd levels
- Good resolution (min 300x300px)

### 2. Data Augmentation

The training script already includes:
- Random horizontal flips
- Random rotations (±15°)
- Color jittering (brightness, contrast)

You can add more augmentations in `train_model.py`:
- Random crops
- Perspective transforms
- Gaussian blur

### 3. Hyperparameter Tuning

Edit `train_model.py` to adjust:
- **Epochs**: Increase to 30-40 for more training
- **Batch size**: Decrease to 16 if OOM, increase to 64 if you have GPU memory
- **Learning rate**: Try 0.0001 for slower, more stable learning
- **Dropout**: Increase to 0.3-0.4 to reduce overfitting

### 4. Model Architecture

Try different MobileNet variants in `train_model.py`:
- `mobilenet_v3_large` - More accurate but larger
- `efficientnet_b0` - Better accuracy/size tradeoff

### 5. Class Balancing

Ensure each landmark has roughly the same number of images. If some landmarks have very few images:
- Collect more images for those landmarks
- Use weighted loss (add to `train_model.py`)
- Remove landmarks with <10 images

## Troubleshooting

### Low Accuracy (<50%)

- **Cause**: Not enough training data
- **Solution**: Add more images (30+ per landmark)

### Model Not Loading in iOS

- **Cause**: Model file not in Xcode project
- **Solution**: Run `copy_model_to_xcode.sh` and add to Xcode

### Out of Memory During Training

- **Cause**: Batch size too large
- **Solution**: Reduce `BATCH_SIZE` to 16 or 8

### Poor Recognition in Real World

- **Cause**: Training data doesn't match real-world conditions
- **Solution**: Add photos taken with iPhone camera in various conditions

### Classes Not Recognized

- **Cause**: Class mapping mismatch
- **Solution**: Verify `classToLandmarkID` in VisionService.swift matches the generated mapping

## Model Performance

Expected performance metrics:
- **Training Accuracy**: 85-95%
- **Validation Accuracy**: 70-85%
- **Inference Time**: <50ms on iPhone (using Neural Engine)
- **Model Size**: ~2-5 MB

## Advanced Usage

### Fine-tuning the Model

To continue training from a checkpoint:

```python
# In train_model.py, before training:
classifier.load_model('ml_training/models/best_model.pth')
classifier.train(epochs=10, learning_rate=0.0001)
```

### Exporting Class Probabilities

The model outputs probabilities for all classes. You can use this in your app:

```swift
// In VisionService.swift
guard let results = request.results as? [VNClassificationObservation] else { return }

// Get top 3 predictions
let top3 = results.prefix(3).map { ($0.identifier, $0.confidence) }
```

### Quantization for Smaller Model

To reduce model size (at slight accuracy cost):

```python
# In convert_to_coreml.py, after conversion:
from coremltools.models.neural_network import quantization_utils

mlmodel = quantization_utils.quantize_weights(mlmodel, nbits=8)
```

## License

MIT License - See main project LICENSE file

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review training logs in `models/training_history.json`
3. Open an issue on the main project repository
