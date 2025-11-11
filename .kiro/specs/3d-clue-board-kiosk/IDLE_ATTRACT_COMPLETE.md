# Idle and Attract Behavior - Implementation Complete

## Overview

Task 11 "Idle and Attract Behavior" has been successfully implemented. This includes idle tracking, attract mode animations, and auto-reset functionality for the 3D Clue Board Kiosk Interface.

## Implementation Summary

### ✅ Task 11.1: Create IdleManager Component

**File:** `src/components/system/IdleManager.tsx`

The IdleManager component provides a comprehensive idle tracking and management system:

**Features:**
- Tracks user activity across multiple event types (mouse, touch, keyboard)
- Implements 45-second idle timer (configurable)
- Implements 120-second reset timer (configurable)
- Automatically resets timers on any interaction
- Prevents activity recording during transitions
- Resets timers when route changes
- Provides callbacks for idle, attract, and reset events

**Key Methods:**
- `handleActivity()` - Records user activity and resets timers
- `handleIdleEntry()` - Triggers when user becomes idle (45s)
- `handleAutoReset()` - Clears modals and returns to home (120s)

**Requirements Met:**
- ✅ 4.1: Start attract loop after 45 seconds of inactivity
- ✅ 4.2: Auto-reset to home after 120 seconds of inactivity
- ✅ 4.3: Reset session timer on any navigation activity
- ✅ 4.4: Return to BoardScene after 2 minutes of inactivity

### ✅ Task 11.2: Implement Attract Loop Animation

**Files:**
- `src/components/system/AttractLoop.tsx` (new)
- `src/components/3d/BrassNameplate.tsx` (updated)
- `src/components/3d/RoomTile3D.tsx` (updated)
- `src/components/3d/ClueBoard3D.tsx` (updated)
- `src/components/3d/BoardScene.tsx` (updated)

The AttractLoop component implements engaging animations to draw attention when idle:

**Animations:**

1. **Gentle Breathing Tilt Effect** (Full Motion Tier Only)
   - 4-second breathing cycle
   - Subtle camera rotation (±2.8 degrees)
   - Smooth Y-axis position change (±0.2 units)
   - Creates a "living" feel to the board

2. **Soft Glow Sweep Across Plaques** (Full & Lite Motion Tiers)
   - 6-second sweep cycle
   - Traveling wave of emissive intensity
   - Smooth ease-in-out acceleration
   - Glow spreads across 2 tiles at a time
   - Peak intensity: 0.5, base: 0.1

**Integration:**
- AttractLoop provides glow intensity and sweep position
- BoardScene passes these values to ClueBoard3D
- ClueBoard3D calculates per-tile glow based on sweep position
- BrassNameplate and RoomTile3D apply the glow effect
- Glow uses falloff calculation for smooth wave effect

**Requirements Met:**
- ✅ 4.1: Create gentle breathing tilt effect
- ✅ 4.1: Create soft glow sweep across plaques
- ✅ 4.1: Trigger after 45s idle

### ✅ Task 11.3: Implement Auto-Reset to Home

**Files:**
- `src/components/system/IdleManager.tsx` (updated)
- `src/store/idleStore.ts` (updated)
- `src/components/system/IdleManagerExample.tsx` (new example)

The auto-reset functionality ensures the kiosk returns to a clean state:

**Features:**
- Triggers after 120 seconds of total inactivity
- Navigates to home route if not already there
- Provides callback for clearing modal states
- Resets idle timers after reset completes
- Logs all reset actions for debugging

**Modal State Management:**
The IdleManagerExample demonstrates proper integration:
- Track all modal states in parent component
- Pass `onReset` callback to IdleManager
- Clear all modals in the callback
- Reset any other application state

**Requirements Met:**
- ✅ 4.2: Auto-reset to home after 120 seconds
- ✅ 4.2: Clear all modal states
- ✅ 4.4: Return to BoardScene after 2 minutes

## File Structure

```
src/
├── components/
│   ├── system/
│   │   ├── IdleManager.tsx          # Main idle management component
│   │   ├── AttractLoop.tsx          # Attract mode animations
│   │   ├── IdleManagerExample.tsx   # Integration example
│   │   └── index.ts                 # Updated exports
│   └── 3d/
│       ├── BoardScene.tsx           # Updated with attract loop
│       ├── ClueBoard3D.tsx          # Updated with glow distribution
│       ├── BrassNameplate.tsx       # Updated with attract glow
│       └── RoomTile3D.tsx           # Updated with attract glow
└── store/
    └── idleStore.ts                 # Updated reset logic
```

## Usage Example

### Basic Integration

```tsx
import { IdleManager } from '@/components/system';

function KioskApp() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReset = () => {
    // Clear all modal states
    setIsModalOpen(false);
    // Reset other application state
  };

  return (
    <>
      <IdleManager
        enabled={true}
        idleTimeout={45000}      // 45 seconds
        attractTimeout={120000}   // 120 seconds
        onReset={handleReset}
      />
      
      {/* Your app content */}
    </>
  );
}
```

### With 3D Scene

```tsx
import { BoardScene } from '@/components/3d';
import { IdleManager } from '@/components/system';

function Kiosk3D() {
  return (
    <>
      <IdleManager enabled={true} />
      
      <BoardScene
        rooms={rooms}
        onRoomSelect={handleRoomSelect}
      />
    </>
  );
}
```

## State Management

### Idle Store State

```typescript
interface IdleState {
  isIdle: boolean;              // User is idle (45s+)
  isInAttractMode: boolean;     // Attract animations active
  lastActivityTime: number;     // Timestamp of last activity
  idleTimeout: number;          // Configurable idle timeout
  attractTimeout: number;       // Configurable reset timeout
}
```

### Key Actions

- `recordActivity()` - Reset timers on user interaction
- `startIdleTimer()` - Begin idle countdown
- `stopIdleTimer()` - Stop all timers
- `enterAttractMode()` - Activate attract animations
- `exitAttractMode()` - Deactivate attract animations
- `triggerAutoReset()` - Reset to home state
- `resetAll()` - Full state reset

## Performance Considerations

### Motion Tier Support

The attract loop respects the motion tier setting:

- **Full Tier**: All animations (breathing tilt + glow sweep)
- **Lite Tier**: Glow sweep only (no camera tilt)
- **Static Tier**: No animations

### Optimization

- Animations use `useFrame` for 60fps smoothness
- Glow calculations use efficient falloff formula
- Camera movements use lerp for smooth interpolation
- No unnecessary re-renders during idle state

## Testing

### Manual Testing

1. **Idle Detection (45s)**
   - Stop interacting with the kiosk
   - After 45 seconds, verify:
     - Console logs "Entering idle state"
     - Attract mode activates
     - Glow sweep begins across plaques
     - Camera breathing effect starts (full tier)

2. **Auto-Reset (120s)**
   - Continue not interacting
   - After 120 seconds total, verify:
     - Console logs "Auto-reset triggered"
     - Route returns to home
     - All modals close
     - Timers restart

3. **Activity Reset**
   - During idle or attract mode
   - Interact with the kiosk (tap, move mouse, etc.)
   - Verify:
     - Idle state clears immediately
     - Attract mode stops
     - Timers reset to 0

### Automated Testing

```typescript
// Example test structure
describe('IdleManager', () => {
  it('should enter idle state after 45 seconds', async () => {
    // Test implementation
  });

  it('should trigger auto-reset after 120 seconds', async () => {
    // Test implementation
  });

  it('should reset timers on user activity', () => {
    // Test implementation
  });
});
```

## Configuration

### Customizing Timeouts

```tsx
<IdleManager
  idleTimeout={30000}      // 30 seconds (faster for testing)
  attractTimeout={90000}   // 90 seconds
/>
```

### Customizing Animations

Edit `AttractLoop.tsx`:

```typescript
// Breathing cycle duration
const breathCycle = 4.0; // seconds

// Sweep cycle duration
const sweepCycle = 6.0; // seconds

// Glow intensity range
const glowIntensity = Math.sin(sweepPhase * Math.PI) * 0.4 + 0.1;
```

## Debugging

### Console Logs

The implementation includes comprehensive logging:

```
[IdleManager] Initialized { idleTimeout: '45000ms', attractTimeout: '120000ms' }
[IdleManager] Route changed, resetting timers
[IdleManager] Entering idle state (45s)
[AttractLoop] Attract mode started
[IdleManager] Auto-reset triggered (120s) - returning to home
[IdleManager] Navigating from alumni to home
[IdleManager] Auto-reset complete - BoardScene restored
```

### Store Inspection

Use Zustand DevTools to inspect idle state:

```typescript
import { useIdleStore } from '@/store/idleStore';

// In component
const idleState = useIdleStore();
console.log('Idle State:', idleState);
```

## Requirements Verification

| Requirement | Status | Implementation |
|------------|--------|----------------|
| 4.1 - 45s idle triggers attract loop | ✅ | IdleManager + AttractLoop |
| 4.1 - Gentle breathing tilt effect | ✅ | AttractLoop camera animation |
| 4.1 - Soft glow sweep across plaques | ✅ | AttractLoop + BrassNameplate |
| 4.2 - 120s auto-reset to home | ✅ | IdleManager handleAutoReset |
| 4.2 - Clear all modal states | ✅ | onReset callback pattern |
| 4.3 - Reset timer on navigation | ✅ | IdleManager route effect |
| 4.4 - Return to BoardScene | ✅ | goHome() navigation |

## Next Steps

The idle and attract behavior system is complete and ready for integration. To use it:

1. Add `<IdleManager>` to your root kiosk component
2. Implement `onReset` callback to clear modal states
3. The attract loop will automatically activate in BoardScene
4. Test with different motion tiers
5. Adjust timeouts if needed for your use case

## Related Tasks

- ✅ Task 4.3: Global state store (idle state)
- ✅ Task 6.1: BoardScene component (attract integration)
- ✅ Task 8.2: BrassNameplate (glow effect)
- ⏳ Task 12: Performance monitoring (motion tier detection)
- ⏳ Task 13: Admin overlay (idle timer configuration)

---

**Implementation Date:** 2025-11-09
**Status:** ✅ Complete
**All Sub-tasks:** ✅ Complete (3/3)
