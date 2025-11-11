import React, { useState, useCallback, useRef } from 'react';
import { FilterNode, FilterOperator } from '../../lib/filters/types';
import { AdvancedQueryBuilder } from '../../lib/filters/AdvancedQueryBuilder';
import FilterNodeComponent from './builder/FilterNode';
import OperatorNodeComponent from './builder/OperatorNode';
import GroupNodeComponent from './builder/GroupNode';
import '../../styles/advanced-filter.css';

export interface VisualFilterBuilderProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onQueryChange?: (sql: string, params: any[]) => void;
  onFilterChange?: (rootNode: FilterNode) => void;
  initialNode?: FilterNode;
}

export const VisualFilterBuilder: React.FC<VisualFilterBuilderProps> = ({
  contentType,
  onQueryChange,
  onFilterChange,
  initialNode,
}) => {
  const [rootNode, setRootNode] = useState<FilterNode>(
    initialNode || {
      id: 'root',
      type: 'operator',
      operator: 'AND',
      children: [],
    }
  );

  const [draggedNode, setDraggedNode] = useState<FilterNode | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [queryPreview, setQueryPreview] = useState<{ sql: string; params: any[] } | null>(null);
  const [showQueryPreview, setShowQueryPreview] = useState(false);

  const queryBuilder = useRef(new AdvancedQueryBuilder());

  // Generate unique ID for new nodes
  const generateId = useCallback(() => {
    return `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  // Update query preview
  const updateQueryPreview = useCallback((node: FilterNode) => {
    try {
      const result = queryBuilder.current.buildQueryFromNodes(node, contentType);
      const optimized = queryBuilder.current.optimizeQuery(result);
      setQueryPreview(optimized);
      
      if (onQueryChange) {
        onQueryChange(optimized.sql, optimized.params);
      }
    } catch (error) {
      console.error('Failed to generate query:', error);
      setQueryPreview(null);
    }
  }, [contentType, onQueryChange]);

  // Handle node updates
  const handleNodeUpdate = useCallback((updatedNode: FilterNode) => {
    setRootNode(updatedNode);
    updateQueryPreview(updatedNode);
    
    if (onFilterChange) {
      onFilterChange(updatedNode);
    }
  }, [updateQueryPreview, onFilterChange]);

  // Add new filter node
  const addFilterNode = useCallback(() => {
    const newFilter: FilterNode = {
      id: generateId(),
      type: 'filter',
      filter: {
        type: contentType,
        operator: 'AND',
        textFilters: [],
      },
    };

    const updatedRoot = {
      ...rootNode,
      children: [...(rootNode.children || []), newFilter],
    };

    handleNodeUpdate(updatedRoot);
  }, [rootNode, contentType, generateId, handleNodeUpdate]);

  // Add new operator node
  const addOperatorNode = useCallback((operator: FilterOperator) => {
    const newOperator: FilterNode = {
      id: generateId(),
      type: 'operator',
      operator,
      children: [],
    };

    const updatedRoot = {
      ...rootNode,
      children: [...(rootNode.children || []), newOperator],
    };

    handleNodeUpdate(updatedRoot);
  }, [rootNode, generateId, handleNodeUpdate]);

  // Add new group node
  const addGroupNode = useCallback(() => {
    const newGroup: FilterNode = {
      id: generateId(),
      type: 'group',
      children: [],
    };

    const updatedRoot = {
      ...rootNode,
      children: [...(rootNode.children || []), newGroup],
    };

    handleNodeUpdate(updatedRoot);
  }, [rootNode, generateId, handleNodeUpdate]);

  // Remove node by ID
  const removeNode = useCallback((nodeId: string) => {
    const removeFromNode = (node: FilterNode): FilterNode | null => {
      if (node.id === nodeId) {
        return null;
      }

      if (node.children) {
        const filteredChildren = node.children
          .map(removeFromNode)
          .filter((child): child is FilterNode => child !== null);

        return {
          ...node,
          children: filteredChildren,
        };
      }

      return node;
    };

    const updatedRoot = removeFromNode(rootNode);
    if (updatedRoot) {
      handleNodeUpdate(updatedRoot);
    }
  }, [rootNode, handleNodeUpdate]);

  // Update node by ID
  const updateNode = useCallback((nodeId: string, updates: Partial<FilterNode>) => {
    const updateInNode = (node: FilterNode): FilterNode => {
      if (node.id === nodeId) {
        return { ...node, ...updates };
      }

      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateInNode),
        };
      }

      return node;
    };

    const updatedRoot = updateInNode(rootNode);
    handleNodeUpdate(updatedRoot);
  }, [rootNode, handleNodeUpdate]);

  // Drag and drop handlers
  const handleDragStart = useCallback((node: FilterNode) => {
    setDraggedNode(node);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTarget(targetId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedNode || draggedNode.id === targetId) {
      return;
    }

    // Remove dragged node from its current position
    const removeFromNode = (node: FilterNode): FilterNode | null => {
      if (node.id === draggedNode.id) {
        return null;
      }

      if (node.children) {
        const filteredChildren = node.children
          .map(removeFromNode)
          .filter((child): child is FilterNode => child !== null);

        return {
          ...node,
          children: filteredChildren,
        };
      }

      return node;
    };

    // Add dragged node to target
    const addToNode = (node: FilterNode): FilterNode => {
      if (node.id === targetId) {
        return {
          ...node,
          children: [...(node.children || []), draggedNode],
        };
      }

      if (node.children) {
        return {
          ...node,
          children: node.children.map(addToNode),
        };
      }

      return node;
    };

    let updatedRoot = removeFromNode(rootNode);
    if (updatedRoot) {
      updatedRoot = addToNode(updatedRoot);
      handleNodeUpdate(updatedRoot);
    }

    setDraggedNode(null);
  }, [draggedNode, rootNode, handleNodeUpdate]);

  // Clear all filters
  const clearAll = useCallback(() => {
    const clearedRoot: FilterNode = {
      id: 'root',
      type: 'operator',
      operator: 'AND',
      children: [],
    };
    handleNodeUpdate(clearedRoot);
  }, [handleNodeUpdate]);

  // Export query
  const exportQuery = useCallback(() => {
    if (queryPreview) {
      const exportData = {
        sql: queryPreview.sql,
        params: queryPreview.params,
        filterTree: rootNode,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `filter-query-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [queryPreview, rootNode]);

  // Render node recursively
  const renderNode = (node: FilterNode, depth: number = 0): React.ReactNode => {
    const isDropTarget = dropTarget === node.id;

    switch (node.type) {
      case 'filter':
        return (
          <FilterNodeComponent
            key={node.id}
            node={node}
            depth={depth}
            isDropTarget={isDropTarget}
            onUpdate={(updates) => updateNode(node.id, updates)}
            onRemove={() => removeNode(node.id)}
            onDragStart={() => handleDragStart(node)}
            onDragOver={(e) => handleDragOver(e, node.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node.id)}
          />
        );

      case 'operator':
        return (
          <OperatorNodeComponent
            key={node.id}
            node={node}
            depth={depth}
            isDropTarget={isDropTarget}
            onUpdate={(updates) => updateNode(node.id, updates)}
            onRemove={() => removeNode(node.id)}
            onDragStart={() => handleDragStart(node)}
            onDragOver={(e) => handleDragOver(e, node.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node.id)}
          >
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </OperatorNodeComponent>
        );

      case 'group':
        return (
          <GroupNodeComponent
            key={node.id}
            node={node}
            depth={depth}
            isDropTarget={isDropTarget}
            onUpdate={(updates) => updateNode(node.id, updates)}
            onRemove={() => removeNode(node.id)}
            onDragStart={() => handleDragStart(node)}
            onDragOver={(e) => handleDragOver(e, node.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node.id)}
          >
            {node.children?.map((child) => renderNode(child, depth + 1))}
          </GroupNodeComponent>
        );

      default:
        return null;
    }
  };

  return (
    <div className="visual-filter-builder">
      <div className="visual-filter-builder__header">
        <h2 className="visual-filter-builder__title">Visual Query Builder</h2>
        <div className="visual-filter-builder__actions">
          <button
            type="button"
            className="visual-filter-builder__action-btn"
            onClick={addFilterNode}
            aria-label="Add filter"
          >
            + Filter
          </button>
          <button
            type="button"
            className="visual-filter-builder__action-btn"
            onClick={() => addOperatorNode('AND')}
            aria-label="Add AND operator"
          >
            + AND
          </button>
          <button
            type="button"
            className="visual-filter-builder__action-btn"
            onClick={() => addOperatorNode('OR')}
            aria-label="Add OR operator"
          >
            + OR
          </button>
          <button
            type="button"
            className="visual-filter-builder__action-btn"
            onClick={addGroupNode}
            aria-label="Add group"
          >
            + Group
          </button>
          <button
            type="button"
            className="visual-filter-builder__action-btn visual-filter-builder__action-btn--secondary"
            onClick={clearAll}
            aria-label="Clear all"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="visual-filter-builder__canvas">
        {rootNode.children && rootNode.children.length > 0 ? (
          renderNode(rootNode)
        ) : (
          <div className="visual-filter-builder__empty">
            <p className="visual-filter-builder__empty-text">
              No filters added yet. Click the buttons above to start building your query.
            </p>
          </div>
        )}
      </div>

      <div className="visual-filter-builder__footer">
        <button
          type="button"
          className="visual-filter-builder__preview-toggle"
          onClick={() => setShowQueryPreview(!showQueryPreview)}
          aria-expanded={showQueryPreview}
        >
          {showQueryPreview ? 'Hide' : 'Show'} Query Preview
        </button>
        
        {showQueryPreview && queryPreview && (
          <div className="visual-filter-builder__query-preview">
            <div className="visual-filter-builder__query-header">
              <h3 className="visual-filter-builder__query-title">Generated SQL Query</h3>
              <button
                type="button"
                className="visual-filter-builder__export-btn"
                onClick={exportQuery}
                aria-label="Export query"
              >
                Export
              </button>
            </div>
            <pre className="visual-filter-builder__query-sql">
              {queryPreview.sql}
            </pre>
            {queryPreview.params.length > 0 && (
              <div className="visual-filter-builder__query-params">
                <h4 className="visual-filter-builder__params-title">Parameters:</h4>
                <pre className="visual-filter-builder__params-list">
                  {JSON.stringify(queryPreview.params, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualFilterBuilder;
