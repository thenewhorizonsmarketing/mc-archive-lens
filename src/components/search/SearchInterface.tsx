// Main Search Interface Component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Filter, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { SearchErrorBoundary } from '@/components/error/SearchErrorBoundary';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResults } from '@/components/search/SearchResults';
import { FilterControls } from '@/components/search/FilterControls';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';
import { OnScreenKeyboard } from '@/components/search/OnScreenKeyboard';
import { useSearch } from '@/lib/search-context';
import { SearchResult, SearchFilters } from '@/lib/database/types';
import { FilterOptions } from '@/lib/database/filter-processor';

export interface SearchInterfaceProps {
  onResultSelect?: (result: SearchResult) => void;
  initialFilters?: SearchFilters;
  placeholder?: string;
  className?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
  showKeyboard?: boolean;
  keyboardPosition?: 'below' | 'floating';
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
  showKeyboard = false,
  keyboardPosition = 'below',
  maxResults = 50,
  debounceMs = 300
}) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Use search context
  const { searchManager, isInitialized, error: contextError } = useSearch();
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchMetrics, setSearchMetrics] = useState<any>(null);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string, searchFilters: FilterOptions) => {
    if (!searchManager || !searchQuery || searchQuery.length < 1) {
      setSearchResults([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setSearchError(null);
    
    try {
      const startTime = Date.now();
      const results = await searchManager.searchAll(searchQuery, searchFilters, { limit: maxResults } as any);
      const endTime = Date.now();
      
      setSearchResults(results);
      setTotalCount(results.length);
      setSearchMetrics({
        queryTime: endTime - startTime,
        resultCount: results.length,
        cacheHit: false,
        queryComplexity: 'simple',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setSearchResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchManager, maxResults]);

  // Handle query changes - instant update
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  // Modern instant search with debouncing
  useEffect(() => {
    // Clear results immediately if query is empty
    if (!query || query.length === 0) {
      setSearchResults([]);
      setTotalCount(0);
      setSuggestions([]);
      setShowSuggestionsPanel(false);
      setIsLoading(false);
      return;
    }

    // Show loading state immediately for better UX
    setIsLoading(true);

    // Debounce search and suggestions
    const searchTimer = setTimeout(() => {
      // Perform search (works with even 1 character)
      performSearch(query, filters);

      // Get autocomplete suggestions
      if (showSuggestions && searchManager && query.length >= 1) {
        searchManager.getSuggestions(query, 8).then(suggestions => {
          setSuggestions(suggestions);
          setShowSuggestionsPanel(suggestions.length > 0);
        }).catch(console.error);
      }
    }, query.length === 1 ? 400 : debounceMs); // Longer delay for single char

    return () => clearTimeout(searchTimer);
  }, [query, filters, performSearch, showSuggestions, searchManager, debounceMs]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    if (query.length >= 2) {
      performSearch(query, newFilters);
    }
  }, [query, performSearch]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestionsPanel(false);
    performSearch(suggestion, filters);
    
    // Add to recent searches
    setRecentSearches(prev => {
      const updated = [suggestion, ...prev.filter(s => s !== suggestion)];
      return updated.slice(0, 5); // Keep only 5 recent searches
    });
  }, [filters, performSearch]);

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
    setSearchResults([]);
    setTotalCount(0);
    setSearchError(null);
    inputRef.current?.focus();
  }, []);

  // Handle on-screen keyboard key press
  const handleKeyboardKey = useCallback((key: string) => {
    if (key === 'Backspace') {
      setQuery(prev => prev.slice(0, -1));
    } else if (key === 'Enter') {
      // Trigger search
      if (query.length >= 2) {
        performSearch(query, filters);
      }
      setKeyboardVisible(false);
    } else if (key === 'Space') {
      setQuery(prev => prev + ' ');
    } else if (key.length === 1) {
      // Regular character
      setQuery(prev => prev + key);
    }
  }, [query, filters, performSearch]);

  // Handle input focus - show keyboard
  const handleInputFocus = useCallback(() => {
    if (showKeyboard) {
      setKeyboardVisible(true);
    }
  }, [showKeyboard]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (keyboardVisible) {
        setKeyboardVisible(false);
      } else if (showSuggestionsPanel) {
        setShowSuggestionsPanel(false);
      } else if (query) {
        handleClear();
      }
    }
  }, [showSuggestionsPanel, query, keyboardVisible, handleClear]);

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
            onFocus={handleInputFocus}
            className="pl-10 pr-20 h-12 text-lg"
            autoComplete="off"
            autoFocus
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-12 flex items-center space-x-1">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Searching...</span>
            </div>
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
      </div>

      {/* On-Screen Keyboard - Positioned above suggestions, outside relative container */}
      {showKeyboard && keyboardVisible && keyboardPosition !== 'floating' && (
        <div className="mt-2 mb-2">
          <OnScreenKeyboard
            onKeyPress={handleKeyboardKey}
            className="w-full"
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKeyboardVisible(false)}
            >
              Hide Keyboard
            </Button>
          </div>
        </div>
      )}

      {/* Search Suggestions - Below keyboard */}
      <div className="relative">
        {showSuggestions && showSuggestionsPanel && (suggestions.length > 0 || recentSearches.length > 0) && (
          <SearchSuggestions
            ref={suggestionsRef}
            suggestions={suggestions}
            recentSearches={recentSearches}
            onSelect={handleSuggestionSelect}
            className="mt-1"
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
          availableOptions={searchResults.length > 0 ? undefined : undefined} // Would be computed from results
          className="mt-4 p-4 border rounded-lg bg-muted/50"
        />
      )}

      {/* Search Results */}
      <div className="mt-6">
        {/* Empty state - show helpful message */}
        {!query && isInitialized && !contextError && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium mb-2">Start typing to search</p>
            <p className="text-sm">Search across alumni, publications, photos, and faculty</p>
            {recentSearches.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium mb-3">Recent searches:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {recentSearches.slice(0, 5).map((search, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionSelect(search)}
                      className="text-xs"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Context Error */}
        {contextError && (
          <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            System error: {contextError}
          </div>
        )}

        {/* Search Error */}
        {searchError && (
          <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Search error: {searchError}
          </div>
        )}

        {/* Loading State */}
        {!isInitialized && (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
            <p className="text-lg font-medium">Initializing search...</p>
          </div>
        )}

        {/* No Results */}
        {isInitialized && query.length >= 1 && !isLoading && searchResults.length === 0 && !searchError && !contextError && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No results found for "{query}"</p>
            <p className="text-sm">Try different search terms or check your spelling</p>
            {suggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Did you mean:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.slice(0, 3).map((suggestion, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {searchResults.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Found {totalCount} result{totalCount !== 1 ? 's' : ''}
                {searchMetrics && (
                  <span className="ml-2">
                    ({Math.round(searchMetrics.queryTime)}ms)
                  </span>
                )}
              </p>
            </div>

            <SearchResults
              results={searchResults}
              totalCount={totalCount}
              isLoading={isLoading}
              error={searchError}
              query={query}
              onResultSelect={handleResultSelect}
              metrics={searchMetrics}
              highlightTerms={query.split(' ').filter(term => term.length > 0)}
              className="space-y-4"
            />
          </>
        )}

        {/* Performance metrics (development only) */}
        {process.env.NODE_ENV === 'development' && searchMetrics && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
            Query: {searchMetrics.queryTime.toFixed(1)}ms | 
            Results: {searchMetrics.resultCount} | 
            Cache: {searchMetrics.cacheHit ? 'HIT' : 'MISS'} |
            Complexity: {searchMetrics.queryComplexity}
          </div>
        )}
      </div>

      {/* On-Screen Keyboard - Floating mode only */}
      {showKeyboard && keyboardVisible && keyboardPosition === 'floating' && (
        <div className="fixed bottom-4 left-4 right-4 z-50 shadow-2xl">
          <OnScreenKeyboard
            onKeyPress={handleKeyboardKey}
            className="w-full"
          />
          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKeyboardVisible(false)}
            >
              Hide Keyboard
            </Button>
          </div>
        </div>
      )}
    </div>
    </SearchErrorBoundary>
  );
};

export default SearchInterface;