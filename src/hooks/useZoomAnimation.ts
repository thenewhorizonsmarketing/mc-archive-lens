import { useState, useCallback } from 'react';

interface UseZoomAnimationReturn {
  isZooming: boolean;
  startZoom: (callback: () => void) => void;
  resetZoom: () => void;
}

/**
 * Custom hook to manage zoom animation state and navigation timing
 * Provides a 650ms delay before executing the navigation callback
 */
export const useZoomAnimation = (): UseZoomAnimationReturn => {
  const [isZooming, setIsZooming] = useState(false);

  const startZoom = useCallback((callback: () => void) => {
    setIsZooming(true);

    // Wait 650ms for zoom animation to complete before navigating
    setTimeout(() => {
      callback();
      setIsZooming(false);
    }, 650);
  }, []);

  const resetZoom = useCallback(() => {
    setIsZooming(false);
  }, []);

  return {
    isZooming,
    startZoom,
    resetZoom,
  };
};
