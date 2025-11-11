import React, { useEffect, useCallback } from 'react';
import { useIdleStore } from '@/store/idleStore';
import { useKioskStore } from '@/store/kioskStore';

/**
 * IdleManager Component
 * 
 * Manages idle timers, attract mode, and auto-reset behavior.
 * Tracks user activity and triggers appropriate actions based on inactivity.
 * 
 * Requirements:
 * - 4.1: Start attract loop after 45 seconds of inactivity
 * - 4.2: Auto-reset to home after 120 seconds of inactivity
 * - 4.3: Reset session timer on any navigation activity
 * - 4.4: Return to BoardScene after 2 minutes of inactivity
 */

export interface IdleManagerProps {
  /** Whether idle management is enabled */
  enabled?: boolean;
  /** Idle timeout in milliseconds (default: 45000ms = 45s) */
  idleTimeout?: number;
  /** Attract/reset timeout in milliseconds (default: 120000ms = 120s) */
  attractTimeout?: number;
  /** Callback when idle state is entered */
  onIdle?: () => void;
  /** Callback when attract mode is entered */
  onAttract?: () => void;
  /** Callback when auto-reset is triggered */
  onReset?: () => void;
  /** Children to render (optional) */
  children?: React.ReactNode;
}

export const IdleManager: React.FC<IdleManagerProps> = ({
  enabled = true,
  idleTimeout = 45000, // 45 seconds
  attractTimeout = 120000, // 120 seconds (2 minutes)
  onIdle,
  onAttract,
  onReset,
  children
}) => {
  // Idle store state
  const {
    isIdle,
    isInAttractMode,
    recordActivity,
    startIdleTimer,
    stopIdleTimer,
    setIdleTimeout,
    setAttractTimeout,
    resetAll
  } = useIdleStore();

  // Kiosk store state
  const currentRoute = useKioskStore((state) => state.currentRoute);
  const goHome = useKioskStore((state) => state.goHome);
  const isTransitioning = useKioskStore((state) => state.isTransitioning);

  /**
   * Handle user activity
   * Resets timers and exits attract mode
   */
  const handleActivity = useCallback(() => {
    if (!enabled) return;
    
    // Don't record activity during transitions to avoid interrupting animations
    if (isTransitioning) return;
    
    recordActivity();
  }, [enabled, isTransitioning, recordActivity]);

  /**
   * Handle idle state entry
   * Triggers attract mode
   */
  const handleIdleEntry = useCallback(() => {
    console.log('[IdleManager] Entering idle state (45s)');
    
    if (onIdle) {
      onIdle();
    }
    
    // Attract mode is automatically triggered by the store
    if (onAttract) {
      onAttract();
    }
  }, [onIdle, onAttract]);

  /**
   * Handle auto-reset
   * Clears all modal states and returns to home (BoardScene)
   * 
   * Requirements:
   * - 4.2: Auto-reset to home after 120 seconds of inactivity
   * - 4.4: Return to BoardScene after 2 minutes of inactivity
   */
  const handleAutoReset = useCallback(() => {
    console.log('[IdleManager] Auto-reset triggered (120s) - returning to home');
    
    // Navigate to home if not already there
    if (currentRoute !== 'home') {
      console.log('[IdleManager] Navigating from', currentRoute, 'to home');
      goHome();
    }
    
    // Clear any modal states (handled by parent components via callback)
    if (onReset) {
      onReset();
    }
    
    // Reset idle state and restart timers
    resetAll();
    
    console.log('[IdleManager] Auto-reset complete - BoardScene restored');
  }, [currentRoute, goHome, onReset, resetAll]);

  // Initialize idle manager
  useEffect(() => {
    if (!enabled) {
      stopIdleTimer();
      return;
    }

    // Set timeouts from props
    setIdleTimeout(idleTimeout);
    setAttractTimeout(attractTimeout);

    // Start idle timer
    startIdleTimer();

    console.log('[IdleManager] Initialized', {
      idleTimeout: `${idleTimeout}ms`,
      attractTimeout: `${attractTimeout}ms`
    });

    return () => {
      stopIdleTimer();
    };
  }, [enabled, idleTimeout, attractTimeout, setIdleTimeout, setAttractTimeout, startIdleTimer, stopIdleTimer]);

  // Listen for activity events
  useEffect(() => {
    if (!enabled) return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'touchmove',
      'click',
      'wheel'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, handleActivity]);

  // Watch for idle state changes
  useEffect(() => {
    if (isIdle && !isInAttractMode) {
      handleIdleEntry();
    }
  }, [isIdle, isInAttractMode, handleIdleEntry]);

  // Watch for attract mode timeout (auto-reset)
  // This is handled by the store's timer, but we need to trigger the actual reset
  useEffect(() => {
    if (!enabled) return;

    let resetTimeoutId: NodeJS.Timeout;

    // When attract mode is entered, set a timer for the remaining time until reset
    if (isInAttractMode) {
      const remainingTime = attractTimeout - idleTimeout; // 120s - 45s = 75s
      console.log(`[IdleManager] Attract mode active, auto-reset in ${remainingTime}ms`);
      
      resetTimeoutId = setTimeout(() => {
        handleAutoReset();
      }, remainingTime);
    }

    return () => {
      if (resetTimeoutId) {
        clearTimeout(resetTimeoutId);
      }
    };
  }, [enabled, isInAttractMode, attractTimeout, idleTimeout, handleAutoReset]);

  // Reset timers when route changes (requirement 4.3)
  useEffect(() => {
    if (enabled && !isTransitioning) {
      recordActivity();
      console.log('[IdleManager] Route changed, resetting timers');
    }
  }, [currentRoute, enabled, isTransitioning, recordActivity]);

  // Render children if provided, otherwise render nothing
  return <>{children}</>;
};

export default IdleManager;
