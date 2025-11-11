// Optimized filter count calculator with debouncing and caching
import { FilterConfig } from './types';
import { FilterCountCache } from './FilterCache';

export interface CountResult {
  count: number;
  isStale: boolean;
  timestamp: number;
}

export interface CountOptions {
  debounceMs?: number;
  useWorker?: boolean;
  showStaleData?: boolean;
  cacheResults?: boolean;
}

export class FilterCountOptimizer {
  private cache: FilterCountCache;
  private worker: Worker | null = null;
  private pendingRequests: Map<string, {
    resolve: (result: CountResult) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private workerMessageId = 0;

  constructor() {
    this.cache = FilterCountCache.getInstance();
    this.initializeWorker();
  }

  /**
   * Initialize Web Worker for heavy calculations
   */
  private initializeWorker(): void {
    try {
      // Create worker from inline code
      const workerCode = `
        self.onmessage = (event) => {
          const { type, payload, id } = event.data;
          
          try {
            if (type === 'ESTIMATE_RESULTS') {
              const { config, data } = payload;
              let count = data.length;
              
              // Simple estimation logic
              if (config.textFilters && config.textFilters.length > 0) {
                count = Math.floor(count * 0.7); // Estimate 70% match
              }
              
              if (config.dateFilters && config.dateFilters.length > 0) {
                count = Math.floor(count * 0.8); // Estimate 80% match
              }
              
              self.postMessage({
                type: 'ESTIMATE_RESULT',
                payload: { count },
                id
              });
            }
          } catch (error) {
            self.postMessage({
              type: 'ERROR',
              payload: { error: error.message },
              id
            });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (event) => {
        this.handleWorkerMessage(event.data);
      };

      this.worker.onerror = (error) => {
        console.error('Worker error:', error);
        this.worker = null;
      };
    } catch (error) {
      console.warn('Failed to initialize Web Worker:', error);
      this.worker = null;
    }
  }

  /**
   * Handle messages from Web Worker
   */
  private handleWorkerMessage(data: any): void {
    const { type, payload, id } = data;
    const pending = this.pendingRequests.get(id);

    if (!pending) {
      return;
    }

    this.pendingRequests.delete(id);

    if (type === 'ERROR') {
      pending.reject(new Error(payload.error));
    } else if (type === 'ESTIMATE_RESULT') {
      pending.resolve({
        count: payload.count,
        isStale: false,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Calculate filter count with debouncing
   */
  async calculateCount(
    config: FilterConfig,
    executeQuery: (sql: string, params: any[]) => Promise<any[]>,
    options: CountOptions = {}
  ): Promise<CountResult> {
    const {
      debounceMs = 200,
      useWorker = false,
      showStaleData = true,
      cacheResults = true
    } = options;

    const cacheKey = this.generateCacheKey(config);

    // Return cached result if available
    if (cacheResults) {
      const cached = this.cache.get(cacheKey);
      if (cached !== null) {
        return {
          count: cached,
          isStale: false,
          timestamp: Date.now()
        };
      }
    }

    // Show stale data while calculating
    if (showStaleData) {
      const staleResult = this.getStaleResult(cacheKey);
      if (staleResult) {
        // Start calculation in background
        this.debouncedCalculate(
          cacheKey,
          config,
          executeQuery,
          debounceMs,
          useWorker,
          cacheResults
        );
        return staleResult;
      }
    }

    // Calculate with debouncing
    return this.debouncedCalculate(
      cacheKey,
      config,
      executeQuery,
      debounceMs,
      useWorker,
      cacheResults
    );
  }

  /**
   * Debounced calculation
   */
  private debouncedCalculate(
    cacheKey: string,
    config: FilterConfig,
    executeQuery: (sql: string, params: any[]) => Promise<any[]>,
    debounceMs: number,
    useWorker: boolean,
    cacheResults: boolean
  ): Promise<CountResult> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(cacheKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(cacheKey);

        try {
          const result = useWorker && this.worker
            ? await this.calculateWithWorker(config)
            : await this.calculateDirect(config, executeQuery);

          if (cacheResults) {
            this.cache.set(cacheKey, result.count);
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);

      this.debounceTimers.set(cacheKey, timer);
    });
  }

  /**
   * Calculate count using Web Worker
   */
  private calculateWithWorker(config: FilterConfig): Promise<CountResult> {
    if (!this.worker) {
      throw new Error('Web Worker not available');
    }

    return new Promise((resolve, reject) => {
      const id = `msg_${this.workerMessageId++}`;
      
      this.pendingRequests.set(id, { resolve, reject });

      this.worker!.postMessage({
        type: 'ESTIMATE_RESULTS',
        payload: { config, data: [] },
        id
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Calculate count directly (without worker)
   */
  private async calculateDirect(
    config: FilterConfig,
    executeQuery: (sql: string, params: any[]) => Promise<any[]>
  ): Promise<CountResult> {
    // Build count query
    const countQuery = this.buildCountQuery(config);
    
    try {
      const result = await executeQuery(countQuery.sql, countQuery.params);
      const count = result[0]?.count || 0;

      return {
        count,
        isStale: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Failed to calculate count:', error);
      return {
        count: 0,
        isStale: false,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Build SQL count query
   */
  private buildCountQuery(config: FilterConfig): { sql: string; params: any[] } {
    const params: any[] = [];
    const conditions: string[] = [];
    const table = this.getTableName(config.type);

    // Add text filters
    if (config.textFilters && config.textFilters.length > 0) {
      config.textFilters.forEach(filter => {
        params.push(`%${filter.value}%`);
        conditions.push(`${filter.field} LIKE ?`);
      });
    }

    // Add date filters
    if (config.dateFilters && config.dateFilters.length > 0) {
      config.dateFilters.forEach(filter => {
        if (filter.startDate) {
          params.push(filter.startDate.toISOString().split('T')[0]);
          conditions.push(`${filter.field} >= ?`);
        }
        if (filter.endDate) {
          params.push(filter.endDate.toISOString().split('T')[0]);
          conditions.push(`${filter.field} <= ?`);
        }
      });
    }

    // Add range filters
    if (config.rangeFilters && config.rangeFilters.length > 0) {
      config.rangeFilters.forEach(filter => {
        params.push(filter.min, filter.max);
        conditions.push(`${filter.field} BETWEEN ? AND ?`);
      });
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(` ${config.operator} `)}`
      : '';

    const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;

    return { sql, params };
  }

  /**
   * Get stale cached result
   */
  private getStaleResult(cacheKey: string): CountResult | null {
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      return {
        count: cached,
        isStale: true,
        timestamp: Date.now()
      };
    }
    return null;
  }

  /**
   * Generate cache key from filter config
   */
  private generateCacheKey(config: FilterConfig): string {
    return `count:${JSON.stringify(config)}`;
  }

  /**
   * Batch calculate counts for multiple filters
   */
  async batchCalculateCounts(
    configs: FilterConfig[],
    executeQuery: (sql: string, params: any[]) => Promise<any[]>,
    options: CountOptions = {}
  ): Promise<Map<string, CountResult>> {
    const results = new Map<string, CountResult>();

    // Calculate all counts in parallel
    const promises = configs.map(async (config) => {
      const cacheKey = this.generateCacheKey(config);
      const result = await this.calculateCount(config, executeQuery, options);
      results.set(cacheKey, result);
    });

    await Promise.all(promises);

    return results;
  }

  /**
   * Invalidate cached counts
   */
  invalidateCache(pattern?: string): void {
    if (pattern) {
      this.cache.invalidatePattern(pattern);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Clear pending requests
    this.pendingRequests.clear();
  }

  private getTableName(type: string): string {
    switch (type) {
      case 'alumni':
        return 'alumni';
      case 'publication':
        return 'publications';
      case 'photo':
        return 'photos';
      case 'faculty':
        return 'faculty';
      default:
        return 'alumni';
    }
  }
}

export default FilterCountOptimizer;
