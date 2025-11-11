# 3D Components

This directory contains the 3D components for the Clue Board Kiosk Interface using React Three Fiber.

## Task 6: 3D Scene Foundation - Complete ✓

All subtasks for "3D Scene Foundation" have been successfully implemented:

## Task 7: 3D Board Components - Complete ✓

All subtasks for "3D Board Components" have been successfully implemented:

### 6.1 BoardScene Component ✓
- R3F Canvas configured with proper renderer settings
- Antialias, shadows, and performance optimizations enabled
- Performance monitoring integrated with FPS tracking
- Automatic draw call and metrics tracking
- Responsive to motion tier settings

**File:** `BoardScene.tsx`

### 6.2 Orthographic Camera System ✓
- CameraController component with orthographic camera
- Proper framing to keep all tiles visible
- Smooth camera transitions with easing
- Camera state management integrated with Zustand
- Breathing effect for attract mode (full motion tier)
- Viewport-responsive frustum sizing

**File:** `CameraController.tsx`

### 6.3 Lighting Setup ✓
- Warm key light from top-left position
- Fill light from bottom-right
- Optimized shadow maps (1024x1024)
- Minimal draw calls
- Additional rim light and hemisphere light for depth
- Color palette integration (#F5E6C8, #0E6B5C, #CDAF63)

**File:** `Lighting.tsx`

## Components

### BoardScene
Main R3F Canvas wrapper that sets up the 3D scene.

```tsx
import { BoardScene } from '@/components/3d';

<BoardScene
  rooms={roomDefinitions}
  onRoomSelect={(roomId) => console.log(roomId)}
/>
```

### ClueBoard3D
Main 3D board composition with frame, glass, and floor.

```tsx
import { ClueBoard3D } from '@/components/3d';

<ClueBoard3D
  rooms={rooms}
  onTileClick={handleClick}
  isTransitioning={false}
  motionTier="full"
/>
```

### WalnutFrame
Beveled walnut frame with rounded corners.

```tsx
import { WalnutFrame } from '@/components/3d';

<WalnutFrame
  width={12}
  height={12}
  depth={0.8}
  bevelSize={0.15}
  cornerRadius={0.2}
  frameWidth={1.2}
/>
```

### GlassPane
Reflective glass pane with fingerprint texture.

```tsx
import { GlassPane } from '@/components/3d';

<GlassPane
  width={12}
  height={12}
  position={[0, 0.5, 0]}
  opacity={0.15}
  reflectivity={0.3}
/>
```

### BoardFloor
3×3 grid of marble tiles.

```tsx
import { BoardFloor } from '@/components/3d';

<BoardFloor
  tileSize={3.5}
  tileGap={0.15}
  thickness={0.3}
/>
```

### CameraController
Manages the orthographic camera with smooth transitions.

```tsx
<CameraController
  isTransitioning={false}
  targetRoom={null}
  motionTier="full"
/>
```

### Lighting
Configures scene lighting with key, fill, and accent lights.

```tsx
<Lighting
  enableShadows={true}
  intensity={1.0}
/>
```

## Requirements Met

- ✓ **1.1**: 3×3 grid rendering foundation
- ✓ **1.5**: Brass nameplate support ready
- ✓ **1.6**: Warm key + fill lighting implemented
- ✓ **1.7**: Color palette integrated
- ✓ **2.1**: Orthographic camera by default
- ✓ **2.2**: Perspective nudge capability (hover support ready)
- ✓ **2.3**: Fixed composition maintained
- ✓ **2.4**: Pixel-perfect view with proper frustum

## Performance Features

- Dynamic pixel ratio limiting (max 2x)
- Conditional shadow rendering based on motion tier
- FPS monitoring and metrics tracking
- Automatic performance tier adjustment support
- Optimized renderer settings for kiosk hardware

### 7.1 WalnutFrame Component ✓
- Beveled frame geometry with rounded corners
- Walnut wood material (#6B3F2B)
- PBR properties with proper roughness and metalness
- Ambient occlusion through geometry detail

**File:** `WalnutFrame.tsx`

### 7.2 GlassPane Component ✓
- Reflective glass using MeshPhysicalMaterial
- Procedural roughness map with fingerprint effects
- Procedural normal map for surface variation
- Environment mapping for reflections
- Glass transmission and refraction (IOR 1.5)
- Performance-optimized rendering

**File:** `GlassPane.tsx`

### 7.3 BoardFloor Component ✓
- 3×3 grid of marble tiles
- Procedural marble texture with veining
- Deep green PBR material (#0E6B5C)
- Baked ambient occlusion
- Configurable tile size and gaps

**File:** `BoardFloor.tsx`

### 7.4 ClueBoard3D Component ✓
- Main composition component
- Integrates frame, glass, and floor
- Motion tier support
- Ready for room tiles

**File:** `ClueBoard3D.tsx`

## Next Steps

The board structure is complete and ready for:
- **Task 8**: Room Tiles (RoomTile3D, BrassNameplate, center logo)
- **Task 9**: Touch Interaction System
- **Task 10**: Navigation Transitions

## Testing

Use `BoardSceneExample.tsx` to test the scene:

```tsx
import { BoardSceneExample } from '@/components/3d';

<BoardSceneExample />
```

## Architecture

```
BoardScene (Canvas)
├── Lighting (Key + Fill + Ambient)
├── CameraController (Orthographic)
└── ClueBoard3D
    ├── WalnutFrame (Beveled frame)
    ├── BoardFloor (3×3 marble grid)
    ├── GlassPane (Reflective layer)
    └── [Room Tiles - Task 8]
```

## Dependencies

- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Helper components (OrthographicCamera)
- `three`: 3D graphics library
- `zustand`: State management (kiosk + performance stores)
