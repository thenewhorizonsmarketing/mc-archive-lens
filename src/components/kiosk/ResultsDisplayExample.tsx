/**
 * ResultsDisplay Example Component
 * Demonstrates the usage of the ResultsDisplay component with different states
 */

import React, { useState } from 'react';
import { ResultsDisplay } from './ResultsDisplay';
import { SearchResult } from '@/lib/database/types';

// Mock search results for demonstration
const mockResults: SearchResult[] = [
  {
    id: '1',
    type: 'alumni',
    title: 'John Smith',
    subtitle: 'Class of 1985 • Class President',
    thumbnailPath: '/photos/1985/john-smith.jpg',
    relevanceScore: 0.95,
    snippet: 'Graduated with honors, served as class president...',
    data: {
      id: 1,
      full_name: 'John Smith',
      class_year: 1985,
      role: 'Class President',
      composite_image_path: '/photos/1985/composite.jpg',
      portrait_path: '/photos/1985/john-smith.jpg',
      caption: 'Class President',
      tags: 'president,honors',
      sort_key: 'smith_john'
    }
  },
  {
    id: '2',
    type: 'publication',
    title: 'Constitutional Law Review',
    subtitle: 'Law Review • Vol. 45, Issue 3',
    thumbnailPath: '/publications/law-review-45-3.jpg',
    relevanceScore: 0.88,
    snippet: 'An in-depth analysis of constitutional principles...',
    data: {
      id: 2,
      title: 'Constitutional Law Review',
      pub_name: 'Law Review',
      issue_date: '1985-03-15',
      volume_issue: 'Vol. 45, Issue 3',
      pdf_path: '/pdfs/law-review-45-3.pdf',
      thumb_path: '/publications/law-review-45-3.jpg',
      description: 'Constitutional law analysis',
      tags: 'constitutional,law,review'
    }
  },
  {
    id: '3',
    type: 'photo',
    title: 'Graduation Ceremony 1985',
    subtitle: 'Class Photos • 1985',
    thumbnailPath: '/photos/1985/graduation.jpg',
    relevanceScore: 0.82,
    snippet: 'Annual graduation ceremony at the main campus...',
    data: {
      id: 3,
      collection: 'Class Photos',
      title: 'Graduation Ceremony 1985',
      year_or_decade: '1985',
      image_path: '/photos/1985/graduation.jpg',
      caption: 'Graduation ceremony',
      tags: 'graduation,ceremony,1985'
    }
  },
  {
    id: '4',
    type: 'faculty',
    title: 'Dr. Jane Doe',
    subtitle: 'Professor • Constitutional Law',
    thumbnailPath: '/faculty/jane-doe.jpg',
    relevanceScore: 0.75,
    snippet: 'Professor of Constitutional Law, specializing in...',
    data: {
      id: 4,
      full_name: 'Dr. Jane Doe',
      title: 'Professor',
      department: 'Constitutional Law',
      email: 'jane.doe@example.edu',
      phone: '555-0123',
      headshot_path: '/faculty/jane-doe.jpg'
    }
  }
];

export const ResultsDisplayExample: React.FC = () => {
  const [state, setState] = useState<'loading' | 'results' | 'empty' | 'error'>('results');
  const [results, setResults] = useState<SearchResult[]>(mockResults);

  const handleResultSelect = (result: SearchResult) => {
    console.log('Selected result:', result);
    alert(`Selected: ${result.title} (${result.type})`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>ResultsDisplay Component Examples</h1>
      
      {/* State Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setState('loading')}
          style={{
            padding: '10px 20px',
            background: state === 'loading' ? '#0C2340' : '#e5e7eb',
            color: state === 'loading' ? 'white' : 'black',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Loading State
        </button>
        <button
          onClick={() => {
            setState('results');
            setResults(mockResults);
          }}
          style={{
            padding: '10px 20px',
            background: state === 'results' ? '#0C2340' : '#e5e7eb',
            color: state === 'results' ? 'white' : 'black',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Results State (4 items)
        </button>
        <button
          onClick={() => {
            setState('results');
            setResults([mockResults[0]]);
          }}
          style={{
            padding: '10px 20px',
            background: '#e5e7eb',
            color: 'black',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Single Result
        </button>
        <button
          onClick={() => setState('empty')}
          style={{
            padding: '10px 20px',
            background: state === 'empty' ? '#0C2340' : '#e5e7eb',
            color: state === 'empty' ? 'white' : 'black',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Empty State
        </button>
        <button
          onClick={() => setState('error')}
          style={{
            padding: '10px 20px',
            background: state === 'error' ? '#0C2340' : '#e5e7eb',
            color: state === 'error' ? 'white' : 'black',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Error State
        </button>
      </div>

      {/* Component Display */}
      <div style={{ 
        border: '2px solid #e5e7eb', 
        borderRadius: '8px', 
        height: '600px',
        overflow: 'hidden'
      }}>
        <ResultsDisplay
          results={state === 'results' ? results : []}
          isLoading={state === 'loading'}
          error={state === 'error' ? 'Failed to load search results. Please try again.' : undefined}
          onResultSelect={handleResultSelect}
          highlightTerms={['law', 'constitutional']}
          searchQuery="constitutional law"
        />
      </div>

      {/* Documentation */}
      <div style={{ marginTop: '40px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
        <h2 style={{ marginTop: 0 }}>Component Features</h2>
        <ul>
          <li><strong>Loading State:</strong> Displays skeleton loaders and loading indicator</li>
          <li><strong>Results State:</strong> Shows scrollable list of search results with touch-friendly cards</li>
          <li><strong>Empty State:</strong> Provides helpful suggestions when no results are found</li>
          <li><strong>Error State:</strong> Shows error message with retry button</li>
          <li><strong>Touch Optimized:</strong> Minimum 80px card height, visual feedback on tap (50ms)</li>
          <li><strong>Navigation:</strong> Smooth transition to detail pages (300ms)</li>
          <li><strong>Accessibility:</strong> ARIA labels, keyboard navigation, screen reader support</li>
        </ul>

        <h3>Props</h3>
        <pre style={{ background: 'white', padding: '15px', borderRadius: '6px', overflow: 'auto' }}>
{`interface ResultsDisplayProps {
  results: SearchResult[];
  isLoading: boolean;
  error?: string;
  onResultSelect?: (result: SearchResult) => void;
  highlightTerms?: string[];
  className?: string;
  searchQuery?: string;
}`}
        </pre>
      </div>
    </div>
  );
};

export default ResultsDisplayExample;
