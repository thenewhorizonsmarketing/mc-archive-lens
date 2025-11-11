# 3D Clue Board Kiosk Configuration

This directory contains configuration files for the 3D Clue Board Kiosk interface.

## Configuration Files

### `rooms.json`

Defines the room tiles that appear on the 3D board. Each room represents a navigable section of the kiosk.

**Structure:**

```json
{
  "rooms": [
    {
      "id": "unique-room-id",
      "title": "Display Title",
      "description": "Brief description of the room",
      "icon": "/path/to/icon.svg",
      "route": "/route-path",
      "position": "grid-position",
      "color": "#HEXCOLOR"
    }
  ]
}
```

**Fields:**

- `id` (string, required): Unique identifier for the room
- `title` (string, required): Display name shown on the brass nameplate
- `description` (string, optional): Brief description of the room content
- `icon` (string, optional): Path to icon asset (relative to public directory)
- `route` (string, required): Navigation route path (must start with `/`)
- `position` (string, required): Grid position in the 3×3 layout
- `color` (string, optional): Accent color in hex format (default: `#F5E6C8`)

**Valid Grid Positions:**

```
┌─────────────┬─────────────┬─────────────┐
│  top-left   │ top-center  │  top-right  │
├─────────────┼─────────────┼─────────────┤
│ middle-left │   center    │middle-right │
├─────────────┼─────────────┼─────────────┤
│ bottom-left │bottom-center│bottom-right │
└─────────────┴─────────────┴─────────────┘
```

**Constraints:**

- Minimum 1 room, maximum 9 rooms (3×3 grid)
- Each room must have a unique `id`, `route`, and `position`
- The `center` position is typically reserved for branding/logo
- Recommended: 8 rooms around the edges, 1 center logo tile

---

### `config.json`

Main kiosk configuration settings.

**Structure:**

```json
{
  "idleTimeout": 45,
  "attractTimeout": 120,
  "adminPin": "1234",
  "motionTier": "auto",
  "reducedMotion": false
}
```

**Fields:**

- `idleTimeout` (number, default: 45): Seconds of inactivity before attract loop starts
- `attractTimeout` (number, default: 120): Seconds of inactivity before auto-reset to home
- `adminPin` (string, default: "1234"): PIN code for accessing admin overlay
- `motionTier` (string, default: "auto"): Motion quality level
- `reducedMotion` (boolean, default: false): Force reduced motion mode

**Motion Tier Options:**

- `"auto"`: Automatically detect hardware capabilities and adjust
- `"full"`: Enable all effects (board tilt, parallax, emissive pulses) - targets 60 FPS
- `"lite"`: Enable parallax only, no tilt - targets 55-60 FPS
- `"static"`: Cross-fade highlights only, no 3D effects

**Constraints:**

- `idleTimeout` must be a positive number
- `attractTimeout` must be greater than `idleTimeout`
- `adminPin` must be a non-empty string
- `motionTier` must be one of: `"auto"`, `"full"`, `"lite"`, `"static"`

---

## Usage

### Loading Configuration

The configuration is automatically loaded when the kiosk application starts:

```typescript
import { configManager } from '@/lib/config/ConfigManager';

// Load configuration
const config = await configManager.loadConfig();

// Access rooms
const rooms = configManager.getRooms();

// Get specific room
const alumniRoom = configManager.getRoomById('alumni');
```

### Runtime Updates

Configuration can be updated at runtime through the admin overlay:

```typescript
configManager.updateConfig({
  idleTimeout: 60,
  motionTier: 'lite'
});
```

**Note:** Room definitions cannot be updated at runtime. Changes to `rooms.json` require an application restart.

---

## Admin Access

To access the admin overlay:

1. **Touch Gesture**: Tap and hold for 3 seconds in the upper-left corner of the screen
2. **Keyboard**: Press `Ctrl+Shift+A` (development mode only)
3. Enter the PIN code from `config.json`

The admin overlay allows you to:
- Adjust idle and attract timeouts
- Override motion tier settings
- Toggle reduced motion mode
- View performance diagnostics
- Monitor system metrics

---

## Best Practices

### Performance Optimization

- Use `"auto"` motion tier for automatic performance adjustment
- Set `reducedMotion: true` for older hardware or accessibility needs
- Keep idle timeouts reasonable (45-120 seconds recommended)

### Room Configuration

- Use descriptive, concise titles (max 20 characters recommended)
- Provide meaningful descriptions for accessibility
- Use consistent color palette from the design system:
  - Walnut: `#6B3F2B`
  - Brass: `#CDAF63`
  - Board Teal: `#0E6B5C`
  - Accent: `#F5E6C8`

### Security

- Change the default admin PIN in production
- Use a strong PIN (6+ characters recommended)
- Restrict file system access to configuration files

---

## Troubleshooting

### Configuration Not Loading

- Verify JSON syntax is valid (use a JSON validator)
- Check file paths are correct (relative to `public/config/`)
- Review browser console for validation errors

### Validation Errors

Common validation errors and solutions:

- **"Duplicate room ID"**: Ensure each room has a unique `id`
- **"Invalid position"**: Use only valid grid positions (see list above)
- **"attractTimeout must be greater than idleTimeout"**: Increase attract timeout value
- **"Rooms must be an array"**: Wrap room objects in a `"rooms"` array

### Performance Issues

If experiencing low frame rates:

1. Set `motionTier: "lite"` or `"static"` in `config.json`
2. Enable `reducedMotion: true`
3. Check admin overlay performance metrics
4. Verify hardware meets minimum requirements

---

## File Locations

```
public/
└── config/
    ├── config.json      # Main kiosk settings
    ├── rooms.json       # Room definitions
    └── README.md        # This file
```

---

## Version History

- **v1.0.0**: Initial configuration system
  - Room definitions with 3×3 grid layout
  - Idle and attract timers
  - Motion tier settings
  - Admin PIN protection
