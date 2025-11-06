import { useEffect, useRef, useState } from 'react';

interface UsePhotoGesturesProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minZoom?: number;
  maxZoom?: number;
  enabled?: boolean;
}

interface GestureState {
  scale: number;
  translateX: number;
  translateY: number;
  isDragging: boolean;
}

export const usePhotoGestures = ({
  onSwipeLeft,
  onSwipeRight,
  minZoom = 1,
  maxZoom = 4,
  enabled = true,
}: UsePhotoGesturesProps = {}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [gestureState, setGestureState] = useState<GestureState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
  });

  // Touch tracking
  const touchesRef = useRef<{ startX: number; startY: number; startDistance: number; startScale: number; startTranslateX: number; startTranslateY: number }>({
    startX: 0,
    startY: 0,
    startDistance: 0,
    startScale: 1,
    startTranslateX: 0,
    startTranslateY: 0,
  });

  const lastTapRef = useRef<number>(0);

  // Calculate distance between two touch points
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Reset zoom and position
  const resetZoom = () => {
    setGestureState({
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false,
    });
  };

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      // Double tap to zoom
      if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
        e.preventDefault();
        if (gestureState.scale > 1) {
          resetZoom();
        } else {
          setGestureState(prev => ({
            ...prev,
            scale: 2,
            translateX: 0,
            translateY: 0,
          }));
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      if (e.touches.length === 1) {
        // Single touch - start dragging if zoomed
        touchesRef.current.startX = e.touches[0].clientX;
        touchesRef.current.startY = e.touches[0].clientY;
        touchesRef.current.startTranslateX = gestureState.translateX;
        touchesRef.current.startTranslateY = gestureState.translateY;
        
        if (gestureState.scale > 1) {
          setGestureState(prev => ({ ...prev, isDragging: true }));
        }
      } else if (e.touches.length === 2) {
        // Two touches - start pinch zoom
        e.preventDefault();
        touchesRef.current.startDistance = getDistance(e.touches[0], e.touches[1]);
        touchesRef.current.startScale = gestureState.scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && gestureState.scale > 1) {
        // Pan when zoomed
        e.preventDefault();
        const deltaX = e.touches[0].clientX - touchesRef.current.startX;
        const deltaY = e.touches[0].clientY - touchesRef.current.startY;

        // Apply boundaries based on zoom level
        const maxTranslateX = (container.offsetWidth * (gestureState.scale - 1)) / 2;
        const maxTranslateY = (container.offsetHeight * (gestureState.scale - 1)) / 2;

        const newTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, touchesRef.current.startTranslateX + deltaX));
        const newTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, touchesRef.current.startTranslateY + deltaY));

        setGestureState(prev => ({
          ...prev,
          translateX: newTranslateX,
          translateY: newTranslateY,
        }));
      } else if (e.touches.length === 2) {
        // Pinch zoom
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scale = (currentDistance / touchesRef.current.startDistance) * touchesRef.current.startScale;
        const clampedScale = Math.max(minZoom, Math.min(maxZoom, scale));

        setGestureState(prev => ({
          ...prev,
          scale: clampedScale,
        }));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        // Check for swipe gesture (only when not zoomed)
        if (gestureState.scale === 1 && !gestureState.isDragging) {
          const deltaX = touchesRef.current.startX - (e.changedTouches[0]?.clientX || touchesRef.current.startX);
          const deltaY = Math.abs(touchesRef.current.startY - (e.changedTouches[0]?.clientY || touchesRef.current.startY));
          
          const swipeThreshold = 50;
          const verticalThreshold = 100;

          // Horizontal swipe detection (only if not too vertical)
          if (Math.abs(deltaX) > swipeThreshold && deltaY < verticalThreshold) {
            if (deltaX > 0 && onSwipeLeft) {
              onSwipeLeft();
            } else if (deltaX < 0 && onSwipeRight) {
              onSwipeRight();
            }
          }
        }

        setGestureState(prev => ({ ...prev, isDragging: false }));

        // Reset zoom if it's very close to 1
        if (gestureState.scale < 1.1 && gestureState.scale !== 1) {
          resetZoom();
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, gestureState.scale, gestureState.translateX, gestureState.translateY, gestureState.isDragging, onSwipeLeft, onSwipeRight, minZoom, maxZoom]);

  // Reset on disable
  useEffect(() => {
    if (!enabled) {
      resetZoom();
    }
  }, [enabled]);

  return {
    containerRef,
    imageRef,
    gestureState,
    resetZoom,
    transform: `translate(${gestureState.translateX}px, ${gestureState.translateY}px) scale(${gestureState.scale})`,
  };
};
