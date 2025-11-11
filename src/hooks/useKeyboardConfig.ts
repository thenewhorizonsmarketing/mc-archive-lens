/**
 * useKeyboardConfig Hook
 * 
 * React hook for accessing and managing keyboard configuration.
 * Requirements: 9.1, 9.2, 9.3
 */

import { useState, useEffect, useCallback } from 'react';
import { KeyboardConfig, KeyboardComponentConfig } from '@/types/keyboard-config';
import { keyboardConfigManager } from '@/lib/keyboard/KeyboardConfigManager';

export interface UseKeyboardConfigOptions {
  /** Component ID for component-specific configuration */
  componentId?: string;
  
  /** Component-specific configuration override */
  componentConfig?: KeyboardComponentConfig;
}

export interface UseKeyboardConfigReturn {
  /** Current configuration (global or component-specific) */
  config: KeyboardConfig;
  
  /** Update global configuration */
  updateConfig: (updates: Partial<KeyboardConfig>) => void;
  
  /** Reset configuration to defaults */
  resetConfig: () => void;
  
  /** Check if keyboard is enabled */
  isEnabled: boolean;
  
  /** Enable or disable keyboard */
  setEnabled: (enabled: boolean) => void;
}

/**
 * Hook to access and manage keyboard configuration
 */
export function useKeyboardConfig(options: UseKeyboardConfigOptions = {}): UseKeyboardConfigReturn {
  const { componentId, componentConfig } = options;
  
  // Get initial configuration
  const getInitialConfig = useCallback(() => {
    if (componentId) {
      return keyboardConfigManager.getComponentConfig(componentId);
    }
    return keyboardConfigManager.getConfig();
  }, [componentId]);
  
  const [config, setConfig] = useState<KeyboardConfig>(getInitialConfig);
  
  // Set component configuration on mount
  useEffect(() => {
    if (componentId && componentConfig) {
      keyboardConfigManager.setComponentConfig(componentId, componentConfig);
    }
    
    return () => {
      // Cleanup: remove component config on unmount
      if (componentId) {
        keyboardConfigManager.removeComponentConfig(componentId);
      }
    };
  }, [componentId, componentConfig]);
  
  // Update config when it changes
  useEffect(() => {
    const updateLocalConfig = () => {
      setConfig(getInitialConfig());
    };
    
    // Listen for storage events (config changes in other tabs/windows)
    window.addEventListener('storage', updateLocalConfig);
    
    return () => {
      window.removeEventListener('storage', updateLocalConfig);
    };
  }, [getInitialConfig]);
  
  // Update global configuration
  const updateConfig = useCallback((updates: Partial<KeyboardConfig>) => {
    keyboardConfigManager.updateConfig(updates);
    setConfig(keyboardConfigManager.getConfig());
  }, []);
  
  // Reset configuration
  const resetConfig = useCallback(() => {
    keyboardConfigManager.resetConfig();
    setConfig(keyboardConfigManager.getConfig());
  }, []);
  
  // Set enabled state
  const setEnabled = useCallback((enabled: boolean) => {
    keyboardConfigManager.setEnabled(enabled);
    setConfig(keyboardConfigManager.getConfig());
  }, []);
  
  return {
    config,
    updateConfig,
    resetConfig,
    isEnabled: config.enabled,
    setEnabled,
  };
}
