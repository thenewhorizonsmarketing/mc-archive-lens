/**
 * Export Example Component
 * 
 * Demonstrates the usage of ExportDialog and ExportManager
 * with sample data and filter configurations.
 */

import React, { useState } from 'react';
import { ExportDialog } from './ExportDialog';
import { FilterConfig } from '../../lib/filters/types';

// Sample data for demonstration
const sampleAlumniData = [
  {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    graduationYear: 1980,
    degree: 'JD',
    email: 'john.doe@example.com',
    city: 'Jackson',
    state: 'MS',
    isActive: true,
    lastUpdated: new Date('2024-01-15')
  },
  {
    id: 2,
    firstName: 'Jane',
    lastName: 'Smith',
    graduationYear: 1985,
    degree: 'JD',
    email: 'jane.smith@example.com',
    city: 'Oxford',
    state: 'MS',
    isActive: true,
    lastUpdated: new Date('2024-02-20')
  },
  {
    id: 3,
    firstName: 'Robert',
    lastName: 'Johnson',
    graduationYear: 1990,
    degree: 'LLM',
    email: 'robert.johnson@example.com',
    city: 'Hattiesburg',
    state: 'MS',
    isActive: false,
    lastUpdated: new Date('2023-12-10')
  },
  {
    id: 4,
    firstName: 'Emily',
    lastName: 'Williams',
    graduationYear: 1995,
    degree: 'JD',
    email: 'emily.williams@example.com',
    city: 'Tupelo',
    state: 'MS',
    isActive: true,
    lastUpdated: new Date('2024-03-05')
  },
  {
    id: 5,
    firstName: 'Michael',
    lastName: 'Brown',
    graduationYear: 2000,
    degree: 'JD',
    email: 'michael.brown@example.com',
    city: 'Gulfport',
    state: 'MS',
    isActive: true,
    lastUpdated: new Date('2024-01-28')
  }
];

const sampleFilters: FilterConfig = {
  type: 'alumni',
  operator: 'AND',
  textFilters: [
    {
      field: 'state',
      value: 'MS',
      matchType: 'equals',
      caseSensitive: false
    }
  ],
  rangeFilters: [
    {
      field: 'graduationYear',
      min: 1980,
      max: 2000
    }
  ],
  booleanFilters: [
    {
      field: 'isActive',
      value: true
    }
  ]
};

export const ExportExample: React.FC = () => {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [includeFilters, setIncludeFilters] = useState(true);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: 'var(--mc-blue)', marginBottom: '16px' }}>
          Export Functionality Example
        </h1>
        <p style={{ color: '#666', fontSize: '1.125rem' }}>
          Demonstrates CSV and JSON export with progress tracking and MC Law blue styling.
        </p>
      </div>

      {/* Sample Data Display */}
      <div
        style={{
          background: 'var(--mc-blue)',
          border: '2px solid var(--mc-gold)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}
      >
        <h2 style={{ color: 'var(--mc-white)', marginBottom: '16px' }}>
          Sample Alumni Data ({sampleAlumniData.length} records)
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: 'var(--mc-white)'
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid var(--mc-gold)' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Year</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Degree</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>City</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {sampleAlumniData.map((alumni) => (
                <tr
                  key={alumni.id}
                  style={{ borderBottom: '1px solid rgba(201, 151, 0, 0.2)' }}
                >
                  <td style={{ padding: '12px' }}>
                    {alumni.firstName} {alumni.lastName}
                  </td>
                  <td style={{ padding: '12px' }}>{alumni.graduationYear}</td>
                  <td style={{ padding: '12px' }}>{alumni.degree}</td>
                  <td style={{ padding: '12px' }}>{alumni.city}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        background: alumni.isActive
                          ? 'var(--mc-gold)'
                          : 'rgba(255, 255, 255, 0.2)',
                        color: alumni.isActive ? 'var(--mc-blue)' : 'var(--mc-white)',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      {alumni.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Filters Display */}
      {includeFilters && (
        <div
          style={{
            background: 'rgba(12, 35, 64, 0.1)',
            border: '1px solid var(--mc-gold)',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '32px'
          }}
        >
          <h3 style={{ color: 'var(--mc-blue)', marginBottom: '12px' }}>
            Active Filters
          </h3>
          <ul style={{ color: '#666', lineHeight: 1.8 }}>
            <li>State equals "MS"</li>
            <li>Graduation Year between 1980 and 2000</li>
            <li>Active status is true</li>
          </ul>
        </div>
      )}

      {/* Export Options */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          marginBottom: '32px'
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <input
            type="checkbox"
            checked={includeFilters}
            onChange={(e) => setIncludeFilters(e.target.checked)}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <span style={{ color: '#666' }}>Include filter metadata in export</span>
        </label>
      </div>

      {/* Export Button */}
      <button
        className="filter-button filter-button-primary"
        onClick={() => setIsExportDialogOpen(true)}
        style={{ fontSize: '1.125rem', padding: '16px 32px' }}
      >
        📥 Open Export Dialog
      </button>

      {/* Feature List */}
      <div style={{ marginTop: '48px' }}>
        <h2 style={{ color: 'var(--mc-blue)', marginBottom: '24px' }}>
          Export Features
        </h2>
        
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}
        >
          {[
            {
              icon: '📄',
              title: 'CSV Export',
              description: 'Export data as comma-separated values with customizable headers and delimiters'
            },
            {
              icon: '{ }',
              title: 'JSON Export',
              description: 'Export data as formatted JSON with optional pretty printing'
            },
            {
              icon: '📊',
              title: 'Progress Tracking',
              description: 'Real-time progress indicators with MC Blue styling and percentage display'
            },
            {
              icon: '🎯',
              title: 'Field Selection',
              description: 'Choose which fields to include in the export with select all/none options'
            },
            {
              icon: '✅',
              title: 'Success Feedback',
              description: 'Clear success messages with file details and gold accent styling'
            },
            {
              icon: '🎨',
              title: 'MC Law Styling',
              description: 'Consistent MC Blue and gold theme throughout the export interface'
            }
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'var(--mc-blue)',
                border: '2px solid var(--mc-gold)',
                borderRadius: '12px',
                padding: '24px',
                color: 'var(--mc-white)',
                transition: 'transform 0.2s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
                {feature.icon}
              </div>
              <h3 style={{ marginBottom: '8px', color: 'var(--mc-gold)' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, margin: 0 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Instructions */}
      <div
        style={{
          marginTop: '48px',
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '24px'
        }}
      >
        <h2 style={{ color: 'var(--mc-blue)', marginBottom: '16px' }}>
          Usage Instructions
        </h2>
        <ol style={{ color: '#666', lineHeight: 2, paddingLeft: '24px' }}>
          <li>Click the "Open Export Dialog" button above</li>
          <li>Choose your preferred export format (CSV or JSON)</li>
          <li>Configure format-specific options (headers, pretty print, etc.)</li>
          <li>Select which fields to include in the export</li>
          <li>Optionally provide a custom filename</li>
          <li>Click "Export" to download the file</li>
          <li>Monitor the progress with the MC Blue progress indicator</li>
          <li>View the success message with file details</li>
        </ol>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        data={sampleAlumniData}
        filters={includeFilters ? sampleFilters : undefined}
        contentType="alumni"
      />
    </div>
  );
};

export default ExportExample;
