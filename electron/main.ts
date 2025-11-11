import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let bootStartTime: number = Date.now();

// Boot metrics tracking (Requirement 8.1, 13.1)
const bootMetrics = {
  processStart: Date.now(),
  electronReady: 0,
  windowCreated: 0,
  contentLoaded: 0,
  readyToShow: 0,
  total: 0,
};

const isDev = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isKioskMode = process.env.KIOSK_MODE === 'true' || isProduction;

const BOOT_TIME_TARGET = 5000; // 5 seconds (Requirement 8.1)

function createWindow() {
  bootMetrics.windowCreated = Date.now() - bootMetrics.processStart;
  
  // Disable menu bar in production
  if (isProduction) {
    Menu.setApplicationMenu(null);
  }

  mainWindow = new BrowserWindow({
    width: 3840, // 4K width
    height: 2160, // 4K height
    fullscreen: isKioskMode,
    kiosk: isKioskMode,
    frame: !isKioskMode,
    autoHideMenuBar: true,
    show: false, // Don't show until ready
    backgroundColor: '#0E6B5C', // Brand color for smooth loading
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webgl: true,
      offscreen: false,
      // Disable network features for offline operation
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Set Content Security Policy for offline operation
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: blob:; " +
          "font-src 'self' data:; " +
          "connect-src 'self'; " +
          "media-src 'self'; " +
          "object-src 'none'; " +
          "frame-src 'none';"
        ]
      }
    });
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Track content loaded
  mainWindow.webContents.on('did-finish-load', () => {
    bootMetrics.contentLoaded = Date.now() - bootMetrics.processStart;
    console.log(`[Boot] Content loaded: ${bootMetrics.contentLoaded}ms`);
  });

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    bootMetrics.readyToShow = Date.now() - bootMetrics.processStart;
    bootMetrics.total = bootMetrics.readyToShow;
    
    const bootTime = Date.now() - bootStartTime;
    
    // Log detailed boot metrics
    console.log('='.repeat(60));
    console.log('BOOT METRICS (Requirement 8.1, 13.1)');
    console.log('='.repeat(60));
    console.log(`Electron Ready:    ${bootMetrics.electronReady}ms`);
    console.log(`Window Created:    ${bootMetrics.windowCreated}ms`);
    console.log(`Content Loaded:    ${bootMetrics.contentLoaded}ms`);
    console.log(`Ready to Show:     ${bootMetrics.readyToShow}ms`);
    console.log(`TOTAL BOOT TIME:   ${bootMetrics.total}ms`);
    console.log('='.repeat(60));
    
    // Validate against 5-second target
    if (bootMetrics.total <= BOOT_TIME_TARGET) {
      console.log(`✓ Boot time within 5-second target (${((bootMetrics.total / BOOT_TIME_TARGET) * 100).toFixed(1)}% of target)`);
    } else {
      console.warn(`⚠️  Boot time EXCEEDS 5-second target by ${bootMetrics.total - BOOT_TIME_TARGET}ms`);
    }
    console.log();
    
    mainWindow?.show();
    
    // Send boot metrics to renderer
    mainWindow?.webContents.send('boot-complete', { 
      bootTime,
      metrics: bootMetrics,
      meetsTarget: bootMetrics.total <= BOOT_TIME_TARGET,
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent navigation away from the app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Only allow navigation within the app
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      event.preventDefault();
    }
  });

  // Block all external requests in production
  if (isProduction) {
    mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url;
      // Block all external network requests
      if (url.startsWith('http://') || url.startsWith('https://')) {
        callback({ cancel: true });
      } else {
        callback({ cancel: false });
      }
    });
  }

  // Disable zoom shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && (input.key === '+' || input.key === '-' || input.key === '0')) {
      event.preventDefault();
    }
    
    // Disable F11 fullscreen toggle in kiosk mode
    if (isKioskMode && input.key === 'F11') {
      event.preventDefault();
    }
    
    // Disable Alt+F4 in kiosk mode (require admin to close)
    if (isKioskMode && input.alt && input.key === 'F4') {
      event.preventDefault();
    }
  });

  // Disable right-click context menu in production
  if (isProduction) {
    mainWindow.webContents.on('context-menu', (event) => {
      event.preventDefault();
    });
  }

  // Prevent dev tools in production
  if (isProduction) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }
}

// App lifecycle
app.whenReady().then(() => {
  bootMetrics.electronReady = Date.now() - bootMetrics.processStart;
  console.log(`[Boot] Electron ready: ${bootMetrics.electronReady}ms`);
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-boot-time', () => {
  return Date.now() - bootStartTime;
});

ipcMain.handle('get-boot-metrics', () => {
  return {
    ...bootMetrics,
    meetsTarget: bootMetrics.total <= BOOT_TIME_TARGET,
    target: BOOT_TIME_TARGET,
  };
});

ipcMain.handle('quit-app', () => {
  app.quit();
});

ipcMain.handle('reload-app', () => {
  if (mainWindow) {
    mainWindow.reload();
  }
});

ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.handle('get-system-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    isKioskMode,
    isDev,
  };
});

// Listen for renderer ready signal
ipcMain.on('renderer-ready', () => {
  console.log('Renderer process ready');
});
