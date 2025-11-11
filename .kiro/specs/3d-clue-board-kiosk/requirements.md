# Requirements Document: 3D Clue Board Kiosk Interface

## Introduction

This document specifies requirements for a 3D interactive kiosk interface featuring a physical "Clue board in a wooden display box" design. The system must run 100% offline on Windows 10 in kiosk mode on a 55″ 4K touchscreen display, providing an elegant, museum-quality navigation experience for the MC Museum & Archives.

## Glossary

- **Kiosk System**: The complete Windows 10 application running in full-screen kiosk mode
- **Board Scene**: The 3D rendered Clue board with 8 room tiles and 1 center logo tile
- **Room Tile**: An interactive 3D element representing a navigable section (Alumni, Publications, etc.)
- **Motion Tier**: Performance level ('full', 'lite', 'static') automatically assigned based on hardware capabilities
- **Attract Loop**: Idle animation sequence that draws attention when no user interaction occurs
- **Admin Overlay**: Hidden administrative interface accessible via gesture + PIN
- **Session Timer**: Inactivity counter that resets the kiosk to home after timeout
- **Route Transition**: Animated camera movement and scene change when navigating between sections
- **Hit Target**: Touch-interactive area with minimum 56px logical size for accessibility

## Requirements

### Requirement 1: 3D Scene Rendering

**User Story:** As a museum visitor, I want to see a beautiful 3D Clue board in a wooden display case, so that I feel immersed in an elegant, tactile experience.

#### Acceptance Criteria

1. WHEN THE Kiosk System loads, THE Board Scene SHALL render a 3×3 grid with 8 room tiles around edges and 1 center logo tile
2. WHEN THE Board Scene renders, THE Kiosk System SHALL display a beveled walnut frame with rounded corners and soft ambient occlusion
3. WHEN THE Board Scene renders, THE Kiosk System SHALL apply a slightly reflective glass pane effect using cube-mapped reflection and roughness map
4. WHEN THE Board Scene renders, THE Kiosk System SHALL use deep green marble PBR material for the board floor
5. WHEN THE Board Scene renders, THE Kiosk System SHALL display brass embossed nameplates for each room label
6. WHEN THE Board Scene renders, THE Kiosk System SHALL apply warm area light from top-left and fill light from bottom-right
7. WHEN THE Board Scene renders, THE Kiosk System SHALL use the color palette: walnut #6B3F2B, brass #CDAF63, board teal #0E6B5C, accents #F5E6C8
8. WHEN THE Board Scene renders, THE Kiosk System SHALL use elegant serif typography (Cinzel or Source Serif) for room labels

### Requirement 2: Camera System

**User Story:** As a museum visitor, I want the board to appear flat and centered by default with subtle depth on interaction, so that I can easily see all options without distortion.

#### Acceptance Criteria

1. WHEN THE Board Scene loads, THE Kiosk System SHALL use an orthographic camera by default
2. WHEN a user hovers over a Room Tile, THE Kiosk System SHALL apply a small perspective nudge to show depth
3. WHEN THE Board Scene renders, THE Kiosk System SHALL maintain fixed composition to keep all Room Tiles visible and reachable
4. WHEN THE Board Scene renders, THE Kiosk System SHALL ensure the board is pixel-perfect in view with no clipping

### Requirement 3: Touch-First Interaction

**User Story:** As a museum visitor using a touchscreen, I want large, easy-to-tap targets that respond immediately, so that I can navigate without frustration.

#### Acceptance Criteria

1. WHEN THE Kiosk System renders interactive elements, THE Kiosk System SHALL provide minimum Hit Target size of 56 pixels logical
2. WHEN a user taps a Room Tile, THE Kiosk System SHALL navigate to the corresponding section
3. WHEN a user taps and holds for 3 seconds in the upper-left corner, THE Kiosk System SHALL open the Admin Overlay
4. WHEN a user performs a two-finger tap anywhere, THE Kiosk System SHALL navigate back to home
5. WHEN a user attempts pinch or scroll gestures, THE Kiosk System SHALL disable these gestures to prevent accidental zoom
6. WHEN a user taps during a Route Transition, THE Kiosk System SHALL ignore the input until transition completes

### Requirement 4: Idle and Attract Behavior

**User Story:** As a museum administrator, I want the kiosk to attract attention when idle and reset after extended inactivity, so that it's always ready for the next visitor.

#### Acceptance Criteria

1. WHEN 45 seconds pass with no user interaction, THE Kiosk System SHALL start the Attract Loop with gentle breathing tilt and soft glow sweep
2. WHEN 120 seconds pass with no user interaction, THE Kiosk System SHALL auto-reset to home and clear all modal states
3. WHEN any navigation activity occurs, THE Kiosk System SHALL reset the Session Timer
4. WHEN the Session Timer reaches 2 minutes of inactivity, THE Kiosk System SHALL return to the Board Scene

### Requirement 5: Navigation Transitions

**User Story:** As a museum visitor, I want smooth, elegant transitions when selecting a room, so that the experience feels polished and intentional.

#### Acceptance Criteria

1. WHEN a user taps a Room Tile, THE Kiosk System SHALL lock input to prevent double-taps
2. WHEN a user taps a Room Tile, THE Kiosk System SHALL trigger a brass plaque emissive pulse lasting 300 milliseconds
3. WHEN the emissive pulse completes, THE Kiosk System SHALL perform a camera dolly-in through the doorway lasting 500 to 700 milliseconds
4. WHEN the camera dolly completes, THE Kiosk System SHALL swap to the new route content
5. WHEN transitioning between routes, THE Kiosk System SHALL use cross-fade without white flashes
6. WHEN a Route Transition is in progress, THE Kiosk System SHALL guard against additional tap inputs

### Requirement 6: Performance Tiers

**User Story:** As a museum administrator, I want the kiosk to automatically adjust visual quality based on hardware, so that it runs smoothly on different devices.

#### Acceptance Criteria

1. WHEN THE Kiosk System boots, THE Kiosk System SHALL detect device capabilities and assign a Motion Tier
2. WHEN Motion Tier is 'full', THE Kiosk System SHALL enable board tilt, parallax, and emissive pulses targeting 60 fps
3. WHEN Motion Tier is 'lite', THE Kiosk System SHALL enable parallax only without global tilt targeting 55-60 fps
4. WHEN Motion Tier is 'static', THE Kiosk System SHALL use cross-fade highlights only
5. WHEN sustained frame drops are detected on 'full' tier, THE Kiosk System SHALL automatically downgrade to 'lite' tier

### Requirement 7: Performance Budgets

**User Story:** As a museum administrator, I want the kiosk to load quickly and run smoothly, so that visitors don't experience delays or stuttering.

#### Acceptance Criteria

1. WHEN THE Kiosk System loads, THE Kiosk System SHALL deliver initial app payload of 3.5 MB or less before first interaction
2. WHEN THE Kiosk System loads, THE Kiosk System SHALL complete main thread blocking time within 200 milliseconds on target hardware
3. WHEN THE Board Scene renders, THE Kiosk System SHALL use 120 draw calls or fewer
4. WHEN THE Kiosk System loads textures, THE Kiosk System SHALL use KTX2 format with dual sets: 2k for desktop, 1k for lite
5. WHEN THE Kiosk System loads per-room assets, THE Kiosk System SHALL limit mesh and textures to 350 KB or less per room
6. WHEN THE Kiosk System loads 3D assets, THE Kiosk System SHALL use draco or meshopt compression
7. WHEN THE Kiosk System loads the scene, THE Kiosk System SHALL use one glTF file with separate room nodes for hit-testing

### Requirement 8: Kiosk Mode Operation

**User Story:** As a museum administrator, I want the kiosk to run in full-screen mode without OS chrome, so that visitors have an immersive, distraction-free experience.

#### Acceptance Criteria

1. WHEN Windows 10 user logs in, THE Kiosk System SHALL boot to full-screen within 5 seconds
2. WHEN THE Kiosk System runs, THE Kiosk System SHALL hide all OS chrome and taskbar
3. WHEN THE Kiosk System runs, THE Kiosk System SHALL operate entirely offline with no network requests
4. WHEN THE Kiosk System runs for 24 hours, THE Kiosk System SHALL maintain stable memory usage without leaks
5. WHEN THE Kiosk System requires text input, THE Kiosk System SHALL provide custom on-screen keyboard components

### Requirement 9: Accessibility Compliance

**User Story:** As a museum visitor with accessibility needs, I want large, high-contrast labels and keyboard navigation support, so that I can use the kiosk independently.

#### Acceptance Criteria

1. WHEN THE Kiosk System renders text, THE Kiosk System SHALL use big, high-contrast labels with color-blind safe palette
2. WHEN reduced motion is enabled in Admin Overlay, THE Kiosk System SHALL disable tilt and use cross-fade only
3. WHEN a user operates HID keyboard, THE Kiosk System SHALL support arrow keys and Enter for navigation
4. WHEN THE Kiosk System renders interactive elements, THE Kiosk System SHALL ensure all Room Tiles are focusable and operable via keyboard

### Requirement 10: Admin Overlay

**User Story:** As a museum administrator, I want a hidden admin interface to configure settings and monitor performance, so that I can maintain the kiosk without disrupting visitors.

#### Acceptance Criteria

1. WHEN a user performs the admin gesture and enters correct PIN, THE Kiosk System SHALL open the Admin Overlay
2. WHEN the Admin Overlay is open, THE Kiosk System SHALL provide controls for idle timers configuration
3. WHEN the Admin Overlay is open, THE Kiosk System SHALL provide controls for Motion Tier override
4. WHEN the Admin Overlay is open, THE Kiosk System SHALL provide reduced motion toggle
5. WHEN the Admin Overlay is open, THE Kiosk System SHALL display performance metrics and diagnostics

### Requirement 11: WebGL Fallback

**User Story:** As a museum visitor on a device without WebGL support, I want a functional 2D interface, so that I can still navigate the content.

#### Acceptance Criteria

1. WHEN WebGL is not available, THE Kiosk System SHALL automatically activate a 2D CSS fallback page
2. WHEN reduced motion preference is enabled, THE Kiosk System SHALL automatically activate the 2D CSS fallback page
3. WHEN the 2D fallback is active, THE Kiosk System SHALL mirror the board layout and links from the 3D version

### Requirement 12: Configuration Management

**User Story:** As a museum administrator, I want to configure rooms, timers, and settings via JSON files, so that I can customize the kiosk without code changes.

#### Acceptance Criteria

1. WHEN THE Kiosk System loads, THE Kiosk System SHALL read room definitions from rooms.json file
2. WHEN THE Kiosk System loads, THE Kiosk System SHALL read configuration from config.json including PIN, idle timers, and default Motion Tier
3. WHEN configuration files are updated, THE Kiosk System SHALL apply changes on next boot

### Requirement 13: Quality Assurance

**User Story:** As a museum administrator, I want automated tests to verify core functionality, so that I can deploy updates with confidence.

#### Acceptance Criteria

1. WHEN automated tests run, THE Kiosk System SHALL pass launch test verifying boot within 5 seconds
2. WHEN automated tests run, THE Kiosk System SHALL pass route tap test verifying all room navigation
3. WHEN automated tests run, THE Kiosk System SHALL pass idle reset test verifying 120-second timeout
4. WHEN automated tests run, THE Kiosk System SHALL pass admin overlay test verifying open and close functionality
5. WHEN automated tests run, THE Kiosk System SHALL pass 24-hour soak test verifying no memory leaks
