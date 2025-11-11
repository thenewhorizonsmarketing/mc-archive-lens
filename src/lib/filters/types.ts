// Type definitions for advanced filter system

export type FilterOperator = 'AND' | 'OR';
export type TextMatchType = 'contains' | 'equals' | 'startsWith' | 'endsWith';
export type DatePreset = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface TextFilter {
  field: string;
  value: string;
  matchType: TextMatchType;
  caseSensitive: boolean;
}

export interface DateFilter {
  field: string;
  startDate?: Date;
  endDate?: Date;
  preset?: DatePreset;
}

export interface RangeFilter {
  field: string;
  min: number;
  max: number;
  step?: number;
}

export interface BooleanFilter {
  field: string;
  value: boolean;
}

export interface CustomFilter {
  field: string;
  operator: string;
  value: any;
}

export interface FilterConfig {
  type: 'alumni' | 'publication' | 'photo' | 'faculty';
  textFilters?: TextFilter[];
  dateFilters?: DateFilter[];
  rangeFilters?: RangeFilter[];
  booleanFilters?: BooleanFilter[];
  customFilters?: CustomFilter[];
  operator: FilterOperator;
}

export interface FilterNode {
  id: string;
  type: 'filter' | 'operator' | 'group';
  operator?: FilterOperator;
  children?: FilterNode[];
  filter?: FilterConfig;
}

export interface QueryResult {
  sql: string;
  params: any[];
  estimatedCount?: number;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
}

export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
