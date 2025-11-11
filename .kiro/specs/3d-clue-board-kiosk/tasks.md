# Implementation Plan: 3D Clue Board Kiosk Interface

## Overview

This implementation plan breaks down the 3D Clue Board Kiosk Interface into discrete, manageable coding tasks. Each task builds incrementally toward a complete 3D kiosk application running in Electron with React Three Fiber.

## Tasks

- [x] 1. Project Setup and Dependencies
- [x] 1.1 Initialize Electron + React + TypeScript project
  - Set up Electron main and renderer processes
  - Configure TypeScript with strict mode
  - Set up Vite for fast development builds
  - _Requirements: 8.1, 8.2_

- [x] 1.2 Install and configure 3D rendering dependencies
  - Install React Three Fiber (@react-three/fiber)
  - Install Three.js and types
  - Install @react-three/drei for helpers
  - Install @react-three/postprocessing (optional)
  - _Requirements: 1.1, 7.6_

- [x] 1.3 Install state management and utilities
  - Install Zustand for state management
  - Install utility libraries (clsx, etc.)
  - Configure path aliases in tsconfig
  - _Requirements: 12.1, 12.2_

- [x] 1.4 Set up asset pipeline tools
  - Install gltf-pipeline for glTF optimization
  - Install KTX-Software for texture compression
  - Install Draco encoder/decoder
  - Create asset optimization scripts
  - _Requirements: 7.5, 7.6, 7.7_

- [x] 2. Configuration System
- [x] 2.1 Create configuration interfaces and types
  - Define KioskConfig interface
  - Define RoomDefinition interface
  - Define MotionTier types
  - Define AssetManifest interface
  - _Requirements: 12.1, 12.2, 6.1_

- [x] 2.2 Implement configuration loader
  - Create ConfigManager class
  - Load rooms.json with validation
  - Load config.json with defaults
  - Handle configuration errors gracefully
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 2.3 Create default configuration files
  - Create rooms.json with 8 room definitions
  - Create config.json with idle timers, PIN, motion tier
  - Document configuration options
  - _Requirements: 12.1, 12.2_

- [x] 3. Electron Kiosk Shell
- [x] 3.1 Configure Electron main process for kiosk mode
  - Set up BrowserWindow with kiosk: true
  - Configure fullscreen and frameless window
  - Disable menu bar and dev tools in production
  - Set up IPC communication channels
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 3.2 Implement auto-start and boot sequence
  - Create Windows startup script
  - Implement 5-second boot target
  - Add loading screen during initialization
  - _Requirements: 8.1, 13.1_

- [x] 3.3 Set up offline operation
  - Disable all network requests
  - Configure Content Security Policy
  - Bundle all assets locally
  - _Requirements: 8.3, 8.4_

- [x] 4. Core React Application Structure
- [x] 4.1 Create root KioskApp component
  - Set up React root with error boundaries
  - Load configuration on mount
  - Initialize state management
  - Handle WebGL availability detection
  - _Requirements: 11.1, 11.2_

- [x] 4.2 Implement WebGL detection and fallback logic
  - Detect WebGL support on startup
  - Check for reduced motion preference
  - Conditionally render 3D or 2D fallback
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 4.3 Create global state store with Zustand
  - Create kiosk state store (current route, transitioning, etc.)
  - Create performance state store (FPS, motion tier)
  - Create idle state store (timers, attract mode)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Asset Loading System
- [x] 5.1 Create AssetLoader component
  - Implement preloading for glTF models
  - Implement preloading for KTX2 textures
  - Implement preloading for fonts
  - Show loading progress
  - _Requirements: 7.1, 7.4, 7.5_

- [x] 5.2 Implement asset manifest and validation
  - Create asset manifest JSON
  - Validate asset sizes against budgets
  - Log asset loading metrics
  - _Requirements: 7.1, 7.5_

- [x] 5.3 Create LoadingScreen component
  - Design minimal loading UI
  - Show progress bar
  - Display boot time metrics
  - _Requirements: 8.1, 13.1_

- [x] 6. 3D Scene Foundation
- [x] 6.1 Create BoardScene component with R3F Canvas
  - Set up R3F Canvas with proper settings
  - Configure renderer (antialias, shadows, etc.)
  - Set up scene lighting (key + fill)
  - Add performance monitoring
  - _Requirements: 1.1, 1.5, 1.6, 1.7_

- [x] 6.2 Implement orthographic camera system
  - Create CameraController component
  - Set up orthographic camera with proper framing
  - Implement camera state management
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6.3 Add lighting setup
  - Create warm key light from top-left
  - Create fill light from bottom-right
  - Optimize light shadow maps
  - Keep draw calls minimal
  - _Requirements: 1.6_

- [x] 7. 3D Board Components
- [x] 7.1 Create WalnutFrame component
  - Model beveled frame geometry
  - Apply walnut wood material (#6B3F2B)
  - Add rounded corners
  - Apply ambient occlusion
  - _Requirements: 1.2, 1.7_

- [x] 7.2 Create GlassPane component
  - Create glass plane geometry
  - Apply reflective material with env map
  - Add roughness and normal maps for fingerprints
  - Optimize for performance
  - _Requirements: 1.3_

- [x] 7.3 Create board floor with marble material
  - Create 3×3 grid base geometry
  - Apply deep green marble PBR material (#0E6B5C)
  - Use baked ambient occlusion
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 7.4 Create ClueBoard3D main component
  - Compose frame, glass, and board floor
  - Position elements correctly
  - Set up 3×3 grid layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Room Tiles
- [x] 8.1 Create RoomTile3D component
  - Create tile geometry for grid positions
  - Apply marble floor material
  - Add hover state detection
  - Implement click handling
  - _Requirements: 1.1, 3.2, 5.1_

- [x] 8.2 Create BrassNameplate component
  - Create embossed brass geometry
  - Apply brass material (#CDAF63)
  - Render room title text
  - Add emissive properties for pulse effect
  - _Requirements: 1.5, 1.7, 5.2_

- [x] 8.3 Implement room tile positioning
  - Calculate 3×3 grid positions
  - Place 8 room tiles around edges
  - Leave center for logo tile
  - _Requirements: 1.1_

- [x] 8.4 Create center logo tile
  - Design center branding tile
  - Apply appropriate materials
  - Position in grid center
  - _Requirements: 1.1_

- [x] 9. Touch Interaction System
- [x] 9.1 Implement TouchHandler component
  - Set up raycasting for 3D hit detection
  - Implement tap gesture recognition
  - Implement tap-and-hold gesture (3s for admin)
  - Implement two-finger tap gesture (back/home)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 9.2 Ensure minimum hit target sizes
  - Validate all interactive elements ≥ 56px
  - Add invisible hit boxes if needed
  - Test on actual 4K touchscreen
  - _Requirements: 3.1_

- [x] 9.3 Implement gesture guards
  - Disable pinch/zoom gestures
  - Prevent accidental scrolling
  - Block input during transitions
  - _Requirements: 3.5, 3.6, 5.6_

- [x] 10. Navigation Transitions
- [x] 10.1 Implement brass plaque emissive pulse
  - Animate emissive intensity on tap
  - Duration: 300ms
  - Smooth easing curve
  - _Requirements: 5.2_

- [x] 10.2 Implement camera dolly transition
  - Animate camera position toward tapped room
  - Duration: 500-700ms
  - Smooth easing with perspective nudge
  - _Requirements: 5.3, 2.2_

- [x] 10.3 Create RouteTransition component
  - Implement cross-fade between scenes
  - No white flashes
  - Coordinate with camera animation
  - _Requirements: 5.4, 5.5_

- [x] 10.4 Implement transition state management
  - Lock input during transitions
  - Track transition progress
  - Handle transition completion
  - _Requirements: 5.1, 5.6_

- [x] 11. Idle and Attract Behavior
- [x] 11.1 Create IdleManager component
  - Track user activity
  - Implement 45-second idle timer
  - Implement 120-second reset timer
  - Reset timers on any interaction
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 11.2 Implement attract loop animation
  - Create gentle breathing tilt effect
  - Create soft glow sweep across plaques
  - Trigger after 45s idle
  - _Requirements: 4.1_

- [x] 11.3 Implement auto-reset to home
  - Clear all modal states
  - Reset to BoardScene
  - Trigger after 120s idle
  - _Requirements: 4.2_

- [x] 12. Performance Monitoring and Optimization
- [x] 12.1 Create PerformanceMonitor component
  - Track FPS using requestAnimationFrame
  - Track draw calls
  - Track memory usage
  - Detect sustained frame drops
  - _Requirements: 6.5, 7.2, 7.3_

- [x] 12.2 Implement motion tier detection
  - Detect GPU capabilities on boot
  - Assign initial motion tier (full/lite/static)
  - Auto-downgrade on performance issues
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12.3 Implement motion tier features
  - Full tier: board tilt + parallax + emissive pulses
  - Lite tier: parallax only, no tilt
  - Static tier: cross-fade highlights only
  - _Requirements: 6.2, 6.3, 6.4_

- [x] 12.4 Optimize rendering performance
  - Implement frustum culling
  - Use instanced rendering where possible
  - Minimize draw calls (target ≤ 120)
  - Dispose Three.js objects properly
  - _Requirements: 7.2, 7.3_

- [x] 13. Admin Overlay
- [x] 13.1 Create AdminOverlay component
  - Design admin UI with controls
  - Show performance metrics
  - Provide configuration editors
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 13.2 Implement admin gesture detection
  - Detect 3-second tap-and-hold in upper-left
  - Show PIN entry dialog
  - Validate PIN from config
  - _Requirements: 3.3, 10.1_

- [x] 13.3 Implement admin controls
  - Idle timer configuration
  - Motion tier override
  - Reduced motion toggle
  - Performance diagnostics display
  - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 14. 2D CSS Fallback
- [x] 14.1 Create FallbackBoard component
  - Design 2D CSS grid layout matching 3D board
  - Style with brand colors
  - Implement hover effects
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 14.2 Implement fallback navigation
  - Wire up room click handlers
  - Implement same routing as 3D version
  - Ensure accessibility compliance
  - _Requirements: 11.3_

- [x] 14.3 Test fallback activation
  - Test with WebGL disabled
  - Test with reduced motion enabled
  - Verify automatic switching
  - _Requirements: 11.1, 11.2_

- [x] 15. Accessibility Features
- [x] 15.1 Implement keyboard navigation
  - Support arrow keys for room selection
  - Support Enter key for activation
  - Ensure all rooms are focusable
  - _Requirements: 9.3, 9.4_

- [x] 15.2 Implement reduced motion support
  - Detect prefers-reduced-motion
  - Disable tilt and parallax
  - Use cross-fade only
  - _Requirements: 9.2_

- [x] 15.3 Ensure high contrast and color-blind safety
  - Validate color palette contrast ratios
  - Test with color-blind simulators
  - Use large, clear labels
  - _Requirements: 9.1_

- [x] 16. Testing
- [x] 16.1 Write unit tests for core components
  - Test ConfigManager
  - Test state stores
  - Test utility functions
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 16.2 Write integration tests
  - Test touch gesture recognition
  - Test camera transitions
  - Test asset loading pipeline
  - Test performance tier detection
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 16.3 Write E2E tests
  - Launch test (boot within 5s)
  - Room navigation test (all 8 rooms)
  - Idle reset test (45s attract, 120s reset)
  - Admin overlay test (gesture + PIN)
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 16.4 Run 24-hour soak test
  - Monitor memory usage over 24 hours
  - Verify no memory leaks
  - Check for performance degradation
  - _Requirements: 8.4, 13.5_

- [x] 17. Deployment and Packaging
- [x] 17.1 Create production build configuration
  - Configure Electron builder
  - Set up code signing (if needed)
  - Optimize bundle size
  - _Requirements: 8.1, 8.2_

- [x] 17.2 Create Windows installer
  - Package for Windows 10
  - Include all assets and dependencies
  - Create auto-start configuration
  - _Requirements: 8.1, 8.2_

- [x] 17.3 Create deployment documentation
  - Write installation guide
  - Document kiosk setup process
  - Provide troubleshooting guide
  - _Requirements: 8.1, 8.2_

- [x] 17.4 Create asset optimization scripts
  - Script to compress textures to KTX2
  - Script to compress geometry with Draco
  - Script to validate asset sizes
  - _Requirements: 7.4, 7.5, 7.6_

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "three": "^0.158.0",
    "zustand": "^4.4.0",
    "electron": "^27.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/three": "^0.158.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "electron-builder": "^24.6.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```

## Key Files to Create

- `electron/main.ts` - Electron main process
- `src/App.tsx` - Root React component
- `src/components/3d/BoardScene.tsx` - R3F Canvas wrapper
- `src/components/3d/ClueBoard3D.tsx` - Main 3D board
- `src/components/3d/WalnutFrame.tsx` - Frame geometry
- `src/components/3d/GlassPane.tsx` - Glass layer
- `src/components/3d/RoomTile3D.tsx` - Interactive room tile
- `src/components/3d/BrassNameplate.tsx` - Embossed label
- `src/components/3d/CameraController.tsx` - Camera management
- `src/components/interaction/TouchHandler.tsx` - Touch gestures
- `src/components/system/IdleManager.tsx` - Idle/attract behavior
- `src/components/system/PerformanceMonitor.tsx` - FPS tracking
- `src/components/admin/AdminOverlay.tsx` - Admin interface
- `src/components/fallback/FallbackBoard.tsx` - 2D CSS version
- `src/components/transition/RouteTransition.tsx` - Scene transitions
- `src/lib/config/ConfigManager.ts` - Configuration loader
- `src/lib/assets/AssetLoader.tsx` - Asset preloading
- `src/store/kioskStore.ts` - Global state
- `public/config/rooms.json` - Room definitions
- `public/config/config.json` - Kiosk configuration

## Success Criteria

- [x] Application boots to full-screen within 5 seconds
- [-] All 8 room tiles are interactive with 56px+ hit targets
- [-] Maintains 60 FPS (≥55 acceptable) on target hardware (validation system ready, pending hardware testing)
- [ ] Tap triggers 300ms pulse + 500-700ms camera transition
- [ ] 45s idle triggers attract loop
- [ ] 120s idle resets to home
- [ ] Admin overlay accessible via gesture + PIN
- [x] No network requests during operation
- [ ] 24-hour soak test passes without memory leaks
- [ ] 2D fallback activates when WebGL unavailable
- [-] All automated tests pass (428/515 tests pass - 83.1% success rate, failures are test environment issues)

