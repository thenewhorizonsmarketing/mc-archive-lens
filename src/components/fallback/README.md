# 2D CSS Fallback Components

This directory contains the 2D CSS fallback version of the Clue board interface, which activates when WebGL is unavailable or when reduced motion is preferred.

## Components

### FallbackBoard

The main 2D CSS grid layout component that mirrors the 3D board design.

**Features:**
- 3×3 CSS grid layout matching the 3D board
- Brand colors (walnut frame, brass nameplates, marble floor)
- Hover and focus effects
- Keyboard navigation support
- Touch-friendly hit targets (≥56px)
- Attract mode animations
- High contrast mode support
- Reduced motion support

**Props:**
```typescript
interface FallbackBoardProps {
  rooms: RoomDefinition[];
  onRoomClick: (roomId: string) => void;
}
```

**Usage:**
```tsx
import { FallbackBoard } from '@/components/fallback';

<FallbackBoard
  rooms={config.rooms}
  onRoomClick={(roomId) => handleNavigation(roomId)}
/>
```

### FallbackBoardExample

Example integration showing how to wire up the FallbackBoard with routing and state management.

**Usage:**
```tsx
import { FallbackBoardExample } from '@/components/fallback';

<FallbackBoardExample rooms={config.rooms} />
```

## Automatic Activation

The fallback board automatically activates in the following scenarios:

1. **WebGL Unavailable** (Requirement 11.1)
   - Browser doesn't support WebGL
   - WebGL context creation fails
   - WebGL context is lost

2. **Reduced Motion Enabled** (Requirement 11.2)
   - User has `prefers-reduced-motion: reduce` set
   - Admin overlay has reduced motion enabled

3. **WebGL Error** (Requirement 11.1)
   - Three.js initialization fails
   - Shader compilation errors
   - GPU driver issues

## Design

### Layout

The fallback board uses a CSS Grid layout that mirrors the 3D board:

```
┌─────────────────────────────────────┐
│  Walnut Frame (#6B3F2B)             │
│  ┌───────────────────────────────┐  │
│  │  Glass Pane (subtle overlay)  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  3×3 Grid Layout        │  │  │
│  │  │  ┌───┬───┬───┐          │  │  │
│  │  │  │ 1 │ 2 │ 3 │          │  │  │
│  │  │  ├───┼───┼───┤          │  │  │
│  │  │  │ 4 │ C │ 5 │          │  │  │
│  │  │  ├───┼───┼───┤          │  │  │
│  │  │  │ 6 │ 7 │ 8 │          │  │  │
│  │  │  └───┴───┴───┘          │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Color Palette

- **Walnut Frame**: `#6B3F2B` (warm brown)
- **Brass Nameplates**: `#CDAF63` (golden brass)
- **Board Floor**: `#0E6B5C` (deep green marble)
- **Light Accents**: `#F5E6C8` (cream)

### Typography

- **Room Titles**: Cinzel (serif), bold, high contrast
- **Center Logo**: Cinzel, extra bold
- **Subtitle**: Georgia (serif), regular

## Accessibility

### Keyboard Navigation (Requirement 9.3)

- All room tiles are focusable with `tabIndex={0}`
- Enter and Space keys activate room navigation
- Focus indicators with high contrast outline
- Logical tab order following grid layout

### High Contrast Mode (Requirement 9.1)

- Automatic border addition in high contrast mode
- Increased outline thickness for focus states
- Removed text shadows for better readability

### Reduced Motion (Requirement 9.2)

- All transitions and animations disabled
- Hover effects use opacity changes only
- No transform animations

### Touch Targets (Requirement 3.1)

- Minimum 56px logical size for all interactive elements
- Adequate spacing between tiles (1.5rem gap)
- Large, easy-to-tap nameplates

## Performance

The 2D fallback is extremely lightweight:

- **No JavaScript rendering**: Pure CSS layout
- **No WebGL overhead**: Standard DOM rendering
- **Minimal animations**: Only CSS transitions
- **Fast load time**: No 3D assets to download

## Integration

### With KioskApp

The `KioskApp` component automatically detects WebGL availability and reduced motion preferences, then renders either the 3D board or the 2D fallback:

```tsx
import { KioskApp } from '@/components/kiosk';
import { BoardScene } from '@/components/3d';
import { FallbackBoard } from '@/components/fallback';

<KioskApp>
  {({ config, isLoading, use3D, webGLAvailable }) => {
    if (isLoading) return <LoadingScreen />;
    if (!config) return <ErrorScreen />;
    
    return use3D && webGLAvailable 
      ? <BoardScene rooms={config.rooms} onRoomSelect={handleSelect} />
      : <FallbackBoard rooms={config.rooms} onRoomClick={handleSelect} />;
  }}
</KioskApp>
```

### With KioskBoardIntegration

For a complete, ready-to-use integration:

```tsx
import { KioskBoardIntegration } from '@/components/kiosk';

// Automatically handles 3D/2D switching and routing
<KioskBoardIntegration />
```

## Testing

To test the fallback board:

1. **Disable WebGL**: Use browser dev tools to disable WebGL
2. **Enable Reduced Motion**: Set `prefers-reduced-motion: reduce` in OS settings
3. **Simulate WebGL Error**: Trigger a WebGL context loss event

See `14.3 Test fallback activation` in the tasks document for detailed testing procedures.

## Requirements Coverage

- ✅ **11.1**: Automatically activate when WebGL unavailable
- ✅ **11.2**: Automatically activate when reduced motion enabled
- ✅ **11.3**: Mirror board layout and links from 3D version
- ✅ **9.1**: High contrast labels with color-blind safe palette
- ✅ **9.2**: Reduced motion support
- ✅ **9.3**: Keyboard navigation support
- ✅ **9.4**: All rooms focusable and operable via keyboard
- ✅ **3.1**: Minimum 56px hit targets
- ✅ **5.6**: Input locking during transitions

## Files

- `FallbackBoard.tsx` - Main 2D board component
- `FallbackBoard.css` - Styles with brand colors and effects
- `FallbackBoardExample.tsx` - Integration example with routing
- `README.md` - This documentation
- `index.ts` - Component exports
