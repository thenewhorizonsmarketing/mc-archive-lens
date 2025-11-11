// Main Search Interface Component
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Filter, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { SearchErrorBoundary } from '@/components/error/SearchErrorBoundary';
import { ErrorBoundary } from 'react-error-boundary';
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
  // Accessibility: Announce search status to screen readers
  const announceSearchStatus = useCallback((status: string) => {
    const announcer = document.querySelector('[aria-live="polite"]');
    if (announcer) {
      announcer.textContent = status;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  }, []);
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

  // Prevent browser autocomplete with readonly trick
  useEffect(() => {
    if (inputRef.current) {
      // Make input readonly initially
      inputRef.current.setAttribute('readonly', 'readonly');
      
      // Remove readonly after a short delay
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.removeAttribute('readonly');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Aggressively remove browser autocomplete UI and extension overlays
  useEffect(() => {
    const removeAutocompleteUI = () => {
      // Remove any elements that appear at the top of the page
      const bodyChildren = Array.from(document.body.children);
      bodyChildren.forEach((child) => {
        // Skip our app root and essential elements
        if (
          child.id === 'root' ||
          child.tagName === 'SCRIPT' ||
          child.tagName === 'STYLE' ||
          child.tagName === 'LINK'
        ) {
          return;
        }
        
        // Specifically target Scribe extension
        if (
          child.tagName === 'SCRIBE-SHADOW' ||
          child.id === 'crxjs-ext' ||
          child.getAttribute('data-crx') === 'okfkdaglfjjjfefdcppliegebpoegaii'
        ) {
          child.remove();
          return;
        }
        
        // Check if element is positioned at top
        const style = window.getComputedStyle(child);
        const position = style.position;
        const top = style.top;
        
        if (
          (position === 'absolute' || position === 'fixed') &&
          (top === '0px' || top === '0')
        ) {
          child.remove();
        }
      });
      
      // Also hide shadow DOM content if it exists
      const scribeShadow = document.querySelector('scribe-shadow');
      if (scribeShadow && scribeShadow.shadowRoot) {
        const shadowChildren = Array.from(scribeShadow.shadowRoot.children);
        shadowChildren.forEach((child: any) => {
          if (child.style) {
            child.style.display = 'none';
            child.style.visibility = 'hidden';
            child.style.opacity = '0';
          }
        });
      }
    };

    // Run immediately
    removeAutocompleteUI();

    // Run on interval to catch dynamically added elements (very aggressive)
    const interval = setInterval(removeAutocompleteUI, 10);

    // Also run on DOM mutations
    const observer = new MutationObserver(removeAutocompleteUI);
    observer.observe(document.body, {
      childList: true,
      subtree: false
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchMetrics, setSearchMetrics] = useState<any>(null);

  // Debounced search function
  const performSearch = useCallback(async (searchQuery: string, searchFilters: FilterOptions) => {
    // Debug logging
    console.log('[SearchInterface] performSearch called with:', {
      query: searchQuery,
      filters: searchFilters,
      hasQuery: searchQuery && searchQuery.length > 0,
      filterCount: Object.keys(searchFilters).filter(k => searchFilters[k as keyof FilterOptions]).length
    });

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
      
      console.log('[SearchInterface] Received', results.length, 'results in', (endTime - startTime), 'ms');
      
      setSearchResults(results);
      setTotalCount(results.length);
      setSearchMetrics({
        queryTime: endTime - startTime,
        resultCount: results.length,
        cacheHit: false,
        queryComplexity: 'simple',
        timestamp: Date.now()
      });
      
      // Announce results to screen readers
      announceSearchStatus(`Found ${results.length} result${results.length !== 1 ? 's' : ''} for ${searchQuery}`);
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
    console.log('[SearchInterface] handleResultSelect called with:', result.title);
    
    // Add query to recent searches if it produced results
    if (query.trim()) {
      setRecentSearches(prev => {
        const updated = [query.trim(), ...prev.filter(s => s !== query.trim())];
        return updated.slice(0, 5);
      });
    }
    
    console.log('[SearchInterface] Calling parent onResultSelect...');
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
      <div 
        className={`search-interface ${className}`}
        role="search"
        aria-label="Search interface for alumni, publications, photos, and faculty"
      >
      {/* Screen Reader Live Region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Skip to Results Link */}
      <a href="#search-results" className="skip-to-content sr-only focus:not-sr-only">
        Skip to search results
      </a>
      {/* Search Input */}
      <form 
        autoComplete="off" 
        onSubmit={(e) => e.preventDefault()}
        data-form-type="other"
        style={{ isolation: 'isolate', position: 'relative' }}
      >
        <div className="relative" style={{ isolation: 'isolate', contain: 'layout style' }}>
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              name={`search-query-${Math.random().toString(36).substring(7)}`}
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              className="pl-10 pr-20 h-12 text-lg"
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-form-type="other"
              data-lpignore="true"
              data-app="true"
              role="searchbox"
              autoFocus
              aria-label={showKeyboard ? "Search input - virtual keyboard available" : "Search input"}
              aria-describedby={showKeyboard ? "keyboard-hint" : undefined}
            />
          {showKeyboard && (
            <span id="keyboard-hint" className="sr-only">
              Tap this field to show the virtual keyboard. Press Escape to hide the keyboard.
            </span>
          )}
          
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
      </form>

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

      {/* Search Suggestions - Disabled to prevent layout shift */}
      {/* <div className="relative">
        {showSuggestions && showSuggestionsPanel && (suggestions.length > 0 || recentSearches.length > 0) && (
          <SearchSuggestions
            ref={suggestionsRef}
            suggestions={suggestions}
            recentSearches={recentSearches}
            onSelect={handleSuggestionSelect}
            className="mt-1"
          />
        )}
      </div> */}

      {/* Filter Controls */}
      {showFilters && (
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowFilterPanel(!showFilterPanel);
              // Hide keyboard when opening filters
              if (!showFilterPanel && keyboardVisible) {
                setKeyboardVisible(false);
              }
            }}
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
        <div className="mt-4" key="filter-panel">
          <ErrorBoundary fallback={<div className="text-red-500 p-4">Filter panel error. Please refresh.</div>}>
            <FilterControls
              key={`filters-${Date.now()}`}
              filters={filters}
              onChange={handleFiltersChange}
              availableOptions={searchResults.length > 0 ? undefined : undefined}
              className="p-4 border rounded-lg bg-muted/50"
              showKeyboard={false}
              keyboardPosition="below"
            />
          </ErrorBoundary>
        </div>
      )}

      {/* Search Results */}
      <div className="mt-6 min-h-[400px]" id="search-results">
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
              error={searchError || undefined}
              query={query}
              onResultSelect={handleResultSelect}
              metrics={searchMetrics}
              highlightTerms={query.split(' ').filter(term => term.length > 0)}
              className="space-y-4"
            />
          </>
        )}


      </div>

      {/* On-Screen Keyboard - Floating mode only */}
      {showKeyboard && keyboardVisible && keyboardPosition === 'floating' && (
        <>
          {/* Keyboard Container - appears at bottom without backdrop */}
          <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-gradient-to-t from-[#0C2340] via-[#0C2340] to-[#0C2340]/95 border-t-2 border-[#C99700]/30 shadow-2xl">
            <div className="max-w-4xl mx-auto">
              <OnScreenKeyboard
                onKeyPress={handleKeyboardKey}
                className="w-full"
              />
              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKeyboardVisible(false)}
                  className="bg-background hover:bg-[#C99700] hover:text-white"
                >
                  Hide Keyboard
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </SearchErrorBoundary>
  );
};

export default SearchInterface;