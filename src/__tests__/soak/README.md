# 24-Hour Soak Test Guide

## Overview

The 24-hour soak test validates that the kiosk application maintains stable performance and memory usage over extended runtime periods. This is critical for a kiosk that may run continuously for days or weeks.

## Requirements

- **Requirement 8.4**: Maintain stable memory usage without leaks over 24 hours
- **Requirement 13.5**: Pass 24-hour soak test verifying no memory leaks

## Running the Soak Test

### Automated Test

The automated test in `memory-leak-test.ts` validates the memory management patterns and cleanup logic:

```bash
npm run test -- --run src/__tests__/soak/
```

### Manual 24-Hour Test

For a real 24-hour soak test on actual hardware:

1. **Setup**:
   ```bash
   npm run build:electron
   npm run package:win
   ```

2. **Launch Application**:
   - Install the packaged application on target hardware
   - Launch in kiosk mode
   - Note the start time

3. **Monitoring**:
   - Use Windows Task Manager or Performance Monitor
   - Record metrics every hour:
     - Memory usage (Private Working Set)
     - CPU usage
     - GPU memory usage
     - FPS (from admin overlay)

4. **Interaction Simulation**:
   - Set up automated touch simulation (optional)
   - Or manually interact every few hours
   - Navigate through all rooms
   - Trigger idle/attract cycles

5. **Data Collection**:
   Create a spreadsheet with columns:
   - Time (hours)
   - Memory (MB)
   - CPU (%)
   - GPU Memory (MB)
   - FPS
   - Notes

## Success Criteria

### Memory Stability
- ✅ Memory growth < 20% over 24 hours
- ✅ No unbounded memory growth
- ✅ Memory stabilizes after initial warmup (first 1-2 hours)

### Performance Stability
- ✅ FPS remains ≥ 55 (or within 10% of initial)
- ✅ No performance degradation over time
- ✅ Transitions remain smooth

### Functional Stability
- ✅ All navigation works after 24 hours
- ✅ Idle/attract cycles continue working
- ✅ Admin overlay remains accessible
- ✅ No visual artifacts or glitches

### Resource Cleanup
- ✅ WebGL context remains stable
- ✅ No DOM node accumulation
- ✅ Event listeners properly cleaned up
- ✅ Timers properly managed

## Common Issues and Solutions

### Memory Leaks

**Symptoms**:
- Steadily increasing memory usage
- Performance degradation over time

**Common Causes**:
- Three.js objects not disposed
- Event listeners not removed
- Timers not cleared
- Closures holding references

**Solutions**:
```typescript
// Dispose Three.js objects
geometry.dispose();
material.dispose();
texture.dispose();

// Remove event listeners
element.removeEventListener('click', handler);

// Clear timers
clearTimeout(timerId);
clearInterval(intervalId);

// Cancel animation frames
cancelAnimationFrame(frameId);
```

### Performance Degradation

**Symptoms**:
- FPS drops over time
- Increased frame time

**Common Causes**:
- Accumulating render objects
- Memory pressure
- GPU memory exhaustion

**Solutions**:
- Implement object pooling
- Limit active objects
- Use LOD (Level of Detail)
- Monitor and cap draw calls

### WebGL Context Loss

**Symptoms**:
- Black screen
- Rendering stops

**Solutions**:
```typescript
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  // Stop rendering
});

canvas.addEventListener('webglcontextrestored', () => {
  // Reinitialize WebGL resources
  // Reload textures and shaders
});
```

## Monitoring Tools

### Built-in Admin Overlay
- Access via 3-second tap-and-hold in upper-left
- Shows real-time FPS, memory, draw calls
- Motion tier status

### Windows Performance Monitor
```
perfmon /res
```
Monitor:
- Private Bytes (memory)
- % Processor Time
- GPU Memory Usage

### Chrome DevTools (Development)
```
chrome://inspect
```
- Memory profiler
- Performance profiler
- Heap snapshots

## Reporting

After completing the 24-hour test, document:

1. **Test Configuration**:
   - Hardware specs
   - Software version
   - Test start/end time
   - Motion tier used

2. **Results Summary**:
   - Initial memory: X MB
   - Final memory: X MB
   - Memory growth: X%
   - Average FPS: X
   - FPS variance: X%

3. **Issues Encountered**:
   - Any crashes or errors
   - Performance anomalies
   - Visual glitches

4. **Conclusion**:
   - Pass/Fail
   - Recommendations

## Example Results Template

```markdown
# 24-Hour Soak Test Results

**Date**: 2024-01-15
**Hardware**: Intel i5-8400, 16GB RAM, GTX 1060
**Software Version**: v1.0.0
**Motion Tier**: Full

## Metrics

| Time (h) | Memory (MB) | CPU (%) | FPS | Notes |
|----------|-------------|---------|-----|-------|
| 0        | 250         | 15      | 60  | Start |
| 1        | 265         | 15      | 59  | Stable |
| 6        | 280         | 16      | 58  | Stable |
| 12       | 285         | 16      | 58  | Stable |
| 18       | 290         | 16      | 57  | Stable |
| 24       | 295         | 16      | 57  | End   |

## Analysis

- Memory growth: 18% (45MB over 24h) ✅
- FPS drop: 5% (3 FPS) ✅
- No crashes or errors ✅
- All features functional ✅

## Conclusion

**PASS** - Application maintains stable performance over 24 hours.
```

## Automation Scripts

For automated testing, consider:

1. **AutoHotkey** (Windows) for touch simulation
2. **Puppeteer** for Electron automation
3. **Custom monitoring script** to log metrics

Example monitoring script:
```javascript
// monitor.js
setInterval(() => {
  const memory = process.memoryUsage();
  const timestamp = new Date().toISOString();
  console.log(`${timestamp},${memory.heapUsed},${memory.external}`);
}, 60000); // Log every minute
```

## Next Steps

After passing the soak test:
1. Document results
2. Update deployment guide
3. Set up production monitoring
4. Schedule regular soak tests (monthly/quarterly)
