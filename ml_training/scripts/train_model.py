#!/usr/bin/env python3
"""
Train a landmark recognition model using transfer learning with MobileNetV3.
The model will be optimized for mobile deployment.
"""
import json
import os
import sys
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from tqdm import tqdm
import time


class LandmarkClassifier:
    """Wrapper for training a landmark classifier."""

    def __init__(self, data_dir='ml_training/data', num_classes=None):
        self.data_dir = Path(data_dir)
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.num_classes = num_classes or self._count_classes()

        print(f"Using device: {self.device}")
        print(f"Number of classes: {self.num_classes}")

        # Data transforms
        self.train_transforms = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        self.val_transforms = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

        # Load datasets
        self.train_dataset = None
        self.val_dataset = None
        self.train_loader = None
        self.val_loader = None
        self.model = None

    def _count_classes(self):
        """Count number of classes from training directory."""
        train_dir = self.data_dir / 'train'
        if not train_dir.exists():
            print(f"Error: Training directory not found: {train_dir}")
            sys.exit(1)

        classes = [d for d in train_dir.iterdir() if d.is_dir()]
        return len(classes)

    def load_data(self, batch_size=32):
        """Load training and validation datasets."""
        print("\nLoading datasets...")

        train_dir = self.data_dir / 'train'
        val_dir = self.data_dir / 'validation'

        self.train_dataset = datasets.ImageFolder(train_dir, transform=self.train_transforms)
        self.val_dataset = datasets.ImageFolder(val_dir, transform=self.val_transforms)

        self.train_loader = DataLoader(
            self.train_dataset,
            batch_size=batch_size,
            shuffle=True,
            num_workers=2,
            pin_memory=True
        )

        self.val_loader = DataLoader(
            self.val_dataset,
            batch_size=batch_size,
            shuffle=False,
            num_workers=2,
            pin_memory=True
        )

        print(f"✓ Training samples: {len(self.train_dataset)}")
        print(f"✓ Validation samples: {len(self.val_dataset)}")
        print(f"✓ Batch size: {batch_size}")

        return self.train_dataset.class_to_idx

    def build_model(self):
        """Build MobileNetV3 model with transfer learning."""
        print("\nBuilding model...")

        # Load pre-trained MobileNetV3-Small (optimized for mobile)
        self.model = models.mobilenet_v3_small(pretrained=True)

        # Freeze early layers
        for param in self.model.features[:9].parameters():
            param.requires_grad = False

        # Replace classifier
        num_features = self.model.classifier[0].in_features
        self.model.classifier = nn.Sequential(
            nn.Linear(num_features, 256),
            nn.Hardswish(),
            nn.Dropout(0.2),
            nn.Linear(256, self.num_classes)
        )

        self.model = self.model.to(self.device)
        print(f"✓ Model built: MobileNetV3-Small")
        print(f"  Trainable parameters: {sum(p.numel() for p in self.model.parameters() if p.requires_grad):,}")

        return self.model

    def train(self, epochs=20, learning_rate=0.001):
        """Train the model."""
        print(f"\nTraining for {epochs} epochs...")

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(
            filter(lambda p: p.requires_grad, self.model.parameters()),
            lr=learning_rate
        )
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='min', patience=3, factor=0.5, verbose=True
        )

        best_val_acc = 0.0
        history = {'train_loss': [], 'train_acc': [], 'val_loss': [], 'val_acc': []}

        for epoch in range(epochs):
            print(f"\nEpoch {epoch+1}/{epochs}")
            print("-" * 60)

            # Training phase
            self.model.train()
            train_loss = 0.0
            train_correct = 0
            train_total = 0

            pbar = tqdm(self.train_loader, desc="Training")
            for inputs, labels in pbar:
                inputs, labels = inputs.to(self.device), labels.to(self.device)

                optimizer.zero_grad()
                outputs = self.model(inputs)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()

                train_loss += loss.item()
                _, predicted = outputs.max(1)
                train_total += labels.size(0)
                train_correct += predicted.eq(labels).sum().item()

                pbar.set_postfix({'loss': f"{loss.item():.3f}", 'acc': f"{100.*train_correct/train_total:.1f}%"})

            train_loss /= len(self.train_loader)
            train_acc = 100. * train_correct / train_total

            # Validation phase
            self.model.eval()
            val_loss = 0.0
            val_correct = 0
            val_total = 0

            with torch.no_grad():
                for inputs, labels in tqdm(self.val_loader, desc="Validation"):
                    inputs, labels = inputs.to(self.device), labels.to(self.device)
                    outputs = self.model(inputs)
                    loss = criterion(outputs, labels)

                    val_loss += loss.item()
                    _, predicted = outputs.max(1)
                    val_total += labels.size(0)
                    val_correct += predicted.eq(labels).sum().item()

            val_loss /= len(self.val_loader)
            val_acc = 100. * val_correct / val_total

            # Update learning rate
            scheduler.step(val_loss)

            # Save history
            history['train_loss'].append(train_loss)
            history['train_acc'].append(train_acc)
            history['val_loss'].append(val_loss)
            history['val_acc'].append(val_acc)

            print(f"\nResults:")
            print(f"  Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
            print(f"  Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.2f}%")

            # Save best model
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                self.save_model('best_model.pth')
                print(f"  ✓ Saved best model (Val Acc: {val_acc:.2f}%)")

        print(f"\n{'='*60}")
        print(f"Training completed!")
        print(f"Best validation accuracy: {best_val_acc:.2f}%")
        print(f"{'='*60}")

        return history

    def save_model(self, filename='landmark_model.pth', save_dir='ml_training/models'):
        """Save the trained model."""
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)

        filepath = save_path / filename
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'num_classes': self.num_classes,
            'class_to_idx': self.train_dataset.class_to_idx
        }, filepath)

        return filepath

    def load_model(self, filepath):
        """Load a saved model."""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        return checkpoint


def main():
    print("="*60)
    print("Landmark Recognition Model Training")
    print("="*60)

    # Configuration
    EPOCHS = 25
    BATCH_SIZE = 32
    LEARNING_RATE = 0.001

    # Initialize classifier
    classifier = LandmarkClassifier()

    # Load data
    class_to_idx = classifier.load_data(batch_size=BATCH_SIZE)

    # Save class mapping for later use
    mapping_file = Path('ml_training/data/pytorch_class_mapping.json')
    with open(mapping_file, 'w') as f:
        json.dump(class_to_idx, f, indent=2)
    print(f"✓ Saved class mapping to {mapping_file}")

    # Build model
    classifier.build_model()

    # Train model
    history = classifier.train(epochs=EPOCHS, learning_rate=LEARNING_RATE)

    # Save final model
    final_path = classifier.save_model('landmark_model_final.pth')
    print(f"\n✓ Final model saved to {final_path}")

    # Save training history
    history_file = Path('ml_training/models/training_history.json')
    with open(history_file, 'w') as f:
        json.dump(history, f, indent=2)
    print(f"✓ Training history saved to {history_file}")

    print("\nNext steps:")
    print("  1. Run 'python scripts/convert_to_coreml.py' to convert to Core ML")
    print("  2. Add the .mlmodel file to your Xcode project")
    print("  3. Update VisionService.swift to use the new model")
    print("="*60)


if __name__ == '__main__':
    main()
