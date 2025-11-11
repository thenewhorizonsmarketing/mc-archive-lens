/**
 * Optimized Keyboard Wrapper
 * 
 * Provides lazy rendering and debounced search trigger for optimal performance.
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the keyboard component (Requirement 10.3)
const OnScreenKeyboard = lazy(() => import('./OnScreenKeyboard'));

export interface OptimizedKeyboardProps {
  /** Whether the keyboard is visible */
  visible: boolean;
  
  /** Callback when a key is pressed */
  onKeyPress: (key: string) => void;
  
  /** Callback when search should be triggered (debounced) */
  onSearch?: (value: string) => void;
  
  /** Current input value */
  value?: string;
  
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceDelay?: number;
  
  /** Enable audio feedback */
  enableAudioFeedback?: boolean;
  
  /** Custom className */
  className?: string;
}

/**
 * Performance-optimized keyboard wrapper with lazy rendering and debouncing
 */
export const OptimizedKeyboard: React.FC<OptimizedKeyboardProps> = ({
  visible,
  onKeyPress,
  onSearch,
  value = '',
  debounceDelay = 300,
  enableAudioFeedback = false,
  className = '',
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [renderTime, setRenderTime] = useState<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const renderStartRef = useRef<number>(0);

  // Lazy rendering: only render keyboard when it becomes visible
  useEffect(() => {
    if (visible && !shouldRender) {
      renderStartRef.current = performance.now();
      setShouldRender(true);
    }
    // Keep rendered once visible to avoid re-mounting
  }, [visible, shouldRender]);

  // Measure render time (Requirement 10.1: < 200ms)
  useEffect(() => {
    if (shouldRender && renderStartRef.current > 0) {
      const elapsed = performance.now() - renderStartRef.current;
      setRenderTime(elapsed);
      
      if (elapsed > 200) {
        console.warn(`[OptimizedKeyboard] Render time exceeded target: ${elapsed.toFixed(2)}ms > 200ms`);
      } else {
        console.log(`[OptimizedKeyboard] Render time: ${elapsed.toFixed(2)}ms`);
      }
      
      renderStartRef.current = 0;
    }
  }, [shouldRender]);

  // Debounced search trigger (Requirement 10.4)
  const triggerDebouncedSearch = useCallback((searchValue: string) => {
    if (!onSearch) return;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onSearch(searchValue);
    }, debounceDelay);
  }, [onSearch, debounceDelay]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Optimized key press handler with debouncing (Requirement 10.2: < 50ms)
  const handleKeyPress = useCallback((key: string) => {
    const startTime = performance.now();
    
    // Pass through to parent immediately
    onKeyPress(key);
    
    // Trigger debounced search if Enter key
    if (key === 'Enter' && onSearch) {
      // Clear debounce and search immediately on Enter
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearch(value);
    } else if (onSearch) {
      // Debounce search for other keys
      triggerDebouncedSearch(value);
    }
    
    const elapsed = performance.now() - startTime;
    if (elapsed > 50) {
      console.warn(`[OptimizedKeyboard] Key response time exceeded target: ${elapsed.toFixed(2)}ms > 50ms`);
    }
  }, [onKeyPress, onSearch, value, triggerDebouncedSearch]);

  // Don't render anything if not visible and never rendered
  if (!visible && !shouldRender) {
    return null;
  }

  // Loading skeleton while lazy loading
  const LoadingSkeleton = () => (
    <div className="space-y-2 p-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  return (
    <div 
      className={`keyboard-wrapper ${visible ? 'visible' : 'hidden'} ${className}`}
      style={{
        transition: 'opacity 200ms ease-in-out',
        opacity: visible ? 1 : 0,
      }}
      role="region"
      aria-label="Virtual keyboard"
      aria-hidden={!visible}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <OnScreenKeyboard
          onKeyPress={handleKeyPress}
          enableAudioFeedback={enableAudioFeedback}
          className={className}
        />
      </Suspense>
      
      {/* Performance metrics (development only) */}
      {process.env.NODE_ENV === 'development' && renderTime > 0 && (
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Render time: {renderTime.toFixed(2)}ms
          {renderTime > 200 && ' ⚠️ Exceeds target'}
        </div>
      )}
    </div>
  );
};

export default OptimizedKeyboard;
