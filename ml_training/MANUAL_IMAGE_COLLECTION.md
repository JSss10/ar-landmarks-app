# Manual Image Collection Guide

## Why Manual Collection?

Manual image collection gives you the best training results:

- ✅ High-quality, relevant images
- ✅ Diverse angles and conditions
- ✅ Better model accuracy
- ✅ Complete control over training data

---

## Quick Start: Collecting Images

### Goal
Collect **20-50 images per landmark** for optimal accuracy.

### Minimum Viable Dataset
- **Bare minimum**: 10 images per landmark
- **Recommended**: 20-30 images per landmark
- **Ideal**: 50+ images per landmark

---

## Method 1: Google Images (Fastest)

### Steps:

1. **Search for landmark**
   ```
   Google: "Grossmünster Zurich"
   ```

2. **Click "Images" tab**

3. **Add filters** (optional)
   - Tools → Size → Large
   - Tools → Usage Rights → Creative Commons licenses

4. **Right-click and save images**
   - Save 20-30 diverse images
   - Avoid logos, maps, interior shots (unless relevant)

5. **Organize into folders**
   ```bash
   ml_training/data/train/grossmunster/
   ├── grossmunster_001.jpg
   ├── grossmunster_002.jpg
   └── ...
   ```

### Pro Tips:
- Use both English and German names for better results
- Search variations: "Grossmünster church", "Grossmünster exterior", "Grossmünster facade"
- Include images from different seasons
- Avoid duplicate images

---

## Method 2: Flickr Creative Commons (Higher Quality)

### Steps:

1. **Go to Flickr Advanced Search**
   ```
   https://www.flickr.com/search/advanced/
   ```

2. **Enter search terms**
   - Keywords: "Grossmünster Zurich"
   - License: "All Creative Commons" or "Commercial use allowed"

3. **Download images**
   - Click on image → "..." menu → Download
   - Choose "Original" size if available

4. **Save to landmark folder**

### Advantages:
- Higher resolution images
- Often includes photographer metadata
- Creative Commons licensed

---

## Method 3: Unsplash/Pexels (Professional Quality)

### Free Stock Photo Sites:
- **Unsplash**: https://unsplash.com/
- **Pexels**: https://pexels.com/
- **Pixabay**: https://pixabay.com/

### Steps:
1. Search for landmark name
2. Download high-resolution images (free)
3. Save to training folder

### Advantages:
- Professional quality
- Free commercial use
- No attribution required
- High resolution

---

## Method 4: Take Your Own Photos (Best Results!)

### Why This Works Best:
- ✅ Exactly matches real-world usage
- ✅ Captures local lighting conditions
- ✅ Uses same camera (iPhone) as app
- ✅ Most relevant angles and distances

### Steps:

1. **Visit each landmark** with your iPhone

2. **Take 20-30 photos** from different:
   - Distances: close (5m), medium (20m), far (50m)
   - Angles: front, sides, corners
   - Heights: eye level, low angle, slightly elevated
   - Times: morning, afternoon, evening (if possible)

3. **Export from iPhone** to computer
   ```bash
   # Use AirDrop, iCloud Photos, or USB cable
   ```

4. **Organize into folders**
   ```bash
   ml_training/data/train/grossmunster/
   ├── grossmunster_iphone_close_001.jpg
   ├── grossmunster_iphone_medium_002.jpg
   └── ...
   ```

### Photo Guidelines:
- ✅ Clear, focused images
- ✅ Landmark is primary subject
- ✅ Good lighting (not too dark/bright)
- ✅ Minimal obstructions (people, cars OK)
- ❌ Avoid extreme blur, dark, or overexposed images

---

## Folder Structure

Your training data should look like this:

```
ml_training/data/train/
├── grossmunster/
│   ├── grossmunster_001.jpg
│   ├── grossmunster_002.jpg
│   ├── grossmunster_003.jpg
│   └── ... (20-50 images)
├── fraumunster/
│   ├── fraumunster_001.jpg
│   ├── fraumunster_002.jpg
│   └── ... (20-50 images)
├── bahnhofstrasse/
│   ├── bahnhofstrasse_001.jpg
│   └── ... (20-50 images)
└── ... (all other landmarks)
```

---

## Image Quality Checklist

For each landmark, ensure:

### Diversity
- [ ] Multiple angles (front, side, corner)
- [ ] Multiple distances (close, medium, far)
- [ ] Different lighting (bright, shade, cloudy)
- [ ] Different times of day (if possible)

### Quality
- [ ] Resolution: Minimum 500x500px
- [ ] Format: JPG or PNG
- [ ] Clear and focused (not blurry)
- [ ] Landmark is recognizable
- [ ] Good exposure (not too dark/bright)

### Relevance
- [ ] Shows the actual landmark
- [ ] Landmark is primary subject
- [ ] Recent photos (not historical)
- [ ] Realistic view (not artistic filters)

---

## Batch Processing Tips

### Rename Multiple Files at Once

**macOS:**
```bash
# In Finder, select files, right-click → Rename
# Choose format: "Name and Index"
# New name: grossmunster
# Result: grossmunster 1.jpg, grossmunster 2.jpg, ...
```

**Linux/macOS Terminal:**
```bash
cd ml_training/data/train/grossmunster/
counter=1
for file in *.jpg; do
  mv "$file" "grossmunster_$(printf %03d $counter).jpg"
  ((counter++))
done
```

### Resize Images (Optional)

If images are too large (>5MB each):

```bash
# Install ImageMagick
brew install imagemagick  # macOS
sudo apt install imagemagick  # Linux

# Resize all images in a folder
cd ml_training/data/train/grossmunster/
mogrify -resize 1024x1024\> -quality 85 *.jpg
```

---

## Prioritize These Landmarks

Start with the most famous/recognizable landmarks:

### Tier 1: Must Have (Essential)
1. Grossmünster
2. Fraumünster
3. Bahnhofstrasse
4. Lindenhof
5. Lake Zurich
6. Uetliberg
7. Zürich HB (Main Station)
8. ETH Zurich Main Building
9. National Museum
10. Chinese Garden

### Tier 2: Important (Recommended)
11. Paradeplatz
12. Limmatquai
13. Niederdorf
14. St. Peter Church
15. Prime Tower
16. Zürich Opera House

### Tier 3: Nice to Have (Optional)
- Other landmarks with lower foot traffic
- Specialized locations
- Regional attractions outside Zurich center

---

## How Many Images Do I Need?

### Absolute Minimum (Will Work, But Limited)
- **5-10 images per landmark**
- Model will be usable but less accurate
- Good for initial testing

### Recommended (Good Accuracy)
- **20-30 images per landmark**
- Model will perform well in most conditions
- Suitable for production use

### Ideal (Best Results)
- **50-100 images per landmark**
- High accuracy across all conditions
- Professional quality

### Reality Check
- **108 landmarks × 20 images = 2,160 images total**
- At 2 minutes per landmark = ~4 hours of work
- Consider focusing on Tier 1 & 2 landmarks first (30 landmarks = ~1 hour)

---

## Quick Collection Workflow

### Efficient Process (Recommended):

1. **Day 1: Top 10 Landmarks** (1-2 hours)
   - Collect 30 images each for most famous landmarks
   - Use Google Images + Unsplash
   - ~300 images total

2. **Day 2: Next 20 Landmarks** (2-3 hours)
   - Collect 20 images each
   - ~400 images total

3. **Train Initial Model**
   - Test with 30 landmarks
   - Evaluate performance

4. **Day 3: Fill Gaps** (1-2 hours)
   - Add images for poorly performing landmarks
   - Retrain

5. **Optional: Field Photos**
   - Visit landmarks and take iPhone photos
   - Add to training data
   - Final retraining

---

## Example: Collecting for Grossmünster

### Step-by-Step Example:

1. **Google Images**: 15 images
   - Search "Grossmünster Zurich"
   - Download various angles

2. **Unsplash**: 5 images
   - Search "Grossmünster"
   - Professional quality

3. **Own Photos**: 10 images (if available)
   - Visit landmark
   - Take photos with iPhone

**Total**: 30 images ✅

Save to: `ml_training/data/train/grossmunster/`

---

## After Collection

### Verify Your Dataset

```bash
# Count images per landmark
cd ml_training/data/train
for dir in */; do
  count=$(ls "$dir"*.jpg 2>/dev/null | wc -l)
  echo "$dir: $count images"
done
```

### Expected Output:
```
grossmunster/: 30 images
fraumunster/: 25 images
bahnhofstrasse/: 20 images
...
```

### Then Train:
```bash
cd /home/user/prototype/ml_training
source venv/bin/activate
python scripts/train_model.py
```

---

## Troubleshooting

### "Not enough images for training"
- **Minimum**: 5 images per landmark
- **Solution**: Add more images or remove landmarks with <5 images

### "Poor recognition accuracy"
- **Cause**: Not enough diverse images
- **Solution**: Add images from different angles/lighting

### "Model too large"
- **Cause**: Too many high-res images
- **Solution**: Resize images to 1024x1024px max

---

## Time-Saving Tips

1. **Focus on quality over quantity**
   - 20 good images > 50 mediocre images

2. **Use image search filters**
   - Size: Large (>1024px)
   - License: Creative Commons

3. **Batch download browser extensions**
   - Download All Images (Chrome extension)
   - Bulk Image Downloader

4. **Start with famous landmarks**
   - More images available online
   - Easier to find

5. **Consider buying a dataset**
   - Some sites sell landmark photo collections
   - Can save significant time

---

## Legal Considerations

### Use Images With Proper Licenses:
- ✅ Creative Commons (CC0, CC-BY)
- ✅ Public Domain
- ✅ Royalty-free stock photos
- ✅ Your own photos
- ❌ Copyrighted images without permission
- ❌ Personal photos from social media without permission

### For Personal/Educational Use:
- Generally safe for learning/testing
- Be cautious with commercial deployment

---

## Summary

### Quick Start Checklist:
- [ ] Choose collection method (Google Images recommended)
- [ ] Create folder structure in `ml_training/data/train/`
- [ ] Collect 20-30 images per landmark
- [ ] Organize into class folders
- [ ] Verify image count
- [ ] Run training script

### Next Steps:
```bash
# After collecting images
cd ml_training
source venv/bin/activate
python scripts/train_model.py
```

Good luck with your image collection! 🚀
