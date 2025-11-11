// Advanced Filter System - Main exports

export { AdvancedQueryBuilder } from './AdvancedQueryBuilder';
export { FilterProcessor } from './FilterProcessor';
export { 
  FilterCache, 
  FilterResultCache, 
  FilterCountCache 
} from './FilterCache';
export { 
  SuggestionEngine, 
  GlobalSuggestionEngine 
} from './SuggestionEngine';

export type {
  FilterOperator,
  TextMatchType,
  DatePreset,
  TextFilter,
  DateFilter,
  RangeFilter,
  BooleanFilter,
  CustomFilter,
  FilterConfig,
  FilterNode,
  QueryResult,
  CacheEntry,
  FilterValidationResult
} from './types';

export type {
  FilterCombination,
  FilterStats
} from './FilterProcessor';

export type {
  CacheOptions,
  CacheStats
} from './FilterCache';

export type {
  SuggestionType,
  Suggestion,
  HistoryEntry,
  SuggestionEngineOptions
} from './SuggestionEngine';
