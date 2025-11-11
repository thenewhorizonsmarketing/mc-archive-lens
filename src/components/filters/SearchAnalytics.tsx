/**
 * SearchAnalytics Component
 * 
 * Displays comprehensive analytics dashboard for search history.
 * Shows most searched terms, category distribution, and time-based analytics.
 * Uses MC Blue and gold colors for charts and visualizations.
 */

import React, { useState, useEffect } from 'react';
import { getHistoryTracker, type HistoryStats } from '../../lib/filters/HistoryTracker';
import './SearchAnalytics.css';

export interface SearchAnalyticsProps {
  onClose?: () => void;
  contentType?: string;
}

export const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({
  onClose,
  contentType,
}) => {
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadStatistics();
  }, [contentType, timeRange]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const tracker = getHistoryTracker();
      const statistics = await tracker.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getMaxCount = (items: Array<{ count: number }>): number => {
    return Math.max(...items.map(item => item.count), 1);
  };

  const getCategoryLabel = (type: string): string => {
    const labels: Record<string, string> = {
      alumni: 'Alumni',
      publication: 'Publications',
      photo: 'Photos',
      faculty: 'Faculty',
    };
    return labels[type] || type;
  };

  const getCategoryColor = (index: number): string => {
    const colors = [
      'var(--mc-gold, #C99700)',
      'rgba(201, 151, 0, 0.7)',
      'rgba(201, 151, 0, 0.5)',
      'rgba(201, 151, 0, 0.3)',
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="search-analytics">
        <div className="analytics-header">
          <h2>Search Analytics</h2>
          {onClose && (
            <button className="close-button" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalSearches === 0) {
    return (
      <div className="search-analytics">
        <div className="analytics-header">
          <h2>Search Analytics</h2>
          {onClose && (
            <button className="close-button" onClick={onClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="analytics-empty">
          <p>No search data available yet</p>
          <span className="empty-icon">📊</span>
        </div>
      </div>
    );
  }

  const categoryData = Array.from(stats.categoryBreakdown.entries()).map(
    ([category, count]) => ({ category, count })
  );

  const timeData = Array.from(stats.timeDistribution.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const maxCategoryCount = getMaxCount(categoryData);
  const maxTimeCount = getMaxCount(timeData);

  return (
    <div className="search-analytics">
      <div className="analytics-header">
        <h2>Search Analytics</h2>
        {onClose && (
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-icon">🔍</div>
          <div className="summary-content">
            <div className="summary-value">{formatNumber(stats.totalSearches)}</div>
            <div className="summary-label">Total Searches</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">✨</div>
          <div className="summary-content">
            <div className="summary-value">{formatNumber(stats.uniqueQueries)}</div>
            <div className="summary-label">Unique Queries</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <div className="summary-value">
              {stats.avgResultsPerSearch.toFixed(1)}
            </div>
            <div className="summary-label">Avg Results</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⚡</div>
          <div className="summary-content">
            <div className="summary-value">
              {formatTime(stats.avgExecutionTime)}
            </div>
            <div className="summary-label">Avg Speed</div>
          </div>
        </div>
      </div>

      {/* Top Search Terms */}
      <div className="analytics-section">
        <h3 className="section-title">Top Search Terms</h3>
        <div className="top-terms-list">
          {stats.topSearchTerms.length === 0 ? (
            <p className="no-data">No search terms yet</p>
          ) : (
            stats.topSearchTerms.map((term, index) => (
              <div key={term.term} className="term-item">
                <div className="term-rank">{index + 1}</div>
                <div className="term-content">
                  <div className="term-text">{term.term || '(empty search)'}</div>
                  <div className="term-bar-container">
                    <div
                      className="term-bar"
                      style={{
                        width: `${(term.count / stats.topSearchTerms[0].count) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="term-count">{term.count}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Distribution */}
      <div className="analytics-section">
        <h3 className="section-title">Category Distribution</h3>
        <div className="category-chart">
          {categoryData.length === 0 ? (
            <p className="no-data">No category data yet</p>
          ) : (
            <>
              <div className="chart-bars">
                {categoryData.map((item, index) => (
                  <div key={item.category} className="chart-bar-item">
                    <div className="chart-bar-label">
                      {getCategoryLabel(item.category)}
                    </div>
                    <div className="chart-bar-container">
                      <div
                        className="chart-bar"
                        style={{
                          width: `${(item.count / maxCategoryCount) * 100}%`,
                          background: getCategoryColor(index),
                        }}
                      >
                        <span className="chart-bar-value">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chart-pie">
                <svg viewBox="0 0 200 200" className="pie-chart">
                  {(() => {
                    let currentAngle = 0;
                    const total = categoryData.reduce((sum, item) => sum + item.count, 0);
                    
                    return categoryData.map((item, index) => {
                      const percentage = item.count / total;
                      const angle = percentage * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;
                      
                      currentAngle = endAngle;
                      
                      // Calculate path for pie slice
                      const startRad = (startAngle - 90) * (Math.PI / 180);
                      const endRad = (endAngle - 90) * (Math.PI / 180);
                      const x1 = 100 + 80 * Math.cos(startRad);
                      const y1 = 100 + 80 * Math.sin(startRad);
                      const x2 = 100 + 80 * Math.cos(endRad);
                      const y2 = 100 + 80 * Math.sin(endRad);
                      const largeArc = angle > 180 ? 1 : 0;
                      
                      const path = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;
                      
                      return (
                        <path
                          key={item.category}
                          d={path}
                          fill={getCategoryColor(index)}
                          stroke="var(--mc-blue, #0C2340)"
                          strokeWidth="2"
                        >
                          <title>
                            {getCategoryLabel(item.category)}: {item.count} ({(percentage * 100).toFixed(1)}%)
                          </title>
                        </path>
                      );
                    });
                  })()}
                </svg>
                <div className="pie-legend">
                  {categoryData.map((item, index) => {
                    const total = categoryData.reduce((sum, i) => sum + i.count, 0);
                    const percentage = ((item.count / total) * 100).toFixed(1);
                    return (
                      <div key={item.category} className="legend-item">
                        <div
                          className="legend-color"
                          style={{ background: getCategoryColor(index) }}
                        ></div>
                        <div className="legend-label">
                          {getCategoryLabel(item.category)}
                        </div>
                        <div className="legend-value">{percentage}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Time Distribution */}
      <div className="analytics-section">
        <h3 className="section-title">Search Activity by Hour</h3>
        <div className="time-chart">
          {timeData.length === 0 ? (
            <p className="no-data">No time data yet</p>
          ) : (
            <div className="time-bars">
              {timeData.map((item) => (
                <div key={item.hour} className="time-bar-item">
                  <div
                    className="time-bar"
                    style={{
                      height: `${(item.count / maxTimeCount) * 100}%`,
                    }}
                    title={`${item.hour}: ${item.count} searches`}
                  >
                    <span className="time-bar-value">{item.count}</span>
                  </div>
                  <div className="time-bar-label">{item.hour}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="analytics-section">
        <h3 className="section-title">Recent Activity</h3>
        <div className="recent-activity">
          {stats.recentSearches.length === 0 ? (
            <p className="no-data">No recent searches</p>
          ) : (
            stats.recentSearches.slice(0, 5).map((entry) => (
              <div key={entry.id} className="activity-item">
                <div className="activity-time">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
                <div className="activity-query">
                  {entry.query || '(empty search)'}
                </div>
                <div className="activity-meta">
                  <span className="activity-badge">
                    {getCategoryLabel(entry.contentType)}
                  </span>
                  <span className="activity-badge">
                    {entry.resultCount} results
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAnalytics;
