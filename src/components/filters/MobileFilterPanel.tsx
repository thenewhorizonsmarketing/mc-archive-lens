/**
 * Mobile Filter Panel Component
 * 
 * Bottom sheet implementation for mobile devices with swipe gestures,
 * touch-friendly controls (44x44px minimum), and responsive design.
 * Optimized for touchscreen interaction with MC Law blue styling.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FilterConfig } from '../../lib/filters/types';
import { FilterCategory, FilterCategoryOption } from './AdvancedFilterPanel';
import { FilterOption } from './FilterOption';
import { useAriaAnnouncements } from './hooks/useAriaAnnouncements';
import '../../styles/advanced-filter.css';
import './MobileFilterPanel.css';

export interface MobileFilterPanelProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  categories: FilterCategory[];
  activeFilters: FilterConfig;
  onFilterChange: (filters: FilterConfig) => void;
  onClearAll?: () => void;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const MobileFilterPanel: React.FC<MobileFilterPanelProps> = ({
  categories,
  activeFilters,
  onFilterChange,
  onClearAll,
  isOpen,
  onClose,
  className = ''
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [dragCurrentY, setDragCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { announceFilterChange, announce } = useAriaAnnouncements();

  // Calculate drag offset
  const dragOffset = dragStartY !== null && dragCurrentY !== null 
    ? Math.max(0, dragCurrentY - dragStartY) 
    : 0;

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    setDragCurrentY(touch.clientY);
    setIsDragging(true);
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY === null) return;
    
    const touch = e.touches[0];
    setDragCurrentY(touch.clientY);
    
    // Prevent scrolling when dragging down
    if (touch.clientY > dragStartY) {
      e.preventDefault();
    }
  }, [dragStartY]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (dragOffset > 100) {
      // Close if dragged down more than 100px
      onClose();
      announce('Filter panel closed', 'polite');
    }
    
    setDragStartY(null);
    setDragCurrentY(null);
    setIsDragging(false);
  }, [dragOffset, onClose, announce]);

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

    switch (category.type) {
      case 'text':
        if (!updatedFilters.textFilters) {
          updatedFilters.textFilters = [];
        }
        
        if (selected) {
          updatedFilters.textFilters.push({
            field,
            value,
            matchType: 'equals',
            caseSensitive: false
          });
        } else {
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

      default:
        break;
    }

    onFilterChange(updatedFilters);
    
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

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (onClearAll) {
      onClearAll();
      announce('All filters cleared', 'polite');
    }
  }, [onClearAll, announce]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    onClose();
    announce('Filter panel closed', 'polite');
  }, [onClose, announce]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      announce('Filter panel opened', 'polite');
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, announce]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        announce('Filter panel closed', 'polite');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, announce]);

  if (!isOpen) return null;

  return (
    <div className={`mobile-filter-overlay ${className}`}>
      {/* Backdrop */}
      <div 
        className="mobile-filter-backdrop"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`mobile-filter-sheet ${isDragging ? 'dragging' : ''}`}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Filter panel"
      >
        {/* Drag Handle */}
        <div
          className="mobile-filter-handle-area"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Drag to close"
        >
          <div className="mobile-filter-handle" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="mobile-filter-header">
          <div className="mobile-filter-title-row">
            <h2 className="mobile-filter-title">
              Filters
              {totalActiveFilters > 0 && (
                <span 
                  className="filter-badge filter-badge-large"
                  aria-label={`${totalActiveFilters} active filters`}
                >
                  {totalActiveFilters}
                </span>
              )}
            </h2>
            
            <button
              className="mobile-filter-close-button"
              onClick={onClose}
              aria-label="Close filter panel"
            >
              ✕
            </button>
          </div>

          {totalActiveFilters > 0 && onClearAll && (
            <button
              className="mobile-filter-clear-button"
              onClick={handleClearAll}
              aria-label={`Clear all ${totalActiveFilters} filters`}
            >
              Clear All ({totalActiveFilters})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="mobile-filter-content">
          {categories.map(category => {
            const isExpanded = expandedCategories.has(category.id);
            const activeCount = getActiveCategoryCount(category.id);

            return (
              <div key={category.id} className="mobile-filter-category">
                {/* Category Header */}
                <button
                  className="mobile-filter-category-header"
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`mobile-filter-category-${category.id}`}
                  aria-label={`${category.title} filter category, ${activeCount} active, ${isExpanded ? 'expanded' : 'collapsed'}`}
                >
                  <div className="mobile-filter-category-title-row">
                    <h3 className="mobile-filter-category-title">{category.title}</h3>
                    {activeCount > 0 && (
                      <span 
                        className="mobile-filter-category-count"
                        aria-label={`${activeCount} active`}
                      >
                        {activeCount}
                      </span>
                    )}
                  </div>
                  
                  <span
                    className="mobile-filter-category-icon"
                    aria-hidden="true"
                  >
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* Category Content */}
                {isExpanded && (
                  <div
                    id={`mobile-filter-category-${category.id}`}
                    className="mobile-filter-category-content"
                    role="group"
                    aria-label={`${category.title} options`}
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

          {/* Empty State */}
          {categories.length === 0 && (
            <div className="mobile-filter-empty">
              <p>No filters available for this content type.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mobile-filter-footer">
          <button
            className="mobile-filter-apply-button"
            onClick={onClose}
            aria-label="Apply filters and close"
          >
            Apply Filters
            {totalActiveFilters > 0 && ` (${totalActiveFilters})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterPanel;
