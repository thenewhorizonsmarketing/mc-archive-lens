import { describe, it, expect, beforeEach } from 'vitest';
import { KeyboardNavigationManager } from '../../lib/filters/KeyboardNavigationManager';

describe('Keyboard Navigation E2E', () => {
  let navigationManager: KeyboardNavigationManager;

  beforeEach(() => {
    navigationManager = new KeyboardNavigationManager();
  });

  describe('Search Input Focus', () => {
    it('should focus search input with / key', () => {
      const mockInput = document.createElement('input');
      mockInput.id = 'search-input';
      document.body.appendChild(mockInput);

      const event = new KeyboardEvent('keydown', { key: '/' });
      navigationManager.handleKeyDown(event);

      expect(document.activeElement).toBe(mockInput);

      document.body.removeChild(mockInput);
    });

    it('should focus search input with Ctrl+K', () => {
      const mockInput = document.createElement('input');
      mockInput.id = 'search-input';
      document.body.appendChild(mockInput);

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      navigationManager.handleKeyDown(event);

      expect(document.activeElement).toBe(mockInput);

      document.body.removeChild(mockInput);
    });
  });

  describe('Suggestion Navigation', () => {
    it('should navigate suggestions with arrow keys', () => {
      const suggestions = [
        { id: 'suggestion-0', text: 'John Doe' },
        { id: 'suggestion-1', text: 'Jane Smith' },
        { id: 'suggestion-2', text: 'Bob Johnson' }
      ];

      navigationManager.setSuggestions(suggestions);

      // Press down arrow
      let event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigationManager.handleKeyDown(event);
      expect(navigationManager.getSelectedIndex()).toBe(0);

      // Press down arrow again
      event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      navigationManager.handleKeyDown(event);
      expect(navigationManager.getSelectedIndex()).toBe(1);

      // Press up arrow
      event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      navigationManager.handleKeyDown(event);
      expect(navigationManager.getSelectedIndex()).toBe(0);
    });

    it('should wrap around at list boundaries', () => {
      const suggestions = [
        { id: 'suggestion-0', text: 'John Doe' },
        { id: 'suggestion-1', text: 'Jane Smith' }
      ];

      navigationManager.setSuggestions(suggestions);

      // Navigate to last item
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(navigationManager.getSelectedIndex()).toBe(1);

      // Press down should wrap to first
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(navigationManager.getSelectedIndex()).toBe(0);

      // Press up should wrap to last
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
      expect(navigationManager.getSelectedIndex()).toBe(1);
    });

    it('should select suggestion with Enter key', () => {
      const suggestions = [
        { id: 'suggestion-0', text: 'John Doe' },
        { id: 'suggestion-1', text: 'Jane Smith' }
      ];

      navigationManager.setSuggestions(suggestions);
      
      let selectedSuggestion = null;
      navigationManager.onSelect((suggestion) => {
        selectedSuggestion = suggestion;
      });

      // Navigate to second item
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

      // Press Enter
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(selectedSuggestion).toEqual(suggestions[1]);
    });
  });

  describe('Modal and Dropdown Control', () => {
    it('should close dropdown with Escape key', () => {
      navigationManager.setDropdownOpen(true);
      expect(navigationManager.isDropdownOpen()).toBe(true);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      navigationManager.handleKeyDown(event);

      expect(navigationManager.isDropdownOpen()).toBe(false);
    });

    it('should close modal with Escape key', () => {
      navigationManager.setModalOpen(true);
      expect(navigationManager.isModalOpen()).toBe(true);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      navigationManager.handleKeyDown(event);

      expect(navigationManager.isModalOpen()).toBe(false);
    });
  });

  describe('Filter Panel Shortcuts', () => {
    it('should open filter panel with Ctrl+K', () => {
      let filterPanelOpened = false;
      navigationManager.onFilterPanelToggle(() => {
        filterPanelOpened = true;
      });

      const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
      navigationManager.handleKeyDown(event);

      expect(filterPanelOpened).toBe(true);
    });

    it('should save search with Ctrl+S', () => {
      let saveTriggered = false;
      navigationManager.onSaveSearch(() => {
        saveTriggered = true;
      });

      const event = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
      event.preventDefault = vi.fn();
      navigationManager.handleKeyDown(event);

      expect(saveTriggered).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should open history with Ctrl+H', () => {
      let historyOpened = false;
      navigationManager.onHistoryOpen(() => {
        historyOpened = true;
      });

      const event = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true });
      navigationManager.handleKeyDown(event);

      expect(historyOpened).toBe(true);
    });
  });

  describe('Tab Navigation', () => {
    it('should maintain proper tab order', () => {
      const elements = [
        document.createElement('input'),
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('input')
      ];

      elements.forEach((el, i) => {
        el.tabIndex = i;
        document.body.appendChild(el);
      });

      navigationManager.setFocusableElements(elements);

      // Tab through elements
      elements[0].focus();
      expect(document.activeElement).toBe(elements[0]);

      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(navigationManager.getCurrentFocusIndex()).toBe(1);

      // Clean up
      elements.forEach(el => document.body.removeChild(el));
    });

    it('should handle Shift+Tab for reverse navigation', () => {
      const elements = [
        document.createElement('input'),
        document.createElement('button'),
        document.createElement('button')
      ];

      elements.forEach((el, i) => {
        el.tabIndex = i;
        document.body.appendChild(el);
      });

      navigationManager.setFocusableElements(elements);

      // Focus last element
      elements[2].focus();
      navigationManager.setCurrentFocusIndex(2);

      // Shift+Tab
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true 
      }));

      expect(navigationManager.getCurrentFocusIndex()).toBe(1);

      // Clean up
      elements.forEach(el => document.body.removeChild(el));
    });
  });

  describe('Focus Indicators', () => {
    it('should show focus indicator on keyboard navigation', () => {
      const button = document.createElement('button');
      button.className = 'filter-button';
      document.body.appendChild(button);

      button.focus();
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));

      // Focus indicator should be visible
      expect(navigationManager.isFocusVisible()).toBe(true);

      document.body.removeChild(button);
    });

    it('should hide focus indicator on mouse interaction', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      button.focus();
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(navigationManager.isFocusVisible()).toBe(true);

      // Simulate mouse click
      navigationManager.handleMouseDown();
      expect(navigationManager.isFocusVisible()).toBe(false);

      document.body.removeChild(button);
    });
  });

  describe('Accessibility Announcements', () => {
    it('should announce filter changes to screen readers', () => {
      const announcements: string[] = [];
      navigationManager.onAnnounce((message) => {
        announcements.push(message);
      });

      navigationManager.announceFilterChange('City filter applied: Boston');
      expect(announcements).toContain('City filter applied: Boston');
    });

    it('should announce result count changes', () => {
      const announcements: string[] = [];
      navigationManager.onAnnounce((message) => {
        announcements.push(message);
      });

      navigationManager.announceResultCount(42);
      expect(announcements.some(a => a.includes('42'))).toBe(true);
    });
  });

  describe('Complex Navigation Scenarios', () => {
    it('should handle navigation in nested filter groups', () => {
      const filterGroups = [
        { id: 'group-1', filters: ['filter-1-1', 'filter-1-2'] },
        { id: 'group-2', filters: ['filter-2-1', 'filter-2-2', 'filter-2-3'] }
      ];

      navigationManager.setFilterGroups(filterGroups);

      // Navigate through groups
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(navigationManager.getCurrentGroup()).toBe('group-1');

      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      expect(navigationManager.getCurrentGroup()).toBe('group-2');

      // Navigate within group
      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(navigationManager.getCurrentFilter()).toBe('filter-2-1');
    });

    it('should handle keyboard shortcuts in different contexts', () => {
      // In search input context
      navigationManager.setContext('search-input');
      let searchFocused = false;
      navigationManager.onSearchFocus(() => {
        searchFocused = true;
      });

      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: '/' }));
      expect(searchFocused).toBe(true);

      // In filter panel context
      navigationManager.setContext('filter-panel');
      let filterApplied = false;
      navigationManager.onFilterApply(() => {
        filterApplied = true;
      });

      navigationManager.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(filterApplied).toBe(true);
    });
  });
});
