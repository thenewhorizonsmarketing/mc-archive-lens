/**
 * SavedSearchManager
 * 
 * Manages CRUD operations for saved search presets with usage statistics.
 * Stores searches in localStorage with metadata tracking.
 */

import type { FilterConfig } from './types';

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: FilterConfig;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
  tags?: string[];
}

interface SavedSearchStorage {
  searches: Record<string, SavedSearch>;
  version: number;
}

const STORAGE_KEY = 'mc-law-saved-searches';
const STORAGE_VERSION = 1;

export class SavedSearchManager {
  private storage: SavedSearchStorage;

  constructor() {
    this.storage = this.loadFromStorage();
  }

  /**
   * Load saved searches from localStorage
   */
  private loadFromStorage(): SavedSearchStorage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { searches: {}, version: STORAGE_VERSION };
      }

      const parsed = JSON.parse(stored) as SavedSearchStorage;
      
      // Convert date strings back to Date objects
      Object.values(parsed.searches).forEach(search => {
        search.createdAt = new Date(search.createdAt);
        search.lastUsed = new Date(search.lastUsed);
      });

      return parsed;
    } catch (error) {
      console.error('Failed to load saved searches:', error);
      return { searches: {}, version: STORAGE_VERSION };
    }
  }

  /**
   * Save current state to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.storage));
    } catch (error) {
      console.error('Failed to save searches:', error);
      throw new Error('Failed to save search. Storage may be full.');
    }
  }

  /**
   * Generate a unique ID for a saved search
   */
  private generateId(): string {
    return `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save a new search or update existing one
   */
  save(
    name: string,
    filters: FilterConfig,
    description?: string,
    tags?: string[],
    id?: string
  ): SavedSearch {
    const searchId = id || this.generateId();
    const now = new Date();

    const existingSearch = this.storage.searches[searchId];

    const savedSearch: SavedSearch = {
      id: searchId,
      name,
      description,
      filters: JSON.parse(JSON.stringify(filters)), // Deep clone
      createdAt: existingSearch?.createdAt || now,
      lastUsed: now,
      useCount: existingSearch?.useCount || 0,
      tags,
    };

    this.storage.searches[searchId] = savedSearch;
    this.saveToStorage();

    return savedSearch;
  }

  /**
   * Load a saved search by ID and update usage statistics
   */
  load(id: string): SavedSearch | null {
    const search = this.storage.searches[id];
    if (!search) {
      return null;
    }

    // Update usage statistics
    search.lastUsed = new Date();
    search.useCount++;
    this.saveToStorage();

    return search;
  }

  /**
   * Get a saved search without updating statistics
   */
  get(id: string): SavedSearch | null {
    return this.storage.searches[id] || null;
  }

  /**
   * Get all saved searches
   */
  getAll(): SavedSearch[] {
    return Object.values(this.storage.searches);
  }

  /**
   * Get saved searches sorted by most recently used
   */
  getRecent(limit?: number): SavedSearch[] {
    const searches = this.getAll().sort(
      (a, b) => b.lastUsed.getTime() - a.lastUsed.getTime()
    );
    return limit ? searches.slice(0, limit) : searches;
  }

  /**
   * Get saved searches sorted by most frequently used
   */
  getPopular(limit?: number): SavedSearch[] {
    const searches = this.getAll().sort((a, b) => b.useCount - a.useCount);
    return limit ? searches.slice(0, limit) : searches;
  }

  /**
   * Search saved searches by name or description
   */
  search(query: string): SavedSearch[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      search =>
        search.name.toLowerCase().includes(lowerQuery) ||
        search.description?.toLowerCase().includes(lowerQuery) ||
        search.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get saved searches by tag
   */
  getByTag(tag: string): SavedSearch[] {
    return this.getAll().filter(search =>
      search.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }

  /**
   * Delete a saved search
   */
  delete(id: string): boolean {
    if (!this.storage.searches[id]) {
      return false;
    }

    delete this.storage.searches[id];
    this.saveToStorage();
    return true;
  }

  /**
   * Update a saved search
   */
  update(
    id: string,
    updates: Partial<Omit<SavedSearch, 'id' | 'createdAt' | 'useCount'>>
  ): SavedSearch | null {
    const search = this.storage.searches[id];
    if (!search) {
      return null;
    }

    Object.assign(search, updates);
    this.saveToStorage();
    return search;
  }

  /**
   * Duplicate a saved search
   */
  duplicate(id: string, newName?: string): SavedSearch | null {
    const original = this.get(id);
    if (!original) {
      return null;
    }

    return this.save(
      newName || `${original.name} (Copy)`,
      original.filters,
      original.description,
      original.tags
    );
  }

  /**
   * Clear all saved searches
   */
  clear(): void {
    this.storage = { searches: {}, version: STORAGE_VERSION };
    this.saveToStorage();
  }

  /**
   * Export saved searches as JSON
   */
  export(): string {
    return JSON.stringify(this.storage, null, 2);
  }

  /**
   * Import saved searches from JSON
   */
  import(json: string, merge: boolean = false): boolean {
    try {
      const imported = JSON.parse(json) as SavedSearchStorage;

      if (!imported.searches || typeof imported.searches !== 'object') {
        throw new Error('Invalid saved search format');
      }

      // Convert date strings to Date objects
      Object.values(imported.searches).forEach(search => {
        search.createdAt = new Date(search.createdAt);
        search.lastUsed = new Date(search.lastUsed);
      });

      if (merge) {
        // Merge with existing searches
        this.storage.searches = {
          ...this.storage.searches,
          ...imported.searches,
        };
      } else {
        // Replace all searches
        this.storage = imported;
      }

      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import searches:', error);
      return false;
    }
  }

  /**
   * Get usage statistics
   */
  getStatistics(): {
    totalSearches: number;
    totalUses: number;
    mostUsed: SavedSearch | null;
    recentlyAdded: SavedSearch | null;
    averageUseCount: number;
  } {
    const searches = this.getAll();
    const totalSearches = searches.length;
    const totalUses = searches.reduce((sum, s) => sum + s.useCount, 0);
    const mostUsed = this.getPopular(1)[0] || null;
    const recentlyAdded = searches.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )[0] || null;
    const averageUseCount = totalSearches > 0 ? totalUses / totalSearches : 0;

    return {
      totalSearches,
      totalUses,
      mostUsed,
      recentlyAdded,
      averageUseCount,
    };
  }

  /**
   * Clean up old unused searches
   */
  cleanup(daysUnused: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysUnused);

    const toDelete = this.getAll().filter(
      search => search.lastUsed < cutoffDate && search.useCount === 0
    );

    toDelete.forEach(search => this.delete(search.id));
    return toDelete.length;
  }
}

// Singleton instance
let instance: SavedSearchManager | null = null;

export function getSavedSearchManager(): SavedSearchManager {
  if (!instance) {
    instance = new SavedSearchManager();
  }
  return instance;
}
