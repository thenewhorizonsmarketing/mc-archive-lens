# Offline Operation Guide

## Overview

The 3D Clue Board Kiosk is designed to operate **100% offline** with no external network requests. This document describes the offline operation implementation and validation procedures.

**Requirement**: 8.3 - The Kiosk System SHALL operate entirely offline with no network requests

## Implementation

### 1. Network Blocking

#### Browser-Level Blocking (src/lib/utils/network-blocker.ts)

The `NetworkBlocker` class intercepts and blocks all external network requests at the browser level:

- **Fetch API**: Overrides `window.fetch` to block external HTTP/HTTPS requests
- **XMLHttpRequest**: Overrides `XMLHttpRequest.prototype.open` to block external requests
- **WebSocket**: Overrides `window.WebSocket` to block external connections

**Allowed URLs**:
- `file://` - Local file system
- `data:` - Data URLs (inline images, fonts)
- `blob:` - Blob URLs (generated content)
- Relative URLs - Application resources
- `localhost` / `127.0.0.1` - Development only

**Blocked URLs**:
- All `http://` and `https://` external URLs
- All `ws://` and `wss://` WebSocket URLs

#### Electron-Level Blocking (electron/main.ts)

The Electron main process provides additional network blocking:

```typescript
// Block all external requests in production
mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
  const url = details.url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    callback({ cancel: true });
  } else {
    callback({ cancel: false });
  }
});
```

### 2. Content Security Policy

#### HTML Meta Tag (index.html)

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: blob:; 
               font-src 'self' data:; 
               connect-src 'self'; 
               media-src 'self'; 
               object-src 'none'; 
               frame-src 'none'; 
               base-uri 'self'; 
               form-action 'self';">
```

#### Electron Headers (electron/main.ts)

```typescript
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
```

### 3. Asset Bundling

#### Vite Configuration (vite.config.ts)

All assets are bundled locally:

```typescript
build: {
  assetsInlineLimit: 0, // Keep assets as files
  rollupOptions: {
    output: {
      assetFileNames: (assetInfo) => {
        // Organize by type: images, fonts, models, textures, wasm
      }
    }
  }
}
```

#### Electron Builder Configuration (electron-builder.json)

All resources are packaged with the application:

```json
{
  "extraResources": [
    { "from": "public/assets", "to": "assets" },
    { "from": "public/config", "to": "config" },
    { "from": "public/images", "to": "images" },
    { "from": "public/photos", "to": "photos" },
    { "from": "public/pdfs", "to": "pdfs" }
  ],
  "asar": true,
  "compression": "maximum"
}
```

### 4. SQL.js WASM File

The SQL.js WebAssembly file is bundled locally:

```typescript
// src/lib/database/manager.ts
this.SQL = await initSqlJs({
  locateFile: (file: string) => `/node_modules/sql.js/dist/${file}`
});
```

The Vite build process copies the WASM file to the dist folder:

```typescript
// vite.config.ts
{
  name: 'copy-sql-wasm',
  closeBundle() {
    // Copy sql-wasm.wasm to dist/node_modules/sql.js/dist/
  }
}
```

### 5. Navigation Prevention

Prevent navigation away from the application:

```typescript
mainWindow.webContents.on('will-navigate', (event, url) => {
  if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
    event.preventDefault();
  }
});
```

## Validation

### Automated Tests

Run the offline operation test suite:

```bash
npm run test:e2e -- offline-operation.test.ts
```

**Test Coverage**:
- ✓ Application loads in offline mode
- ✓ External fetch requests are blocked
- ✓ External XHR requests are blocked
- ✓ WebSocket connections are blocked
- ✓ Local file URLs are allowed
- ✓ Data URLs are allowed
- ✓ Blob URLs are allowed
- ✓ Relative URLs are allowed
- ✓ Blocked request statistics are tracked
- ✓ All local assets load successfully
- ✓ Application operates without network connection

### Validation Script

Run the comprehensive validation script:

```bash
node scripts/validate-offline-operation.js
```

**Validation Checks**:
1. Network blocker implementation
2. Electron configuration
3. Asset bundling configuration
4. Dependencies check
5. Content Security Policy
6. Service worker (optional)

### Manual Testing

#### Test in Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser DevTools → Network tab

3. Set "Offline" mode in DevTools

4. Verify the application loads and functions

5. Check console for blocked request warnings

#### Test Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. Package for Electron:
   ```bash
   npm run build:electron
   ```

3. Install and run the packaged application

4. Disconnect from network

5. Verify full functionality

#### Test Network Blocking

1. Open the application

2. Open DevTools console

3. Try to make external requests:
   ```javascript
   fetch('https://api.example.com/data')
   // Should reject with: "Blocked external fetch request"
   
   new XMLHttpRequest().open('GET', 'https://api.example.com/data')
   // Should throw: "Blocked external XHR request"
   
   new WebSocket('wss://api.example.com/socket')
   // Should throw: "Blocked WebSocket connection"
   ```

4. Check blocked request statistics:
   ```javascript
   NetworkBlocker.getInstance().getStats()
   // Returns: { blockedCount: 3, blockedRequests: [...] }
   ```

## Monitoring

### Statistics Tracking

The network blocker tracks all blocked requests:

```typescript
const stats = NetworkBlocker.getInstance().getStats();
console.log(`Blocked ${stats.blockedCount} requests`);
console.log('Blocked URLs:', stats.blockedRequests);
```

### Console Warnings

Blocked requests are logged to the console:

```
[NetworkBlocker] Blocked fetch request: https://api.example.com/data
[NetworkBlocker] Blocked XHR request: https://cdn.example.com/script.js
[NetworkBlocker] Blocked WebSocket connection: wss://socket.example.com
```

### Periodic Summary

Every 60 seconds, a summary is logged:

```
[NetworkBlocker] Blocked 15 external requests in the last minute
```

## Troubleshooting

### Issue: Application fails to load

**Cause**: Missing local assets

**Solution**:
1. Verify all assets are in `public/` directory
2. Check `electron-builder.json` extraResources configuration
3. Rebuild the application

### Issue: SQL.js fails to initialize

**Cause**: WASM file not found

**Solution**:
1. Verify `sql-wasm.wasm` is in `dist/node_modules/sql.js/dist/`
2. Check Vite plugin is copying the file
3. Rebuild the application

### Issue: Images/fonts not loading

**Cause**: CSP blocking resources

**Solution**:
1. Verify CSP allows `data:` and `blob:` for images
2. Verify CSP allows `data:` for fonts
3. Check browser console for CSP violations

### Issue: External requests still going through

**Cause**: Network blocker not initialized

**Solution**:
1. Verify `initializeNetworkBlocker()` is called in `main.tsx`
2. Check browser console for initialization message
3. Verify production mode is enabled

## Best Practices

### 1. Asset Organization

Keep all assets in the `public/` directory:

```
public/
├── assets/          # 3D models, textures
├── config/          # Configuration files
├── images/          # UI images
├── photos/          # Photo gallery
└── pdfs/            # Publications
```

### 2. Dependency Management

Avoid dependencies that make network requests:
- ❌ `axios`, `node-fetch`, `got`, `request`
- ❌ `analytics`, `sentry`, `bugsnag`, `mixpanel`
- ✓ Use built-in `fetch` (which is blocked for external URLs)

### 3. Configuration Files

Store all configuration locally:
- `public/config/config.json` - Application settings
- `public/config/rooms.json` - Room definitions

### 4. Testing

Always test offline operation:
- Run automated tests before deployment
- Test production build with network disconnected
- Verify all features work offline

## Compliance

This implementation satisfies:

- **Requirement 8.3**: The Kiosk System SHALL operate entirely offline with no network requests
- **Requirement 8.4**: The Kiosk System SHALL maintain stable memory usage without leaks (no network overhead)
- **Security**: No data leakage to external services
- **Reliability**: No dependency on network availability
- **Performance**: No network latency

## References

- Network Blocker: `src/lib/utils/network-blocker.ts`
- Electron Main: `electron/main.ts`
- Vite Config: `vite.config.ts`
- Electron Builder: `electron-builder.json`
- Test Suite: `src/__tests__/e2e/offline-operation.test.ts`
- Validation Script: `scripts/validate-offline-operation.js`

---

**Last Updated**: 2025-01-10
**Status**: ✓ Complete
**Requirement**: 8.3
