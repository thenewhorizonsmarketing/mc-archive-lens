import React, { useState } from 'react';
import { FilterNode, FilterOperator } from '../../../lib/filters/types';
import '../../../styles/advanced-filter.css';

export interface OperatorNodeProps {
  node: FilterNode;
  depth: number;
  isDropTarget: boolean;
  onUpdate: (updates: Partial<FilterNode>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  children?: React.ReactNode;
}

export const OperatorNode: React.FC<OperatorNodeProps> = ({
  node,
  depth,
  isDropTarget,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const operator = node.operator || 'AND';
  const childCount = node.children?.length || 0;

  const toggleOperator = () => {
    const newOperator: FilterOperator = operator === 'AND' ? 'OR' : 'AND';
    onUpdate({ operator: newOperator });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
    onDrop(e);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragLeave();
  };

  return (
    <div
      className={`operator-node ${isDropTarget ? 'operator-node--drop-target' : ''}`}
      style={{ marginLeft: `${depth * 24}px` }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="operator-node__header">
        <button
          type="button"
          className="operator-node__expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse operator' : 'Expand operator'}
        >
          <span className={`operator-node__expand-icon ${isExpanded ? 'operator-node__expand-icon--expanded' : ''}`}>
            ▶
          </span>
        </button>

        <div className={`operator-node__badge operator-node__badge--${operator.toLowerCase()}`}>
          {operator}
        </div>

        <div className="operator-node__info">
          <span className="operator-node__type">Logical Operator</span>
          <span className="operator-node__summary">
            {childCount} {childCount === 1 ? 'condition' : 'conditions'}
          </span>
        </div>

        <div className="operator-node__actions">
          <button
            type="button"
            className="operator-node__action-btn"
            onClick={toggleOperator}
            aria-label={`Switch to ${operator === 'AND' ? 'OR' : 'AND'}`}
            title={`Switch to ${operator === 'AND' ? 'OR' : 'AND'}`}
          >
            ⇄
          </button>
          {depth > 0 && (
            <button
              type="button"
              className="operator-node__action-btn operator-node__action-btn--danger"
              onClick={onRemove}
              aria-label="Remove operator"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="operator-node__content">
          {childCount > 0 ? (
            <div className="operator-node__children">
              {children}
            </div>
          ) : (
            <div className="operator-node__empty">
              <p className="operator-node__empty-text">
                Drop filters or operators here to combine them with {operator}
              </p>
            </div>
          )}
        </div>
      )}

      {depth > 0 && (
        <div
          className="operator-node__connector"
          style={{ left: `${(depth - 1) * 24 + 12}px` }}
        />
      )}
    </div>
  );
};

export default OperatorNode;
