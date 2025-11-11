# Clue Board Performance Testing Guide

## Overview
This guide helps verify that the 3D Clue Board homepage meets the 60 FPS performance target during animations.

## Performance Optimizations Applied

### CSS Containment
- ✅ `contain: layout style paint` added to `.room-card`
- ✅ `contain: layout style paint` added to `.clue-board`
- ✅ `contain: layout style paint` added to `.central-branding`
- ✅ `contain: layout style paint` added to `.board-frame`
- ✅ `contain: layout style` added to `.room-card-grid`

### GPU Acceleration
- ✅ `transform: translateZ(0)` added to force GPU layers on:
  - `.room-card`
  - `.clue-board`
  - `.branding-inset`
  - `.board-frame`
  - `.room-card-grid`

### Will-Change Hints
- ✅ `will-change: transform` added to animated elements:
  - `.room-card`
  - `.card-shine`
  - `.central-branding`

## Testing Instructions

### 1. Enable Performance Monitor

To enable the visual performance monitor overlay, update `HomePage.tsx`:

```tsx
<ClueBoard showPerformanceMonitor={true}>
  {/* ... */}
</ClueBoard>
```

The monitor will display in the top-right corner showing:
- Current FPS (target: 60 FPS)
- Frame time (target: ~16.67ms)
- Memory usage (Chrome only)

### 2. Manual Testing Checklist

#### Hover Animations
- [ ] Hover over each room card
- [ ] Verify FPS stays above 55 (green indicator)
- [ ] Check that lift and scale animations are smooth
- [ ] Verify shine effect animates smoothly

#### Zoom Animations
- [ ] Click on a room card to trigger zoom
- [ ] Monitor FPS during the 600ms zoom animation
- [ ] Verify FPS stays above 55 during zoom
- [ ] Check that sibling cards fade smoothly
- [ ] Verify no frame drops or stuttering

#### Memory Usage
- [ ] Monitor memory usage before interactions
- [ ] Perform multiple zoom animations
- [ ] Check for memory leaks (memory should stabilize)
- [ ] Verify memory doesn't continuously increase

### 3. Browser DevTools Testing

#### Chrome DevTools Performance
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with room cards (hover, click)
5. Stop recording
6. Analyze:
   - FPS should be consistently 60
   - No long tasks (>50ms)
   - GPU activity should show hardware acceleration

#### Chrome DevTools Rendering
1. Open DevTools (F12)
2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
3. Type "Show Rendering"
4. Enable "Frame Rendering Stats"
5. Enable "Paint flashing" to see repaint areas
6. Interact with cards and verify minimal repaints

### 4. Performance Metrics Targets

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| FPS | 60 | 55-59 | <55 |
| Frame Time | 16.67ms | <18ms | >18ms |
| Memory (Initial) | <50MB | <100MB | >100MB |
| Memory (After 10 interactions) | Stable | +10MB | +50MB |

### 5. Device Testing

#### Desktop (Primary Target)
- [ ] Test on Chrome 88+
- [ ] Test on Firefox 103+
- [ ] Test on Safari 15.4+
- [ ] Verify 60 FPS on all browsers

#### Tablet (Secondary Target)
- [ ] Test on iPad (Safari)
- [ ] Test on Android tablet (Chrome)
- [ ] Verify smooth animations (may be 55+ FPS)

#### Kiosk Hardware (Primary Target)
- [ ] Test on actual kiosk hardware
- [ ] Verify 60 FPS during all interactions
- [ ] Test touch interactions
- [ ] Verify no lag or stuttering

### 6. Optimization Verification

Run this checklist to verify optimizations are active:

```javascript
// In browser console, inspect a room card element
const card = document.querySelector('.room-card');
const styles = window.getComputedStyle(card);

// Verify optimizations
console.log('contain:', styles.contain); // Should include "layout style paint"
console.log('will-change:', styles.willChange); // Should be "transform"
console.log('transform:', styles.transform); // Should include translateZ
```

### 7. Known Performance Considerations

#### Backdrop Filter
- `backdrop-filter: blur()` is GPU-intensive
- Reduced blur on mobile (10px → 6px → 5px)
- Consider disabling on low-end devices if needed

#### Multi-Layer Shadows
- Multiple box-shadows can impact performance
- Reduced shadow complexity on mobile
- GPU acceleration helps mitigate this

#### 3D Transforms
- `transform-style: preserve-3d` creates stacking contexts
- All cards use GPU layers to optimize rendering
- Perspective reduced on smaller screens

## Troubleshooting

### FPS Below 55
1. Check if backdrop-filter is supported and hardware-accelerated
2. Verify GPU acceleration is enabled in browser
3. Reduce blur amount in CSS
4. Disable shine effect animation
5. Simplify box-shadows

### Memory Leaks
1. Check for event listener cleanup
2. Verify Framer Motion animations complete
3. Monitor React component unmounting
4. Check for retained DOM references

### Stuttering on Zoom
1. Verify `will-change: transform` is applied
2. Check for layout thrashing (forced reflows)
3. Ensure animations use transform/opacity only
4. Verify no JavaScript blocking during animation

## Performance Test Results

### Test Date: [To be filled during testing]

| Test | Result | FPS | Notes |
|------|--------|-----|-------|
| Hover Animation | ⬜ Pass / ⬜ Fail | ___ | |
| Zoom Animation | ⬜ Pass / ⬜ Fail | ___ | |
| Sibling Fade | ⬜ Pass / ⬜ Fail | ___ | |
| Memory Stability | ⬜ Pass / ⬜ Fail | ___ | |
| Kiosk Hardware | ⬜ Pass / ⬜ Fail | ___ | |

### Recommendations
[To be filled after testing]

## Conclusion

The Clue Board homepage has been optimized with:
- CSS containment for layout isolation
- GPU acceleration via translateZ(0)
- Will-change hints for animated properties
- Responsive performance scaling for different devices

Target: **60 FPS** on kiosk hardware during all animations.
