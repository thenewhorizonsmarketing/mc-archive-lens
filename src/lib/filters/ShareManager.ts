/**
 * ShareManager
 * 
 * Manages sharing functionality for filter configurations.
 * Generates shareable URLs with encoded filters and provides
 * copy-to-clipboard functionality.
 */

import type { FilterConfig } from './types';

export interface ShareableFilter {
  version: number;
  filters: FilterConfig;
  timestamp: number;
  metadata?: {
    name?: string;
    description?: string;
    creator?: string;
  };
}

const SHARE_VERSION = 1;
const URL_PARAM_KEY = 'filters';

export class ShareManager {
  /**
   * Encode filter configuration to base64 URL-safe string
   */
  private encodeFilters(filters: FilterConfig, metadata?: ShareableFilter['metadata']): string {
    const shareable: ShareableFilter = {
      version: SHARE_VERSION,
      filters,
      timestamp: Date.now(),
      metadata,
    };

    const json = JSON.stringify(shareable);
    
    // Convert to base64 and make URL-safe
    const base64 = btoa(json);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Decode base64 URL-safe string to filter configuration
   */
  private decodeFilters(encoded: string): ShareableFilter | null {
    try {
      // Restore base64 format
      let base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }

      const json = atob(base64);
      const shareable = JSON.parse(json) as ShareableFilter;

      // Validate version
      if (shareable.version !== SHARE_VERSION) {
        console.warn('Unsupported share version:', shareable.version);
        return null;
      }

      return shareable;
    } catch (error) {
      console.error('Failed to decode filters:', error);
      return null;
    }
  }

  /**
   * Generate a shareable URL with encoded filters
   */
  generateShareableURL(
    filters: FilterConfig,
    metadata?: ShareableFilter['metadata']
  ): string {
    const encoded = this.encodeFilters(filters, metadata);
    const url = new URL(window.location.href);
    
    // Clear existing filter params
    url.searchParams.delete(URL_PARAM_KEY);
    
    // Add encoded filters
    url.searchParams.set(URL_PARAM_KEY, encoded);
    
    return url.toString();
  }

  /**
   * Parse shared URL and extract filter configuration
   */
  parseSharedURL(url?: string): ShareableFilter | null {
    try {
      const urlObj = new URL(url || window.location.href);
      const encoded = urlObj.searchParams.get(URL_PARAM_KEY);
      
      if (!encoded) {
        return null;
      }

      return this.decodeFilters(encoded);
    } catch (error) {
      console.error('Failed to parse shared URL:', error);
      return null;
    }
  }

  /**
   * Check if current URL contains shared filters
   */
  hasSharedFilters(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has(URL_PARAM_KEY);
  }

  /**
   * Get shared filters from current URL
   */
  getSharedFilters(): FilterConfig | null {
    const shareable = this.parseSharedURL();
    return shareable?.filters || null;
  }

  /**
   * Copy shareable URL to clipboard
   */
  async copyToClipboard(
    filters: FilterConfig,
    metadata?: ShareableFilter['metadata']
  ): Promise<boolean> {
    try {
      const url = this.generateShareableURL(filters, metadata);
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        return true;
      }

      // Fallback to older method
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      return success;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Generate a short code for sharing (for future API integration)
   */
  generateShortCode(filters: FilterConfig): string {
    const encoded = this.encodeFilters(filters);
    // Take first 8 characters of hash for short code
    return this.hashString(encoded).substring(0, 8);
  }

  /**
   * Simple hash function for generating short codes
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear shared filters from URL without page reload
   */
  clearSharedFilters(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete(URL_PARAM_KEY);
    window.history.replaceState({}, '', url.toString());
  }

  /**
   * Update URL with new filters without page reload
   */
  updateURL(filters: FilterConfig, metadata?: ShareableFilter['metadata']): void {
    const url = this.generateShareableURL(filters, metadata);
    window.history.replaceState({}, '', url);
  }

  /**
   * Export filters as JSON file
   */
  exportAsJSON(
    filters: FilterConfig,
    filename: string = 'search-filters.json'
  ): void {
    const shareable: ShareableFilter = {
      version: SHARE_VERSION,
      filters,
      timestamp: Date.now(),
    };

    const json = JSON.stringify(shareable, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import filters from JSON file
   */
  async importFromJSON(file: File): Promise<FilterConfig | null> {
    try {
      const text = await file.text();
      const shareable = JSON.parse(text) as ShareableFilter;

      if (shareable.version !== SHARE_VERSION) {
        console.warn('Unsupported import version:', shareable.version);
        return null;
      }

      return shareable.filters;
    } catch (error) {
      console.error('Failed to import filters:', error);
      return null;
    }
  }

  /**
   * Generate QR code data URL for sharing (requires qrcode library)
   */
  async generateQRCode(filters: FilterConfig): Promise<string | null> {
    try {
      const url = this.generateShareableURL(filters);
      
      // Check if QRCode library is available
      if (typeof window !== 'undefined' && (window as any).QRCode) {
        const QRCode = (window as any).QRCode;
        return await QRCode.toDataURL(url);
      }

      console.warn('QRCode library not available');
      return null;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return null;
    }
  }

  /**
   * Share via Web Share API (mobile)
   */
  async shareNative(
    filters: FilterConfig,
    metadata?: ShareableFilter['metadata']
  ): Promise<boolean> {
    try {
      if (!navigator.share) {
        console.warn('Web Share API not available');
        return false;
      }

      const url = this.generateShareableURL(filters, metadata);
      
      await navigator.share({
        title: metadata?.name || 'Search Filters',
        text: metadata?.description || 'Check out these search filters',
        url,
      });

      return true;
    } catch (error) {
      // User cancelled or error occurred
      console.error('Failed to share:', error);
      return false;
    }
  }

  /**
   * Validate filter configuration before sharing
   */
  validateFilters(filters: FilterConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!filters) {
      errors.push('Filter configuration is required');
      return { valid: false, errors };
    }

    if (!filters.type) {
      errors.push('Filter type is required');
    }

    // Check if filters are too large for URL
    const encoded = this.encodeFilters(filters);
    if (encoded.length > 2000) {
      errors.push('Filter configuration is too large for URL sharing. Consider using export instead.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get share statistics
   */
  getShareStatistics(): {
    urlLength: number;
    canShare: boolean;
    hasClipboard: boolean;
    hasWebShare: boolean;
  } {
    const url = window.location.href;
    
    return {
      urlLength: url.length,
      canShare: url.length < 2000,
      hasClipboard: !!(navigator.clipboard && navigator.clipboard.writeText),
      hasWebShare: !!navigator.share,
    };
  }
}

// Singleton instance
let instance: ShareManager | null = null;

export function getShareManager(): ShareManager {
  if (!instance) {
    instance = new ShareManager();
  }
  return instance;
}
