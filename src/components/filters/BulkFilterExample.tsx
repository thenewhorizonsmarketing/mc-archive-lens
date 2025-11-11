/**
 * Bulk Filter Example Component
 * 
 * Demonstrates the usage of BulkFilterSelector and BulkOperations
 * components for bulk filter management.
 */

import React, { useState, useCallback } from 'react';
import { FilterConfig } from '../../lib/filters/types';
import { BulkFilterSelector, BulkFilterOption } from './BulkFilterSelector';
import { BulkOperations } from './BulkOperations';
import '../../styles/advanced-filter.css';

// Sample filter options for demonstration
const sampleFilters: BulkFilterOption[] = [
  // Graduation Year filters
  { id: 'year-1980', field: 'graduationYear', value: '1980', label: '1980', category: 'Graduation Year', type: 'text' },
  { id: 'year-1981', field: 'graduationYear', value: '1981', label: '1981', category: 'Graduation Year', type: 'text' },
  { id: 'year-1982', field: 'graduationYear', value: '1982', label: '1982', category: 'Graduation Year', type: 'text' },
  { id: 'year-1983', field: 'graduationYear', value: '1983', label: '1983', category: 'Graduation Year', type: 'text' },
  { id: 'year-1984', field: 'graduationYear', value: '1984', label: '1984', category: 'Graduation Year', type: 'text' },
  
  // Degree Type filters
  { id: 'degree-jd', field: 'degreeType', value: 'JD', label: 'Juris Doctor (JD)', category: 'Degree Type', type: 'text' },
  { id: 'degree-llm', field: 'degreeType', value: 'LLM', label: 'Master of Laws (LLM)', category: 'Degree Type', type: 'text' },
  { id: 'degree-sjd', field: 'degreeType', value: 'SJD', label: 'Doctor of Juridical Science (SJD)', category: 'Degree Type', type: 'text' },
  
  // Practice Area filters
  { id: 'practice-corporate', field: 'practiceArea', value: 'Corporate', label: 'Corporate Law', category: 'Practice Area', type: 'text' },
  { id: 'practice-criminal', field: 'practiceArea', value: 'Criminal', label: 'Criminal Law', category: 'Practice Area', type: 'text' },
  { id: 'practice-family', field: 'practiceArea', value: 'Family', label: 'Family Law', category: 'Practice Area', type: 'text' },
  { id: 'practice-ip', field: 'practiceArea', value: 'IP', label: 'Intellectual Property', category: 'Practice Area', type: 'text' },
  { id: 'practice-tax', field: 'practiceArea', value: 'Tax', label: 'Tax Law', category: 'Practice Area', type: 'text' },
  
  // Status filters
  { id: 'status-active', field: 'isActive', value: 'true', label: 'Active Members', category: 'Status', type: 'boolean' },
  { id: 'status-inactive', field: 'isActive', value: 'false', label: 'Inactive Members', category: 'Status', type: 'boolean' },
  
  // Location filters
  { id: 'location-ms', field: 'state', value: 'MS', label: 'Mississippi', category: 'Location', type: 'text' },
  { id: 'location-tn', field: 'state', value: 'TN', label: 'Tennessee', category: 'Location', type: 'text' },
  { id: 'location-al', field: 'state', value: 'AL', label: 'Alabama', category: 'Location', type: 'text' },
  { id: 'location-la', field: 'state', value: 'LA', label: 'Louisiana', category: 'Location', type: 'text' },
];

export const BulkFilterExample: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    type: 'alumni',
    operator: 'AND',
    textFilters: [],
    booleanFilters: []
  });

  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);

  // Handle selection change
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedFilterIds(ids);
    console.log('Selected filter IDs:', ids);
  }, []);

  // Handle apply selected filters
  const handleApplySelected = useCallback((selectedFilters: BulkFilterOption[]) => {
    console.log('Applying selected filters:', selectedFilters);
    
    // Create new filter config
    const newConfig: FilterConfig = {
      ...activeFilters,
      textFilters: [...(activeFilters.textFilters || [])],
      booleanFilters: [...(activeFilters.booleanFilters || [])]
    };

    // Add selected filters
    selectedFilters.forEach(filter => {
      switch (filter.type) {
        case 'text':
          const textExists = newConfig.textFilters?.some(
            f => f.field === filter.field && f.value === filter.value
          );
          if (!textExists) {
            newConfig.textFilters!.push({
              field: filter.field,
              value: filter.value,
              matchType: 'equals',
              caseSensitive: false
            });
          }
          break;

        case 'boolean':
          const booleanExists = newConfig.booleanFilters?.some(
            f => f.field === filter.field
          );
          if (!booleanExists) {
            newConfig.booleanFilters!.push({
              field: filter.field,
              value: filter.value === 'true'
            });
          }
          break;
      }
    });

    setActiveFilters(newConfig);
    setSelectedFilterIds([]); // Clear selection after applying
  }, [activeFilters]);

  // Handle apply filters from BulkOperations
  const handleApplyFilters = useCallback((filters: FilterConfig) => {
    console.log('Applying filters:', filters);
    setActiveFilters(filters);
  }, []);

  // Handle clear all filters
  const handleClearAllFilters = useCallback(() => {
    console.log('Clearing all filters');
    setActiveFilters({
      type: 'alumni',
      operator: 'AND',
      textFilters: [],
      booleanFilters: []
    });
  }, []);

  return (
    <div className="bulk-filter-example">
      <div className="bulk-filter-example__header">
        <h1 className="bulk-filter-example__title">
          Bulk Filter Operations Example
        </h1>
        <p className="bulk-filter-example__description">
          This example demonstrates the bulk filter selection and operations components
          with MC Law blue styling. Select multiple filters and apply them in bulk, or
          use quick actions to manage your active filters.
        </p>
      </div>

      <div className="bulk-filter-example__content">
        {/* Bulk Operations Panel */}
        <div className="bulk-filter-example__section">
          <h2 className="bulk-filter-example__section-title">
            Bulk Operations
          </h2>
          <BulkOperations
            activeFilters={activeFilters}
            onApplyFilters={handleApplyFilters}
            onClearAllFilters={handleClearAllFilters}
          />
        </div>

        {/* Bulk Filter Selector */}
        <div className="bulk-filter-example__section">
          <h2 className="bulk-filter-example__section-title">
            Filter Selection
          </h2>
          <BulkFilterSelector
            availableFilters={sampleFilters}
            activeFilters={activeFilters}
            onSelectionChange={handleSelectionChange}
            onApplySelected={handleApplySelected}
          />
        </div>

        {/* Current State Display */}
        <div className="bulk-filter-example__section">
          <h2 className="bulk-filter-example__section-title">
            Current State (Debug)
          </h2>
          <div className="bulk-filter-example__debug">
            <div className="bulk-filter-example__debug-section">
              <h3 className="bulk-filter-example__debug-title">Selected Filter IDs:</h3>
              <pre className="bulk-filter-example__debug-code">
                {JSON.stringify(selectedFilterIds, null, 2)}
              </pre>
            </div>
            
            <div className="bulk-filter-example__debug-section">
              <h3 className="bulk-filter-example__debug-title">Active Filters:</h3>
              <pre className="bulk-filter-example__debug-code">
                {JSON.stringify(activeFilters, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bulk-filter-example__instructions">
        <h2 className="bulk-filter-example__section-title">
          How to Use
        </h2>
        <ol className="bulk-filter-example__list">
          <li>Use the <strong>Filter Selection</strong> panel to select multiple filters</li>
          <li>Click <strong>"Select All"</strong> to select all filters in all categories</li>
          <li>Click category checkboxes to select/deselect entire categories</li>
          <li>Click <strong>"Apply Selected"</strong> to apply the selected filters</li>
          <li>Use the <strong>Bulk Operations</strong> panel to view and manage active filters</li>
          <li>Click <strong>"Clear All Filters"</strong> to remove all active filters (with confirmation)</li>
          <li>Use <strong>Quick Actions</strong> for common operations</li>
        </ol>
      </div>

      {/* Features */}
      <div className="bulk-filter-example__features">
        <h2 className="bulk-filter-example__section-title">
          Features
        </h2>
        <ul className="bulk-filter-example__list">
          <li><strong>Multi-select:</strong> Select multiple filters across categories</li>
          <li><strong>Category Selection:</strong> Select/deselect entire categories at once</li>
          <li><strong>Active Indicators:</strong> See which filters are currently active</li>
          <li><strong>Selection Count:</strong> Gold badges show selection and active counts</li>
          <li><strong>Bulk Apply:</strong> Apply multiple filters with a single optimized query</li>
          <li><strong>Clear All:</strong> Remove all filters with confirmation dialog</li>
          <li><strong>Filter Breakdown:</strong> See active filters grouped by type</li>
          <li><strong>Quick Actions:</strong> Common operations for filter management</li>
          <li><strong>MC Law Styling:</strong> Consistent blue and gold theme throughout</li>
          <li><strong>Keyboard Navigation:</strong> Full keyboard support for accessibility</li>
        </ul>
      </div>
    </div>
  );
};

export default BulkFilterExample;
