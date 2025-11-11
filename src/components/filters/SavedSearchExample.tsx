/**
 * SavedSearchExample Component
 * 
 * Demonstrates the complete saved search and share functionality
 * including SavedSearches UI, ShareDialog, and SavedSearchManager.
 */

import React, { useState, useEffect } from 'react';
import { SavedSearches } from './SavedSearches';
import { ShareDialog } from './ShareDialog';
import { getSavedSearchManager } from '../../lib/filters/SavedSearchManager';
import { getShareManager } from '../../lib/filters/ShareManager';
import type { FilterConfig } from '../../lib/filters/types';

export const SavedSearchExample: React.FC = () => {
  const [currentFilters, setCurrentFilters] = useState<FilterConfig>({
    type: 'alumni',
    operator: 'AND',
    textFilters: [
      {
        field: 'name',
        value: 'Smith',
        matchType: 'contains',
        caseSensitive: false,
      },
    ],
    dateFilters: [
      {
        field: 'graduationYear',
        startDate: new Date('1980-01-01'),
        endDate: new Date('1990-12-31'),
      },
    ],
  });

  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const savedSearchManager = getSavedSearchManager();
  const shareManager = getShareManager();

  // Check for shared filters on mount
  useEffect(() => {
    if (shareManager.hasSharedFilters()) {
      const sharedFilters = shareManager.getSharedFilters();
      if (sharedFilters) {
        setCurrentFilters(sharedFilters);
        showMessage('Loaded shared filters from URL');
      }
    }
  }, []);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleLoadSearch = (filters: FilterConfig) => {
    setCurrentFilters(filters);
    setShowSavedSearches(false);
    showMessage('Search loaded successfully');
  };

  const handleSaveSearch = () => {
    const name = prompt('Enter a name for this search:');
    if (!name) return;

    const description = prompt('Enter a description (optional):');
    
    savedSearchManager.save(
      name,
      currentFilters,
      description || undefined
    );
    
    showMessage('Search saved successfully');
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleClearFilters = () => {
    setCurrentFilters({
      type: 'alumni',
      operator: 'AND',
    });
    shareManager.clearSharedFilters();
    showMessage('Filters cleared');
  };

  const stats = savedSearchManager.getStatistics();

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div
        style={{
          background: 'var(--mc-blue, #0C2340)',
          padding: '32px',
          borderRadius: '12px',
          marginBottom: '32px',
        }}
      >
        <h1 style={{ color: 'var(--mc-white, #FFFFFF)', marginBottom: '24px' }}>
          Saved Search & Share Example
        </h1>

        {message && (
          <div
            style={{
              background: 'var(--mc-gold, #C99700)',
              color: 'var(--mc-blue, #0C2340)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              fontWeight: 600,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              background: 'rgba(201, 151, 0, 0.1)',
              border: '2px solid var(--mc-gold, #C99700)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--mc-gold, #C99700)',
              }}
            >
              {stats.totalSearches}
            </div>
            <div style={{ color: 'var(--mc-white, #FFFFFF)', opacity: 0.8 }}>
              Saved Searches
            </div>
          </div>

          <div
            style={{
              background: 'rgba(201, 151, 0, 0.1)',
              border: '2px solid var(--mc-gold, #C99700)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--mc-gold, #C99700)',
              }}
            >
              {stats.totalUses}
            </div>
            <div style={{ color: 'var(--mc-white, #FFFFFF)', opacity: 0.8 }}>
              Total Uses
            </div>
          </div>

          <div
            style={{
              background: 'rgba(201, 151, 0, 0.1)',
              border: '2px solid var(--mc-gold, #C99700)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--mc-gold, #C99700)',
              }}
            >
              {stats.averageUseCount.toFixed(1)}
            </div>
            <div style={{ color: 'var(--mc-white, #FFFFFF)', opacity: 0.8 }}>
              Avg Uses
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: 'var(--mc-white, #FFFFFF)', marginBottom: '16px' }}>
            Current Filters
          </h3>
          <pre
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid var(--mc-gold, #C99700)',
              color: 'var(--mc-white, #FFFFFF)',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '14px',
            }}
          >
            {JSON.stringify(currentFilters, null, 2)}
          </pre>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setShowSavedSearches(true)}
            style={{
              background: 'var(--mc-gold, #C99700)',
              border: 'none',
              color: 'var(--mc-blue, #0C2340)',
              padding: '14px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            📂 View Saved Searches
          </button>

          <button
            onClick={handleSaveSearch}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid var(--mc-gold, #C99700)',
              color: 'var(--mc-white, #FFFFFF)',
              padding: '14px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            💾 Save Current Search
          </button>

          <button
            onClick={handleShare}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '2px solid var(--mc-gold, #C99700)',
              color: 'var(--mc-white, #FFFFFF)',
              padding: '14px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🔗 Share Filters
          </button>

          <button
            onClick={handleClearFilters}
            style={{
              background: 'rgba(220, 53, 69, 0.2)',
              border: '2px solid #dc3545',
              color: '#ff6b6b',
              padding: '14px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            🗑️ Clear Filters
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'var(--mc-blue, #0C2340)',
          padding: '32px',
          borderRadius: '12px',
        }}
      >
        <h2 style={{ color: 'var(--mc-white, #FFFFFF)', marginBottom: '16px' }}>
          Features Demonstrated
        </h2>
        <ul
          style={{
            color: 'var(--mc-white, #FFFFFF)',
            lineHeight: 1.8,
            opacity: 0.9,
          }}
        >
          <li>Save search configurations with names and descriptions</li>
          <li>Load saved searches with usage tracking</li>
          <li>View all saved searches in a grid layout</li>
          <li>Edit and delete saved searches</li>
          <li>Duplicate existing searches</li>
          <li>Share filters via URL with encoded configuration</li>
          <li>Copy shareable URLs to clipboard</li>
          <li>Export filters as JSON files</li>
          <li>Native share API support (mobile)</li>
          <li>Automatic loading of shared filters from URL</li>
          <li>Usage statistics and analytics</li>
          <li>Search within saved searches</li>
          <li>Sort by recent, popular, or name</li>
        </ul>
      </div>

      {showSavedSearches && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowSavedSearches(false)}
        >
          <div
            style={{ maxWidth: '1200px', width: '100%' }}
            onClick={e => e.stopPropagation()}
          >
            <SavedSearches
              onLoad={handleLoadSearch}
              onClose={() => setShowSavedSearches(false)}
              currentFilters={currentFilters}
            />
          </div>
        </div>
      )}

      {showShareDialog && (
        <ShareDialog
          filters={currentFilters}
          onClose={() => setShowShareDialog(false)}
          metadata={{
            name: 'Example Search',
            description: 'Alumni search with name and graduation year filters',
          }}
        />
      )}
    </div>
  );
};
