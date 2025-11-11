/**
 * Mobile Visual Filter Builder Example
 * 
 * Demonstrates the mobile-optimized visual query builder with
 * tap-based interactions, touch-friendly controls, and simplified UI.
 */

import React, { useState } from 'react';
import { MobileVisualFilterBuilder } from './MobileVisualFilterBuilder';
import { FilterNode } from '../../lib/filters/types';

export const MobileVisualFilterBuilderExample: React.FC = () => {
  const [generatedQuery, setGeneratedQuery] = useState<{
    sql: string;
    params: any[];
  } | null>(null);

  const handleQueryChange = (sql: string, params: any[]) => {
    setGeneratedQuery({ sql, params });
    console.log('Query generated:', { sql, params });
  };

  const handleFilterChange = (rootNode: FilterNode) => {
    console.log('Filter tree updated:', rootNode);
  };

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
          Mobile Visual Filter Builder
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
            Mobile-Optimized Features
          </h2>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            lineHeight: '1.8'
          }}>
            <li>Tap-based interactions (no drag-and-drop)</li>
            <li>Touch-friendly controls (44x44px minimum)</li>
            <li>Floating action button for adding nodes</li>
            <li>Up/down arrows to reorder nodes</li>
            <li>Collapsible node details</li>
            <li>Simplified operator selection</li>
            <li>Query preview with syntax highlighting</li>
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
            How to Use
          </h2>
          <ol style={{ 
            margin: 0, 
            paddingLeft: '20px',
            lineHeight: '1.8'
          }}>
            <li>Tap the <strong>+</strong> button to add filters, operators, or groups</li>
            <li>Tap the <strong>▼</strong> button to expand/collapse node details</li>
            <li>Use <strong>↑↓</strong> arrows to reorder nodes</li>
            <li>Tap <strong>✕</strong> to remove a node</li>
            <li>Toggle between AND/OR operators by tapping the buttons</li>
            <li>View the generated SQL query at the bottom</li>
          </ol>
        </div>

        {generatedQuery && (
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
              Generated Query
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: 'var(--mc-gold)' }}>SQL:</strong>
              <pre style={{
                background: 'var(--mc-blue-dark)',
                border: '1px solid var(--mc-gold-light)',
                borderRadius: '6px',
                padding: '12px',
                marginTop: '8px',
                fontSize: '0.8125rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {generatedQuery.sql}
              </pre>
            </div>
            
            {generatedQuery.params.length > 0 && (
              <div>
                <strong style={{ color: 'var(--mc-gold)' }}>Parameters:</strong>
                <pre style={{
                  background: 'var(--mc-blue-dark)',
                  border: '1px solid var(--mc-gold-light)',
                  borderRadius: '6px',
                  padding: '12px',
                  marginTop: '8px',
                  fontSize: '0.8125rem',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {JSON.stringify(generatedQuery.params, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: 'var(--mc-gold-light)',
          border: '1px solid var(--mc-gold)',
          borderRadius: '8px',
          fontSize: '0.875rem'
        }}>
          <strong style={{ color: 'var(--mc-gold)' }}>💡 Tip:</strong> This mobile version replaces drag-and-drop with tap-based controls for better touch interaction!
        </div>

        <MobileVisualFilterBuilder
          contentType="alumni"
          onQueryChange={handleQueryChange}
          onFilterChange={handleFilterChange}
        />
      </div>
    </div>
  );
};

export default MobileVisualFilterBuilderExample;
