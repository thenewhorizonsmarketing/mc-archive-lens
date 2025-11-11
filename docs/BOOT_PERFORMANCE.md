# Boot Performance Documentation

## Requirement 8.1: Boot to Full-Screen Within 5 Seconds

This document describes the implementation and validation of the 5-second boot time requirement.

## Overview

The application must boot from launch to full-screen display within 5 seconds to meet kiosk usability requirements. This ensures visitors don't experience long wait times when the kiosk starts or restarts.

## Implementation

### Boot Metrics Tracking

The Electron main process tracks detailed boot metrics:

- **Process Start**: When the Electron process begins
- **Electron Ready**: When Electron framework is initialized
- **Window Created**: When the BrowserWindow is created
- **Content Loaded**: When HTML/CSS/JS are loaded
- **Ready to Show**: When the application is ready to display
- **Total Boot Time**: Complete time from start to display

### Boot Sequence Optimization

1. **Minimal Initial Bundle**
   - Critical path code only in main bundle
   - Lazy loading for non-critical features
   - Code splitting for heavy dependencies

2. **Fast Configuration Loading**
   - Configuration loads asynchronously
   - Defaults used if config fails
   - No blocking on config load

3. **Deferred Initialization**
   - WebGL detection is fast
   - Store initialization is synchronous
   - Heavy features load after display

4. **Optimized Assets**
   - Compressed textures (KTX2)
   - Compressed geometry (Draco)
   - Minimal fonts preloaded

## Validation

### Automated Tests

Run boot performance tests:

```bash
npm run test:run -- src/__tests__/e2e/kiosk-boot.test.ts
```

### Build Validation

Validate boot performance before deployment:

```bash
npm run build:production
npm run validate:boot
```

This script:
- Analyzes bundle sizes
- Estimates boot time based on bundle size
- Checks for unoptimized assets
- Validates against 5-second target

### Runtime Monitoring

Boot metrics are displayed in the Admin Overlay:

1. Open admin overlay (4-corner gesture + PIN)
2. Navigate to "Diagnostics" tab
3. View "Boot Performance" section

The display shows:
- Total boot time
- Breakdown by phase
- Pass/fail status against 5-second target
- Warning if approaching limit (>4 seconds)

## Boot Time Breakdown

Typical boot time on target hardware (4K kiosk):

| Phase | Target Time | Description |
|-------|-------------|-------------|
| Electron Ready | <500ms | Electron framework initialization |
| Window Created | <800ms | BrowserWindow creation |
| Content Loaded | <2000ms | HTML/CSS/JS loading |
| React Mounted | <3000ms | React initialization |
| App Ready | <4500ms | Full application ready |
| **TOTAL** | **<5000ms** | **Complete boot sequence** |

## Optimization Strategies

### If Boot Time Exceeds Target

1. **Reduce Bundle Size**
   ```bash
   # Analyze bundle
   npm run build -- --mode production
   
   # Check for large dependencies
   npx vite-bundle-visualizer
   ```

2. **Optimize Assets**
   ```bash
   # Compress all assets
   npm run optimize:all
   ```

3. **Enable Code Splitting**
   - Use dynamic imports for heavy modules
   - Lazy load Three.js components
   - Defer non-critical features

4. **Minimize Initial Render**
   - Show loading screen immediately
   - Defer complex UI rendering
   - Use skeleton screens

### Performance Budget

- **Critical Bundle**: <2MB (JS + CSS)
- **Initial Assets**: <5MB total
- **Configuration**: <100KB
- **Fonts**: <500KB

## Monitoring in Production

### Electron Console Logs

Boot metrics are logged to console on every boot:

```
============================================================
BOOT METRICS (Requirement 8.1, 13.1)
============================================================
Electron Ready:    450ms
Window Created:    720ms
Content Loaded:    1850ms
Ready to Show:     4200ms
TOTAL BOOT TIME:   4200ms
============================================================
✓ Boot time within 5-second target (84.0% of target)
```

### Admin Overlay

Real-time boot metrics available in admin interface:
- Current boot time
- Historical boot times
- Performance trends
- Optimization recommendations

## Troubleshooting

### Boot Time >5 Seconds

**Symptoms**: Application takes longer than 5 seconds to display

**Possible Causes**:
1. Large bundle size
2. Unoptimized assets
3. Slow disk I/O
4. Network requests (should be blocked)
5. Heavy synchronous operations

**Solutions**:
1. Run `npm run validate:boot` to identify issues
2. Check bundle size and optimize
3. Verify assets are compressed
4. Ensure no network requests in boot path
5. Profile with Chrome DevTools

### Slow Asset Loading

**Symptoms**: Content loaded phase takes >2 seconds

**Solutions**:
1. Compress textures: `npm run optimize:textures:ktx2`
2. Compress models: `npm run optimize:geometry:draco`
3. Reduce initial asset count
4. Use progressive loading

### Slow Initialization

**Symptoms**: Time between content loaded and ready >2 seconds

**Solutions**:
1. Profile React component mounting
2. Defer non-critical store initialization
3. Lazy load heavy dependencies
4. Optimize WebGL context creation

## Testing on Target Hardware

Always test boot performance on actual kiosk hardware:

1. Build production package:
   ```bash
   npm run package:kiosk
   ```

2. Install on kiosk hardware

3. Monitor boot metrics in admin overlay

4. Verify <5 second boot time

## Continuous Integration

Add boot performance validation to CI/CD:

```yaml
- name: Validate Boot Performance
  run: |
    npm run build:production
    npm run validate:boot
```

This ensures boot performance doesn't regress with new changes.

## References

- Requirement 8.1: Boot to full-screen within 5 seconds
- Requirement 13.1: Display boot time metrics
- `electron/main.ts`: Boot metrics tracking
- `scripts/validate-boot-performance.js`: Validation script
- `src/components/system/BootMetricsDisplay.tsx`: Metrics display
- `src/__tests__/e2e/kiosk-boot.test.ts`: Boot tests
