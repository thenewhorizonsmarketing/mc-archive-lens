/**
 * Bulk Filter Selector Component
 * 
 * Provides multi-select functionality for filters with bulk operations.
 * Features MC Law blue styling with gold accents.
 * 
 * Requirements: 8, 12
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FilterConfig } from '../../lib/filters/types';
import { FilterBadge } from './styled/FilterBadge';
import '../../styles/advanced-filter.css';

export interface BulkFilterOption {
  id: string;
  field: string;
  value: string;
  label: string;
  category: string;
  type: 'text' | 'date' | 'range' | 'boolean';
}

export interface BulkFilterSelectorProps {
  availableFilters: BulkFilterOption[];
  activeFilters: FilterConfig;
  onSelectionChange: (selectedIds: string[]) => void;
  onApplySelected: (selectedFilters: BulkFilterOption[]) => void;
  className?: string;
}

/**
 * BulkFilterSelector - Multi-select interface for bulk filter operations
 * 
 * Features:
 * - Multi-select checkboxes with MC Blue styling
 * - "Select All" functionality
 * - Selection count in gold badge
 * - Category grouping
 * - Keyboard navigation support
 */
export const BulkFilterSelector: React.FC<BulkFilterSelectorProps> = ({
  availableFilters,
  activeFilters,
  onSelectionChange,
  onApplySelected,
  className = ''
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group filters by category
  const filtersByCategory = useMemo(() => {
    const grouped = new Map<string, BulkFilterOption[]>();
    
    availableFilters.forEach(filter => {
      if (!grouped.has(filter.category)) {
        grouped.set(filter.category, []);
      }
      grouped.get(filter.category)!.push(filter);
    });
    
    return grouped;
  }, [availableFilters]);

  // Check if a filter is currently active
  const isFilterActive = useCallback((filter: BulkFilterOption): boolean => {
    switch (filter.type) {
      case 'text':
        return activeFilters.textFilters?.some(
          f => f.field === filter.field && f.value === filter.value
        ) || false;
      
      case 'boolean':
        return activeFilters.booleanFilters?.some(
          f => f.field === filter.field && String(f.value) === filter.value
        ) || false;
      
      default:
        return false;
    }
  }, [activeFilters]);

  // Toggle individual filter selection
  const toggleFilter = useCallback((filterId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      onSelectionChange(Array.from(next));
      return next;
    });
  }, [onSelectionChange]);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // Select all filters in a category
  const selectAllInCategory = useCallback((category: string) => {
    const categoryFilters = filtersByCategory.get(category) || [];
    const categoryIds = categoryFilters.map(f => f.id);
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      categoryIds.forEach(id => next.add(id));
      onSelectionChange(Array.from(next));
      return next;
    });
  }, [filtersByCategory, onSelectionChange]);

  // Deselect all filters in a category
  const deselectAllInCategory = useCallback((category: string) => {
    const categoryFilters = filtersByCategory.get(category) || [];
    const categoryIds = new Set(categoryFilters.map(f => f.id));
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      categoryIds.forEach(id => next.delete(id));
      onSelectionChange(Array.from(next));
      return next;
    });
  }, [filtersByCategory, onSelectionChange]);

  // Select all filters
  const selectAll = useCallback(() => {
    const allIds = availableFilters.map(f => f.id);
    setSelectedIds(new Set(allIds));
    onSelectionChange(allIds);
  }, [availableFilters, onSelectionChange]);

  // Deselect all filters
  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Apply selected filters
  const handleApplySelected = useCallback(() => {
    const selectedFilters = availableFilters.filter(f => selectedIds.has(f.id));
    onApplySelected(selectedFilters);
  }, [availableFilters, selectedIds, onApplySelected]);

  // Check if all filters in a category are selected
  const isCategoryFullySelected = useCallback((category: string): boolean => {
    const categoryFilters = filtersByCategory.get(category) || [];
    return categoryFilters.length > 0 && 
           categoryFilters.every(f => selectedIds.has(f.id));
  }, [filtersByCategory, selectedIds]);

  // Check if some (but not all) filters in a category are selected
  const isCategoryPartiallySelected = useCallback((category: string): boolean => {
    const categoryFilters = filtersByCategory.get(category) || [];
    const selectedCount = categoryFilters.filter(f => selectedIds.has(f.id)).length;
    return selectedCount > 0 && selectedCount < categoryFilters.length;
  }, [filtersByCategory, selectedIds]);

  const selectedCount = selectedIds.size;
  const totalCount = availableFilters.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className={`bulk-filter-selector ${className}`}>
      {/* Header */}
      <div className="bulk-filter-selector__header">
        <div className="bulk-filter-selector__title-row">
          <h3 className="bulk-filter-selector__title">
            Bulk Filter Selection
          </h3>
          {selectedCount > 0 && (
            <FilterBadge count={selectedCount} size="large" ariaLabel={`${selectedCount} filters selected`} />
          )}
        </div>

        {/* Global Actions */}
        <div className="bulk-filter-selector__actions">
          <button
            className="filter-button filter-button-secondary"
            onClick={allSelected ? deselectAll : selectAll}
            aria-label={allSelected ? 'Deselect all filters' : 'Select all filters'}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          
          {selectedCount > 0 && (
            <button
              className="filter-button filter-button-primary"
              onClick={handleApplySelected}
              aria-label={`Apply ${selectedCount} selected filters`}
            >
              Apply Selected ({selectedCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Categories */}
      <div className="bulk-filter-selector__categories">
        {Array.from(filtersByCategory.entries()).map(([category, filters]) => {
          const isExpanded = expandedCategories.has(category);
          const isFullySelected = isCategoryFullySelected(category);
          const isPartiallySelected = isCategoryPartiallySelected(category);
          const categorySelectedCount = filters.filter(f => selectedIds.has(f.id)).length;

          return (
            <div key={category} className="bulk-filter-selector__category">
              {/* Category Header */}
              <div className="bulk-filter-selector__category-header">
                <div
                  className="bulk-filter-selector__category-title-row"
                  onClick={() => toggleCategory(category)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`bulk-category-${category}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleCategory(category);
                    }
                  }}
                >
                  <div className="bulk-filter-selector__category-info">
                    {/* Category Checkbox */}
                    <div className="bulk-filter-selector__category-checkbox">
                      <input
                        type="checkbox"
                        checked={isFullySelected}
                        ref={input => {
                          if (input) {
                            input.indeterminate = isPartiallySelected;
                          }
                        }}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (isFullySelected) {
                            deselectAllInCategory(category);
                          } else {
                            selectAllInCategory(category);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select all filters in ${category}`}
                        className="bulk-filter-selector__checkbox-input"
                      />
                      <div className="bulk-filter-selector__checkbox-custom">
                        {isFullySelected && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                              stroke="var(--mc-blue)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                        {isPartiallySelected && !isFullySelected && (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                              d="M3 7H11"
                              stroke="var(--mc-blue)"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    <h4 className="bulk-filter-selector__category-name">
                      {category}
                    </h4>
                    
                    {categorySelectedCount > 0 && (
                      <span className="bulk-filter-selector__category-count">
                        {categorySelectedCount}/{filters.length}
                      </span>
                    )}
                  </div>

                  <span
                    className="bulk-filter-selector__expand-icon"
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                    aria-hidden="true"
                  >
                    ▼
                  </span>
                </div>
              </div>

              {/* Category Content */}
              {isExpanded && (
                <div
                  id={`bulk-category-${category}`}
                  className="bulk-filter-selector__category-content"
                  role="region"
                  aria-labelledby={`bulk-category-header-${category}`}
                >
                  {filters.map(filter => {
                    const isSelected = selectedIds.has(filter.id);
                    const isActive = isFilterActive(filter);

                    return (
                      <div
                        key={filter.id}
                        className={`bulk-filter-selector__option ${isActive ? 'bulk-filter-selector__option--active' : ''}`}
                        onClick={() => toggleFilter(filter.id)}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleFilter(filter.id);
                          }
                        }}
                      >
                        {/* Checkbox */}
                        <div className="bulk-filter-selector__option-checkbox">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFilter(filter.id)}
                            onClick={(e) => e.stopPropagation()}
                            tabIndex={-1}
                            aria-hidden="true"
                            className="bulk-filter-selector__checkbox-input"
                          />
                          <div className="bulk-filter-selector__checkbox-custom">
                            {isSelected && (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path
                                  d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                                  stroke="var(--mc-blue)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Label */}
                        <span className="bulk-filter-selector__option-label">
                          {filter.label}
                        </span>

                        {/* Active Indicator */}
                        {isActive && (
                          <span className="bulk-filter-selector__active-badge">
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {availableFilters.length === 0 && (
        <div className="bulk-filter-selector__empty">
          <p className="bulk-filter-selector__empty-text">
            No filters available for bulk selection.
          </p>
        </div>
      )}

      {/* Footer Summary */}
      {selectedCount > 0 && (
        <div className="bulk-filter-selector__footer">
          <p className="bulk-filter-selector__summary">
            <strong>{selectedCount}</strong> of <strong>{totalCount}</strong> filters selected
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkFilterSelector;
