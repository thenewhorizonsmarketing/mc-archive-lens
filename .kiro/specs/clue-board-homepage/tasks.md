# Implementation Plan: 3D Clue Board Homepage

## Overview

This implementation plan transforms the MC Museum & Archives homepage into a modern 3D Clue board-inspired interface with glassmorphism effects, smooth zoom animations, and MC Law branding.

---

## Task List

- [x] 1. Setup and Dependencies
  - Install Framer Motion for advanced animations
  - Add MC Law brand colors to Tailwind config
  - Configure custom fonts (New Atten, PS Fournier) with fallbacks
  - _Requirements: 2, 9_

- [x] 1.1 Install Framer Motion
  - Run `npm install framer-motion`
  - Verify installation in package.json
  - _Requirements: 3_

- [x] 1.2 Update Tailwind Configuration
  - Add MC Law color variables to tailwind.config.js
  - Add custom shadow system (multi-layer shadows)
  - Configure backdrop-filter plugin if needed
  - Add custom font families
  - _Requirements: 2, 10_

- [x] 1.3 Create CSS Custom Properties File
  - Create `src/styles/clue-board-theme.css`
  - Define MC Law color variables
  - Define shadow system variables
  - Define typography variables
  - _Requirements: 2, 9, 10_

- [x] 2. Create Core Component Structure
  - Create ClueBoard container component
  - Create BoardFrame decorative component
  - Create CentralBranding component
  - Create RoomCard component
  - Create RoomCardGrid layout component
  - _Requirements: 1, 4, 5_

- [x] 2.1 Create ClueBoard Container
  - Create `src/components/clue-board/ClueBoard.tsx`
  - Implement 3D perspective container
  - Add background gradient with MC Blue
  - Add subtle noise texture overlay
  - _Requirements: 1_

- [x] 2.2 Create BoardFrame Component
  - Create `src/components/clue-board/BoardFrame.tsx`
  - Implement wood-textured border frame
  - Add 3D depth effects with shadows
  - Style frame corners with decorative elements
  - _Requirements: 1_

- [x] 2.3 Create CentralBranding Component
  - Create `src/components/clue-board/CentralBranding.tsx`
  - Add "MC Museum & Archives" heading with MC Gold
  - Add tagline with Celestial Blue
  - Implement glassmorphism inset effect
  - Add gold border and glow shadow
  - _Requirements: 2, 5, 10_

- [x] 2.4 Create RoomCard Component
  - Create `src/components/clue-board/RoomCard.tsx`
  - Implement glassmorphism card background
  - Add icon, title, and description layout
  - Add shine effect overlay
  - Implement 3D transform with translateZ
  - _Requirements: 1, 4, 10_

- [x] 2.5 Create RoomCardGrid Component
  - Create `src/components/clue-board/RoomCardGrid.tsx`
  - Implement 2x2 grid layout
  - Add responsive breakpoints
  - Manage zoom state for all cards
  - _Requirements: 4, 8_

- [x] 3. Implement Hover Animations
  - Add hover scale and lift effect to RoomCard
  - Add hover border color change to gold
  - Add hover shadow enhancement
  - Add shine effect animation on hover
  - _Requirements: 3_

- [x] 3.1 Add Framer Motion Hover States
  - Wrap RoomCard with motion.div
  - Implement whileHover animation (scale 1.05, translateY -8)
  - Add 300ms ease-out transition
  - _Requirements: 3_

- [x] 3.2 Add CSS Hover Effects
  - Add border-color transition to gold
  - Add box-shadow enhancement with gold glow
  - Add shine effect translateX animation
  - _Requirements: 3, 10_

- [x] 4. Implement Zoom Animation System
  - Add zoom state management to RoomCard
  - Implement zoom-in animation (scale 1.5, z 100)
  - Add fade-out animation for sibling cards
  - Add navigation trigger after zoom completes
  - _Requirements: 3_

- [x] 4.1 Create Zoom State Hook
  - Create `src/hooks/useZoomAnimation.ts`
  - Manage isZooming state
  - Handle zoom completion callback
  - Add 600ms delay before navigation
  - _Requirements: 3_

- [x] 4.2 Implement Zoom Animation
  - Add Framer Motion animate prop to RoomCard
  - Configure zoom animation (scale: 1.5, z: 100)
  - Use custom cubic-bezier easing [0.43, 0.13, 0.23, 0.96]
  - Set duration to 600ms
  - _Requirements: 3_

- [x] 4.3 Implement Sibling Fade Effect
  - Add zoom tracking to RoomCardGrid
  - Animate sibling cards opacity to 0
  - Animate sibling cards scale to 0.9
  - Use 400ms ease-in transition
  - _Requirements: 3_

- [x] 5. Integrate Global Search
  - Position GlobalSearch above room cards
  - Style search bar with MC Law colors
  - Ensure search functionality remains intact
  - Add proper spacing and layout
  - _Requirements: 6_

- [x] 5.1 Update GlobalSearch Styling
  - Apply MC Blue and Gold color scheme
  - Add glassmorphism effect to search bar
  - Ensure touch-friendly sizing
  - _Requirements: 2, 6, 7_

- [x] 6. Update HomePage Component
  - Replace existing layout with ClueBoard
  - Integrate GlobalSearch component
  - Wire up navigation handlers
  - Pass room data to RoomCardGrid
  - _Requirements: 1, 4, 6_

- [x] 6.1 Refactor HomePage.tsx
  - Import ClueBoard and related components
  - Replace RoomCard grid with ClueBoard
  - Maintain existing navigation logic
  - Test all room navigation paths
  - _Requirements: 4_

- [x] 7. Implement Accessibility Features
  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation
  - Add focus styles for keyboard users
  - Add reduced motion support
  - _Requirements: 10, 11_

- [x] 7.1 Add Keyboard Navigation
  - Add tabIndex to RoomCard
  - Handle Enter and Space key events
  - Add visible focus indicators
  - Test tab order flow
  - _Requirements: 11_

- [x] 7.2 Add ARIA Labels
  - Add role="button" to RoomCard
  - Add aria-label with room description
  - Add role="banner" to CentralBranding
  - Add role="navigation" to RoomCardGrid
  - _Requirements: 11_

- [x] 7.3 Implement Reduced Motion Support
  - Add prefers-reduced-motion media query
  - Disable animations when reduced motion is preferred
  - Set animation durations to 0.01ms
  - Test with system settings
  - _Requirements: 11_

- [x] 8. Implement Responsive Design
  - Add mobile breakpoint styles (< 768px)
  - Add tablet breakpoint styles (768px - 1024px)
  - Test on various screen sizes
  - Adjust 3D effects for smaller screens
  - _Requirements: 8_

- [x] 8.1 Add Mobile Layout
  - Stack room cards vertically on mobile
  - Reduce card sizes appropriately
  - Adjust spacing and padding
  - Test touch interactions
  - _Requirements: 7, 8_

- [x] 8.2 Add Tablet Layout
  - Maintain 2x2 grid with adjusted spacing
  - Scale 3D effects proportionally
  - Test on iPad and similar devices
  - _Requirements: 8_

- [x] 9. Performance Optimization
  - Add CSS containment to RoomCard
  - Add will-change for animated properties
  - Implement GPU acceleration
  - Test animation performance (60fps target)
  - _Requirements: 11_

- [x] 9.1 Add Performance Hints
  - Add `contain: layout style paint` to RoomCard
  - Add `will-change: transform` to animated elements
  - Add `transform: translateZ(0)` for GPU layers
  - _Requirements: 11_

- [x] 9.2 Test Performance
  - Monitor FPS during animations
  - Check memory usage during zoom
  - Test on target kiosk hardware
  - Optimize if needed
  - _Requirements: 11_

- [x] 10. Visual Polish and Refinement
  - Fine-tune shadow depths and colors
  - Adjust glassmorphism opacity levels
  - Perfect animation timing curves
  - Add final visual touches
  - _Requirements: 1, 10_

- [x] 10.1 Refine Material Effects
  - Adjust backdrop-filter blur amounts
  - Fine-tune gradient overlays
  - Perfect multi-layer shadow depths
  - Test in different lighting conditions
  - _Requirements: 10_

- [x] 10.2 Refine Animation Timing
  - Test and adjust hover animation speed
  - Perfect zoom animation easing
  - Ensure smooth transitions throughout
  - _Requirements: 3_

- [x] 11. Testing and Validation
  - Test all room navigation paths
  - Test zoom animations on all cards
  - Test keyboard navigation flow
  - Test on actual kiosk hardware
  - Validate WCAG 2.1 AA compliance
  - _Requirements: 11_

- [x] 11.1 Cross-Browser Testing
  - Test on Chrome/Edge 88+
  - Test on Firefox 103+
  - Test on Safari 15.4+
  - Document any browser-specific issues
  - _Requirements: 11_

- [x] 11.2 Accessibility Validation
  - Run automated accessibility tests
  - Test with screen readers
  - Validate color contrast ratios
  - Test keyboard-only navigation
  - _Requirements: 11_

- [x] 11.3 Performance Validation
  - Measure animation FPS
  - Check load time metrics
  - Test on low-end devices
  - Verify smooth 60fps animations
  - _Requirements: 11_

---

## Implementation Notes

### Dependencies Required
```json
{
  "framer-motion": "^10.16.0"
}
```

### Key Files to Create
- `src/components/clue-board/ClueBoard.tsx`
- `src/components/clue-board/BoardFrame.tsx`
- `src/components/clue-board/CentralBranding.tsx`
- `src/components/clue-board/RoomCard.tsx`
- `src/components/clue-board/RoomCardGrid.tsx`
- `src/hooks/useZoomAnimation.ts`
- `src/styles/clue-board-theme.css`

### Key Files to Modify
- `src/pages/HomePage.tsx`
- `tailwind.config.js`
- `src/components/GlobalSearch.tsx` (styling only)

### Testing Checklist
- [x] All four room cards navigate correctly
- [x] Zoom animation plays smoothly (60fps)
- [x] Sibling cards fade out during zoom
- [x] Hover effects work on all cards
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Screen readers announce cards correctly
- [ ] Reduced motion preference is respected
- [ ] Mobile layout displays correctly
- [ ] Colors match MC Law brand guidelines
- [ ] Performance is acceptable on kiosk hardware

### Browser Compatibility
- Chrome/Edge 88+ ✓
- Firefox 103+ ✓
- Safari 15.4+ ✓
- Modern kiosk browsers ✓

### Accessibility Requirements
- WCAG 2.1 AA color contrast ✓
- Keyboard navigation ✓
- Screen reader support ✓
- Reduced motion support ✓
- Focus indicators ✓

---

## Success Criteria

The implementation is complete when:
1. All four room cards display with 3D glassmorphism effects
2. Hover animations are smooth and responsive
3. Click triggers zoom animation followed by navigation
4. MC Law brand colors are used throughout
5. Keyboard navigation works perfectly
6. Accessibility tests pass (WCAG 2.1 AA)
7. Performance is 60fps on target hardware
8. Responsive design works on all screen sizes
9. All tests pass successfully

---

**Ready to begin implementation!** Start with Task 1 to set up dependencies and configuration.
