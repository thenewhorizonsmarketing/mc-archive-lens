// Reusable filter panel component for content pages
import React, { useState } from 'react';
import { SearchFilters } from '@/lib/database/types';
import './FilterPanel.css';

export interface FilterPanelProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableYears?: number[];
  availableDepartments?: string[];
  availableCollections?: string[];
  availablePublicationTypes?: string[];
  availableEventTypes?: string[];
  availablePositions?: string[];
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  contentType,
  filters,
  onFiltersChange,
  availableYears = [],
  availableDepartments = [],
  availableCollections = [],
  availablePublicationTypes = [],
  availableEventTypes = [],
  availablePositions = [],
  className = ''
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate year range options
  const minYear = availableYears.length > 0 ? Math.min(...availableYears) : 1980;
  const maxYear = availableYears.length > 0 ? Math.max(...availableYears) : new Date().getFullYear();

  // Handle filter changes
  const handleYearRangeChange = (start: number, end: number) => {
    onFiltersChange({
      ...filters,
      yearRange: { start, end }
    });
  };

  const handleYearChange = (year: number | undefined) => {
    const newFilters = { ...filters };
    if (year === undefined) {
      delete newFilters.year;
    } else {
      newFilters.year = year;
    }
    onFiltersChange(newFilters);
  };

  const handleDepartmentChange = (department: string) => {
    const newFilters = { ...filters };
    if (department === '') {
      delete newFilters.department;
    } else {
      newFilters.department = department;
    }
    onFiltersChange(newFilters);
  };

  const handleCollectionChange = (collection: string) => {
    const newFilters = { ...filters };
    // Store collection in metadata or use a custom field
    if (collection === '') {
      delete newFilters.department; // Using department field for collection
    } else {
      newFilters.department = collection;
    }
    onFiltersChange(newFilters);
  };

  const handleEventTypeChange = (eventType: string) => {
    const newFilters = { ...filters };
    if (eventType === '') {
      delete newFilters.eventType;
    } else {
      newFilters.eventType = eventType;
    }
    onFiltersChange(newFilters);
  };

  const handlePublicationTypeChange = (type: string) => {
    const newFilters = { ...filters };
    if (type === '') {
      delete newFilters.publicationType;
    } else {
      newFilters.publicationType = type;
    }
    onFiltersChange(newFilters);
  };

  const handlePositionChange = (position: string) => {
    const newFilters = { ...filters };
    if (position === '') {
      delete newFilters.position;
    } else {
      newFilters.position = position;
    }
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    onFiltersChange({ type: contentType });
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.keys(filters).some(key => 
      key !== 'type' && filters[key as keyof SearchFilters] !== undefined
    );
  };

  // Render filters based on content type
  const renderFilters = () => {
    switch (contentType) {
      case 'alumni':
        return (
          <>
            {/* Year Range Filter */}
            <div className="filter-panel__group">
              <label className="filter-panel__label" htmlFor="year-range-start">
                Year Range
              </label>
              <div className="filter-panel__year-range">
                <input
                  id="year-range-start"
                  type="number"
                  min={minYear}
                  max={maxYear}
                  value={filters.yearRange?.start || minYear}
                  onChange={(e) => handleYearRangeChange(
                    parseInt(e.target.value),
                    filters.yearRange?.end || maxYear
                  )}
                  className="filter-panel__input filter-panel__input--year"
                  aria-label="Start year"
                />
                <span className="filter-panel__separator">to</span>
                <input
                  id="year-range-end"
                  type="number"
                  min={minYear}
                  max={maxYear}
                  value={filters.yearRange?.end || maxYear}
                  onChange={(e) => handleYearRangeChange(
                    filters.yearRange?.start || minYear,
                    parseInt(e.target.value)
                  )}
                  className="filter-panel__input filter-panel__input--year"
                  aria-label="End year"
                />
              </div>
            </div>

            {/* Department Filter */}
            {availableDepartments.length > 0 && (
              <div className="filter-panel__group">
                <label className="filter-panel__label" htmlFor="department-filter">
                  Department
                </label>
                <select
                  id="department-filter"
                  value={filters.department || ''}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="filter-panel__select"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        );

      case 'publication':
        return (
          <>
            {/* Year Filter */}
            <div className="filter-panel__group">
              <label className="filter-panel__label" htmlFor="year-filter">
                Year
              </label>
              <select
                id="year-filter"
                value={filters.year || ''}
                onChange={(e) => handleYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
                className="filter-panel__select"
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Publication Type Filter */}
            {availablePublicationTypes.length > 0 && (
              <div className="filter-panel__group">
                <label className="filter-panel__label" htmlFor="pub-type-filter">
                  Publication Type
                </label>
                <select
                  id="pub-type-filter"
                  value={filters.publicationType || ''}
                  onChange={(e) => handlePublicationTypeChange(e.target.value)}
                  className="filter-panel__select"
                >
                  <option value="">All Types</option>
                  {availablePublicationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Department Filter */}
            {availableDepartments.length > 0 && (
              <div className="filter-panel__group">
                <label className="filter-panel__label" htmlFor="department-filter">
                  Department
                </label>
                <select
                  id="department-filter"
                  value={filters.department || ''}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="filter-panel__select"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        );

      case 'photo':
        return (
          <>
            {/* Year Filter */}
            <div className="filter-panel__group">
              <label className="filter-panel__label" htmlFor="year-filter">
                Year
              </label>
              <select
                id="year-filter"
                value={filters.year || ''}
                onChange={(e) => handleYearChange(e.target.value ? parseInt(e.target.value) : undefined)}
                className="filter-panel__select"
              >
                <option value="">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Collection Filter */}
            {availableCollections.length > 0 && (
              <div className="filter-panel__group">
                <label className="filter-panel__label" htmlFor="collection-filter">
                  Collection
                </label>
                <select
                  id="collection-filter"
                  value={filters.department || ''}
                  onChange={(e) => handleCollectionChange(e.target.value)}
                  className="filter-panel__select"
                >
                  <option value="">All Collections</option>
                  {availableCollections.map(collection => (
                    <option key={collection} value={collection}>{collection}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Event Type Filter */}
            {availableEventTypes.length > 0 && (
              <div className="filter-panel__group">
                <label className="filter-panel__label" htmlFor="event-type-filter">
                  Event Type
                </label>
                <select
                  id="event-type-filter"
                  value={filters.eventType || ''}
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                  className="filter-panel__select"
                >
                  <option value="">All Event Types</option>
                  {availableEventTypes.map(eventType => (
                    <option key={eventType} value={eventType}>{eventType}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        );

      case 'faculty':
        return (
          <>
            {/* Department Filter */}
            {availableDepartments.length > 0 && (
              <div className="filter-panel__group">
                <label className="filter-panel__label" htmlFor="department-filter">
                  Department
                </label>
                <select
                  id="department-filter"
                  value={filters.department || ''}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="filter-panel__select"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Position/Title Filter */}
            {availablePositions.length > 0 && (
              <div className="filter-panel__group">
                <label className="filter-panel__label" htmlFor="position-filter">
                  Position/Title
                </label>
                <select
                  id="position-filter"
                  value={filters.position || ''}
                  onChange={(e) => handlePositionChange(e.target.value)}
                  className="filter-panel__select"
                >
                  <option value="">All Positions</option>
                  {availablePositions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`filter-panel ${isCollapsed ? 'filter-panel--collapsed' : ''} ${className}`}>
      {/* Header */}
      <div className="filter-panel__header">
        <h3 className="filter-panel__title">Filters</h3>
        <div className="filter-panel__actions">
          {hasActiveFilters() && (
            <button
              className="filter-panel__clear"
              onClick={handleClearFilters}
              type="button"
              aria-label="Clear all filters"
            >
              Clear
            </button>
          )}
          <button
            className="filter-panel__toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            type="button"
            aria-label={isCollapsed ? 'Expand filters' : 'Collapse filters'}
            aria-expanded={!isCollapsed}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`filter-panel__toggle-icon ${isCollapsed ? 'filter-panel__toggle-icon--collapsed' : ''}`}
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="filter-panel__content">
          {renderFilters()}
        </div>
      )}
    </div>
  );
};
