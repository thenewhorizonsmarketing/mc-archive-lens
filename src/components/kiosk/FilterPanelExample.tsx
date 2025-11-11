// FilterPanel Example Component
// Demonstrates the FilterPanel component usage
import React, { useState } from 'react';
import { FilterPanel, AvailableFilters } from './FilterPanel';
import { FilterOptions } from '@/lib/database/filter-processor';

/**
 * FilterPanelExample Component
 * 
 * Example usage of the FilterPanel component showing:
 * - Filter state management
 * - Available filter options
 * - Filter change handling
 * - Active filter display
 */
export const FilterPanelExample: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({});

  // Define available filters
  const availableFilters: AvailableFilters = {
    categories: ['alumni', 'publication', 'photo', 'faculty'],
    decades: ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'],
    publicationTypes: ['Law Review', 'Amicus', 'Legal Eye', 'Directory'],
    departments: [
      'Constitutional Law',
      'Criminal Law',
      'Corporate Law',
      'Environmental Law',
      'International Law'
    ]
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
  };

  // Get active filter summary
  const getFilterSummary = (): string[] => {
    const summary: string[] = [];
    
    if (filters.type) {
      summary.push(`Type: ${filters.type}`);
    }
    if (filters.decade) {
      summary.push(`Decade: ${filters.decade}`);
    }
    if (filters.publicationType) {
      summary.push(`Publication: ${filters.publicationType}`);
    }
    if (filters.department) {
      summary.push(`Department: ${filters.department}`);
    }
    if (filters.yearRange) {
      summary.push(`Years: ${filters.yearRange.start}-${filters.yearRange.end}`);
    }
    
    return summary;
  };

  const filterSummary = getFilterSummary();

  return (
    <div className="filter-panel-example min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">FilterPanel Component Example</h1>
        <p className="text-muted-foreground mb-8">
          Touch-optimized filter controls for kiosk search interface
        </p>

        {/* FilterPanel Component */}
        <div className="border rounded-lg overflow-hidden mb-8">
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            availableFilters={availableFilters}
          />
        </div>

        {/* Active Filters Display */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Active Filters</h2>
          
          {filterSummary.length > 0 ? (
            <div className="space-y-2">
              {filterSummary.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                >
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No filters active</p>
          )}

          {/* Raw Filter Object */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Filter Object (JSON)
            </h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(filters, null, 2)}
            </pre>
          </div>
        </div>

        {/* Feature List */}
        <div className="mt-8 bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Touch-friendly toggle buttons (44x44px minimum)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Collapsible panel with smooth expand/collapse animation (200-300ms)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Category filters (Alumni, Publications, Photos, Faculty)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Decade/year range filter controls</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Publication type filters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Department filters for faculty</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Active filter count badge</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Clear all filters functionality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Visual feedback on filter toggles (100ms)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✓</span>
              <span>Proper spacing between filter options (8px minimum)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FilterPanelExample;
