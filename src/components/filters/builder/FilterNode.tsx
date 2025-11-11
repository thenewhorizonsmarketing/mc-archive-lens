import React, { useState } from 'react';
import { FilterNode as FilterNodeType, FilterConfig } from '../../../lib/filters/types';
import '../../../styles/advanced-filter.css';

export interface FilterNodeProps {
  node: FilterNodeType;
  depth: number;
  isDropTarget: boolean;
  onUpdate: (updates: Partial<FilterNodeType>) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

export const FilterNode: React.FC<FilterNodeProps> = ({
  node,
  depth,
  isDropTarget,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const filter = node.filter;

  const getFilterSummary = (): string => {
    if (!filter) {
      return 'Empty filter';
    }

    const parts: string[] = [];

    if (filter.textFilters && filter.textFilters.length > 0) {
      parts.push(`${filter.textFilters.length} text filter(s)`);
    }
    if (filter.dateFilters && filter.dateFilters.length > 0) {
      parts.push(`${filter.dateFilters.length} date filter(s)`);
    }
    if (filter.rangeFilters && filter.rangeFilters.length > 0) {
      parts.push(`${filter.rangeFilters.length} range filter(s)`);
    }
    if (filter.booleanFilters && filter.booleanFilters.length > 0) {
      parts.push(`${filter.booleanFilters.length} boolean filter(s)`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No filters configured';
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
      className={`filter-node ${isDropTarget ? 'filter-node--drop-target' : ''}`}
      style={{ marginLeft: `${depth * 24}px` }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="filter-node__header">
        <button
          type="button"
          className="filter-node__expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse filter' : 'Expand filter'}
        >
          <span className={`filter-node__expand-icon ${isExpanded ? 'filter-node__expand-icon--expanded' : ''}`}>
            ▶
          </span>
        </button>

        <div className="filter-node__icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 4h16M4 8h12M6 12h8M8 16h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="filter-node__info">
          <span className="filter-node__type">Filter</span>
          <span className="filter-node__summary">{getFilterSummary()}</span>
        </div>

        <div className="filter-node__actions">
          <button
            type="button"
            className="filter-node__action-btn"
            onClick={() => setIsEditing(!isEditing)}
            aria-label="Edit filter"
          >
            ✎
          </button>
          <button
            type="button"
            className="filter-node__action-btn filter-node__action-btn--danger"
            onClick={onRemove}
            aria-label="Remove filter"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="filter-node__content">
          {isEditing ? (
            <div className="filter-node__editor">
              <p className="filter-node__editor-note">
                Filter editing interface would go here. For now, this is a placeholder.
                In a full implementation, you would add form controls to edit text, date, range, and boolean filters.
              </p>
              <button
                type="button"
                className="filter-node__editor-close"
                onClick={() => setIsEditing(false)}
              >
                Close Editor
              </button>
            </div>
          ) : (
            <div className="filter-node__details">
              <div className="filter-node__detail-row">
                <span className="filter-node__detail-label">Content Type:</span>
                <span className="filter-node__detail-value">{filter?.type || 'N/A'}</span>
              </div>
              <div className="filter-node__detail-row">
                <span className="filter-node__detail-label">Operator:</span>
                <span className="filter-node__detail-value">{filter?.operator || 'AND'}</span>
              </div>
              {filter?.textFilters && filter.textFilters.length > 0 && (
                <div className="filter-node__detail-row">
                  <span className="filter-node__detail-label">Text Filters:</span>
                  <ul className="filter-node__detail-list">
                    {filter.textFilters.map((tf, idx) => (
                      <li key={idx}>
                        {tf.field} {tf.matchType} "{tf.value}"
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {depth > 0 && (
        <div
          className="filter-node__connector"
          style={{ left: `${(depth - 1) * 24 + 12}px` }}
        />
      )}
    </div>
  );
};

export default FilterNode;
