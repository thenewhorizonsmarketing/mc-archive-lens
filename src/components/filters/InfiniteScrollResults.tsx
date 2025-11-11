// Infinite scroll results with lazy loading
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

export interface InfiniteScrollItem {
  id: string | number;
  [key: string]: any;
}

export interface InfiniteScrollResultsProps {
  items: InfiniteScrollItem[];
  hasNextPage: boolean;
  isNextPageLoading: boolean;
  loadNextPage: () => Promise<void>;
  itemHeight?: number | ((index: number) => number);
  height?: number;
  width?: string | number;
  threshold?: number;
  renderItem: (item: InfiniteScrollItem, index: number) => React.ReactNode;
  onItemClick?: (item: InfiniteScrollItem, index: number) => void;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

export const InfiniteScrollResults: React.FC<InfiniteScrollResultsProps> = ({
  items,
  hasNextPage,
  isNextPageLoading,
  loadNextPage,
  itemHeight = 120,
  height = 600,
  width = '100%',
  threshold = 15,
  renderItem,
  onItemClick,
  className = '',
  emptyMessage = 'No results found',
  loadingMessage = 'Loading more...'
}) => {
  const listRef = useRef<List>(null);
  const [containerHeight, setContainerHeight] = useState(height);

  // Auto-adjust height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.innerHeight;
      const maxHeight = viewportHeight - 200;
      setContainerHeight(Math.min(height, maxHeight));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [height]);

  // Calculate item count including loading indicator
  const itemCount = hasNextPage ? items.length + 1 : items.length;

  // Check if item is loaded
  const isItemLoaded = (index: number) => !hasNextPage || index < items.length;

  // Load more items
  const loadMoreItems = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (!isNextPageLoading && hasNextPage) {
        await loadNextPage();
      }
    },
    [isNextPageLoading, hasNextPage, loadNextPage]
  );

  // Get item size
  const getItemSize = (index: number): number => {
    if (typeof itemHeight === 'function') {
      return itemHeight(index);
    }
    return itemHeight;
  };

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="infinite-scroll-loading">
          <div className="loading-spinner" />
          <p>{loadingMessage}</p>
        </div>
      );
    }

    const item = items[index];
    
    return (
      <div
        style={style}
        className="infinite-scroll-item"
        onClick={() => onItemClick?.(item, index)}
      >
        {renderItem(item, index)}
      </div>
    );
  };

  // Empty state
  if (items.length === 0 && !isNextPageLoading) {
    return (
      <div className={`infinite-scroll-empty ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`infinite-scroll-results ${className}`}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
        threshold={threshold}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(list) => {
              ref(list);
              (listRef as any).current = list;
            }}
            height={containerHeight}
            itemCount={itemCount}
            itemSize={getItemSize}
            width={width}
            onItemsRendered={onItemsRendered}
          >
            {Row}
          </List>
        )}
      </InfiniteLoader>
      <div className="infinite-scroll-footer">
        Showing {items.length} result{items.length !== 1 ? 's' : ''}
        {hasNextPage && ' (scroll for more)'}
      </div>
    </div>
  );
};

export default InfiniteScrollResults;
