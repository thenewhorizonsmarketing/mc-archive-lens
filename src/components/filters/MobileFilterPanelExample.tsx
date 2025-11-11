/**
 * Mobile Filter Panel Example
 * 
 * Demonstrates the mobile bottom sheet filter panel with swipe gestures,
 * touch-friendly controls, and responsive design.
 */

import React, { useState } from 'react';
import { MobileFilterPanel } from './MobileFilterPanel';
import { FilterConfig } from '../../lib/filters/types';
import { FilterCategory } from './AdvancedFilterPanel';

export const MobileFilterPanelExample: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    type: 'alumni',
    operator: 'AND'
  });

  // Sample categories
  const categories: FilterCategory[] = [
    {
      id: 'graduation-year',
      title: 'Graduation Year',
      field: 'graduationYear',
      type: 'text',
      options: [
        { value: '2023', label: '2023', count: 45 },
        { value: '2022', label: '2022', count: 52 },
        { value: '2021', label: '2021', count: 48 },
        { value: '2020', label: '2020', count: 50 },
        { value: '2019', label: '2019', count: 47 }
      ]
    },
    {
      id: 'degree',
      title: 'Degree Type',
      field: 'degree',
      type: 'text',
      options: [
        { value: 'JD', label: 'Juris Doctor (JD)', count: 180 },
        { value: 'LLM', label: 'Master of Laws (LLM)', count: 35 },
        { value: 'SJD', label: 'Doctor of Juridical Science (SJD)', count: 12 }
      ]
    },
    {
      id: 'practice-area',
      title: 'Practice Area',
      field: 'practiceArea',
      type: 'text',
      options: [
        { value: 'corporate', label: 'Corporate Law', count: 65 },
        { value: 'criminal', label: 'Criminal Law', count: 42 },
        { value: 'family', label: 'Family Law', count: 38 },
        { value: 'intellectual', label: 'Intellectual Property', count: 28 },
        { value: 'environmental', label: 'Environmental Law', count: 22 }
      ]
    },
    {
      id: 'location',
      title: 'Location',
      field: 'location',
      type: 'text',
      options: [
        { value: 'jackson', label: 'Jackson, MS', count: 85 },
        { value: 'memphis', label: 'Memphis, TN', count: 32 },
        { value: 'atlanta', label: 'Atlanta, GA', count: 28 },
        { value: 'nashville', label: 'Nashville, TN', count: 24 },
        { value: 'birmingham', label: 'Birmingham, AL', count: 18 }
      ]
    },
    {
      id: 'honors',
      title: 'Honors & Awards',
      field: 'hasHonors',
      type: 'boolean',
      options: [
        { value: 'true', label: 'Has Honors', count: 78 },
        { value: 'false', label: 'No Honors', count: 149 }
      ]
    }
  ];

  const handleFilterChange = (filters: FilterConfig) => {
    setActiveFilters(filters);
    console.log('Filters changed:', filters);
  };

  const handleClearAll = () => {
    setActiveFilters({
      type: 'alumni',
      operator: 'AND'
    });
    console.log('All filters cleared');
  };

  const totalActiveFilters = 
    (activeFilters.textFilters?.length || 0) +
    (activeFilters.dateFilters?.length || 0) +
    (activeFilters.rangeFilters?.length || 0) +
    (activeFilters.booleanFilters?.length || 0) +
    (activeFilters.customFilters?.length || 0);

  return (
    <div style={{ 
      padding: '20px',
      minHeight: '100vh',
      background: 'var(--mc-blue)',
      color: 'var(--mc-white)'
    }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          marginBottom: '24px',
          color: 'var(--mc-white)'
        }}>
          Mobile Filter Panel Example
        </h1>

        <div style={{
          background: 'var(--mc-blue-light)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '16px',
            color: 'var(--mc-gold)'
          }}>
            Features
          </h2>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            lineHeight: '1.8'
          }}>
            <li>Bottom sheet with swipe-to-close gesture</li>
            <li>Touch-friendly controls (44x44px minimum)</li>
            <li>Collapsible filter categories</li>
            <li>Active filter count badges</li>
            <li>Clear all filters button</li>
            <li>Backdrop click to close</li>
            <li>Escape key support</li>
            <li>Smooth animations</li>
            <li>MC Law blue styling</li>
          </ul>
        </div>

        <div style={{
          background: 'var(--mc-blue-light)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            marginBottom: '16px',
            color: 'var(--mc-gold)'
          }}>
            Current Filters
          </h2>
          
          {totalActiveFilters === 0 ? (
            <p style={{ margin: 0, opacity: 0.7 }}>
              No filters applied
            </p>
          ) : (
            <div>
              <p style={{ marginBottom: '12px' }}>
                <strong>{totalActiveFilters}</strong> filter{totalActiveFilters !== 1 ? 's' : ''} active
              </p>
              
              {activeFilters.textFilters && activeFilters.textFilters.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--mc-gold)' }}>Text Filters:</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                    {activeFilters.textFilters.map((filter, index) => (
                      <li key={index}>
                        {filter.field}: {filter.value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {activeFilters.booleanFilters && activeFilters.booleanFilters.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--mc-gold)' }}>Boolean Filters:</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                    {activeFilters.booleanFilters.map((filter, index) => (
                      <li key={index}>
                        {filter.field}: {filter.value ? 'Yes' : 'No'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '100%',
            minHeight: '56px',
            padding: '16px 24px',
            background: 'var(--mc-gold)',
            border: 'none',
            borderRadius: '12px',
            color: 'var(--mc-blue)',
            fontSize: '1.125rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(201, 151, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 151, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(201, 151, 0, 0.3)';
          }}
        >
          <span>Open Filters</span>
          {totalActiveFilters > 0 && (
            <span style={{
              background: 'var(--mc-blue)',
              color: 'var(--mc-gold)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {totalActiveFilters}
            </span>
          )}
        </button>

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'var(--mc-gold-light)',
          border: '1px solid var(--mc-gold)',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          <strong style={{ color: 'var(--mc-gold)' }}>💡 Tip:</strong> Try swiping down on the drag handle to close the filter panel!
        </div>
      </div>

      <MobileFilterPanel
        contentType="alumni"
        categories={categories}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearAll}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
};

export default MobileFilterPanelExample;
