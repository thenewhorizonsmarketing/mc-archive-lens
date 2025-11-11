# Navigation Transitions

This directory contains components for handling smooth, elegant transitions between routes in the 3D Clue Board Kiosk Interface.

## Overview

The navigation transition system implements a coordinated sequence of animations:

1. **Input Lock** (immediate) - Prevents double-taps and accidental inputs
2. **Brass Plaque Pulse** (300ms) - Visual feedback on the tapped room
3. **Camera Dolly** (500-700ms) - Smooth camera movement toward the room
4. **Cross-Fade** (coordinated) - Seamless transition to new content
5. **Input Unlock** (on complete) - Re-enables user interaction

## Components

### RouteTransition

Handles cross-fade transitions between route content.

```tsx
import { RouteTransition } from '@/components/transition';

<RouteTransition
  isTransitioning={isTransitioning}
  duration={300}
  onComplete={handleComplete}
>
  {children}
</RouteTransition>
```

**Props:**
- `isTransitioning` - Whether transition is in progress
- `duration` - Cross-fade duration in milliseconds (default: 300)
- `onComplete` - Callback when transition completes
- `children` - Content to render

**Features:**
- Smooth cross-fade without white flashes (requirement 5.5)
- Coordinates with camera animation via transition progress
- Black overlay prevents jarring color shifts

## State Management

The transition state is managed by the `kioskStore`:

```tsx
import { useKioskStore } from '@/store/kioskStore';

const {
  isTransitioning,
  transitionProgress,
  inputLocked,
  startTransition,
  completeTransition,
  cancelTransition
} = useKioskStore();
```

**State Properties:**
- `isTransitioning` - Boolean indicating active transition
- `transitionProgress` - Number 0-1 indicating animation progress
- `inputLocked` - Boolean preventing user input during transition
- `targetRoute` - Destination route for the transition

**Actions:**
- `startTransition(route)` - Begins transition and locks input
- `updateTransitionProgress(progress)` - Updates progress (0-1)
- `completeTransition()` - Completes transition and unlocks input
- `cancelTransition()` - Cancels transition and unlocks input

## Transition Flow

### 1. User Taps Room Tile

```tsx
const handleRoomTap = (roomId: string) => {
  // Start transition (automatically locks input)
  startTransition(roomId);
};
```

**Requirements Met:**
- 5.1: Lock input during transitions
- 5.6: Guard against additional tap inputs

### 2. Brass Plaque Pulse

The `BrassNameplate` component automatically pulses when tapped:

```tsx
<BrassNameplate
  text={room.title}
  isPulsing={isTransitioning && targetRoom === room.id}
  onPulseComplete={() => console.log('Pulse complete')}
/>
```

**Requirements Met:**
- 5.2: Trigger brass plaque emissive pulse lasting 300ms

### 3. Camera Dolly

The `CameraController` animates the camera toward the target room:

```tsx
<CameraController
  isTransitioning={isTransitioning}
  targetRoom={targetRoom}
  rooms={rooms}
  motionTier="full"
/>
```

**Requirements Met:**
- 5.3: Perform camera dolly-in through doorway lasting 500-700ms
- 2.2: Apply small perspective nudge to show depth

### 4. Cross-Fade

The `RouteTransition` component handles the visual transition:

```tsx
<RouteTransition isTransitioning={isTransitioning}>
  {currentRoute === 'home' ? <BoardScene /> : <RoomContent />}
</RouteTransition>
```

**Requirements Met:**
- 5.4: Swap to new route content after camera dolly
- 5.5: Use cross-fade without white flashes

### 5. Transition Complete

When the camera animation finishes, it calls `completeTransition()`:

```tsx
// In CameraController animation loop
if (progress >= 1) {
  completeTransition(); // Automatically unlocks input
}
```

## Input Locking

Input is automatically locked during transitions to prevent issues:

### In Store

```tsx
startTransition: (targetRoute) => {
  set({ 
    isTransitioning: true,
    inputLocked: true, // Locked immediately
    targetRoute
  });
}
```

### In Components

```tsx
// TouchHandler blocks all touch input
const handleTouchStart = (event) => {
  if (isTransitioning) {
    event.preventDefault();
    return;
  }
  // ... handle touch
};

// RoomTile3D blocks clicks
const handleClick = (e) => {
  if (inputLocked) {
    console.log('Click blocked - input locked');
    return;
  }
  onClick();
};
```

## Timing

The transition timing is carefully coordinated:

```
0ms     - User taps tile
0ms     - Input locked
0ms     - Brass pulse starts
300ms   - Brass pulse completes
0-600ms - Camera dolly (smooth ease-in-out)
600ms   - Camera dolly completes
600ms   - Route content swaps
600ms   - Cross-fade begins
900ms   - Cross-fade completes
900ms   - Input unlocked
```

Total transition duration: ~900ms

## Performance

The transition system is optimized for 60fps:

- Uses `requestAnimationFrame` for smooth animations
- Easing functions prevent jarring motion
- Input locking prevents performance-heavy double-renders
- Black overlay prevents expensive color calculations

## Testing

Test the transition system:

```tsx
import { TransitionExample } from '@/components/transition/TransitionExample';

// Renders a complete example with debug overlay
<TransitionExample />
```

## Requirements Coverage

✅ **5.1** - Lock input during transitions to prevent double-taps  
✅ **5.2** - Trigger brass plaque emissive pulse lasting 300ms  
✅ **5.3** - Perform camera dolly-in through doorway lasting 500-700ms  
✅ **5.4** - Swap to new route content after camera dolly  
✅ **5.5** - Use cross-fade without white flashes  
✅ **5.6** - Guard against additional tap inputs during transitions  

## Related Components

- `BrassNameplate` - Handles emissive pulse animation
- `CameraController` - Handles camera dolly animation
- `TouchHandler` - Respects input lock during transitions
- `RoomTile3D` - Blocks clicks when input is locked
- `kioskStore` - Manages transition state

## Future Enhancements

- Add transition sound effects
- Implement different transition styles per room
- Add transition progress indicators
- Support transition interruption/cancellation
