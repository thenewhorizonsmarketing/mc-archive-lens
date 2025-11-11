import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  getBootTime: () => ipcRenderer.invoke("get-boot-time"),
  quitApp: () => ipcRenderer.invoke("quit-app"),
  reloadApp: () => ipcRenderer.invoke("reload-app"),
  toggleFullscreen: () => ipcRenderer.invoke("toggle-fullscreen"),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  onBootComplete: (callback) => {
    ipcRenderer.on("boot-complete", (_event, data) => callback(data));
  },
  rendererReady: () => ipcRenderer.send("renderer-ready")
});
