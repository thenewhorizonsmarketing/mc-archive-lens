// Virtual scrolling results list for large datasets
import React, { useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

export interface ResultItem {
  id: string | number;
  [key: string]: any;
}

export interface VirtualResultsListProps {
  items: ResultItem[];
  itemHeight?: number;
  height?: number;
  width?: string | number;
  overscanCount?: number;
  renderItem: (item: ResultItem, index: number) => React.ReactNode;
  onItemClick?: (item: ResultItem, index: number) => void;
  className?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  isLoading?: boolean;
}

export const VirtualResultsList: React.FC<VirtualResultsListProps> = ({
  items,
  itemHeight = 120,
  height = 600,
  width = '100%',
  overscanCount = 5,
  renderItem,
  onItemClick,
  className = '',
  emptyMessage = 'No results found',
  loadingMessage = 'Loading...',
  isLoading = false
}) => {
  const listRef = useRef<List>(null);
  const [containerHeight, setContainerHeight] = useState(height);

  // Auto-adjust height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      const viewportHeight = window.innerHeight;
      const maxHeight = viewportHeight - 200; // Leave space for header/footer
      setContainerHeight(Math.min(height, maxHeight));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [height]);

  // Scroll to top when items change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [items]);

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    
    return (
      <div
        style={style}
        className="virtual-result-item"
        onClick={() => onItemClick?.(item, index)}
      >
        {renderItem(item, index)}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`virtual-results-loading ${className}`}>
        <div className="loading-spinner" />
        <p>{loadingMessage}</p>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={`virtual-results-empty ${className}`}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`virtual-results-list ${className}`}>
      <List
        ref={listRef}
        height={containerHeight}
        itemCount={items.length}
        itemSize={itemHeight}
        width={width}
        overscanCount={overscanCount}
      >
        {Row}
      </List>
      <div className="virtual-results-footer">
        Showing {items.length} result{items.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default VirtualResultsList;
