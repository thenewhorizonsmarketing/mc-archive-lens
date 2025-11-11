import { useEffect, useState } from 'react';
import { usePerformanceStore } from '@/store/performanceStore';

/**
 * useReducedMotion Hook
 * 
 * Detects and responds to reduced motion preferences.
 * 
 * Requirements:
 * - 9.2: Detect prefers-reduced-motion
 * - 9.2: Disable tilt and parallax
 * - 9.2: Use cross-fade only
 */

export interface ReducedMotionState {
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
  /** Whether reduced motion is currently active (can be overridden by admin) */
  isReducedMotionActive: boolean;
  /** Toggle reduced motion override */
  toggleReducedMotion: () => void;
}

export function useReducedMotion(): ReducedMotionState {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const motionTier = usePerformanceStore((state) => state.motionTier);
  const setMotionTier = usePerformanceStore((state) => state.setMotionTier);

  // Detect reduced motion preference on mount and when it changes
  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      const reducedMotion = event.matches;
      setPrefersReducedMotion(reducedMotion);
      
      console.log('[useReducedMotion] Preference changed:', reducedMotion);
      
      // Automatically switch to static tier when reduced motion is preferred
      if (reducedMotion && motionTier !== 'static') {
        console.log('[useReducedMotion] Switching to static tier');
        setMotionTier('static');
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [motionTier, setMotionTier]);

  // Determine if reduced motion is currently active
  const isReducedMotionActive = motionTier === 'static';

  // Toggle reduced motion (for admin override)
  const toggleReducedMotion = () => {
    if (isReducedMotionActive) {
      // Switch to lite tier (safe default)
      console.log('[useReducedMotion] Enabling motion (lite tier)');
      setMotionTier('lite');
    } else {
      // Switch to static tier
      console.log('[useReducedMotion] Disabling motion (static tier)');
      setMotionTier('static');
    }
  };

  return {
    prefersReducedMotion,
    isReducedMotionActive,
    toggleReducedMotion
  };
}

export default useReducedMotion;
