#!/usr/bin/env python3
"""
Update VisionService.swift with the generated class mapping.
"""
import json
import re
from pathlib import Path
import sys


def load_class_mapping():
    """Load the class to landmark ID mapping."""
    mapping_file = Path('ml_training/models/class_mapping_swift.json')

    if not mapping_file.exists():
        print(f"Error: Class mapping not found at {mapping_file}")
        print("Run 'python scripts/convert_to_coreml.py' first")
        sys.exit(1)

    with open(mapping_file, 'r') as f:
        return json.load(f)


def generate_swift_mapping(class_mapping):
    """Generate Swift code for the class mapping."""
    lines = ["    private let classToLandmarkID: [String: String] = ["]

    for class_name, landmark_id in sorted(class_mapping.items()):
        lines.append(f'        "{class_name}": "{landmark_id}",')

    lines.append("    ]")

    return '\n'.join(lines)


def update_vision_service(swift_mapping_code):
    """Update VisionService.swift with the new mapping."""
    vision_service_path = Path('ios/ARLandmarks/ARLandmarks/Services/VisionService.swift')

    if not vision_service_path.exists():
        print(f"Error: VisionService.swift not found at {vision_service_path}")
        sys.exit(1)

    # Read current file
    with open(vision_service_path, 'r') as f:
        content = f.read()

    # Replace the classToLandmarkID mapping
    pattern = r'private let classToLandmarkID: \[String: String\] = \[[^\]]*\]'
    new_content = re.sub(pattern, swift_mapping_code.strip(), content, flags=re.DOTALL)

    # Uncomment the model loading code if it's still commented
    if '/*' in new_content and 'LandmarkClassifier' in new_content:
        # Find and uncomment the loadModel function
        new_content = re.sub(
            r'/\*\s*do \{.*?Model: Waiting for trained Create ML Model"\)\s*\*/',
            '''do {
            let config = MLModelConfiguration()
            let mlModel = try LandmarkClassifier(configuration: config).model
            model = try VNCoreMLModel(for: mlModel)
            print("Vision Model loaded")
        } catch {
            self.error = "Model could not be loaded: \\(error.localizedDescription)"
            print("Vision Model: \\(error.localizedDescription)")
        }''',
            new_content,
            flags=re.DOTALL
        )

    # Write updated file
    with open(vision_service_path, 'w') as f:
        f.write(new_content)

    print(f"✓ Updated {vision_service_path}")


def main():
    print("="*60)
    print("VisionService.swift Updater")
    print("="*60)

    # Load class mapping
    print("\nLoading class mapping...")
    class_mapping = load_class_mapping()
    print(f"✓ Found {len(class_mapping)} classes")

    # Generate Swift code
    print("\nGenerating Swift mapping code...")
    swift_mapping = generate_swift_mapping(class_mapping)
    print("✓ Swift code generated")

    # Show preview
    print("\nPreview of mapping (first 3 entries):")
    lines = swift_mapping.split('\n')
    for line in lines[:4]:
        print(line)
    print(f"    ... and {len(class_mapping) - 3} more")
    print(lines[-1])

    # Update VisionService
    print("\nUpdating VisionService.swift...")
    update_vision_service(swift_mapping)

    print("\n" + "="*60)
    print("Update completed successfully!")
    print("="*60)
    print("\nNext steps:")
    print("  1. Build your Xcode project")
    print("  2. Run the app and test landmark recognition")
    print("  3. Monitor the console for 'Vision Model loaded' message")
    print("="*60)


if __name__ == '__main__':
    main()
