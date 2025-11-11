/**
 * Production Build Configuration
 * Optimizes bundle size and performance for kiosk deployment
 */

export default {
  // Target hardware specifications
  target: {
    platform: 'win32',
    arch: 'x64',
    nodeVersion: '18',
  },

  // Performance budgets (Requirements 7.1-7.7)
  budgets: {
    initialPayload: 3.5 * 1024 * 1024, // 3.5 MB
    mainThreadBlocking: 200, // 200ms
    drawCalls: 120,
    perRoomAssets: 350 * 1024, // 350 KB
  },

  // Asset optimization settings
  assets: {
    textures: {
      format: 'ktx2',
      compression: 'basis',
      resolutions: {
        desktop: '2k',
        lite: '1k',
      },
    },
    geometry: {
      compression: 'draco',
      compressionLevel: 7,
    },
    models: {
      format: 'gltf',
      singleFile: true,
    },
  },

  // Build optimization
  optimization: {
    minify: true,
    treeshake: true,
    splitChunks: true,
    sourcemaps: false,
    removeConsole: true,
  },

  // Electron builder settings
  electron: {
    asar: true,
    compression: 'maximum',
    nodeIntegration: false,
    contextIsolation: true,
  },

  // Kiosk mode settings (Requirements 8.1-8.4)
  kiosk: {
    fullscreen: true,
    frameless: true,
    autoStart: true,
    bootTarget: 5000, // 5 seconds
    offline: true,
  },
};
