// Enhanced Search Manager with Error Handling and Recovery
import { SearchManager } from './search-manager';
import { FallbackSearchManager } from './fallback-search';
import { IndexManager } from './index-manager';
import { DatabaseManager } from './manager';
import { DatabaseConnection } from './connection';
import { 
  SearchResult, 
  SearchFilters, 
  DatabaseError 
} from './types';

export interface SearchRecoveryOptions {
  enableFallback?: boolean;
  autoRebuildIndex?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SearchError extends Error {
  type: 'FTS5_ERROR' | 'INDEX_CORRUPT' | 'CONNECTION_ERROR' | 'TIMEOUT' | 'MEMORY_ERROR' | 'SECURITY_ERROR' | 'UNKNOWN';
  originalError?: Error;
  canRecover?: boolean;
  recoveryActions?: string[];
}

export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  issues: HealthIssue[];
  performance: {
    averageQueryTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}

export interface HealthIssue {
  type: 'PERFORMANCE' | 'ERROR' | 'RESOURCE' | 'INDEX';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  autoFixable: boolean;
}

export class EnhancedSearchManager {
  private searchManager: SearchManager | null = null;
  private fallbackManager: FallbackSearchManager;
  private indexManager: IndexManager;
  private dbManager: DatabaseManager;
  private dbConnection: DatabaseConnection | null = null;
  private recoveryOptions: SearchRecoveryOptions;
  private isRecovering = false;
  private lastError: SearchError | null = null;
  private healthStatus: HealthStatus;
  private performanceMetrics: {
    queryTimes: number[];
    errorCount: number;
    totalQueries: number;
    cacheHits: number;
  };

  constructor(
    dbManager: DatabaseManager, 
    options: SearchRecoveryOptions = {}
  ) {
    this.dbManager = dbManager;
    this.fallbackManager = new FallbackSearchManager(dbManager);
    
    // Create a DatabaseConnection for IndexManager
    // For now, we'll create a minimal connection wrapper
    this.dbConnection = this.createConnectionWrapper(dbManager);
    this.indexManager = new IndexManager(this.dbConnection);
    
    this.recoveryOptions = {
      enableFallback: true,
      autoRebuildIndex: true,
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };

    // Initialize performance tracking
    this.performanceMetrics = {
      queryTimes: [],
      errorCount: 0,
      totalQueries: 0,
      cacheHits: 0
    };

    this.healthStatus = {
      isHealthy: true,
      lastCheck: new Date(),
      issues: [],
      performance: {
        averageQueryTime: 0,
        errorRate: 0,
        cacheHitRate: 0
      }
    };

    // Initialize SearchManager when needed
    this.initializeSearchManager();
  }

  /**
   * Create a minimal DatabaseConnection wrapper for IndexManager
   */
  private createConnectionWrapper(dbManager: DatabaseManager): DatabaseConnection {
    // For now, return the singleton DatabaseConnection instance
    // In a real implementation, this would be properly configured
    return DatabaseConnection.getInstance();
  }

  private async initializeSearchManager() {
    try {
      // For now, we'll use the fallback manager for all searches
      // In a real implementation, you'd create a proper DatabaseConnection
      this.searchManager = null; // Disable FTS5 search for now
    } catch (error) {
      console.error('Failed to initialize SearchManager:', error);
      this.searchManager = null;
    }
  }

  /**
   * Enhanced search with automatic error recovery
   */
  async searchAll(
    query: string,
    filters?: SearchFilters,
    options: any = {}
  ): Promise<SearchResult[]> {
    const startTime = Date.now();
    let attempt = 0;
    let wasError = false;
    let cacheHit = false;
    const maxRetries = this.recoveryOptions.maxRetries || 3;

    while (attempt <= maxRetries) {
      try {
        // Try normal FTS5 search first (if available)
        if (this.searchManager) {
          const results = await this.searchManager.searchAll(query, filters, options);
          
          // Clear any previous errors on success
          this.lastError = null;
          this.isRecovering = false;
          
          // Track performance
          const queryTime = Date.now() - startTime;
          this.trackQueryPerformance(queryTime, wasError, cacheHit);
          
          return results;
        } else {
          // Use fallback search directly
          const results = await this.fallbackSearch(query, filters, options);
          
          // Track performance
          const queryTime = Date.now() - startTime;
          this.trackQueryPerformance(queryTime, wasError, cacheHit);
          
          return results;
        }
      } catch (error) {
        wasError = true;
        const searchError = this.classifyError(error);
        this.lastError = searchError;
        
        console.error(`Search attempt ${attempt + 1} failed:`, searchError);
        
        // Try recovery strategies
        const recovered = await this.attemptRecovery(searchError, query, filters, options);
        if (recovered) {
          // Track performance for successful recovery
          const queryTime = Date.now() - startTime;
          this.trackQueryPerformance(queryTime, false, cacheHit);
          return recovered;
        }
        
        attempt++;
        
        // If not the last attempt, wait before retrying
        if (attempt <= maxRetries) {
          await this.delay(this.recoveryOptions.retryDelay || 1000);
        }
      }
    }

    // Track failed query
    const queryTime = Date.now() - startTime;
    this.trackQueryPerformance(queryTime, true, cacheHit);

    // All attempts failed, throw the last error
    throw this.lastError || new Error('Search failed after all recovery attempts');
  }

  /**
   * Get search suggestions with fallback
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      if (this.searchManager) {
        return await this.searchManager.getSearchSuggestions(query, limit);
      } else {
        throw new Error('SearchManager not available');
      }
    } catch (error) {
      console.warn('Search suggestions failed, using fallback:', error);
      
      // Simple fallback suggestions based on common terms
      const commonTerms = [
        'graduation', 'class', 'alumni', 'faculty', 'law review', 
        'amicus', 'photos', 'publications', 'staff', 'professor'
      ];
      
      const queryLower = query.toLowerCase();
      return commonTerms
        .filter(term => term.includes(queryLower))
        .slice(0, limit);
    }
  }

  /**
   * Classify error type for appropriate recovery strategy
   */
  private classifyError(error: any): SearchError {
    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';
    
    let errorType: SearchError['type'] = 'UNKNOWN';
    let canRecover = false;
    let recoveryActions: string[] = [];

    // FTS5 specific errors
    if (message.includes('fts5') || message.includes('full-text') || message.includes('virtual table')) {
      errorType = 'FTS5_ERROR';
      canRecover = true;
      recoveryActions = ['Use fallback search', 'Rebuild FTS5 indexes', 'Check FTS5 extension'];
    } 
    // Database corruption errors
    else if (message.includes('corrupt') || message.includes('malformed') || message.includes('database disk image is malformed')) {
      errorType = 'INDEX_CORRUPT';
      canRecover = true;
      recoveryActions = ['Rebuild search indexes', 'Use fallback search', 'Restore from backup'];
    } 
    // Connection and database access errors
    else if (message.includes('connection') || message.includes('database') || message.includes('sqlite') || message.includes('locked')) {
      errorType = 'CONNECTION_ERROR';
      canRecover = true;
      recoveryActions = ['Reconnect to database', 'Retry with backoff', 'Use cached results'];
    } 
    // Timeout and performance errors
    else if (message.includes('timeout') || message.includes('too long') || message.includes('aborted')) {
      errorType = 'TIMEOUT';
      canRecover = true;
      recoveryActions = ['Retry with simpler query', 'Reduce result limit', 'Use fallback search'];
    }
    // Memory and resource errors
    else if (message.includes('memory') || message.includes('out of') || message.includes('allocation')) {
      errorType = 'MEMORY_ERROR';
      canRecover = true;
      recoveryActions = ['Clear cache', 'Reduce query complexity', 'Garbage collection'];
    }
    // Security and validation errors
    else if (message.includes('injection') || message.includes('invalid') || message.includes('malicious')) {
      errorType = 'SECURITY_ERROR';
      canRecover = false;
      recoveryActions = ['Log security event', 'Block request', 'Alert administrator'];
    }

    const searchError: SearchError = new Error(error.message) as SearchError;
    searchError.type = errorType;
    searchError.originalError = error;
    searchError.canRecover = canRecover;
    searchError.recoveryActions = recoveryActions;
    searchError.name = 'SearchError';

    return searchError;
  }

  /**
   * Attempt to recover from search errors
   */
  private async attemptRecovery(
    error: SearchError,
    query: string,
    filters?: SearchFilters,
    options: any = {}
  ): Promise<SearchResult[] | null> {
    if (this.isRecovering) {
      return null; // Prevent recursive recovery attempts
    }

    this.isRecovering = true;

    try {
      switch (error.type) {
        case 'FTS5_ERROR':
        case 'INDEX_CORRUPT':
          return await this.recoverFromIndexError(query, filters, options);
          
        case 'CONNECTION_ERROR':
          return await this.recoverFromConnectionError(query, filters, options);
          
        case 'TIMEOUT':
          return await this.recoverFromTimeout(query, filters, options);
          
        default:
          return await this.fallbackSearch(query, filters, options);
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return null;
    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Recover from FTS5 or index corruption errors
   */
  private async recoverFromIndexError(
    query: string,
    filters?: SearchFilters,
    options: any = {}
  ): Promise<SearchResult[] | null> {
    console.log('Attempting recovery from index error...');

    // First, try fallback search
    if (this.recoveryOptions.enableFallback) {
      try {
        const fallbackResults = await this.fallbackSearch(query, filters, options);
        
        // Schedule index rebuild in background if auto-rebuild is enabled
        if (this.recoveryOptions.autoRebuildIndex) {
          this.scheduleIndexRebuild();
        }
        
        return fallbackResults;
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
      }
    }

    // If fallback fails and auto-rebuild is enabled, try rebuilding indexes
    if (this.recoveryOptions.autoRebuildIndex) {
      try {
        console.log('Attempting to rebuild search indexes...');
        await this.indexManager.rebuildIndexes();
        
        // Retry original search after rebuild (if SearchManager is available)
        if (this.searchManager) {
          return await this.searchManager.searchAll(query, filters, options);
        } else {
          return await this.fallbackSearch(query, filters, options);
        }
      } catch (rebuildError) {
        console.error('Index rebuild failed:', rebuildError);
      }
    }

    return null;
  }

  /**
   * Recover from database connection errors
   */
  private async recoverFromConnectionError(
    query: string,
    filters?: SearchFilters,
    options: any = {}
  ): Promise<SearchResult[] | null> {
    console.log('Attempting recovery from connection error...');

    try {
      // Try to reconnect
      await this.dbManager.initializeDatabase();
      
      // Retry search after reconnection (if SearchManager is available)
      if (this.searchManager) {
        return await this.searchManager.searchAll(query, filters, options);
      } else {
        return await this.fallbackSearch(query, filters, options);
      }
    } catch (reconnectError) {
      console.error('Reconnection failed:', reconnectError);
      
      // Fall back to cached results or simple search
      return await this.fallbackSearch(query, filters, options);
    }
  }

  /**
   * Recover from timeout errors
   */
  private async recoverFromTimeout(
    query: string,
    filters?: SearchFilters,
    options: any = {}
  ): Promise<SearchResult[] | null> {
    console.log('Attempting recovery from timeout...');

    // Try with a simpler query (first word only)
    const simpleQuery = query.split(' ')[0];
    if (simpleQuery !== query && simpleQuery.length >= 2 && this.searchManager) {
      try {
        return await this.searchManager.searchAll(simpleQuery, filters, {
          ...options,
          limit: Math.min(options.limit || 50, 25) // Reduce result limit
        });
      } catch (simpleError) {
        console.error('Simple query also failed:', simpleError);
      }
    }

    // Fall back to LIKE-based search
    return await this.fallbackSearch(query, filters, options);
  }

  /**
   * Perform fallback search using LIKE queries
   */
  private async fallbackSearch(
    query: string,
    filters?: SearchFilters,
    options: any = {}
  ): Promise<SearchResult[]> {
    if (!this.recoveryOptions.enableFallback) {
      throw new Error('Fallback search is disabled');
    }

    console.log('Using fallback search with LIKE queries...');
    
    return await this.fallbackManager.searchAll(query, {
      limit: options.limit,
      offset: options.offset,
      caseSensitive: false
    });
  }

  /**
   * Schedule index rebuild in background
   */
  private scheduleIndexRebuild(): void {
    // Use setTimeout to avoid blocking the current operation
    setTimeout(async () => {
      try {
        console.log('Starting background index rebuild...');
        await this.indexManager.rebuildIndexes();
        console.log('Background index rebuild completed');
      } catch (error) {
        console.error('Background index rebuild failed:', error);
      }
    }, 5000); // Wait 5 seconds before starting rebuild
  }

  /**
   * Utility method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the last error that occurred
   */
  getLastError(): SearchError | null {
    return this.lastError;
  }

  /**
   * Check if the system is currently in recovery mode
   */
  isInRecoveryMode(): boolean {
    return this.isRecovering;
  }

  /**
   * Get recovery status and suggestions
   */
  getRecoveryStatus(): {
    hasError: boolean;
    errorType?: string;
    canRecover: boolean;
    recoveryActions: string[];
    isRecovering: boolean;
  } {
    return {
      hasError: !!this.lastError,
      errorType: this.lastError?.type,
      canRecover: this.lastError?.canRecover || false,
      recoveryActions: this.lastError?.recoveryActions || [],
      isRecovering: this.isRecovering
    };
  }

  /**
   * Manually trigger index rebuild
   */
  async rebuildIndexes(): Promise<void> {
    await this.indexManager.rebuildIndexes();
  }

  /**
   * Get the underlying database manager
   */
  getDatabaseManager(): DatabaseManager {
    return this.dbManager;
  }

  /**
   * Get the underlying search manager
   */
  getSearchManager(): SearchManager | null {
    return this.searchManager;
  }

  /**
   * Track query performance metrics
   */
  private trackQueryPerformance(queryTime: number, wasError: boolean, cacheHit: boolean): void {
    this.performanceMetrics.totalQueries++;
    this.performanceMetrics.queryTimes.push(queryTime);
    
    if (wasError) {
      this.performanceMetrics.errorCount++;
    }
    
    if (cacheHit) {
      this.performanceMetrics.cacheHits++;
    }

    // Keep only last 100 query times for rolling average
    if (this.performanceMetrics.queryTimes.length > 100) {
      this.performanceMetrics.queryTimes.shift();
    }

    // Update health status
    this.updateHealthStatus();
  }

  /**
   * Update system health status based on metrics
   */
  private updateHealthStatus(): void {
    const issues: HealthIssue[] = [];
    const metrics = this.performanceMetrics;

    // Calculate performance metrics
    const avgQueryTime = metrics.queryTimes.length > 0 
      ? metrics.queryTimes.reduce((a, b) => a + b, 0) / metrics.queryTimes.length 
      : 0;
    
    const errorRate = metrics.totalQueries > 0 
      ? (metrics.errorCount / metrics.totalQueries) * 100 
      : 0;
    
    const cacheHitRate = metrics.totalQueries > 0 
      ? (metrics.cacheHits / metrics.totalQueries) * 100 
      : 0;

    // Check for performance issues
    if (avgQueryTime > 100) {
      issues.push({
        type: 'PERFORMANCE',
        severity: avgQueryTime > 500 ? 'CRITICAL' : avgQueryTime > 200 ? 'HIGH' : 'MEDIUM',
        message: `Average query time is ${avgQueryTime.toFixed(1)}ms (target: <50ms)`,
        timestamp: new Date(),
        autoFixable: true
      });
    }

    // Check for high error rate
    if (errorRate > 5) {
      issues.push({
        type: 'ERROR',
        severity: errorRate > 20 ? 'CRITICAL' : errorRate > 10 ? 'HIGH' : 'MEDIUM',
        message: `Error rate is ${errorRate.toFixed(1)}% (target: <1%)`,
        timestamp: new Date(),
        autoFixable: false
      });
    }

    // Check for low cache hit rate
    if (cacheHitRate < 30 && metrics.totalQueries > 10) {
      issues.push({
        type: 'PERFORMANCE',
        severity: 'LOW',
        message: `Cache hit rate is ${cacheHitRate.toFixed(1)}% (target: >50%)`,
        timestamp: new Date(),
        autoFixable: true
      });
    }

    this.healthStatus = {
      isHealthy: issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0,
      lastCheck: new Date(),
      issues,
      performance: {
        averageQueryTime: avgQueryTime,
        errorRate,
        cacheHitRate
      }
    };
  }

  /**
   * Get current system health status
   */
  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Perform proactive health check and maintenance
   */
  async performHealthCheck(): Promise<HealthStatus> {
    try {
      // Check database connectivity
      await this.dbManager.executeQuery('SELECT 1');
      
      // Check FTS5 availability if SearchManager exists
      if (this.searchManager) {
        try {
          await this.searchManager.searchAll('test', {}, { limit: 1 });
        } catch (error) {
          this.healthStatus.issues.push({
            type: 'INDEX',
            severity: 'HIGH',
            message: 'FTS5 search is not functioning properly',
            timestamp: new Date(),
            autoFixable: true
          });
        }
      }

      // Update health status
      this.updateHealthStatus();
      
      return this.getHealthStatus();
    } catch (error) {
      this.healthStatus.issues.push({
        type: 'ERROR',
        severity: 'CRITICAL',
        message: `Health check failed: ${error.message}`,
        timestamp: new Date(),
        autoFixable: false
      });
      
      this.healthStatus.isHealthy = false;
      return this.getHealthStatus();
    }
  }
}

export default EnhancedSearchManager;