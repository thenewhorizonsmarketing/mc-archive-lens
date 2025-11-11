# Kiosk Search Deployment Guide

## Overview

This guide covers the deployment process for the Fullscreen Kiosk Search Interface, including build configuration, testing procedures, and deployment verification.

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] Documentation updated

### Performance

- [ ] Search response time < 150ms
- [ ] Key press feedback < 50ms
- [ ] Result rendering < 200ms
- [ ] Navigation transitions = 300ms
- [ ] Bundle size optimized

### Functionality

- [ ] Search returns accurate results
- [ ] Filters work correctly
- [ ] Touch keyboard responsive
- [ ] Error handling works
- [ ] Offline mode functional
- [ ] All routes accessible

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Touch targets ≥ 44x44 pixels
- [ ] High contrast mode supported
- [ ] ARIA labels present

### Browser Compatibility

- [ ] Chrome 90+ tested
- [ ] Firefox 88+ tested
- [ ] Safari 14+ tested
- [ ] Edge 90+ tested

### Device Testing

- [ ] Tested on target kiosk hardware
- [ ] Touch input validated
- [ ] Screen resolution verified
- [ ] Performance acceptable on target device

## Build Configuration

### Production Build

Update `vite.config.ts` for production:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'search-components': [
            './src/components/kiosk/KioskSearchInterface',
            './src/components/kiosk/TouchKeyboard',
            './src/components/kiosk/FilterPanel',
            './src/components/kiosk/ResultsDisplay'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
```

### Environment Variables

Create `.env.production`:

```bash
# API Configuration
VITE_API_URL=https://api.example.com
VITE_API_TIMEOUT=5000

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_DEBUG_MODE=false

# Search Configuration
VITE_SEARCH_DEBOUNCE_MS=150
VITE_MAX_RESULTS=50
VITE_ENABLE_SUGGESTIONS=true

# Performance
VITE_ENABLE_SERVICE_WORKER=true
VITE_CACHE_STRATEGY=cache-first

# Kiosk Configuration
VITE_KIOSK_MODE=true
VITE_IDLE_TIMEOUT_MS=300000
VITE_ENABLE_KEYBOARD_SHORTCUTS=true
```

### Build Commands

```bash
# Install dependencies
npm ci

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests
npm test -- --run

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing Production Build

### 1. Build Verification

```bash
# Build the application
npm run build

# Check build output
ls -lh dist/

# Verify bundle sizes
npm run build -- --analyze
```

Expected bundle sizes:
- Main bundle: < 500KB (gzipped)
- Vendor bundle: < 300KB (gzipped)
- Search components: < 200KB (gzipped)

### 2. Local Testing

```bash
# Serve production build locally
npm run preview

# Or use a static server
npx serve dist -p 3000
```

Test the following:
- [ ] Search functionality works
- [ ] All routes accessible
- [ ] Assets load correctly
- [ ] No console errors
- [ ] Service worker registers
- [ ] Offline mode works

### 3. Performance Testing

```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000/search --view

# Run performance tests
npm run test:performance
```

Target Lighthouse scores:
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 90
- SEO: ≥ 80

### 4. Offline Testing

```bash
# Start local server
npm run preview

# In Chrome DevTools:
# 1. Open Application tab
# 2. Check "Offline" under Service Workers
# 3. Test search functionality
```

Verify:
- [ ] Search works offline
- [ ] Results display correctly
- [ ] Cached data accessible
- [ ] Error messages appropriate

## Deployment Process

### Option 1: Static Hosting (Netlify, Vercel)

#### Netlify

1. **Create `netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

2. **Deploy:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

#### Vercel

1. **Create `vercel.json`:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

2. **Deploy:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Option 2: Self-Hosted (Nginx)

1. **Build the application:**

```bash
npm run build
```

2. **Create Nginx configuration:**

```nginx
server {
    listen 80;
    server_name kiosk.example.com;
    root /var/www/kiosk-search/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Disable access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

3. **Deploy files:**

```bash
# Copy build to server
scp -r dist/* user@server:/var/www/kiosk-search/dist/

# Restart Nginx
ssh user@server 'sudo systemctl restart nginx'
```

### Option 3: Electron Kiosk Application

1. **Update `electron/main.ts`:**

```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load production build
  win.loadFile(path.join(__dirname, '../dist/index.html'));

  // Disable menu
  win.setMenu(null);

  // Prevent navigation away
  win.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
}

app.whenReady().then(createWindow);
```

2. **Build Electron app:**

```bash
# Build web app
npm run build

# Build Electron app
npm run electron:build

# Package for distribution
npm run electron:package
```

3. **Deploy to kiosk:**

```bash
# Copy installer to kiosk
scp dist/kiosk-search-setup.exe user@kiosk:/tmp/

# Install on kiosk
ssh user@kiosk 'cd /tmp && ./kiosk-search-setup.exe'
```

## Post-Deployment Verification

### 1. Smoke Tests

```bash
# Run automated smoke tests
npm run test:smoke -- --url=https://kiosk.example.com
```

Manual checks:
- [ ] Homepage loads
- [ ] Search page accessible
- [ ] Search returns results
- [ ] Filters work
- [ ] Touch keyboard responsive
- [ ] Navigation works
- [ ] No console errors

### 2. Performance Monitoring

```bash
# Run Lighthouse on production
npx lighthouse https://kiosk.example.com/search --view

# Check Core Web Vitals
npm run test:vitals -- --url=https://kiosk.example.com
```

Monitor:
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### 3. Error Monitoring

Set up error tracking:

```typescript
// src/lib/monitoring/error-tracker.ts
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out non-critical errors
      if (event.level === 'warning') {
        return null;
      }
      return event;
    }
  });
}
```

### 4. Analytics Verification

```typescript
// Verify analytics are working
import { trackEvent } from '@/lib/analytics';

// Test event tracking
trackEvent('search_performed', {
  query: 'test',
  results: 10
});

// Check analytics dashboard
// Verify events are being received
```

## Rollback Procedure

If issues are detected after deployment:

### 1. Immediate Rollback

```bash
# Netlify
netlify rollback

# Vercel
vercel rollback

# Self-hosted
ssh user@server 'cd /var/www/kiosk-search && git checkout previous-tag'
ssh user@server 'sudo systemctl restart nginx'
```

### 2. Investigate Issues

```bash
# Check error logs
tail -f /var/log/nginx/error.log

# Check application logs
# (if using error tracking service)

# Review recent changes
git log --oneline -10
```

### 3. Fix and Redeploy

```bash
# Fix the issue
git commit -m "Fix: [description]"

# Test locally
npm run build
npm run preview

# Redeploy
npm run deploy
```

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Verify search functionality

### Weekly
- [ ] Review analytics data
- [ ] Check for dependency updates
- [ ] Verify offline functionality

### Monthly
- [ ] Run full test suite
- [ ] Optimize database
- [ ] Review and update documentation
- [ ] Check bundle sizes

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] User feedback review
- [ ] Update dependencies

## Troubleshooting Deployment Issues

### Build Fails

**Error: Out of memory**

```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**Error: Module not found**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Assets Not Loading

**Check paths in build:**

```bash
# Verify asset paths
grep -r "assets/" dist/index.html
```

**Update base URL if needed:**

```typescript
// vite.config.ts
export default defineConfig({
  base: '/kiosk-search/', // If deployed to subdirectory
});
```

### Service Worker Issues

**Clear service worker:**

```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

**Verify service worker registration:**

```typescript
// Check in src/main.tsx
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').then(
    registration => console.log('SW registered:', registration),
    error => console.error('SW registration failed:', error)
  );
}
```

### Performance Issues

**Enable performance profiling:**

```typescript
// Add to production build temporarily
if (import.meta.env.VITE_ENABLE_PROFILING === 'true') {
  const { PerformanceObserver } = window;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(entry.name, entry.duration);
    }
  });
  observer.observe({ entryTypes: ['measure', 'navigation'] });
}
```

## Security Considerations

### Content Security Policy

Add to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:;">
```

### HTTPS Configuration

Ensure HTTPS is enabled:

```nginx
server {
    listen 443 ssl http2;
    server_name kiosk.example.com;
    
    ssl_certificate /etc/ssl/certs/kiosk.crt;
    ssl_certificate_key /etc/ssl/private/kiosk.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name kiosk.example.com;
    return 301 https://$server_name$request_uri;
}
```

### Database Security

```typescript
// Ensure database is read-only in production
const db = new Database('alumni.db', { readonly: true });

// Sanitize all user input
function sanitizeQuery(query: string): string {
  return query.replace(/[^\w\s-]/g, '');
}
```

## Support and Resources

### Documentation
- [User Guide](./KIOSK_SEARCH_USER_GUIDE.md)
- [Developer Guide](./KIOSK_SEARCH_DEVELOPER_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Monitoring
- Error tracking: [Sentry Dashboard]
- Analytics: [Analytics Dashboard]
- Performance: [Lighthouse CI]

### Contact
- Technical Support: support@example.com
- Emergency Contact: emergency@example.com

---

Last Updated: November 2025
