import React, { useEffect, useRef, useState } from 'react';
import { useKioskStore } from '@/store/kioskStore';

/**
 * RouteTransition Component
 * 
 * Implements cross-fade transitions between routes/scenes.
 * Coordinates with camera animation to provide smooth, elegant transitions.
 * 
 * Requirements:
 * - 5.4: Swap to new route content after camera dolly completes
 * - 5.5: Use cross-fade without white flashes
 */

export interface RouteTransitionProps {
  /** Whether a transition is currently in progress */
  isTransitioning?: boolean;
  /** Duration of the cross-fade in milliseconds */
  duration?: number;
  /** Callback when transition completes */
  onComplete?: () => void;
  /** Children to render (current route content) */
  children: React.ReactNode;
}

export const RouteTransition: React.FC<RouteTransitionProps> = ({
  isTransitioning = false,
  duration = 300,
  onComplete,
  children
}) => {
  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  
  const transitionProgress = useKioskStore((state) => state.transitionProgress);

  useEffect(() => {
    if (isTransitioning) {
      // Start fade-out when camera transition begins
      startTimeRef.current = performance.now();
      setIsVisible(true);
      
      const animate = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Fade out during first half of camera transition
        // This ensures we fade to black before swapping content
        const fadeProgress = Math.min(transitionProgress * 2, 1);
        const newOpacity = 1 - fadeProgress;
        
        setOpacity(newOpacity);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Fade complete
          if (onComplete) {
            onComplete();
          }
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Fade back in when transition completes
      startTimeRef.current = performance.now();
      
      const fadeIn = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth ease-in
        const eased = 1 - Math.pow(1 - progress, 3);
        setOpacity(eased);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(fadeIn);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(fadeIn);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTransitioning, duration, onComplete, transitionProgress]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        opacity,
        transition: 'none', // Use manual animation for precise control
        visibility: isVisible ? 'visible' : 'hidden'
      }}
    >
      {children}
      
      {/* Black overlay for smooth cross-fade without white flashes */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000000',
          opacity: isTransitioning ? (1 - opacity) : 0,
          pointerEvents: 'none',
          transition: 'none'
        }}
      />
    </div>
  );
};

export default RouteTransition;
