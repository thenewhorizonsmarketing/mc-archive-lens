// Example usage of virtual scrolling components
import React, { useState, useCallback } from 'react';
import { VirtualResultsList } from './VirtualResultsList';
import { InfiniteScrollResults } from './InfiniteScrollResults';
import { LazyImage } from './LazyImage';

// Mock data generator
const generateMockData = (count: number, startId: number = 0) => {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    name: `Result ${startId + i + 1}`,
    description: `This is a description for result ${startId + i + 1}`,
    image: `https://picsum.photos/seed/${startId + i}/200/150`,
    date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    category: ['Alumni', 'Publication', 'Photo', 'Faculty'][Math.floor(Math.random() * 4)]
  }));
};

export const VirtualScrollExample: React.FC = () => {
  const [mode, setMode] = useState<'fixed' | 'infinite'>('fixed');
  
  // Fixed size list state
  const [fixedItems] = useState(() => generateMockData(10000));
  
  // Infinite scroll state
  const [infiniteItems, setInfiniteItems] = useState(() => generateMockData(50));
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Load next page for infinite scroll
  const loadNextPage = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nextItems = generateMockData(50, infiniteItems.length);
    setInfiniteItems(prev => [...prev, ...nextItems]);
    
    // Stop loading after 500 items
    if (infiniteItems.length + 50 >= 500) {
      setHasNextPage(false);
    }
    
    setIsLoading(false);
  }, [infiniteItems.length]);

  // Render individual result item
  const renderItem = (item: any, index: number) => (
    <div className="result-card" style={{
      padding: '16px',
      borderBottom: '1px solid var(--mc-gold-light)',
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
      background: index % 2 === 0 ? 'var(--mc-blue)' : 'var(--mc-blue-light)',
      color: 'var(--mc-white)'
    }}>
      <LazyImage
        src={item.image}
        alt={item.name}
        width={100}
        height={75}
        className="result-image"
      />
      <div className="result-content" style={{ flex: 1 }}>
        <h3 style={{ 
          margin: 0, 
          color: 'var(--mc-gold)',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {item.name}
        </h3>
        <p style={{ 
          margin: '8px 0', 
          fontSize: '14px',
          color: 'var(--mc-white)'
        }}>
          {item.description}
        </p>
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <span>{item.category}</span>
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  // Handle item click
  const handleItemClick = (item: any, index: number) => {
    console.log('Clicked item:', item, 'at index:', index);
  };

  return (
    <div className="virtual-scroll-example" style={{
      padding: '24px',
      background: 'var(--mc-blue)',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          color: 'var(--mc-gold)',
          fontSize: '32px',
          marginBottom: '24px'
        }}>
          Virtual Scrolling Performance Demo
        </h1>

        {/* Mode selector */}
        <div style={{
          marginBottom: '24px',
          display: 'flex',
          gap: '16px'
        }}>
          <button
            onClick={() => setMode('fixed')}
            style={{
              padding: '12px 24px',
              background: mode === 'fixed' ? 'var(--mc-gold)' : 'transparent',
              color: mode === 'fixed' ? 'var(--mc-blue)' : 'var(--mc-white)',
              border: '2px solid var(--mc-gold)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Fixed Size List (10,000 items)
          </button>
          <button
            onClick={() => setMode('infinite')}
            style={{
              padding: '12px 24px',
              background: mode === 'infinite' ? 'var(--mc-gold)' : 'transparent',
              color: mode === 'infinite' ? 'var(--mc-blue)' : 'var(--mc-white)',
              border: '2px solid var(--mc-gold)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Infinite Scroll (Load on demand)
          </button>
        </div>

        {/* Performance info */}
        <div style={{
          padding: '16px',
          background: 'var(--mc-blue-light)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px',
          marginBottom: '24px',
          color: 'var(--mc-white)'
        }}>
          <h3 style={{ color: 'var(--mc-gold)', marginTop: 0 }}>
            Performance Benefits:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Only renders visible items + buffer</li>
            <li>Smooth 60fps scrolling even with 10,000+ items</li>
            <li>Lazy loads images as they come into view</li>
            <li>Minimal memory footprint</li>
            <li>Instant filter updates</li>
          </ul>
        </div>

        {/* Virtual list */}
        {mode === 'fixed' ? (
          <VirtualResultsList
            items={fixedItems}
            itemHeight={120}
            height={600}
            renderItem={renderItem}
            onItemClick={handleItemClick}
            className="demo-list"
          />
        ) : (
          <InfiniteScrollResults
            items={infiniteItems}
            hasNextPage={hasNextPage}
            isNextPageLoading={isLoading}
            loadNextPage={loadNextPage}
            itemHeight={120}
            height={600}
            renderItem={renderItem}
            onItemClick={handleItemClick}
            className="demo-list"
          />
        )}
      </div>

      <style>{`
        .lazy-image-container {
          position: relative;
          overflow: hidden;
          border-radius: 8px;
        }

        .lazy-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease;
        }

        .lazy-image.loading {
          opacity: 0;
        }

        .lazy-image.loaded {
          opacity: 1;
        }

        .lazy-image-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--mc-blue-light);
          overflow: hidden;
        }

        .skeleton-shimmer {
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(201, 151, 0, 0.1),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .result-card {
          transition: background 0.2s ease;
        }

        .result-card:hover {
          background: var(--mc-gold-light) !important;
          cursor: pointer;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--mc-gold-light);
          border-top-color: var(--mc-gold);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .virtual-results-loading,
        .virtual-results-empty,
        .infinite-scroll-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          color: var(--mc-white);
          background: var(--mc-blue);
          border: 2px solid var(--mc-gold);
          border-radius: 12px;
        }

        .virtual-results-footer,
        .infinite-scroll-footer {
          padding: 16px;
          text-align: center;
          color: var(--mc-gold);
          font-size: 14px;
          font-weight: bold;
          background: var(--mc-blue-light);
          border: 2px solid var(--mc-gold);
          border-top: none;
          border-radius: 0 0 12px 12px;
        }

        .virtual-results-list,
        .infinite-scroll-results {
          border: 2px solid var(--mc-gold);
          border-radius: 12px;
          overflow: hidden;
        }

        .infinite-scroll-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: var(--mc-white);
        }
      `}</style>
    </div>
  );
};

export default VirtualScrollExample;
