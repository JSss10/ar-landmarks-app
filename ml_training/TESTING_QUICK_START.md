# Quick Start: Testing Your Model

## TL;DR - Start Testing in 5 Minutes

### 1. Collect Test Images (2 minutes)

```bash
cd ml_training
source venv/bin/activate
python scripts/collect_test_images.py
```

### 2. Display on Screen

Open in browser:
```bash
open ml_training/test_images/test_viewer.html
```

Press `F` for fullscreen, use `←` `→` to navigate.

### 3. Test with iPhone

1. Build & run your iOS app
2. Enable "Visual Recognition" mode
3. Point camera at screen (30-60cm distance)
4. Watch for landmark recognition!

---

## What to Expect

### ✅ Good Recognition
- Landmark identified in 1-2 seconds
- Confidence score: 0.75+
- Correct name displayed
- Detail overlay appears

### ❌ Poor Recognition
- No recognition after 5 seconds
- Wrong landmark identified
- Confidence score: <0.60

**If recognition fails:** Add more training images for that landmark and retrain.

---

## Screen Testing Tips

| Setting | Recommendation |
|---------|----------------|
| Screen brightness | 80-100% |
| Distance | 30-60 cm (1-2 feet) |
| Angle | Directly facing |
| Room lighting | Moderate (not dark) |
| Hold phone | Steady for 2-3 seconds |

---

## Quick Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| No recognition at all | Check confidence threshold in VisionService.swift:300 |
| Wrong landmarks | Add more training images, retrain |
| App crashes | Check camera permissions in Settings |
| Too slow | Adjust processing throttle in VisionService.swift:301 |

---

## Testing Workflow

```
Screen Test → Note Failures → Add Training Images → Retrain → Screen Test Again → Real World Test
```

---

## When Ready for Real World

Once screen testing shows **80%+ recognition rate**, test at actual landmarks:

1. Visit 5-10 landmarks
2. Test from different distances (5m, 20m, 50m)
3. Try different angles
4. Test in various lighting conditions
5. Document what fails

Add photos of failed cases to training data and retrain.

---

## Success Criteria

**Ready for Production:**
- ✅ Screen: 85%+ recognition
- ✅ Real world: 70%+ recognition
- ✅ Confidence: 0.75+ average
- ✅ Speed: <2 seconds

---

## Full Documentation

- **Complete testing guide**: `TESTING_GUIDE.md`
- **Training pipeline**: `README.md`
- **Quick setup**: `QUICKSTART.md`

---

**Need help?** See `TESTING_GUIDE.md` for detailed instructions and troubleshooting.
