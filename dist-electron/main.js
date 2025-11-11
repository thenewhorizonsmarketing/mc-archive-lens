import { app, BrowserWindow, ipcMain, Menu } from "electron";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
let bootStartTime = Date.now();
const isDev = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";
const isKioskMode = process.env.KIOSK_MODE === "true" || isProduction;
function createWindow() {
  if (isProduction) {
    Menu.setApplicationMenu(null);
  }
  mainWindow = new BrowserWindow({
    width: 3840,
    // 4K width
    height: 2160,
    // 4K height
    fullscreen: isKioskMode,
    kiosk: isKioskMode,
    frame: !isKioskMode,
    autoHideMenuBar: true,
    show: false,
    // Don't show until ready
    backgroundColor: "#0E6B5C",
    // Brand color for smooth loading
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      webgl: true,
      offscreen: false,
      // Disable network features for offline operation
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; frame-src 'none';"
        ]
      }
    });
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.once("ready-to-show", () => {
    const bootTime = Date.now() - bootStartTime;
    console.log(`Boot time: ${bootTime}ms`);
    mainWindow?.show();
    mainWindow?.webContents.send("boot-complete", { bootTime });
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://") && !url.startsWith("http://localhost")) {
      event.preventDefault();
    }
  });
  if (isProduction) {
    mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
      const url = details.url;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        callback({ cancel: true });
      } else {
        callback({ cancel: false });
      }
    });
  }
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.control && (input.key === "+" || input.key === "-" || input.key === "0")) {
      event.preventDefault();
    }
    if (isKioskMode && input.key === "F11") {
      event.preventDefault();
    }
    if (isKioskMode && input.alt && input.key === "F4") {
      event.preventDefault();
    }
  });
  if (isProduction) {
    mainWindow.webContents.on("context-menu", (event) => {
      event.preventDefault();
    });
  }
  if (isProduction) {
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow?.webContents.closeDevTools();
    });
  }
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
ipcMain.handle("get-boot-time", () => {
  return Date.now() - bootStartTime;
});
ipcMain.handle("quit-app", () => {
  app.quit();
});
ipcMain.handle("reload-app", () => {
  if (mainWindow) {
    mainWindow.reload();
  }
});
ipcMain.handle("toggle-fullscreen", () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});
ipcMain.handle("get-system-info", () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
    isKioskMode,
    isDev
  };
});
ipcMain.on("renderer-ready", () => {
  console.log("Renderer process ready");
});
