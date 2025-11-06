import { useCallback, useEffect, useRef, useState } from 'react';

interface UseIdleTimerOptions {
  timeout: number; // in milliseconds
  onIdle: () => void;
  enabled?: boolean;
}

export function useIdleTimer({ timeout, onIdle, enabled = true }: UseIdleTimerOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (enabled) {
      timerRef.current = setTimeout(() => {
        setIsIdle(true);
        onIdle();
      }, timeout);
    }
  }, [enabled, onIdle, timeout]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer(); // Initialize timer

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, enabled, resetTimer]);

  return { isIdle, resetTimer };
}
