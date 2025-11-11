// FilterPanel Component
// Touch-optimized filter controls for kiosk search interface
import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import { FilterOptions } from '@/lib/database/filter-processor';
import './FilterPanel.css';

export interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  availableFilters?: AvailableFilters;
  className?: string;
}

export interface AvailableFilters {
  categories?: Array<'alumni' | 'publication' | 'photo' | 'faculty'>;
  yearRanges?: Array<{ start: number; end: number; label: string }>;
  publicationTypes?: string[];
  departments?: string[];
  decades?: string[];
  collections?: string[];
}

/**
 * FilterPanel Component
 * 
 * A collapsible filter panel optimized for touch interaction with:
 * - Touch-friendly toggle buttons (44x44px minimum)
 * - Category filters (Alumni, Publications, Photos, Faculty)
 * - Year range filter controls
 * - Active filter indicators
 * - Clear all functionality
 * 
 * Requirements: 4.1, 4.2, 4.6, 9.1, 9.3
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  availableFilters = {},
  className = ''
}) => {
  // Panel state
  const [isExpanded, setIsExpanded] = useState(false);

  // Default available filters
  const categories = availableFilters.categories || ['alumni', 'publication', 'photo', 'faculty'];
  const decades = availableFilters.decades || [
    '1950s', '1960s', '1970s', '1980s', '1990s', 
    '2000s', '2010s', '2020s'
  ];
  const publicationTypes = availableFilters.publicationTypes || [
    'Law Review', 'Amicus', 'Legal Eye', 'Directory'
  ];
  const departments = availableFilters.departments || [
    'Constitutional Law', 'Criminal Law', 'Corporate Law', 
    'Environmental Law', 'International Law'
  ];

  /**
   * Toggle panel expansion
   */
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  /**
   * Toggle category filter
   * Requirements: 4.2, 4.3
   */
  const toggleCategory = useCallback((category: 'alumni' | 'publication' | 'photo' | 'faculty') => {
    const currentType = filters.type;
    
    // If clicking the same category, clear it
    if (currentType === category) {
      onChange({ ...filters, type: undefined });
    } else {
      // Set new category
      onChange({ ...filters, type: category });
    }
  }, [filters, onChange]);

  /**
   * Toggle decade filter
   * Requirements: 4.2, 4.3
   */
  const toggleDecade = useCallback((decade: string) => {
    const currentDecade = filters.decade;
    
    if (currentDecade === decade) {
      onChange({ ...filters, decade: undefined, yearRange: undefined });
    } else {
      // Extract start year from decade string (e.g., "1980s" -> 1980)
      const startYear = parseInt(decade.replace('s', ''));
      const yearRange = { start: startYear, end: startYear + 9 };
      
      onChange({ 
        ...filters, 
        decade, 
        yearRange 
      });
    }
  }, [filters, onChange]);

  /**
   * Toggle publication type filter
   * Requirements: 4.2, 4.3
   */
  const togglePublicationType = useCallback((pubType: string) => {
    const currentType = filters.publicationType;
    
    if (currentType === pubType) {
      onChange({ ...filters, publicationType: undefined });
    } else {
      onChange({ ...filters, publicationType: pubType });
    }
  }, [filters, onChange]);

  /**
   * Toggle department filter
   * Requirements: 4.2, 4.3
   */
  const toggleDepartment = useCallback((department: string) => {
    const currentDept = filters.department;
    
    if (currentDept === department) {
      onChange({ ...filters, department: undefined });
    } else {
      onChange({ ...filters, department: department });
    }
  }, [filters, onChange]);

  /**
   * Clear all filters
   * Requirements: 4.4, 4.5
   */
  const clearAllFilters = useCallback(() => {
    onChange({});
  }, [onChange]);

  /**
   * Count active filters
   * Requirements: 4.5, 4.6
   */
  const getActiveFilterCount = useCallback((): number => {
    let count = 0;
    if (filters.type) count++;
    if (filters.decade) count++;
    if (filters.publicationType) count++;
    if (filters.department) count++;
    if (filters.yearRange) count++;
    return count;
  }, [filters]);

  const activeFilterCount = getActiveFilterCount();

  /**
   * Get category label
   */
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      alumni: 'Alumni',
      publication: 'Publications',
      photo: 'Photos',
      faculty: 'Faculty'
    };
    return labels[category] || category;
  };

  return (
    <div 
      className={`filter-panel bg-background border-b ${className}`}
      role="region"
      aria-label="Search filters"
    >
      {/* Filter Header - Always Visible */}
      <div className="filter-header flex items-center justify-between p-4">
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-2 h-12 px-4 rounded-lg hover:bg-muted transition-colors"
          aria-expanded={isExpanded}
          aria-controls="filter-content"
          type="button"
        >
          <Filter className="h-5 w-5" aria-hidden="true" />
          <span className="text-lg font-semibold">Filters</span>
          {activeFilterCount > 0 && (
            <span 
              className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-primary text-primary-foreground text-sm font-bold"
              aria-label={`${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`}
            >
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 ml-auto" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-5 w-5 ml-auto" aria-hidden="true" />
          )}
        </button>

        {/* Clear All Button */}
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="h-11 min-w-[44px] px-4 flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            aria-label="Clear all filters"
            type="button"
          >
            <X className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Clear All</span>
          </button>
        )}
      </div>

      {/* Filter Content - Collapsible */}
      {isExpanded && (
        <div 
          id="filter-content"
          className="filter-content p-4 pt-0 space-y-6 animate-in slide-in-from-top-2 duration-200"
        >
          {/* Category Filters */}
          <div className="filter-section">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              CATEGORY
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const isActive = filters.type === category;
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`
                      h-11 min-w-[44px] px-4 rounded-lg font-medium transition-all
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-muted text-foreground hover:bg-muted/80'
                      }
                    `}
                    aria-pressed={isActive}
                    aria-label={`Filter by ${getCategoryLabel(category)}`}
                    type="button"
                  >
                    {getCategoryLabel(category)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Year/Decade Filters */}
          <div className="filter-section">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              DECADE
            </h3>
            <div className="flex flex-wrap gap-2">
              {decades.map((decade) => {
                const isActive = filters.decade === decade;
                return (
                  <button
                    key={decade}
                    onClick={() => toggleDecade(decade)}
                    className={`
                      h-11 min-w-[44px] px-4 rounded-lg font-medium transition-all
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-muted text-foreground hover:bg-muted/80'
                      }
                    `}
                    aria-pressed={isActive}
                    aria-label={`Filter by ${decade}`}
                    type="button"
                  >
                    {decade}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Publication Type Filters */}
          {(filters.type === 'publication' || !filters.type) && (
            <div className="filter-section">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                PUBLICATION TYPE
              </h3>
              <div className="flex flex-wrap gap-2">
                {publicationTypes.map((pubType) => {
                  const isActive = filters.publicationType === pubType;
                  return (
                    <button
                      key={pubType}
                      onClick={() => togglePublicationType(pubType)}
                      className={`
                        h-11 min-w-[44px] px-4 rounded-lg font-medium transition-all
                        ${isActive 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'bg-muted text-foreground hover:bg-muted/80'
                        }
                      `}
                      aria-pressed={isActive}
                      aria-label={`Filter by ${pubType}`}
                      type="button"
                    >
                      {pubType}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Department Filters */}
          {(filters.type === 'faculty' || !filters.type) && (
            <div className="filter-section">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                DEPARTMENT
              </h3>
              <div className="flex flex-wrap gap-2">
                {departments.map((department) => {
                  const isActive = filters.department === department;
                  return (
                    <button
                      key={department}
                      onClick={() => toggleDepartment(department)}
                      className={`
                        h-11 min-w-[44px] px-4 rounded-lg font-medium transition-all
                        ${isActive 
                          ? 'bg-primary text-primary-foreground shadow-md' 
                          : 'bg-muted text-foreground hover:bg-muted/80'
                        }
                      `}
                      aria-pressed={isActive}
                      aria-label={`Filter by ${department}`}
                      type="button"
                    >
                      {department}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
