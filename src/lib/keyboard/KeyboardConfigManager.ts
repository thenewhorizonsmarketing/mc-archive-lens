/**
 * Keyboard Configuration Manager
 * 
 * Manages keyboard configuration, preferences, and per-component overrides.
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { KeyboardConfig, KeyboardComponentConfig, DEFAULT_KEYBOARD_CONFIG } from '@/types/keyboard-config';

const STORAGE_KEY = 'kiosk-keyboard-config';

export class KeyboardConfigManager {
  private static instance: KeyboardConfigManager;
  private config: KeyboardConfig;
  private componentOverrides: Map<string, KeyboardComponentConfig>;

  private constructor() {
    this.config = this.loadConfig();
    this.componentOverrides = new Map();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): KeyboardConfigManager {
    if (!KeyboardConfigManager.instance) {
      KeyboardConfigManager.instance = new KeyboardConfigManager();
    }
    return KeyboardConfigManager.instance;
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): KeyboardConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_KEYBOARD_CONFIG, ...parsed };
      }
    } catch (error) {
      console.warn('[KeyboardConfigManager] Failed to load config:', error);
    }
    return { ...DEFAULT_KEYBOARD_CONFIG };
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.error('[KeyboardConfigManager] Failed to save config:', error);
    }
  }

  /**
   * Get current global configuration
   */
  public getConfig(): KeyboardConfig {
    return { ...this.config };
  }

  /**
   * Update global configuration
   */
  public updateConfig(updates: Partial<KeyboardConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
    console.log('[KeyboardConfigManager] Config updated:', updates);
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    this.config = { ...DEFAULT_KEYBOARD_CONFIG };
    this.saveConfig();
    console.log('[KeyboardConfigManager] Config reset to defaults');
  }

  /**
   * Set component-specific configuration override
   */
  public setComponentConfig(componentId: string, config: KeyboardComponentConfig): void {
    this.componentOverrides.set(componentId, config);
    console.log(`[KeyboardConfigManager] Component config set for ${componentId}:`, config);
  }

  /**
   * Get configuration for a specific component
   * Merges global config with component overrides
   */
  public getComponentConfig(componentId: string): KeyboardConfig {
    const override = this.componentOverrides.get(componentId);
    
    if (!override) {
      return this.getConfig();
    }

    // If override flag is set, use only override values
    if (override.override) {
      return { ...DEFAULT_KEYBOARD_CONFIG, ...override };
    }

    // Otherwise, merge with global config
    return { ...this.config, ...override };
  }

  /**
   * Remove component-specific configuration
   */
  public removeComponentConfig(componentId: string): void {
    this.componentOverrides.delete(componentId);
    console.log(`[KeyboardConfigManager] Component config removed for ${componentId}`);
  }

  /**
   * Check if keyboard is enabled for a component
   */
  public isEnabled(componentId?: string): boolean {
    if (componentId) {
      const config = this.getComponentConfig(componentId);
      return config.enabled;
    }
    return this.config.enabled;
  }

  /**
   * Enable or disable keyboard globally
   */
  public setEnabled(enabled: boolean): void {
    this.updateConfig({ enabled });
  }

  /**
   * Get all component overrides (for debugging/admin)
   */
  public getAllComponentConfigs(): Map<string, KeyboardComponentConfig> {
    return new Map(this.componentOverrides);
  }

  /**
   * Export configuration as JSON
   */
  public exportConfig(): string {
    return JSON.stringify({
      global: this.config,
      components: Array.from(this.componentOverrides.entries()),
    }, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  public importConfig(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      if (data.global) {
        this.config = { ...DEFAULT_KEYBOARD_CONFIG, ...data.global };
        this.saveConfig();
      }
      
      if (data.components && Array.isArray(data.components)) {
        this.componentOverrides.clear();
        data.components.forEach(([id, config]: [string, KeyboardComponentConfig]) => {
          this.componentOverrides.set(id, config);
        });
      }
      
      console.log('[KeyboardConfigManager] Config imported successfully');
      return true;
    } catch (error) {
      console.error('[KeyboardConfigManager] Failed to import config:', error);
      return false;
    }
  }
}

// Export singleton instance
export const keyboardConfigManager = KeyboardConfigManager.getInstance();
