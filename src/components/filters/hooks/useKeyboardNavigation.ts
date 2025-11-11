/**
 * useKeyboardNavigation Hook
 * 
 * React hook for managing keyboard navigation in filter components.
 * Provides easy integration with the KeyboardNavigationManager.
 */

import { useEffect, useRef, useCallback } from 'react';
import { getKeyboardNavigationManager, KeyboardShortcut } from '../../../lib/filters/KeyboardNavigationManager';

export interface UseKeyboardNavigationOptions {
  onFocusSearch?: () => void;
  onOpenFilters?: () => void;
  onSaveSearch?: () => void;
  onViewHistory?: () => void;
  customShortcuts?: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    onFocusSearch,
    onOpenFilters,
    onSaveSearch,
    onViewHistory,
    customShortcuts = [],
    enabled = true,
  } = options;

  const managerRef = useRef(getKeyboardNavigationManager());
  const containerRef = useRef<HTMLElement | null>(null);

  // Register default shortcuts
  useEffect(() => {
    if (!enabled) return;

    const manager = managerRef.current;

    // Register default filter shortcuts
    manager.registerDefaultShortcuts({
      onFocusSearch,
      onOpenFilters,
      onSaveSearch,
      onViewHistory,
    });

    // Register custom shortcuts
    customShortcuts.forEach(shortcut => {
      manager.registerShortcut(shortcut);
    });

    return () => {
      // Cleanup shortcuts
      if (onFocusSearch) {
        manager.unregisterShortcut('/');
      }
      if (onOpenFilters) {
        manager.unregisterShortcut('k', true);
      }
      if (onSaveSearch) {
        manager.unregisterShortcut('s', true);
      }
      if (onViewHistory) {
        manager.unregisterShortcut('h', true);
      }
      
      customShortcuts.forEach(shortcut => {
        manager.unregisterShortcut(
          shortcut.key,
          shortcut.ctrl,
          shortcut.shift,
          shortcut.alt,
          shortcut.meta
        );
      });
    };
  }, [enabled, onFocusSearch, onOpenFilters, onSaveSearch, onViewHistory, customShortcuts]);

  // Update focusable elements when container changes
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const manager = managerRef.current;
    manager.updateFocusableElements(containerRef.current);

    // Update on DOM changes
    const observer = new MutationObserver(() => {
      manager.updateFocusableElements(containerRef.current || undefined);
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'hidden'],
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  // Register modal
  const registerModal = useCallback((modal: HTMLElement) => {
    if (!enabled) return;
    managerRef.current.registerModal(modal);
  }, [enabled]);

  // Unregister modal
  const unregisterModal = useCallback((modal: HTMLElement) => {
    if (!enabled) return;
    managerRef.current.unregisterModal(modal);
  }, [enabled]);

  // Focus group
  const focusGroup = useCallback((groupName: string) => {
    if (!enabled) return;
    managerRef.current.focusGroup(groupName);
  }, [enabled]);

  // Get shortcuts for display
  const getShortcuts = useCallback(() => {
    return managerRef.current.getShortcuts();
  }, []);

  // Format shortcut for display
  const formatShortcut = useCallback((shortcut: KeyboardShortcut) => {
    return managerRef.current.formatShortcut(shortcut);
  }, []);

  return {
    containerRef,
    registerModal,
    unregisterModal,
    focusGroup,
    getShortcuts,
    formatShortcut,
  };
}
