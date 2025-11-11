import { describe, it, expect } from 'vitest';
import { AdvancedQueryBuilder } from '../../lib/filters/AdvancedQueryBuilder';
import { FilterProcessor } from '../../lib/filters/FilterProcessor';
import type { FilterConfig, FilterNode } from '../../lib/filters/types';

describe('Visual Builder E2E Flow', () => {
  describe('Visual Builder Workflow', () => {
    it('should build query from visual filter nodes', () => {
      const queryBuilder = new AdvancedQueryBuilder();
      
      // Simulate visual builder structure
      const filterTree: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: [
          {
            id: 'filter1',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
              ],
              operator: 'AND'
            }
          },
          {
            id: 'filter2',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
              ],
              operator: 'AND'
            }
          }
        ]
      };
      
      // Convert visual tree to filter config
      const filterConfig = convertTreeToConfig(filterTree);
      
      // Build query
      const query = queryBuilder.buildQuery(filterConfig);
      expect(query).toBeDefined();
      expect(query).toContain('name');
      expect(query).toContain('city');
    });

    it('should handle nested filter groups', () => {
      const queryBuilder = new AdvancedQueryBuilder();
      
      const nestedTree: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: [
          {
            id: 'group1',
            type: 'group',
            operator: 'OR',
            children: [
              {
                id: 'filter1',
                type: 'filter',
                filter: {
                  type: 'alumni',
                  textFilters: [
                    { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
                  ],
                  operator: 'AND'
                }
              },
              {
                id: 'filter2',
                type: 'filter',
                filter: {
                  type: 'alumni',
                  textFilters: [
                    { field: 'name', value: 'Jane', matchType: 'contains', caseSensitive: false }
                  ],
                  operator: 'AND'
                }
              }
            ]
          },
          {
            id: 'filter3',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
              ],
              operator: 'AND'
            }
          }
        ]
      };
      
      const filterConfig = convertTreeToConfig(nestedTree);
      const query = queryBuilder.buildQuery(filterConfig);
      
      expect(query).toBeDefined();
    });

    it('should validate visual builder structure', () => {
      const processor = new FilterProcessor();
      
      const invalidTree: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: [
          {
            id: 'filter1',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'name', value: '', matchType: 'contains', caseSensitive: false } // Invalid: empty value
              ],
              operator: 'AND'
            }
          }
        ]
      };
      
      const filterConfig = convertTreeToConfig(invalidTree);
      const validation = processor.validateFilters(filterConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should execute query built from visual builder', () => {
      const processor = new FilterProcessor();
      
      const filterTree: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: [
          {
            id: 'filter1',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
              ],
              operator: 'AND'
            }
          },
          {
            id: 'filter2',
            type: 'filter',
            filter: {
              type: 'alumni',
              rangeFilters: [
                { field: 'graduationYear', min: 2015, max: 2025 }
              ],
              operator: 'AND'
            }
          }
        ]
      };
      
      const filterConfig = convertTreeToConfig(filterTree);
      
      const testData = [
        { id: 1, name: 'John Doe', city: 'Boston', graduationYear: 2020 },
        { id: 2, name: 'Jane Smith', city: 'Boston', graduationYear: 2010 },
        { id: 3, name: 'Bob Johnson', city: 'New York', graduationYear: 2020 }
      ];
      
      const results = processor.applyFilters(testData, filterConfig);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });
  });

  describe('Drag and Drop Simulation', () => {
    it('should add filter node to builder', () => {
      const builder: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: []
      };
      
      const newFilter: FilterNode = {
        id: 'new-filter',
        type: 'filter',
        filter: {
          type: 'alumni',
          textFilters: [
            { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
          ],
          operator: 'AND'
        }
      };
      
      builder.children!.push(newFilter);
      
      expect(builder.children).toHaveLength(1);
      expect(builder.children![0].id).toBe('new-filter');
    });

    it('should remove filter node from builder', () => {
      const builder: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: [
          {
            id: 'filter1',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
              ],
              operator: 'AND'
            }
          },
          {
            id: 'filter2',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'city', value: 'Boston', matchType: 'equals', caseSensitive: false }
              ],
              operator: 'AND'
            }
          }
        ]
      };
      
      // Remove filter1
      builder.children = builder.children!.filter(child => child.id !== 'filter1');
      
      expect(builder.children).toHaveLength(1);
      expect(builder.children![0].id).toBe('filter2');
    });

    it('should reorder filter nodes', () => {
      const builder: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: [
          { id: 'filter1', type: 'filter', filter: { type: 'alumni', operator: 'AND' } },
          { id: 'filter2', type: 'filter', filter: { type: 'alumni', operator: 'AND' } },
          { id: 'filter3', type: 'filter', filter: { type: 'alumni', operator: 'AND' } }
        ]
      };
      
      // Move filter3 to first position
      const [filter3] = builder.children!.splice(2, 1);
      builder.children!.unshift(filter3);
      
      expect(builder.children![0].id).toBe('filter3');
      expect(builder.children![1].id).toBe('filter1');
      expect(builder.children![2].id).toBe('filter2');
    });
  });

  describe('Operator Changes', () => {
    it('should change group operator from AND to OR', () => {
      const builder: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: [
          {
            id: 'filter1',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
              ],
              operator: 'AND'
            }
          },
          {
            id: 'filter2',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'name', value: 'Jane', matchType: 'contains', caseSensitive: false }
              ],
              operator: 'AND'
            }
          }
        ]
      };
      
      // Change operator
      builder.operator = 'OR';
      
      const filterConfig = convertTreeToConfig(builder);
      expect(filterConfig.operator).toBe('OR');
      
      const processor = new FilterProcessor();
      const testData = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' },
        { id: 3, name: 'Bob Johnson' }
      ];
      
      const results = processor.applyFilters(testData, filterConfig);
      expect(results).toHaveLength(2); // Both John and Jane
    });
  });

  describe('Query Preview', () => {
    it('should generate SQL preview from visual builder', () => {
      const queryBuilder = new AdvancedQueryBuilder();
      
      const builder: FilterNode = {
        id: 'root',
        type: 'group',
        operator: 'AND',
        children: [
          {
            id: 'filter1',
            type: 'filter',
            filter: {
              type: 'alumni',
              textFilters: [
                { field: 'name', value: 'John', matchType: 'contains', caseSensitive: false }
              ],
              operator: 'AND'
            }
          }
        ]
      };
      
      const filterConfig = convertTreeToConfig(builder);
      const query = queryBuilder.buildQuery(filterConfig);
      
      expect(query).toContain('SELECT');
      expect(query).toContain('FROM');
      expect(query).toContain('WHERE');
      expect(query).toContain('name');
    });
  });
});

// Helper function to convert visual tree to filter config
function convertTreeToConfig(node: FilterNode): FilterConfig {
  if (node.type === 'filter' && node.filter) {
    return node.filter;
  }
  
  if (node.type === 'group' && node.children) {
    // Merge all child filters
    const mergedConfig: FilterConfig = {
      type: 'alumni',
      operator: node.operator || 'AND',
      textFilters: [],
      rangeFilters: [],
      booleanFilters: [],
      dateFilters: []
    };
    
    for (const child of node.children) {
      const childConfig = convertTreeToConfig(child);
      
      if (childConfig.textFilters) {
        mergedConfig.textFilters!.push(...childConfig.textFilters);
      }
      if (childConfig.rangeFilters) {
        mergedConfig.rangeFilters!.push(...childConfig.rangeFilters);
      }
      if (childConfig.booleanFilters) {
        mergedConfig.booleanFilters!.push(...childConfig.booleanFilters);
      }
      if (childConfig.dateFilters) {
        mergedConfig.dateFilters!.push(...childConfig.dateFilters);
      }
    }
    
    return mergedConfig;
  }
  
  return { type: 'alumni', operator: 'AND' };
}
