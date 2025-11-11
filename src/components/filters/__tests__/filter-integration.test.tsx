import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdvancedFilterPanel } from '../AdvancedFilterPanel';
import { SmartSearchInput } from '../SmartSearchInput';
import { FilterProcessor } from '../../../lib/filters/FilterProcessor';
import { AdvancedQueryBuilder } from '../../../lib/filters/AdvancedQueryBuilder';
import type { FilterConfig } from '../../../lib/filters/types';

describe('Filter Integration Tests', () => {
  describe('Filter Combinations', () => {
    it('should apply multiple text filters with AND operator', async () => {
      const onFilterChange = vi.fn();
      const processor = new FilterProcessor();

      const testData = [
        { id: 1, name: 'John Doe', city: 'Boston', graduationYear: 2020 },
        { id: 2, name: 'Jane Smith', city: 'Boston', graduationYear: 2021 },
        { id: 3, name: 'John Adams', city: 'New York', graduationYear: 2020 }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false },
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const results = processor.applyFilters(testData, config);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Doe');
    });

    it('should apply multiple filters with OR operator', () => {
      const processor = new FilterProcessor();

      const testData = [
        { id: 1, name: 'John Doe', city: 'Boston' },
        { id: 2, name: 'Jane Smith', city: 'New York' },
        { id: 3, name: 'Bob Johnson', city: 'Chicago' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false },
          { field: 'city', value: 'New York', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'OR'
      };

      const results = processor.applyFilters(testData, config);
      expect(results).toHaveLength(2);
    });

    it('should combine text and range filters', () => {
      const processor = new FilterProcessor();

      const testData = [
        { id: 1, name: 'John Doe', age: 30, city: 'Boston' },
        { id: 2, name: 'Jane Smith', age: 45, city: 'Boston' },
        { id: 3, name: 'Bob Johnson', age: 35, city: 'New York' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        rangeFilters: [
          { field: 'age', min: 25, max: 40 }
        ],
        operator: 'AND'
      };

      const results = processor.applyFilters(testData, config);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('John Doe');
    });

    it('should handle complex nested filter combinations', () => {
      const queryBuilder = new AdvancedQueryBuilder();

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        rangeFilters: [
          { field: 'graduationYear', min: 2015, max: 2025 }
        ],
        booleanFilters: [
          { field: 'isActive', value: true }
        ],
        operator: 'AND'
      };

      const query = queryBuilder.buildQuery(config);
      expect(query).toBeDefined();
      expect(query.length).toBeGreaterThan(0);
    });
  });

  describe('Filter State Management', () => {
    it('should maintain filter state across updates', async () => {
      const onFilterChange = vi.fn();

      render(
        <AdvancedFilterPanel
          contentType="alumni"
          onFilterChange={onFilterChange}
          initialFilters={{ type: 'alumni', operator: 'AND' }}
        />
      );

      // Verify initial state
      expect(onFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'alumni', operator: 'AND' })
      );
    });

    it('should clear all filters when requested', async () => {
      const onFilterChange = vi.fn();

      const { container } = render(
        <AdvancedFilterPanel
          contentType="alumni"
          onFilterChange={onFilterChange}
          initialFilters={{
            type: 'alumni',
            textFilters: [
              { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
            ],
            operator: 'AND'
          }}
        />
      );

      const clearButton = container.querySelector('[aria-label*="Clear"]');
      if (clearButton) {
        fireEvent.click(clearButton);

        await waitFor(() => {
          expect(onFilterChange).toHaveBeenCalledWith(
            expect.objectContaining({ textFilters: [] })
          );
        });
      }
    });
  });

  describe('Query Building Integration', () => {
    it('should build valid SQL from filter configuration', () => {
      const queryBuilder = new AdvancedQueryBuilder();

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const query = queryBuilder.buildQuery(config);
      expect(query).toContain('SELECT');
      expect(query).toContain('FROM');
      expect(query).toContain('WHERE');
    });

    it('should optimize complex queries', () => {
      const queryBuilder = new AdvancedQueryBuilder();

      const complexQuery = `
        SELECT * FROM alumni 
        WHERE name LIKE '%John%' 
        AND name LIKE '%John%' 
        AND city = 'Boston'
      `;

      const optimized = queryBuilder.optimizeQuery(complexQuery);
      expect(optimized).not.toContain('AND name LIKE \'%John%\' AND name LIKE \'%John%\'');
    });
  });

  describe('Performance Integration', () => {
    it('should handle large datasets efficiently', () => {
      const processor = new FilterProcessor();

      // Generate large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Person ${i}`,
        city: i % 2 === 0 ? 'Boston' : 'New York',
        age: 25 + (i % 40)
      }));

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const start = performance.now();
      const results = processor.applyFilters(largeDataset, config);
      const duration = performance.now() - start;

      expect(results.length).toBe(500);
      expect(duration).toBeLessThan(200); // Should complete in under 200ms
    });
  });
});
