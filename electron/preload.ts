import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getBootTime: () => ipcRenderer.invoke('get-boot-time'),
  getBootMetrics: () => ipcRenderer.invoke('get-boot-metrics'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  reloadApp: () => ipcRenderer.invoke('reload-app'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  onBootComplete: (callback: (data: BootCompleteData) => void) => {
    ipcRenderer.on('boot-complete', (_event, data) => callback(data));
  },
  rendererReady: () => ipcRenderer.send('renderer-ready'),
});

// Type definitions for the exposed API
export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  isKioskMode: boolean;
  isDev: boolean;
}

export interface BootMetrics {
  processStart: number;
  electronReady: number;
  windowCreated: number;
  contentLoaded: number;
  readyToShow: number;
  total: number;
  meetsTarget: boolean;
  target: number;
}

export interface BootCompleteData {
  bootTime: number;
  metrics: BootMetrics;
  meetsTarget: boolean;
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getBootTime: () => Promise<number>;
  getBootMetrics: () => Promise<BootMetrics>;
  quitApp: () => Promise<void>;
  reloadApp: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  getSystemInfo: () => Promise<SystemInfo>;
  onBootComplete: (callback: (data: BootCompleteData) => void) => void;
  rendererReady: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
