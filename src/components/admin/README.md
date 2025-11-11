# Admin System

The admin system provides a hidden administrative interface for configuring and monitoring the kiosk application.

## Components

### AdminGestureDetector

Detects the admin access gesture and validates PIN entry.

**Gesture**: Tap and hold in the upper-left corner (100×100px zone) for 3 seconds.

**Features**:
- Visual progress indicator during hold
- PIN entry dialog after successful hold
- PIN validation against configured PIN
- Touch and mouse support (for testing)

**Requirements**: 3.3, 10.1

### AdminOverlay

The main admin control panel with three tabs:

#### Performance Tab
- **Motion Tier Configuration**: Override motion tier (full/lite/static)
- **Auto-Tier Toggle**: Enable/disable automatic tier adjustment
- **Reduced Motion**: Accessibility toggle to disable animations
- **Performance Metrics**: Real-time FPS, frame time, draw calls, memory usage

**Requirements**: 10.3, 10.4, 10.5

#### Timers Tab
- **Idle Timeout**: Configure time before attract loop starts (default: 45s)
- **Auto-Reset Timeout**: Configure time before auto-reset to home (default: 120s)
- **Current Status**: Shows idle and attract mode state

**Requirements**: 10.2

#### Diagnostics Tab
- **System Information**: WebGL availability, current route, transition state
- **GPU Information**: Vendor, renderer, GPU tier, WebGL version, max texture size
- **Actions**: Reset to defaults, reset idle timers

**Requirements**: 10.5

## Usage

### Basic Integration

```tsx
import { AdminOverlay, AdminGestureDetector } from '@/components/admin';
import { useState } from 'react';
import type { KioskConfig } from '@/types/kiosk-config';

function KioskApp() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [config, setConfig] = useState<KioskConfig>({
    rooms: [],
    idleTimeout: 45000,
    attractTimeout: 120000,
    adminPin: '1234',
    motionTier: 'auto',
    reducedMotion: false,
    autoTierEnabled: true
  });

  const handleConfigChange = (updates: Partial<KioskConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    // Persist to localStorage or config file
    localStorage.setItem('kioskConfig', JSON.stringify({ ...config, ...updates }));
  };

  return (
    <>
      {/* Gesture detector - always active */}
      <AdminGestureDetector
        adminPin={config.adminPin}
        onAdminAccess={() => setIsAdminOpen(true)}
        isAdminOpen={isAdminOpen}
      />
      
      {/* Admin overlay - shown when authenticated */}
      <AdminOverlay
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onConfigChange={handleConfigChange}
      />
      
      {/* Your kiosk content */}
    </>
  );
}
```

### Configuration Persistence

The admin system updates the `KioskConfig` object through the `onConfigChange` callback. You should persist these changes to:

1. **localStorage** (for browser-based kiosks):
```tsx
localStorage.setItem('kioskConfig', JSON.stringify(config));
```

2. **Config file** (for Electron kiosks):
```tsx
// In main process
ipcMain.handle('save-config', async (event, config) => {
  await fs.writeFile('config.json', JSON.stringify(config, null, 2));
});

// In renderer
window.electron.saveConfig(config);
```

### Default PIN

The default admin PIN is `1234`. Change this in your configuration:

```tsx
const config: KioskConfig = {
  // ...
  adminPin: 'your-secure-pin'
};
```

## State Management

The admin system integrates with three Zustand stores:

### usePerformanceStore
- Motion tier management
- FPS and performance metrics
- GPU capabilities
- Auto-tier adjustment

### useIdleStore
- Idle timeout configuration
- Attract timeout configuration
- Idle state tracking
- Timer management

### useKioskStore
- Current route
- Transition state
- Input locking

## Testing

### Desktop Testing
Use mouse instead of touch:
1. Click and hold in upper-left corner for 3 seconds
2. Enter PIN when prompted
3. Access admin controls

### Production Testing
1. Tap and hold upper-left corner for 3 seconds
2. Enter configured PIN
3. Verify all controls work correctly
4. Test configuration persistence

## Security Considerations

1. **PIN Protection**: Admin access requires PIN validation
2. **Hidden Gesture**: The gesture zone is invisible to casual users
3. **No Visual Hints**: No indication of admin access in normal operation
4. **Secure Storage**: Store PIN securely in configuration file

## Accessibility

- Keyboard navigation within admin overlay
- High contrast UI (dark theme)
- Large touch targets for all controls
- Clear labels and descriptions
- Screen reader compatible

## Performance Impact

The admin system has minimal performance impact:
- Gesture detector: ~0.1ms per frame
- Admin overlay: Only rendered when open
- No background processing when closed

## Requirements Coverage

- ✅ 3.3: 3-second tap-and-hold in upper-left corner
- ✅ 10.1: PIN entry and validation
- ✅ 10.2: Idle timer configuration
- ✅ 10.3: Motion tier override
- ✅ 10.4: Reduced motion toggle
- ✅ 10.5: Performance diagnostics display
