// ResultsDisplay Component for Kiosk Search Interface
// Displays search results in a touch-friendly, scrollable format
import React from 'react';
import { SearchResult } from '@/lib/database/types';
import { GraduationCap, FileText, Camera, Users } from 'lucide-react';
import './ResultsDisplay.css';

export interface ResultsDisplayProps {
  results: SearchResult[];
  isLoading: boolean;
  error?: string;
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
  searchQuery?: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  isLoading,
  error,
  onResultSelect,
  className = '',
  searchQuery = ''
}) => {

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    // Always use the callback if provided
    if (onResultSelect) {
      onResultSelect(result);
      return;
    }

    // Fallback: log warning if no callback provided
    console.warn('[ResultsDisplay] No onResultSelect callback provided. Result selection will not work.');
  };
  // Get type icon
  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'alumni':
        return <GraduationCap className="h-5 w-5" />;
      case 'publication':
        return <FileText className="h-5 w-5" />;
      case 'photo':
        return <Camera className="h-5 w-5" />;
      case 'faculty':
        return <Users className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Get type color
  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'alumni':
        return 'bg-blue-100 text-blue-800';
      case 'publication':
        return 'bg-green-100 text-green-800';
      case 'photo':
        return 'bg-purple-100 text-purple-800';
      case 'faculty':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get type label
  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'alumni':
        return 'Alumni';
      case 'publication':
        return 'Publication';
      case 'photo':
        return 'Photo';
      case 'faculty':
        return 'Faculty';
      default:
        return 'Result';
    }
  };

  // Render loading state with skeleton loaders
  if (isLoading) {
    return (
      <div className={`results-display ${className}`}>
        <div className="results-loading" role="status" aria-live="polite" aria-label="Loading search results">
          {/* Loading indicator */}
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <p className="loading-text">Searching...</p>
          </div>
          
          {/* Skeleton loaders */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="result-skeleton" aria-hidden="true">
              <div className="skeleton-thumbnail"></div>
              <div className="skeleton-content">
                <div className="skeleton-badge"></div>
                <div className="skeleton-title"></div>
                <div className="skeleton-subtitle"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render error state with retry option
  if (error) {
    return (
      <div className={`results-display ${className}`}>
        <div className="results-error" role="alert" aria-live="assertive">
          <div className="error-icon" aria-hidden="true">⚠️</div>
          <h3 className="error-title">Search Error</h3>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button
              className="error-retry-button"
              onClick={() => window.location.reload()}
              aria-label="Retry search"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render empty state with helpful suggestions
  if (results.length === 0) {
    return (
      <div className={`results-display ${className}`}>
        <div className="results-empty" role="status" aria-live="polite">
          <div className="empty-icon" aria-hidden="true">🔍</div>
          <h3 className="empty-title">No Results Found</h3>
          <p className="empty-message">
            {searchQuery 
              ? `No results found for "${searchQuery}". Try different search terms or adjust your filters.`
              : 'Try different search terms or adjust your filters'}
          </p>
          <div className="empty-suggestions">
            <p className="suggestions-title">Helpful Tips:</p>
            <ul className="suggestions-list">
              <li>Check your spelling</li>
              <li>Try more general terms (e.g., "law" instead of "constitutional law")</li>
              <li>Remove some filters to see more results</li>
              <li>Search for names, graduation years, or topics</li>
              <li>Try searching for publication names like "Law Review" or "Amicus"</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Render results
  return (
    <div className={`results-display ${className}`}>
      <div className="results-header">
        <p className="results-count" role="status" aria-live="polite">
          {results.length} {results.length === 1 ? 'result' : 'results'} found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>
      
      <div className="results-list" role="list">
        {results.map((result) => (
          <ResultCard
            key={result.id}
            result={result}
            onSelect={handleResultSelect}
            getTypeIcon={getTypeIcon}
            getTypeColor={getTypeColor}
            getTypeLabel={getTypeLabel}
          />
        ))}
      </div>
    </div>
  );
};

// Result Card Component
interface ResultCardProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
  getTypeIcon: (type: SearchResult['type']) => React.ReactNode;
  getTypeColor: (type: SearchResult['type']) => string;
  getTypeLabel: (type: SearchResult['type']) => string;
}

const ResultCard: React.FC<ResultCardProps> = ({
  result,
  onSelect,
  getTypeIcon,
  getTypeColor,
  getTypeLabel
}) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setTimeout(() => setIsPressed(false), 50);
  };

  const handleClick = () => {
    if (isNavigating) return; // Prevent double-clicks

    // Provide immediate visual feedback (50ms)
    setIsPressed(true);
    
    setTimeout(() => {
      setIsPressed(false);
      setIsNavigating(true);
      
      // Call onSelect which will handle navigation with 300ms transition
      onSelect(result);
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`result-card ${isPressed ? 'result-card-pressed' : ''} ${isNavigating ? 'result-card-navigating' : ''}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      role="listitem button"
      tabIndex={0}
      aria-label={`View ${getTypeLabel(result.type)}: ${result.title}`}
    >
      {/* Thumbnail */}
      {result.thumbnailPath && (
        <div className="result-thumbnail">
          <img
            src={result.thumbnailPath}
            alt={result.title}
            loading="lazy"
            onError={(e) => {
              // Hide image on error
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="result-content">
        {/* Type Badge */}
        <div className={`result-type-badge ${getTypeColor(result.type)}`}>
          {getTypeIcon(result.type)}
          <span>{getTypeLabel(result.type)}</span>
        </div>

        {/* Title */}
        <h3 className="result-title">{result.title}</h3>

        {/* Subtitle */}
        {result.subtitle && (
          <p className="result-subtitle">{result.subtitle}</p>
        )}

        {/* Snippet */}
        {result.snippet && (
          <p className="result-snippet">{result.snippet}</p>
        )}
      </div>

      {/* Chevron indicator */}
      <div className="result-chevron">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    </div>
  );
};

export default ResultsDisplay;
