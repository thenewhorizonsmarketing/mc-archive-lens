/**
 * Advanced Filter Integration Component
 * 
 * Bridges the advanced filter system with existing content pages.
 * Provides backward compatibility while enabling advanced filtering features.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FilterConfig } from '@/lib/filters/types';
import { SearchFilters } from '@/lib/database/types';
import { AdvancedFilterPanel, FilterCategory } from './AdvancedFilterPanel';
import { FilterPanel } from '@/components/content/FilterPanel';
import { useSearch } from '@/lib/search-context';

export interface AdvancedFilterIntegrationProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableYears?: number[];
  availableDepartments?: string[];
  availableCollections?: string[];
  availablePublicationTypes?: string[];
  availableEventTypes?: string[];
  availablePositions?: string[];
  enableAdvancedFilters?: boolean;
  className?: string;
}

export const AdvancedFilterIntegration: React.FC<AdvancedFilterIntegrationProps> = ({
  contentType,
  filters,
  onFiltersChange,
  availableYears = [],
  availableDepartments = [],
  availableCollections = [],
  availablePublicationTypes = [],
  availableEventTypes = [],
  availablePositions = [],
  enableAdvancedFilters = false,
  className = ''
}) => {
  const { filterProcessor, estimateFilterResults } = useSearch();
  const [resultCounts, setResultCounts] = useState<Map<string, number>>(new Map());

  // Convert SearchFilters to FilterConfig
  const convertToFilterConfig = useCallback((searchFilters: SearchFilters): FilterConfig => {
    const config: FilterConfig = {
      type: contentType,
      operator: 'AND',
      textFilters: [],
      dateFilters: [],
      rangeFilters: [],
      booleanFilters: []
    };

    // Convert year range to range filter
    if (searchFilters.yearRange) {
      config.rangeFilters!.push({
        field: 'class_year',
        min: searchFilters.yearRange.start,
        max: searchFilters.yearRange.end
      });
    }

    // Convert year to text filter
    if (searchFilters.year) {
      config.textFilters!.push({
        field: 'year',
        value: String(searchFilters.year),
        matchType: 'equals',
        caseSensitive: false
      });
    }

    // Convert department to text filter
    if (searchFilters.department) {
      config.textFilters!.push({
        field: 'department',
        value: searchFilters.department,
        matchType: 'equals',
        caseSensitive: false
      });
    }

    // Convert publication type to text filter
    if (searchFilters.publicationType) {
      config.textFilters!.push({
        field: 'pub_name',
        value: searchFilters.publicationType,
        matchType: 'equals',
        caseSensitive: false
      });
    }

    // Convert event type to text filter
    if (searchFilters.eventType) {
      config.textFilters!.push({
        field: 'event_type',
        value: searchFilters.eventType,
        matchType: 'equals',
        caseSensitive: false
      });
    }

    // Convert position to text filter
    if (searchFilters.position) {
      config.textFilters!.push({
        field: 'title',
        value: searchFilters.position,
        matchType: 'equals',
        caseSensitive: false
      });
    }

    return config;
  }, [contentType]);

  // Convert FilterConfig back to SearchFilters
  const convertToSearchFilters = useCallback((config: FilterConfig): SearchFilters => {
    const searchFilters: SearchFilters = {
      type: contentType
    };

    // Convert range filters back to year range
    const yearRangeFilter = config.rangeFilters?.find(f => f.field === 'class_year');
    if (yearRangeFilter) {
      searchFilters.yearRange = {
        start: yearRangeFilter.min,
        end: yearRangeFilter.max
      };
    }

    // Convert text filters back to search filters
    config.textFilters?.forEach(filter => {
      if (filter.field === 'year') {
        searchFilters.year = parseInt(filter.value);
      } else if (filter.field === 'department') {
        searchFilters.department = filter.value;
      } else if (filter.field === 'pub_name') {
        searchFilters.publicationType = filter.value;
      } else if (filter.field === 'event_type') {
        searchFilters.eventType = filter.value;
      } else if (filter.field === 'title') {
        searchFilters.position = filter.value;
      }
    });

    return searchFilters;
  }, [contentType]);

  // Build filter categories for advanced panel
  const filterCategories = useMemo((): FilterCategory[] => {
    const categories: FilterCategory[] = [];

    // Year filters
    if (availableYears.length > 0) {
      categories.push({
        id: 'year',
        title: 'Year',
        field: contentType === 'alumni' ? 'class_year' : 'year',
        type: 'text',
        options: availableYears.map(year => ({
          value: String(year),
          label: String(year),
          count: resultCounts.get(`year-${year}`)
        }))
      });
    }

    // Department filters
    if (availableDepartments.length > 0) {
      categories.push({
        id: 'department',
        title: 'Department',
        field: 'department',
        type: 'text',
        options: availableDepartments.map(dept => ({
          value: dept,
          label: dept,
          count: resultCounts.get(`department-${dept}`)
        }))
      });
    }

    // Collection filters (for photos)
    if (availableCollections.length > 0) {
      categories.push({
        id: 'collection',
        title: 'Collection',
        field: 'collection',
        type: 'text',
        options: availableCollections.map(collection => ({
          value: collection,
          label: collection,
          count: resultCounts.get(`collection-${collection}`)
        }))
      });
    }

    // Publication type filters
    if (availablePublicationTypes.length > 0) {
      categories.push({
        id: 'publicationType',
        title: 'Publication Type',
        field: 'pub_name',
        type: 'text',
        options: availablePublicationTypes.map(type => ({
          value: type,
          label: type,
          count: resultCounts.get(`publicationType-${type}`)
        }))
      });
    }

    // Event type filters (for photos)
    if (availableEventTypes.length > 0) {
      categories.push({
        id: 'eventType',
        title: 'Event Type',
        field: 'event_type',
        type: 'text',
        options: availableEventTypes.map(type => ({
          value: type,
          label: type,
          count: resultCounts.get(`eventType-${type}`)
        }))
      });
    }

    // Position filters (for faculty)
    if (availablePositions.length > 0) {
      categories.push({
        id: 'position',
        title: 'Position/Title',
        field: 'title',
        type: 'text',
        options: availablePositions.map(position => ({
          value: position,
          label: position,
          count: resultCounts.get(`position-${position}`)
        }))
      });
    }

    return categories;
  }, [
    contentType,
    availableYears,
    availableDepartments,
    availableCollections,
    availablePublicationTypes,
    availableEventTypes,
    availablePositions,
    resultCounts
  ]);

  // Handle advanced filter changes
  const handleAdvancedFilterChange = useCallback((config: FilterConfig) => {
    const searchFilters = convertToSearchFilters(config);
    onFiltersChange(searchFilters);
  }, [convertToSearchFilters, onFiltersChange]);

  // Handle clear all filters
  const handleClearAll = useCallback(() => {
    onFiltersChange({ type: contentType });
  }, [contentType, onFiltersChange]);

  // Estimate result counts for filter options (debounced)
  useEffect(() => {
    if (!enableAdvancedFilters || !filterProcessor || !estimateFilterResults) {
      return;
    }

    const updateResultCounts = async () => {
      const newCounts = new Map<string, number>();

      // This is a simplified version - in production, you'd want to
      // estimate counts for each filter option individually
      const currentConfig = convertToFilterConfig(filters);
      
      try {
        const totalCount = await estimateFilterResults(currentConfig);
        // For now, just set a placeholder count
        // In a full implementation, you'd query each filter option separately
        filterCategories.forEach(category => {
          category.options.forEach(option => {
            newCounts.set(`${category.id}-${option.value}`, Math.floor(totalCount / category.options.length));
          });
        });
        
        setResultCounts(newCounts);
      } catch (error) {
        console.error('Failed to estimate result counts:', error);
      }
    };

    const timeoutId = setTimeout(updateResultCounts, 500);
    return () => clearTimeout(timeoutId);
  }, [
    enableAdvancedFilters,
    filterProcessor,
    estimateFilterResults,
    filters,
    filterCategories,
    convertToFilterConfig
  ]);

  // Render appropriate filter panel based on enableAdvancedFilters flag
  if (enableAdvancedFilters) {
    const activeFilters = convertToFilterConfig(filters);

    return (
      <AdvancedFilterPanel
        contentType={contentType}
        categories={filterCategories}
        activeFilters={activeFilters}
        onFilterChange={handleAdvancedFilterChange}
        onClearAll={handleClearAll}
        className={className}
      />
    );
  }

  // Fall back to standard filter panel
  return (
    <FilterPanel
      contentType={contentType}
      filters={filters}
      onFiltersChange={onFiltersChange}
      availableYears={availableYears}
      availableDepartments={availableDepartments}
      availableCollections={availableCollections}
      availablePublicationTypes={availablePublicationTypes}
      availableEventTypes={availableEventTypes}
      availablePositions={availablePositions}
      className={className}
    />
  );
};

export default AdvancedFilterIntegration;
