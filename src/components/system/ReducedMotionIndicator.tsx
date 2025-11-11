import React from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * ReducedMotionIndicator Component
 * 
 * Provides visual feedback when reduced motion mode is active.
 * This is helpful for accessibility and debugging.
 * 
 * Requirements:
 * - 9.2: Detect prefers-reduced-motion
 * - 9.2: Provide feedback when reduced motion is active
 */

export interface ReducedMotionIndicatorProps {
  /** Whether to show the indicator */
  show?: boolean;
  /** Position of the indicator */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const ReducedMotionIndicator: React.FC<ReducedMotionIndicatorProps> = ({
  show = true,
  position = 'bottom-right'
}) => {
  const { prefersReducedMotion, isReducedMotionActive } = useReducedMotion();

  // Only show if reduced motion is active and show prop is true
  if (!show || !isReducedMotionActive) {
    return null;
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: '1rem', left: '1rem' },
    'top-right': { top: '1rem', right: '1rem' },
    'bottom-left': { bottom: '1rem', left: '1rem' },
    'bottom-right': { bottom: '1rem', right: '1rem' }
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        padding: '0.5rem 1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        fontFamily: 'system-ui, sans-serif',
        zIndex: 9999,
        pointerEvents: 'none',
        userSelect: 'none'
      }}
      role="status"
      aria-live="polite"
    >
      {prefersReducedMotion ? '🔇 Reduced Motion (System)' : '🔇 Reduced Motion'}
    </div>
  );
};

export default ReducedMotionIndicator;
