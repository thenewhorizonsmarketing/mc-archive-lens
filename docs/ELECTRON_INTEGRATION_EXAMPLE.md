# Electron Kiosk Integration Example

## Quick Start

This guide shows how to integrate the Electron Kiosk Shell components into your application.

## 1. Update main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BootManager } from '@/components/system';
import { initializeNetworkBlocker } from '@/lib/utils/network-blocker';
import { registerServiceWorker } from '@/lib/utils/service-worker-registration';
import './index.css';

// Initialize offline operation
initializeNetworkBlocker();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BootManager
      onBootComplete={(bootTime) => {
        console.log(`Application ready in ${bootTime}ms`);
      }}
    >
      <App />
    </BootManager>
  </React.StrictMode>
);
```

## 2. Access Electron API

```typescript
// In any component
import { useEffect, useState } from 'react';

function MyComponent() {
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    // Check if running in Electron
    if (typeof window !== 'undefined' && 'electronAPI' in window) {
      const api = (window as any).electronAPI;
      
      // Get system info
      api.getSystemInfo().then(setSystemInfo);
      
      // Get app version
      api.getAppVersion().then((version: string) => {
        console.log('App version:', version);
      });
    }
  }, []);

  return (
    <div>
      {systemInfo && (
        <div>
          <p>Platform: {systemInfo.platform}</p>
          <p>Kiosk Mode: {systemInfo.isKioskMode ? 'Yes' : 'No'}</p>
        </div>
      )}
    </div>
  );
}
```

## 3. Custom Boot Sequence

```typescript
import { BootManager } from '@/components/system';
import { createAsyncStep } from '@/hooks/useBootSequence';

// Define custom boot steps
const customBootSteps = [
  createAsyncStep('Loading configuration...', async () => {
    // Load your config
    await loadConfig();
  }, 1),
  
  createAsyncStep('Initializing database...', async () => {
    // Initialize database
    await initDatabase();
  }, 2),
  
  createAsyncStep('Loading 3D assets...', async () => {
    // Preload 3D models
    await preload3DAssets();
  }, 3),
];

function App() {
  return (
    <BootManager
      bootSteps={customBootSteps}
      onBootComplete={(bootTime) => {
        console.log('Custom boot complete:', bootTime);
      }}
    >
      <YourApp />
    </BootManager>
  );
}
```

## 4. Admin Controls

```typescript
function AdminPanel() {
  const handleQuit = async () => {
    if ('electronAPI' in window) {
      await (window as any).electronAPI.quitApp();
    }
  };

  const handleReload = async () => {
    if ('electronAPI' in window) {
      await (window as any).electronAPI.reloadApp();
    }
  };

  const handleToggleFullscreen = async () => {
    if ('electronAPI' in window) {
      await (window as any).electronAPI.toggleFullscreen();
    }
  };

  return (
    <div>
      <button onClick={handleReload}>Reload App</button>
      <button onClick={handleToggleFullscreen}>Toggle Fullscreen</button>
      <button onClick={handleQuit}>Quit App</button>
    </div>
  );
}
```

## 5. Network Blocker Monitoring

```typescript
import { NetworkBlocker } from '@/lib/utils/network-blocker';

function NetworkMonitor() {
  const [stats, setStats] = useState({ blockedCount: 0, blockedRequests: [] });

  useEffect(() => {
    const interval = setInterval(() => {
      const blocker = NetworkBlocker.getInstance();
      setStats(blocker.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Network Monitor</h3>
      <p>Blocked Requests: {stats.blockedCount}</p>
      {stats.blockedRequests.length > 0 && (
        <ul>
          {stats.blockedRequests.map((req, i) => (
            <li key={i}>{req}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## 6. TypeScript Types

```typescript
// Add to your global types file (e.g., src/types/electron.d.ts)
interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  isKioskMode: boolean;
  isDev: boolean;
}

interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getBootTime: () => Promise<number>;
  quitApp: () => Promise<void>;
  reloadApp: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  getSystemInfo: () => Promise<SystemInfo>;
  onBootComplete: (callback: (data: { bootTime: number }) => void) => void;
  rendererReady: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
```

## 7. Development vs Production

```typescript
// Check if running in Electron
const isElectron = typeof window !== 'undefined' && 'electronAPI' in window;

// Check if in production
const isProduction = import.meta.env.PROD;

// Check if in kiosk mode
const isKioskMode = isElectron && 
  await (window as any).electronAPI.getSystemInfo()
    .then((info: SystemInfo) => info.isKioskMode);

// Conditional rendering
function App() {
  if (isKioskMode) {
    return <KioskInterface />;
  }
  return <StandardInterface />;
}
```

## 8. Error Handling

```typescript
function SafeElectronCall() {
  const callElectronAPI = async () => {
    try {
      if (!('electronAPI' in window)) {
        console.warn('Not running in Electron');
        return;
      }

      const api = (window as any).electronAPI;
      const version = await api.getAppVersion();
      console.log('Version:', version);
    } catch (error) {
      console.error('Electron API error:', error);
    }
  };

  return (
    <button onClick={callElectronAPI}>
      Get Version
    </button>
  );
}
```

## 9. Build and Run

```bash
# Development
npm run dev:electron

# Production build
npm run build:electron

# Package for Windows
npm run package:win

# Package in kiosk mode
npm run package:kiosk
```

## 10. Deployment

```bash
# Install auto-start (run as Administrator)
scripts\install-startup.bat

# The app will now start automatically on Windows boot
```

## Best Practices

1. **Always check for Electron API availability:**
   ```typescript
   if ('electronAPI' in window) {
     // Safe to use
   }
   ```

2. **Handle errors gracefully:**
   ```typescript
   try {
     await window.electronAPI.someMethod();
   } catch (error) {
     console.error('Failed:', error);
   }
   ```

3. **Use TypeScript types:**
   ```typescript
   const api = window.electronAPI as ElectronAPI;
   ```

4. **Test in both modes:**
   - Development (with network)
   - Production (offline)

5. **Monitor boot time:**
   ```typescript
   onBootComplete={(bootTime) => {
     if (bootTime > 5000) {
       console.warn('Boot time exceeded target');
     }
   }}
   ```

## Troubleshooting

### Issue: electronAPI is undefined

**Solution:** Make sure you're running in Electron, not a regular browser.

### Issue: Network requests still going through

**Solution:** Ensure `initializeNetworkBlocker()` is called in main.tsx.

### Issue: Boot time too long

**Solution:** Optimize boot steps, reduce asset loading, or increase target time.

### Issue: App not starting on boot

**Solution:** Run `install-startup.bat` as Administrator.

## Support

For more information, see:
- `docs/OFFLINE_OPERATION.md` - Offline operation guide
- `.kiro/specs/3d-clue-board-kiosk/ELECTRON_KIOSK_COMPLETE.md` - Implementation details
- `electron/main.ts` - Main process code
- `electron/preload.ts` - Preload script
