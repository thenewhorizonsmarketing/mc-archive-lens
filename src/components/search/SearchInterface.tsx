// Main Search Interface Component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Filter, Loader2, AlertTriangle } from 'lucide-react';
import { SearchErrorBoundary } from '@/components/error/SearchErrorBoundary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResults } from '@/components/search/SearchResults';
import { FilterControls } from '@/components/search/FilterControls';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';
import { useRealTimeSearch } from '@/lib/database/realtime-search';
import { searchManager } from '@/lib/database';
import { SearchResult, SearchFilters } from '@/lib/database/types';
import { FilterOptions } from '@/lib/database/filter-processor';

export interface SearchInterfaceProps {
  onResultSelect?: (result: SearchResult) => void;
  initialFilters?: SearchFilters;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
  maxResults?: number;
  debounceMs?: number;
}

export const SearchInterface: React.FC<SearchInterfaceProps> = ({
  onResultSelect,
  initialFilters = {},
  placeholder = "Search alumni, publications, photos, and faculty...",
  className = "",
  showFilters = true,
  showSuggestions = true,
  maxResults = 50,
  debounceMs = 300
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize real-time search
  const realTimeSearch = useRealTimeSearch(searchManager, {
    debounceMs,
    maxResults,
    enableCaching: true,
    enableMetrics: true
  });

  const [searchState, setSearchState] = useState(realTimeSearch.getState());

  // Subscribe to search state changes
  useEffect(() => {
    const unsubscribe = realTimeSearch.subscribe(setSearchState);
    return unsubscribe;
  }, [realTimeSearch]);

  // Handle query changes
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    
    if (value.length >= 2) {
      // Get suggestions
      if (showSuggestions) {
        realTimeSearch.getSuggestions(value, 5).then(setSuggestions);
        setShowSuggestionsPanel(true);
      }
      
      // Perform search
      realTimeSearch.search(value, filters);
    } else {
      setSuggestions([]);
      setShowSuggestionsPanel(false);
      realTimeSearch.clear();
    }
  }, [filters, realTimeSearch, showSuggestions]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    if (query.length >= 2) {
      realTimeSearch.search(query, newFilters);
    }
  }, [query, realTimeSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestionsPanel(false);
    realTimeSearch.search(suggestion, filters);
    
    // Add to recent searches
    setRecentSearches(prev => {
      const updated = [suggestion, ...prev.filter(s => s !== suggestion)];
      return updated.slice(0, 5); // Keep only 5 recent searches
    });
  }, [filters, realTimeSearch]);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    // Add query to recent searches if it produced results
    if (query.trim()) {
      setRecentSearches(prev => {
        const updated = [query.trim(), ...prev.filter(s => s !== query.trim())];
        return updated.slice(0, 5);
      });
    }
    
    onResultSelect?.(result);
  }, [query, onResultSelect]);

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestionsPanel(false);
    realTimeSearch.clear();
    inputRef.current?.focus();
  }, [realTimeSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showSuggestionsPanel) {
        setShowSuggestionsPanel(false);
      } else if (query) {
        handleClear();
      }
    }
  }, [showSuggestionsPanel, query, handleClear]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestionsPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // Create filter summary
  const filterSummary = Object.entries(filters)
    .filter(([_, value]) => value)
    .map(([key, value]) => {
      if (key === 'yearRange' && typeof value === 'object') {
        return `${value.start}-${value.end}`;
      }
      return String(value);
    });

  return (
    <SearchErrorBoundary
      onError={(error, errorInfo) => {
        console.error('SearchInterface error:', error, errorInfo);
      }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <div className={`search-interface ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-20 h-12 text-lg"
            autoComplete="off"
            autoFocus
          />
          
          {/* Loading indicator */}
          {searchState.isLoading && (
            <Loader2 className="absolute right-12 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          
          {/* Clear button */}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && showSuggestionsPanel && (suggestions.length > 0 || recentSearches.length > 0) && (
          <SearchSuggestions
            ref={suggestionsRef}
            suggestions={suggestions}
            recentSearches={recentSearches}
            onSelect={handleSuggestionSelect}
            className="absolute top-full left-0 right-0 z-50 mt-1"
          />
        )}
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Active filter badges */}
          {filterSummary.map((filter, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {filter}
            </Badge>
          ))}

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFiltersChange({})}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <FilterControls
          filters={filters}
          onChange={handleFiltersChange}
          availableOptions={searchState.results.length > 0 ? undefined : undefined} // Would be computed from results
          className="mt-4 p-4 border rounded-lg bg-muted/50"
        />
      )}

      {/* Search Results */}
      <div className="mt-6">
        {searchState.error && (
          <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            Search error: {searchState.error}
          </div>
        )}

        {query.length >= 2 && !searchState.isLoading && searchState.results.length === 0 && !searchState.error && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No results found</p>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        )}

        {searchState.results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Found {searchState.totalCount} result{searchState.totalCount !== 1 ? 's' : ''}
                {searchState.metrics && (
                  <span className="ml-2">
                    ({Math.round(searchState.metrics.queryTime)}ms)
                  </span>
                )}
              </p>
            </div>

            <SearchResults
              results={searchState.results}
              totalCount={searchState.totalCount}
              isLoading={searchState.isLoading}
              error={searchState.error}
              query={query}
              onResultSelect={handleResultSelect}
              metrics={searchState.metrics}
              highlightTerms={query.split(' ').filter(term => term.length > 0)}
              className="space-y-4"
            />
          </>
        )}

        {/* Performance metrics (development only) */}
        {process.env.NODE_ENV === 'development' && searchState.metrics && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
            Query: {searchState.metrics.queryTime.toFixed(1)}ms | 
            Results: {searchState.metrics.resultCount} | 
            Cache: {searchState.metrics.cacheHit ? 'HIT' : 'MISS'} |
            Complexity: {searchState.metrics.queryComplexity}
          </div>
        )}
      </div>
    </div>
    </SearchErrorBoundary>
  );
};

export default SearchInterface;