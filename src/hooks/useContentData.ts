// Hook for managing content data with search, filters, and pagination
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearch } from '@/lib/search-context';
import { SearchResult, SearchFilters } from '@/lib/database/types';

export interface UseContentDataOptions {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  initialFilters?: SearchFilters;
  pageSize?: number;
  enableAutoRetry?: boolean;
  maxRetries?: number;
  cacheEnabled?: boolean;
  cacheExpirationMs?: number;
  enablePreloading?: boolean;
  preloadThreshold?: number; // Percentage of page scrolled before preloading next page
  virtualScrolling?: boolean;
}

export interface UseContentDataReturn {
  records: SearchResult[];
  paginatedRecords: SearchResult[]; // Current page records
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  selectedRecord: SearchResult | null;
  selectRecord: (id: string) => void;
  clearSelection: () => void;
  refresh: () => Promise<void>;
  retryCount: number;
  isRetrying: boolean;
  isCached: boolean;
  clearCache: () => void;
  isPreloading: boolean;
  onScrollProgress: (progress: number) => void; // For preloading trigger
}

const DEFAULT_PAGE_SIZE = 24;
const DEBOUNCE_DELAY = 300;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const DEFAULT_CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PRELOAD_THRESHOLD = 0.8; // Preload when 80% through current page

// Cache entry interface
interface CacheEntry {
  data: SearchResult[];
  timestamp: number;
  query: string;
  filters: SearchFilters;
}

// Global cache for search results (shared across hook instances)
const searchResultsCache = new Map<string, CacheEntry>();

// Global cache for individual record details
const recordDetailsCache = new Map<string, { record: SearchResult; timestamp: number }>();

// Preloaded pages cache
const preloadedPagesCache = new Map<string, Set<number>>();

// Generate cache key from query and filters
function generateCacheKey(query: string, filters: SearchFilters): string {
  return JSON.stringify({ query, filters });
}

// Check if cache entry is expired
function isCacheExpired(timestamp: number, expirationMs: number): boolean {
  return Date.now() - timestamp > expirationMs;
}

// Calculate optimal page size based on viewport
function calculateOptimalPageSize(viewportHeight: number, itemHeight: number): number {
  // Calculate items that fit in viewport + 2 screens worth for smooth scrolling
  const itemsPerScreen = Math.ceil(viewportHeight / itemHeight);
  const optimalSize = itemsPerScreen * 3;
  
  // Clamp between reasonable bounds
  return Math.max(12, Math.min(optimalSize, 100));
}

export function useContentData(options: UseContentDataOptions): UseContentDataReturn {
  const {
    contentType,
    initialFilters = {},
    pageSize: initialPageSize,
    enableAutoRetry = true,
    maxRetries = MAX_RETRIES,
    cacheEnabled = true,
    cacheExpirationMs = DEFAULT_CACHE_EXPIRATION,
    enablePreloading = true,
    preloadThreshold = DEFAULT_PRELOAD_THRESHOLD,
    virtualScrolling = false
  } = options;

  const { searchManager, isInitialized, error: contextError } = useSearch();
  
  // Calculate optimal page size if not provided
  const [pageSize, setPageSize] = useState(() => {
    if (initialPageSize) return initialPageSize;
    if (virtualScrolling && typeof window !== 'undefined') {
      // Estimate item height based on content type
      const estimatedItemHeight = contentType === 'photo' ? 250 : 150;
      return calculateOptimalPageSize(window.innerHeight, estimatedItemHeight);
    }
    return DEFAULT_PAGE_SIZE;
  });
  
  // State management
  const [records, setRecords] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<SearchFilters>({
    ...initialFilters,
    type: contentType
  });
  const [searchQuery, setSearchQueryState] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<SearchResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);

  // Refs for debouncing and cleanup
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const preloadedRef = useRef<Set<number>>(new Set());

  // Calculate pagination
  const totalRecords = records.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  
  // Get current page records
  const paginatedRecords = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Fetch data function with retry logic and caching
  const fetchData = useCallback(async (
    query: string,
    currentFilters: SearchFilters,
    attempt: number = 1,
    bypassCache: boolean = false
  ): Promise<void> => {
    if (!searchManager || !isInitialized) {
      setLoading(false);
      return;
    }

    // Check cache first if enabled and not bypassing
    if (cacheEnabled && !bypassCache) {
      const cacheKey = generateCacheKey(query, currentFilters);
      const cachedEntry = searchResultsCache.get(cacheKey);

      if (cachedEntry && !isCacheExpired(cachedEntry.timestamp, cacheExpirationMs)) {
        // Use cached data
        if (isMountedRef.current) {
          setRecords(cachedEntry.data);
          setIsCached(true);
          setLoading(false);
          setError(null);
          setRetryCount(0);
          setIsRetrying(false);
        }
        return;
      }
    }

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      setIsCached(false);

      // Perform search with type filter
      const results = await searchManager.searchAll(query, currentFilters);

      // Cache the results if caching is enabled
      if (cacheEnabled) {
        const cacheKey = generateCacheKey(query, currentFilters);
        searchResultsCache.set(cacheKey, {
          data: results,
          timestamp: Date.now(),
          query,
          filters: currentFilters
        });
      }

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setRecords(results);
        setRetryCount(0);
        setIsRetrying(false);
        setLoading(false);
      }
    } catch (err) {
      console.error(`Fetch attempt ${attempt} failed:`, err);

      if (!isMountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';

      // Retry logic
      if (enableAutoRetry && attempt < maxRetries) {
        setIsRetrying(true);
        setRetryCount(attempt);
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
        
        if (isMountedRef.current) {
          await fetchData(query, currentFilters, attempt + 1, bypassCache);
        }
      } else {
        // Max retries reached or retry disabled
        setError(errorMessage);
        setRetryCount(0);
        setIsRetrying(false);
        setLoading(false);
        
        // Try to use cached data as fallback if available
        if (cacheEnabled) {
          const cacheKey = generateCacheKey(query, currentFilters);
          const cachedEntry = searchResultsCache.get(cacheKey);
          
          if (cachedEntry) {
            // Use stale cache as fallback
            setRecords(cachedEntry.data);
            setIsCached(true);
            setError(`${errorMessage} (showing cached data)`);
          } else if (records.length === 0) {
            setRecords([]);
          }
        } else if (records.length === 0) {
          setRecords([]);
        }
      }
    }
  }, [searchManager, isInitialized, enableAutoRetry, maxRetries, records.length, cacheEnabled, cacheExpirationMs]);

  // Debounced fetch function
  const debouncedFetch = useCallback((query: string, currentFilters: SearchFilters) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchData(query, currentFilters);
    }, DEBOUNCE_DELAY);
  }, [fetchData]);

  // Initial data load
  useEffect(() => {
    if (isInitialized) {
      fetchData(searchQuery, filters);
    }
  }, [isInitialized]);

  // Handle filter changes
  useEffect(() => {
    if (isInitialized && searchManager) {
      debouncedFetch(searchQuery, filters);
      // Reset to first page when filters change
      setCurrentPage(1);
    }
  }, [filters, isInitialized, searchManager]);

  // Handle search query changes
  useEffect(() => {
    if (isInitialized && searchManager) {
      debouncedFetch(searchQuery, filters);
      // Reset to first page when search query changes
      setCurrentPage(1);
    }
  }, [searchQuery, isInitialized, searchManager]);

  // Handle context errors
  useEffect(() => {
    if (contextError) {
      setError(contextError);
      setLoading(false);
    }
  }, [contextError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Public API functions
  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState({
      ...newFilters,
      type: contentType // Always maintain content type
    });
  }, [contentType]);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryState(query);
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top of content area
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset preload tracking for new page
      preloadedRef.current.clear();
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Preload next page when user scrolls through current page
  const preloadNextPage = useCallback(async () => {
    const nextPageNum = currentPage + 1;
    
    // Don't preload if already at last page or already preloaded
    if (nextPageNum > totalPages || preloadedRef.current.has(nextPageNum)) {
      return;
    }

    // Mark as preloading
    setIsPreloading(true);
    preloadedRef.current.add(nextPageNum);

    // Preload is essentially just ensuring the data is in memory
    // Since we already have all records, we just need to ensure
    // any images or resources for the next page are ready
    const nextPageRecords = records.slice(
      (nextPageNum - 1) * pageSize,
      nextPageNum * pageSize
    );

    // Preload images for next page
    if (typeof window !== 'undefined' && 'Image' in window) {
      nextPageRecords.forEach(record => {
        if (record.thumbnail || record.thumbnailPath) {
          const img = new Image();
          img.src = record.thumbnail || record.thumbnailPath || '';
        }
      });
    }

    setIsPreloading(false);
  }, [currentPage, totalPages, records, pageSize]);

  // Handle scroll progress for preloading
  const onScrollProgress = useCallback((progress: number) => {
    if (enablePreloading && progress >= preloadThreshold) {
      preloadNextPage();
    }
  }, [enablePreloading, preloadThreshold, preloadNextPage]);

  const selectRecord = useCallback((id: string) => {
    // Check record details cache first
    if (cacheEnabled) {
      const cachedRecord = recordDetailsCache.get(id);
      if (cachedRecord && !isCacheExpired(cachedRecord.timestamp, cacheExpirationMs)) {
        setSelectedRecord(cachedRecord.record);
        return;
      }
    }

    // Find in current records
    const record = records.find(r => r.id === id);
    if (record) {
      setSelectedRecord(record);
      
      // Cache the record details
      if (cacheEnabled) {
        recordDetailsCache.set(id, {
          record,
          timestamp: Date.now()
        });
      }
    }
  }, [records, cacheEnabled, cacheExpirationMs]);

  const clearSelection = useCallback(() => {
    setSelectedRecord(null);
  }, []);

  const refresh = useCallback(async () => {
    // Bypass cache on manual refresh
    await fetchData(searchQuery, filters, 1, true);
  }, [fetchData, searchQuery, filters]);

  const clearCache = useCallback(() => {
    // Clear all cache entries for this content type
    const keysToDelete: string[] = [];
    searchResultsCache.forEach((entry, key) => {
      if (entry.filters.type === contentType) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => searchResultsCache.delete(key));
    
    // Clear record details cache
    recordDetailsCache.clear();
    
    setIsCached(false);
  }, [contentType]);

  // Adjust page size on viewport resize for virtual scrolling
  useEffect(() => {
    if (!virtualScrolling || initialPageSize) return;

    const handleResize = () => {
      const estimatedItemHeight = contentType === 'photo' ? 250 : 150;
      const newPageSize = calculateOptimalPageSize(window.innerHeight, estimatedItemHeight);
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
        // Adjust current page to maintain approximate scroll position
        const currentFirstItem = (currentPage - 1) * pageSize;
        const newPage = Math.floor(currentFirstItem / newPageSize) + 1;
        setCurrentPage(newPage);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [virtualScrolling, initialPageSize, contentType, pageSize, currentPage]);

  return {
    records,
    paginatedRecords,
    loading,
    error,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    currentPage,
    totalPages,
    totalRecords,
    goToPage,
    nextPage,
    prevPage,
    selectedRecord,
    selectRecord,
    clearSelection,
    refresh,
    retryCount,
    isRetrying,
    isCached,
    clearCache,
    isPreloading,
    onScrollProgress
  };
}
