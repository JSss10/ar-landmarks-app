# Quick Start: 3 Landmarks Demo

## Goal
Collect images for 3 landmarks and train your first model in ~30 minutes!

---

## Your 3 Landmarks

| Landmark | Folder Name | Google Search Term | Images Needed |
|----------|-------------|-------------------|---------------|
| 1. Grossmünster | `grossmunster` | "Grossmünster Zurich" | 20-30 |
| 2. Fraumünster | `fraumunster` | "Fraumünster Zurich" | 20-30 |
| 3. Opera House | `opera_house` | "Zurich Opera House" | 20-30 |

**Total**: 60-90 images (15-20 minutes to collect)

---

## Step-by-Step Instructions

### Step 1: Collect Images for Grossmünster (5-7 minutes)

1. **Open Google Images**
   ```
   https://images.google.com
   ```

2. **Search**: `Grossmünster Zurich`

3. **Download 20-30 images**:
   - Right-click on each image → "Save Image As..."
   - Save to: `/home/user/prototype/ml_training/data/train/grossmunster/`
   - Name them: `grossmunster_001.jpg`, `grossmunster_002.jpg`, etc.

4. **What to look for**:
   - ✅ Exterior views of the church
   - ✅ Different angles (front, side, from across river)
   - ✅ Different distances (close-up, medium, far)
   - ✅ Clear, focused images
   - ❌ Avoid: interior shots, night photos, blurry images

### Step 2: Collect Images for Fraumünster (5-7 minutes)

1. **Search**: `Fraumünster Zurich`

2. **Download 20-30 images**:
   - Save to: `/home/user/prototype/ml_training/data/train/fraumunster/`
   - Name them: `fraumunster_001.jpg`, `fraumunster_002.jpg`, etc.

3. **What to look for**:
   - ✅ Exterior views with distinctive green spire
   - ✅ Different angles
   - ✅ Clear images showing the church tower
   - ❌ Avoid: Chagall windows interior shots (use exterior only)

### Step 3: Collect Images for Opera House (5-7 minutes)

1. **Search**: `Zurich Opera House`

2. **Download 20-30 images**:
   - Save to: `/home/user/prototype/ml_training/data/train/opera_house/`
   - Name them: `opera_house_001.jpg`, `opera_house_002.jpg`, etc.

3. **What to look for**:
   - ✅ Exterior views of the building
   - ✅ Views from Sechseläutenplatz
   - ✅ Lakeside views
   - ❌ Avoid: interior performance shots

---

## Step 4: Verify Your Images

Run this command to check your progress:

```bash
cd /home/user/prototype/ml_training/data/train

for dir in grossmunster fraumunster opera_house; do
  count=$(ls "$dir"/*.jpg "$dir"/*.png 2>/dev/null | wc -l)
  echo "$dir: $count images"
done
```

**Expected output**:
```
grossmunster: 25 images
fraumunster: 30 images
opera_house: 22 images
```

**Minimum**: 15 images per landmark
**Recommended**: 20-30 images per landmark

---

## Step 5: Train Your Model

Once you have your images:

```bash
cd /home/user/prototype/ml_training

# Activate virtual environment
source venv/bin/activate

# Train the model (will take 10-20 minutes)
python scripts/train_model.py
```

**What will happen**:
1. Loads your 60-90 images
2. Augments them for training
3. Trains MobileNetV3 model
4. Creates validation split
5. Saves best model

**Expected output**:
```
Epoch 1/25: Train Loss: 1.234, Val Loss: 0.987, Val Acc: 45.2%
Epoch 2/25: Train Loss: 0.876, Val Loss: 0.654, Val Acc: 67.8%
...
Epoch 25/25: Train Loss: 0.123, Val Loss: 0.234, Val Acc: 85.3%
✓ Best model saved!
```

**Training time**: ~10-20 minutes on CPU

---

## Step 6: Convert to Core ML

```bash
# Convert PyTorch model to Core ML
python scripts/convert_to_coreml.py
```

**Output**:
- `ml_training/models/ZurichLandmarkClassifier.mlmodel`
- `ml_training/models/class_mapping_swift.json`

---

## Step 7: Copy to Xcode

```bash
./scripts/copy_model_to_xcode.sh
```

This copies the model to your iOS project.

---

## Step 8: Update VisionService.swift

The model will have these 3 classes. Update your VisionService:

```swift
// In VisionService.swift
private let classToLandmarkID: [String: String] = [
    "grossmunster": "your-grossmunster-id",
    "fraumunster": "your-fraumunster-id",
    "opera_house": "your-opera-house-id"
]
```

You can find the IDs in: `ml_training/models/class_mapping_swift.json`

---

## Step 9: Test!

### Screen Testing (Do This First!)

1. **Collect test images**:
   ```bash
   python scripts/collect_test_images.py
   ```

2. **Open the test viewer**:
   ```bash
   open ml_training/test_images/test_viewer.html
   ```

3. **Test with iPhone**:
   - Build and run your app in Xcode
   - Enable "Visual Recognition" mode
   - Point camera at screen showing landmark image
   - Hold steady for 2-3 seconds
   - Watch for recognition!

### Expected Results:

**✅ Success**:
- Landmark recognized in 1-2 seconds
- Correct name displayed
- Confidence score: 0.75+
- Detail overlay appears

**❌ If not working**:
- Check model loaded correctly
- Verify VisionService has class mapping
- Try lowering confidence threshold to 0.65

---

## Time Breakdown

| Task | Time |
|------|------|
| Collect images (3 landmarks) | 15-20 minutes |
| Train model | 10-20 minutes |
| Convert to Core ML | 1 minute |
| Copy to Xcode & update code | 5 minutes |
| Test | 5 minutes |
| **Total** | **35-50 minutes** |

---

## What You'll Have After This

✅ **Working landmark recognition** for 3 landmarks
✅ **Trained Core ML model**
✅ **Complete understanding** of the pipeline
✅ **Confidence to add** more landmarks later

---

## Adding More Landmarks Later

Once this works, you can easily add more:

1. Create new folder: `ml_training/data/train/new_landmark/`
2. Add 20-30 images
3. Re-run training: `python scripts/train_model.py`
4. Convert: `python scripts/convert_to_coreml.py`
5. Copy to Xcode: `./scripts/copy_model_to_xcode.sh`
6. Update class mapping in VisionService
7. Test!

---

## Tips for Best Results

### Image Quality
- ✅ Clear, focused images
- ✅ Good lighting (daytime)
- ✅ Landmark is main subject
- ✅ Resolution: 500x500px minimum
- ❌ Avoid: blurry, dark, cropped images

### Variety
- ✅ Different angles
- ✅ Different distances
- ✅ Different seasons/weather (if available)
- ✅ Both close-up and far views

### Naming Convention
Keep it simple:
- `grossmunster_001.jpg`
- `grossmunster_002.jpg`
- etc.

Numbers help you track progress!

---

## Troubleshooting

### "Can't find images folder"
```bash
# Check if folders exist
ls -la /home/user/prototype/ml_training/data/train/
```

Should show: `grossmunster/`, `fraumunster/`, `opera_house/`

### "Not enough images"
Need minimum 15 images per landmark. Check count:
```bash
cd /home/user/prototype/ml_training/data/train
for dir in */; do ls "$dir" | wc -l; done
```

### "Training fails"
- Make sure virtual environment is activated
- Check that images are .jpg or .png format
- Verify at least 15 images per landmark

### "Model not loading in iOS"
- Run: `./scripts/copy_model_to_xcode.sh`
- In Xcode, verify model file is in project
- Clean build folder (Cmd+Shift+K) and rebuild

---

## Quick Commands Summary

```bash
# Navigate to project
cd /home/user/prototype/ml_training

# Check image count
for dir in data/train/*/; do
  echo "$dir: $(ls "$dir"*.jpg "$dir"*.png 2>/dev/null | wc -l) images"
done

# Activate environment
source venv/bin/activate

# Train model
python scripts/train_model.py

# Convert to Core ML
python scripts/convert_to_coreml.py

# Copy to Xcode
./scripts/copy_model_to_xcode.sh

# Collect test images
python scripts/collect_test_images.py
```

---

## Next Steps After Success

Once you've successfully trained and tested with 3 landmarks:

1. **Add 5-10 more important landmarks**
   - Bahnhofstrasse
   - Lindenhof
   - National Museum
   - Chinese Garden
   - Uetliberg

2. **Retrain with larger dataset**

3. **Test in real world** at actual landmark locations

4. **Iterate**: Add more landmarks gradually until you have good coverage

---

## Need Help?

Check these docs:
- **This guide**: Quick 3-landmark start
- **WHAT_TO_DO_NOW.md**: Alternative approaches
- **MANUAL_IMAGE_COLLECTION.md**: Detailed collection guide
- **TESTING_GUIDE.md**: Complete testing methodology
- **README.md**: Full pipeline documentation

---

## Let's Go! 🚀

**Right now, start here**:
1. Open Google Images
2. Search "Grossmünster Zurich"
3. Download 20-30 images
4. Save to: `/home/user/prototype/ml_training/data/train/grossmunster/`

Then repeat for Fraumünster and Opera House.

**You got this!** ⚡
