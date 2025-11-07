// Real-time Search with Performance Optimization
import { SearchManager } from './search-manager';
import { FilterProcessor, FilterOptions, SortOptions, PaginationOptions } from './filter-processor';
import { SearchResult, SearchFilters } from './types';

export interface SearchPerformanceMetrics {
  queryTime: number;
  resultCount: number;
  cacheHit: boolean;
  queryComplexity: number;
  timestamp: number;
}

export interface RealTimeSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxResults?: number;
  enableCaching?: boolean;
  cacheTimeout?: number;
  enableMetrics?: boolean;
}

export interface SearchState {
  query: string;
  filters: FilterOptions;
  sortOptions: SortOptions;
  paginationOptions: PaginationOptions;
  isLoading: boolean;
  results: SearchResult[];
  totalCount: number;
  error?: string;
  metrics?: SearchPerformanceMetrics;
}

export type SearchStateListener = (state: SearchState) => void;

export class RealTimeSearch {
  private searchManager: SearchManager;
  private debounceTimer: NodeJS.Timeout | null = null;
  private queryCache = new Map<string, { results: SearchResult[]; timestamp: number; metrics: SearchPerformanceMetrics }>();
  private listeners = new Set<SearchStateListener>();
  private currentState: SearchState;
  private options: Required<RealTimeSearchOptions>;
  private performanceMetrics: SearchPerformanceMetrics[] = [];

  constructor(
    searchManager: SearchManager,
    options: RealTimeSearchOptions = {}
  ) {
    this.searchManager = searchManager;
    this.options = {
      debounceMs: 300,
      minQueryLength: 2,
      maxResults: 50,
      enableCaching: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      enableMetrics: true,
      ...options
    };

    this.currentState = {
      query: '',
      filters: {},
      sortOptions: { field: 'relevance', direction: 'asc' },
      paginationOptions: { page: 1, pageSize: this.options.maxResults },
      isLoading: false,
      results: [],
      totalCount: 0
    };
  }

  /**
   * Subscribe to search state changes
   */
  subscribe(listener: SearchStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Perform real-time search with debouncing
   */
  search(
    query: string,
    filters: FilterOptions = {},
    sortOptions?: SortOptions,
    paginationOptions?: PaginationOptions
  ): void {
    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Update state immediately for UI feedback
    this.updateState({
      query,
      filters,
      sortOptions: sortOptions || this.currentState.sortOptions,
      paginationOptions: paginationOptions || this.currentState.paginationOptions,
      isLoading: query.length >= this.options.minQueryLength,
      error: undefined
    });

    // Skip search if query is too short
    if (query.length < this.options.minQueryLength) {
      this.updateState({
        results: [],
        totalCount: 0,
        isLoading: false
      });
      return;
    }

    // Debounce the actual search
    this.debounceTimer = setTimeout(() => {
      this.performSearch();
    }, this.options.debounceMs);
  }

  /**
   * Perform instant search (no debouncing)
   */
  async searchInstant(
    query: string,
    filters: FilterOptions = {},
    sortOptions?: SortOptions,
    paginationOptions?: PaginationOptions
  ): Promise<SearchResult[]> {
    this.updateState({
      query,
      filters,
      sortOptions: sortOptions || this.currentState.sortOptions,
      paginationOptions: paginationOptions || this.currentState.paginationOptions,
      isLoading: true,
      error: undefined
    });

    try {
      const results = await this.executeSearch();
      return results;
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false
      });
      return [];
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (query.length < 2) {
      return [];
    }

    try {
      return await this.searchManager.getSearchSuggestions(query, limit);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Clear search results
   */
  clear(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.updateState({
      query: '',
      filters: {},
      results: [],
      totalCount: 0,
      isLoading: false,
      error: undefined
    });
  }

  /**
   * Get current search state
   */
  getState(): SearchState {
    return { ...this.currentState };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    averageQueryTime: number;
    cacheHitRate: number;
    totalQueries: number;
    recentMetrics: SearchPerformanceMetrics[];
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        averageQueryTime: 0,
        cacheHitRate: 0,
        totalQueries: 0,
        recentMetrics: []
      };
    }

    const totalQueries = this.performanceMetrics.length;
    const averageQueryTime = this.performanceMetrics.reduce((sum, m) => sum + m.queryTime, 0) / totalQueries;
    const cacheHits = this.performanceMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = cacheHits / totalQueries;

    return {
      averageQueryTime,
      cacheHitRate,
      totalQueries,
      recentMetrics: this.performanceMetrics.slice(-10) // Last 10 queries
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.queryCache.clear();
    this.searchManager.clearCache();
  }

  /**
   * Optimize performance settings based on metrics
   */
  optimizePerformance(): void {
    const metrics = this.getPerformanceMetrics();
    
    if (metrics.averageQueryTime > 100) {
      // Increase debounce time for slow queries
      this.options.debounceMs = Math.min(this.options.debounceMs * 1.2, 1000);
    } else if (metrics.averageQueryTime < 50 && this.options.debounceMs > 200) {
      // Decrease debounce time for fast queries
      this.options.debounceMs = Math.max(this.options.debounceMs * 0.8, 200);
    }

    if (metrics.cacheHitRate < 0.3) {
      // Increase cache timeout if hit rate is low
      this.options.cacheTimeout = Math.min(this.options.cacheTimeout * 1.5, 15 * 60 * 1000);
    }
  }

  // Private methods

  private async performSearch(): Promise<void> {
    try {
      await this.executeSearch();
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Search failed',
        isLoading: false
      });
    }
  }

  private async executeSearch(): Promise<SearchResult[]> {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey();
    
    // Check cache first
    if (this.options.enableCaching) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        const endTime = performance.now();
        const metrics: SearchPerformanceMetrics = {
          queryTime: endTime - startTime,
          resultCount: cached.results.length,
          cacheHit: true,
          queryComplexity: this.calculateQueryComplexity(),
          timestamp: Date.now()
        };

        this.recordMetrics(metrics);
        
        this.updateState({
          results: cached.results,
          totalCount: cached.results.length,
          isLoading: false,
          metrics
        });

        return cached.results;
      }
    }

    // Perform actual search
    const rawResults = await this.searchManager.searchAll(
      this.currentState.query,
      this.currentState.filters,
      {
        limit: this.options.maxResults * 2, // Get more results for filtering
        sortBy: this.currentState.sortOptions.field,
        sortOrder: this.currentState.sortOptions.direction
      }
    );

    // Process results with filtering and pagination
    const processedResults = FilterProcessor.processResults(
      rawResults,
      this.currentState.filters,
      this.currentState.sortOptions,
      this.currentState.paginationOptions
    );

    const endTime = performance.now();
    const metrics: SearchPerformanceMetrics = {
      queryTime: endTime - startTime,
      resultCount: processedResults.results.length,
      cacheHit: false,
      queryComplexity: this.calculateQueryComplexity(),
      timestamp: Date.now()
    };

    this.recordMetrics(metrics);

    // Cache results
    if (this.options.enableCaching) {
      this.setCache(cacheKey, processedResults.results, metrics);
    }

    this.updateState({
      results: processedResults.results,
      totalCount: processedResults.totalCount,
      isLoading: false,
      metrics
    });

    return processedResults.results;
  }

  private updateState(updates: Partial<SearchState>): void {
    this.currentState = { ...this.currentState, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error in search state listener:', error);
      }
    });
  }

  private getCacheKey(): string {
    return JSON.stringify({
      query: this.currentState.query,
      filters: this.currentState.filters,
      sort: this.currentState.sortOptions,
      pagination: this.currentState.paginationOptions
    });
  }

  private getFromCache(key: string): { results: SearchResult[]; metrics: SearchPerformanceMetrics } | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.options.cacheTimeout) {
      return { results: cached.results, metrics: cached.metrics };
    }
    if (cached) {
      this.queryCache.delete(key);
    }
    return null;
  }

  private setCache(key: string, results: SearchResult[], metrics: SearchPerformanceMetrics): void {
    // Limit cache size
    if (this.queryCache.size >= 100) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(key, {
      results,
      timestamp: Date.now(),
      metrics
    });
  }

  private calculateQueryComplexity(): number {
    let complexity = 0;
    
    // Base complexity from query length
    complexity += this.currentState.query.length * 0.1;
    
    // Filter complexity
    const filterCount = Object.keys(this.currentState.filters).length;
    complexity += filterCount * 2;
    
    // Boolean operators
    const booleanMatches = this.currentState.query.match(/\b(AND|OR|NOT)\b/gi);
    if (booleanMatches) {
      complexity += booleanMatches.length * 3;
    }
    
    // Wildcards
    const wildcardMatches = this.currentState.query.match(/\*/g);
    if (wildcardMatches) {
      complexity += wildcardMatches.length * 2;
    }
    
    return Math.round(complexity);
  }

  private recordMetrics(metrics: SearchPerformanceMetrics): void {
    if (!this.options.enableMetrics) {
      return;
    }

    this.performanceMetrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }

    // Auto-optimize performance periodically
    if (this.performanceMetrics.length % 10 === 0) {
      this.optimizePerformance();
    }
  }
}

/**
 * Hook for React components to use real-time search
 */
export function useRealTimeSearch(
  searchManager: SearchManager,
  options?: RealTimeSearchOptions
) {
  const realTimeSearch = new RealTimeSearch(searchManager, options);
  
  return {
    search: realTimeSearch.search.bind(realTimeSearch),
    searchInstant: realTimeSearch.searchInstant.bind(realTimeSearch),
    getSuggestions: realTimeSearch.getSuggestions.bind(realTimeSearch),
    clear: realTimeSearch.clear.bind(realTimeSearch),
    subscribe: realTimeSearch.subscribe.bind(realTimeSearch),
    getState: realTimeSearch.getState.bind(realTimeSearch),
    getPerformanceMetrics: realTimeSearch.getPerformanceMetrics.bind(realTimeSearch),
    clearCache: realTimeSearch.clearCache.bind(realTimeSearch)
  };
}

export default RealTimeSearch;