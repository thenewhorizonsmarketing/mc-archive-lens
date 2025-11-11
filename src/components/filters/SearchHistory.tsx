/**
 * SearchHistory Component
 * 
 * Displays search history in a timeline view with MC Blue styling.
 * Allows re-executing previous searches and viewing search details.
 */

import React, { useState, useEffect } from 'react';
import { getHistoryTracker, type HistoryEntry } from '../../lib/filters/HistoryTracker';
import type { FilterConfig } from '../../lib/filters/types';
import './SearchHistory.css';

export interface SearchHistoryProps {
  onExecuteSearch?: (filters: FilterConfig, query: string) => void;
  onClose?: () => void;
  contentType?: string;
  maxEntries?: number;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  onExecuteSearch,
  onClose,
  contentType,
  maxEntries = 50,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    loadHistory();
  }, [contentType, filter]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const tracker = getHistoryTracker();
      let entries: HistoryEntry[];

      if (contentType) {
        entries = await tracker.getByContentType(contentType);
      } else {
        entries = await tracker.getRecent(maxEntries);
      }

      // Apply time filter
      const now = new Date();
      const filtered = entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const daysDiff = (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);

        switch (filter) {
          case 'today':
            return daysDiff < 1;
          case 'week':
            return daysDiff < 7;
          case 'month':
            return daysDiff < 30;
          default:
            return true;
        }
      });

      setHistory(filtered);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSearch = (entry: HistoryEntry) => {
    if (onExecuteSearch) {
      onExecuteSearch(entry.filters, entry.query);
    }
  };

  const handleDeleteEntry = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const tracker = getHistoryTracker();
      await tracker.delete(id);
      await loadHistory();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all search history?')) {
      return;
    }

    try {
      const tracker = getHistoryTracker();
      await tracker.clearAll();
      await loadHistory();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const formatExecutionTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getContentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      alumni: 'Alumni',
      publication: 'Publications',
      photo: 'Photos',
      faculty: 'Faculty',
    };
    return labels[type] || type;
  };

  const groupByDate = (entries: HistoryEntry[]): Map<string, HistoryEntry[]> => {
    const groups = new Map<string, HistoryEntry[]>();
    
    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(entry);
    });

    return groups;
  };

  const groupedHistory = groupByDate(history);

  if (loading) {
    return (
      <div className="search-history">
        <div className="search-history-header">
          <h2>Search History</h2>
          {onClose && (
            <button className="close-button" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="search-history-loading">
          <div className="loading-spinner"></div>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-history">
      <div className="search-history-header">
        <h2>Search History</h2>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className="search-history-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
            onClick={() => setFilter('today')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button
            className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
            onClick={() => setFilter('month')}
          >
            This Month
          </button>
        </div>

        {history.length > 0 && (
          <button className="clear-all-btn" onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="search-history-empty">
          <p>No search history found</p>
          <span className="empty-icon">🔍</span>
        </div>
      ) : (
        <div className="search-history-timeline">
          {Array.from(groupedHistory.entries()).map(([dateGroup, entries]) => (
            <div key={dateGroup} className="timeline-group">
              <div className="timeline-date-header">{dateGroup}</div>
              
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`timeline-entry ${selectedEntry?.id === entry.id ? 'selected' : ''}`}
                  onClick={() => setSelectedEntry(entry)}
                  onMouseEnter={() => setSelectedEntry(entry)}
                  onMouseLeave={() => setSelectedEntry(null)}
                >
                  <div className="timeline-marker"></div>
                  
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <div className="timeline-query">
                        {entry.query || 'Empty search'}
                      </div>
                      <div className="timeline-time">
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>

                    <div className="timeline-meta">
                      <span className="meta-badge content-type">
                        {getContentTypeLabel(entry.contentType)}
                      </span>
                      <span className="meta-badge result-count">
                        {entry.resultCount} {entry.resultCount === 1 ? 'result' : 'results'}
                      </span>
                      <span className="meta-badge execution-time">
                        {formatExecutionTime(entry.executionTime)}
                      </span>
                    </div>

                    {selectedEntry?.id === entry.id && (
                      <div className="timeline-details">
                        <div className="details-section">
                          <strong>Filters Applied:</strong>
                          <div className="filter-summary">
                            {entry.filters.textFilters?.length || 0} text filters,{' '}
                            {entry.filters.dateFilters?.length || 0} date filters,{' '}
                            {entry.filters.rangeFilters?.length || 0} range filters
                          </div>
                        </div>

                        <div className="timeline-actions">
                          <button
                            className="action-btn execute-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteSearch(entry);
                            }}
                          >
                            Re-run Search
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={(e) => handleDeleteEntry(entry.id, e)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchHistory;
