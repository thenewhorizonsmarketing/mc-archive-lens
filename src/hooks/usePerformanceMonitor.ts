import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number;
  frameTime: number;
}

/**
 * Hook to monitor animation performance (FPS and memory usage)
 * Useful for testing if animations meet the 60fps target
 */
export const usePerformanceMonitor = (enabled: boolean = false) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const measurePerformance = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      
      frameCountRef.current++;

      // Update metrics every second
      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        const frameTime = delta / frameCountRef.current;
        
        // Get memory usage if available (Chrome only)
        const memoryUsage = (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
          : undefined;

        setMetrics({
          fps,
          frameTime: Math.round(frameTime * 100) / 100,
          memoryUsage,
        });

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(measurePerformance);
    };

    rafIdRef.current = requestAnimationFrame(measurePerformance);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enabled]);

  return metrics;
};
