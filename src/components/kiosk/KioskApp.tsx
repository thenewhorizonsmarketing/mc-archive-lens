import React, { useEffect, useState } from 'react';
import { KioskErrorBoundary } from '@/components/error/KioskErrorBoundary';
import { WebGLErrorBoundary } from '@/components/error/WebGLErrorBoundary';
import { useKioskStore, usePerformanceStore, useIdleStore } from '@/store';
import { detectWebGL, prefersReducedMotion, logWebGLCapabilities } from '@/lib/webgl';
import { configManager } from '@/lib/config/ConfigManager';
import { detectAndAssignMotionTier } from '@/lib/utils/gpu-detector';
import type { KioskConfig } from '@/types/kiosk-config';

interface KioskAppProps {
  children: (props: KioskAppRenderProps) => React.ReactNode;
}

export interface KioskAppRenderProps {
  config: KioskConfig | null;
  isLoading: boolean;
  use3D: boolean;
  webGLAvailable: boolean;
}

/**
 * Root Kiosk Application Component
 * 
 * Responsibilities:
 * - Load configuration on mount
 * - Initialize state management
 * - Detect WebGL availability
 * - Provide error boundaries
 * - Conditionally render 3D or 2D fallback
 */
export const KioskApp: React.FC<KioskAppProps> = ({ children }) => {
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [use3D, setUse3D] = useState(true);
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  
  const { 
    setWebGLAvailable: setStoreWebGL,
    setGPUCapabilities,
    setInitialMotionTier,
    setAutoTier
  } = usePerformanceStore();
  const { setIdleTimeout, setAttractTimeout, startIdleTimer } = useIdleStore();
  const { goHome } = useKioskStore();

  // Initialize configuration and WebGL detection
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('[KioskApp] Initializing...');
        
        // Detect WebGL capabilities
        const webglCapabilities = detectWebGL();
        logWebGLCapabilities(webglCapabilities);
        
        setWebGLAvailable(webglCapabilities.available);
        setStoreWebGL(webglCapabilities.available, webglCapabilities.version);
        
        // Check for reduced motion preference
        const reducedMotion = prefersReducedMotion();
        if (reducedMotion) {
          console.log('[KioskApp] Reduced motion detected, using 2D fallback');
        }
        
        // Determine if 3D mode should be used
        const should3D = webglCapabilities.available && !reducedMotion;
        setUse3D(should3D);
        
        // Load configuration
        console.log('[KioskApp] Loading configuration...');
        const loadedConfig = await configManager.loadConfig();
        
        setConfig(loadedConfig);
        
        // Apply configuration to stores
        if (loadedConfig.idleTimeout) {
          setIdleTimeout(loadedConfig.idleTimeout * 1000); // Convert to ms
        }
        if (loadedConfig.attractTimeout) {
          setAttractTimeout(loadedConfig.attractTimeout * 1000); // Convert to ms
        }
        
        // Detect GPU capabilities and assign motion tier (Requirement 6.1)
        if (loadedConfig.motionTier === 'auto') {
          console.log('[KioskApp] Auto-detecting motion tier based on GPU capabilities...');
          
          try {
            const { capabilities, motionTier } = detectAndAssignMotionTier();
            
            // Store GPU capabilities
            setGPUCapabilities(capabilities);
            
            // Set initial motion tier
            setInitialMotionTier(motionTier);
            
            // Enable auto-downgrade (Requirement 6.5)
            setAutoTier(true);
            
            console.log('[KioskApp] Motion tier detection complete:', {
              tier: motionTier,
              gpuTier: capabilities.gpuTier,
              autoDowngrade: true
            });
          } catch (error) {
            console.error('[KioskApp] Motion tier detection failed:', error);
            // Fallback to lite tier
            setInitialMotionTier('lite');
            setAutoTier(true);
          }
        } else {
          // Use configured motion tier
          console.log(`[KioskApp] Using configured motion tier: ${loadedConfig.motionTier}`);
          usePerformanceStore.getState().setMotionTier(loadedConfig.motionTier);
          usePerformanceStore.getState().setAutoTier(false);
        }
        
        // Apply reduced motion from config
        if (loadedConfig.reducedMotion) {
          console.log('[KioskApp] Reduced motion enabled in config');
          setUse3D(false);
          setInitialMotionTier('static');
        }
        
        console.log('[KioskApp] Initialization complete');
        setIsLoading(false);
        
        // Start idle timer after initialization
        startIdleTimer();
        
      } catch (error) {
        console.error('[KioskApp] Initialization error:', error);
        setIsLoading(false);
        
        // Use defaults if config fails to load
        setConfig({
          rooms: [],
          idleTimeout: 45,
          attractTimeout: 120,
          adminPin: '0000',
          motionTier: 'auto',
          reducedMotion: false
        });
      }
    };

    initialize();
  }, [
    setStoreWebGL,
    setGPUCapabilities,
    setInitialMotionTier,
    setAutoTier,
    setIdleTimeout,
    setAttractTimeout,
    startIdleTimer
  ]);

  // Handle WebGL errors by falling back to 2D
  const handleWebGLError = () => {
    console.warn('[KioskApp] WebGL error detected, switching to 2D fallback');
    setUse3D(false);
    setWebGLAvailable(false);
    setStoreWebGL(false, 0);
  };

  // Record activity on any user interaction
  useEffect(() => {
    const recordActivity = () => {
      useIdleStore.getState().recordActivity();
    };

    // Listen for user interactions
    const events = ['mousedown', 'touchstart', 'keydown', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, recordActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, recordActivity);
      });
    };
  }, []);

  // Handle auto-reset from idle store
  useEffect(() => {
    const unsubscribe = useIdleStore.subscribe((state, prevState) => {
      // Check if we just triggered auto-reset
      if (!state.isInAttractMode && prevState.isInAttractMode && !state.isIdle) {
        console.log('[KioskApp] Auto-reset triggered, returning to home');
        goHome();
      }
    });

    return unsubscribe;
  }, [goHome]);

  return (
    <KioskErrorBoundary>
      <WebGLErrorBoundary
        fallback={children({ 
          config, 
          isLoading, 
          use3D: false, 
          webGLAvailable: false 
        })}
        onWebGLError={handleWebGLError}
      >
        {children({ config, isLoading, use3D, webGLAvailable })}
      </WebGLErrorBoundary>
    </KioskErrorBoundary>
  );
};
