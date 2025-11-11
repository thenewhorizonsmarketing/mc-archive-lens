// Loading State Components for Content Pages
// Provides skeleton loaders and loading indicators
import { Loader2 } from 'lucide-react';

/**
 * InitialLoadingState Component
 * 
 * Full-page loading state for initial data fetch
 * Requirements: 5.2, 8.1
 */
export function InitialLoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center space-y-4">
        <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" aria-hidden="true" />
        <p className="text-xl text-muted-foreground" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </div>
  );
}

/**
 * DatabaseInitializingState Component
 * 
 * Loading state while database initializes
 * Requirements: 5.2
 */
export function DatabaseInitializingState() {
  return (
    <div className="kiosk-container min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" aria-hidden="true" />
            <p className="text-xl text-muted-foreground" role="status" aria-live="polite">
              Initializing database...
            </p>
            <p className="text-sm text-muted-foreground">
              This may take a moment on first load
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FilterLoadingIndicator Component
 * 
 * Small loading indicator for filter/search updates
 * Requirements: 8.2
 */
export function FilterLoadingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 text-primary" role="status" aria-live="polite">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span className="text-sm">Updating...</span>
    </div>
  );
}

/**
 * SkeletonCard Component
 * 
 * Skeleton loader for record cards
 * Requirements: 8.1
 */
export function SkeletonCard({ viewMode = 'grid' }: { viewMode?: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="animate-pulse bg-muted rounded-lg p-4 flex gap-4">
        <div className="w-16 h-16 bg-muted-foreground/20 rounded flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-muted-foreground/20 rounded w-3/4" />
          <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
          <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse bg-muted rounded-lg overflow-hidden">
      <div className="aspect-square bg-muted-foreground/20" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-muted-foreground/20 rounded w-3/4" />
        <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * SkeletonGrid Component
 * 
 * Grid of skeleton cards for content loading
 * Requirements: 8.1
 */
export function SkeletonGrid({ 
  count = 12, 
  viewMode = 'grid' 
}: { 
  count?: number; 
  viewMode?: 'grid' | 'list';
}) {
  const gridClass = viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
    : 'space-y-4';

  return (
    <div className={gridClass} role="status" aria-label="Loading content">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} viewMode={viewMode} />
      ))}
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

/**
 * InlineLoadingSpinner Component
 * 
 * Small inline loading spinner
 * Requirements: 8.2
 */
export function InlineLoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 
      className={`${sizeClasses[size]} animate-spin text-primary`} 
      aria-hidden="true"
      role="status"
    />
  );
}

/**
 * RetryingIndicator Component
 * 
 * Indicator shown during retry attempts
 * Requirements: 8.2
 */
export function RetryingIndicator({ 
  retryCount, 
  maxRetries 
}: { 
  retryCount: number; 
  maxRetries: number;
}) {
  return (
    <div 
      className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400" 
      role="status" 
      aria-live="polite"
    >
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span className="text-sm font-medium">
        Retrying... ({retryCount}/{maxRetries})
      </span>
    </div>
  );
}

/**
 * LoadingOverlay Component
 * 
 * Semi-transparent overlay with loading spinner
 * Used for optimistic UI updates
 * Requirements: 8.2
 */
export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div 
      className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
      role="status"
      aria-live="polite"
    >
      <div className="text-center space-y-3">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" aria-hidden="true" />
        {message && (
          <p className="text-lg text-foreground font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * PaginationLoadingState Component
 * 
 * Loading state for pagination transitions
 * Requirements: 8.2
 */
export function PaginationLoadingState() {
  return (
    <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
        <span>Loading page...</span>
      </div>
    </div>
  );
}

/**
 * SearchLoadingIndicator Component
 * 
 * Loading indicator for search operations
 * Requirements: 8.2
 */
export function SearchLoadingIndicator() {
  return (
    <div 
      className="absolute right-4 top-1/2 -translate-y-1/2"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">Searching...</span>
    </div>
  );
}
