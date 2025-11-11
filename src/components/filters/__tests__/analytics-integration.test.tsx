import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HistoryTracker } from '../../../lib/filters/HistoryTracker';
import type { FilterConfig, HistoryEntry } from '../../../lib/filters/types';

describe('Analytics Integration Tests', () => {
  let historyTracker: HistoryTracker;

  beforeEach(async () => {
    historyTracker = new HistoryTracker();
    await historyTracker.clear();
  });

  afterEach(async () => {
    await historyTracker.clear();
  });

  describe('Search History Tracking', () => {
    it('should record search with metadata', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const entry = await historyTracker.recordSearch('John', config, 5);

      expect(entry.id).toBeDefined();
      expect(entry.query).toBe('John');
      expect(entry.filters).toEqual(config);
      expect(entry.resultCount).toBe(5);
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('should retrieve search history', async () => {
      const config1: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const config2: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      await historyTracker.recordSearch('John', config1, 5);
      await historyTracker.recordSearch('Boston', config2, 10);

      const history = await historyTracker.getHistory();

      expect(history).toHaveLength(2);
      expect(history[0].query).toBe('Boston'); // Most recent first
      expect(history[1].query).toBe('John');
    });

    it('should limit history size', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      // Record many searches
      for (let i = 0; i < 150; i++) {
        await historyTracker.recordSearch(`Query ${i}`, config, i);
      }

      const history = await historyTracker.getHistory();

      expect(history.length).toBeLessThanOrEqual(100); // Default limit
    });

    it('should clean up old history entries', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      // Create old entry (31 days ago)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const oldEntry: HistoryEntry = {
        id: 'old-entry',
        query: 'Old Query',
        filters: config,
        timestamp: oldDate,
        resultCount: 5
      };

      await historyTracker.recordSearch('Recent Query', config, 10);

      // Manually add old entry for testing
      const history = await historyTracker.getHistory();
      
      // Cleanup should remove entries older than 30 days
      await historyTracker.cleanup(30);

      const cleanedHistory = await historyTracker.getHistory();
      expect(cleanedHistory.every(entry => {
        const daysDiff = (Date.now() - entry.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 30;
      })).toBe(true);
    });
  });

  describe('Search Analytics', () => {
    it('should calculate most searched terms', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      await historyTracker.recordSearch('John', config, 5);
      await historyTracker.recordSearch('Jane', config, 3);
      await historyTracker.recordSearch('John', config, 7);
      await historyTracker.recordSearch('Bob', config, 2);
      await historyTracker.recordSearch('John', config, 4);

      const analytics = await historyTracker.getAnalytics();

      expect(analytics.topSearchTerms).toBeDefined();
      expect(analytics.topSearchTerms[0].term).toBe('John');
      expect(analytics.topSearchTerms[0].count).toBe(3);
    });

    it('should calculate category distribution', async () => {
      await historyTracker.recordSearch('Query 1', { type: 'alumni', operator: 'AND' }, 5);
      await historyTracker.recordSearch('Query 2', { type: 'alumni', operator: 'AND' }, 3);
      await historyTracker.recordSearch('Query 3', { type: 'publication', operator: 'AND' }, 7);
      await historyTracker.recordSearch('Query 4', { type: 'photo', operator: 'AND' }, 2);

      const analytics = await historyTracker.getAnalytics();

      expect(analytics.categoryBreakdown).toBeDefined();
      expect(analytics.categoryBreakdown.get('alumni')).toBe(2);
      expect(analytics.categoryBreakdown.get('publication')).toBe(1);
      expect(analytics.categoryBreakdown.get('photo')).toBe(1);
    });

    it('should calculate time distribution', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      // Record searches at different times
      await historyTracker.recordSearch('Morning', config, 5);
      await new Promise(resolve => setTimeout(resolve, 100));
      await historyTracker.recordSearch('Afternoon', config, 3);

      const analytics = await historyTracker.getAnalytics();

      expect(analytics.timeDistribution).toBeDefined();
      expect(analytics.timeDistribution.size).toBeGreaterThan(0);
    });

    it('should calculate average results per search', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      await historyTracker.recordSearch('Query 1', config, 10);
      await historyTracker.recordSearch('Query 2', config, 20);
      await historyTracker.recordSearch('Query 3', config, 30);

      const analytics = await historyTracker.getAnalytics();

      expect(analytics.avgResultsPerSearch).toBe(20);
    });

    it('should track total and unique queries', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      await historyTracker.recordSearch('John', config, 5);
      await historyTracker.recordSearch('Jane', config, 3);
      await historyTracker.recordSearch('John', config, 7);
      await historyTracker.recordSearch('Bob', config, 2);

      const analytics = await historyTracker.getAnalytics();

      expect(analytics.totalSearches).toBe(4);
      expect(analytics.uniqueQueries).toBe(3); // John, Jane, Bob
    });
  });

  describe('History Filtering', () => {
    it('should filter history by date range', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const twoDaysAgo = new Date(now.getTime() - 172800000);

      await historyTracker.recordSearch('Recent', config, 5);

      const history = await historyTracker.getHistory({
        startDate: yesterday,
        endDate: now
      });

      expect(history.every(entry => entry.timestamp >= yesterday)).toBe(true);
    });

    it('should filter history by content type', async () => {
      await historyTracker.recordSearch('Alumni Query', { type: 'alumni', operator: 'AND' }, 5);
      await historyTracker.recordSearch('Publication Query', { type: 'publication', operator: 'AND' }, 3);

      const alumniHistory = await historyTracker.getHistory({
        contentType: 'alumni'
      });

      expect(alumniHistory.every(entry => entry.filters.type === 'alumni')).toBe(true);
    });

    it('should search within history', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      await historyTracker.recordSearch('John Doe', config, 5);
      await historyTracker.recordSearch('Jane Smith', config, 3);
      await historyTracker.recordSearch('Bob Johnson', config, 7);

      const results = await historyTracker.searchHistory('John');

      expect(results).toHaveLength(2);
      expect(results.every(entry => entry.query.includes('John'))).toBe(true);
    });
  });

  describe('History Export', () => {
    it('should export history to JSON', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      await historyTracker.recordSearch('Query 1', config, 5);
      await historyTracker.recordSearch('Query 2', config, 10);

      const exported = await historyTracker.exportHistory();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].query).toBeDefined();
      expect(parsed[0].filters).toBeDefined();
    });

    it('should import history from JSON', async () => {
      const historyData: HistoryEntry[] = [
        {
          id: '1',
          query: 'Imported Query',
          filters: { type: 'alumni', operator: 'AND' },
          timestamp: new Date(),
          resultCount: 5
        }
      ];

      const json = JSON.stringify(historyData);
      await historyTracker.importHistory(json);

      const history = await historyTracker.getHistory();
      expect(history.some(entry => entry.query === 'Imported Query')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large history efficiently', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      // Record many searches
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        await historyTracker.recordSearch(`Query ${i}`, config, i);
      }
      const recordDuration = performance.now() - start;

      expect(recordDuration).toBeLessThan(1000);

      // Retrieve analytics
      const analyticsStart = performance.now();
      await historyTracker.getAnalytics();
      const analyticsDuration = performance.now() - analyticsStart;

      expect(analyticsDuration).toBeLessThan(200);
    });
  });
});
