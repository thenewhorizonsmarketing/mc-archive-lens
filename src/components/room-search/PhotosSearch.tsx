// Photos Room Search Component
import React, { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInterface } from '@/components/search/SearchInterface';
import { SearchResult } from '@/lib/database/types';
import { useSearch } from '@/lib/search-context';

interface PhotosSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  initialQuery?: string;
  className?: string;
}

export const PhotosSearch: React.FC<PhotosSearchProps> = ({
  onResultSelect,
  initialQuery,
  className = ""
}) => {
  const { searchManager, isInitialized, error } = useSearch();
  const [isExpanded, setIsExpanded] = useState(!!initialQuery);

  // Auto-expand if there's an initial query
  useEffect(() => {
    if (initialQuery) {
      setIsExpanded(true);
    }
  }, [initialQuery]);

  // Handle result selection
  const handleResultSelect = useCallback((result: SearchResult) => {
    // Only show photo results in this component
    if (result.type === 'photo') {
      onResultSelect?.(result);
    }
  }, [onResultSelect]);

  // Don't render if search is not available
  if (!isInitialized || error || !searchManager) {
    return null;
  }

  // Collapsed state
  if (!isExpanded) {
    return (
      <Card className={`photos-search cursor-pointer hover:shadow-sm transition-shadow ${className}`}>
        <CardContent 
          className="p-4"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center space-x-3">
            <Search className="h-5 w-5 text-primary" />
            <span className="font-medium">Search Photo Archives</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expanded state
  return (
    <Card className={`photos-search ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span className="font-medium">Search Photos</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <SearchInterface
          searchManager={searchManager}
          onResultSelect={handleResultSelect}
          placeholder="Search photos by title, collection, or year..."
          showFilters={true}
          showKeyboard={false}
          maxResults={50}
        />
      </CardContent>
    </Card>
  );
};

export default PhotosSearch;