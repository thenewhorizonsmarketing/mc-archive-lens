/**
 * Advanced Filter Panel Component
 * 
 * Main filter panel with collapsible categories, MC Law blue styling,
 * and gold accents. Provides a comprehensive filtering interface for
 * complex database queries.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { FilterConfig } from '../../lib/filters/types';
import { FilterOption } from './FilterOption';
import { useAriaAnnouncements } from './hooks/useAriaAnnouncements';
import '../../styles/advanced-filter.css';

export interface FilterCategory {
  id: string;
  title: string;
  field: string;
  options: FilterCategoryOption[];
  type: 'text' | 'date' | 'range' | 'boolean';
}

export interface FilterCategoryOption {
  value: string;
  label: string;
  count?: number;
}

export interface AdvancedFilterPanelProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  categories: FilterCategory[];
  activeFilters: FilterConfig;
  onFilterChange: (filters: FilterConfig) => void;
  onClearAll?: () => void;
  className?: string;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  categories,
  activeFilters,
  onFilterChange,
  onClearAll,
  className = ''
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  );
  const { announceFilterChange, announce } = useAriaAnnouncements();

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      const foundCategory = categories.find(c => c.id === categoryId);
      const isExpanding = !next.has(categoryId);
      
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      
      // Announce to screen readers
      if (foundCategory) {
        announce(`${foundCategory.title} ${isExpanding ? 'expanded' : 'collapsed'}`, 'polite');
      }
      
      return next;
    });
  }, [categories, announce]);

  // Handle filter selection
  const handleFilterSelect = useCallback((
    categoryId: string,
    field: string,
    value: string,
    selected: boolean
  ) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const updatedFilters = { ...activeFilters };

    // Handle different filter types
    switch (category.type) {
      case 'text':
        if (!updatedFilters.textFilters) {
          updatedFilters.textFilters = [];
        }
        
        if (selected) {
          // Add filter
          updatedFilters.textFilters.push({
            field,
            value,
            matchType: 'equals',
            caseSensitive: false
          });
        } else {
          // Remove filter
          updatedFilters.textFilters = updatedFilters.textFilters.filter(
            f => !(f.field === field && f.value === value)
          );
        }
        break;

      case 'boolean':
        if (!updatedFilters.booleanFilters) {
          updatedFilters.booleanFilters = [];
        }
        
        if (selected) {
          updatedFilters.booleanFilters.push({
            field,
            value: value === 'true'
          });
        } else {
          updatedFilters.booleanFilters = updatedFilters.booleanFilters.filter(
            f => f.field !== field
          );
        }
        break;

      // Date and range filters would be handled by specialized components
      default:
        break;
    }

    onFilterChange(updatedFilters);
    
    // Announce filter change to screen readers
    const foundCategory = categories.find(c => c.id === categoryId);
    if (foundCategory) {
      announceFilterChange(
        `${foundCategory.title}: ${value}`,
        selected ? 'added' : 'removed'
      );
    }
  }, [categories, activeFilters, onFilterChange, announceFilterChange]);

  // Check if a filter is active
  const isFilterActive = useCallback((
    categoryId: string,
    field: string,
    value: string
  ): boolean => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return false;

    switch (category.type) {
      case 'text':
        return activeFilters.textFilters?.some(
          f => f.field === field && f.value === value
        ) || false;

      case 'boolean':
        return activeFilters.booleanFilters?.some(
          f => f.field === field && String(f.value) === value
        ) || false;

      default:
        return false;
    }
  }, [categories, activeFilters]);

  // Count active filters in a category
  const getActiveCategoryCount = useCallback((categoryId: string): number => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;

    switch (category.type) {
      case 'text':
        return activeFilters.textFilters?.filter(
          f => f.field === category.field
        ).length || 0;

      case 'boolean':
        return activeFilters.booleanFilters?.filter(
          f => f.field === category.field
        ).length || 0;

      case 'date':
        return activeFilters.dateFilters?.filter(
          f => f.field === category.field
        ).length || 0;

      case 'range':
        return activeFilters.rangeFilters?.filter(
          f => f.field === category.field
        ).length || 0;

      default:
        return 0;
    }
  }, [categories, activeFilters]);

  // Get total active filter count
  const totalActiveFilters = 
    (activeFilters.textFilters?.length || 0) +
    (activeFilters.dateFilters?.length || 0) +
    (activeFilters.rangeFilters?.length || 0) +
    (activeFilters.booleanFilters?.length || 0) +
    (activeFilters.customFilters?.length || 0);

  // Announce when filters are cleared
  const handleClearAll = useCallback(() => {
    if (onClearAll) {
      onClearAll();
      announce('All filters cleared', 'polite');
    }
  }, [onClearAll, announce]);

  // Announce total filter count changes
  useEffect(() => {
    if (totalActiveFilters > 0) {
      announce(`${totalActiveFilters} ${totalActiveFilters === 1 ? 'filter' : 'filters'} active`, 'polite');
    }
  }, [totalActiveFilters, announce]);

  return (
    <div 
      className={`advanced-filter-panel ${className}`}
      role="region"
      aria-label="Filter panel"
    >
      {/* Panel Header */}
      <div className="filter-panel-header">
        <h2 className="filter-panel-title" id="filter-panel-title">
          Filters
          {totalActiveFilters > 0 && (
            <span 
              className="filter-badge filter-badge-large" 
              style={{ marginLeft: '12px' }}
              aria-label={`${totalActiveFilters} active filters`}
            >
              {totalActiveFilters}
            </span>
          )}
        </h2>
        
        {totalActiveFilters > 0 && onClearAll && (
          <button
            className="filter-button filter-button-secondary"
            onClick={handleClearAll}
            aria-label={`Clear all ${totalActiveFilters} filters`}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Categories */}
      <div 
        className="filter-categories"
        role="group"
        aria-labelledby="filter-panel-title"
      >
        {categories.map(category => {
          const isExpanded = expandedCategories.has(category.id);
          const activeCount = getActiveCategoryCount(category.id);

          return (
            <div key={category.id} className="filter-category">
              {/* Category Header */}
              <div
                id={`filter-category-header-${category.id}`}
                className="filter-category-header"
                onClick={() => toggleCategory(category.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={`filter-category-${category.id}`}
                aria-label={`${category.title} filter category, ${activeCount} active, ${isExpanded ? 'expanded' : 'collapsed'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(category.id);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 className="filter-category-title" aria-hidden="true">{category.title}</h3>
                  {activeCount > 0 && (
                    <span 
                      className="filter-category-count"
                      aria-label={`${activeCount} active`}
                    >
                      {activeCount}
                    </span>
                  )}
                </div>
                
                <span
                  style={{
                    color: 'var(--mc-gold)',
                    fontSize: '1.25rem',
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                  aria-hidden="true"
                >
                  ▼
                </span>
              </div>

              {/* Category Content */}
              {isExpanded && (
                <div
                  id={`filter-category-${category.id}`}
                  className="filter-category-content"
                  role="group"
                  aria-labelledby={`filter-category-header-${category.id}`}
                >
                  {category.options.map(option => (
                    <FilterOption
                      key={`${category.id}-${option.value}`}
                      label={option.label}
                      value={option.value}
                      checked={isFilterActive(category.id, category.field, option.value)}
                      onChange={(checked: boolean) => 
                        handleFilterSelect(category.id, category.field, option.value, checked)
                      }
                      count={option.count}
                      showCount={true}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--filter-text-muted)'
          }}
        >
          <p>No filters available for this content type.</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilterPanel;
