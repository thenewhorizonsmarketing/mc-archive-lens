# Clue Board Testing Suite

This directory contains comprehensive tests and validation tools for the 3D Clue Board Homepage feature.

## Test Files

### 1. `performance.test.ts`
Automated performance tests covering CSS optimizations, GPU acceleration, and zoom animation performance.

**Run tests:**
```bash
npm test -- src/components/clue-board/__tests__/performance.test.ts --run
```

**Coverage:**
- CSS Containment (5 tests)
- GPU Acceleration (5 tests)
- Will-Change Hints (3 tests)
- Performance Targets (2 tests)
- Responsive Performance Scaling (2 tests)
- Zoom Animation Performance (6 tests)

**Total:** 23 tests

### 2. `navigation.test.tsx`
Tests for navigation functionality and room card interactions.

**Run tests:**
```bash
npm test -- src/components/clue-board/__tests__/navigation.test.tsx --run
```

### 3. `validation.test.tsx`
Validation tests for component structure and accessibility.

**Run tests:**
```bash
npm test -- src/components/clue-board/__tests__/validation.test.tsx --run
```

## Manual Testing Tools

### 1. `ZoomPerformanceTest.tsx`
Interactive component for manual performance validation.

**Usage:**
```tsx
import { ZoomPerformanceTest } from './components/clue-board/__tests__/ZoomPerformanceTest';

function TestPage() {
  return <ZoomPerformanceTest />;
}
```

**Features:**
- Real-time FPS monitoring
- Automatic performance recording
- Visual test results with pass/fail indicators
- Test controls and instructions

**How to use:**
1. Import and render the component
2. Click any room card to trigger zoom
3. Test automatically records FPS during animation
4. Results display after 1 second
5. Check for "✓ PASS: Smooth 60fps animation"

### 2. Performance Monitor
Built-in performance monitor for live FPS tracking.

**Usage:**
```tsx
<ClueBoard showPerformanceMonitor={true}>
  <CentralBranding />
  <RoomCardGrid rooms={rooms} />
</ClueBoard>
```

**Displays:**
- Current FPS (color-coded: green ≥55, yellow 45-54, red <45)
- Frame time in milliseconds
- Memory usage (Chrome only)
- Visual progress bar

## Documentation

### 1. `ZOOM_PERFORMANCE_VALIDATION.md`
Comprehensive guide for validating 60fps zoom animation performance.

**Contents:**
- Performance targets and acceptable ranges
- Automated test instructions
- 4 manual validation methods
- Browser DevTools usage guide
- Performance optimization details
- Troubleshooting guide
- Browser compatibility matrix
- Success criteria checklist

### 2. `ZOOM_PERFORMANCE_SUMMARY.md`
Implementation summary and completion report.

**Contents:**
- Task completion status
- Implementation overview
- Performance optimizations verified
- Test results
- Validation methods
- Browser compatibility
- Success criteria
- Technical details

### 3. `TESTING_CHECKLIST.md`
Complete testing checklist for all Clue Board features.

### 4. `VALIDATION_SUMMARY.md`
Overall validation summary for the entire feature.

### 5. `PERFORMANCE_REPORT.md`
Detailed performance analysis and metrics.

### 6. `ACCESSIBILITY_REPORT.md`
Accessibility compliance report (WCAG 2.1 AA).

### 7. `NAVIGATION_VERIFICATION.md`
Navigation functionality verification report.

### 8. `BROWSER_COMPATIBILITY.md`
Cross-browser compatibility test results.

## Quick Start

### Run All Tests
```bash
npm test -- src/components/clue-board/__tests__ --run
```

### Verify Zoom Performance (Quick)
```bash
npm test -- src/components/clue-board/__tests__/performance.test.ts --run
```

Expected output: ✓ 23 tests passing

### Visual Performance Check
1. Enable performance monitor in your app:
   ```tsx
   <ClueBoard showPerformanceMonitor={true}>
   ```
2. Click any room card
3. Observe FPS counter stays green (55-60) during zoom

### Comprehensive Performance Test
1. Import `ZoomPerformanceTest` component
2. Render in a test page
3. Click each room card
4. Review automated test results
5. Verify Min FPS ≥ 55, Frame Drops = 0

## Performance Targets

| Metric | Target | Acceptable | Warning | Fail |
|--------|--------|------------|---------|------|
| FPS | 60 | 55-60 | 45-54 | <45 |
| Frame Time | 16.67ms | <18ms | <22ms | ≥22ms |
| Animation Duration | 650ms | 600-700ms | 500-800ms | Other |
| Frame Drops | 0 | 0-2 | 3-5 | >5 |

## Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✅ Tested |
| Firefox | 103+ | ✅ Tested |
| Safari | 15.4+ | ✅ Tested |
| Edge | 88+ | ✅ Tested |

## Success Criteria

✅ All automated tests pass (23/23)  
✅ FPS stays above 55 during zoom  
✅ No visible stuttering or frame drops  
✅ Smooth acceleration and deceleration  
✅ Sibling cards fade smoothly  
✅ Animation completes in 650ms  
✅ Navigation triggers after animation  
✅ Works in all supported browsers  
✅ Reduced motion preference respected  

## Troubleshooting

### Tests Failing
1. Check that all dependencies are installed: `npm install`
2. Verify Framer Motion is installed: `npm list framer-motion`
3. Clear test cache: `npm test -- --clearCache`

### Low FPS in Manual Tests
1. Check browser hardware acceleration is enabled
2. Close other tabs/applications
3. Test on target hardware (kiosk device)
4. Review `ZOOM_PERFORMANCE_VALIDATION.md` troubleshooting section

### Performance Monitor Not Showing
1. Verify `showPerformanceMonitor={true}` prop is set
2. Check browser console for errors
3. Ensure component is properly imported

## Additional Resources

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment)
- [GPU Acceleration](https://developer.mozilla.org/en-US/docs/Web/Performance/CSS_JavaScript_animation_performance)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Contact

For questions or issues with the testing suite, refer to the comprehensive documentation in this directory or consult the main project README.
