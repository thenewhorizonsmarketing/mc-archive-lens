// Filter Processor for validating and combining complex filters
import {
  FilterConfig,
  TextFilter,
  DateFilter,
  RangeFilter,
  BooleanFilter,
  CustomFilter,
  FilterValidationResult,
  FilterOperator
} from './types';
import { AdvancedQueryBuilder } from './AdvancedQueryBuilder';

export interface FilterCombination {
  filters: FilterConfig[];
  operator: FilterOperator;
}

export interface FilterStats {
  totalFilters: number;
  activeFilters: number;
  filtersByType: Record<string, number>;
  complexity: number;
}

export class FilterProcessor {
  private queryBuilder: AdvancedQueryBuilder;

  constructor() {
    this.queryBuilder = new AdvancedQueryBuilder();
  }

  /**
   * Validate filter configuration
   */
  validateFilters(config: FilterConfig): FilterValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate content type
    if (!['alumni', 'publication', 'photo', 'faculty'].includes(config.type)) {
      errors.push(`Invalid content type: ${config.type}`);
    }

    // Validate text filters
    if (config.textFilters) {
      config.textFilters.forEach((filter, index) => {
        const textErrors = this.validateTextFilter(filter);
        errors.push(...textErrors.map(e => `Text filter ${index + 1}: ${e}`));
      });
    }

    // Validate date filters
    if (config.dateFilters) {
      config.dateFilters.forEach((filter, index) => {
        const dateErrors = this.validateDateFilter(filter);
        errors.push(...dateErrors.map(e => `Date filter ${index + 1}: ${e}`));
      });
    }

    // Validate range filters
    if (config.rangeFilters) {
      config.rangeFilters.forEach((filter, index) => {
        const rangeErrors = this.validateRangeFilter(filter);
        errors.push(...rangeErrors.map(e => `Range filter ${index + 1}: ${e}`));
      });
    }

    // Validate boolean filters
    if (config.booleanFilters) {
      config.booleanFilters.forEach((filter, index) => {
        const booleanErrors = this.validateBooleanFilter(filter);
        errors.push(...booleanErrors.map(e => `Boolean filter ${index + 1}: ${e}`));
      });
    }

    // Check for empty filter config
    const hasFilters = 
      (config.textFilters?.length || 0) +
      (config.dateFilters?.length || 0) +
      (config.rangeFilters?.length || 0) +
      (config.booleanFilters?.length || 0) +
      (config.customFilters?.length || 0) > 0;

    if (!hasFilters) {
      warnings.push('No filters defined');
    }

    // Check for overly complex filters
    const complexity = this.calculateComplexity(config);
    if (complexity > 50) {
      warnings.push(`Filter complexity is high (${complexity}). This may impact performance.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Combine multiple filter configurations
   */
  combineFilters(combination: FilterCombination): FilterConfig {
    if (combination.filters.length === 0) {
      throw new Error('Cannot combine empty filter list');
    }

    if (combination.filters.length === 1) {
      return combination.filters[0];
    }

    // Use the first filter's type as base
    const baseConfig = combination.filters[0];
    const combined: FilterConfig = {
      type: baseConfig.type,
      operator: combination.operator,
      textFilters: [],
      dateFilters: [],
      rangeFilters: [],
      booleanFilters: [],
      customFilters: []
    };

    // Merge all filters
    combination.filters.forEach(config => {
      if (config.type !== combined.type) {
        throw new Error('Cannot combine filters of different content types');
      }

      if (config.textFilters) {
        combined.textFilters!.push(...config.textFilters);
      }
      if (config.dateFilters) {
        combined.dateFilters!.push(...config.dateFilters);
      }
      if (config.rangeFilters) {
        combined.rangeFilters!.push(...config.rangeFilters);
      }
      if (config.booleanFilters) {
        combined.booleanFilters!.push(...config.booleanFilters);
      }
      if (config.customFilters) {
        combined.customFilters!.push(...config.customFilters);
      }
    });

    return combined;
  }

  /**
   * Estimate result count for filter configuration
   */
  async estimateResultCount(
    config: FilterConfig,
    executeQuery: (sql: string, params: any[]) => Promise<any[]>
  ): Promise<number> {
    return this.queryBuilder.estimateResultCount(config, executeQuery);
  }

  /**
   * Get filter statistics
   */
  getFilterStats(config: FilterConfig): FilterStats {
    const filtersByType: Record<string, number> = {
      text: config.textFilters?.length || 0,
      date: config.dateFilters?.length || 0,
      range: config.rangeFilters?.length || 0,
      boolean: config.booleanFilters?.length || 0,
      custom: config.customFilters?.length || 0
    };

    const totalFilters = Object.values(filtersByType).reduce((sum, count) => sum + count, 0);
    const activeFilters = totalFilters; // All filters are active by default

    return {
      totalFilters,
      activeFilters,
      filtersByType,
      complexity: this.calculateComplexity(config)
    };
  }

  /**
   * Simplify filter configuration by removing redundant filters
   */
  simplifyFilters(config: FilterConfig): FilterConfig {
    const simplified: FilterConfig = {
      ...config,
      textFilters: this.deduplicateTextFilters(config.textFilters || []),
      dateFilters: this.deduplicateDateFilters(config.dateFilters || []),
      rangeFilters: this.deduplicateRangeFilters(config.rangeFilters || []),
      booleanFilters: this.deduplicateBooleanFilters(config.booleanFilters || [])
    };

    return simplified;
  }

  /**
   * Convert filter configuration to human-readable description
   */
  describeFilters(config: FilterConfig): string[] {
    const descriptions: string[] = [];

    // Describe text filters
    config.textFilters?.forEach(filter => {
      const matchDesc = this.getMatchTypeDescription(filter.matchType);
      descriptions.push(
        `${filter.field} ${matchDesc} "${filter.value}"${filter.caseSensitive ? ' (case-sensitive)' : ''}`
      );
    });

    // Describe date filters
    config.dateFilters?.forEach(filter => {
      if (filter.preset && filter.preset !== 'custom') {
        descriptions.push(`${filter.field} in ${filter.preset}`);
      } else {
        const parts: string[] = [];
        if (filter.startDate) {
          parts.push(`from ${filter.startDate.toLocaleDateString()}`);
        }
        if (filter.endDate) {
          parts.push(`to ${filter.endDate.toLocaleDateString()}`);
        }
        descriptions.push(`${filter.field} ${parts.join(' ')}`);
      }
    });

    // Describe range filters
    config.rangeFilters?.forEach(filter => {
      descriptions.push(`${filter.field} between ${filter.min} and ${filter.max}`);
    });

    // Describe boolean filters
    config.booleanFilters?.forEach(filter => {
      descriptions.push(`${filter.field} is ${filter.value ? 'true' : 'false'}`);
    });

    // Describe custom filters
    config.customFilters?.forEach(filter => {
      descriptions.push(`${filter.field} ${filter.operator} ${filter.value}`);
    });

    return descriptions;
  }

  /**
   * Check if two filter configurations are equivalent
   */
  areFiltersEquivalent(config1: FilterConfig, config2: FilterConfig): boolean {
    if (config1.type !== config2.type) {
      return false;
    }

    if (config1.operator !== config2.operator) {
      return false;
    }

    // Compare filter counts
    const counts1 = this.getFilterStats(config1);
    const counts2 = this.getFilterStats(config2);

    if (counts1.totalFilters !== counts2.totalFilters) {
      return false;
    }

    // Deep comparison would be needed for exact equivalence
    // For now, we do a simple JSON comparison
    return JSON.stringify(config1) === JSON.stringify(config2);
  }

  // Private validation methods

  private validateTextFilter(filter: TextFilter): string[] {
    const errors: string[] = [];

    if (!filter.field || filter.field.trim() === '') {
      errors.push('Field name is required');
    }

    if (!filter.value || filter.value.trim() === '') {
      errors.push('Filter value is required');
    }

    if (!['contains', 'equals', 'startsWith', 'endsWith'].includes(filter.matchType)) {
      errors.push(`Invalid match type: ${filter.matchType}`);
    }

    return errors;
  }

  private validateDateFilter(filter: DateFilter): string[] {
    const errors: string[] = [];

    if (!filter.field || filter.field.trim() === '') {
      errors.push('Field name is required');
    }

    if (filter.startDate && filter.endDate) {
      if (filter.startDate > filter.endDate) {
        errors.push('Start date must be before end date');
      }
    }

    if (filter.preset && !['today', 'week', 'month', 'year', 'custom'].includes(filter.preset)) {
      errors.push(`Invalid date preset: ${filter.preset}`);
    }

    return errors;
  }

  private validateRangeFilter(filter: RangeFilter): string[] {
    const errors: string[] = [];

    if (!filter.field || filter.field.trim() === '') {
      errors.push('Field name is required');
    }

    if (filter.min > filter.max) {
      errors.push('Minimum value must be less than or equal to maximum value');
    }

    if (filter.step !== undefined && filter.step <= 0) {
      errors.push('Step value must be positive');
    }

    return errors;
  }

  private validateBooleanFilter(filter: BooleanFilter): string[] {
    const errors: string[] = [];

    if (!filter.field || filter.field.trim() === '') {
      errors.push('Field name is required');
    }

    if (typeof filter.value !== 'boolean') {
      errors.push('Boolean filter value must be true or false');
    }

    return errors;
  }

  // Private helper methods

  private calculateComplexity(config: FilterConfig): number {
    let complexity = 0;

    // Base complexity from filter counts
    complexity += (config.textFilters?.length || 0) * 2;
    complexity += (config.dateFilters?.length || 0) * 3;
    complexity += (config.rangeFilters?.length || 0) * 2;
    complexity += (config.booleanFilters?.length || 0) * 1;
    complexity += (config.customFilters?.length || 0) * 4;

    // Add complexity for OR operator (more expensive than AND)
    if (config.operator === 'OR') {
      complexity *= 1.5;
    }

    return Math.round(complexity);
  }

  private deduplicateTextFilters(filters: TextFilter[]): TextFilter[] {
    const seen = new Set<string>();
    return filters.filter(filter => {
      const key = `${filter.field}:${filter.matchType}:${filter.value}:${filter.caseSensitive}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private deduplicateDateFilters(filters: DateFilter[]): DateFilter[] {
    const seen = new Set<string>();
    return filters.filter(filter => {
      const key = `${filter.field}:${filter.startDate?.toISOString()}:${filter.endDate?.toISOString()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private deduplicateRangeFilters(filters: RangeFilter[]): RangeFilter[] {
    const seen = new Set<string>();
    return filters.filter(filter => {
      const key = `${filter.field}:${filter.min}:${filter.max}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private deduplicateBooleanFilters(filters: BooleanFilter[]): BooleanFilter[] {
    const seen = new Set<string>();
    return filters.filter(filter => {
      const key = `${filter.field}:${filter.value}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private getMatchTypeDescription(matchType: string): string {
    switch (matchType) {
      case 'contains':
        return 'contains';
      case 'equals':
        return 'equals';
      case 'startsWith':
        return 'starts with';
      case 'endsWith':
        return 'ends with';
      default:
        return 'matches';
    }
  }
}

export default FilterProcessor;
