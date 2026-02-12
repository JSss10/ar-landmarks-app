# Testing Your Landmark Recognition Model

This guide explains how to test your landmark recognition model effectively, starting with screen-based testing and progressing to real-world validation.

## Testing Strategy

### Phase 1: Screen-Based Testing (Recommended First)
Test with images displayed on a screen or TV before going to physical locations.

### Phase 2: Real-World Testing
Test at actual landmark locations for production validation.

---

## Phase 1: Screen-Based Testing

### Why Test with Screens First?

✅ **Advantages:**
- **Controlled Environment** - Test indoors without weather/lighting issues
- **Quick Iteration** - Test all landmarks in minutes
- **Reproducible** - Use same images to compare model versions
- **Convenient** - No need to travel to landmark locations
- **Safe Development** - Verify model works before field testing

⚠️ **Limitations:**
- Screen brightness/quality affects recognition
- May not catch real-world lighting issues
- Distance/angle more limited than real world
- Color reproduction differs from reality

### Setup Instructions

#### 1. Collect Test Images

Run the test image collection script:

```bash
cd ml_training
source venv/bin/activate
python scripts/collect_test_images.py
```

This creates: `ml_training/test_images/` with reference photos of each landmark.

**Alternative:** Use Google Images to find landmark photos manually.

#### 2. Display Images on Screen

**Option A: Computer Monitor**
- Open images in full-screen mode
- Use macOS Preview, Windows Photos, or any image viewer
- Press `F` for full-screen

**Option B: TV/Large Display**
- Transfer images to Apple TV, Chromecast, or HDMI-connected laptop
- Use TV's photo viewer app
- Larger display = easier testing from various distances

#### 3. Test with Your iPhone

1. **Build and run** your iOS app in Xcode
2. **Enable Visual Recognition mode** in the app
3. **Point camera at screen** showing landmark image
4. **Observe recognition results**:
   - Landmark name should appear
   - Confidence score displayed
   - Detail overlay shown

### Best Practices for Screen Testing

#### Screen Setup
- ✅ **Brightness**: Set to 80-100% for clear visibility
- ✅ **Size**: Full-screen images work best
- ✅ **Quality**: Use high-resolution images (1920x1080+)
- ✅ **Clean**: Wipe screen to remove glare/fingerprints
- ❌ **Avoid**: Don't use phone screen (too small)

#### Camera Position
- **Distance**: 30-60 cm (1-2 feet) from screen
- **Angle**: Directly facing screen (not tilted)
- **Lighting**: Moderate room lighting (not too dark/bright)
- **Stability**: Hold phone steady for 2-3 seconds

#### Testing Tips

1. **Test Each Landmark** - Go through all landmarks systematically
2. **Try Multiple Images** - Use 3-5 different photos per landmark
3. **Vary Angles** - Tilt phone slightly to test different viewpoints
4. **Check Confidence** - Should be >0.75 for good recognition
5. **Note Failures** - Document which landmarks aren't recognized

### Expected Results

#### Good Recognition
- ✅ Landmark identified within 1-2 seconds
- ✅ Confidence score: 0.75 - 1.0
- ✅ Correct landmark name displayed
- ✅ Consistent across multiple images

#### Poor Recognition
- ❌ Wrong landmark identified
- ❌ Confidence score: <0.60
- ❌ No recognition after 5 seconds
- ❌ Inconsistent results

**If recognition is poor:**
1. Add more training images for that landmark
2. Ensure training images are high quality
3. Retrain the model
4. Test again

### Testing Checklist

Use this checklist to test systematically:

```
[ ] Model loaded successfully in app
[ ] Visual Recognition mode activated
[ ] Camera permission granted

For each landmark:
[ ] Recognition works with at least 3 different images
[ ] Confidence score >0.75
[ ] Correct landmark name displayed
[ ] Recognition consistent (same result each time)
[ ] Detail overlay appears correctly

Common scenarios:
[ ] Works in bright room lighting
[ ] Works in dim room lighting
[ ] Works from 30cm distance
[ ] Works from 60cm distance
[ ] Works with slight phone tilt (±15°)
```

---

## Phase 2: Real-World Testing

Once screen testing shows good results (70%+ recognition rate), test in the real world.

### Real-World Testing Setup

1. **Plan Your Route** - Visit 5-10 landmarks in one trip
2. **Check Weather** - Test in good weather first
3. **Bring Backup Power** - External battery for iPhone
4. **Note Time of Day** - Lighting affects recognition

### Real-World Testing Process

At each landmark:

1. **Open the app** in Visual Recognition mode
2. **Point camera at landmark** from various positions:
   - Close-up (5-10 meters)
   - Medium distance (20-30 meters)
   - Far distance (50+ meters)
3. **Try different angles**:
   - Front view
   - Side angles
   - From across the street
4. **Test in different lighting**:
   - Direct sunlight
   - Shade
   - Cloudy conditions
5. **Document results**:
   - Screenshot when recognized
   - Note GPS location
   - Record lighting conditions

### Common Real-World Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Not recognized at all | Too far away | Get closer (within 30m) |
| Wrong landmark recognized | Similar architecture | Add more training images |
| Works in training, not real life | Training images too different | Add real iPhone photos to training |
| Only works at one angle | Limited training angles | Add diverse viewpoint images |
| Fails in bright sun | Overexposed images | Test in shade or add bright training images |

### Comparing Screen vs Real-World

You'll likely see these differences:

| Aspect | Screen Testing | Real-World |
|--------|---------------|------------|
| **Recognition Rate** | 80-90% | 65-85% |
| **Confidence Scores** | Higher (0.85+) | Lower (0.70-0.80) |
| **Speed** | Faster | Slightly slower |
| **Consistency** | Very consistent | More variable |

**This is normal!** Real-world conditions are more challenging.

---

## Improving Recognition

### If Screen Testing Works but Real-World Doesn't

1. **Add Real Photos to Training**
   - Take 20-30 photos with your iPhone at each landmark
   - Include various angles, distances, lighting
   - Add to `ml_training/data/train/[landmark_name]/`
   - Retrain model

2. **Capture Challenging Conditions**
   - Bright sunlight
   - Shadows
   - Crowds
   - Partial views
   - Different seasons

3. **Test-Train-Test Cycle**
   - Test in real world → identify failures
   - Add photos of failed cases → retrain
   - Test again → repeat until accurate

### Data Collection Tips

When taking photos for training:

```bash
# Create landmark directory if needed
mkdir -p ml_training/data/train/grossmunster

# Take photos and save to this directory
# Use descriptive names: grossmunster_closeup_001.jpg
```

**Photo Guidelines:**
- 20-50 photos per landmark minimum
- Mix of close-up and distant shots
- Different times of day
- Different weather conditions
- JPG format, 500x500px minimum

---

## Advanced Testing

### Confidence Threshold Tuning

The default confidence threshold is 0.75. You can adjust in VisionService.swift:300

```swift
// VisionService.swift
private let minimumConfidence: Float = 0.75  // Try: 0.70, 0.65, 0.80
```

**Lower threshold (0.65-0.70):**
- ✅ More recognitions
- ❌ More false positives

**Higher threshold (0.80-0.85):**
- ✅ More accurate
- ❌ Fewer recognitions

### A/B Testing Models

Compare different model versions:

1. Train model with different hyperparameters
2. Save as `model_v1.mlmodel`, `model_v2.mlmodel`
3. Test both on same image set
4. Choose the better performing model

### Automated Testing

For regression testing, create a test script:

```python
# scripts/test_model.py
# Automatically test model on reference images
# Outputs accuracy report
```

---

## Troubleshooting

### App crashes when using camera
- **Cause**: Camera permissions not granted
- **Fix**: Settings → Privacy → Camera → Enable for your app

### Model not loading
- **Cause**: Model file not in Xcode project
- **Fix**: Run `ml_training/scripts/copy_model_to_xcode.sh`

### Recognition too slow
- **Cause**: Processing throttle too aggressive
- **Fix**: Reduce `lastProcessingTime` interval in VisionService.swift:301

### No recognition at all
- **Cause**: Confidence threshold too high
- **Fix**: Lower threshold to 0.65 temporarily for testing

### Multiple rapid recognitions
- **Cause**: Throttle too short
- **Fix**: Increase `lastProcessingTime` interval

---

## Testing Log Template

Keep track of your testing sessions:

```markdown
## Test Session: [Date]

### Setup
- Model Version: v1.0
- iPhone Model: iPhone 14 Pro
- iOS Version: 17.2
- Testing Location: [Home/Office/Field]

### Screen Testing Results

| Landmark | Images Tested | Recognized | Avg Confidence | Notes |
|----------|---------------|------------|----------------|-------|
| Grossmünster | 5 | 5/5 | 0.89 | Perfect |
| Fraumünster | 5 | 4/5 | 0.82 | One image too dark |
| ... | | | | |

**Overall Screen Accuracy**: 45/50 = 90%

### Real-World Testing Results

| Landmark | Location | Lighting | Distance | Recognized | Confidence | Notes |
|----------|----------|----------|----------|------------|------------|-------|
| Grossmünster | Front entrance | Sunny | 20m | Yes | 0.78 | Good |
| Fraumünster | Side view | Shade | 15m | No | - | Need more angles |
| ... | | | | | | |

**Overall Real-World Accuracy**: 8/12 = 67%

### Action Items
- [ ] Add more training images for Fraumünster (side angles)
- [ ] Retrain model with new images
- [ ] Retest failed cases
```

---

## Summary

### Testing Workflow

1. ✅ **Screen Testing First** (1-2 hours)
   - Quick validation
   - Test all landmarks
   - Identify obvious issues

2. ✅ **Iterate on Model** (if needed)
   - Add more training data
   - Retrain
   - Retest on screen

3. ✅ **Real-World Testing** (half day)
   - Visit actual landmarks
   - Test in various conditions
   - Document failures

4. ✅ **Final Iteration**
   - Add real-world photos to training
   - Retrain final model
   - Deploy to production

### Success Criteria

**Ready for Production:**
- ✅ Screen testing: 85%+ recognition rate
- ✅ Real-world testing: 70%+ recognition rate
- ✅ Average confidence: >0.75
- ✅ Recognition speed: <2 seconds
- ✅ No crashes or major bugs

**Needs More Work:**
- ❌ Screen testing: <70% recognition
- ❌ Real-world testing: <50% recognition
- ❌ Frequent wrong classifications
- ❌ Long recognition delays (>5 seconds)

---

## Quick Reference

### Commands

```bash
# Collect test images
python ml_training/scripts/collect_test_images.py

# Retrain model after adding images
./ml_training/train_pipeline.sh

# Test specific landmark
# (Use app in Visual Recognition mode)
```

### Key Files

- Test images: `ml_training/test_images/`
- Training data: `ml_training/data/train/`
- Model: `ios/ARLandmarks/ARLandmarks/Models/LandmarkClassifier.mlmodel`
- Config: `ios/ARLandmarks/ARLandmarks/Services/VisionService.swift`

### Support

Questions? Check:
- Main README: `ml_training/README.md`
- Quick Start: `ml_training/QUICKSTART.md`
- This guide: `ml_training/TESTING_GUIDE.md`

Good luck with testing! 🎉
