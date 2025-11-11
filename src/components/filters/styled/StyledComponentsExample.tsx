import React, { useState } from 'react';
import { FilterButton } from './FilterButton';
import { FilterChip } from './FilterChip';
import { FilterInput } from './FilterInput';
import { FilterBadge } from './FilterBadge';
import { FilterSpinner } from './FilterSpinner';
import '../../../styles/advanced-filter.css';

/**
 * StyledComponentsExample - Demonstration of all styled filter components
 * 
 * This example shows how to use the MC Law blue themed components
 * in the advanced filter system.
 */
export const StyledComponentsExample: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState([
    { id: '1', label: 'Year', value: '2020' },
    { id: '2', label: 'Category', value: 'Alumni' },
    { id: '3', label: 'Status', value: 'Active' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemoveFilter = (id: string) => {
    setActiveFilters(activeFilters.filter(f => f.id !== id));
  };

  const handleApplyFilters = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div style={{ padding: '2rem', background: '#f5f5f5', minHeight: '100vh' }}>
      <div className="advanced-filter-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="filter-panel-header">
          <h2 className="filter-panel-title">Styled Components Example</h2>
          <FilterBadge count={activeFilters.length} size="large" />
        </div>

        {/* Filter Input Example */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--filter-text)', marginBottom: '1rem' }}>
            Filter Input
          </h3>
          <FilterInput
            label="Search"
            placeholder="Enter search term..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            helperText="Search by name, keyword, or category"
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            }
          />
        </section>

        {/* Active Filters (Chips) */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--filter-text)', marginBottom: '1rem' }}>
            Active Filters
          </h3>
          <div className="filter-chips-container">
            {activeFilters.map(filter => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                value={filter.value}
                onRemove={() => handleRemoveFilter(filter.id)}
              />
            ))}
          </div>
        </section>

        {/* Filter Options Example */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--filter-text)', marginBottom: '1rem' }}>
            Filter Options
          </h3>
          <div className="filter-category">
            <div className="filter-category-header">
              <h4 className="filter-category-title">Categories</h4>
              <FilterBadge count={5} />
            </div>
            <div className="filter-category-content">
              {['Alumni', 'Faculty', 'Publications', 'Photos', 'Events'].map((option) => (
                <div key={option} className="filter-option">
                  <input
                    type="checkbox"
                    id={`option-${option}`}
                    className="filter-option-checkbox"
                  />
                  <label htmlFor={`option-${option}`} className="filter-option-label">
                    {option}
                  </label>
                  <span className="filter-option-count">
                    {Math.floor(Math.random() * 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Buttons Example */}
        <section style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--filter-text)', marginBottom: '1rem' }}>
            Buttons
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <FilterButton
              variant="primary"
              onClick={handleApplyFilters}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FilterSpinner size="small" />
                  Applying...
                </>
              ) : (
                'Apply Filters'
              )}
            </FilterButton>
            
            <FilterButton
              variant="secondary"
              onClick={() => setActiveFilters([])}
            >
              Clear All
            </FilterButton>
            
            <FilterButton
              variant="secondary"
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
              }
            >
              Add Filter
            </FilterButton>
          </div>
        </section>

        {/* Loading States */}
        <section>
          <h3 style={{ color: 'var(--filter-text)', marginBottom: '1rem' }}>
            Loading States
          </h3>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--filter-text-muted)', marginBottom: '0.5rem' }}>
                Small
              </p>
              <FilterSpinner size="small" />
            </div>
            <div>
              <p style={{ color: 'var(--filter-text-muted)', marginBottom: '0.5rem' }}>
                Medium
              </p>
              <FilterSpinner size="medium" />
            </div>
            <div>
              <p style={{ color: 'var(--filter-text-muted)', marginBottom: '0.5rem' }}>
                Large
              </p>
              <FilterSpinner size="large" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--filter-text-muted)', marginBottom: '0.5rem' }}>
                Skeleton
              </p>
              <div className="filter-skeleton" style={{ height: '40px', width: '100%' }} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StyledComponentsExample;
