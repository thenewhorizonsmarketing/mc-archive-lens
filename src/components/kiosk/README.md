# Kiosk Application Core Structure

This directory contains the core React application structure for the 3D Clue Board Kiosk Interface.

## Overview

Task 4 "Core React Application Structure" has been completed, implementing:

1. **Global State Management with Zustand** (Task 4.3)
2. **WebGL Detection and Fallback Logic** (Task 4.2)
3. **Root KioskApp Component** (Task 4.1)

## Components

### KioskApp

The root component that orchestrates the entire kiosk application.

**Location:** `src/components/kiosk/KioskApp.tsx`

**Responsibilities:**
- Load configuration on mount from `/config/config.json` and `/config/rooms.json`
- Initialize all Zustand stores (kiosk, performance, idle)
- Detect WebGL availability and version
- Check for reduced motion preference
- Provide error boundaries for graceful error handling
- Conditionally render 3D or 2D fallback based on capabilities
- Start idle timer after initialization
- Handle user activity tracking

**Usage:**

```tsx
import { KioskApp } from '@/components/kiosk';

function App() {
  return (
    <KioskApp>
      {({ config, isLoading, use3D, webGLAvailable }) => {
        if (isLoading) return <LoadingScreen />;
        if (!config) return <ErrorScreen />;
        
        return use3D && webGLAvailable 
          ? <ThreeDBoard config={config} />
          : <TwoDFallback config={config} />;
      }}
    </KioskApp>
  );
}
```

### Error Boundaries

#### KioskErrorBoundary

Catches all React errors and displays a fallback UI with restart option.

**Location:** `src/components/error/KioskErrorBoundary.tsx`

**Features:**
- Catches and logs React errors
- Shows user-friendly error screen
- Provides "Restart Kiosk" button that reloads the page

#### WebGLErrorBoundary

Catches WebGL-specific errors and automatically activates 2D fallback.

**Location:** `src/components/error/WebGLErrorBoundary.tsx`

**Features:**
- Detects WebGL-related errors (context lost, shader errors, etc.)
- Automatically switches to 2D fallback mode
- Notifies parent component via callback

## State Management

All state is managed using Zustand stores located in `src/store/`.

### Kiosk Store

**Location:** `src/store/kioskStore.ts`

**State:**
- `currentRoute`: Current active route
- `previousRoute`: Previous route for back navigation
- `isTransitioning`: Whether a route transition is in progress
- `transitionProgress`: Progress of current transition (0-1)
- `targetRoute`: Target route for ongoing transition

**Actions:**
- `setRoute(route)`: Change current route
- `startTransition(targetRoute)`: Begin transition to new route
- `updateTransitionProgress(progress)`: Update transition progress
- `completeTransition()`: Finish transition and update route
- `cancelTransition()`: Cancel ongoing transition
- `goBack()`: Navigate to previous route
- `goHome()`: Navigate to home route

### Performance Store

**Location:** `src/store/performanceStore.ts`

**State:**
- `motionTier`: Current motion tier ('full', 'lite', 'static')
- `autoTierEnabled`: Whether automatic tier adjustment is enabled
- `currentFPS`: Current frames per second
- `averageFPS`: Average FPS over recent history
- `targetFPS`: Target FPS (default 60)
- `metrics`: Performance metrics (draw calls, triangles, memory)
- `fpsHistory`: Recent FPS samples for averaging
- `webGLAvailable`: Whether WebGL is available
- `webGLVersion`: WebGL version (1 or 2)

**Actions:**
- `setMotionTier(tier)`: Set motion tier manually
- `setAutoTier(enabled)`: Enable/disable auto tier adjustment
- `updateFPS(fps)`: Update current FPS and history
- `updateMetrics(metrics)`: Update performance metrics
- `setWebGLAvailable(available, version)`: Set WebGL availability
- `autoDowngradeTier()`: Automatically downgrade tier if FPS drops
- `resetMetrics()`: Reset all metrics to defaults

### Idle Store

**Location:** `src/store/idleStore.ts`

**State:**
- `isIdle`: Whether system is currently idle
- `isInAttractMode`: Whether attract mode is active
- `lastActivityTime`: Timestamp of last user activity
- `idleTimeout`: Milliseconds before entering attract mode (default 45000)
- `attractTimeout`: Milliseconds before auto-reset (default 120000)

**Actions:**
- `recordActivity()`: Record user activity and reset timers
- `startIdleTimer()`: Start idle and attract timers
- `stopIdleTimer()`: Stop all timers
- `enterAttractMode()`: Enter attract mode
- `exitAttractMode()`: Exit attract mode
- `triggerAutoReset()`: Trigger auto-reset to home
- `setIdleTimeout(timeout)`: Set idle timeout
- `setAttractTimeout(timeout)`: Set attract timeout
- `resetAll()`: Reset all idle state

## WebGL Detection

**Location:** `src/lib/webgl/webglDetector.ts`

### Functions

#### `detectWebGL(): WebGLCapabilities`

Detects WebGL support and returns detailed capabilities:
- `available`: Whether WebGL is available
- `version`: WebGL version (1 or 2)
- `renderer`: GPU renderer name
- `vendor`: GPU vendor name
- `maxTextureSize`: Maximum texture size
- `maxVertexUniforms`: Maximum vertex uniforms
- `maxFragmentUniforms`: Maximum fragment uniforms
- `extensions`: List of supported extensions

#### `prefersReducedMotion(): boolean`

Checks if user has enabled reduced motion preference in their OS.

#### `should3DMode(): boolean`

Determines if 3D mode should be used based on WebGL availability and reduced motion preference.

#### `logWebGLCapabilities(capabilities): void`

Logs WebGL capabilities to console in a formatted group.

## Configuration

The KioskApp loads configuration from two JSON files:

### `/config/config.json`

Main kiosk configuration:

```json
{
  "idleTimeout": 45,
  "attractTimeout": 120,
  "adminPin": "1234",
  "motionTier": "auto",
  "reducedMotion": false
}
```

### `/config/rooms.json`

Room definitions:

```json
{
  "rooms": [
    {
      "id": "alumni",
      "title": "Alumni",
      "description": "Browse alumni records",
      "icon": "/icons/alumni.svg",
      "route": "/alumni",
      "position": "top-left",
      "color": "#F5E6C8"
    }
  ]
}
```

## Requirements Satisfied

### Requirement 11.1 - WebGL Fallback
✅ Automatically activates 2D CSS fallback when WebGL is not available

### Requirement 11.2 - Reduced Motion Support
✅ Automatically activates 2D CSS fallback when reduced motion preference is enabled

### Requirement 4.1 - Idle Timer
✅ Tracks user activity and manages idle timers

### Requirement 4.2 - Attract Mode
✅ Enters attract mode after 45 seconds of inactivity

### Requirement 4.3 - Auto-Reset
✅ Resets to home after 120 seconds of inactivity

### Requirement 4.4 - Activity Tracking
✅ Resets timers on any user interaction

## Next Steps

The following tasks can now be implemented:

- **Task 5**: Asset Loading System
- **Task 6**: 3D Scene Foundation
- **Task 7**: 3D Board Components
- **Task 8**: Room Tiles
- **Task 9**: Touch Interaction System

These tasks will build upon the core structure established here.

## Testing

To test the implementation:

```bash
# Run type checking
npm run build

# Run tests (when tests are added)
npm run test

# Start development server
npm run dev
```

## Example Integration

See `KioskAppExample.tsx` for complete usage examples.
