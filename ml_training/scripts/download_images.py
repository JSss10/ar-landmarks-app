#!/usr/bin/env python3
"""
Download training images for landmarks from various sources.
This script uses Wikimedia Commons API to search for landmark images.
"""
import json
import os
import sys
import time
from pathlib import Path
import requests
from tqdm import tqdm
from urllib.parse import quote


def load_landmarks(data_dir='ml_training/data'):
    """Load landmarks and class mapping."""
    landmarks_path = Path(data_dir) / 'landmarks.json'
    mapping_path = Path(data_dir) / 'class_mapping.json'

    if not landmarks_path.exists() or not mapping_path.exists():
        print("Error: Run fetch_landmarks.py first")
        sys.exit(1)

    with open(landmarks_path, 'r', encoding='utf-8') as f:
        landmarks = json.load(f)

    with open(mapping_path, 'r', encoding='utf-8') as f:
        class_mapping = json.load(f)

    return landmarks, class_mapping


def search_wikimedia_images(query, max_images=20):
    """Search Wikimedia Commons for images."""
    url = "https://commons.wikimedia.org/w/api.php"

    params = {
        'action': 'query',
        'format': 'json',
        'generator': 'search',
        'gsrsearch': f'{query} Zurich',
        'gsrnamespace': '6',  # File namespace
        'gsrlimit': max_images,
        'prop': 'imageinfo',
        'iiprop': 'url|size',
        'iiurlwidth': 800
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        images = []
        if 'query' in data and 'pages' in data['query']:
            for page in data['query']['pages'].values():
                if 'imageinfo' in page:
                    img_info = page['imageinfo'][0]
                    # Prefer thumburl, fallback to url
                    img_url = img_info.get('thumburl', img_info.get('url'))
                    if img_url:
                        images.append(img_url)

        return images
    except Exception as e:
        print(f"Warning: Failed to search Wikimedia for '{query}': {e}")
        return []


def download_image(url, output_path, timeout=15):
    """Download a single image."""
    try:
        response = requests.get(url, timeout=timeout, stream=True)
        response.raise_for_status()

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return True
    except Exception as e:
        print(f"  Failed to download {url}: {e}")
        return False


def download_landmark_images(class_name, landmark_info, output_dir, images_per_landmark=15):
    """Download images for a specific landmark."""
    # Create output directory
    class_dir = Path(output_dir) / 'train' / class_name
    class_dir.mkdir(parents=True, exist_ok=True)

    # Search for images
    search_query = landmark_info.get('name_en', landmark_info['name'])
    print(f"\n  Searching for '{search_query}'...")

    image_urls = search_wikimedia_images(search_query, max_images=images_per_landmark * 2)

    if not image_urls:
        print(f"  Warning: No images found for {search_query}")
        return 0

    # Download images
    downloaded = 0
    for idx, url in enumerate(image_urls[:images_per_landmark]):
        output_path = class_dir / f"{class_name}_{idx:03d}.jpg"

        if output_path.exists():
            downloaded += 1
            continue

        if download_image(url, output_path):
            downloaded += 1

        time.sleep(0.5)  # Be nice to the API

    return downloaded


def create_validation_split(data_dir, split_ratio=0.2):
    """Move some images from train to validation set."""
    import random
    import shutil

    train_dir = Path(data_dir) / 'train'
    val_dir = Path(data_dir) / 'validation'
    val_dir.mkdir(parents=True, exist_ok=True)

    for class_dir in train_dir.iterdir():
        if not class_dir.is_dir():
            continue

        class_name = class_dir.name
        val_class_dir = val_dir / class_name
        val_class_dir.mkdir(parents=True, exist_ok=True)

        # Get all images
        images = list(class_dir.glob('*.jpg'))

        # Calculate validation size
        val_size = max(1, int(len(images) * split_ratio))

        # Randomly select validation images
        val_images = random.sample(images, min(val_size, len(images)))

        # Move to validation directory
        for img in val_images:
            shutil.move(str(img), str(val_class_dir / img.name))


def main():
    print("="*60)
    print("Landmark Image Downloader")
    print("="*60)

    # Configuration
    IMAGES_PER_LANDMARK = 15
    DATA_DIR = 'ml_training/data'

    # Load landmarks
    print("\nLoading landmarks...")
    landmarks, class_mapping = load_landmarks(DATA_DIR)

    print(f"Found {len(class_mapping)} landmark classes")
    print(f"\nDownloading {IMAGES_PER_LANDMARK} images per landmark...")
    print(f"This may take a while...\n")

    # Download images for each landmark
    total_downloaded = 0
    failed_classes = []

    for class_name, landmark_info in tqdm(class_mapping.items(), desc="Downloading"):
        print(f"\n[{landmark_info['class_index']+1}/{len(class_mapping)}] {landmark_info['name']}")

        downloaded = download_landmark_images(
            class_name,
            landmark_info,
            DATA_DIR,
            images_per_landmark=IMAGES_PER_LANDMARK
        )

        total_downloaded += downloaded
        print(f"  ✓ Downloaded {downloaded} images")

        if downloaded < 5:  # Minimum viable images
            failed_classes.append((class_name, landmark_info['name']))

    # Create validation split
    print("\n\nCreating validation split...")
    create_validation_split(DATA_DIR, split_ratio=0.2)
    print("✓ Validation split created (80/20)")

    # Summary
    print("\n" + "="*60)
    print("Download Summary:")
    print(f"  Total images downloaded: {total_downloaded}")
    print(f"  Average per class: {total_downloaded / len(class_mapping):.1f}")

    if failed_classes:
        print(f"\n  Warning: {len(failed_classes)} classes have <5 images:")
        for class_name, name in failed_classes[:5]:
            print(f"    - {name}")
        if len(failed_classes) > 5:
            print(f"    ... and {len(failed_classes) - 5} more")

    print("\nNext steps:")
    print("  1. Review downloaded images in ml_training/data/train/")
    print("  2. Add more images manually for better accuracy (recommended: 20-50 per class)")
    print("  3. Run 'python scripts/train_model.py' to train the model")
    print("="*60)


if __name__ == '__main__':
    main()
