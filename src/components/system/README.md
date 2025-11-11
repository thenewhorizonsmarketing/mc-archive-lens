# System Components

Core system-level components for the 3D Clue Board Kiosk Interface.

## Components

### BootManager

Manages the application boot sequence and initialization.

**Usage:**
```tsx
import { BootManager } from '@/components/system';

<BootManager onBootComplete={handleBootComplete} />
```

### LoadingScreen

Displays loading progress during asset loading and initialization.

**Usage:**
```tsx
import { LoadingScreen } from '@/components/system';

<LoadingScreen progress={loadingProgress} />
```

### IdleManager

Manages idle detection, attract mode, and auto-reset behavior.

**Features:**
- Tracks user activity across all input types
- Triggers attract mode after 45 seconds of inactivity
- Auto-resets to home after 120 seconds of inactivity
- Resets timers on navigation and interaction
- Provides callbacks for idle, attract, and reset events

**Usage:**
```tsx
import { IdleManager } from '@/components/system';

function App() {
  const [modals, setModals] = useState({ admin: false, search: false });

  const handleReset = () => {
    // Clear all modal states on auto-reset
    setModals({ admin: false, search: false });
    // Reset other application state
  };

  return (
    <>
      <IdleManager
        enabled={true}
        idleTimeout={45000}      // 45 seconds
        attractTimeout={120000}   // 120 seconds (2 minutes)
        onIdle={() => console.log('User is idle')}
        onAttract={() => console.log('Attract mode active')}
        onReset={handleReset}
      />
      
      {/* Your app content */}
    </>
  );
}
```

**Props:**
- `enabled?: boolean` - Enable/disable idle management (default: true)
- `idleTimeout?: number` - Milliseconds until idle state (default: 45000)
- `attractTimeout?: number` - Milliseconds until auto-reset (default: 120000)
- `onIdle?: () => void` - Callback when user becomes idle
- `onAttract?: () => void` - Callback when attract mode starts
- `onReset?: () => void` - Callback when auto-reset triggers
- `children?: React.ReactNode` - Optional children to render

**State Management:**

The IdleManager uses the `useIdleStore` Zustand store:

```tsx
import { useIdleStore } from '@/store/idleStore';

function MyComponent() {
  const isIdle = useIdleStore((state) => state.isIdle);
  const isInAttractMode = useIdleStore((state) => state.isInAttractMode);
  const recordActivity = useIdleStore((state) => state.recordActivity);

  // Manually record activity if needed
  const handleCustomAction = () => {
    recordActivity();
    // ... your logic
  };

  return (
    <div>
      {isInAttractMode && <div>Attract mode is active!</div>}
    </div>
  );
}
```

### AttractLoop

Implements attract mode animations for the 3D scene.

**Features:**
- Gentle breathing tilt effect on camera (full motion tier)
- Soft glow sweep across brass plaques (full & lite tiers)
- Respects motion tier settings
- Automatically activates when idle

**Usage:**

The AttractLoop is typically used inside the 3D Canvas:

```tsx
import { AttractLoop } from '@/components/system';
import { useIdleStore } from '@/store/idleStore';

function BoardScene() {
  const isInAttractMode = useIdleStore((state) => state.isInAttractMode);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [sweepPosition, setSweepPosition] = useState(0);
  const cameraRef = useRef<THREE.Camera>(null);

  return (
    <Canvas>
      {isInAttractMode && (
        <AttractLoop
          cameraRef={cameraRef}
          motionTier="full"
          onGlowUpdate={(intensity, position) => {
            setGlowIntensity(intensity);
            setSweepPosition(position);
          }}
        />
      )}
      
      {/* Your 3D scene */}
    </Canvas>
  );
}
```

**Props:**
- `cameraRef?: React.RefObject<THREE.Camera>` - Camera to apply tilt effect
- `motionTier?: 'full' | 'lite' | 'static'` - Performance tier (default: 'full')
- `onGlowUpdate?: (intensity: number, position: number) => void` - Glow update callback

**Animation Details:**

1. **Breathing Tilt** (Full Tier Only)
   - 4-second cycle
   - Subtle camera rotation (±2.8 degrees)
   - Smooth Y-axis movement (±0.2 units)

2. **Glow Sweep** (Full & Lite Tiers)
   - 6-second cycle
   - Traveling wave across plaques
   - Intensity range: 0.1 to 0.5
   - Smooth ease-in-out motion

## Integration Example

Complete integration with 3D scene and modal management:

```tsx
import { IdleManager, AttractLoop } from '@/components/system';
import { BoardScene } from '@/components/3d';
import { useIdleStore } from '@/store/idleStore';
import { useKioskStore } from '@/store/kioskStore';

function KioskApp() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const isInAttractMode = useIdleStore((state) => state.isInAttractMode);
  const currentRoute = useKioskStore((state) => state.currentRoute);

  const handleReset = () => {
    // Close all modals
    setIsAdminOpen(false);
    
    // Clear other state
    // ...
    
    console.log('Kiosk reset to clean state');
  };

  return (
    <div className="w-full h-full">
      {/* Idle management */}
      <IdleManager
        enabled={true}
        onReset={handleReset}
      />

      {/* 3D scene with attract loop */}
      {currentRoute === 'home' && (
        <BoardScene
          rooms={rooms}
          onRoomSelect={handleRoomSelect}
        />
      )}

      {/* Admin overlay */}
      {isAdminOpen && (
        <AdminOverlay onClose={() => setIsAdminOpen(false)} />
      )}
    </div>
  );
}
```

## Timers and Timeouts

### Default Timeouts

- **Idle Timeout:** 45 seconds (45000ms)
- **Attract Timeout:** 120 seconds (120000ms)
- **Total Reset Time:** 120 seconds from last activity

### Timeline

```
0s ────────────────── 45s ────────────────── 120s
│                      │                      │
User Active         Idle State            Auto-Reset
                    Attract Mode          Return Home
                    Animations Start      Clear Modals
```

### Customizing Timeouts

For testing or different use cases:

```tsx
<IdleManager
  idleTimeout={30000}      // 30 seconds (faster for testing)
  attractTimeout={90000}   // 90 seconds
/>
```

## Activity Detection

The IdleManager automatically detects these events:

- `mousedown` - Mouse button press
- `mousemove` - Mouse movement
- `keypress` - Keyboard key press
- `keydown` - Keyboard key down
- `scroll` - Page scroll
- `touchstart` - Touch begin
- `touchmove` - Touch movement
- `click` - Click/tap
- `wheel` - Mouse wheel

Activity is **not** recorded during transitions to avoid interrupting animations.

## Best Practices

### 1. Modal State Management

Always clear modal states in the `onReset` callback:

```tsx
const handleReset = () => {
  // Close all modals
  setIsAdminOpen(false);
  setIsSearchOpen(false);
  setIsDialogOpen(false);
  
  // Clear form data
  setFormData({});
  
  // Reset selections
  setSelectedItems([]);
};
```

### 2. Route-Based Behavior

The IdleManager automatically resets timers when routes change. No additional code needed.

### 3. Performance Optimization

Use motion tier settings to optimize attract animations:

```tsx
const motionTier = usePerformanceStore((state) => state.motionTier);

<AttractLoop motionTier={motionTier} />
```

### 4. Debugging

Enable console logs to track idle behavior:

```tsx
<IdleManager
  onIdle={() => console.log('Idle at:', new Date())}
  onAttract={() => console.log('Attract mode started')}
  onReset={() => console.log('Auto-reset triggered')}
/>
```

## Testing

### Manual Testing

1. Open the application
2. Stop interacting for 45 seconds
3. Verify attract mode activates
4. Continue not interacting for 75 more seconds (120s total)
5. Verify auto-reset to home

### Automated Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useIdleStore } from '@/store/idleStore';

describe('Idle Management', () => {
  it('should enter idle state after timeout', async () => {
    const { result } = renderHook(() => useIdleStore());
    
    act(() => {
      result.current.startIdleTimer();
    });
    
    // Fast-forward time
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 45000));
    });
    
    expect(result.current.isIdle).toBe(true);
  });
});
```

## Troubleshooting

### Attract mode not activating

- Check that `enabled={true}` on IdleManager
- Verify no continuous activity (e.g., mouse movement)
- Check console for idle state logs
- Ensure motion tier is not 'static'

### Auto-reset not working

- Verify `attractTimeout` is set correctly
- Check that `onReset` callback is provided
- Look for console logs indicating reset
- Ensure navigation is not blocked

### Timers not resetting

- Check that activity events are being detected
- Verify no errors in console
- Ensure IdleManager is mounted
- Check that transitions are not blocking activity

## Related Documentation

- [Idle Store](../../store/idleStore.ts) - State management
- [Kiosk Store](../../store/kioskStore.ts) - Navigation state
- [BoardScene](../3d/BoardScene.tsx) - 3D scene integration
- [Requirements](../../../.kiro/specs/3d-clue-board-kiosk/requirements.md) - Full requirements

---

For more examples, see `IdleManagerExample.tsx` in this directory.


### PerformanceMonitor

Monitors real-time performance metrics including FPS, draw calls, memory usage, and detects sustained frame drops for automatic motion tier adjustment.

**Features:**
- Tracks FPS using requestAnimationFrame
- Monitors draw calls (Requirement 7.3: target ≤ 120)
- Tracks JavaScript heap memory usage
- Detects sustained frame drops (Requirement 6.5)
- Auto-downgrades motion tier when performance degrades
- Provides callbacks for metrics updates and tier changes

**Requirements:**
- 6.5: Detect sustained frame drops and auto-downgrade motion tier
- 7.2: Track main thread blocking time (target: ≤200ms)
- 7.3: Track draw calls (target: ≤120)

**Usage:**
```tsx
import { PerformanceMonitor } from '@/components/system';

function App() {
  const handleMetricsUpdate = (metrics) => {
    console.log('FPS:', metrics.fps);
    console.log('Frame Time:', metrics.frameTime, 'ms');
    console.log('Draw Calls:', metrics.drawCalls);
    console.log('Memory:', metrics.memoryUsage, 'MB');
  };

  const handleTierDowngrade = (newTier) => {
    console.log('Performance tier downgraded to:', newTier);
    // Optionally notify user or log event
  };

  return (
    <>
      <PerformanceMonitor
        enabled={true}
        targetFPS={60}
        downgradeFPSThreshold={55}
        downgradeFrameThreshold={180}  // 3 seconds at 60fps
        onMetricsUpdate={handleMetricsUpdate}
        onTierDowngrade={handleTierDowngrade}
      />
      
      {/* Your app content */}
    </>
  );
}
```

**Props:**
- `enabled?: boolean` - Enable/disable monitoring (default: true)
- `targetFPS?: number` - Target frames per second (default: 60)
- `downgradeFPSThreshold?: number` - FPS threshold for downgrade (default: 55)
- `downgradeFrameThreshold?: number` - Consecutive low FPS frames before downgrade (default: 180)
- `onMetricsUpdate?: (metrics: PerformanceMetrics) => void` - Callback for metrics updates
- `onTierDowngrade?: (newTier: string) => void` - Callback when tier downgrades
- `children?: React.ReactNode` - Optional children to render

**Performance Metrics:**

```typescript
interface PerformanceMetrics {
  fps: number;              // Current frames per second
  frameTime: number;        // Average frame time in milliseconds
  drawCalls: number;        // Number of WebGL draw calls
  memoryUsage: number;      // JavaScript heap memory in MB
  gpuMemory?: number;       // GPU memory (if available)
}
```

**State Management:**

The PerformanceMonitor uses the `usePerformanceStore` Zustand store:

```tsx
import { usePerformanceStore } from '@/store/performanceStore';

function MyComponent() {
  const currentFPS = usePerformanceStore((state) => state.currentFPS);
  const averageFPS = usePerformanceStore((state) => state.averageFPS);
  const motionTier = usePerformanceStore((state) => state.motionTier);
  const metrics = usePerformanceStore((state) => state.metrics);

  return (
    <div>
      <p>FPS: {currentFPS}</p>
      <p>Average: {averageFPS.toFixed(1)}</p>
      <p>Tier: {motionTier}</p>
      <p>Draw Calls: {metrics.drawCalls}</p>
    </div>
  );
}
```

**Auto-Downgrade Behavior:**

The PerformanceMonitor automatically downgrades motion tier when sustained frame drops are detected:

1. **Full → Lite:** When FPS drops below 55 for 180 consecutive frames (3 seconds)
2. **Lite → Static:** When FPS drops below 45 for 180 consecutive frames

This ensures smooth performance on lower-end hardware while maintaining the best possible visual quality.

**Performance Budgets:**

The component monitors against these budgets:

- **Target FPS:** 60 (acceptable: ≥55)
- **Draw Calls:** ≤120 (Requirement 7.3)
- **Frame Time:** ≤16.67ms (for 60 FPS)
- **Main Thread Blocking:** ≤200ms (Requirement 7.2)

**Console Warnings:**

The component logs warnings when budgets are exceeded:

```
[PerformanceMonitor] Draw calls exceed budget: 145 > 120 (Requirement 7.3)
[PerformanceMonitor] Sustained frame drops detected (52 FPS < 55 target) for 180 frames. Triggering auto-downgrade.
```

**Integration with 3D Scene:**

For accurate draw call tracking, integrate with Three.js renderer:

```tsx
import { useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@/components/system';

function Scene() {
  const { gl } = useThree();
  const monitorRef = useRef<any>();

  useFrame(() => {
    // Update draw calls from renderer
    if (monitorRef.current && gl.info) {
      monitorRef.current.updateDrawCalls(gl.info.render.calls);
    }
  });

  return (
    <>
      <PerformanceMonitor ref={monitorRef} enabled={true} />
      {/* Your 3D content */}
    </>
  );
}
```

**Testing Performance:**

Use the example component to visualize metrics:

```tsx
import { PerformanceMonitorExample } from '@/components/system/PerformanceMonitorExample';

// Render in development mode
<PerformanceMonitorExample />
```

**Best Practices:**

1. **Enable in Production:** Keep monitoring enabled to ensure smooth performance
2. **Log Downgrades:** Track tier downgrades to identify performance issues
3. **Monitor Draw Calls:** Keep draw calls under 120 for optimal performance
4. **Test on Target Hardware:** Verify performance on actual kiosk hardware
5. **Respect Auto-Tier:** Don't override auto-tier unless necessary

**Troubleshooting:**

### Low FPS

- Check draw calls (should be ≤120)
- Verify texture sizes (use KTX2 compression)
- Reduce geometry complexity
- Disable expensive effects (shadows, post-processing)

### High Memory Usage

- Dispose Three.js objects properly
- Unload unused assets
- Check for memory leaks
- Monitor over 24-hour period

### Inaccurate Draw Calls

- Ensure WebGL context is available
- Integrate with Three.js renderer.info
- Check that canvas is mounted

For more examples, see `PerformanceMonitorExample.tsx` in this directory.
