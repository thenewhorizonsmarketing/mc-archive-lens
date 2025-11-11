import { describe, it, expect, beforeEach } from 'vitest';
import { FilterProcessor } from '../FilterProcessor';
import type { FilterConfig } from '../types';

describe('FilterProcessor', () => {
  let processor: FilterProcessor;

  beforeEach(() => {
    processor = new FilterProcessor();
  });

  describe('validateFilters', () => {
    it('should validate correct filter configuration', () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [{
          field: 'name',
          value: 'John',
          matchType: 'contains',
          caseSensitive: false
        }],
        operator: 'AND'
      };

      const result = processor.validateFilters(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid filter type', () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [{
          field: 'name',
          value: '',
          matchType: 'contains',
          caseSensitive: false
        }],
        operator: 'AND'
      };

      const result = processor.validateFilters(config);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate date range filters', () => {
      const config: FilterConfig = {
        type: 'alumni',
        dateFilters: [{
          field: 'graduationDate',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2020-01-01'), // End before start
          preset: 'custom'
        }],
        operator: 'AND'
      };

      const result = processor.validateFilters(config);
      expect(result.isValid).toBe(false);
    });

    it('should validate range filters', () => {
      const config: FilterConfig = {
        type: 'alumni',
        rangeFilters: [{
          field: 'age',
          min: 65,
          max: 25 // Max less than min
        }],
        operator: 'AND'
      };

      const result = processor.validateFilters(config);
      expect(result.isValid).toBe(false);
    });
  });

  describe('combineFilters', () => {
    it('should combine multiple filters with AND operator', () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false },
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const combined = processor.combineFilters(config);
      expect(combined).toBeDefined();
      expect(combined.conditions.length).toBe(2);
    });

    it('should combine multiple filters with OR operator', () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false },
          { field: 'name', value: 'Jane', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'OR'
      };

      const combined = processor.combineFilters(config);
      expect(combined).toBeDefined();
      expect(combined.operator).toBe('OR');
    });
  });

  describe('estimateResultCount', () => {
    it('should estimate result count for filters', async () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [{
          field: 'name',
          value: 'John',
          matchType: 'contains',
          caseSensitive: false
        }],
        operator: 'AND'
      };

      const count = await processor.estimateResultCount(config);
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('applyFilters', () => {
    it('should apply filters to dataset', () => {
      const data = [
        { id: 1, name: 'John Doe', city: 'Boston' },
        { id: 2, name: 'Jane Smith', city: 'New York' },
        { id: 3, name: 'John Adams', city: 'Boston' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [{
          field: 'name',
          value: 'John',
          matchType: 'contains',
          caseSensitive: false
        }],
        operator: 'AND'
      };

      const filtered = processor.applyFilters(data, config);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(item => item.name.includes('John'))).toBe(true);
    });

    it('should apply multiple filters with AND operator', () => {
      const data = [
        { id: 1, name: 'John Doe', city: 'Boston' },
        { id: 2, name: 'Jane Smith', city: 'Boston' },
        { id: 3, name: 'John Adams', city: 'New York' }
      ];

      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false },
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const filtered = processor.applyFilters(data, config);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('John Doe');
    });
  });
});
