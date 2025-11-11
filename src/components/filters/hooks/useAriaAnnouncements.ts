/**
 * useAriaAnnouncements Hook
 * 
 * React hook for managing ARIA announcements and live regions.
 * Provides easy integration with the AriaManager.
 */

import { useEffect, useCallback, useRef } from 'react';
import { getAriaManager, AriaLiveLevel } from '../../../lib/filters/AriaManager';

export function useAriaAnnouncements() {
  const managerRef = useRef(getAriaManager());

  // Announce message
  const announce = useCallback((message: string, level: AriaLiveLevel = 'polite') => {
    managerRef.current.announce(message, level);
  }, []);

  // Announce filter change
  const announceFilterChange = useCallback((
    filterName: string,
    action: 'added' | 'removed' | 'changed'
  ) => {
    managerRef.current.announceFilterChange(filterName, action);
  }, []);

  // Announce result count
  const announceResultCount = useCallback((count: number) => {
    managerRef.current.announceResultCount(count);
  }, []);

  // Announce loading state
  const announceLoading = useCallback((isLoading: boolean) => {
    managerRef.current.announceLoading(isLoading);
  }, []);

  // Announce error
  const announceError = useCallback((error: string) => {
    managerRef.current.announceError(error);
  }, []);

  // Announce success
  const announceSuccess = useCallback((message: string) => {
    managerRef.current.announceSuccess(message);
  }, []);

  return {
    announce,
    announceFilterChange,
    announceResultCount,
    announceLoading,
    announceError,
    announceSuccess,
  };
}

/**
 * useAriaAttributes Hook
 * 
 * React hook for managing ARIA attributes on elements.
 */
export function useAriaAttributes(elementRef: React.RefObject<HTMLElement>) {
  const managerRef = useRef(getAriaManager());

  // Set label
  const setLabel = useCallback((label: string) => {
    if (elementRef.current) {
      managerRef.current.setLabel(elementRef.current, label);
    }
  }, [elementRef]);

  // Set expanded
  const setExpanded = useCallback((expanded: boolean) => {
    if (elementRef.current) {
      managerRef.current.setExpanded(elementRef.current, expanded);
    }
  }, [elementRef]);

  // Set selected
  const setSelected = useCallback((selected: boolean) => {
    if (elementRef.current) {
      managerRef.current.setSelected(elementRef.current, selected);
    }
  }, [elementRef]);

  // Set checked
  const setChecked = useCallback((checked: boolean | 'mixed') => {
    if (elementRef.current) {
      managerRef.current.setChecked(elementRef.current, checked);
    }
  }, [elementRef]);

  // Set disabled
  const setDisabled = useCallback((disabled: boolean) => {
    if (elementRef.current) {
      managerRef.current.setDisabled(elementRef.current, disabled);
    }
  }, [elementRef]);

  // Set busy
  const setBusy = useCallback((busy: boolean) => {
    if (elementRef.current) {
      managerRef.current.setBusy(elementRef.current, busy);
    }
  }, [elementRef]);

  // Set invalid
  const setInvalid = useCallback((invalid: boolean, errorMessage?: string) => {
    if (elementRef.current) {
      managerRef.current.setInvalid(elementRef.current, invalid, errorMessage);
    }
  }, [elementRef]);

  return {
    setLabel,
    setExpanded,
    setSelected,
    setChecked,
    setDisabled,
    setBusy,
    setInvalid,
  };
}
