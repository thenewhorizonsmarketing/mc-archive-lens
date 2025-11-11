/**
 * Service Worker for Offline Operation
 * Caches all assets for 100% offline functionality
 */

const CACHE_NAME = '3d-clue-board-kiosk-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache all assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('[ServiceWorker] Installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network (but block external in production)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Block external requests in production
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
      console.warn('[ServiceWorker] Blocked external request:', url.href);
      event.respondWith(
        new Response('External requests are blocked in kiosk mode', {
          status: 403,
          statusText: 'Forbidden',
        })
      );
      return;
    }
  }
  
  // Cache-first strategy for local assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});
