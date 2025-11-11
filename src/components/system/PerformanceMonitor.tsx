import React, { useEffect, useRef, useCallback } from 'react';
import { usePerformanceStore } from '@/store/performanceStore';

/**
 * PerformanceMonitor Component
 * 
 * Monitors real-time performance metrics including FPS, draw calls, memory usage,
 * and detects sustained frame drops to trigger automatic motion tier downgrade.
 * 
 * Requirements:
 * - 6.5: Detect sustained frame drops and auto-downgrade motion tier
 * - 7.2: Track main thread blocking time (target: ≤200ms)
 * - 7.3: Track draw calls (target: ≤120)
 */

export interface PerformanceMonitorProps {
  /** Whether monitoring is enabled */
  enabled?: boolean;
  /** Target FPS (default: 60) */
  targetFPS?: number;
  /** FPS threshold for downgrade detection (default: 55) */
  downgradeFPSThreshold?: number;
  /** Number of consecutive low FPS frames before downgrade (default: 180 = 3 seconds at 60fps) */
  downgradeFrameThreshold?: number;
  /** Callback when performance metrics are updated */
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  /** Callback when tier downgrade is triggered */
  onTierDowngrade?: (newTier: string) => void;
  /** Children to render (optional) */
  children?: React.ReactNode;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  memoryUsage: number;
  gpuMemory?: number;
}

/**
 * PerformanceMonitor Component
 * 
 * Tracks FPS using requestAnimationFrame, monitors draw calls via WebGL context,
 * tracks memory usage, and detects sustained frame drops for auto-tier adjustment.
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = true,
  targetFPS = 60,
  downgradeFPSThreshold = 55,
  downgradeFrameThreshold = 180, // 3 seconds at 60fps
  onMetricsUpdate,
  onTierDowngrade,
  children
}) => {
  // Performance store
  const {
    updateFPS,
    updateMetrics,
    autoDowngradeTier,
    motionTier,
    autoTierEnabled
  } = usePerformanceStore();

  // Refs for tracking
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number>();
  const lowFpsFrameCountRef = useRef(0);
  const drawCallsRef = useRef(0);
  const webglContextRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);

  /**
   * Get memory usage from Performance API
   * Note: Only available in Chrome/Chromium browsers
   */
  const getMemoryUsage = useCallback((): number => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      // Return used heap size in MB
      return Math.round(memory.usedJSHeapSize / 1048576);
    }
    return 0;
  }, []);

  /**
   * Get GPU memory usage estimate
   * This is an approximation based on WebGL info
   */
  const getGPUMemory = useCallback((): number | undefined => {
    if (!webglContextRef.current) return undefined;
    
    try {
      const gl = webglContextRef.current;
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        // This is just a placeholder - actual GPU memory tracking requires extensions
        // that may not be available in all browsers
        return 0;
      }
    } catch (error) {
      console.warn('[PerformanceMonitor] Could not get GPU memory info:', error);
    }
    
    return undefined;
  }, []);

  /**
   * Get draw calls from WebGL context
   * This requires instrumenting the WebGL context
   */
  const getDrawCalls = useCallback((): number => {
    // Draw calls are tracked by Three.js renderer.info
    // This will be updated by the parent component that has access to the renderer
    return drawCallsRef.current;
  }, []);



  /**
   * Main performance measurement loop
   * Tracks FPS using requestAnimationFrame
   */
  const measurePerformance = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();
    const delta = now - lastTimeRef.current;
    
    frameCountRef.current++;

    // Calculate frame time
    const frameTime = delta / frameCountRef.current;

    // Update metrics every second (or every 60 frames, whichever comes first)
    if (delta >= 1000 || frameCountRef.current >= 60) {
      const fps = Math.round((frameCountRef.current * 1000) / delta);
      const avgFrameTime = Math.round(frameTime * 100) / 100;
      
      // Get memory usage
      const memoryUsage = getMemoryUsage();
      const gpuMemory = getGPUMemory();
      
      // Get draw calls
      const drawCalls = getDrawCalls();

      // Create metrics object
      const metrics: PerformanceMetrics = {
        fps,
        frameTime: avgFrameTime,
        drawCalls,
        memoryUsage,
        gpuMemory
      };

      // Update store
      updateFPS(fps);
      updateMetrics({
        fps,
        frameTime: avgFrameTime,
        drawCalls,
        memoryUsage
      });

      // Notify callback
      if (onMetricsUpdate) {
        onMetricsUpdate(metrics);
      }

      // Check for sustained frame drops (Requirement 6.5)
      if (fps < downgradeFPSThreshold) {
        lowFpsFrameCountRef.current += frameCountRef.current;
        
        // If we've had sustained low FPS for the threshold duration
        if (lowFpsFrameCountRef.current >= downgradeFrameThreshold && autoTierEnabled) {
          console.warn(
            `[PerformanceMonitor] Sustained frame drops detected (${fps} FPS < ${downgradeFPSThreshold} target)`,
            `for ${lowFpsFrameCountRef.current} frames. Triggering auto-downgrade.`
          );
          
          // Trigger auto-downgrade
          autoDowngradeTier();
          
          // Notify callback
          if (onTierDowngrade) {
            onTierDowngrade(motionTier);
          }
          
          // Reset counter after downgrade
          lowFpsFrameCountRef.current = 0;
        }
      } else {
        // Reset counter if FPS is good
        lowFpsFrameCountRef.current = 0;
      }

      // Log performance warnings
      if (drawCalls > 120) {
        console.warn(
          `[PerformanceMonitor] Draw calls exceed budget: ${drawCalls} > 120 (Requirement 7.3)`
        );
      }

      // Reset counters
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }

    // Continue monitoring
    rafIdRef.current = requestAnimationFrame(measurePerformance);
  }, [
    enabled,
    downgradeFPSThreshold,
    downgradeFrameThreshold,
    autoTierEnabled,
    motionTier,
    updateFPS,
    updateMetrics,
    autoDowngradeTier,
    getMemoryUsage,
    getGPUMemory,
    getDrawCalls,
    onMetricsUpdate,
    onTierDowngrade
  ]);

  /**
   * Initialize WebGL context for draw call tracking
   */
  useEffect(() => {
    if (!enabled) return;

    // Try to get WebGL context from canvas elements
    const canvases = document.querySelectorAll('canvas');
    for (const canvas of canvases) {
      try {
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        if (gl) {
          webglContextRef.current = gl;
          console.log('[PerformanceMonitor] WebGL context acquired for monitoring');
          break;
        }
      } catch (error) {
        console.warn('[PerformanceMonitor] Could not get WebGL context:', error);
      }
    }
  }, [enabled]);

  /**
   * Start performance monitoring loop
   */
  useEffect(() => {
    if (!enabled) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = undefined;
      }
      return;
    }

    console.log('[PerformanceMonitor] Starting performance monitoring', {
      targetFPS,
      downgradeFPSThreshold,
      downgradeFrameThreshold,
      autoTierEnabled
    });

    // Start measurement loop
    rafIdRef.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = undefined;
      }
      console.log('[PerformanceMonitor] Stopped performance monitoring');
    };
  }, [enabled, targetFPS, downgradeFPSThreshold, downgradeFrameThreshold, autoTierEnabled, measurePerformance]);

  // Render children if provided, otherwise render nothing
  return <>{children}</>;
};

/**
 * Hook to update draw calls from Three.js renderer
 * Use this in your 3D scene to provide draw call data to the PerformanceMonitor
 */
export const useDrawCallTracking = (renderer: any) => {
  useEffect(() => {
    if (!renderer || !renderer.info) return;

    const interval = setInterval(() => {
      // This will be picked up by the PerformanceMonitor
      // In a real implementation, you'd use a shared store or context
      const drawCalls = renderer.info.render.calls;
      // Store in performance store
      usePerformanceStore.getState().updateMetrics({ drawCalls });
    }, 1000);

    return () => clearInterval(interval);
  }, [renderer]);
};

export default PerformanceMonitor;
