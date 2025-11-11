// Global Search Component for Home Page
import React, { useState, useCallback } from 'react';
import { Search, Loader2, AlertCircle, X } from 'lucide-react';
import { SearchInterface } from '@/components/search/SearchInterface';
import { SearchResult } from '@/lib/database/types';
import { useSearch } from '@/lib/search-context';
import { RoomType } from '@/types';
import './GlobalSearch.css';

interface GlobalSearchProps {
  onNavigateToRoom: (room: RoomType, searchQuery?: string, resultId?: string) => void;
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
      <div className={`global-search-container ${className}`}>
        <div className="global-search-glass">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-celestial-blue" />
            <span className="text-white">Initializing search...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !searchManager) {
    return (
      <div className={`global-search-container ${className}`}>
        <div className="global-search-glass">
          <div className="flex items-center space-x-2 text-red-300">
            <AlertCircle className="h-5 w-5" />
            <span>Search is currently unavailable. {error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed state - just a search button
  if (!isExpanded) {
    return (
      <div className={`global-search-container ${className}`}>
        <div 
          className="global-search-glass global-search-collapsed"
          onClick={() => setIsExpanded(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(true);
            }
          }}
          aria-label="Open search across all collections"
        >
          <div className="flex items-center justify-center space-x-3">
            <Search className="h-7 w-7 text-mc-gold" />
            <span className="text-xl font-semibold text-white">Search All Collections</span>
          </div>
          <p className="text-center text-sm text-celestial-blue mt-2">
            Search across alumni, publications, photos, and faculty
          </p>
        </div>
      </div>
    );
  }

  // Expanded state - full search interface
  return (
    <div className={`global-search-container ${className}`}>
      <div className="global-search-glass global-search-expanded">
        <div className="global-search-header">
          <div className="flex items-center space-x-3">
            <Search className="h-6 w-6 text-mc-gold" />
            <h2 className="text-xl font-bold text-white">Search All Collections</h2>
          </div>
          <button
            className="global-search-close"
            onClick={() => setIsExpanded(false)}
            aria-label="Minimize search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="global-search-content">
          <SearchInterface
            onResultSelect={handleResultSelect}
            placeholder="Search alumni, publications, photos, and faculty..."
            showFilters={false}
            showKeyboard={true}
            keyboardPosition="floating"
            maxResults={20}
          />
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;