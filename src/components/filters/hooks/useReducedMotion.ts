/**
 * useReducedMotion Hook
 * 
 * React hook for detecting and respecting user's motion preferences.
 * Provides utilities for conditional animations and transitions.
 */

import { useState, useEffect, useCallback } from 'react';
import { getReducedMotionManager, MotionSettings } from '../../../lib/filters/ReducedMotionManager';

export function useReducedMotion() {
  const [settings, setSettings] = useState<MotionSettings>(() => 
    getReducedMotionManager().getSettings()
  );

  useEffect(() => {
    const manager = getReducedMotionManager();
    
    // Subscribe to settings changes
    const unsubscribe = manager.subscribe(setSettings);
    
    return unsubscribe;
  }, []);

  // Get animation class conditionally
  const getAnimationClass = useCallback((animationClass: string): string => {
    return settings.enableAnimations ? animationClass : '';
  }, [settings.enableAnimations]);

  // Get conditional style
  const getConditionalStyle = useCallback((
    animatedStyle: React.CSSProperties,
    staticStyle: React.CSSProperties
  ): React.CSSProperties => {
    return settings.enableAnimations ? animatedStyle : staticStyle;
  }, [settings.enableAnimations]);

  // Get safe animation config
  const getSafeAnimationConfig = useCallback((config: {
    duration?: number;
    delay?: number;
    easing?: string;
  }) => {
    return getReducedMotionManager().getSafeAnimationConfig(config);
  }, []);

  // Execute with animation if enabled
  const withAnimation = useCallback(<T,>(
    animatedFn: () => Promise<T>,
    immediateFn: () => T
  ): Promise<T> => {
    return getReducedMotionManager().withAnimation(animatedFn, immediateFn);
  }, []);

  return {
    prefersReducedMotion: settings.prefersReducedMotion,
    transitionDuration: settings.transitionDuration,
    animationDuration: settings.animationDuration,
    enableAnimations: settings.enableAnimations,
    getAnimationClass,
    getConditionalStyle,
    getSafeAnimationConfig,
    withAnimation,
  };
}
