# What To Do Now - Image Collection

## 📋 Status

Training images need to be collected manually. The model requires images to learn landmark recognition.

## ✅ Options

You have **3 options** to proceed:

---

## Option 1: Quick Start with Fewer Landmarks (RECOMMENDED)

Focus on the top 10-20 most important landmarks to get started quickly.

### Steps:

1. **Create folders for top landmarks**
   ```bash
   cd /home/user/prototype/ml_training/data/train

   # Create folders for top landmarks
   mkdir -p grossmunster fraumunster bahnhofstrasse lindenhof \
            national_museum chinese_garden uetliberg eth_zurich \
            opera_house prime_tower
   ```

2. **Collect 20-30 images per landmark**
   - **Google Images** (fastest):
     - Search: "Grossmünster Zurich"
     - Save 20-30 images to `ml_training/data/train/grossmunster/`
     - Repeat for each landmark

   - **Time estimate**: 1-2 hours for 10 landmarks

3. **Verify images**
   ```bash
   cd /home/user/prototype/ml_training/data/train
   for dir in */; do
     count=$(ls "$dir"*.jpg "$dir"*.png 2>/dev/null | wc -l)
     echo "$dir: $count images"
   done
   ```

4. **Train model**
   ```bash
   cd /home/user/prototype/ml_training
   source venv/bin/activate
   python scripts/train_model.py
   ```

### Advantages:
- ✅ Fast (1-2 hours)
- ✅ Tests the pipeline
- ✅ Can add more landmarks later
- ✅ Proves concept works

---

## Option 2: Full Dataset Collection

Collect images for all 108 landmarks (comprehensive but time-consuming).

### Steps:

1. **Follow the Manual Image Collection Guide**
   ```bash
   # Read the comprehensive guide
   cat /home/user/prototype/ml_training/MANUAL_IMAGE_COLLECTION.md
   ```

2. **Collect 20-30 images for each landmark**
   - Use Google Images, Unsplash, or Flickr
   - Time estimate: 4-6 hours

3. **Train model**
   ```bash
   cd /home/user/prototype/ml_training
   source venv/bin/activate
   python scripts/train_model.py
   ```

### Advantages:
- ✅ Complete dataset
- ✅ Best accuracy
- ✅ Production ready

### Disadvantages:
- ❌ Time consuming (4-6 hours)
- ❌ High effort

---

## Option 3: Use Pre-Downloaded Sample Dataset (If Available)

If you have a sample dataset or can obtain one, use it for testing.

### Steps:

1. **Download or obtain image dataset**

2. **Extract to training folder**
   ```bash
   unzip landmark_images.zip -d /home/user/prototype/ml_training/data/train/
   ```

3. **Train model**
   ```bash
   cd /home/user/prototype/ml_training
   source venv/bin/activate
   python scripts/train_model.py
   ```

---

## Quick Reference: Top 10 Landmarks to Start With

Focus on these for fastest results:

| Landmark | Folder Name | Google Search Term |
|----------|-------------|-------------------|
| 1. Grossmünster | `grossmunster` | "Grossmünster Zurich" |
| 2. Fraumünster | `fraumunster` | "Fraumünster Zurich" |
| 3. Bahnhofstrasse | `bahnhofstrasse` | "Bahnhofstrasse Zurich" |
| 4. Lindenhof | `lindenhof` | "Lindenhof Zurich" |
| 5. National Museum | `national_museum` | "Swiss National Museum Zurich" |
| 6. Chinese Garden | `chinese_garden` | "Chinese Garden Zurich" |
| 7. Uetliberg | `uetliberg` | "Uetliberg Zurich" |
| 8. ETH Zurich | `eth_zurich` | "ETH Zurich main building" |
| 9. Opera House | `opera_house` | "Zurich Opera House" |
| 10. Prime Tower | `prime_tower` | "Prime Tower Zurich" |

---

## Step-by-Step: Collecting Images from Google

### Example: Grossmünster

1. **Open Google Images**
   ```
   https://images.google.com
   ```

2. **Search**
   ```
   Grossmünster Zurich
   ```

3. **Filter (optional)**
   - Click "Tools"
   - Size: Large
   - Usage rights: Creative Commons licenses

4. **Download images**
   - Right-click on image → "Save Image As..."
   - Save to: `/home/user/prototype/ml_training/data/train/grossmunster/`
   - Name: `grossmunster_001.jpg`, `grossmunster_002.jpg`, etc.
   - Download 20-30 images

5. **Look for variety**:
   - Different angles (front, side, corner)
   - Different distances (close-up, medium, far)
   - Different times of day (if available)
   - Different seasons

6. **Repeat for next landmark**

---

## Folder Structure Example

After collecting, your structure should look like this:

```
ml_training/data/train/
├── grossmunster/
│   ├── grossmunster_001.jpg
│   ├── grossmunster_002.jpg
│   ├── grossmunster_003.jpg
│   └── ... (20-30 images total)
├── fraumunster/
│   ├── fraumunster_001.jpg
│   ├── fraumunster_002.jpg
│   └── ... (20-30 images)
├── bahnhofstrasse/
│   ├── bahnhofstrasse_001.jpg
│   └── ... (20-30 images)
└── ... (other landmarks)
```

---

## After Collection: Verify and Train

### 1. Verify Images

```bash
cd /home/user/prototype/ml_training/data/train

# Count images per folder
for dir in */; do
  count=$(ls "$dir"*.jpg "$dir"*.png 2>/dev/null | wc -l)
  if [ $count -gt 0 ]; then
    echo "$dir: $count images"
  fi
done
```

### Expected Output:
```
grossmunster/: 25 images
fraumunster/: 30 images
bahnhofstrasse/: 20 images
...
```

### 2. Train Model

```bash
cd /home/user/prototype/ml_training
source venv/bin/activate
python scripts/train_model.py
```

This will:
- Load your images
- Train the model (~30-60 minutes)
- Create `LandmarkClassifier.mlmodel`
- Save in `ml_training/models/`

### 3. Convert to Core ML

```bash
python scripts/convert_to_coreml.py
```

### 4. Copy to Xcode

```bash
./scripts/copy_model_to_xcode.sh
```

### 5. Test!

Build and run your iOS app to test the landmark recognition!

---

## Troubleshooting

### "I don't have time to collect images manually"

**Solution**: Start with just 5-10 landmarks (30 minutes)
- Test the pipeline
- Prove it works
- Add more landmarks over time

### "Google Images download is too slow"

**Solution**: Use batch downloader
- Chrome extension: "Download All Images"
- Or: Use download manager

### "Images are too large"

**Solution**: Resize them
```bash
brew install imagemagick  # macOS
cd ml_training/data/train/grossmunster
mogrify -resize 1024x1024\> -quality 85 *.jpg
```

### "Can I skip this?"

**Unfortunately no** - the model needs training images to learn. This is a one-time effort that enables the entire feature.

---

## Time Estimates

| Approach | Landmarks | Time | Result |
|----------|-----------|------|--------|
| **Quick Start** | 10 | 1-2 hours | Working demo |
| **Medium** | 30 | 2-3 hours | Good coverage |
| **Full** | 108 | 4-6 hours | Complete |
| **Per landmark** | 1 | 2-3 minutes | Individual |

---

## What You Get After This

Once you've collected images and trained:

✅ **Working landmark recognition** through camera
✅ **Real-time AR overlay** with landmark info
✅ **On-device processing** (no server needed)
✅ **Production-ready model** for your app

---

## Need Help?

### Documentation:
- **Complete guide**: `MANUAL_IMAGE_COLLECTION.md`
- **Testing guide**: `TESTING_GUIDE.md`
- **Training guide**: `README.md`

### Quick Links:
- Unsplash: https://unsplash.com/
- Pexels: https://pexels.com/

---

## Summary

**Right now, you need to:**

1. ✅ Choose Option 1 (Quick Start - 10 landmarks) - RECOMMENDED
2. ✅ Collect 20-30 images per landmark from Google Images
3. ✅ Save to `ml_training/data/train/[landmark_name]/`
4. ✅ Run `python scripts/train_model.py`
5. ✅ Test with your iOS app!

**Time to complete**: 1-2 hours for a working demo

Good luck! 🚀
