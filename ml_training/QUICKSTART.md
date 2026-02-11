# Quick Start Guide

Train your landmark recognition model in 4 simple steps!

## Prerequisites

- Python 3.8+
- Supabase credentials
- 30-60 minutes for training

## Setup (One Time)

1. **Install dependencies**:

```bash
cd ml_training
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Configure Supabase**:

```bash
cp .env.example .env
# Edit .env and add your SUPABASE_URL and SUPABASE_ANON_KEY
```

## Training (Automated)

Run the complete pipeline:

```bash
./train_pipeline.sh
```

This will:
1. ✓ Fetch landmarks from your database
2. ⏸️  Pause for you to place training images
3. ✓ Train the model (~30-60 minutes)
4. ✓ Convert to Core ML format
5. ✓ Copy to Xcode project
6. ✓ Update VisionService.swift

## Manual Steps (If Needed)

### Step-by-step:

```bash
# 1. Fetch landmarks
python scripts/fetch_landmarks.py

# 2. Collect images manually (20-50 per landmark)
#    Place in ml_training/data/train/<landmark_name>/
#    See MANUAL_IMAGE_COLLECTION.md for details

# 3. Train model
python scripts/train_model.py

# 4. Convert to Core ML
python scripts/convert_to_coreml.py

# 5. Copy to Xcode
./scripts/copy_model_to_xcode.sh

# 6. Update VisionService
python scripts/update_vision_service.py
```

## Verify in Xcode

1. Open `ios/ARLandmarks/ARLandmarks.xcodeproj`
2. Check that `Models/ZurichLandmarkClassifier.mlmodel` exists
3. Build and run (⌘R)
4. Point camera at a landmark
5. Watch for recognition overlay!

## Tips for Better Accuracy

### Add More Images
For better accuracy, collect diverse images:

1. Navigate to `ml_training/data/train/`
2. For each landmark folder, add 20-50 images
3. Get images from:
   - Google Images
   - Flickr Creative Commons
   - Unsplash / Pexels
   - Your own photos (best results!)

### Image Quality
- ✓ Different angles
- ✓ Different times of day
- ✓ Different weather
- ✓ Different distances
- ✓ Good resolution (300x300+)
- ✗ Blurry images
- ✗ Wrong landmarks

## Troubleshooting

### "Model not loading"
- Run `./scripts/copy_model_to_xcode.sh`
- In Xcode, add the model to your target

### "Low accuracy (<50%)"
- Add more training images (30+ per landmark)
- Retrain with `python scripts/train_model.py`

### "SUPABASE_URL not found"
- Check `.env` file exists in `ml_training/`
- Verify credentials are correct

### "Out of memory"
- Edit `scripts/train_model.py`
- Change `BATCH_SIZE = 32` to `BATCH_SIZE = 16`

## Expected Results

- **Training Time**: 30-60 minutes (CPU), 10-20 minutes (GPU)
- **Model Size**: ~2-5 MB
- **Accuracy**: 70-85% validation accuracy
- **Inference**: <50ms per frame on iPhone

## Next Steps

After training:
1. Test in different lighting conditions
2. Test with different camera angles
3. Add more training data for poorly recognized landmarks
4. Retrain to improve accuracy

## Full Documentation

See `README.md` for complete documentation, advanced usage, and troubleshooting.

## Support

Issues? Check:
1. `README.md` troubleshooting section
2. Training logs: `models/training_history.json`
3. GitHub issues
