#!/usr/bin/env python3
"""
Convert the trained PyTorch model to Core ML format for iOS deployment.
"""
import json
import sys
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models
import coremltools as ct
from PIL import Image


def load_pytorch_model(model_path, num_classes):
    """Load the trained PyTorch model."""
    print(f"Loading PyTorch model from {model_path}...")

    # Recreate model architecture
    model = models.mobilenet_v3_small(pretrained=False)

    # Replace classifier (same as training)
    num_features = model.classifier[0].in_features
    model.classifier = nn.Sequential(
        nn.Linear(num_features, 256),
        nn.Hardswish(),
        nn.Dropout(0.2),
        nn.Linear(256, num_classes)
    )

    # Load weights
    checkpoint = torch.load(model_path, map_location='cpu')
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    print(f"✓ Model loaded successfully")
    print(f"  Number of classes: {num_classes}")

    return model, checkpoint


def convert_to_coreml(pytorch_model, class_labels, output_path=None):
    """Convert PyTorch model to Core ML format."""
    print("\nConverting to Core ML format...")

    # Auto-detect output path
    if output_path is None:
        if Path('models').exists() or Path('.').resolve().name == 'ml_training':
            output_path = 'models/LandmarkClassifier.mlpackage'
        else:
            output_path = 'ml_training/models/LandmarkClassifier.mlpackage'

    # Define input shape (batch=1, channels=3, height=224, width=224)
    example_input = torch.rand(1, 3, 224, 224)

    # Trace the model
    print("  Tracing model...")
    traced_model = torch.jit.trace(pytorch_model, example_input)

    # Convert to Core ML
    print("  Converting to Core ML...")
    mlmodel = ct.convert(
        traced_model,
        inputs=[ct.ImageType(
            name="image",
            shape=example_input.shape,
            scale=1/255.0,  # Normalize to [0, 1]
            bias=[0, 0, 0]
        )],
        classifier_config=ct.ClassifierConfig(class_labels),
        minimum_deployment_target=ct.target.iOS15,
        compute_units=ct.ComputeUnit.ALL  # Use Neural Engine when available
    )

    # Add metadata
    mlmodel.author = 'ARLandmarks ML Pipeline'
    mlmodel.short_description = 'AR Landmarks Recognition Model'
    mlmodel.version = '1.0'
    mlmodel.license = 'MIT'

    # Add input/output descriptions
    mlmodel.input_description['image'] = 'Input image of a landmark (224x224 RGB)'

    # Try to add output descriptions (names may vary)
    try:
        if 'classLabel' in mlmodel.output_description:
            mlmodel.output_description['classLabel'] = 'Predicted landmark class'
        if 'classLabelProbs' in mlmodel.output_description:
            mlmodel.output_description['classLabelProbs'] = 'Confidence scores for each landmark'
    except:
        pass  # Output names may vary, skip if not found

    # Save model
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    mlmodel.save(str(output_path))

    print(f"✓ Core ML model saved to {output_path}")

    # Print model info
    print(f"\nModel Information:")
    print(f"  Input: {mlmodel.input_description}")
    print(f"  Output: {mlmodel.output_description}")
    print(f"  Classes: {len(class_labels)}")

    return mlmodel, output_path


def create_class_mapping_for_swift(class_to_idx, output_path=None):
    """Create a mapping file that can be used in Swift code."""
    # Auto-detect paths
    if output_path is None:
        if Path('models').exists() or Path('.').resolve().name == 'ml_training':
            output_path = 'models/class_mapping_swift.json'
        else:
            output_path = 'ml_training/models/class_mapping_swift.json'

    # Auto-detect original mapping path
    if Path('data/class_mapping.json').exists():
        original_mapping_path = Path('data/class_mapping.json')
    else:
        original_mapping_path = Path('ml_training/data/class_mapping.json')

    if not original_mapping_path.exists():
        print("Warning: Original class mapping not found")
        return

    with open(original_mapping_path, 'r', encoding='utf-8') as f:
        original_mapping = json.load(f)

    # Create reverse mapping: class_name -> landmark_id
    swift_mapping = {}
    for class_name, info in original_mapping.items():
        swift_mapping[class_name] = info['id']

    # Save for Swift integration
    output_path = Path(output_path)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(swift_mapping, f, indent=2)

    print(f"✓ Swift class mapping saved to {output_path}")
    print(f"\nYou can use this mapping in VisionService.swift:")
    print(f"  private let classToLandmarkID: [String: String] = [")
    for class_name, landmark_id in list(swift_mapping.items())[:3]:
        print(f'    "{class_name}": "{landmark_id}",')
    print(f"    ... ({len(swift_mapping)} total)")
    print(f"  ]")

    return swift_mapping


def main():
    print("="*60)
    print("PyTorch to Core ML Converter")
    print("="*60)

    # Auto-detect paths based on current directory
    if Path('models/best_model.pth').exists():
        MODEL_PATH = Path('models/best_model.pth')
        CLASS_MAPPING_PATH = Path('data/pytorch_class_mapping.json')
        OUTPUT_PATH = Path('models/LandmarkClassifier.mlpackage')
    else:
        MODEL_PATH = Path('ml_training/models/best_model.pth')
        CLASS_MAPPING_PATH = Path('ml_training/data/pytorch_class_mapping.json')
        OUTPUT_PATH = Path('ml_training/models/LandmarkClassifier.mlpackage')

    # Check if files exist
    if not MODEL_PATH.exists():
        print(f"Error: Model not found at {MODEL_PATH}")
        print("Run 'python scripts/train_model.py' first")
        sys.exit(1)

    if not CLASS_MAPPING_PATH.exists():
        print(f"Error: Class mapping not found at {CLASS_MAPPING_PATH}")
        sys.exit(1)

    # Load class mapping
    with open(CLASS_MAPPING_PATH, 'r') as f:
        class_to_idx = json.load(f)

    # Create ordered class labels
    class_labels = sorted(class_to_idx.keys(), key=lambda x: class_to_idx[x])
    num_classes = len(class_labels)

    print(f"\nFound {num_classes} classes:")
    for i, label in enumerate(class_labels[:5]):
        print(f"  {i}: {label}")
    if len(class_labels) > 5:
        print(f"  ... and {len(class_labels) - 5} more")

    # Load PyTorch model
    pytorch_model, checkpoint = load_pytorch_model(MODEL_PATH, num_classes)

    # Convert to Core ML
    mlmodel, output_path = convert_to_coreml(pytorch_model, class_labels, OUTPUT_PATH)

    # Create Swift mapping
    swift_mapping = create_class_mapping_for_swift(class_to_idx)

    print("\n" + "="*60)
    print("Conversion completed successfully!")
    print("="*60)
    print("\nNext steps:")
    print(f"  1. Copy {output_path} to your Xcode project")
    print(f"     -> ios/ARLandmarks/ARLandmarks/Models/")
    print(f"  2. Update VisionService.swift with the class mapping")
    print(f"  3. Uncomment the model loading code in VisionService.swift")
    print(f"  4. Build and run your iOS app!")
    print("="*60)


if __name__ == '__main__':
    main()