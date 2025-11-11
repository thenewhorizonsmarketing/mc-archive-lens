# 3D Clue Board Kiosk Interface - Specification

## Overview

This specification defines a complete 3D interactive kiosk interface featuring a physical "Clue board in a wooden display box" design. The system runs 100% offline on Windows 10 in kiosk mode on a 55″ 4K touchscreen display.

## Specification Status

✅ **Requirements**: Complete (13 requirements)  
✅ **Design**: Complete (14 core components, full architecture)  
✅ **Tasks**: Complete (17 major tasks, 60+ sub-tasks)

## Key Features

- **3D Rendering**: React Three Fiber + Three.js with WebGL
- **Kiosk Mode**: Electron full-screen on Windows 10
- **Touch-First**: 56px minimum hit targets, gesture support
- **Performance**: 60 FPS target with automatic tier adjustment
- **Offline**: 100% local operation, no network requests
- **Accessibility**: Keyboard navigation, reduced motion, high contrast
- **Fallback**: 2D CSS version when WebGL unavailable

## Technical Stack

- **Desktop Shell**: Electron 27+
- **UI Framework**: React 18
- **3D Rendering**: React Three Fiber + Three.js
- **State Management**: Zustand
- **Build Tool**: Vite
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest + React Testing Library

## Performance Targets

- **Boot Time**: ≤ 5 seconds to full-screen
- **Frame Rate**: 60 FPS (≥55 acceptable)
- **Bundle Size**: ≤ 3.5 MB initial payload
- **Draw Calls**: ≤ 120 per frame
- **Blocking Time**: ≤ 200ms on target hardware
- **Asset Budget**: ≤ 350 KB per room

## Motion Tiers

### Full (Desktop GPU)
- Board tilt + parallax
- Emissive pulses
- Target: 60 FPS

### Lite (Integrated Graphics)
- Parallax only (no tilt)
- Target: 55-60 FPS

### Static (Fallback)
- Cross-fade highlights only
- Guaranteed smooth performance

## Visual Specifications

### Color Palette
- Walnut Frame: `#6B3F2B`
- Brass Nameplates: `#CDAF63`
- Board Teal: `#0E6B5C`
- Accents: `#F5E6C8`

### Materials
- Deep green marble floor (PBR)
- Brass embossed nameplates
- Walnut beveled frame with rounded corners
- Reflective glass pane (cube-mapped + roughness)

### Typography
- Elegant serif (Cinzel or Source Serif)
- High contrast for accessibility

## Interaction Design

### Gestures
- **Tap room**: Navigate to section
- **Tap-and-hold 3s** (upper-left): Admin overlay
- **Two-finger tap**: Back/Home
- **Pinch/scroll**: Disabled

### Transitions
1. Tap room → Lock input
2. Brass plaque emissive pulse (300ms)
3. Camera dolly-in through doorway (500-700ms)
4. Route swap with cross-fade

### Idle Behavior
- **45 seconds**: Start attract loop (breathing tilt + glow sweep)
- **120 seconds**: Auto-reset to home, clear modals
- **Any interaction**: Reset timers

## File Structure

```
.kiro/specs/3d-clue-board-kiosk/
├── README.md           # This file
├── requirements.md     # 13 EARS-compliant requirements
├── design.md          # Complete technical design
└── tasks.md           # 17 major tasks, 60+ sub-tasks
```

## Getting Started

### For Implementation

1. Read `requirements.md` to understand what needs to be built
2. Review `design.md` for technical architecture and component interfaces
3. Follow `tasks.md` sequentially for implementation

### For Review

1. **Requirements Review**: Verify all acceptance criteria are testable
2. **Design Review**: Validate architecture and component design
3. **Tasks Review**: Ensure tasks are actionable and complete

## Implementation Approach

Tasks are designed to be implemented incrementally:

1. **Foundation** (Tasks 1-5): Project setup, config, Electron shell, React app, asset loading
2. **3D Core** (Tasks 6-8): Scene setup, board components, room tiles
3. **Interaction** (Tasks 9-11): Touch handling, transitions, idle behavior
4. **Optimization** (Tasks 12-13): Performance monitoring, admin overlay
5. **Accessibility** (Tasks 14-15): Fallback, keyboard nav, reduced motion
6. **Quality** (Tasks 16-17): Testing, deployment, documentation

## Success Criteria

- [ ] Boots to full-screen within 5 seconds
- [ ] All interactions operable by touch (56px+ targets)
- [ ] Maintains 60 FPS (≥55) on target hardware
- [ ] Tap triggers pulse + ≤700ms transition
- [ ] 45s idle → attract; 120s idle → reset
- [ ] 24/7 operation without memory leaks
- [ ] Admin overlay accessible via gesture + PIN
- [ ] No network requests during operation
- [ ] 2D fallback works when WebGL unavailable
- [ ] All automated tests pass

## Next Steps

To begin implementation:

1. Open `tasks.md` in Kiro
2. Click "Start task" next to task 1.1
3. Follow the implementation plan sequentially
4. Mark tasks complete as you finish them

## Questions or Issues?

Refer to the detailed documentation in:
- `requirements.md` - What needs to be built
- `design.md` - How it should be built
- `tasks.md` - Step-by-step implementation guide

---

**Spec Version**: 1.0  
**Created**: 2025-11-09  
**Status**: Ready for Implementation
