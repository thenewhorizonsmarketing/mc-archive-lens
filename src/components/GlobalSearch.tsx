// Global Search Component for Home Page
import React, { useState, useCallback } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchInterface } from '@/components/search/SearchInterface';
import { SearchResult } from '@/lib/database/types';
import { useSearch } from '@/lib/search-context';
import { RoomType } from '@/types';

interface GlobalSearchProps {
  onNavigateToRoom: (room: RoomType, searchQuery?: string) => void;
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onNavigateToRoom,
  className = ""
}) => {
  const { searchManager, isInitialized, error } = useSearch();
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle result selection - navigate to appropriate room
  const handleResultSelect = useCallback((result: SearchResult) => {
    let targetRoom: RoomType;
    
    switch (result.type) {
      case 'alumni':
        targetRoom = 'alumni';
        break;
      case 'publication':
        targetRoom = 'publications';
        break;
      case 'photo':
        targetRoom = 'photos';
        break;
      case 'faculty':
        targetRoom = 'faculty';
        break;
      default:
        targetRoom = 'alumni';
    }
    
    // Navigate to room with the result name to auto-open
    onNavigateToRoom(targetRoom, undefined, result.title);
  }, [onNavigateToRoom]);

  // Loading state
  if (!isInitialized) {
    return (
      <Card className={`global-search ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Initializing search...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !searchManager) {
    return (
      <Card className={`global-search ${className}`}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Search is currently unavailable. {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Collapsed state - just a search button
  if (!isExpanded) {
    return (
      <Card className={`global-search cursor-pointer hover:shadow-md transition-shadow ${className}`}>
        <CardContent 
          className="p-6"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center justify-center space-x-3 text-lg">
            <Search className="h-6 w-6 text-primary" />
            <span className="font-medium">Search All Collections</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Search across alumni, publications, photos, and faculty
          </p>
        </CardContent>
      </Card>
    );
  }

  // Expanded state - full search interface
  return (
    <Card className={`global-search ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search All Collections</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            Minimize
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <SearchInterface
          onResultSelect={handleResultSelect}
          placeholder="Search alumni, publications, photos, and faculty..."
          showFilters={true}
          showKeyboard={true}
          keyboardPosition="below"
          maxResults={20}
        />
      </CardContent>
    </Card>
  );
};

export default GlobalSearch;