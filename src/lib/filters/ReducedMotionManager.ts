/**
 * Reduced Motion Manager for Advanced Filters
 * 
 * Detects and respects user's prefers-reduced-motion preference.
 * Disables animations while maintaining full functionality.
 * 
 * Implements Requirement 10 from the design document.
 */

export type MotionPreference = 'no-preference' | 'reduce';

export interface MotionSettings {
  prefersReducedMotion: boolean;
  transitionDuration: number;
  animationDuration: number;
  enableAnimations: boolean;
}

export class ReducedMotionManager {
  private mediaQuery: MediaQueryList | null = null;
  private listeners: Set<(settings: MotionSettings) => void> = new Set();
  private settings: MotionSettings;

  constructor() {
    this.settings = this.detectMotionPreference();
    this.initialize();
  }

  /**
   * Initialize reduced motion detection
   */
  private initialize(): void {
    // Check if browser supports prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      // Listen for changes
      this.mediaQuery.addEventListener('change', this.handleMediaQueryChange.bind(this));
      
      // Apply initial settings
      this.applySettings();
    }
  }

  /**
   * Detect motion preference
   */
  private detectMotionPreference(): MotionSettings {
    const prefersReducedMotion = 
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      prefersReducedMotion,
      transitionDuration: prefersReducedMotion ? 0 : 200,
      animationDuration: prefersReducedMotion ? 0 : 300,
      enableAnimations: !prefersReducedMotion,
    };
  }

  /**
   * Handle media query change
   */
  private handleMediaQueryChange(event: MediaQueryListEvent): void {
    this.settings = {
      prefersReducedMotion: event.matches,
      transitionDuration: event.matches ? 0 : 200,
      animationDuration: event.matches ? 0 : 300,
      enableAnimations: !event.matches,
    };

    this.applySettings();
    this.notifyListeners();
  }

  /**
   * Apply settings to document
   */
  private applySettings(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (this.settings.prefersReducedMotion) {
      // Add reduced motion class
      root.classList.add('reduce-motion');
      
      // Set CSS custom properties
      root.style.setProperty('--filter-transition-fast', '0.01ms');
      root.style.setProperty('--filter-transition-base', '0.01ms');
      root.style.setProperty('--filter-transition-slow', '0.01ms');
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      // Remove reduced motion class
      root.classList.remove('reduce-motion');
      
      // Reset CSS custom properties
      root.style.setProperty('--filter-transition-fast', '0.15s');
      root.style.setProperty('--filter-transition-base', '0.2s');
      root.style.setProperty('--filter-transition-slow', '0.3s');
      root.style.setProperty('--animation-duration', '0.3s');
    }
  }

  /**
   * Notify listeners of settings change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.settings);
    });
  }

  /**
   * Get current settings
   */
  getSettings(): MotionSettings {
    return { ...this.settings };
  }

  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion(): boolean {
    return this.settings.prefersReducedMotion;
  }

  /**
   * Get transition duration
   */
  getTransitionDuration(): number {
    return this.settings.transitionDuration;
  }

  /**
   * Get animation duration
   */
  getAnimationDuration(): number {
    return this.settings.animationDuration;
  }

  /**
   * Check if animations are enabled
   */
  areAnimationsEnabled(): boolean {
    return this.settings.enableAnimations;
  }

  /**
   * Subscribe to settings changes
   */
  subscribe(listener: (settings: MotionSettings) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get safe animation config
   * Returns animation config that respects reduced motion preference
   */
  getSafeAnimationConfig(config: {
    duration?: number;
    delay?: number;
    easing?: string;
  }): {
    duration: number;
    delay: number;
    easing: string;
  } {
    if (this.settings.prefersReducedMotion) {
      return {
        duration: 0,
        delay: 0,
        easing: 'linear',
      };
    }

    return {
      duration: config.duration || this.settings.animationDuration,
      delay: config.delay || 0,
      easing: config.easing || 'ease',
    };
  }

  /**
   * Execute with animation if enabled, otherwise execute immediately
   */
  withAnimation<T>(
    animatedFn: () => Promise<T>,
    immediateFn: () => T
  ): Promise<T> {
    if (this.settings.enableAnimations) {
      return animatedFn();
    } else {
      return Promise.resolve(immediateFn());
    }
  }

  /**
   * Conditionally apply animation class
   */
  getAnimationClass(animationClass: string): string {
    return this.settings.enableAnimations ? animationClass : '';
  }

  /**
   * Get conditional style
   */
  getConditionalStyle(
    animatedStyle: React.CSSProperties,
    staticStyle: React.CSSProperties
  ): React.CSSProperties {
    return this.settings.enableAnimations ? animatedStyle : staticStyle;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleMediaQueryChange.bind(this));
    }
    
    this.listeners.clear();
    
    // Remove class from document
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('reduce-motion');
    }
  }
}

// Singleton instance
let reducedMotionManager: ReducedMotionManager | null = null;

/**
 * Get or create reduced motion manager instance
 */
export function getReducedMotionManager(): ReducedMotionManager {
  if (!reducedMotionManager) {
    reducedMotionManager = new ReducedMotionManager();
  }
  return reducedMotionManager;
}

/**
 * Destroy reduced motion manager
 */
export function destroyReducedMotionManager(): void {
  if (reducedMotionManager) {
    reducedMotionManager.destroy();
    reducedMotionManager = null;
  }
}
