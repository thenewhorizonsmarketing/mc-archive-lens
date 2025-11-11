# Advanced Filter System

A powerful, flexible filter engine for SQLite FTS5 search with query optimization and caching.

## Features

- **Advanced Query Builder**: Build complex SQL queries with multiple filter types
- **Filter Processor**: Validate, combine, and process filter configurations
- **Result Caching**: High-performance caching with TTL and automatic cleanup
- **Query Optimization**: Automatic query simplification and optimization
- **Shareable Filters**: Generate and parse shareable URLs

## Components

### 1. AdvancedQueryBuilder

Builds optimized SQL queries from filter configurations.

```typescript
import { AdvancedQueryBuilder, FilterConfig } from './filters';

const builder = new AdvancedQueryBuilder();

const config: FilterConfig = {
  type: 'alumni',
  operator: 'AND',
  textFilters: [
    {
      field: 'full_name',
      value: 'Smith',
      matchType: 'contains',
      caseSensitive: false
    }
  ],
  rangeFilters: [
    {
      field: 'class_year',
      min: 1980,
      max: 1990
    }
  ]
};

// Build query
const { sql, params } = builder.buildQuery(config);

// Optimize query
const optimized = builder.optimizeQuery({ sql, params });

// Generate shareable URL
const url = builder.generateShareableURL(config, 'https://example.com/search');

// Parse shared URL
const restored = builder.parseSharedURL(url);
```

### 2. FilterProcessor

Validates and processes filter configurations.

```typescript
import { FilterProcessor } from './filters';

const processor = new FilterProcessor();

// Validate filters
const validation = processor.validateFilters(config);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Get filter statistics
const stats = processor.getFilterStats(config);
console.log('Total filters:', stats.totalFilters);
console.log('Complexity:', stats.complexity);

// Combine multiple filters
const combined = processor.combineFilters({
  filters: [config1, config2],
  operator: 'OR'
});

// Describe filters in human-readable format
const descriptions = processor.describeFilters(config);
console.log('Active filters:', descriptions);

// Estimate result count
const count = await processor.estimateResultCount(config, executeQuery);
console.log('Estimated results:', count);
```

### 3. FilterCache

High-performance caching for filter results.

```typescript
import { FilterCache, FilterResultCache } from './filters';

// Use singleton instance
const cache = FilterResultCache.getInstance();

// Generate cache key
const key = FilterCache.generateKey('alumni', config);

// Get or set with factory function
const results = await cache.getOrSet(
  key,
  async () => {
    // Expensive query operation
    return await executeQuery(sql, params);
  },
  5 * 60 * 1000 // 5 minutes TTL
);

// Manual cache operations
cache.set(key, data, 300000); // 5 minutes
const cached = cache.get(key);
cache.delete(key);

// Invalidate by pattern
cache.invalidatePattern(/^alumni:/);
cache.invalidateByType('alumni');

// Get cache statistics
const stats = cache.getStats();
console.log('Hit rate:', stats.hitRate);
console.log('Cache size:', stats.size);

// Export/import for persistence
const exported = cache.export();
localStorage.setItem('filterCache', exported);

const imported = localStorage.getItem('filterCache');
if (imported) {
  cache.import(imported);
}
```

## Filter Types

### Text Filters

```typescript
{
  field: 'full_name',
  value: 'John',
  matchType: 'contains' | 'equals' | 'startsWith' | 'endsWith',
  caseSensitive: false
}
```

### Date Filters

```typescript
{
  field: 'issue_date',
  startDate: new Date('2020-01-01'),
  endDate: new Date('2020-12-31'),
  preset: 'today' | 'week' | 'month' | 'year' | 'custom'
}
```

### Range Filters

```typescript
{
  field: 'class_year',
  min: 1980,
  max: 1990,
  step: 1
}
```

### Boolean Filters

```typescript
{
  field: 'is_active',
  value: true
}
```

### Custom Filters

```typescript
{
  field: 'score',
  operator: '>=',
  value: 90
}
```

## Complete Example

```typescript
import {
  AdvancedQueryBuilder,
  FilterProcessor,
  FilterResultCache,
  FilterConfig
} from '@/lib/filters';

// Initialize components
const builder = new AdvancedQueryBuilder();
const processor = new FilterProcessor();
const cache = FilterResultCache.getInstance();

// Define filter configuration
const config: FilterConfig = {
  type: 'alumni',
  operator: 'AND',
  textFilters: [
    {
      field: 'full_name',
      value: 'Smith',
      matchType: 'contains',
      caseSensitive: false
    }
  ],
  rangeFilters: [
    {
      field: 'class_year',
      min: 1980,
      max: 1990
    }
  ]
};

// Validate filters
const validation = processor.validateFilters(config);
if (!validation.isValid) {
  throw new Error(`Invalid filters: ${validation.errors.join(', ')}`);
}

// Generate cache key
const cacheKey = FilterCache.generateKey('search', config);

// Get or compute results
const results = await cache.getOrSet(
  cacheKey,
  async () => {
    // Build optimized query
    const query = builder.buildQuery(config);
    const optimized = builder.optimizeQuery(query);
    
    // Execute query
    return await executeQuery(optimized.sql, optimized.params);
  },
  5 * 60 * 1000 // 5 minutes
);

// Get statistics
const stats = processor.getFilterStats(config);
console.log('Filter complexity:', stats.complexity);

const cacheStats = cache.getStats();
console.log('Cache hit rate:', cacheStats.hitRate);

// Share filters
const shareUrl = builder.generateShareableURL(
  config,
  window.location.origin + '/search'
);
console.log('Share URL:', shareUrl);
```

## Performance Considerations

1. **Caching**: Results are cached for 5 minutes by default
2. **Query Optimization**: Queries are automatically optimized
3. **Complexity Scoring**: High complexity filters trigger warnings
4. **Cache Eviction**: LRU eviction when cache is full
5. **Automatic Cleanup**: Expired entries are pruned every minute

## Integration with Existing System

The advanced filter system is designed to work alongside the existing `QueryBuilder` and `FilterProcessor` from the database layer. It provides:

- More filter types (date, range, boolean)
- Visual query builder support
- Advanced caching strategies
- Shareable filter configurations
- Better validation and error handling

## Requirements Satisfied

- **Requirement 1**: Advanced filter interface with multiple filter types ✓
- **Requirement 4**: Visual filter builder with AND/OR operators ✓
- **Requirement 11**: Performance optimization with caching ✓
