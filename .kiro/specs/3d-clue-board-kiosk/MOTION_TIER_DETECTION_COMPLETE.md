# Motion Tier Detection - Implementation Complete

## Overview

Motion tier detection has been successfully implemented for the 3D Clue Board Kiosk. The system automatically detects GPU capabilities on boot and assigns an appropriate motion tier (full/lite/static) to ensure optimal performance across different hardware configurations.

## Requirements Addressed

### ✅ Requirement 6.1: Detect Device Capabilities and Assign Motion Tier on Boot
- GPU capabilities are detected using WebGL API
- Vendor, renderer, and capabilities are analyzed
- Initial motion tier is assigned based on GPU tier (high/medium/low)

### ✅ Requirement 6.2: Full Tier - 60 FPS Target
- Enables all visual effects: board tilt, parallax, emissive pulses, camera transitions
- Targets 60 FPS
- Assigned to high-end GPUs (NVIDIA RTX, AMD RX 5000+, Apple M-series, etc.)

### ✅ Requirement 6.3: Lite Tier - 55-60 FPS Target
- Enables parallax and emissive pulses only (no board tilt)
- Targets 55-60 FPS
- Assigned to medium-tier GPUs

### ✅ Requirement 6.4: Static Tier - Cross-Fade Only
- Minimal effects for maximum compatibility
- Targets 30 FPS
- Assigned to low-end GPUs or when WebGL is unavailable

### ✅ Requirement 6.5: Auto-Downgrade on Performance Issues
- Monitors FPS continuously
- Automatically downgrades tier if sustained frame drops detected
- Full → Lite at <55 FPS average
- Lite → Static at <45 FPS average

## Implementation Details

### Core Components

#### 1. GPU Detector (`src/lib/utils/gpu-detector.ts`)
```typescript
// Main functions
detectGPUCapabilities(): GPUCapabilities
determineMotionTier(capabilities: GPUCapabilities): MotionTier
detectAndAssignMotionTier(): { capabilities, motionTier }
```

**Features:**
- Detects WebGL version (1.0, 2.0, or unavailable)
- Extracts GPU vendor and renderer information
- Checks for WebGL extensions (float textures, anisotropic filtering, instancing, etc.)
- Analyzes screen resolution and device pixel ratio
- Estimates GPU tier based on known patterns and capabilities
- Respects `prefers-reduced-motion` system preference

**GPU Tier Classification:**
- **High Tier**: NVIDIA RTX/GTX 16xx+, AMD RX 5000+, Apple M-series, Intel Iris Xe/Arc
- **Low Tier**: Intel HD Graphics 3000-6000, Mali-400/450, Adreno 3/4, SwiftShader
- **Medium Tier**: Everything else

#### 2. Performance Store Updates (`src/store/performanceStore.ts`)
```typescript
interface PerformanceState {
  motionTier: MotionTier;
  initialMotionTier: MotionTier;
  gpuCapabilities: GPUCapabilities | null;
  autoTierEnabled: boolean;
  // ... other fields
}
```

**New Actions:**
- `setInitialMotionTier(tier)`: Sets the initial tier from detection
- `setGPUCapabilities(capabilities)`: Stores GPU capabilities
- `autoDowngradeTier()`: Automatically downgrades tier on performance issues

#### 3. Motion Tier Detection Hook (`src/hooks/useMotionTierDetection.ts`)
```typescript
useMotionTierDetection({
  overrideTier?: 'auto' | MotionTier,
  enableAutoDowngrade?: boolean,
  onDetectionComplete?: (tier) => void
})
```

**Features:**
- Runs detection once on mount
- Supports manual tier override
- Enables/disables auto-downgrade
- Provides callback for detection completion

#### 4. Motion Tier Features Utility (`src/lib/utils/motion-tier-features.ts`)
```typescript
getMotionTierConfig(tier: MotionTier): MotionTierConfig
isFeatureEnabled(tier: MotionTier, feature: string): boolean
getTargetFPS(tier: MotionTier): number
getMotionTierDescription(tier: MotionTier): string
```

**Motion Tier Configurations:**

| Tier | Board Tilt | Parallax | Emissive Pulse | Camera Transition | Target FPS |
|------|-----------|----------|----------------|-------------------|------------|
| Full | ✓ | ✓ | ✓ | ✓ | 60 |
| Lite | ✗ | ✓ | ✓ | ✓ | 55 |
| Static | ✗ | ✗ | ✗ | ✗ | 30 |

#### 5. KioskApp Integration (`src/components/kiosk/KioskApp.tsx`)
The KioskApp component now:
- Detects GPU capabilities on initialization
- Assigns initial motion tier based on detection
- Respects config override (`motionTier: 'auto' | 'full' | 'lite' | 'static'`)
- Enables auto-downgrade when using 'auto' mode
- Falls back to static tier on detection errors

#### 6. Example Component (`src/components/system/MotionTierDetectionExample.tsx`)
A visual debugging component that displays:
- GPU capabilities (vendor, renderer, WebGL version, etc.)
- Initial and current motion tier
- Enabled features for current tier
- Real-time FPS metrics
- Auto-downgrade status
- Manual tier override controls

## Usage

### Automatic Detection (Recommended)
```typescript
// In config.json
{
  "motionTier": "auto"
}

// The system will automatically detect and assign the best tier
```

### Manual Override
```typescript
// In config.json
{
  "motionTier": "lite"  // Force lite tier
}
```

### Programmatic Usage
```typescript
import { detectAndAssignMotionTier } from '@/lib/utils/gpu-detector';
import { useMotionTierDetection } from '@/hooks/useMotionTierDetection';

// Direct detection
const { capabilities, motionTier } = detectAndAssignMotionTier();

// Using hook in component
const { motionTier, gpuCapabilities, isDetected } = useMotionTierDetection({
  overrideTier: 'auto',
  enableAutoDowngrade: true,
  onDetectionComplete: (tier) => {
    console.log('Detected tier:', tier);
  }
});
```

### Checking Features in Components
```typescript
import { usePerformanceStore } from '@/store/performanceStore';
import { isFeatureEnabled } from '@/lib/utils/motion-tier-features';

function MyComponent() {
  const { motionTier } = usePerformanceStore();
  
  const shouldTilt = isFeatureEnabled(motionTier, 'boardTilt');
  const shouldParallax = isFeatureEnabled(motionTier, 'parallax');
  
  return (
    <div>
      {shouldTilt && <BoardTiltEffect />}
      {shouldParallax && <ParallaxEffect />}
    </div>
  );
}
```

## Testing

### Manual Testing
1. Open the application
2. Check console for detection logs:
   ```
   [GPUDetector] Detecting GPU capabilities...
   [GPUDetector] GPU capabilities detected: { vendor, renderer, gpuTier, ... }
   [GPUDetector] Determining motion tier...
   [GPUDetector] Motion tier assigned: full
   ```
3. Use the `MotionTierDetectionExample` component to visualize detection results

### Testing Different Tiers
```typescript
// Override in config
{ "motionTier": "full" }   // Test full tier
{ "motionTier": "lite" }   // Test lite tier
{ "motionTier": "static" } // Test static tier
{ "motionTier": "auto" }   // Test auto-detection
```

### Testing Auto-Downgrade
1. Set `motionTier: "auto"` in config
2. Start with full tier
3. Simulate performance issues (heavy load, many tabs, etc.)
4. Watch for auto-downgrade logs:
   ```
   [PerformanceStore] Auto-downgrading from full to lite tier (avg FPS: 52.3)
   ```

## Performance Monitoring

The system continuously monitors:
- **Current FPS**: Instantaneous frames per second
- **Average FPS**: Rolling average over last 60 frames
- **Frame Time**: Time per frame in milliseconds
- **Draw Calls**: Number of WebGL draw calls
- **Memory Usage**: JavaScript heap usage

Auto-downgrade triggers:
- **Full → Lite**: When average FPS < 55 for 180 consecutive frames (3 seconds)
- **Lite → Static**: When average FPS < 45 for 180 consecutive frames (3 seconds)

## Configuration

### config.json
```json
{
  "motionTier": "auto",        // "auto" | "full" | "lite" | "static"
  "reducedMotion": false       // Force static tier if true
}
```

### Environment Variables
None required - detection is automatic.

## Browser Compatibility

| Browser | WebGL 2.0 | WebGL 1.0 | Detection |
|---------|-----------|-----------|-----------|
| Chrome 56+ | ✓ | ✓ | Full |
| Firefox 51+ | ✓ | ✓ | Full |
| Safari 15+ | ✓ | ✓ | Full |
| Edge 79+ | ✓ | ✓ | Full |
| IE 11 | ✗ | ✓ | Limited |

## Known Limitations

1. **GPU Detection Accuracy**: Some browsers mask GPU information for privacy. In these cases, the system falls back to capability-based detection.

2. **Mobile Devices**: Mobile GPUs may be misclassified. Consider adding mobile-specific detection patterns if needed.

3. **Virtual Machines**: VMs with software rendering (SwiftShader) are correctly detected as low-tier.

4. **Multiple GPUs**: The system detects the active GPU. Switching GPUs requires a page reload.

## Future Enhancements

- [ ] Add mobile GPU detection patterns
- [ ] Implement GPU memory usage tracking
- [ ] Add user preference persistence (remember manual overrides)
- [ ] Implement gradual tier upgrade when performance improves
- [ ] Add telemetry for GPU tier distribution

## Files Created/Modified

### New Files
- `src/lib/utils/gpu-detector.ts` - GPU capability detection
- `src/lib/utils/motion-tier-features.ts` - Motion tier feature configuration
- `src/hooks/useMotionTierDetection.ts` - Motion tier detection hook
- `src/components/system/MotionTierDetectionExample.tsx` - Example/debug component

### Modified Files
- `src/store/performanceStore.ts` - Added GPU capabilities and tier management
- `src/components/kiosk/KioskApp.tsx` - Integrated motion tier detection on boot
- `src/components/system/index.ts` - Added new exports

## Conclusion

Motion tier detection is now fully implemented and integrated into the kiosk application. The system automatically detects GPU capabilities, assigns an appropriate motion tier, and can auto-downgrade if performance issues are detected. This ensures optimal performance across a wide range of hardware configurations while maintaining the best possible visual quality.

**Status**: ✅ Complete and Ready for Testing

