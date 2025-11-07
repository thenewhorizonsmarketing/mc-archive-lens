// Search Suggestions Component
import React from 'react';
import { Clock, Search, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export interface SearchSuggestionsProps {
  suggestions: string[];
  recentSearches: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
}

export const SearchSuggestions = React.forwardRef<HTMLDivElement, SearchSuggestionsProps>(({
  suggestions,
  recentSearches,
  onSelect,
  className = ""
}, ref) => {
  const handleSuggestionClick = (suggestion: string) => {
    onSelect(suggestion);
  };

  const handleKeyDown = (event: React.KeyboardEvent, suggestion: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(suggestion);
    }
  };

  return (
    <Card 
      ref={ref} 
      className={`search-suggestions ${className}`}
      role="listbox"
      aria-label="Search suggestions and recent searches"
    >
      <CardContent className="p-0">
        {/* Auto-complete Suggestions */}
        {suggestions.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
              <div className="flex items-center space-x-1">
                <Search className="h-3 w-3" />
                <span>Suggestions</span>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto text-left hover:bg-gray-50 rounded-none min-h-[44px]"
                  onClick={() => handleSuggestionClick(suggestion)}
                  onKeyDown={(e) => handleKeyDown(e, suggestion)}
                  role="option"
                  aria-label={`Search suggestion: ${suggestion}`}
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Search className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm truncate">{suggestion}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Separator between suggestions and recent searches */}
        {suggestions.length > 0 && recentSearches.length > 0 && (
          <Separator />
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Recent Searches</span>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start px-4 py-2 h-auto text-left hover:bg-gray-50 rounded-none min-h-[44px]"
                  onClick={() => handleSuggestionClick(search)}
                  onKeyDown={(e) => handleKeyDown(e, search)}
                  role="option"
                  aria-label={`Recent search: ${search}`}
                  tabIndex={0}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm text-gray-600 truncate">{search}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {suggestions.length === 0 && recentSearches.length === 0 && (
          <div className="px-4 py-6 text-center text-gray-500">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start typing to see suggestions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default SearchSuggestions;