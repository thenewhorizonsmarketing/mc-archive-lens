// Example usage of optimized filter count calculator
import React, { useState, useEffect, useCallback } from 'react';
import { FilterCountOptimizer, CountResult } from '../../lib/filters/FilterCountOptimizer';
import { FilterConfig } from '../../lib/filters/types';

// Mock query executor
const mockExecuteQuery = async (sql: string, params: any[]): Promise<any[]> => {
  // Simulate database query delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Return mock count
  const mockCount = Math.floor(Math.random() * 1000);
  return [{ count: mockCount }];
};

export const OptimizedFilterCountExample: React.FC = () => {
  const [optimizer] = useState(() => new FilterCountOptimizer());
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    type: 'alumni',
    operator: 'AND',
    textFilters: []
  });
  const [countResult, setCountResult] = useState<CountResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [useWorker, setUseWorker] = useState(false);
  const [showStaleData, setShowStaleData] = useState(true);
  const [debounceMs, setDebounceMs] = useState(200);

  // Calculate count when filter changes
  useEffect(() => {
    const calculateCount = async () => {
      setIsCalculating(true);

      try {
        const result = await optimizer.calculateCount(
          filterConfig,
          mockExecuteQuery,
          {
            debounceMs,
            useWorker,
            showStaleData,
            cacheResults: true
          }
        );

        setCountResult(result);
      } catch (error) {
        console.error('Failed to calculate count:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateCount();
  }, [filterConfig, optimizer, debounceMs, useWorker, showStaleData]);

  // Update filter when search term changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    
    setFilterConfig(prev => ({
      ...prev,
      textFilters: value ? [{
        field: 'name',
        value,
        matchType: 'contains',
        caseSensitive: false
      }] : []
    }));
  }, []);

  // Get cache stats
  const cacheStats = optimizer.getCacheStats();

  return (
    <div className="optimized-filter-count-example" style={{
      padding: '24px',
      background: 'var(--mc-blue)',
      minHeight: '100vh',
      color: 'var(--mc-white)'
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
          Optimized Filter Count Demo
        </h1>

        {/* Configuration */}
        <div style={{
          padding: '24px',
          background: 'var(--mc-blue-light)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: 'var(--mc-gold)', marginTop: 0 }}>
            Configuration
          </h2>

          <div style={{ display: 'grid', gap: '16px' }}>
            {/* Debounce delay */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px' }}>
                Debounce Delay: {debounceMs}ms
              </label>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={debounceMs}
                onChange={(e) => setDebounceMs(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Use Web Worker */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={useWorker}
                  onChange={(e) => setUseWorker(e.target.checked)}
                />
                Use Web Worker (offload to background thread)
              </label>
            </div>

            {/* Show stale data */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={showStaleData}
                  onChange={(e) => setShowStaleData(e.target.checked)}
                />
                Show stale data while calculating
              </label>
            </div>
          </div>
        </div>

        {/* Search input */}
        <div style={{
          padding: '24px',
          background: 'var(--mc-blue-light)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: 'var(--mc-gold)', marginTop: 0 }}>
            Search Filter
          </h2>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Type to filter (debounced)..."
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '18px',
              background: 'var(--mc-blue)',
              color: 'var(--mc-white)',
              border: '2px solid var(--mc-gold)',
              borderRadius: '8px'
            }}
          />

          <p style={{ 
            marginTop: '16px', 
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Try typing quickly - the count calculation will be debounced
          </p>
        </div>

        {/* Results */}
        <div style={{
          padding: '24px',
          background: 'var(--mc-blue-light)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: 'var(--mc-gold)', marginTop: 0 }}>
            Results
          </h2>

          {countResult && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                padding: '16px',
                background: 'var(--mc-blue)',
                border: '2px solid var(--mc-gold)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'var(--mc-gold)'
                }}>
                  {countResult.count.toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  Results Found
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: 'var(--mc-blue)',
                border: '2px solid var(--mc-gold)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: countResult.isStale ? '#FFA500' : '#00FF00'
                }}>
                  {countResult.isStale ? 'STALE' : 'FRESH'}
                </div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  Data Status
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: 'var(--mc-blue)',
                border: '2px solid var(--mc-gold)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: isCalculating ? '#FFA500' : '#00FF00'
                }}>
                  {isCalculating ? 'CALCULATING' : 'READY'}
                </div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  Calculation Status
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cache statistics */}
        <div style={{
          padding: '24px',
          background: 'var(--mc-blue-light)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: 'var(--mc-gold)', marginTop: 0 }}>
            Cache Statistics
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Cache Hits</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--mc-gold)' }}>
                {cacheStats.hits}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Cache Misses</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--mc-gold)' }}>
                {cacheStats.misses}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Hit Rate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--mc-gold)' }}>
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', opacity: 0.7 }}>Cache Size</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--mc-gold)' }}>
                {cacheStats.size}
              </div>
            </div>
          </div>

          <button
            onClick={() => optimizer.invalidateCache()}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: 'transparent',
              color: 'var(--mc-gold)',
              border: '2px solid var(--mc-gold)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Clear Cache
          </button>
        </div>

        {/* Performance benefits */}
        <div style={{
          padding: '24px',
          background: 'var(--mc-blue-light)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px'
        }}>
          <h2 style={{ color: 'var(--mc-gold)', marginTop: 0 }}>
            Performance Benefits
          </h2>

          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>
              <strong>Debouncing:</strong> Reduces unnecessary calculations by waiting for user to stop typing
            </li>
            <li>
              <strong>Caching:</strong> Stores results for 5 minutes to avoid recalculating same filters
            </li>
            <li>
              <strong>Stale Data:</strong> Shows previous results immediately while calculating new ones
            </li>
            <li>
              <strong>Web Workers:</strong> Offloads heavy calculations to background thread (optional)
            </li>
            <li>
              <strong>Batch Processing:</strong> Can calculate multiple filter counts in parallel
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OptimizedFilterCountExample;
