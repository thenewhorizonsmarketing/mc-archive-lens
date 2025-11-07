// Accessibility Manager for WCAG 2.1 AA Compliance
export interface AccessibilityOptions {
  highContrast?: boolean;
  largeText?: boolean;
  reducedMotion?: boolean;
  screenReaderMode?: boolean;
  keyboardNavigation?: boolean;
  audioFeedback?: boolean;
}

export interface AccessibilityState {
  options: AccessibilityOptions;
  isScreenReaderActive: boolean;
  currentFocus: string | null;
  announcements: string[];
}

export class AccessibilityManager {
  private state: AccessibilityState;
  private announcer: HTMLElement | null = null;
  private focusHistory: string[] = [];
  private keyboardListeners: Map<string, (event: KeyboardEvent) => void> = new Map();

  constructor(options: AccessibilityOptions = {}) {
    this.state = {
      options: {
        highContrast: false,
        largeText: false,
        reducedMotion: false,
        screenReaderMode: false,
        keyboardNavigation: true,
        audioFeedback: false,
        ...options
      },
      isScreenReaderActive: this.detectScreenReader(),
      currentFocus: null,
      announcements: []
    };

    this.initialize();
  }

  /**
   * Initialize accessibility features
   */
  private initialize(): void {
    this.createScreenReaderAnnouncer();
    this.setupKeyboardNavigation();
    this.applyAccessibilityStyles();
    this.detectUserPreferences();
  }

  /**
   * Create screen reader announcer element
   */
  private createScreenReaderAnnouncer(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    if (!this.state.options.keyboardNavigation) return;

    // Global keyboard shortcuts
    const shortcuts = {
      'Alt+S': () => this.focusSearchInput(),
      'Alt+F': () => this.focusFilters(),
      'Alt+R': () => this.focusResults(),
      'Escape': () => this.clearFocus(),
      'F1': () => this.showKeyboardHelp(),
      'Alt+H': () => this.toggleHighContrast(),
      'Alt+T': () => this.toggleLargeText(),
      'Alt+A': () => this.toggleAudioFeedback()
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = this.getKeyCombo(event);
      const handler = shortcuts[key as keyof typeof shortcuts];
      
      if (handler) {
        event.preventDefault();
        handler();
      }

      // Track focus for navigation
      if (event.key === 'Tab') {
        this.trackFocus(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    this.keyboardListeners.set('global', handleKeyDown);
  }

  /**
   * Get keyboard combination string
   */
  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    parts.push(event.key);
    return parts.join('+');
  }

  /**
   * Track focus for better navigation
   */
  private trackFocus(event: KeyboardEvent): void {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.id) {
      this.state.currentFocus = activeElement.id;
      this.focusHistory.unshift(activeElement.id);
      
      // Keep only last 10 focus items
      if (this.focusHistory.length > 10) {
        this.focusHistory.pop();
      }

      // Announce focus change for screen readers
      if (this.state.isScreenReaderActive) {
        const label = activeElement.getAttribute('aria-label') || 
                     activeElement.getAttribute('title') || 
                     (activeElement as HTMLElement).innerText?.slice(0, 50);
        if (label) {
          this.announce(`Focused on ${label}`);
        }
      }
    }
  }

  /**
   * Apply accessibility styles based on current options
   */
  private applyAccessibilityStyles(): void {
    const root = document.documentElement;
    
    // High contrast mode
    if (this.state.options.highContrast) {
      root.classList.add('high-contrast');
      root.style.setProperty('--text-color', '#000000');
      root.style.setProperty('--bg-color', '#ffffff');
      root.style.setProperty('--border-color', '#000000');
      root.style.setProperty('--focus-color', '#ff0000');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text mode
    if (this.state.options.largeText) {
      root.classList.add('large-text');
      root.style.setProperty('--base-font-size', '1.25rem');
      root.style.setProperty('--heading-scale', '1.5');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (this.state.options.reducedMotion) {
      root.classList.add('reduced-motion');
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.classList.remove('reduced-motion');
    }
  }

  /**
   * Detect user preferences from system settings
   */
  private detectUserPreferences(): void {
    // Detect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.updateOptions({ reducedMotion: true });
    }

    // Detect prefers-contrast
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.updateOptions({ highContrast: true });
    }

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.updateOptions({ reducedMotion: e.matches });
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.updateOptions({ highContrast: e.matches });
    });
  }

  /**
   * Detect if screen reader is active
   */
  private detectScreenReader(): boolean {
    // Check for common screen reader indicators
    return !!(
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      window.speechSynthesis ||
      document.querySelector('[aria-live]')
    );
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer) return;

    this.state.announcements.push(message);
    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);

    // Audio feedback if enabled
    if (this.state.options.audioFeedback && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.2;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  }

  /**
   * Focus search input
   */
  private focusSearchInput(): void {
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLElement;
    if (searchInput) {
      searchInput.focus();
      this.announce('Search input focused');
    }
  }

  /**
   * Focus filters section
   */
  private focusFilters(): void {
    const filters = document.querySelector('[role="region"][aria-label*="filter" i]') as HTMLElement;
    if (filters) {
      const firstControl = filters.querySelector('button, select, input') as HTMLElement;
      if (firstControl) {
        firstControl.focus();
        this.announce('Filters section focused');
      }
    }
  }

  /**
   * Focus results section
   */
  private focusResults(): void {
    const results = document.querySelector('[role="region"][aria-label*="result" i]') as HTMLElement;
    if (results) {
      const firstResult = results.querySelector('[role="option"], button, a') as HTMLElement;
      if (firstResult) {
        firstResult.focus();
        this.announce('Results section focused');
      }
    }
  }

  /**
   * Clear current focus
   */
  private clearFocus(): void {
    if (document.activeElement && document.activeElement !== document.body) {
      (document.activeElement as HTMLElement).blur();
      this.announce('Focus cleared');
    }
  }

  /**
   * Show keyboard help
   */
  private showKeyboardHelp(): void {
    const helpText = `
      Keyboard shortcuts:
      Alt+S: Focus search input
      Alt+F: Focus filters
      Alt+R: Focus results
      Alt+H: Toggle high contrast
      Alt+T: Toggle large text
      Alt+A: Toggle audio feedback
      Escape: Clear focus
      Tab: Navigate between elements
      Enter/Space: Activate buttons
    `;
    this.announce(helpText, 'assertive');
  }

  /**
   * Toggle high contrast mode
   */
  private toggleHighContrast(): void {
    const newValue = !this.state.options.highContrast;
    this.updateOptions({ highContrast: newValue });
    this.announce(`High contrast ${newValue ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle large text mode
   */
  private toggleLargeText(): void {
    const newValue = !this.state.options.largeText;
    this.updateOptions({ largeText: newValue });
    this.announce(`Large text ${newValue ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle audio feedback
   */
  private toggleAudioFeedback(): void {
    const newValue = !this.state.options.audioFeedback;
    this.updateOptions({ audioFeedback: newValue });
    this.announce(`Audio feedback ${newValue ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update accessibility options
   */
  updateOptions(newOptions: Partial<AccessibilityOptions>): void {
    this.state.options = { ...this.state.options, ...newOptions };
    this.applyAccessibilityStyles();
    
    // Save to localStorage
    localStorage.setItem('accessibility-options', JSON.stringify(this.state.options));
  }

  /**
   * Load options from localStorage
   */
  loadSavedOptions(): void {
    try {
      const saved = localStorage.getItem('accessibility-options');
      if (saved) {
        const options = JSON.parse(saved);
        this.updateOptions(options);
      }
    } catch (error) {
      console.warn('Failed to load accessibility options:', error);
    }
  }

  /**
   * Get current accessibility state
   */
  getState(): AccessibilityState {
    return { ...this.state };
  }

  /**
   * Create accessible button with proper ARIA attributes
   */
  createAccessibleButton(text: string, onClick: () => void, options: {
    ariaLabel?: string;
    ariaDescribedBy?: string;
    disabled?: boolean;
    className?: string;
  } = {}): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = `accessible-button ${options.className || ''}`;
    button.style.minHeight = '44px';
    button.style.minWidth = '44px';
    
    if (options.ariaLabel) {
      button.setAttribute('aria-label', options.ariaLabel);
    }
    
    if (options.ariaDescribedBy) {
      button.setAttribute('aria-describedby', options.ariaDescribedBy);
    }
    
    if (options.disabled) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }

    button.addEventListener('click', onClick);
    
    // Add focus and hover feedback
    button.addEventListener('focus', () => {
      if (this.state.options.audioFeedback) {
        this.announce(`Button: ${text}`);
      }
    });

    return button;
  }

  /**
   * Cleanup accessibility manager
   */
  destroy(): void {
    if (this.announcer) {
      document.body.removeChild(this.announcer);
    }

    // Remove keyboard listeners
    for (const [key, listener] of this.keyboardListeners) {
      document.removeEventListener('keydown', listener);
    }
    
    this.keyboardListeners.clear();
  }
}

// Global accessibility manager instance
let globalAccessibilityManager: AccessibilityManager | null = null;

export function getAccessibilityManager(): AccessibilityManager {
  if (!globalAccessibilityManager) {
    globalAccessibilityManager = new AccessibilityManager();
    globalAccessibilityManager.loadSavedOptions();
  }
  return globalAccessibilityManager;
}

export default AccessibilityManager;