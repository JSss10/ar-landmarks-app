#!/usr/bin/env python3
"""
Search for a landmark in Supabase by name.
"""
import os
import sys
from pathlib import Path
import requests
from dotenv import load_dotenv

# Load environment variables
env_path = Path('.env')
if env_path.exists():
    load_dotenv(env_path)
else:
    env_path = Path('ml_training/.env')
    if env_path.exists():
        load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')

def search_landmarks(search_term):
    """Search for landmarks containing the search term."""
    url = f"{SUPABASE_URL}/rest/v1/landmarks"
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
    }

    params = {
        'select': 'id,name,name_en',
        'is_active': 'eq.true'
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        landmarks = response.json()

        # Filter by search term
        results = []
        search_lower = search_term.lower()
        for landmark in landmarks:
            name = landmark.get('name', '').lower()
            name_en = landmark.get('name_en', '').lower()
            if search_lower in name or search_lower in name_en:
                results.append(landmark)

        return results
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    search_term = sys.argv[1] if len(sys.argv) > 1 else 'oper'

    print(f"Searching for landmarks containing '{search_term}'...\n")
    results = search_landmarks(search_term)

    if not results:
        print(f"No landmarks found containing '{search_term}'")
        print("\nTry searching for:")
        print("  - oper")
        print("  - zurich")
        print("  - house")
    else:
        print(f"Found {len(results)} landmark(s):\n")
        for landmark in results:
            print(f"ID: {landmark['id']}")
            print(f"Name: {landmark['name']}")
            if landmark.get('name_en'):
                print(f"English: {landmark['name_en']}")
            print()