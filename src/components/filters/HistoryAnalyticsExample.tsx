/**
 * HistoryAnalyticsExample
 * 
 * Example component demonstrating the usage of SearchHistory and SearchAnalytics.
 * Shows how to integrate history tracking with search functionality.
 */

import React, { useState } from 'react';
import { SearchHistory } from './SearchHistory';
import { SearchAnalytics } from './SearchAnalytics';
import { getHistoryTracker } from '../../lib/filters/HistoryTracker';
import type { FilterConfig } from '../../lib/filters/types';

export const HistoryAnalyticsExample: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState<'alumni' | 'publication' | 'photo' | 'faculty'>('alumni');

  // Simulate a search execution
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search query');
      return;
    }

    const startTime = Date.now();

    // Simulate search execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    const executionTime = Date.now() - startTime;
    const resultCount = Math.floor(Math.random() * 50) + 1;

    // Create filter config
    const filters: FilterConfig = {
      type: contentType,
      operator: 'AND',
      textFilters: searchQuery ? [{
        field: 'name',
        value: searchQuery,
        matchType: 'contains',
        caseSensitive: false,
      }] : [],
    };

    // Record in history
    try {
      const tracker = getHistoryTracker();
      await tracker.recordSearch(
        searchQuery,
        filters,
        resultCount,
        executionTime,
        {
          source: 'example-component',
        }
      );

      alert(`Search recorded!\nQuery: "${searchQuery}"\nResults: ${resultCount}\nTime: ${executionTime}ms`);
    } catch (error) {
      console.error('Failed to record search:', error);
    }
  };

  // Handle re-executing a search from history
  const handleExecuteFromHistory = (filters: FilterConfig, query: string) => {
    setSearchQuery(query);
    setContentType(filters.type as any);
    setShowHistory(false);
    alert(`Re-executing search: "${query}"`);
  };

  // Generate sample data for testing
  const generateSampleData = async () => {
    const tracker = getHistoryTracker();
    const queries = [
      'John Smith',
      'Law Review',
      'Class of 1980',
      'Faculty',
      'Publications',
      'Alumni Directory',
      'Graduation Photos',
      'Dean',
    ];

    const types: Array<'alumni' | 'publication' | 'photo' | 'faculty'> = [
      'alumni',
      'publication',
      'photo',
      'faculty',
    ];

    for (let i = 0; i < 20; i++) {
      const query = queries[Math.floor(Math.random() * queries.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const resultCount = Math.floor(Math.random() * 50) + 1;
      const executionTime = Math.floor(Math.random() * 300) + 50;

      const filters: FilterConfig = {
        type,
        operator: 'AND',
        textFilters: [{
          field: 'name',
          value: query,
          matchType: 'contains',
          caseSensitive: false,
        }],
      };

      // Create entries with varying timestamps
      const daysAgo = Math.floor(Math.random() * 14);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);

      await tracker.recordSearch(query, filters, resultCount, executionTime);
    }

    alert('Generated 20 sample search entries!');
  };

  // Clear all history
  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history?')) {
      return;
    }

    try {
      const tracker = getHistoryTracker();
      await tracker.clearAll();
      alert('History cleared!');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        background: 'var(--mc-blue, #0C2340)',
        border: '2px solid var(--mc-gold, #C99700)',
        borderRadius: '12px',
        padding: '32px',
        color: 'var(--mc-white, #FFFFFF)',
      }}>
        <h1 style={{ marginTop: 0, color: 'var(--mc-gold, #C99700)' }}>
          Search History & Analytics Example
        </h1>

        <p style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '32px' }}>
          This example demonstrates the search history tracking and analytics features.
          Try performing searches, viewing history, and exploring analytics.
        </p>

        {/* Search Form */}
        <div style={{
          background: 'rgba(201, 151, 0, 0.1)',
          border: '1px solid var(--mc-gold, #C99700)',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--mc-gold, #C99700)' }}>
            Perform a Search
          </h3>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query..."
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'var(--mc-blue, #0C2340)',
                border: '2px solid var(--mc-gold, #C99700)',
                borderRadius: '8px',
                color: 'var(--mc-white, #FFFFFF)',
                fontSize: '16px',
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />

            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as any)}
              style={{
                padding: '12px 16px',
                background: 'var(--mc-blue, #0C2340)',
                border: '2px solid var(--mc-gold, #C99700)',
                borderRadius: '8px',
                color: 'var(--mc-white, #FFFFFF)',
                fontSize: '16px',
              }}
            >
              <option value="alumni">Alumni</option>
              <option value="publication">Publications</option>
              <option value="photo">Photos</option>
              <option value="faculty">Faculty</option>
            </select>

            <button
              onClick={handleSearch}
              style={{
                padding: '12px 24px',
                background: 'var(--mc-gold, #C99700)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--mc-blue, #0C2340)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '32px',
        }}>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              padding: '16px',
              background: 'rgba(201, 151, 0, 0.2)',
              border: '2px solid var(--mc-gold, #C99700)',
              borderRadius: '8px',
              color: 'var(--mc-white, #FFFFFF)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            📜 View History
          </button>

          <button
            onClick={() => setShowAnalytics(true)}
            style={{
              padding: '16px',
              background: 'rgba(201, 151, 0, 0.2)',
              border: '2px solid var(--mc-gold, #C99700)',
              borderRadius: '8px',
              color: 'var(--mc-white, #FFFFFF)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            📊 View Analytics
          </button>

          <button
            onClick={generateSampleData}
            style={{
              padding: '16px',
              background: 'rgba(201, 151, 0, 0.2)',
              border: '2px solid var(--mc-gold, #C99700)',
              borderRadius: '8px',
              color: 'var(--mc-white, #FFFFFF)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            🎲 Generate Sample Data
          </button>

          <button
            onClick={clearHistory}
            style={{
              padding: '16px',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '2px solid rgba(255, 68, 68, 0.5)',
              borderRadius: '8px',
              color: '#ff4444',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            🗑️ Clear History
          </button>
        </div>

        {/* Feature List */}
        <div style={{
          background: 'rgba(201, 151, 0, 0.05)',
          border: '1px solid rgba(201, 151, 0, 0.2)',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--mc-gold, #C99700)' }}>
            Features
          </h3>
          <ul style={{ lineHeight: '1.8', paddingLeft: '20px' }}>
            <li>🔍 <strong>Search History:</strong> View timeline of all searches with details</li>
            <li>📊 <strong>Search Analytics:</strong> Comprehensive statistics and insights</li>
            <li>🔄 <strong>Re-execute Searches:</strong> Quickly re-run previous searches</li>
            <li>📈 <strong>Top Terms:</strong> See most frequently searched terms</li>
            <li>🎯 <strong>Category Distribution:</strong> Visual breakdown by content type</li>
            <li>⏰ <strong>Time Analysis:</strong> Search activity by hour of day</li>
            <li>💾 <strong>IndexedDB Storage:</strong> Persistent history across sessions</li>
            <li>🧹 <strong>Auto Cleanup:</strong> Removes entries older than 30 days</li>
          </ul>
        </div>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <SearchHistory
            onExecuteSearch={handleExecuteFromHistory}
            onClose={() => setShowHistory(false)}
          />
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <SearchAnalytics onClose={() => setShowAnalytics(false)} />
        </div>
      )}
    </div>
  );
};

export default HistoryAnalyticsExample;
