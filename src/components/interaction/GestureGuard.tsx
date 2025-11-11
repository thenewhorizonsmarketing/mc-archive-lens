import { useEffect } from 'react';

/**
 * GestureGuard Component
 * 
 * Prevents unwanted gestures and interactions in the kiosk interface.
 * 
 * Requirements:
 * - 3.5: Disable pinch/zoom gestures
 * - 3.6: Block input during transitions
 * - 5.6: Prevent accidental scrolling
 */

export interface GestureGuardProps {
  /** Whether to block all input (e.g., during transitions) */
  blockInput?: boolean;
  /** Whether to prevent scrolling */
  preventScroll?: boolean;
  /** Whether to prevent pinch/zoom */
  preventZoom?: boolean;
  /** Whether to prevent context menu */
  preventContextMenu?: boolean;
  /** Whether to prevent text selection */
  preventSelection?: boolean;
}

export const GestureGuard: React.FC<GestureGuardProps> = ({
  blockInput = false,
  preventScroll = true,
  preventZoom = true,
  preventContextMenu = true,
  preventSelection = true
}) => {
  useEffect(() => {
    const handlers: Array<{
      element: HTMLElement | Document;
      event: string;
      handler: (e: Event) => void;
      options?: AddEventListenerOptions;
    }> = [];

    /**
     * Prevent scrolling
     */
    if (preventScroll) {
      const preventScrollHandler = (e: Event) => {
        e.preventDefault();
      };

      // Prevent wheel scrolling
      document.addEventListener('wheel', preventScrollHandler, { passive: false });
      handlers.push({
        element: document,
        event: 'wheel',
        handler: preventScrollHandler
      });

      // Prevent touch scrolling
      document.addEventListener('touchmove', preventScrollHandler, { passive: false });
      handlers.push({
        element: document,
        event: 'touchmove',
        handler: preventScrollHandler
      });
    }

    /**
     * Prevent pinch/zoom gestures
     */
    if (preventZoom) {
      const preventZoomHandler = (e: Event) => {
        e.preventDefault();
      };

      // Prevent gesture events (iOS Safari)
      document.addEventListener('gesturestart', preventZoomHandler, { passive: false });
      document.addEventListener('gesturechange', preventZoomHandler, { passive: false });
      document.addEventListener('gestureend', preventZoomHandler, { passive: false });

      handlers.push(
        { element: document, event: 'gesturestart', handler: preventZoomHandler },
        { element: document, event: 'gesturechange', handler: preventZoomHandler },
        { element: document, event: 'gestureend', handler: preventZoomHandler }
      );

      // Prevent double-tap zoom
      let lastTouchEnd = 0;
      const preventDoubleTapZoom = (e: Event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      };

      document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
      handlers.push({
        element: document,
        event: 'touchend',
        handler: preventDoubleTapZoom
      });

      // Prevent keyboard zoom (Ctrl/Cmd + +/-)
      const preventKeyboardZoom = (e: KeyboardEvent) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')
        ) {
          e.preventDefault();
        }
      };

      document.addEventListener('keydown', preventKeyboardZoom as EventListener);
      handlers.push({
        element: document,
        event: 'keydown',
        handler: preventKeyboardZoom as EventListener
      });
    }

    /**
     * Prevent context menu (right-click / long-press)
     */
    if (preventContextMenu) {
      const preventContextMenuHandler = (e: Event) => {
        e.preventDefault();
      };

      document.addEventListener('contextmenu', preventContextMenuHandler);
      handlers.push({
        element: document,
        event: 'contextmenu',
        handler: preventContextMenuHandler
      });
    }

    /**
     * Prevent text selection
     */
    if (preventSelection) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      // @ts-ignore - msUserSelect is not in TypeScript types but exists in IE
      document.body.style.msUserSelect = 'none';
    }

    /**
     * Block all input during transitions
     */
    if (blockInput) {
      const blockAllInput = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      };

      const inputEvents = [
        'mousedown',
        'mouseup',
        'click',
        'touchstart',
        'touchend',
        'keydown',
        'keyup'
      ];

      inputEvents.forEach(eventName => {
        document.addEventListener(eventName, blockAllInput, { 
          passive: false,
          capture: true 
        });
        handlers.push({
          element: document,
          event: eventName,
          handler: blockAllInput,
          options: { capture: true }
        });
      });

      // Visual indicator that input is blocked
      document.body.style.pointerEvents = 'none';
    }

    /**
     * Set viewport meta tag to prevent zoom
     */
    if (preventZoom) {
      let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      let originalContent = '';

      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      } else {
        originalContent = viewportMeta.content;
      }

      viewportMeta.content = 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

      // Cleanup function will restore original content
      handlers.push({
        element: document.head,
        event: 'viewport-restore',
        handler: () => {
          if (originalContent) {
            viewportMeta.content = originalContent;
          }
        }
      });
    }

    /**
     * Cleanup
     */
    return () => {
      handlers.forEach(({ element, event, handler, options }) => {
        if (event === 'viewport-restore') {
          handler(new Event('viewport-restore'));
        } else {
          element.removeEventListener(event, handler, options);
        }
      });

      // Restore styles
      if (preventSelection) {
        document.body.style.userSelect = '';
        document.body.style.webkitUserSelect = '';
        // @ts-ignore - msUserSelect is not in TypeScript types but exists in IE
        document.body.style.msUserSelect = '';
      }

      if (blockInput) {
        document.body.style.pointerEvents = '';
      }
    };
  }, [blockInput, preventScroll, preventZoom, preventContextMenu, preventSelection]);

  return null;
};

/**
 * Hook to control gesture guards programmatically
 */
export const useGestureGuard = () => {
  const blockInput = (block: boolean) => {
    if (block) {
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.pointerEvents = '';
    }
  };

  const preventScroll = (prevent: boolean) => {
    if (prevent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  return {
    blockInput,
    preventScroll
  };
};

export default GestureGuard;
