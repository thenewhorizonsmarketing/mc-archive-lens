import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedQueryBuilder } from '../../lib/filters/AdvancedQueryBuilder';
import { FilterProcessor } from '../../lib/filters/FilterProcessor';
import { SuggestionEngine } from '../../lib/filters/SuggestionEngine';
import { SavedSearchManager } from '../../lib/filters/SavedSearchManager';
import { ExportManager } from '../../lib/filters/ExportManager';
import { HistoryTracker } from '../../lib/filters/HistoryTracker';
import type { FilterConfig } from '../../lib/filters/types';

describe('Advanced Filter E2E Flow', () => {
  let queryBuilder: AdvancedQueryBuilder;
  let filterProcessor: FilterProcessor;
  let suggestionEngine: SuggestionEngine;
  let savedSearchManager: SavedSearchManager;
  let exportManager: ExportManager;
  let historyTracker: HistoryTracker;

  beforeEach(async () => {
    queryBuilder = new AdvancedQueryBuilder();
    filterProcessor = new FilterProcessor();
    suggestionEngine = new SuggestionEngine();
    savedSearchManager = new SavedSearchManager();
    exportManager = new ExportManager();
    historyTracker = new HistoryTracker();
    
    await historyTracker.clear();
    localStorage.clear();
  });

  describe('Complete Search Flow', () => {
    it('should complete full search workflow from input to results', async () => {
      // Step 1: User types in search
      const searchInput = 'John';
      
      // Step 2: Get suggestions
      const suggestions = await suggestionEngine.generateSuggestions(
        searchInput,
        { type: 'alumni', operator: 'AND' },
        []
      );
      
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Step 3: User selects a suggestion
      const selectedSuggestion = suggestions[0];
      suggestionEngine.learnFromSelection(selectedSuggestion);
      
      // Step 4: Build filter configuration
      const filterConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: searchInput, matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };
      
      // Step 5: Validate filters
      const validation = filterProcessor.validateFilters(filterConfig);
      expect(validation.isValid).toBe(true);
      
      // Step 6: Build and execute query
      const query = queryBuilder.buildQuery(filterConfig);
      expect(query).toBeDefined();
      
      // Step 7: Apply filters to data
      const testData = [
        { id: 1, name: 'John Doe', city: 'Boston' },
        { id: 2, name: 'Jane Smith', city: 'New York' },
        { id: 3, name: 'John Adams', city: 'Boston' }
      ];
      
      const results = filterProcessor.applyFilters(testData, filterConfig);
      expect(results).toHaveLength(2);
      
      // Step 8: Record search in history
      await historyTracker.recordSearch(searchInput, filterConfig, results.length);
      
      const history = await historyTracker.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].query).toBe(searchInput);
    });

    it('should handle complex multi-filter search workflow', async () => {
      // Build complex filter
      const filterConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false },
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        rangeFilters: [
          { field: 'graduationYear', min: 2015, max: 2025 }
        ],
        booleanFilters: [
          { field: 'isActive', value: true }
        ],
        operator: 'AND'
      };
      
      // Validate
      const validation = filterProcessor.validateFilters(filterConfig);
      expect(validation.isValid).toBe(true);
      
      // Build query
      const query = queryBuilder.buildQuery(filterConfig);
      expect(query).toBeDefined();
      
      // Apply to data
      const testData = [
        { id: 1, name: 'John Doe', city: 'Boston', graduationYear: 2020, isActive: true },
        { id: 2, name: 'John Smith', city: 'New York', graduationYear: 2020, isActive: true },
        { id: 3, name: 'Jane Doe', city: 'Boston', graduationYear: 2020, isActive: true },
        { id: 4, name: 'John Adams', city: 'Boston', graduationYear: 2010, isActive: true },
        { id: 5, name: 'John Brown', city: 'Boston', graduationYear: 2020, isActive: false }
      ];
      
      const results = filterProcessor.applyFilters(testData, filterConfig);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });
  });

  describe('Saved Search Workflow', () => {
    it('should save, load, and execute saved search', async () => {
      // Step 1: Create and execute search
      const filterConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };
      
      const testData = [
        { id: 1, name: 'John Doe', city: 'Boston' },
        { id: 2, name: 'Jane Smith', city: 'New York' }
      ];
      
      const results = filterProcessor.applyFilters(testData, filterConfig);
      expect(results).toHaveLength(1);
      
      // Step 2: Save the search
      const savedSearch = await savedSearchManager.saveSearch(
        'Boston Alumni',
        filterConfig,
        'All alumni from Boston'
      );
      
      expect(savedSearch.id).toBeDefined();
      
      // Step 3: Load saved search
      const loaded = await savedSearchManager.loadSearch(savedSearch.id);
      expect(loaded).toBeDefined();
      expect(loaded?.filters).toEqual(filterConfig);
      
      // Step 4: Execute loaded search
      const loadedResults = filterProcessor.applyFilters(testData, loaded!.filters);
      expect(loadedResults).toEqual(results);
      
      // Step 5: Verify usage tracking
      expect(loaded?.useCount).toBeGreaterThan(savedSearch.useCount);
    });

    it('should share and restore search from URL', async () => {
      // Create filter config
      const originalConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        rangeFilters: [
          { field: 'graduationYear', min: 2015, max: 2025 }
        ],
        operator: 'AND'
      };
      
      // Generate shareable URL
      const shareURL = queryBuilder.generateShareableURL(originalConfig);
      expect(shareURL).toContain('filters=');
      
      // Parse URL to restore config
      const restoredConfig = queryBuilder.parseSharedURL(shareURL);
      expect(restoredConfig.type).toBe(originalConfig.type);
      expect(restoredConfig.textFilters).toHaveLength(1);
      expect(restoredConfig.rangeFilters).toHaveLength(1);
      
      // Execute restored search
      const testData = [
        { id: 1, name: 'John Doe', graduationYear: 2020 },
        { id: 2, name: 'Jane Smith', graduationYear: 2020 }
      ];
      
      const results = filterProcessor.applyFilters(testData, restoredConfig);
      expect(results).toHaveLength(1);
    });
  });

  describe('Export Workflow', () => {
    it('should filter and export results to CSV', async () => {
      // Create filter
      const filterConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };
      
      // Apply filter
      const testData = [
        { id: 1, name: 'John Doe', city: 'Boston', graduationYear: 2020 },
        { id: 2, name: 'Jane Smith', city: 'New York', graduationYear: 2021 },
        { id: 3, name: 'Bob Johnson', city: 'Boston', graduationYear: 2019 }
      ];
      
      const results = filterProcessor.applyFilters(testData, filterConfig);
      expect(results).toHaveLength(2);
      
      // Export to CSV
      const csv = await exportManager.exportToCSV(results, filterConfig);
      expect(csv).toContain('John Doe');
      expect(csv).toContain('Bob Johnson');
      expect(csv).not.toContain('Jane Smith');
    });

    it('should filter and export results to JSON', async () => {
      const filterConfig: FilterConfig = {
        type: 'alumni',
        rangeFilters: [
          { field: 'graduationYear', min: 2020, max: 2025 }
        ],
        operator: 'AND'
      };
      
      const testData = [
        { id: 1, name: 'John Doe', graduationYear: 2020 },
        { id: 2, name: 'Jane Smith', graduationYear: 2019 },
        { id: 3, name: 'Bob Johnson', graduationYear: 2021 }
      ];
      
      const results = filterProcessor.applyFilters(testData, filterConfig);
      
      const json = await exportManager.exportToJSON(results, filterConfig, {
        includeMetadata: true
      });
      
      const parsed = JSON.parse(json);
      expect(parsed.data).toHaveLength(2);
      expect(parsed.metadata.filterConfig).toEqual(filterConfig);
    });
  });

  describe('Analytics Workflow', () => {
    it('should track searches and generate analytics', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };
      
      // Perform multiple searches
      await historyTracker.recordSearch('John', config, 5);
      await historyTracker.recordSearch('Jane', config, 3);
      await historyTracker.recordSearch('John', config, 7);
      await historyTracker.recordSearch('Bob', config, 2);
      
      // Get analytics
      const analytics = await historyTracker.getAnalytics();
      
      expect(analytics.totalSearches).toBe(4);
      expect(analytics.uniqueQueries).toBe(3);
      expect(analytics.topSearchTerms[0].term).toBe('John');
      expect(analytics.topSearchTerms[0].count).toBe(2);
    });

    it('should use analytics to improve suggestions', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };
      
      // Build search history
      await historyTracker.recordSearch('John Doe', config, 10);
      await historyTracker.recordSearch('John Smith', config, 8);
      await historyTracker.recordSearch('Jane Doe', config, 5);
      
      const history = await historyTracker.getHistory();
      
      // Get suggestions based on history
      const suggestions = await suggestionEngine.generateSuggestions(
        'joh',
        config,
        history
      );
      
      expect(suggestions.length).toBeGreaterThan(0);
      
      // Recent searches should be prioritized
      const recentSuggestions = suggestions.filter(s => s.type === 'recent');
      expect(recentSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance E2E', () => {
    it('should handle complete workflow efficiently', async () => {
      const start = performance.now();
      
      // Generate large dataset
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Person ${i}`,
        city: i % 2 === 0 ? 'Boston' : 'New York',
        graduationYear: 2015 + (i % 10),
        isActive: i % 3 === 0
      }));
      
      // Create complex filter
      const filterConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        rangeFilters: [
          { field: 'graduationYear', min: 2018, max: 2023 }
        ],
        booleanFilters: [
          { field: 'isActive', value: true }
        ],
        operator: 'AND'
      };
      
      // Validate
      const validation = filterProcessor.validateFilters(filterConfig);
      expect(validation.isValid).toBe(true);
      
      // Build query
      const query = queryBuilder.buildQuery(filterConfig);
      
      // Apply filters
      const results = filterProcessor.applyFilters(largeData, filterConfig);
      
      // Record in history
      await historyTracker.recordSearch('Complex Search', filterConfig, results.length);
      
      // Export results
      await exportManager.exportToCSV(results, filterConfig);
      
      const duration = performance.now() - start;
      
      // Entire workflow should complete in under 500ms
      expect(duration).toBeLessThan(500);
    });
  });
});
