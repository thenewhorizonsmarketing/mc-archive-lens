/**
 * Service Worker Registration Utility
 * Registers the service worker for offline caching
 */

export const registerServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('[ServiceWorker] Service workers are not supported');
    return;
  }

  if (import.meta.env.DEV) {
    console.log('[ServiceWorker] Skipping registration in development mode');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[ServiceWorker] Registered successfully:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[ServiceWorker] New version available');
          }
        });
      }
    });
  } catch (error) {
    console.error('[ServiceWorker] Registration failed:', error);
  }
};

export const unregisterServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[ServiceWorker] Unregistered successfully');
    }
  } catch (error) {
    console.error('[ServiceWorker] Unregistration failed:', error);
  }
};
