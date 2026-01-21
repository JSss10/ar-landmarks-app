#!/usr/bin/env python3
"""
Fetch all landmarks from Supabase database and save them for training.
"""
import json
import os
import sys
from pathlib import Path
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file")
    sys.exit(1)


def fetch_landmarks():
    """Fetch all active landmarks from Supabase."""
    url = f"{SUPABASE_URL}/rest/v1/landmarks"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    params = {
        'is_active': 'eq.true',
        'select': 'id,name,name_en,description,description_en,latitude,longitude,category_id'
    }

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        landmarks = response.json()

        print(f"✓ Fetched {len(landmarks)} landmarks from Supabase")
        return landmarks
    except Exception as e:
        print(f"Error fetching landmarks: {e}")
        sys.exit(1)


def save_landmarks(landmarks, output_dir='ml_training/data'):
    """Save landmarks to JSON file."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    filepath = output_path / 'landmarks.json'
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(landmarks, f, indent=2, ensure_ascii=False)

    print(f"✓ Saved {len(landmarks)} landmarks to {filepath}")

    # Create class mapping file for training
    class_mapping = {}
    for idx, landmark in enumerate(landmarks):
        # Use name_en if available, otherwise use name
        class_name = landmark.get('name_en', landmark['name']).lower()
        # Clean class name - remove special chars, replace spaces with underscores
        class_name = ''.join(c if c.isalnum() or c == ' ' else '' for c in class_name)
        class_name = class_name.replace(' ', '_')

        class_mapping[class_name] = {
            'id': landmark['id'],
            'name': landmark['name'],
            'name_en': landmark.get('name_en'),
            'class_index': idx
        }

    mapping_path = output_path / 'class_mapping.json'
    with open(mapping_path, 'w', encoding='utf-8') as f:
        json.dump(class_mapping, f, indent=2, ensure_ascii=False)

    print(f"✓ Saved class mapping to {mapping_path}")

    return landmarks, class_mapping


def main():
    print("Fetching landmarks from Supabase...")
    landmarks = fetch_landmarks()

    print(f"\nSaving landmarks...")
    landmarks, class_mapping = save_landmarks(landmarks)

    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Total landmarks: {len(landmarks)}")
    print(f"  Classes created: {len(class_mapping)}")
    print(f"\nExample landmarks:")
    for i, landmark in enumerate(landmarks[:5]):
        name = landmark.get('name_en', landmark['name'])
        print(f"  {i+1}. {name}")

    if len(landmarks) > 5:
        print(f"  ... and {len(landmarks) - 5} more")

    print(f"\nNext steps:")
    print(f"  1. Run 'python scripts/download_images.py' to download training images")
    print(f"  2. Manually collect more images for landmarks (optional)")
    print(f"  3. Run 'python scripts/train_model.py' to train the model")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
