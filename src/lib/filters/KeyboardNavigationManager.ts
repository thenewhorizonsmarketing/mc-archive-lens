/**
 * Keyboard Navigation Manager for Advanced Filters
 * 
 * Provides comprehensive keyboard navigation support including:
 * - Global keyboard shortcuts (/, Ctrl+K, Ctrl+S, Ctrl+H)
 * - Tab order management
 * - Focus indicators
 * - Esc to close modals
 * 
 * Implements Requirements 10 and 12 from the design document.
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
}

export interface FocusableElement {
  element: HTMLElement;
  priority: number;
  group?: string;
}

export class KeyboardNavigationManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private focusableElements: FocusableElement[] = [];
  private currentFocusIndex: number = -1;
  private isEnabled: boolean = true;
  private modalStack: HTMLElement[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize keyboard navigation
   */
  private initialize(): void {
    // Listen for keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // Track focus changes
    document.addEventListener('focusin', this.handleFocusIn.bind(this));
    
    // Handle modal stack
    document.addEventListener('keydown', this.handleEscapeKey.bind(this), true);
  }

  /**
   * Register a keyboard shortcut
   */
  registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregisterShortcut(key: string, ctrl?: boolean, shift?: boolean, alt?: boolean, meta?: boolean): void {
    const shortcutKey = this.getShortcutKey({ key, ctrl, shift, alt, meta } as KeyboardShortcut);
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Register default filter shortcuts
   */
  registerDefaultShortcuts(handlers: {
    onFocusSearch?: () => void;
    onOpenFilters?: () => void;
    onSaveSearch?: () => void;
    onViewHistory?: () => void;
  }): void {
    // / - Focus search input
    if (handlers.onFocusSearch) {
      this.registerShortcut({
        key: '/',
        description: 'Focus search input',
        handler: handlers.onFocusSearch,
      });
    }

    // Ctrl+K - Open filter panel
    if (handlers.onOpenFilters) {
      this.registerShortcut({
        key: 'k',
        ctrl: true,
        description: 'Open filter panel',
        handler: handlers.onOpenFilters,
      });
    }

    // Ctrl+S - Save current search
    if (handlers.onSaveSearch) {
      this.registerShortcut({
        key: 's',
        ctrl: true,
        description: 'Save current search',
        handler: handlers.onSaveSearch,
      });
    }

    // Ctrl+H - View search history
    if (handlers.onViewHistory) {
      this.registerShortcut({
        key: 'h',
        ctrl: true,
        description: 'View search history',
        handler: handlers.onViewHistory,
      });
    }
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Don't handle shortcuts when typing in input fields (except for specific shortcuts)
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.isContentEditable;

    // Check for registered shortcuts
    const shortcutKey = this.getShortcutKey({
      key: event.key.toLowerCase(),
      ctrl: event.ctrlKey || event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    } as KeyboardShortcut);

    const shortcut = this.shortcuts.get(shortcutKey);
    
    if (shortcut) {
      // Allow / to work even in input fields (to focus search)
      if (event.key === '/' && !isInputField) {
        event.preventDefault();
        shortcut.handler();
        return;
      }

      // Allow Ctrl+K, Ctrl+S, Ctrl+H to work everywhere
      if ((event.ctrlKey || event.metaKey) && ['k', 's', 'h'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        shortcut.handler();
        return;
      }

      // Other shortcuts only work outside input fields
      if (!isInputField) {
        event.preventDefault();
        shortcut.handler();
      }
    }

    // Handle Tab navigation
    if (event.key === 'Tab') {
      this.handleTabNavigation(event);
    }
  }

  /**
   * Handle Escape key to close modals
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.modalStack.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      
      // Close the topmost modal
      const topModal = this.modalStack[this.modalStack.length - 1];
      const closeButton = topModal.querySelector('[data-modal-close]') as HTMLElement;
      
      if (closeButton) {
        closeButton.click();
      } else {
        // Try to find any close button
        const anyCloseButton = topModal.querySelector('button[aria-label*="close" i]') as HTMLElement;
        if (anyCloseButton) {
          anyCloseButton.click();
        }
      }
    }
  }

  /**
   * Handle Tab navigation
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    if (this.focusableElements.length === 0) {
      this.updateFocusableElements();
    }

    if (this.focusableElements.length === 0) return;

    // Determine direction
    const direction = event.shiftKey ? -1 : 1;
    
    // Find current focus index
    const activeElement = document.activeElement as HTMLElement;
    const currentIndex = this.focusableElements.findIndex(
      item => item.element === activeElement
    );

    if (currentIndex !== -1) {
      // Calculate next index
      let nextIndex = currentIndex + direction;
      
      // Wrap around
      if (nextIndex < 0) {
        nextIndex = this.focusableElements.length - 1;
      } else if (nextIndex >= this.focusableElements.length) {
        nextIndex = 0;
      }

      // Focus next element
      const nextElement = this.focusableElements[nextIndex];
      if (nextElement && nextElement.element) {
        event.preventDefault();
        nextElement.element.focus();
        this.currentFocusIndex = nextIndex;
      }
    }
  }

  /**
   * Handle focus in events
   */
  private handleFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    
    // Update current focus index
    const index = this.focusableElements.findIndex(
      item => item.element === target
    );
    
    if (index !== -1) {
      this.currentFocusIndex = index;
    }
  }

  /**
   * Update list of focusable elements
   */
  updateFocusableElements(container?: HTMLElement): void {
    const root = container || document.body;
    
    // Find all focusable elements
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    const elements = Array.from(root.querySelectorAll(selector)) as HTMLElement[];
    
    // Filter out hidden elements
    const visibleElements = elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             el.offsetParent !== null;
    });

    // Sort by tab index and DOM order
    this.focusableElements = visibleElements.map((element, index) => ({
      element,
      priority: parseInt(element.getAttribute('tabindex') || '0') || index,
      group: element.getAttribute('data-focus-group') || undefined,
    })).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Register a modal
   */
  registerModal(modal: HTMLElement): void {
    this.modalStack.push(modal);
    
    // Trap focus within modal
    this.updateFocusableElements(modal);
    
    // Focus first element in modal
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].element.focus();
    }
  }

  /**
   * Unregister a modal
   */
  unregisterModal(modal: HTMLElement): void {
    const index = this.modalStack.indexOf(modal);
    if (index !== -1) {
      this.modalStack.splice(index, 1);
    }
    
    // Restore focus to previous modal or document
    if (this.modalStack.length > 0) {
      this.updateFocusableElements(this.modalStack[this.modalStack.length - 1]);
    } else {
      this.updateFocusableElements();
    }
  }

  /**
   * Focus first element in a group
   */
  focusGroup(groupName: string): void {
    const groupElement = this.focusableElements.find(
      item => item.group === groupName
    );
    
    if (groupElement) {
      groupElement.element.focus();
    }
  }

  /**
   * Focus next element in current group
   */
  focusNextInGroup(): void {
    if (this.currentFocusIndex === -1) return;
    
    const currentElement = this.focusableElements[this.currentFocusIndex];
    if (!currentElement || !currentElement.group) return;
    
    // Find next element in same group
    for (let i = this.currentFocusIndex + 1; i < this.focusableElements.length; i++) {
      const element = this.focusableElements[i];
      if (element.group === currentElement.group) {
        element.element.focus();
        return;
      }
    }
    
    // Wrap to first element in group
    for (let i = 0; i < this.currentFocusIndex; i++) {
      const element = this.focusableElements[i];
      if (element.group === currentElement.group) {
        element.element.focus();
        return;
      }
    }
  }

  /**
   * Focus previous element in current group
   */
  focusPreviousInGroup(): void {
    if (this.currentFocusIndex === -1) return;
    
    const currentElement = this.focusableElements[this.currentFocusIndex];
    if (!currentElement || !currentElement.group) return;
    
    // Find previous element in same group
    for (let i = this.currentFocusIndex - 1; i >= 0; i--) {
      const element = this.focusableElements[i];
      if (element.group === currentElement.group) {
        element.element.focus();
        return;
      }
    }
    
    // Wrap to last element in group
    for (let i = this.focusableElements.length - 1; i > this.currentFocusIndex; i--) {
      const element = this.focusableElements[i];
      if (element.group === currentElement.group) {
        element.element.focus();
        return;
      }
    }
  }

  /**
   * Enable keyboard navigation
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable keyboard navigation
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Generate shortcut key string
   */
  private getShortcutKey(shortcut: Partial<KeyboardShortcut>): string {
    const parts: string[] = [];
    
    if (shortcut.ctrl || shortcut.meta) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    parts.push(shortcut.key?.toLowerCase() || '');
    
    return parts.join('+');
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];
    
    // Use platform-specific modifier key
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    if (shortcut.ctrl || shortcut.meta) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shift) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.alt) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    
    // Format key
    const key = shortcut.key.toUpperCase();
    parts.push(key);
    
    return parts.join(isMac ? '' : '+');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('focusin', this.handleFocusIn.bind(this));
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this), true);
    
    this.shortcuts.clear();
    this.focusableElements = [];
    this.modalStack = [];
  }
}

// Singleton instance
let keyboardNavigationManager: KeyboardNavigationManager | null = null;

/**
 * Get or create keyboard navigation manager instance
 */
export function getKeyboardNavigationManager(): KeyboardNavigationManager {
  if (!keyboardNavigationManager) {
    keyboardNavigationManager = new KeyboardNavigationManager();
  }
  return keyboardNavigationManager;
}

/**
 * Destroy keyboard navigation manager
 */
export function destroyKeyboardNavigationManager(): void {
  if (keyboardNavigationManager) {
    keyboardNavigationManager.destroy();
    keyboardNavigationManager = null;
  }
}
