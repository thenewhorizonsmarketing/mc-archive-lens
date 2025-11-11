# FPS Performance Validation

## Overview

This document describes the FPS (Frames Per Second) performance validation system for the 3D Clue Board Kiosk application. The system ensures that the application maintains smooth 60 FPS performance (with a minimum acceptable threshold of 55 FPS) across all interaction scenarios.

## Performance Requirements

### Target Performance
- **Target FPS**: 60 FPS
- **Minimum Acceptable**: 55 FPS
- **Measurement Duration**: 2-5 seconds per scenario
- **Sample Rate**: Every frame

### Success Criteria

The application must maintain ≥55 FPS during:
1. Idle state
2. Navigation transitions
3. Attract mode animations
4. Room tile interactions
5. Admin overlay display
6. Multiple simultaneous animations
7. Glassmorphism effects
8. Heavy DOM manipulation
9. Scroll operations

## Validation System

### FPS Monitor

The `FPSMonitor` class provides accurate frame rate measurement:

```typescript
class FPSMonitor {
  start(): void
  stop(): FPSMetrics
  measureScenario(scenario: string, duration: number, action?: () => void): Promise<FPSMetrics>
}
```

### Metrics Collected

For each scenario, the following metrics are collected:

- **Minimum FPS**: Lowest frame rate observed
- **Maximum FPS**: Highest frame rate observed
- **Average FPS**: Mean frame rate across all samples
- **Sample Count**: Number of frames measured
- **Scenario Name**: Description of the test scenario

## Test Scenarios

### 1. Idle State (3 seconds)
Tests baseline performance with no user interaction.

**Expected**: ≥55 FPS minimum, ~60 FPS average

### 2. Continuous Rendering (5 seconds)
Tests sustained rendering performance with regular DOM updates.

**Expected**: ≥55 FPS minimum throughout

### 3. Navigation Transition (2 seconds)
Simulates the 500-700ms camera dolly transition with CSS transforms.

**Expected**: ≥55 FPS during transition animation

### 4. Attract Mode Animation (4 seconds)
Tests the gentle breathing tilt effect that plays after 45s idle.

**Expected**: ≥55 FPS with continuous subtle animations

### 5. Multiple Animations (3 seconds)
Tests performance with 8 simultaneous room tile animations.

**Expected**: ≥55 FPS with multiple concurrent transforms

### 6. Glassmorphism Effects (3 seconds)
Tests backdrop-filter blur and transparency effects.

**Expected**: ≥55 FPS with GPU-accelerated effects

### 7. Heavy DOM Manipulation (2 seconds)
Tests performance during rapid element creation/removal.

**Expected**: ≥55 FPS during DOM churn

### 8. Scroll Simulation (2 seconds)
Tests performance during smooth scrolling operations.

**Expected**: ≥55 FPS during scroll

## Running Validation

### Automated Test Suite

Run the complete FPS validation suite:

```bash
npm run test:e2e -- fps-performance.test.ts
```

### Validation Script

Run the comprehensive validation script:

```bash
node scripts/validate-fps-performance.js
```

Or on Windows:

```bash
node scripts\validate-fps-performance.js
```

### Manual Testing

For manual FPS monitoring:

1. Open the application in development mode
2. Open Chrome DevTools (F12)
3. Go to Performance tab
4. Click "Record" button
5. Perform interactions
6. Stop recording
7. Review FPS chart in timeline

## Performance Optimization

### If FPS Falls Below 55

1. **Reduce Animation Complexity**
   - Simplify CSS transforms
   - Reduce number of animated properties
   - Use `will-change` sparingly

2. **Optimize Rendering**
   - Enable GPU acceleration with `transform: translateZ(0)`
   - Use `contain: layout style paint`
   - Minimize repaints and reflows

3. **Reduce Draw Calls**
   - Batch DOM updates
   - Use `requestAnimationFrame` for animations
   - Minimize layout thrashing

4. **Optimize Assets**
   - Compress textures
   - Reduce polygon counts
   - Use texture atlases

5. **Motion Tier System**
   - Automatically downgrade to "lite" tier if FPS < 55
   - Disable non-essential animations
   - Reduce visual complexity

## Hardware Considerations

### Target Hardware Specifications

- **CPU**: Intel i5 or equivalent
- **GPU**: Integrated graphics with WebGL 2.0 support
- **RAM**: 8GB minimum
- **Display**: 4K touchscreen (3840x2160)
- **OS**: Windows 10/11

### Performance Tiers

The application automatically adjusts performance based on hardware:

**Full Tier** (GPU score ≥ 0.7)
- All animations enabled
- Board tilt + parallax
- Emissive pulses
- Full glassmorphism effects

**Lite Tier** (GPU score 0.4-0.7)
- Parallax only
- No board tilt
- Reduced effects

**Static Tier** (GPU score < 0.4)
- Cross-fade highlights only
- Minimal animations
- 2D fallback mode

## Monitoring in Production

### Performance Monitor Component

The `PerformanceMonitor` component tracks FPS in real-time:

```typescript
import { PerformanceMonitor } from '@/components/system/PerformanceMonitor';

// Automatically downgrades motion tier if FPS drops below 55 for 3 seconds
<PerformanceMonitor />
```

### Admin Overlay

Access performance metrics via admin overlay:

1. Tap and hold upper-left corner for 3 seconds
2. Enter PIN (default: 1234)
3. View real-time FPS, draw calls, and memory usage

## Troubleshooting

### Common Performance Issues

**Issue**: FPS drops during transitions
- **Solution**: Reduce transition duration or simplify animations

**Issue**: FPS drops with multiple cards visible
- **Solution**: Enable frustum culling, use instanced rendering

**Issue**: FPS drops on integrated graphics
- **Solution**: System automatically downgrades to lite/static tier

**Issue**: FPS drops after extended use
- **Solution**: Check for memory leaks, ensure proper cleanup

### Debug Mode

Enable FPS display in development:

```typescript
// In src/App.tsx
<PerformanceMonitor showFPS={true} />
```

## Validation Results

### Expected Output

```
🎯 Starting FPS Performance Validation
Target: 60 FPS | Minimum Acceptable: 55 FPS

📊 FPS Performance Summary
════════════════════════════════════════════════════════════════════════════════
✅ 🎯 Idle State (3 seconds)
   Min: 59.2 FPS | Avg: 60.1 FPS | Max: 60.8 FPS
   Samples: 180

✅ 🎯 Continuous Rendering (5 seconds)
   Min: 57.8 FPS | Avg: 59.4 FPS | Max: 60.5 FPS
   Samples: 300

✅ 🎯 Navigation Transition (2 seconds)
   Min: 56.1 FPS | Avg: 58.9 FPS | Max: 60.2 FPS
   Samples: 120

... (additional scenarios)

📈 Overall Performance:
   Minimum FPS across all scenarios: 56.1 FPS
   Average FPS across all scenarios: 59.2 FPS
   Status: ✅ PASSED
```

## Continuous Monitoring

### Automated Checks

FPS validation runs automatically:
- Before each deployment
- After major code changes
- During CI/CD pipeline

### Performance Regression Detection

If FPS drops below threshold:
1. Build fails in CI/CD
2. Alert sent to development team
3. Performance report generated
4. Optimization required before merge

## Best Practices

1. **Test on Target Hardware**: Always validate on actual kiosk hardware
2. **Test All Scenarios**: Run complete test suite, not just individual tests
3. **Monitor Over Time**: Track FPS trends across releases
4. **Optimize Early**: Address performance issues during development
5. **Use Production Mode**: Test with production builds for accurate results

## Related Documentation

- [Performance Monitoring](./PERFORMANCE_MONITORING.md)
- [Motion Tier System](./MOTION_TIERS.md)
- [Asset Optimization](./ASSET_OPTIMIZATION.md)
- [Deployment Guide](./DEPLOYMENT.md)

## Support

For performance issues or questions:
- Review this documentation
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Contact development team
