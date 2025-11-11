import { describe, it, expect, beforeEach } from 'vitest';
import { ExportManager } from '../../../lib/filters/ExportManager';
import type { FilterConfig } from '../../../lib/filters/types';

describe('Export Integration Tests', () => {
  let exportManager: ExportManager;

  beforeEach(() => {
    exportManager = new ExportManager();
  });

  describe('CSV Export', () => {
    it('should export filtered results to CSV', async () => {
      const data = [
        { id: 1, name: 'John Doe', city: 'Boston', graduationYear: 2020 },
        { id: 2, name: 'Jane Smith', city: 'New York', graduationYear: 2021 },
        { id: 3, name: 'Bob Johnson', city: 'Boston', graduationYear: 2019 }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const csv = await exportManager.exportToCSV(data, config);

      expect(csv).toContain('id,name,city,graduationYear');
      expect(csv).toContain('John Doe');
      expect(csv).toContain('Bob Johnson');
      expect(csv).not.toContain('Jane Smith');
    });

    it('should handle special characters in CSV export', async () => {
      const data = [
        { id: 1, name: 'O\'Brien, John', city: 'Boston' },
        { id: 2, name: 'Smith "The Great"', city: 'New York' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      const csv = await exportManager.exportToCSV(data, config);

      expect(csv).toContain('"O\'Brien, John"');
      expect(csv).toContain('"Smith ""The Great"""');
    });

    it('should include custom headers in CSV', async () => {
      const data = [
        { id: 1, name: 'John Doe', city: 'Boston' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      const headers = ['ID', 'Full Name', 'City'];
      const csv = await exportManager.exportToCSV(data, config, { headers });

      expect(csv).toContain('ID,Full Name,City');
    });
  });

  describe('JSON Export', () => {
    it('should export filtered results to JSON', async () => {
      const data = [
        { id: 1, name: 'John Doe', city: 'Boston' },
        { id: 2, name: 'Jane Smith', city: 'New York' },
        { id: 3, name: 'Bob Johnson', city: 'Boston' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const json = await exportManager.exportToJSON(data, config);
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('John Doe');
      expect(parsed[1].name).toBe('Bob Johnson');
    });

    it('should format JSON with proper indentation', async () => {
      const data = [
        { id: 1, name: 'John Doe', city: 'Boston' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      const json = await exportManager.exportToJSON(data, config, { pretty: true });

      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });

    it('should include metadata in JSON export', async () => {
      const data = [
        { id: 1, name: 'John Doe', city: 'Boston' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const json = await exportManager.exportToJSON(data, config, { includeMetadata: true });
      const parsed = JSON.parse(json);

      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.exportDate).toBeDefined();
      expect(parsed.metadata.filterConfig).toEqual(config);
      expect(parsed.data).toHaveLength(1);
    });
  });

  describe('Export Progress', () => {
    it('should report progress during large exports', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Person ${i}`,
        city: 'Boston'
      }));

      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      const progressUpdates: number[] = [];
      const onProgress = (progress: number) => {
        progressUpdates.push(progress);
      };

      await exportManager.exportToCSV(largeData, config, { onProgress });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100);
    });

    it('should handle export cancellation', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Person ${i}`,
        city: 'Boston'
      }));

      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      const abortController = new AbortController();

      // Cancel after a short delay
      setTimeout(() => abortController.abort(), 50);

      await expect(
        exportManager.exportToCSV(largeData, config, { signal: abortController.signal })
      ).rejects.toThrow();
    });
  });

  describe('Export File Download', () => {
    it('should trigger file download with correct filename', async () => {
      const data = [
        { id: 1, name: 'John Doe', city: 'Boston' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      // Mock download functionality
      const mockCreateElement = vi.spyOn(document, 'createElement');
      const mockClick = vi.fn();
      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
        style: {}
      };
      mockCreateElement.mockReturnValue(mockLink as any);

      await exportManager.downloadCSV(data, config, 'alumni-export.csv');

      expect(mockLink.download).toBe('alumni-export.csv');
      expect(mockClick).toHaveBeenCalled();

      mockCreateElement.mockRestore();
    });
  });

  describe('Export Validation', () => {
    it('should validate data before export', async () => {
      const invalidData = [
        { id: 1, name: null, city: 'Boston' },
        { id: 2, name: 'Jane Smith', city: undefined }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      const csv = await exportManager.exportToCSV(invalidData, config, { 
        validateData: true 
      });

      // Should handle null/undefined values gracefully
      expect(csv).toBeDefined();
      expect(csv).toContain('id,name,city');
    });

    it('should limit export size', async () => {
      const largeData = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        name: `Person ${i}`,
        city: 'Boston'
      }));

      const config: FilterConfig = {
        type: 'alumni',
        operator: 'AND'
      };

      await expect(
        exportManager.exportToCSV(largeData, config, { maxRows: 10000 })
      ).rejects.toThrow('Export size exceeds maximum allowed rows');
    });
  });

  describe('Export Performance', () => {
    it('should export large datasets efficiently', async () => {
      const largeData = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        name: `Person ${i}`,
        city: i % 2 === 0 ? 'Boston' : 'New York',
        graduationYear: 2015 + (i % 10)
      }));

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const start = performance.now();
      await exportManager.exportToCSV(largeData, config);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
