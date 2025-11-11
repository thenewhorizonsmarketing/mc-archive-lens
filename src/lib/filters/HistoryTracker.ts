/**
 * HistoryTracker
 * 
 * Tracks search history with metadata and stores in IndexedDB.
 * Implements automatic cleanup of entries older than 30 days.
 */

import type { FilterConfig } from './types';

export interface HistoryEntry {
  id: string;
  query: string;
  filters: FilterConfig;
  timestamp: Date;
  resultCount: number;
  executionTime: number; // milliseconds
  contentType: string;
  metadata?: {
    userAgent?: string;
    screenSize?: string;
    [key: string]: any;
  };
}

export interface HistoryStats {
  totalSearches: number;
  uniqueQueries: number;
  avgResultsPerSearch: number;
  avgExecutionTime: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  categoryBreakdown: Map<string, number>;
  timeDistribution: Map<string, number>;
  recentSearches: HistoryEntry[];
}

const DB_NAME = 'mc-law-search-history';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const CLEANUP_DAYS = 30;

export class HistoryTracker {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initDatabase();
  }

  /**
   * Initialize IndexedDB database
   */
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('contentType', 'contentType', { unique: false });
          store.createIndex('query', 'query', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
    if (!this.db) {
      throw new Error('Database not initialized');
    }
  }

  /**
   * Generate unique ID for history entry
   */
  private generateId(): string {
    return `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Record a search in history
   */
  async recordSearch(
    query: string,
    filters: FilterConfig,
    resultCount: number,
    executionTime: number,
    metadata?: Record<string, any>
  ): Promise<HistoryEntry> {
    await this.ensureInitialized();

    const entry: HistoryEntry = {
      id: this.generateId(),
      query,
      filters: JSON.parse(JSON.stringify(filters)), // Deep clone
      timestamp: new Date(),
      resultCount,
      executionTime,
      contentType: filters.type,
      metadata: {
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        ...metadata,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(entry);

      request.onsuccess = () => {
        resolve(entry);
      };

      request.onerror = () => {
        console.error('Failed to record search:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all history entries
   */
  async getAll(): Promise<HistoryEntry[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result.map(entry => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        resolve(entries);
      };

      request.onerror = () => {
        console.error('Failed to get history:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get history entries within date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<HistoryEntry[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);

      request.onsuccess = () => {
        const entries = request.result.map(entry => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        resolve(entries);
      };

      request.onerror = () => {
        console.error('Failed to get history by date range:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get recent history entries
   */
  async getRecent(limit: number = 50): Promise<HistoryEntry[]> {
    const all = await this.getAll();
    return all
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get history entries by content type
   */
  async getByContentType(contentType: string): Promise<HistoryEntry[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('contentType');
      const request = index.getAll(contentType);

      request.onsuccess = () => {
        const entries = request.result.map(entry => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        resolve(entries);
      };

      request.onerror = () => {
        console.error('Failed to get history by content type:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Search history entries by query text
   */
  async searchHistory(searchTerm: string): Promise<HistoryEntry[]> {
    const all = await this.getAll();
    const lowerTerm = searchTerm.toLowerCase();
    
    return all.filter(entry =>
      entry.query.toLowerCase().includes(lowerTerm)
    );
  }

  /**
   * Get a specific history entry by ID
   */
  async getById(id: string): Promise<HistoryEntry | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          resolve({
            ...request.result,
            timestamp: new Date(request.result.timestamp),
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to get history entry:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a history entry
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.error('Failed to delete history entry:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all history
   */
  async clearAll(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear history:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clean up entries older than specified days (default 30)
   */
  async cleanup(days: number = CLEANUP_DAYS): Promise<number> {
    await this.ensureInitialized();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const oldEntries = await this.getByDateRange(
      new Date(0), // Beginning of time
      cutoffDate
    );

    let deletedCount = 0;
    for (const entry of oldEntries) {
      const success = await this.delete(entry.id);
      if (success) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get comprehensive statistics about search history
   */
  async getStatistics(): Promise<HistoryStats> {
    const all = await this.getAll();
    const totalSearches = all.length;

    if (totalSearches === 0) {
      return {
        totalSearches: 0,
        uniqueQueries: 0,
        avgResultsPerSearch: 0,
        avgExecutionTime: 0,
        topSearchTerms: [],
        categoryBreakdown: new Map(),
        timeDistribution: new Map(),
        recentSearches: [],
      };
    }

    // Calculate unique queries
    const uniqueQueries = new Set(all.map(e => e.query.toLowerCase())).size;

    // Calculate averages
    const totalResults = all.reduce((sum, e) => sum + e.resultCount, 0);
    const totalTime = all.reduce((sum, e) => sum + e.executionTime, 0);
    const avgResultsPerSearch = totalResults / totalSearches;
    const avgExecutionTime = totalTime / totalSearches;

    // Calculate top search terms
    const termCounts = new Map<string, number>();
    all.forEach(entry => {
      const term = entry.query.toLowerCase();
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    });
    const topSearchTerms = Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate category breakdown
    const categoryBreakdown = new Map<string, number>();
    all.forEach(entry => {
      const type = entry.contentType;
      categoryBreakdown.set(type, (categoryBreakdown.get(type) || 0) + 1);
    });

    // Calculate time distribution (by hour of day)
    const timeDistribution = new Map<string, number>();
    all.forEach(entry => {
      const hour = entry.timestamp.getHours();
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      timeDistribution.set(hourKey, (timeDistribution.get(hourKey) || 0) + 1);
    });

    // Get recent searches
    const recentSearches = all
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalSearches,
      uniqueQueries,
      avgResultsPerSearch,
      avgExecutionTime,
      topSearchTerms,
      categoryBreakdown,
      timeDistribution,
      recentSearches,
    };
  }

  /**
   * Export history as JSON
   */
  async export(): Promise<string> {
    const all = await this.getAll();
    return JSON.stringify(all, null, 2);
  }

  /**
   * Import history from JSON
   */
  async import(json: string, merge: boolean = false): Promise<number> {
    await this.ensureInitialized();

    try {
      const entries = JSON.parse(json) as HistoryEntry[];

      if (!Array.isArray(entries)) {
        throw new Error('Invalid history format');
      }

      if (!merge) {
        await this.clearAll();
      }

      let importedCount = 0;
      for (const entry of entries) {
        try {
          // Convert timestamp string to Date
          entry.timestamp = new Date(entry.timestamp);
          
          const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          
          await new Promise<void>((resolve, reject) => {
            const request = store.add(entry);
            request.onsuccess = () => {
              importedCount++;
              resolve();
            };
            request.onerror = () => reject(request.error);
          });
        } catch (error) {
          console.error('Failed to import entry:', error);
        }
      }

      return importedCount;
    } catch (error) {
      console.error('Failed to import history:', error);
      throw new Error('Failed to import history. Invalid format.');
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
let instance: HistoryTracker | null = null;

export function getHistoryTracker(): HistoryTracker {
  if (!instance) {
    instance = new HistoryTracker();
  }
  return instance;
}

// Auto-cleanup on initialization
if (typeof window !== 'undefined') {
  // Run cleanup once per day
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  const lastCleanup = localStorage.getItem('mc-law-history-last-cleanup');
  const now = Date.now();

  if (!lastCleanup || now - parseInt(lastCleanup) > CLEANUP_INTERVAL) {
    getHistoryTracker().cleanup().then(count => {
      if (count > 0) {
        console.log(`Cleaned up ${count} old history entries`);
      }
      localStorage.setItem('mc-law-history-last-cleanup', now.toString());
    });
  }
}
