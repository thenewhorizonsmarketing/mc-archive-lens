import React, { useState } from 'react';
import VisualFilterBuilder from './VisualFilterBuilder';
import { FilterNode } from '../../lib/filters/types';
import '../../styles/advanced-filter.css';

/**
 * Example component demonstrating the Visual Filter Builder
 * 
 * This component shows how to:
 * - Initialize the visual filter builder
 * - Handle query changes
 * - Handle filter tree changes
 * - Display generated SQL queries
 * - Validate query structure
 */
export const VisualFilterBuilderExample: React.FC = () => {
  const [generatedSQL, setGeneratedSQL] = useState<string>('');
  const [queryParams, setQueryParams] = useState<any[]>([]);
  const [filterTree, setFilterTree] = useState<FilterNode | null>(null);
  const [validationStatus, setValidationStatus] = useState<string>('');

  const handleQueryChange = (sql: string, params: any[]) => {
    setGeneratedSQL(sql);
    setQueryParams(params);
    validateQuery(sql);
  };

  const handleFilterChange = (rootNode: FilterNode) => {
    setFilterTree(rootNode);
    
    // Count nodes for validation
    const nodeCount = countNodes(rootNode);
    setValidationStatus(`Filter tree contains ${nodeCount} nodes`);
  };

  const validateQuery = (sql: string) => {
    // Basic SQL validation
    if (!sql || sql.trim() === '') {
      setValidationStatus('❌ No query generated');
      return;
    }

    if (!sql.includes('SELECT')) {
      setValidationStatus('❌ Invalid SQL: Missing SELECT');
      return;
    }

    if (!sql.includes('FROM')) {
      setValidationStatus('❌ Invalid SQL: Missing FROM');
      return;
    }

    if (!sql.includes('WHERE')) {
      setValidationStatus('⚠️ Warning: No WHERE clause');
      return;
    }

    setValidationStatus('✅ Valid SQL query');
  };

  const countNodes = (node: FilterNode): number => {
    let count = 1;
    if (node.children) {
      node.children.forEach(child => {
        count += countNodes(child);
      });
    }
    return count;
  };

  const exportFilterTree = () => {
    if (filterTree) {
      const exportData = {
        filterTree,
        generatedSQL,
        queryParams,
        timestamp: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visual-filter-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="visual-filter-builder-example">
      <div className="visual-filter-builder-example__header">
        <h1 className="visual-filter-builder-example__title">
          Visual Filter Builder Example
        </h1>
        <p className="visual-filter-builder-example__description">
          Build complex database queries visually using drag-and-drop. Combine filters
          with AND/OR operators and organize them into groups.
        </p>
      </div>

      <div className="visual-filter-builder-example__content">
        <VisualFilterBuilder
          contentType="alumni"
          onQueryChange={handleQueryChange}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="visual-filter-builder-example__output">
        <div className="visual-filter-builder-example__section">
          <h2 className="visual-filter-builder-example__section-title">
            Query Validation
          </h2>
          <div className="visual-filter-builder-example__validation">
            <span className="visual-filter-builder-example__validation-status">
              {validationStatus || 'No query generated yet'}
            </span>
          </div>
        </div>

        {generatedSQL && (
          <div className="visual-filter-builder-example__section">
            <h2 className="visual-filter-builder-example__section-title">
              Generated SQL
            </h2>
            <pre className="visual-filter-builder-example__code">
              {generatedSQL}
            </pre>
          </div>
        )}

        {queryParams.length > 0 && (
          <div className="visual-filter-builder-example__section">
            <h2 className="visual-filter-builder-example__section-title">
              Query Parameters
            </h2>
            <pre className="visual-filter-builder-example__code">
              {JSON.stringify(queryParams, null, 2)}
            </pre>
          </div>
        )}

        {filterTree && (
          <div className="visual-filter-builder-example__section">
            <div className="visual-filter-builder-example__section-header">
              <h2 className="visual-filter-builder-example__section-title">
                Filter Tree Structure
              </h2>
              <button
                type="button"
                className="visual-filter-builder-example__export-btn"
                onClick={exportFilterTree}
              >
                Export Filter Tree
              </button>
            </div>
            <pre className="visual-filter-builder-example__code">
              {JSON.stringify(filterTree, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="visual-filter-builder-example__instructions">
        <h2 className="visual-filter-builder-example__section-title">
          How to Use
        </h2>
        <ol className="visual-filter-builder-example__list">
          <li>Click "+ Filter" to add a new filter node</li>
          <li>Click "+ AND" or "+ OR" to add logical operators</li>
          <li>Click "+ Group" to create a group container</li>
          <li>Drag and drop nodes to reorganize the query structure</li>
          <li>Click the expand/collapse arrows to show/hide node contents</li>
          <li>Click the edit button (✎) on filter nodes to configure them</li>
          <li>Click the remove button (✕) to delete nodes</li>
          <li>Toggle "Show Query Preview" to see the generated SQL</li>
          <li>Click "Export" to download the query as JSON</li>
        </ol>
      </div>

      <div className="visual-filter-builder-example__features">
        <h2 className="visual-filter-builder-example__section-title">
          Features
        </h2>
        <ul className="visual-filter-builder-example__list">
          <li>✅ Drag-and-drop interface for building queries</li>
          <li>✅ AND/OR logical operators with nesting support</li>
          <li>✅ Group nodes for organizing complex queries</li>
          <li>✅ Real-time SQL query generation</li>
          <li>✅ Query validation and structure checking</li>
          <li>✅ Export queries to JSON format</li>
          <li>✅ MC Law blue styling with gold accents</li>
          <li>✅ Keyboard accessible controls</li>
          <li>✅ Visual feedback for drop targets</li>
          <li>✅ Collapsible nodes for managing complexity</li>
        </ul>
      </div>
    </div>
  );
};

export default VisualFilterBuilderExample;
