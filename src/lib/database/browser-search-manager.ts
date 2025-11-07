// Browser-Compatible Search Manager
import { BrowserDatabaseManager } from './browser-database-manager';
import { SearchResult, SearchFilters, SearchOptions } from './types';

export interface BrowserSearchOptions extends SearchOptions {
  enableMockData?: boolean;
  mockDataDelay?: number;
  limit?: number;
}

export interface ErrorRecoveryState {
  hasError: boolean;
  errorType?: 'CONNECTION' | 'SEARCH' | 'TIMEOUT' | 'MEMORY' | 'UNKNOWN';
  errorMessage?: string;
  canRecover: boolean;
  recoveryActions: string[];
  isRecovering: boolean;
  lastError?: Date;
  errorCount: number;
}

export class BrowserSearchManager {
  private dbManager: BrowserDatabaseManager;
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private errorRecoveryState: ErrorRecoveryState;
  private maxRetries = 3;
  private retryDelay = 1000;
  private circuitBreakerThreshold = 5;
  private circuitBreakerTimeout = 30000; // 30 seconds
  private isCircuitBreakerOpen = false;
  private lastCircuitBreakerReset = Date.now();

  constructor(dbManager?: BrowserDatabaseManager) {
    this.dbManager = dbManager || new BrowserDatabaseManager();
    this.errorRecoveryState = {
      hasError: false,
      canRecover: true,
      recoveryActions: [],
      isRecovering: false,
      errorCount: 0
    };
  }

  async initialize(): Promise<void> {
    await this.dbManager.initialize();
  }

  async searchAll(
    query: string, 
    filters: SearchFilters = {}, 
    options: BrowserSearchOptions = {}
  ): Promise<SearchResult[]> {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen) {
      if (Date.now() - this.lastCircuitBreakerReset > this.circuitBreakerTimeout) {
        this.resetCircuitBreaker();
      } else {
        return this.getFallbackResults(query, filters);
      }
    }

    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.createCacheKey(query, filters);
    const cached = this.searchCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.results;
    }

    // Attempt search with retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Simulate network delay if requested
        if (options.mockDataDelay) {
          await new Promise(resolve => setTimeout(resolve, options.mockDataDelay));
        }

        // Perform search using mock data
        const results = await this.performSearchWithTimeout(query, filters, 5000); // 5 second timeout
        
        // Apply options
        let finalResults = results;
        
        if (options.limit) {
          finalResults = results.slice(0, options.limit);
        }

        // Cache results
        this.searchCache.set(cacheKey, {
          results: finalResults,
          timestamp: Date.now()
        });

        // Clean old cache entries
        this.cleanCache();

        // Reset error state on successful search
        this.resetErrorState();

        return finalResults;
      } catch (error) {
        console.error(`Search attempt ${attempt} failed:`, error);
        
        // Record error
        this.recordError(error);
        
        // If this is the last attempt, try fallback
        if (attempt === this.maxRetries) {
          console.warn('All search attempts failed, using fallback');
          return this.getFallbackResults(query, filters);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    // This should never be reached, but just in case
    return this.getFallbackResults(query, filters);
  }

  async searchAlumni(
    query: string, 
    filters: SearchFilters = {}, 
    options: BrowserSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.searchAll(query, { ...filters, type: 'alumni' }, options);
  }

  async searchPublications(
    query: string, 
    filters: SearchFilters = {}, 
    options: BrowserSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.searchAll(query, { ...filters, type: 'publication' }, options);
  }

  async searchPhotos(
    query: string, 
    filters: SearchFilters = {}, 
    options: BrowserSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.searchAll(query, { ...filters, type: 'photo' }, options);
  }

  async searchFaculty(
    query: string, 
    filters: SearchFilters = {}, 
    options: BrowserSearchOptions = {}
  ): Promise<SearchResult[]> {
    return this.searchAll(query, { ...filters, type: 'faculty' }, options);
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (query.length < 2) return [];

    const mockData = this.dbManager.getMockData();
    const suggestions = new Set<string>();

    // Extract suggestions from titles and content
    mockData.forEach(item => {
      const words = `${item.title} ${item.content}`.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.includes(query.toLowerCase()) && word.length > 2) {
          suggestions.add(word);
        }
      });

      // Add exact title matches
      if (item.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(item.title);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  }

  // Health check method
  async healthCheck(): Promise<{ isHealthy: boolean; message: string }> {
    try {
      if (!this.dbManager.isConnected()) {
        return { isHealthy: false, message: 'Database not connected' };
      }

      // Test a simple search
      await this.searchAll('test', {}, { limit: 1 });
      
      return { isHealthy: true, message: 'Search system is operational' };
    } catch (error) {
      return { 
        isHealthy: false, 
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Performance metrics
  getPerformanceMetrics() {
    return {
      cacheSize: this.searchCache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      averageQueryTime: 50, // Mock value for browser environment
      totalQueries: this.searchCache.size
    };
  }

  private createCacheKey(query: string, filters: SearchFilters): string {
    return `${query}:${JSON.stringify(filters)}`;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }

  private calculateCacheHitRate(): number {
    // This would be calculated based on actual cache hits vs misses
    // For now, return a mock value
    return 0.75; // 75% cache hit rate
  }

  // Clear cache manually
  clearCache(): void {
    this.searchCache.clear();
  }

  // Error recovery methods
  private async performSearchWithTimeout(query: string, filters: SearchFilters, timeout: number): Promise<SearchResult[]> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Search timeout'));
      }, timeout);

      try {
        const results = await this.dbManager.searchMockData(query, filters);
        clearTimeout(timeoutId);
        resolve(results);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private recordError(error: any): void {
    this.errorRecoveryState.hasError = true;
    this.errorRecoveryState.errorCount++;
    this.errorRecoveryState.lastError = new Date();
    this.errorRecoveryState.errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Determine error type
    if (error.message?.includes('timeout')) {
      this.errorRecoveryState.errorType = 'TIMEOUT';
    } else if (error.message?.includes('connection')) {
      this.errorRecoveryState.errorType = 'CONNECTION';
    } else if (error.message?.includes('memory')) {
      this.errorRecoveryState.errorType = 'MEMORY';
    } else {
      this.errorRecoveryState.errorType = 'UNKNOWN';
    }

    // Update recovery actions
    this.errorRecoveryState.recoveryActions = this.getRecoveryActions();

    // Check if circuit breaker should open
    if (this.errorRecoveryState.errorCount >= this.circuitBreakerThreshold) {
      this.openCircuitBreaker();
    }
  }

  private resetErrorState(): void {
    this.errorRecoveryState = {
      hasError: false,
      canRecover: true,
      recoveryActions: [],
      isRecovering: false,
      errorCount: 0
    };
  }

  private getRecoveryActions(): string[] {
    const actions = [];
    
    switch (this.errorRecoveryState.errorType) {
      case 'TIMEOUT':
        actions.push('Retry with longer timeout');
        actions.push('Use cached results if available');
        actions.push('Switch to simplified search');
        break;
      case 'CONNECTION':
        actions.push('Check network connection');
        actions.push('Reinitialize database connection');
        actions.push('Use offline mode');
        break;
      case 'MEMORY':
        actions.push('Clear search cache');
        actions.push('Reduce result set size');
        actions.push('Restart search service');
        break;
      default:
        actions.push('Retry search operation');
        actions.push('Use fallback search method');
        actions.push('Contact system administrator');
    }
    
    return actions;
  }

  private openCircuitBreaker(): void {
    this.isCircuitBreakerOpen = true;
    this.lastCircuitBreakerReset = Date.now();
    console.warn('Circuit breaker opened due to repeated failures');
  }

  private resetCircuitBreaker(): void {
    this.isCircuitBreakerOpen = false;
    this.errorRecoveryState.errorCount = 0;
    console.info('Circuit breaker reset, attempting normal operation');
  }

  private getFallbackResults(query: string, filters: SearchFilters): SearchResult[] {
    console.info('Using fallback search results');
    
    // Return a basic set of fallback results
    const fallbackResults: SearchResult[] = [
      {
        id: 'fallback_001',
        type: 'alumni',
        title: 'Search Service Temporarily Unavailable',
        snippet: 'The search service is currently experiencing issues. Please try again later or contact support.',
        score: 1.0,
        metadata: {
          isFallback: true,
          message: 'This is a fallback result due to search service issues'
        }
      }
    ];

    // If we have cached results for similar queries, return those
    for (const [cacheKey, cached] of this.searchCache.entries()) {
      if (cacheKey.includes(query.toLowerCase())) {
        console.info('Found similar cached results for fallback');
        return cached.results;
      }
    }

    return fallbackResults;
  }

  // Auto-recovery methods
  async attemptAutoRecovery(): Promise<boolean> {
    if (!this.errorRecoveryState.hasError) {
      return true;
    }

    this.errorRecoveryState.isRecovering = true;
    
    try {
      console.info('Attempting auto-recovery...');
      
      // Clear cache to free memory
      this.clearCache();
      
      // Reinitialize database manager
      await this.dbManager.initialize();
      
      // Test with a simple search
      await this.dbManager.searchMockData('test', {});
      
      // Reset error state
      this.resetErrorState();
      this.resetCircuitBreaker();
      
      console.info('Auto-recovery successful');
      return true;
    } catch (error) {
      console.error('Auto-recovery failed:', error);
      this.errorRecoveryState.isRecovering = false;
      return false;
    }
  }

  // Get current error recovery state
  getErrorRecoveryState(): ErrorRecoveryState {
    return { ...this.errorRecoveryState };
  }

  // Get available filter options based on mock data
  getFilterOptions() {
    const mockData = this.dbManager.getMockData();
    
    const departments = new Set<string>();
    const years = new Set<number>();
    const types = new Set<string>();
    const collections = new Set<string>();
    
    mockData.forEach(item => {
      if (item.metadata.department) departments.add(item.metadata.department);
      if (item.metadata.year) years.add(item.metadata.year);
      if (item.type) types.add(item.type);
      if (item.metadata.collection) collections.add(item.metadata.collection);
    });

    return {
      departments: Array.from(departments).sort(),
      years: Array.from(years).sort((a, b) => b - a),
      types: Array.from(types).sort(),
      collections: Array.from(collections).sort(),
      yearRanges: [
        { start: Math.min(...years), end: Math.max(...years) }
      ]
    };
  }
}