/**
 * Advanced Filter Panel Example
 * 
 * Demonstrates how to use the AdvancedFilterPanel component
 * with sample data and filter handling.
 */

import React, { useState } from 'react';
import { AdvancedFilterPanel, FilterCategory } from './AdvancedFilterPanel';
import { FilterConfig } from '../../lib/filters/types';
import '../../styles/advanced-filter.css';

// Sample filter categories for alumni
const alumniCategories: FilterCategory[] = [
  {
    id: 'graduation-year',
    title: 'Graduation Year',
    field: 'graduation_year',
    type: 'text',
    options: [
      { value: '1980', label: '1980', count: 64 },
      { value: '1981', label: '1981', count: 63 },
      { value: '1982', label: '1982', count: 58 },
      { value: '1983', label: '1983', count: 72 },
      { value: '1984', label: '1984', count: 65 }
    ]
  },
  {
    id: 'degree',
    title: 'Degree',
    field: 'degree',
    type: 'text',
    options: [
      { value: 'JD', label: 'Juris Doctor (JD)', count: 245 },
      { value: 'LLM', label: 'Master of Laws (LLM)', count: 32 },
      { value: 'SJD', label: 'Doctor of Juridical Science (SJD)', count: 8 }
    ]
  },
  {
    id: 'practice-area',
    title: 'Practice Area',
    field: 'practice_area',
    type: 'text',
    options: [
      { value: 'corporate', label: 'Corporate Law', count: 89 },
      { value: 'criminal', label: 'Criminal Law', count: 56 },
      { value: 'family', label: 'Family Law', count: 43 },
      { value: 'intellectual-property', label: 'Intellectual Property', count: 38 },
      { value: 'real-estate', label: 'Real Estate', count: 52 }
    ]
  },
  {
    id: 'location',
    title: 'Location',
    field: 'location',
    type: 'text',
    options: [
      { value: 'mississippi', label: 'Mississippi', count: 156 },
      { value: 'tennessee', label: 'Tennessee', count: 45 },
      { value: 'alabama', label: 'Alabama', count: 32 },
      { value: 'louisiana', label: 'Louisiana', count: 28 },
      { value: 'other', label: 'Other States', count: 24 }
    ]
  },
  {
    id: 'honors',
    title: 'Honors & Awards',
    field: 'has_honors',
    type: 'boolean',
    options: [
      { value: 'true', label: 'Has Honors', count: 87 },
      { value: 'false', label: 'No Honors', count: 198 }
    ]
  }
];

export const AdvancedFilterPanelExample: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    type: 'alumni',
    operator: 'AND',
    textFilters: [],
    booleanFilters: []
  });

  const handleFilterChange = (filters: FilterConfig) => {
    setActiveFilters(filters);
    console.log('Filters changed:', filters);
  };

  const handleClearAll = () => {
    setActiveFilters({
      type: 'alumni',
      operator: 'AND',
      textFilters: [],
      booleanFilters: []
    });
    console.log('All filters cleared');
  };

  // Calculate total results (mock)
  const totalResults = 285;
  const filteredResults = Math.max(
    0,
    totalResults - 
    ((activeFilters.textFilters?.length || 0) * 15) -
    ((activeFilters.booleanFilters?.length || 0) * 20)
  );

  return (
    <div style={{ padding: '40px', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '24px', color: '#0C2340' }}>
          Advanced Filter Panel Example
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
          {/* Filter Panel */}
          <div>
            <AdvancedFilterPanel
              contentType="alumni"
              categories={alumniCategories}
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onClearAll={handleClearAll}
            />
          </div>

          {/* Results Area */}
          <div
            style={{
              background: 'white',
              border: '2px solid #C99700',
              borderRadius: '12px',
              padding: '24px'
            }}
          >
            <h2 style={{ color: '#0C2340', marginBottom: '16px' }}>
              Search Results
            </h2>

            <p style={{ color: '#666', marginBottom: '24px' }}>
              Showing {filteredResults} of {totalResults} alumni
            </p>

            {/* Active Filters Display */}
            {(activeFilters.textFilters?.length || 0) + (activeFilters.booleanFilters?.length || 0) > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#0C2340' }}>
                  Active Filters:
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {activeFilters.textFilters?.map((filter, index) => (
                    <div
                      key={`text-${index}`}
                      className="filter-chip"
                    >
                      <span className="filter-chip-label">
                        {filter.field}: {filter.value}
                      </span>
                    </div>
                  ))}
                  {activeFilters.booleanFilters?.map((filter, index) => (
                    <div
                      key={`bool-${index}`}
                      className="filter-chip"
                    >
                      <span className="filter-chip-label">
                        {filter.field}: {filter.value ? 'Yes' : 'No'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mock Results */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Array.from({ length: Math.min(5, filteredResults) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <h4 style={{ margin: '0 0 8px 0', color: '#0C2340' }}>
                    Alumni Name {i + 1}
                  </h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                    Class of 1980 • Corporate Law • Mississippi
                  </p>
                </div>
              ))}
            </div>

            {filteredResults === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#999'
                }}
              >
                <p>No results found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Filter State Debug */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}
        >
          <h3 style={{ marginBottom: '12px', fontSize: '1rem' }}>
            Current Filter State (Debug):
          </h3>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}
          >
            {JSON.stringify(activeFilters, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilterPanelExample;
