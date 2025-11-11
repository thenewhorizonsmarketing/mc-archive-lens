// Example usage of the Advanced Filter System
import {
  AdvancedQueryBuilder,
  FilterProcessor,
  FilterResultCache,
  FilterCache,
  FilterConfig
} from './index';

/**
 * Example 1: Basic text and range filtering
 */
export async function exampleBasicFiltering() {
  const builder = new AdvancedQueryBuilder();
  const processor = new FilterProcessor();

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
    console.error('Validation errors:', validation.errors);
    return;
  }

  // Build query
  const { sql, params } = builder.buildQuery(config);
  console.log('Generated SQL:', sql);
  console.log('Parameters:', params);

  // Get filter statistics
  const stats = processor.getFilterStats(config);
  console.log('Filter stats:', stats);

  return { sql, params };
}

/**
 * Example 2: Date filtering with presets
 */
export function exampleDateFiltering() {
  const builder = new AdvancedQueryBuilder();

  const config: FilterConfig = {
    type: 'publication',
    operator: 'AND',
    dateFilters: [
      {
        field: 'issue_date',
        preset: 'year' // Last year
      }
    ],
    textFilters: [
      {
        field: 'pub_name',
        value: 'Law Review',
        matchType: 'equals',
        caseSensitive: false
      }
    ]
  };

  const { sql, params } = builder.buildQuery(config);
  return { sql, params };
}

/**
 * Example 3: Using cache for performance
 */
export async function exampleWithCaching(
  config: FilterConfig,
  executeQuery: (sql: string, params: any[]) => Promise<any[]>
) {
  const builder = new AdvancedQueryBuilder();
  const cache = FilterResultCache.getInstance();

  // Generate cache key
  const cacheKey = FilterCache.generateKey('search', config);

  // Get or compute results with caching
  const results = await cache.getOrSet(
    cacheKey,
    async () => {
      // Build and optimize query
      const query = builder.buildQuery(config);
      const optimized = builder.optimizeQuery(query);
      
      // Execute query
      return await executeQuery(optimized.sql, optimized.params);
    },
    5 * 60 * 1000 // 5 minutes TTL
  );

  // Get cache statistics
  const cacheStats = cache.getStats();
  console.log('Cache hit rate:', cacheStats.hitRate);

  return results;
}

/**
 * Example 4: Combining multiple filters
 */
export function exampleCombiningFilters() {
  const processor = new FilterProcessor();

  const filter1: FilterConfig = {
    type: 'alumni',
    operator: 'AND',
    textFilters: [
      {
        field: 'full_name',
        value: 'John',
        matchType: 'contains',
        caseSensitive: false
      }
    ]
  };

  const filter2: FilterConfig = {
    type: 'alumni',
    operator: 'AND',
    rangeFilters: [
      {
        field: 'class_year',
        min: 1980,
        max: 1990
      }
    ]
  };

  // Combine with OR operator
  const combined = processor.combineFilters({
    filters: [filter1, filter2],
    operator: 'OR'
  });

  console.log('Combined filters:', combined);
  return combined;
}

/**
 * Example 5: Shareable filter URLs
 */
export function exampleShareableFilters() {
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

  // Generate shareable URL
  const shareUrl = builder.generateShareableURL(
    config,
    'https://example.com/search'
  );
  console.log('Share URL:', shareUrl);

  // Parse URL to restore filters
  const restored = builder.parseSharedURL(shareUrl);
  console.log('Restored config:', restored);

  return { shareUrl, restored };
}

/**
 * Example 6: Filter validation and description
 */
export function exampleFilterValidation() {
  const processor = new FilterProcessor();

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

  // Validate
  const validation = processor.validateFilters(config);
  console.log('Is valid:', validation.isValid);
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);

  // Get human-readable description
  const descriptions = processor.describeFilters(config);
  console.log('Filter descriptions:', descriptions);

  return { validation, descriptions };
}

/**
 * Example 7: Complex nested filters with visual builder
 */
export function exampleVisualBuilder() {
  const builder = new AdvancedQueryBuilder();

  // Build a complex filter tree: (A AND B) OR (C AND D)
  const filterNode = {
    id: 'root',
    type: 'operator' as const,
    operator: 'OR' as const,
    children: [
      {
        id: 'group1',
        type: 'operator' as const,
        operator: 'AND' as const,
        children: [
          {
            id: 'filter1',
            type: 'filter' as const,
            filter: {
              type: 'alumni' as const,
              operator: 'AND' as const,
              textFilters: [
                {
                  field: 'full_name',
                  value: 'John',
                  matchType: 'contains' as const,
                  caseSensitive: false
                }
              ]
            }
          },
          {
            id: 'filter2',
            type: 'filter' as const,
            filter: {
              type: 'alumni' as const,
              operator: 'AND' as const,
              rangeFilters: [
                {
                  field: 'class_year',
                  min: 1980,
                  max: 1990
                }
              ]
            }
          }
        ]
      },
      {
        id: 'group2',
        type: 'operator' as const,
        operator: 'AND' as const,
        children: [
          {
            id: 'filter3',
            type: 'filter' as const,
            filter: {
              type: 'alumni' as const,
              operator: 'AND' as const,
              textFilters: [
                {
                  field: 'full_name',
                  value: 'Smith',
                  matchType: 'contains' as const,
                  caseSensitive: false
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const { sql, params } = builder.buildQueryFromNodes(filterNode, 'alumni');
  console.log('Visual builder SQL:', sql);
  console.log('Parameters:', params);

  return { sql, params };
}

/**
 * Example 8: Cache management
 */
export function exampleCacheManagement() {
  const cache = FilterResultCache.getInstance();

  // Set some data
  cache.set('key1', { data: 'value1' }, 60000); // 1 minute
  cache.set('key2', { data: 'value2' }, 120000); // 2 minutes

  // Get data
  const value1 = cache.get('key1');
  console.log('Cached value:', value1);

  // Check if exists
  const exists = cache.has('key1');
  console.log('Key exists:', exists);

  // Invalidate by pattern
  cache.invalidatePattern(/^key/);

  // Get statistics
  const stats = cache.getStats();
  console.log('Cache stats:', stats);

  // Export for persistence
  const exported = cache.export();
  console.log('Exported cache:', exported);

  return stats;
}
