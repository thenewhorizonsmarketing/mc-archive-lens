import { useEffect, useRef } from 'react';
import { usePerformanceStore } from '@/store/performanceStore';
import { detectAndAssignMotionTier } from '@/lib/utils/gpu-detector';
import type { MotionTier } from '@/store/performanceStore';

/**
 * Hook for motion tier detection on boot
 * 
 * Detects GPU capabilities and assigns initial motion tier.
 * 
 * Requirements:
 * - 6.1: Detect device capabilities and assign Motion Tier on boot
 * - 6.2: Full tier - board tilt + parallax + emissive pulses (60 FPS target)
 * - 6.3: Lite tier - parallax only, no tilt (55-60 FPS target)
 * - 6.4: Static tier - cross-fade highlights only
 * - 6.5: Auto-downgrade on sustained frame drops
 */

export interface UseMotionTierDetectionOptions {
  /** Override automatic detection with a specific tier */
  overrideTier?: MotionTier | 'auto';
  /** Enable/disable auto-downgrade on performance issues */
  enableAutoDowngrade?: boolean;
  /** Callback when detection is complete */
  onDetectionComplete?: (tier: MotionTier) => void;
}

/**
 * Hook to detect GPU capabilities and assign motion tier on mount
 */
export function useMotionTierDetection(options: UseMotionTierDetectionOptions = {}) {
  const {
    overrideTier = 'auto',
    enableAutoDowngrade = true,
    onDetectionComplete
  } = options;
  
  const {
    setInitialMotionTier,
    setGPUCapabilities,
    setAutoTier,
    motionTier,
    gpuCapabilities
  } = usePerformanceStore();
  
  const hasDetectedRef = useRef(false);
  
  useEffect(() => {
    // Only detect once on mount
    if (hasDetectedRef.current) {
      return;
    }
    
    hasDetectedRef.current = true;
    
    console.log('[useMotionTierDetection] Starting GPU detection...');
    
    // Set auto-tier preference
    setAutoTier(enableAutoDowngrade);
    
    // If override tier is specified and not 'auto', use it
    if (overrideTier !== 'auto') {
      console.log(`[useMotionTierDetection] Using override tier: ${overrideTier}`);
      setInitialMotionTier(overrideTier);
      
      if (onDetectionComplete) {
        onDetectionComplete(overrideTier);
      }
      
      return;
    }
    
    // Detect GPU capabilities and assign motion tier
    try {
      const { capabilities, motionTier: detectedTier } = detectAndAssignMotionTier();
      
      // Store capabilities in performance store
      setGPUCapabilities(capabilities);
      
      // Set initial motion tier
      setInitialMotionTier(detectedTier);
      
      console.log('[useMotionTierDetection] Detection complete:', {
        tier: detectedTier,
        gpuTier: capabilities.gpuTier,
        webglVersion: capabilities.webglVersion,
        autoDowngrade: enableAutoDowngrade
      });
      
      // Notify callback
      if (onDetectionComplete) {
        onDetectionComplete(detectedTier);
      }
    } catch (error) {
      console.error('[useMotionTierDetection] Error during detection:', error);
      
      // Fallback to static tier on error
      console.warn('[useMotionTierDetection] Falling back to static tier due to error');
      setInitialMotionTier('static');
      
      if (onDetectionComplete) {
        onDetectionComplete('static');
      }
    }
  }, [
    overrideTier,
    enableAutoDowngrade,
    setInitialMotionTier,
    setGPUCapabilities,
    setAutoTier,
    onDetectionComplete
  ]);
  
  return {
    motionTier,
    gpuCapabilities,
    isDetected: hasDetectedRef.current
  };
}
