/**
 * ContentList Component
 * 
 * Reusable component for displaying lists of content records with loading and empty states.
 * Supports both grid and list view modes with responsive layouts and scroll-based preloading.
 * 
 * Features:
 * - Loading skeleton states for better UX
 * - Empty state with clear filters option
 * - Scroll progress tracking for preloading next page
 * - Responsive grid/list layouts
 * - Full accessibility support with ARIA labels
 * 
 * @component
 * @example
 * ```tsx
 * <ContentList
 *   records={records}
 *   contentType="alumni"
 *   loading={loading}
 *   onSelectRecord={selectRecord}
 *   viewMode="grid"
 *   emptyMessage="No alumni found"
 *   onClearFilters={() => setFilters({})}
 *   onScrollProgress={(progress) => {
 *     if (progress >= 0.8) preloadNextPage();
 *   }}
 * >
 *   {records.map(record => (
 *     <RecordCard key={record.id} record={record} />
 *   ))}
 * </ContentList>
 * ```
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { SearchResult } from '@/lib/database/types';
import { SkeletonGrid } from './LoadingStates';
import './ContentList.css';

/**
 * Props for ContentList component
 */
export interface ContentListProps {
  /** Array of search results to display */
  records: SearchResult[];
  /** Type of content being displayed (affects layout, styling, and empty state icon) */
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  /** Whether data is currently loading (shows skeleton loaders) */
  loading: boolean;
  /** Callback when a record is selected (passed to child components) */
  onSelectRecord: (id: string) => void;
  /** Display mode: 'grid' for card layout, 'list' for row layout */
  viewMode?: 'grid' | 'list';
  /** Custom message to show when no records found */
  emptyMessage?: string;
  /** Custom description for empty state */
  emptyDescription?: string;
  /** Callback to clear all filters (shown as button in empty state) */
  onClearFilters?: () => void;
  /** Callback for scroll progress (0-1) - used for preloading next page */
  onScrollProgress?: (progress: number) => void;
  /** Child components (typically RecordCard components for each record) */
  children?: React.ReactNode;
}

export const ContentList: React.FC<ContentListProps> = ({
  records,
  contentType,
  loading,
  onSelectRecord,
  viewMode = 'grid',
  emptyMessage = 'No records found',
  emptyDescription = 'Try adjusting your filters or search query',
  onClearFilters,
  onScrollProgress,
  children
}) => {
  // Ref to the scrollable container for tracking scroll position
  const containerRef = useRef<HTMLDivElement>(null);
  // Track last scroll position to detect scroll direction
  const lastScrollTop = useRef(0);

  /**
   * Handle scroll events to track progress through the content
   * Calculates scroll progress (0-1) and triggers onScrollProgress callback
   * Only triggers when scrolling down to avoid unnecessary preloading
   */
  const handleScroll = useCallback(() => {
    if (!containerRef.current || !onScrollProgress) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;

    // Calculate scroll progress (0 to 1)
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;

    // Only trigger if scrolling down
    if (scrollTop > lastScrollTop.current) {
      onScrollProgress(progress);
    }

    lastScrollTop.current = scrollTop;
  }, [onScrollProgress]);

  // Throttled scroll handler
  useEffect(() => {
    if (!onScrollProgress) return;

    const container = containerRef.current;
    if (!container) return;

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledScroll, { passive: true });
    return () => container.removeEventListener('scroll', throttledScroll);
  }, [handleScroll, onScrollProgress]);

  // Loading state - use skeleton loaders
  if (loading) {
    return (
      <div className="content-list-container" ref={containerRef} role="region" aria-label={`${contentType} content`} aria-busy="true">
        <div className="sr-only" role="status" aria-live="polite">Loading {contentType} records...</div>
        <SkeletonGrid count={12} viewMode={viewMode} />
      </div>
    );
  }

  // Empty state
  if (records.length === 0) {
    return (
      <div className="content-list-container" role="region" aria-label={`${contentType} content`}>
        <div className="content-list__empty" role="status" aria-live="polite">
          <div className="content-list__empty-icon" aria-hidden="true">
            {contentType === 'alumni' && '👥'}
            {contentType === 'publication' && '📚'}
            {contentType === 'photo' && '📷'}
            {contentType === 'faculty' && '👨‍🏫'}
          </div>
          <h3 className="content-list__empty-title">{emptyMessage}</h3>
          <p className="content-list__empty-description">{emptyDescription}</p>
          {onClearFilters && (
            <button
              className="content-list__empty-button"
              onClick={onClearFilters}
              type="button"
              aria-label="Clear all filters and show all records"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    );
  }

  // Content display
  return (
    <div className="content-list-container" ref={containerRef} role="region" aria-label={`${contentType} content`} aria-busy="false">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Showing {records.length} {contentType} {records.length === 1 ? 'record' : 'records'}
      </div>
      <div className={`content-list content-list--${viewMode} content-list--${contentType}`} role="list">
        {children}
      </div>
    </div>
  );
};
