// Filter Cache for performance optimization
import { CacheEntry } from './types';

export interface CacheOptions {
  defaultTTL?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of cache entries
  enableLogging?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export class FilterCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private defaultTTL: number;
  private maxSize: number;
  private enableLogging: boolean;
  private stats: { hits: number; misses: number };

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
    this.enableLogging = options.enableLogging || false;
    this.stats = { hits: 0, misses: 0 };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get cached value by key
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.log('Cache miss:', key);
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      this.log('Cache expired:', key);
      return null;
    }

    this.stats.hits++;
    this.log('Cache hit:', key);
    return entry.data;
  }

  /**
   * Set cached value with optional TTL
   */
  set(key: string, data: T, ttl?: number): void {
    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
    this.log('Cache set:', key, 'TTL:', entry.ttl);
  }

  /**
   * Check if key exists in cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cached value by key
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.log('Cache delete:', key);
    }
    return deleted;
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    this.log('Cache cleared');
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.log('Invalidated', count, 'entries matching pattern:', pattern);
    return count;
  }

  /**
   * Invalidate all cache entries for a specific content type
   */
  invalidateByType(contentType: string): number {
    return this.invalidatePattern(`^${contentType}:`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Generate cache key from filter configuration
   */
  static generateKey(prefix: string, ...parts: any[]): string {
    const serialized = parts.map(part => {
      if (typeof part === 'object') {
        return JSON.stringify(part);
      }
      return String(part);
    }).join(':');

    // Create a simple hash for shorter keys
    return `${prefix}:${this.hashString(serialized)}`;
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    let count = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry, now)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.log('Pruned', count, 'expired entries');
    }

    return count;
  }

  /**
   * Get or set cached value with a factory function
   */
  async getOrSet(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Generate new value
    const value = await factory();
    
    // Store in cache
    this.set(key, value, ttl);
    
    return value;
  }

  /**
   * Warm up cache with pre-computed values
   */
  warmUp(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
    this.log('Warmed up cache with', entries.length, 'entries');
  }

  /**
   * Export cache to JSON for persistence
   */
  export(): string {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      data: entry.data,
      timestamp: entry.timestamp,
      ttl: entry.ttl
    }));

    return JSON.stringify({
      entries,
      stats: this.stats,
      exportedAt: Date.now()
    });
  }

  /**
   * Import cache from JSON
   */
  import(json: string): void {
    try {
      const imported = JSON.parse(json);
      const now = Date.now();

      imported.entries.forEach((entry: any) => {
        // Only import non-expired entries
        const age = now - entry.timestamp;
        if (age < entry.ttl) {
          this.cache.set(entry.key, {
            key: entry.key,
            data: entry.data,
            timestamp: entry.timestamp,
            ttl: entry.ttl
          });
        }
      });

      this.log('Imported', this.cache.size, 'cache entries');
    } catch (error) {
      console.error('Failed to import cache:', error);
    }
  }

  // Private methods

  private isExpired(entry: CacheEntry<T>, now: number = Date.now()): boolean {
    return now - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.log('Evicted oldest entry:', oldestKey);
    }
  }

  private startCleanupInterval(): void {
    // Run cleanup every minute
    setInterval(() => {
      this.prune();
    }, 60 * 1000);
  }

  private log(...args: any[]): void {
    if (this.enableLogging) {
      console.log('[FilterCache]', ...args);
    }
  }

  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Singleton cache instance for filter results
 */
export class FilterResultCache extends FilterCache<any> {
  private static instance: FilterResultCache;

  private constructor() {
    super({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      enableLogging: false
    });
  }

  static getInstance(): FilterResultCache {
    if (!FilterResultCache.instance) {
      FilterResultCache.instance = new FilterResultCache();
    }
    return FilterResultCache.instance;
  }
}

/**
 * Singleton cache instance for filter counts
 */
export class FilterCountCache extends FilterCache<number> {
  private static instance: FilterCountCache;

  private constructor() {
    super({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 200,
      enableLogging: false
    });
  }

  static getInstance(): FilterCountCache {
    if (!FilterCountCache.instance) {
      FilterCountCache.instance = new FilterCountCache();
    }
    return FilterCountCache.instance;
  }
}

export default FilterCache;
