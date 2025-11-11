# Hit Target Validation Guide

## Overview

This document describes the validation process for ensuring all 8 room tiles in the 3D Clue Board Kiosk Interface meet the minimum 56px hit target requirement for accessibility and touch interaction.

## Requirements

**Requirement 3.1**: Minimum 56px hit target size for all interactive elements

All interactive elements in the kiosk interface must provide a minimum hit target size of 56 pixels (logical pixels) to ensure:
- Easy touch interaction on 4K touchscreen displays
- Accessibility compliance for users with motor impairments
- Reduced accidental taps and improved user experience

## Room Tile Configuration

The kiosk features **8 room tiles** arranged around the edges of a 3×3 grid:

1. **Alumni** (top-left)
2. **Publications** (top-center)
3. **Photos** (top-right)
4. **Faculty** (middle-left)
5. **History** (middle-right)
6. **Achievements** (bottom-left)
7. **Events** (bottom-center)
8. **Resources** (bottom-right)

The center position is reserved for the logo tile (non-interactive).

## Implementation Details

### RoomTile3D Component

Each room tile includes:

1. **Main Tile Mesh**: 3.5 × 0.3 × 3.5 units (width × height × depth)
2. **Brass Nameplate**: Positioned above the tile
3. **Invisible Hit Box**: Extended hit area (3.5 × 1.0 × 3.5 units) for better touch targeting

The invisible hit box extends vertically to provide a larger touch target area, ensuring the 56px minimum is met even at different camera angles.

### Touch Handler

The `TouchHandler` component manages:
- Raycasting for 3D hit detection
- Touch gesture recognition (tap, hold, two-finger tap)
- Input locking during transitions
- Admin gesture detection

### Hit Target Validator

The `HitTargetValidator` component:
- Calculates screen-space size of 3D objects
- Validates against minimum 56px requirement
- Logs validation results to console
- Can be enabled/disabled for debugging

## Validation Methods

### 1. Automated Testing

Run the E2E test suite:

```bash
npm run test:run
```

The test file `src/__tests__/e2e/room-tile-hit-targets.test.ts` validates:
- All 8 room tiles are present
- Each tile meets the 56px minimum hit target
- All tiles are clickable
- Proper spacing between tiles
- All expected rooms are configured

### 2. Validation Script

Run the standalone validation script:

```bash
npm run validate:hit-targets
```

This script:
- Launches a headless browser
- Loads the kiosk application
- Measures screen-space size of each room tile
- Reports validation results with color-coded output
- Exits with code 0 (success) or 1 (failure)

**Prerequisites:**
- Development server must be running (`npm run dev`)
- Or build and preview (`npm run build && npm run preview`)

### 3. Visual Validation

Use the interactive example component:

```tsx
import { InteractionExample } from '@/components/interaction/InteractionExample';

// Render in your app
<InteractionExample />
```

This component provides:
- Live hit target validation
- Visual feedback for touch gestures
- Console logging of validation results
- Toggle to enable/disable validation

### 4. Manual Testing

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser console (F12)

3. Look for validation logs:
   ```
   [HitTargetValidator] ✓ Room: alumni Screen: 420px × 420px
   [HitTargetValidator] ✓ Room: publications Screen: 420px × 420px
   ...
   [HitTargetValidator] Summary: 8/8 targets valid
   ```

## Expected Results

### On 4K Display (3840×2160)

Each room tile should have a screen-space size of approximately:
- **Width**: 400-450px
- **Height**: 400-450px

This is well above the 56px minimum requirement.

### On 1080p Display (1920×1080)

Each room tile should have a screen-space size of approximately:
- **Width**: 200-225px
- **Height**: 200-225px

Still well above the 56px minimum requirement.

## Troubleshooting

### Issue: Tiles appear smaller than 56px

**Possible causes:**
1. Camera is too far from the board
2. Tile size is too small
3. Viewport is not set correctly

**Solutions:**
1. Adjust camera position in `BoardScene` component
2. Increase `tileSize` prop in `ClueBoard3D`
3. Verify viewport settings in Electron configuration

### Issue: Validation script fails to find tiles

**Possible causes:**
1. 3D scene hasn't loaded yet
2. Room tiles don't have `userData.roomId` set
3. Canvas element not found

**Solutions:**
1. Increase wait timeout in validation script
2. Verify `RoomTile3D` sets `userData={{ roomId: room.id }}`
3. Check that Canvas is rendered correctly

### Issue: Some tiles pass, others fail

**Possible causes:**
1. Inconsistent tile sizes
2. Camera angle affects projection
3. Tiles at edges appear smaller due to perspective

**Solutions:**
1. Verify all tiles use same `tileSize` prop
2. Use orthographic camera (already implemented)
3. Add larger invisible hit boxes for edge tiles

## Best Practices

1. **Always test on target hardware**: 55″ 4K touchscreen display
2. **Test at different viewing angles**: Ensure tiles remain accessible
3. **Test with actual touch input**: Mouse clicks may not reflect touch accuracy
4. **Run validation after any changes**: To camera, tile size, or layout
5. **Monitor performance**: Larger hit boxes should not impact frame rate

## Accessibility Considerations

The 56px minimum hit target size is based on:
- **WCAG 2.1 Success Criterion 2.5.5**: Target Size (Level AAA) recommends 44×44 CSS pixels
- **Touch Target Guidelines**: Most platforms recommend 48-56px for touch targets
- **Kiosk Context**: Public kiosks should be more generous to accommodate all users

Our implementation exceeds these requirements by providing:
- Minimum 56px logical pixels (meets AAA standard)
- Actual screen-space size of 200-450px depending on display
- Invisible hit boxes for extended touch areas
- Visual feedback on hover/focus

## Success Criteria

✅ All 8 room tiles are interactive with 56px+ hit targets

This is confirmed when:
1. Automated tests pass
2. Validation script reports 8/8 tiles valid
3. Manual testing shows all tiles are easily tappable
4. No accessibility warnings in browser console

## References

- [WCAG 2.1 - Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Material Design - Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- Requirements Document: `.kiro/specs/3d-clue-board-kiosk/requirements.md`
- Design Document: `.kiro/specs/3d-clue-board-kiosk/design.md`
