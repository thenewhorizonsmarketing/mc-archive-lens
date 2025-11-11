/**
 * ARIA Manager for Advanced Filters
 * 
 * Manages ARIA attributes, live regions, and screen reader announcements
 * for the filter system to ensure full accessibility compliance.
 * 
 * Implements Requirement 10 from the design document.
 */

export type AriaLiveLevel = 'off' | 'polite' | 'assertive';
export type AriaRole = 'alert' | 'status' | 'log' | 'marquee' | 'timer' | 'region' | 'dialog' | 'alertdialog';

export interface AriaLiveRegion {
  id: string;
  element: HTMLElement;
  level: AriaLiveLevel;
  role?: AriaRole;
}

export class AriaManager {
  private liveRegions: Map<string, AriaLiveRegion> = new Map();
  private announceQueue: string[] = [];
  private isAnnouncing: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize ARIA manager
   */
  private initialize(): void {
    // Create default live regions
    this.createLiveRegion('filter-status', 'polite', 'status');
    this.createLiveRegion('filter-alert', 'assertive', 'alert');
  }

  /**
   * Create a live region
   */
  createLiveRegion(
    id: string,
    level: AriaLiveLevel = 'polite',
    role?: AriaRole
  ): HTMLElement {
    // Check if region already exists
    if (this.liveRegions.has(id)) {
      return this.liveRegions.get(id)!.element;
    }

    // Create live region element
    const element = document.createElement('div');
    element.id = `aria-live-${id}`;
    element.setAttribute('aria-live', level);
    element.setAttribute('aria-atomic', 'true');
    
    if (role) {
      element.setAttribute('role', role);
    }

    // Hide visually but keep accessible to screen readers
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';

    // Add to document
    document.body.appendChild(element);

    // Store reference
    this.liveRegions.set(id, { id, element, level, role });

    return element;
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, level: AriaLiveLevel = 'polite'): void {
    if (!message.trim()) return;

    // Add to queue
    this.announceQueue.push(message);

    // Process queue
    if (!this.isAnnouncing) {
      this.processAnnounceQueue(level);
    }
  }

  /**
   * Process announcement queue
   */
  private async processAnnounceQueue(level: AriaLiveLevel): Promise<void> {
    if (this.announceQueue.length === 0) {
      this.isAnnouncing = false;
      return;
    }

    this.isAnnouncing = true;

    const message = this.announceQueue.shift()!;
    const regionId = level === 'assertive' ? 'filter-alert' : 'filter-status';
    const region = this.liveRegions.get(regionId);

    if (region) {
      // Clear previous message
      region.element.textContent = '';

      // Wait a tick for screen readers to notice the change
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set new message
      region.element.textContent = message;

      // Wait for announcement to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Process next message
      this.processAnnounceQueue(level);
    } else {
      this.isAnnouncing = false;
    }
  }

  /**
   * Set ARIA label on element
   */
  setLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label);
  }

  /**
   * Set ARIA labelledby on element
   */
  setLabelledBy(element: HTMLElement, labelId: string): void {
    element.setAttribute('aria-labelledby', labelId);
  }

  /**
   * Set ARIA describedby on element
   */
  setDescribedBy(element: HTMLElement, descriptionId: string): void {
    element.setAttribute('aria-describedby', descriptionId);
  }

  /**
   * Set ARIA expanded state
   */
  setExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', String(expanded));
  }

  /**
   * Set ARIA selected state
   */
  setSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', String(selected));
  }

  /**
   * Set ARIA checked state
   */
  setChecked(element: HTMLElement, checked: boolean | 'mixed'): void {
    element.setAttribute('aria-checked', String(checked));
  }

  /**
   * Set ARIA pressed state
   */
  setPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', String(pressed));
  }

  /**
   * Set ARIA disabled state
   */
  setDisabled(element: HTMLElement, disabled: boolean): void {
    element.setAttribute('aria-disabled', String(disabled));
    
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    } else {
      element.removeAttribute('tabindex');
    }
  }

  /**
   * Set ARIA hidden state
   */
  setHidden(element: HTMLElement, hidden: boolean): void {
    element.setAttribute('aria-hidden', String(hidden));
  }

  /**
   * Set ARIA busy state
   */
  setBusy(element: HTMLElement, busy: boolean): void {
    element.setAttribute('aria-busy', String(busy));
  }

  /**
   * Set ARIA invalid state
   */
  setInvalid(element: HTMLElement, invalid: boolean, errorMessage?: string): void {
    element.setAttribute('aria-invalid', String(invalid));
    
    if (invalid && errorMessage) {
      // Create error message element
      const errorId = `${element.id || 'element'}-error`;
      let errorElement = document.getElementById(errorId);
      
      if (!errorElement) {
        errorElement = document.createElement('span');
        errorElement.id = errorId;
        errorElement.className = 'aria-error-message';
        errorElement.style.color = '#ff4444';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '4px';
        errorElement.style.display = 'block';
        element.parentElement?.appendChild(errorElement);
      }
      
      errorElement.textContent = errorMessage;
      this.setDescribedBy(element, errorId);
    }
  }

  /**
   * Set ARIA current state
   */
  setCurrent(element: HTMLElement, current: boolean | 'page' | 'step' | 'location' | 'date' | 'time'): void {
    if (current === false) {
      element.removeAttribute('aria-current');
    } else {
      element.setAttribute('aria-current', current === true ? 'true' : current);
    }
  }

  /**
   * Set ARIA controls relationship
   */
  setControls(element: HTMLElement, controlledId: string): void {
    element.setAttribute('aria-controls', controlledId);
  }

  /**
   * Set ARIA owns relationship
   */
  setOwns(element: HTMLElement, ownedIds: string[]): void {
    element.setAttribute('aria-owns', ownedIds.join(' '));
  }

  /**
   * Set ARIA activedescendant
   */
  setActiveDescendant(element: HTMLElement, descendantId: string): void {
    element.setAttribute('aria-activedescendant', descendantId);
  }

  /**
   * Set ARIA role
   */
  setRole(element: HTMLElement, role: string): void {
    element.setAttribute('role', role);
  }

  /**
   * Set ARIA value for range widgets
   */
  setValueRange(
    element: HTMLElement,
    value: number,
    min: number,
    max: number,
    valueText?: string
  ): void {
    element.setAttribute('aria-valuenow', String(value));
    element.setAttribute('aria-valuemin', String(min));
    element.setAttribute('aria-valuemax', String(max));
    
    if (valueText) {
      element.setAttribute('aria-valuetext', valueText);
    }
  }

  /**
   * Set ARIA level for headings
   */
  setLevel(element: HTMLElement, level: number): void {
    element.setAttribute('aria-level', String(level));
  }

  /**
   * Set ARIA posinset and setsize for lists
   */
  setPosition(element: HTMLElement, position: number, total: number): void {
    element.setAttribute('aria-posinset', String(position));
    element.setAttribute('aria-setsize', String(total));
  }

  /**
   * Announce filter change
   */
  announceFilterChange(filterName: string, action: 'added' | 'removed' | 'changed'): void {
    const messages = {
      added: `Filter ${filterName} added`,
      removed: `Filter ${filterName} removed`,
      changed: `Filter ${filterName} changed`,
    };
    
    this.announce(messages[action], 'polite');
  }

  /**
   * Announce result count
   */
  announceResultCount(count: number): void {
    const message = count === 0
      ? 'No results found'
      : count === 1
      ? '1 result found'
      : `${count} results found`;
    
    this.announce(message, 'polite');
  }

  /**
   * Announce loading state
   */
  announceLoading(isLoading: boolean): void {
    const message = isLoading ? 'Loading results' : 'Results loaded';
    this.announce(message, 'polite');
  }

  /**
   * Announce error
   */
  announceError(error: string): void {
    this.announce(`Error: ${error}`, 'assertive');
  }

  /**
   * Announce success
   */
  announceSuccess(message: string): void {
    this.announce(message, 'polite');
  }

  /**
   * Create accessible description
   */
  createDescription(element: HTMLElement, description: string): string {
    const descId = `${element.id || 'element'}-desc-${Date.now()}`;
    const descElement = document.createElement('span');
    descElement.id = descId;
    descElement.className = 'aria-description';
    descElement.textContent = description;
    
    // Hide visually but keep accessible
    descElement.style.position = 'absolute';
    descElement.style.left = '-10000px';
    descElement.style.width = '1px';
    descElement.style.height = '1px';
    descElement.style.overflow = 'hidden';
    
    element.parentElement?.appendChild(descElement);
    this.setDescribedBy(element, descId);
    
    return descId;
  }

  /**
   * Remove live region
   */
  removeLiveRegion(id: string): void {
    const region = this.liveRegions.get(id);
    if (region) {
      region.element.remove();
      this.liveRegions.delete(id);
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Remove all live regions
    this.liveRegions.forEach(region => {
      region.element.remove();
    });
    
    this.liveRegions.clear();
    this.announceQueue = [];
    this.isAnnouncing = false;
  }
}

// Singleton instance
let ariaManager: AriaManager | null = null;

/**
 * Get or create ARIA manager instance
 */
export function getAriaManager(): AriaManager {
  if (!ariaManager) {
    ariaManager = new AriaManager();
  }
  return ariaManager;
}

/**
 * Destroy ARIA manager
 */
export function destroyAriaManager(): void {
  if (ariaManager) {
    ariaManager.destroy();
    ariaManager = null;
  }
}
