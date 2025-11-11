# Design Document: 3D Clue Board Kiosk Interface

## Overview

This document details the technical design for a 3D interactive kiosk interface featuring a physical "Clue board in a wooden display box." The system uses React Three Fiber (R3F) for 3D rendering, Electron for kiosk deployment, and runs entirely offline on Windows 10 targeting a 55″ 4K touchscreen display.

The design prioritizes performance (60fps target), offline operation, touch-first interaction, and museum-quality visual presentation while maintaining strict performance budgets for kiosk hardware.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Shell                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Application Layer                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         React Three Fiber (R3F)                 │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │         Three.js Renderer                 │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │         WebGL Context               │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │ Config   │        │  Asset   │        │  State   │
   │ Manager  │        │  Loader  │        │ Manager  │
   └──────────┘        └──────────┘        └──────────┘
```

### Technology Stack

- **Electron**: Desktop application shell for Windows 10 kiosk mode
- **React 18**: UI framework with concurrent features
- **React Three Fiber (R3F)**: React renderer for Three.js
- **Three.js**: 3D graphics library (WebGL)
- **Zustand**: Lightweight state management
- **@react-three/drei**: R3F helpers and abstractions
- **@react-three/postprocessing**: Optional post-processing effects
- **KTX2 / Basis Universal**: Texture compression
- **Draco / Meshopt**: Geometry compression

## Components and Interfaces

### Core Components

#### 1. KioskApp (Root Component)

```typescript
interface KioskAppProps {
  config: KioskConfig;
}

interface KioskConfig {
  rooms: RoomDefinition[];
  idleTimeout: number;
  attractTimeout: number;
  adminPin: string;
  motionTier: 'full' | 'lite' | 'static' | 'auto';
  reducedMotion: boolean;
}

// Main application component that initializes Electron and React
const KioskApp: React.FC<KioskAppProps>
```

#### 2. BoardScene (3D Scene Container)

```typescript
interface BoardSceneProps {
  rooms: RoomDefinition[];
  onRoomSelect: (roomId: string) => void;
  motionTier: MotionTier;
}

// R3F Canvas wrapper with scene setup
const BoardScene: React.FC<BoardSceneProps>
```

#### 3. ClueBoard3D (Main 3D Board)

```typescript
interface ClueBoard3DProps {
  rooms: RoomDefinition[];
  onTileClick: (roomId: string) => void;
  isTransitioning: boolean;
  motionTier: MotionTier;
}

// 3D board with frame, glass, and tiles
const ClueBoard3D: React.FC<ClueBoard3DProps>
```

#### 4. WalnutFrame (Frame Geometry)

```typescript
interface WalnutFrameProps {
  width: number;
  height: number;
  depth: number;
  bevelSize: number;
  cornerRadius: number;
}

// Beveled walnut frame with rounded corners
const WalnutFrame: React.FC<WalnutFrameProps>
```

#### 5. GlassPane (Reflective Glass Layer)

```typescript
interface GlassPaneProps {
  width: number;
  height: number;
  envMap: THREE.CubeTexture;
  roughnessMap: THREE.Texture;
  normalMap: THREE.Texture;
}

// Slightly reflective glass with fingerprints
const GlassPane: React.FC<GlassPaneProps>
```

#### 6. RoomTile3D (Interactive Room Tile)

```typescript
interface RoomTile3DProps {
  room: RoomDefinition;
  position: [number, number, number];
  onClick: () => void;
  isHovered: boolean;
  isZooming: boolean;
  motionTier: MotionTier;
}

// Individual room tile with marble floor and brass nameplate
const RoomTile3D: React.FC<RoomTile3DProps>
```

#### 7. BrassNameplate (Embossed Label)

```typescript
interface BrassNameplateProps {
  text: string;
  width: number;
  height: number;
}

// Embossed brass nameplate with text
const BrassNameplate: React.FC<BrassNameplateProps>
```

#### 8. CameraController (Camera Management)

```typescript
interface CameraControllerProps {
  isTransitioning: boolean;
  targetRoom: string | null;
  motionTier: MotionTier;
}

// Manages orthographic camera and transitions
const CameraController: React.FC<CameraControllerProps>
```

#### 9. TouchHandler (Touch Interaction)

```typescript
interface TouchHandlerProps {
  onRoomTap: (roomId: string) => void;
  onAdminGesture: () => void;
  onBackGesture: () => void;
  isTransitioning: boolean;
}

// Handles touch gestures and hit detection
const TouchHandler: React.FC<TouchHandlerProps>
```

#### 10. IdleManager (Idle/Attract Behavior)

```typescript
interface IdleManagerProps {
  idleTimeout: number;
  attractTimeout: number;
  onIdle: () => void;
  onAttract: () => void;
  onReset: () => void;
}

// Manages idle timers and attract loop
const IdleManager: React.FC<IdleManagerProps>
```

#### 11. PerformanceMonitor (FPS/Performance Tracking)

```typescript
interface PerformanceMonitorProps {
  onTierChange: (tier: MotionTier) => void;
  targetFPS: number;
}

// Monitors performance and adjusts motion tier
const PerformanceMonitor: React.FC<PerformanceMonitorProps>
```

#### 12. AdminOverlay (Admin Interface)

```typescript
interface AdminOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  config: KioskConfig;
  onConfigChange: (config: Partial<KioskConfig>) => void;
}

// Admin configuration overlay
const AdminOverlay: React.FC<AdminOverlayProps>
```

#### 13. FallbackBoard (2D CSS Fallback)

```typescript
interface FallbackBoardProps {
  rooms: RoomDefinition[];
  onRoomClick: (roomId: string) => void;
}

// 2D CSS version when WebGL unavailable
const FallbackBoard: React.FC<FallbackBoardProps>
```

#### 14. RouteTransition (Scene Transition)

```typescript
interface RouteTransitionProps {
  isTransitioning: boolean;
  duration: number;
  onComplete: () => void;
}

// Cross-fade transition between routes
const RouteTransition: React.FC<RouteTransitionProps>
```

### Supporting Components

#### AssetLoader

```typescript
interface AssetLoaderProps {
  assets: AssetManifest;
  onProgress: (progress: number) => void;
  onComplete: (assets: LoadedAssets) => void;
}

// Preloads and manages 3D assets
const AssetLoader: React.FC<AssetLoaderProps>
```

#### LoadingScreen

```typescript
interface LoadingScreenProps {
  progress: number;
}

// Boot loading screen
const LoadingScreen: React.FC<LoadingScreenProps>
```

## Data Models

### RoomDefinition

```typescript
interface RoomDefinition {
  id: string;
  title: string;
  description: string;
  icon: string; // Path to icon asset
  route: string; // Navigation route
  position: GridPosition;
  color: string; // Accent color
}

type GridPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';
```

### AssetManifest

```typescript
interface AssetManifest {
  models: ModelAsset[];
  textures: TextureAsset[];
  fonts: FontAsset[];
}

interface ModelAsset {
  id: string;
  path: string;
  format: 'gltf' | 'glb';
  compression: 'draco' | 'meshopt' | 'none';
  size: number; // bytes
}

interface TextureAsset {
  id: string;
  path: string;
  format: 'ktx2' | 'png' | 'jpg';
  resolution: '1k' | '2k';
  size: number; // bytes
}

interface FontAsset {
  id: string;
  path: string;
  format: 'woff2';
}
```

### MotionTier

```typescript
type MotionTier = 'full' | 'lite' | 'static';

interface MotionTierConfig {
  tier: MotionTier;
  features: {
    boardTilt: boolean;
    parallax: boolean;
    emissivePulse: boolean;
    cameraTransition: boolean;
  };
  targetFPS: number;
}
```

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  gpuMemory: number;
}
```

## Error Handling

### Error Boundaries

```typescript
class KioskErrorBoundary extends React.Component {
  // Catches React errors and shows fallback UI
}

class WebGLErrorBoundary extends React.Component {
  // Catches WebGL errors and activates 2D fallback
}
```

### Error Recovery

```typescript
interface ErrorRecoveryStrategy {
  onWebGLContextLost: () => void;
  onAssetLoadFailure: (assetId: string) => void;
  onPerformanceDegradation: () => void;
  onMemoryPressure: () => void;
}
```

## Testing Strategy

### Unit Tests

- Component rendering tests
- State management tests
- Utility function tests
- Configuration parsing tests

### Integration Tests

- Touch gesture recognition
- Camera transition timing
- Asset loading pipeline
- Performance tier detection

### End-to-End Tests

- Launch test (boot within 5s)
- Room navigation test (all 8 rooms)
- Idle reset test (45s attract, 120s reset)
- Admin overlay test (gesture + PIN)
- 24-hour soak test (memory stability)

### Performance Tests

- FPS monitoring during transitions
- Draw call counting
- Memory leak detection
- Asset size validation

### Accessibility Tests

- Keyboard navigation
- Screen reader compatibility
- High contrast mode
- Reduced motion support

## Deployment

### Build Process

```bash
# Development
npm run dev

# Production build
npm run build:electron

# Package for Windows
npm run package:win
```

### Electron Configuration

```javascript
// electron.config.js
module.exports = {
  kiosk: true,
  fullscreen: true,
  frame: false,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    webgl: true,
    offscreen: false
  }
};
```

### Windows Kiosk Setup

```powershell
# Auto-start on login
# Create shortcut in shell:startup folder
# Configure Windows 10 Kiosk Mode
```

## Performance Optimization

### Asset Optimization

- KTX2 textures with Basis Universal compression
- Draco geometry compression
- Meshopt for vertex optimization
- Texture atlasing for nameplates
- LOD (Level of Detail) for distant elements

### Rendering Optimization

- Frustum culling
- Occlusion culling
- Instanced rendering for repeated elements
- Baked ambient occlusion
- Lightmaps instead of real-time lighting
- Single draw call per material where possible

### Memory Management

- Asset unloading for unused routes
- Texture streaming
- Geometry pooling
- Dispose of Three.js objects properly

### Code Splitting

- Route-based code splitting
- Lazy loading for admin overlay
- Dynamic imports for heavy components

## Security Considerations

- No external network requests
- Sandboxed Electron renderer
- PIN-protected admin access
- Secure configuration storage
- Input validation for all user interactions

---

This design provides a comprehensive blueprint for implementing the 3D Clue Board Kiosk Interface with all required features, performance targets, and quality standards.
