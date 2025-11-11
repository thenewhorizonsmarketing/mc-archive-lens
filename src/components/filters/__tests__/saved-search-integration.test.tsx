import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SavedSearchManager } from '../../../lib/filters/SavedSearchManager';
import { ShareManager } from '../../../lib/filters/ShareManager';
import type { FilterConfig, SavedSearch } from '../../../lib/filters/types';

describe('Saved Search Integration Tests', () => {
  let savedSearchManager: SavedSearchManager;
  let shareManager: ShareManager;

  beforeEach(() => {
    savedSearchManager = new SavedSearchManager();
    shareManager = new ShareManager();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Saved Search Workflow', () => {
    it('should save and load a search', async () => {
      const filterConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const savedSearch = await savedSearchManager.saveSearch(
        'My Test Search',
        filterConfig,
        'Test description'
      );

      expect(savedSearch.id).toBeDefined();
      expect(savedSearch.name).toBe('My Test Search');

      const loaded = await savedSearchManager.loadSearch(savedSearch.id);
      expect(loaded).toBeDefined();
      expect(loaded?.filters).toEqual(filterConfig);
    });

    it('should list all saved searches', async () => {
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

      await savedSearchManager.saveSearch('Search 1', config1);
      await savedSearchManager.saveSearch('Search 2', config2);

      const allSearches = await savedSearchManager.getAllSearches();
      expect(allSearches).toHaveLength(2);
    });

    it('should delete a saved search', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const saved = await savedSearchManager.saveSearch('To Delete', config);
      await savedSearchManager.deleteSearch(saved.id);

      const loaded = await savedSearchManager.loadSearch(saved.id);
      expect(loaded).toBeNull();
    });

    it('should update search metadata on use', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const saved = await savedSearchManager.saveSearch('Test Search', config);
      const initialUseCount = saved.useCount;

      await savedSearchManager.loadSearch(saved.id);
      const updated = await savedSearchManager.loadSearch(saved.id);

      expect(updated?.useCount).toBeGreaterThan(initialUseCount);
    });
  });

  describe('Share Functionality', () => {
    it('should generate shareable URL', () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const url = shareManager.generateShareURL(config);
      expect(url).toContain('filters=');
      expect(url.length).toBeGreaterThan(0);
    });

    it('should parse shared URL and restore filters', () => {
      const originalConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John Doe', matchType: 'contains', caseSensitive: false },
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        rangeFilters: [
          { field: 'graduationYear', min: 2015, max: 2025 }
        ],
        operator: 'AND'
      };

      const url = shareManager.generateShareURL(originalConfig);
      const parsedConfig = shareManager.parseShareURL(url);

      expect(parsedConfig.type).toBe(originalConfig.type);
      expect(parsedConfig.operator).toBe(originalConfig.operator);
      expect(parsedConfig.textFilters).toHaveLength(2);
      expect(parsedConfig.rangeFilters).toHaveLength(1);
    });

    it('should handle URL encoding/decoding correctly', () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'O\'Brien & Associates', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const url = shareManager.generateShareURL(config);
      const parsed = shareManager.parseShareURL(url);

      expect(parsed.textFilters?.[0].value).toBe('O\'Brien & Associates');
    });

    it('should copy URL to clipboard', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      // Mock clipboard API
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined)
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      const url = shareManager.generateShareURL(config);
      await shareManager.copyToClipboard(url);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(url);
    });
  });

  describe('Search Persistence', () => {
    it('should persist searches to localStorage', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      await savedSearchManager.saveSearch('Persistent Search', config);

      // Create new instance to simulate page reload
      const newManager = new SavedSearchManager();
      const searches = await newManager.getAllSearches();

      expect(searches).toHaveLength(1);
      expect(searches[0].name).toBe('Persistent Search');
    });

    it('should handle localStorage quota exceeded', async () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError');
      });

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      await expect(
        savedSearchManager.saveSearch('Test', config)
      ).rejects.toThrow();

      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('Search Analytics', () => {
    it('should track search usage statistics', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const saved = await savedSearchManager.saveSearch('Analytics Test', config);

      // Use the search multiple times
      await savedSearchManager.loadSearch(saved.id);
      await savedSearchManager.loadSearch(saved.id);
      await savedSearchManager.loadSearch(saved.id);

      const updated = await savedSearchManager.loadSearch(saved.id);
      expect(updated?.useCount).toBeGreaterThanOrEqual(3);
    });

    it('should update last used timestamp', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const saved = await savedSearchManager.saveSearch('Timestamp Test', config);
      const originalTimestamp = saved.lastUsed;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      await savedSearchManager.loadSearch(saved.id);
      const updated = await savedSearchManager.loadSearch(saved.id);

      expect(updated?.lastUsed.getTime()).toBeGreaterThan(originalTimestamp.getTime());
    });
  });
});
