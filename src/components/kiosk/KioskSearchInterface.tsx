// Kiosk Search Interface Component
// Optimized for fullscreen kiosk mode with touch keyboard, filters, and real-time search
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { SearchManager } from '@/lib/database/search-manager';
import { SearchResult, SearchFilters } from '@/lib/database/types';
import { FilterOptions } from '@/lib/database/filter-processor';
import { FallbackSearchManager } from '@/lib/database/fallback-search';
import { getAnalyticsEngine } from '@/lib/analytics/analytics-engine';
import { FilterPanel } from './FilterPanel';
import { TouchKeyboard } from './TouchKeyboard';

export interface KioskSearchInterfaceProps {
  searchManager: SearchManager;
  fallbackSearchManager?: FallbackSearchManager;
  onResultSelect: (result: SearchResult) => void;
  showKeyboard?: boolean;
  showFilters?: boolean;
  maxResults?: number;
  className?: string;
}

export interface KioskSearchState {
  query: string;
  filters: FilterOptions;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  lastSuccessfulResults: SearchResult[];
  retryCount: number;
  isRetrying: boolean;
  usingFallback: boolean;
}

/**
 * KioskSearchInterface Component
 * 
 * A fullscreen search interface optimized for kiosk environments with:
 * - Real-time search with 150ms debounce
 * - Integrated virtual keyboard support
 * - Touch-optimized filter controls
 * - Error handling and recovery
 * - Result caching for performance
 * 
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 6.1, 6.2, 6.4
 */
export const KioskSearchInterface: React.FC<KioskSearchInterfaceProps> = ({
  searchManager,
  fallbackSearchManager,
  onResultSelect,
  showKeyboard: _showKeyboard = true,
  showFilters: _showFilters = true,
  maxResults = 50,
  className = ''
}) => {
  // Search state management
  const [state, setState] = useState<KioskSearchState>({
    query: '',
    filters: {},
    results: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    lastSuccessfulResults: [],
    retryCount: 0,
    isRetrying: false,
    usingFallback: false
  });

  // Refs for debouncing and caching
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>('');
  const resultsCacheRef = useRef<Map<string, { results: SearchResult[]; timestamp: number }>>(
    new Map()
  );
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchStartTimeRef = useRef<Date | null>(null);
  const currentSearchEventIdRef = useRef<string | null>(null);
  const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Analytics engine instance
  const analyticsEngine = useRef(getAnalyticsEngine({
    enableTracking: true,
    anonymizeData: true,
    enableRealTimeMetrics: true
  })).current;

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<KioskSearchState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Generate cache key for query and filters
   */
  const getCacheKey = useCallback((query: string, filters: FilterOptions): string => {
    return JSON.stringify({ query, filters });
  }, []);

  /**
   * Get cached results if available and not expired
   */
  const getCachedResults = useCallback((cacheKey: string): SearchResult[] | null => {
    const cached = resultsCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
      return cached.results;
    }
    if (cached) {
      resultsCacheRef.current.delete(cacheKey);
    }
    return null;
  }, []);

  /**
   * Cache search results
   */
  const cacheResults = useCallback((cacheKey: string, results: SearchResult[]) => {
    // Limit cache size to 100 entries
    if (resultsCacheRef.current.size >= 100) {
      const oldestKey = resultsCacheRef.current.keys().next().value;
      if (oldestKey) {
        resultsCacheRef.current.delete(oldestKey);
      }
    }

    resultsCacheRef.current.set(cacheKey, {
      results,
      timestamp: Date.now()
    });
  }, []);

  /**
   * Execute search query with comprehensive error handling
   * Requirements: 3.1, 3.2, 6.1, 6.2, 6.4, 8.4, 8.5
   */
  const executeSearch = useCallback(async (
    query: string,
    filters: FilterOptions,
    isRetry: boolean = false
  ): Promise<void> => {
    // Skip empty queries
    if (!query || query.trim().length === 0) {
      updateState({
        results: [],
        totalCount: 0,
        isLoading: false,
        error: null,
        retryCount: 0,
        isRetrying: false
      });
      return;
    }

    // Check cache first
    const cacheKey = getCacheKey(query, filters);
    const cachedResults = getCachedResults(cacheKey);
    
    if (cachedResults) {
      updateState({
        results: cachedResults,
        lastSuccessfulResults: cachedResults,
        totalCount: cachedResults.length,
        isLoading: false,
        error: null,
        retryCount: 0,
        isRetrying: false
      });
      return;
    }

    // Set loading state
    updateState({ 
      isLoading: true, 
      error: null,
      isRetrying: isRetry
    });

    try {
      // Execute search with SearchManager
      const startTime = performance.now();
      
      const results = await searchManager.searchAll(
        query,
        filters as SearchFilters,
        {
          limit: maxResults,
          sortBy: 'relevance',
          sortOrder: 'asc'
        }
      );

      const endTime = performance.now();
      const queryTime = Math.round(endTime - startTime);

      // Cache results
      cacheResults(cacheKey, results);

      // Update state with successful results
      updateState({
        results,
        lastSuccessfulResults: results,
        totalCount: results.length,
        isLoading: false,
        error: null,
        retryCount: 0,
        isRetrying: false
      });

      // Track search analytics (Requirement 10.4)
      const searchEventId = analyticsEngine.trackSearch(
        query,
        filters as SearchFilters,
        results,
        queryTime,
        'search_interface'
      );
      currentSearchEventIdRef.current = searchEventId;
      searchStartTimeRef.current = new Date();

      // Log performance metrics
      console.log(`[KioskSearch] Search completed in ${queryTime}ms, found ${results.length} results`);

    } catch (error) {
      console.error('[KioskSearch] Search query failed:', error);
      
      // Determine error type and message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Search failed. Please try again.';

      const isFTS5Error = errorMessage.includes('FTS5') || 
                         errorMessage.includes('fts_') ||
                         errorMessage.includes('full-text');
      
      const isTransientError = errorMessage.includes('timeout') || 
                              errorMessage.includes('network') ||
                              errorMessage.includes('temporary');

      // Try fallback search for FTS5 errors
      if (isFTS5Error && fallbackSearchManager && !state.usingFallback) {
        console.log('[KioskSearch] FTS5 error detected, switching to fallback search');
        await executeFallbackSearch(query, filters);
        return;
      }

      // Track error analytics (Requirement 10.4)
      analyticsEngine.trackError(
        error instanceof Error ? error : new Error(errorMessage),
        'search_query',
        query
      );

      // Update state with error, but keep last successful results
      updateState({
        isLoading: false,
        error: errorMessage,
        // Keep displaying last successful results if available
        results: state.lastSuccessfulResults.length > 0 ? state.lastSuccessfulResults : [],
        totalCount: state.lastSuccessfulResults.length,
        isRetrying: false
      });

      // Attempt auto-retry for transient errors
      if (isTransientError && state.retryCount < MAX_RETRY_ATTEMPTS && !isRetry) {
        scheduleRetry(query, filters);
      }
    }
  }, [searchManager, fallbackSearchManager, maxResults, getCacheKey, getCachedResults, cacheResults, updateState, state.lastSuccessfulResults, state.retryCount, state.usingFallback]);

  /**
   * Execute fallback search using LIKE queries
   * Requirements: 6.1, 6.2, 6.5
   */
  const executeFallbackSearch = useCallback(async (
    query: string,
    filters: FilterOptions
  ): Promise<void> => {
    if (!fallbackSearchManager) {
      console.error('[KioskSearch] Fallback search manager not available');
      return;
    }

    console.log('[KioskSearch] Executing fallback search for:', query);

    try {
      const startTime = performance.now();
      
      const results = await fallbackSearchManager.searchAll(query, {
        limit: maxResults,
        caseSensitive: false
      });

      const endTime = performance.now();
      const queryTime = Math.round(endTime - startTime);

      // Update state with fallback results
      updateState({
        results,
        lastSuccessfulResults: results,
        totalCount: results.length,
        isLoading: false,
        error: null,
        retryCount: 0,
        isRetrying: false,
        usingFallback: true
      });

      console.log(`[KioskSearch] Fallback search completed in ${queryTime}ms, found ${results.length} results`);
      
      // Log fallback usage for monitoring
      logFallbackUsage(query, results.length, queryTime);

    } catch (fallbackError) {
      console.error('[KioskSearch] Fallback search also failed:', fallbackError);
      
      const errorMessage = fallbackError instanceof Error 
        ? fallbackError.message 
        : 'Search system is currently unavailable';

      updateState({
        isLoading: false,
        error: errorMessage,
        results: state.lastSuccessfulResults.length > 0 ? state.lastSuccessfulResults : [],
        totalCount: state.lastSuccessfulResults.length,
        isRetrying: false,
        usingFallback: true
      });
    }
  }, [fallbackSearchManager, maxResults, updateState, state.lastSuccessfulResults]);

  /**
   * Log fallback search usage for monitoring
   * Requirements: 6.5
   */
  const logFallbackUsage = useCallback((query: string, resultCount: number, queryTime: number) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      query,
      resultCount,
      queryTime,
      context: 'kiosk-search'
    };

    console.log('[KioskSearch] Fallback usage:', logEntry);

    try {
      const existingLogs = JSON.parse(localStorage.getItem('fallbackSearchLogs') || '[]');
      existingLogs.push(logEntry);
      // Keep only the last 50 logs
      const recentLogs = existingLogs.slice(-50);
      localStorage.setItem('fallbackSearchLogs', JSON.stringify(recentLogs));
    } catch (storageError) {
      console.error('[KioskSearch] Failed to log fallback usage:', storageError);
    }
  }, []);

  /**
   * Schedule automatic retry for failed queries
   * Requirements: 8.4, 8.5
   */
  const scheduleRetry = useCallback((query: string, filters: FilterOptions) => {
    // Clear any existing retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }

    const currentRetryCount = state.retryCount;
    
    if (currentRetryCount >= MAX_RETRY_ATTEMPTS) {
      console.log('[KioskSearch] Max retry attempts reached');
      return;
    }

    console.log(`[KioskSearch] Scheduling retry ${currentRetryCount + 1}/${MAX_RETRY_ATTEMPTS} in ${RETRY_DELAY}ms`);

    // Increment retry count
    updateState({ 
      retryCount: currentRetryCount + 1,
      isRetrying: true
    });

    // Schedule retry
    retryTimerRef.current = setTimeout(() => {
      console.log(`[KioskSearch] Executing retry ${currentRetryCount + 1}/${MAX_RETRY_ATTEMPTS}`);
      executeSearch(query, filters, true);
    }, RETRY_DELAY);
  }, [state.retryCount, updateState, executeSearch]);

  /**
   * Manual retry handler
   * Requirements: 8.5
   */
  const handleManualRetry = useCallback(() => {
    console.log('[KioskSearch] Manual retry triggered');
    
    // Clear any pending auto-retry
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    // Reset retry count, fallback flag, and execute search
    updateState({ 
      retryCount: 0,
      error: null,
      isRetrying: false,
      usingFallback: false
    });

    if (state.query && state.query.trim().length > 0) {
      executeSearch(state.query, state.filters, false);
    }
  }, [state.query, state.filters, updateState, executeSearch]);

  /**
   * Handle query change with debouncing
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  const handleQueryChange = useCallback((newQuery: string) => {
    // Update query immediately for UI responsiveness
    updateState({ query: newQuery });

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Skip search for empty queries
    if (!newQuery || newQuery.trim().length === 0) {
      updateState({
        results: [],
        totalCount: 0,
        isLoading: false,
        error: null
      });
      return;
    }

    // Show loading indicator immediately
    updateState({ isLoading: true });

    // Debounce search execution (150ms as per requirements)
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(newQuery, state.filters);
      lastQueryRef.current = newQuery;
    }, 150);
  }, [state.filters, executeSearch, updateState]);

  /**
   * Handle filter changes
   * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6
   */
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    // Track filter usage analytics (Requirement 10.4)
    console.log('[KioskSearch] Filter changed:', newFilters);
    
    updateState({ filters: newFilters });

    // Re-execute search with new filters if query exists
    if (state.query && state.query.trim().length > 0) {
      executeSearch(state.query, newFilters);
    }
  }, [state.query, executeSearch, updateState]);

  /**
   * Clear search
   * Requirements: 12.1, 12.2, 12.3
   */
  const handleClear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    updateState({
      query: '',
      results: [],
      totalCount: 0,
      isLoading: false,
      error: null
    });

    lastQueryRef.current = '';
  }, [updateState]);

  /**
   * Handle keyboard key press
   * Requirements: 2.3, 2.4, 2.5, 12.1, 12.2, 12.3
   */
  const handleKeyboardPress = useCallback((key: string) => {
    if (key === 'Backspace') {
      // Remove last character
      if (state.query.length > 0) {
        const newQuery = state.query.slice(0, -1);
        handleQueryChange(newQuery);
      }
    } else if (key === 'Clear') {
      // Clear all text and reset search state
      handleClear();
    } else if (key === 'Enter') {
      // Enter key - could trigger search or do nothing (search is already real-time)
      // For now, just log it
      console.log('[KioskSearch] Enter key pressed');
    } else if (key === ' ') {
      // Space key
      const newQuery = state.query + ' ';
      handleQueryChange(newQuery);
    } else {
      // Regular character key
      const newQuery = state.query + key;
      handleQueryChange(newQuery);
    }
  }, [state.query, handleQueryChange, handleClear]);

  /**
   * Handle result selection
   */
  const handleResultClick = useCallback((result: SearchResult) => {
    // Track result click analytics (Requirement 10.4)
    if (currentSearchEventIdRef.current && searchStartTimeRef.current) {
      const position = state.results.findIndex(r => r.id === result.id);
      analyticsEngine.trackResultClick(
        currentSearchEventIdRef.current,
        result,
        position,
        searchStartTimeRef.current
      );
    }

    onResultSelect(result);
  }, [onResultSelect, state.results, analyticsEngine]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  /**
   * Component layout structure
   * Requirements: 2.1, 2.2, 2.3
   */
  return (
    <div 
      className={`kiosk-search-interface flex flex-col h-full ${className}`}
      role="search"
      aria-label="Kiosk search interface"
    >
      {/* Search Input Section */}
      <div className="search-input-section flex-shrink-0 p-4 bg-background border-b">
        <div className="relative">
          <div className="flex items-center">
            <Search 
              className="absolute left-4 h-6 w-6 text-muted-foreground pointer-events-none" 
              aria-hidden="true"
            />
            <input
              type="text"
              value={state.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search alumni, publications, photos, and faculty..."
              className="w-full h-16 pl-14 pr-16 text-xl border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              aria-label="Search input"
              aria-describedby="search-status"
            />
            
            {/* Loading Indicator */}
            {state.isLoading && (
              <div className="absolute right-16 flex items-center">
                <Loader2 
                  className="h-6 w-6 animate-spin text-primary" 
                  aria-label="Loading search results"
                />
              </div>
            )}

            {/* Clear Button */}
            {state.query && (
              <button
                onClick={handleClear}
                className="absolute right-4 h-12 w-12 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
                aria-label="Clear search"
                type="button"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Search Status - Screen Reader */}
        <div 
          id="search-status" 
          className="sr-only" 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
        >
          {state.isLoading && 'Searching...'}
          {!state.isLoading && state.results.length > 0 && 
            `Found ${state.totalCount} result${state.totalCount !== 1 ? 's' : ''}`}
          {!state.isLoading && state.query && state.results.length === 0 && !state.error &&
            'No results found'}
          {state.error && `Error: ${state.error}`}
        </div>
      </div>

      {/* Filter Panel */}
      {_showFilters && (
        <FilterPanel
          filters={state.filters}
          onChange={handleFiltersChange}
          availableFilters={{
            categories: ['alumni', 'publication', 'photo', 'faculty']
          }}
        />
      )}

      {/* Results Count and Error Display */}
      {(state.totalCount > 0 || state.error || state.usingFallback) && (
        <div className="flex-shrink-0 px-4 py-3 bg-muted/50 border-b">
          {state.error && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-destructive flex-1">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{state.error}</span>
                </div>
                
                {/* Manual Retry Button */}
                {state.retryCount < MAX_RETRY_ATTEMPTS && (
                  <button
                    onClick={handleManualRetry}
                    disabled={state.isRetrying}
                    className="h-10 px-4 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    aria-label="Retry search"
                  >
                    <RefreshCw className={`h-4 w-4 ${state.isRetrying ? 'animate-spin' : ''}`} />
                    <span>{state.isRetrying ? 'Retrying...' : 'Retry'}</span>
                  </button>
                )}
              </div>
              
              {/* Retry status */}
              {state.isRetrying && (
                <p className="text-xs text-muted-foreground">
                  Attempting to reconnect... ({state.retryCount}/{MAX_RETRY_ATTEMPTS})
                </p>
              )}
              
              {/* Show last successful results message */}
              {state.lastSuccessfulResults.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing {state.lastSuccessfulResults.length} result{state.lastSuccessfulResults.length !== 1 ? 's' : ''} from last successful search
                </p>
              )}
            </div>
          )}
          {!state.error && state.totalCount > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Found {state.totalCount} result{state.totalCount !== 1 ? 's' : ''}
              </p>
              {/* Fallback indicator */}
              {state.usingFallback && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Using simplified search mode
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Results Display Section */}
      <div className="results-section flex-1 overflow-y-auto p-4">
        {/* Empty State */}
        {!state.query && !state.isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Search className="h-24 w-24 mb-4 opacity-20" aria-hidden="true" />
            <h2 className="text-2xl font-semibold mb-2">Start Searching</h2>
            <p className="text-lg">
              Enter a search term to find alumni, publications, photos, or faculty
            </p>
          </div>
        )}

        {/* No Results State */}
        {state.query && !state.isLoading && state.results.length === 0 && !state.error && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Search className="h-24 w-24 mb-4 opacity-20" aria-hidden="true" />
            <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
            <p className="text-lg mb-4">
              No matches for "{state.query}"
            </p>
            <p className="text-sm">
              Try different search terms or check your spelling
            </p>
          </div>
        )}

        {/* Results List */}
        {state.results.length > 0 && (
          <div className="space-y-2" role="list" aria-label="Search results">
            {state.results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full min-h-[80px] p-4 flex items-center gap-4 bg-card border-2 border-border rounded-lg hover:border-primary hover:bg-accent transition-all text-left"
                aria-label={`${result.title}, ${result.subtitle || ''}, ${result.type}`}
                type="button"
              >
                {/* Thumbnail */}
                {result.thumbnailPath && result.thumbnailPath.trim() !== '' && (
                  <div className="flex-shrink-0 w-16 h-16 bg-muted rounded overflow-hidden">
                    <img
                      src={result.thumbnailPath}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">
                    {result.title}
                  </h3>
                  {result.subtitle && (
                    <p className="text-sm text-muted-foreground truncate">
                      {result.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      {result.type}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Touch Keyboard - Fixed at bottom (Requirements: 2.1, 2.2, 2.6, 2.7) */}
      {_showKeyboard && (
        <TouchKeyboard
          onKeyPress={handleKeyboardPress}
          theme="kiosk"
          layout="qwerty"
        />
      )}
    </div>
  );
};

export default KioskSearchInterface;
