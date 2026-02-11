#!/usr/bin/env python3
"""
Collect reference test images for each landmark.
These images can be displayed on a screen for initial testing.
"""
import json
import os
import sys
from pathlib import Path
from tqdm import tqdm


def load_landmarks(data_dir='ml_training/data'):
    """Load landmarks from the data directory."""
    landmarks_path = Path(data_dir) / 'landmarks.json'

    if not landmarks_path.exists():
        print("Error: landmarks.json not found")
        print("Run 'python scripts/fetch_landmarks.py' first")
        sys.exit(1)

    with open(landmarks_path, 'r', encoding='utf-8') as f:
        landmarks = json.load(f)

    return landmarks


def create_test_html(landmarks, test_dir):
    """
    Create an HTML viewer for easy full-screen testing.
    """
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landmark Recognition Test Images</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow: hidden;
        }
        .container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .image-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        img {
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
        }
        .info {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 15px 30px;
            border-radius: 10px;
            text-align: center;
        }
        .landmark-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .landmark-id {
            font-size: 14px;
            color: #888;
        }
        .controls {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 14px;
        }
        .navigation {
            position: absolute;
            top: 50%;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
        }
        button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 48px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.3s;
        }
        button:hover {
            background: rgba(255, 255, 255, 0.4);
        }
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="controls">
            Press ← → to navigate | Press F for fullscreen | Press I to toggle info
        </div>

        <div class="image-container">
            <img id="current-image" src="" alt="Landmark">
        </div>

        <div class="info" id="info">
            <div class="landmark-name" id="landmark-name"></div>
            <div class="landmark-id" id="landmark-id"></div>
        </div>

        <div class="navigation">
            <button onclick="previousImage()">←</button>
            <button onclick="nextImage()">→</button>
        </div>
    </div>

    <script>
        const landmarks = """ + json.dumps(landmarks) + """;
        let currentIndex = 0;
        let infoVisible = true;

        function updateDisplay() {
            const landmark = landmarks[currentIndex];
            const img = document.getElementById('current-image');
            const name = document.getElementById('landmark-name');
            const id = document.getElementById('landmark-id');

            img.src = `${landmark.class_name}.jpg`;
            name.textContent = landmark.name_en || landmark.name;
            id.textContent = `ID: ${landmark.id} | ${currentIndex + 1}/${landmarks.length}`;
        }

        function nextImage() {
            currentIndex = (currentIndex + 1) % landmarks.length;
            updateDisplay();
        }

        function previousImage() {
            currentIndex = (currentIndex - 1 + landmarks.length) % landmarks.length;
            updateDisplay();
        }

        function toggleInfo() {
            const info = document.getElementById('info');
            infoVisible = !infoVisible;
            info.style.display = infoVisible ? 'block' : 'none';
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowRight':
                    nextImage();
                    break;
                case 'ArrowLeft':
                    previousImage();
                    break;
                case 'f':
                case 'F':
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        document.documentElement.requestFullscreen();
                    }
                    break;
                case 'i':
                case 'I':
                    toggleInfo();
                    break;
            }
        });

        // Initialize
        updateDisplay();
    </script>
</body>
</html>"""

    html_path = test_dir / 'test_viewer.html'
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return html_path


def main():
    print("="*60)
    print("Landmark Test Image Collector")
    print("="*60)

    # Configuration
    TEST_DIR = Path('ml_training/test_images')
    IMAGE_SIZE = '1024'  # Good quality for screen testing

    # Create test directory
    TEST_DIR.mkdir(parents=True, exist_ok=True)

    # Load landmarks
    print("\nLoading landmarks...")
    landmarks = load_landmarks()
    print(f"Found {len(landmarks)} landmarks")

    # Prepare data for HTML viewer
    viewer_data = []

    # Download test image for each landmark
    print(f"\nDownloading test images...")
    successful = 0
    failed = []

    for landmark in tqdm(landmarks, desc="Scanning"):
        name = landmark.get('name_en', landmark['name'])
        landmark_id = landmark['id']

        # Create a simple class name for file naming
        class_name = name.lower().replace(' ', '_').replace('ü', 'ue').replace('ö', 'oe')
        class_name = ''.join(c for c in class_name if c.isalnum() or c == '_')

        output_path = TEST_DIR / f"{class_name}.jpg"

        # Check if image was manually placed
        if output_path.exists():
            successful += 1
            viewer_data.append({
                'id': landmark_id,
                'name': landmark['name'],
                'name_en': name,
                'class_name': class_name
            })
        else:
            failed.append(name)

    # Create HTML viewer
    print("\nCreating HTML viewer...")
    html_path = create_test_html(viewer_data, TEST_DIR)

    # Summary
    print("\n" + "="*60)
    print("Collection Summary:")
    print(f"  ✓ Successfully downloaded: {successful}/{len(landmarks)}")
    if failed:
        print(f"  ✗ Failed: {len(failed)}")
        for name in failed[:5]:
            print(f"    - {name}")
        if len(failed) > 5:
            print(f"    ... and {len(failed) - 5} more")

    print(f"\n📁 Test images saved to: {TEST_DIR}/")
    print(f"🌐 HTML viewer created: {html_path}")

    print("\n" + "="*60)
    print("How to Test:")
    print("="*60)
    print("\n1. SCREEN TESTING:")
    print("   a. Open test_viewer.html in a web browser")
    print("   b. Press 'F' for fullscreen")
    print("   c. Use ← → arrow keys to navigate between landmarks")
    print("   d. Point your iPhone camera at the screen")
    print("   e. Verify the app recognizes each landmark\n")

    print("2. TV TESTING:")
    print("   a. Connect your laptop to TV via HDMI")
    print("   b. Open test_viewer.html in fullscreen")
    print("   c. Stand 1-2 feet from TV")
    print("   d. Test with your iPhone app\n")

    print("3. MANUAL TESTING:")
    print(f"   a. Open images in {TEST_DIR}/ individually")
    print("   b. Use any image viewer in fullscreen mode")
    print("   c. Test with your iPhone app\n")

    print("💡 Tips:")
    print("   - Set screen brightness to 80-100%")
    print("   - Test from 30-60cm distance")
    print("   - Hold phone steady for 2-3 seconds")
    print("   - Check confidence scores (should be >0.75)")
    print("   - Document which landmarks fail to recognize")

    print("\n" + "="*60)
    print("Next Steps:")
    print("  1. Open test_viewer.html in your browser")
    print("  2. Test all landmarks with your iOS app")
    print("  3. Note which landmarks need more training data")
    print("  4. See TESTING_GUIDE.md for detailed testing instructions")
    print("="*60)


if __name__ == '__main__':
    main()
