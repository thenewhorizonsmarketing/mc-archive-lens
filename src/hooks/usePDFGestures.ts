import { useRef, useCallback, RefObject } from "react";

interface GestureHandlers {
  onZoom: (delta: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onFitPage: () => void;
}

export function usePDFGestures(
  containerRef: RefObject<HTMLDivElement>,
  handlers: GestureHandlers
) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);
  const initialPinchDistanceRef = useRef<number>(0);
  const lastPinchDistanceRef = useRef<number>(0);

  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - track for swipe and double-tap
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    } else if (e.touches.length === 2) {
      // Two touches - track for pinch
      initialPinchDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
      lastPinchDistanceRef.current = initialPinchDistanceRef.current;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const delta = currentDistance - lastPinchDistanceRef.current;
      
      if (Math.abs(delta) > 5) {
        const zoomDelta = delta > 0 ? 0.1 : -0.1;
        handlers.onZoom(zoomDelta);
        lastPinchDistanceRef.current = currentDistance;
      }
    }
  }, [handlers]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.changedTouches.length === 1 && touchStartRef.current) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Check for swipe (horizontal movement > 50px, time < 300ms)
      if (Math.abs(deltaX) > 50 && deltaTime < 300 && Math.abs(deltaY) < 50) {
        if (deltaX > 0) {
          handlers.onPreviousPage();
        } else {
          handlers.onNextPage();
        }
      }

      // Check for double-tap (two taps within 300ms)
      const now = Date.now();
      if (now - lastTapRef.current < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        handlers.onFitPage();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }

      touchStartRef.current = null;
    }

    // Reset pinch tracking
    initialPinchDistanceRef.current = 0;
    lastPinchDistanceRef.current = 0;
  }, [handlers]);

  const attachGestures = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { attachGestures };
}
