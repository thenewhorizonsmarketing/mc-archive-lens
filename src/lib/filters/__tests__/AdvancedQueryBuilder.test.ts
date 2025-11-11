import { describe, it, expect, beforeEach } from 'vitest';
import { AdvancedQueryBuilder } from '../AdvancedQueryBuilder';
import type { FilterConfig } from '../types';

describe('AdvancedQueryBuilder', () => {
  let queryBuilder: AdvancedQueryBuilder;

  beforeEach(() => {
    queryBuilder = new AdvancedQueryBuilder();
  });

  describe('buildQuery', () => {
    it('should build simple text filter query', () => {
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

      const query = queryBuilder.buildQuery(config);
      expect(query).toContain('name');
      expect(query).toContain('John');
    });

    it('should build query with multiple filters using AND operator', () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false },
          { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
        ],
        operator: 'AND'
      };

      const query = queryBuilder.buildQuery(config);
      expect(query).toContain('AND');
    });

    it('should build query with OR operator', () => {
      const config: FilterConfig = {
        type: 'alumni',
        textFilters: [
          { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false },
          { field: 'name', value: 'Jane', matchType: 'contains', caseSensitive: false }
        ],
        operator: 'OR'
      };

      const query = queryBuilder.buildQuery(config);
      expect(query).toContain('OR');
    });

    it('should handle date range filters', () => {
      const config: FilterConfig = {
        type: 'alumni',
        dateFilters: [{
          field: 'graduationDate',
          startDate: new Date('2020-01-01'),
          endDate: new Date('2023-12-31'),
          preset: 'custom'
        }],
        operator: 'AND'
      };

      const query = queryBuilder.buildQuery(config);
      expect(query).toContain('graduationDate');
    });

    it('should handle range filters', () => {
      const config: FilterConfig = {
        type: 'alumni',
        rangeFilters: [{
          field: 'age',
          min: 25,
          max: 65
        }],
        operator: 'AND'
      };

      const query = queryBuilder.buildQuery(config);
      expect(query).toContain('age');
    });

    it('should handle boolean filters', () => {
      const config: FilterConfig = {
        type: 'alumni',
        booleanFilters: [{
          field: 'isActive',
          value: true
        }],
        operator: 'AND'
      };

      const query = queryBuilder.buildQuery(config);
      expect(query).toContain('isActive');
    });
  });

  describe('optimizeQuery', () => {
    it('should optimize redundant conditions', () => {
      const query = 'SELECT * FROM alumni WHERE name = "John" AND name = "John"';
      const optimized = queryBuilder.optimizeQuery(query);
      expect(optimized).not.toContain('AND name = "John"');
    });
  });

  describe('generateShareableURL', () => {
    it('should generate URL with encoded filters', () => {
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

      const url = queryBuilder.generateShareableURL(config);
      expect(url).toContain('filters=');
      expect(url.length).toBeGreaterThan(0);
    });
  });

  describe('parseSharedURL', () => {
    it('should parse URL and restore filter config', () => {
      const originalConfig: FilterConfig = {
        type: 'alumni',
        textFilters: [{
          field: 'name',
          value: 'John',
          matchType: 'contains',
          caseSensitive: false
        }],
        operator: 'AND'
      };

      const url = queryBuilder.generateShareableURL(originalConfig);
      const parsedConfig = queryBuilder.parseSharedURL(url);

      expect(parsedConfig.type).toBe(originalConfig.type);
      expect(parsedConfig.operator).toBe(originalConfig.operator);
      expect(parsedConfig.textFilters).toHaveLength(1);
    });
  });
});
