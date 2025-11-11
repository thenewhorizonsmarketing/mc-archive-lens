/**
 * Mobile Visual Filter Builder Component
 * 
 * Simplified visual query builder optimized for mobile devices.
 * Uses tap instead of drag-and-drop, with touch-friendly controls
 * and a streamlined interface for small screens.
 */

import React, { useState, useCallback, useRef } from 'react';
import { FilterNode, FilterOperator } from '../../lib/filters/types';
import { AdvancedQueryBuilder } from '../../lib/filters/AdvancedQueryBuilder';
import '../../styles/advanced-filter.css';
import './MobileVisualFilterBuilder.css';

export interface MobileVisualFilterBuilderProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onQueryChange?: (sql: string, params: any[]) => void;
  onFilterChange?: (rootNode: FilterNode) => void;
  initialNode?: FilterNode;
}

interface MobileFilterNodeProps {
  node: FilterNode;
  depth: number;
  onUpdate: (updates: Partial<FilterNode>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const MobileFilterNode: React.FC<MobileFilterNodeProps> = ({
  node,
  depth,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div 
      className="mobile-filter-node"
      style={{ marginLeft: `${depth * 16}px` }}
    >
      <div className="mobile-filter-node__header">
        <button
          className="mobile-filter-node__expand"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? '▼' : '▶'}
        </button>

        <div className="mobile-filter-node__type">
          {node.type === 'filter' && '🔍 Filter'}
          {node.type === 'operator' && `⚡ ${node.operator}`}
          {node.type === 'group' && '📁 Group'}
        </div>

        <div className="mobile-filter-node__actions">
          {canMoveUp && onMoveUp && (
            <button
              className="mobile-filter-node__action"
              onClick={onMoveUp}
              aria-label="Move up"
            >
              ↑
            </button>
          )}
          {canMoveDown && onMoveDown && (
            <button
              className="mobile-filter-node__action"
              onClick={onMoveDown}
              aria-label="Move down"
            >
              ↓
            </button>
          )}
          <button
            className="mobile-filter-node__action mobile-filter-node__action--remove"
            onClick={onRemove}
            aria-label="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mobile-filter-node__content">
          {node.type === 'operator' && (
            <div className="mobile-filter-node__operator-controls">
              <label className="mobile-filter-node__label">
                Operator:
              </label>
              <div className="mobile-filter-node__operator-buttons">
                <button
                  className={`mobile-filter-node__operator-btn ${
                    node.operator === 'AND' ? 'active' : ''
                  }`}
                  onClick={() => onUpdate({ operator: 'AND' })}
                >
                  AND
                </button>
                <button
                  className={`mobile-filter-node__operator-btn ${
                    node.operator === 'OR' ? 'active' : ''
                  }`}
                  onClick={() => onUpdate({ operator: 'OR' })}
                >
                  OR
                </button>
              </div>
            </div>
          )}

          {node.type === 'filter' && (
            <div className="mobile-filter-node__filter-info">
              <p className="mobile-filter-node__info-text">
                Tap to configure filter options
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MobileVisualFilterBuilder: React.FC<MobileVisualFilterBuilderProps> = ({
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

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [queryPreview, setQueryPreview] = useState<{ sql: string; params: any[] } | null>(null);
  const [showQueryPreview, setShowQueryPreview] = useState(false);

  const queryBuilder = useRef(new AdvancedQueryBuilder());

  // Generate unique ID for new nodes
  const generateId = useCallback(() => {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
    setShowAddMenu(false);
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
    setShowAddMenu(false);
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
    setShowAddMenu(false);
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

  // Move node up in the list
  const moveNodeUp = useCallback((nodeId: string) => {
    const moveInNode = (node: FilterNode): FilterNode => {
      if (node.children) {
        const index = node.children.findIndex(child => child.id === nodeId);
        if (index > 0) {
          const newChildren = [...node.children];
          [newChildren[index - 1], newChildren[index]] = [newChildren[index], newChildren[index - 1]];
          return { ...node, children: newChildren };
        }
        
        return {
          ...node,
          children: node.children.map(moveInNode),
        };
      }

      return node;
    };

    const updatedRoot = moveInNode(rootNode);
    handleNodeUpdate(updatedRoot);
  }, [rootNode, handleNodeUpdate]);

  // Move node down in the list
  const moveNodeDown = useCallback((nodeId: string) => {
    const moveInNode = (node: FilterNode): FilterNode => {
      if (node.children) {
        const index = node.children.findIndex(child => child.id === nodeId);
        if (index >= 0 && index < node.children.length - 1) {
          const newChildren = [...node.children];
          [newChildren[index], newChildren[index + 1]] = [newChildren[index + 1], newChildren[index]];
          return { ...node, children: newChildren };
        }
        
        return {
          ...node,
          children: node.children.map(moveInNode),
        };
      }

      return node;
    };

    const updatedRoot = moveInNode(rootNode);
    handleNodeUpdate(updatedRoot);
  }, [rootNode, handleNodeUpdate]);

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

  // Render nodes recursively
  const renderNodes = (nodes: FilterNode[], depth: number = 0): React.ReactNode => {
    return nodes.map((node, index) => (
      <div key={node.id}>
        <MobileFilterNode
          node={node}
          depth={depth}
          onUpdate={(updates) => updateNode(node.id, updates)}
          onRemove={() => removeNode(node.id)}
          onMoveUp={() => moveNodeUp(node.id)}
          onMoveDown={() => moveNodeDown(node.id)}
          canMoveUp={index > 0}
          canMoveDown={index < nodes.length - 1}
        />
        {node.children && node.children.length > 0 && (
          <div className="mobile-filter-node__children">
            {renderNodes(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="mobile-visual-filter-builder">
      <div className="mobile-visual-filter-builder__header">
        <h2 className="mobile-visual-filter-builder__title">Query Builder</h2>
        <button
          className="mobile-visual-filter-builder__clear"
          onClick={clearAll}
          aria-label="Clear all"
        >
          Clear All
        </button>
      </div>

      <div className="mobile-visual-filter-builder__canvas">
        {rootNode.children && rootNode.children.length > 0 ? (
          renderNodes(rootNode.children)
        ) : (
          <div className="mobile-visual-filter-builder__empty">
            <p className="mobile-visual-filter-builder__empty-text">
              No filters added yet. Tap the + button to start building your query.
            </p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        className="mobile-visual-filter-builder__add-fab"
        onClick={() => setShowAddMenu(!showAddMenu)}
        aria-label="Add filter"
        aria-expanded={showAddMenu}
      >
        {showAddMenu ? '✕' : '+'}
      </button>

      {/* Add Menu */}
      {showAddMenu && (
        <div className="mobile-visual-filter-builder__add-menu">
          <button
            className="mobile-visual-filter-builder__add-option"
            onClick={addFilterNode}
          >
            <span className="mobile-visual-filter-builder__add-icon">🔍</span>
            <span className="mobile-visual-filter-builder__add-label">Add Filter</span>
          </button>
          <button
            className="mobile-visual-filter-builder__add-option"
            onClick={() => addOperatorNode('AND')}
          >
            <span className="mobile-visual-filter-builder__add-icon">⚡</span>
            <span className="mobile-visual-filter-builder__add-label">Add AND</span>
          </button>
          <button
            className="mobile-visual-filter-builder__add-option"
            onClick={() => addOperatorNode('OR')}
          >
            <span className="mobile-visual-filter-builder__add-icon">⚡</span>
            <span className="mobile-visual-filter-builder__add-label">Add OR</span>
          </button>
          <button
            className="mobile-visual-filter-builder__add-option"
            onClick={addGroupNode}
          >
            <span className="mobile-visual-filter-builder__add-icon">📁</span>
            <span className="mobile-visual-filter-builder__add-label">Add Group</span>
          </button>
        </div>
      )}

      {/* Query Preview Toggle */}
      <div className="mobile-visual-filter-builder__footer">
        <button
          className="mobile-visual-filter-builder__preview-toggle"
          onClick={() => setShowQueryPreview(!showQueryPreview)}
          aria-expanded={showQueryPreview}
        >
          {showQueryPreview ? 'Hide' : 'Show'} Query Preview
        </button>
      </div>

      {/* Query Preview */}
      {showQueryPreview && queryPreview && (
        <div className="mobile-visual-filter-builder__query-preview">
          <h3 className="mobile-visual-filter-builder__query-title">Generated SQL</h3>
          <pre className="mobile-visual-filter-builder__query-sql">
            {queryPreview.sql}
          </pre>
          {queryPreview.params.length > 0 && (
            <div className="mobile-visual-filter-builder__query-params">
              <h4 className="mobile-visual-filter-builder__params-title">Parameters:</h4>
              <pre className="mobile-visual-filter-builder__params-list">
                {JSON.stringify(queryPreview.params, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileVisualFilterBuilder;
