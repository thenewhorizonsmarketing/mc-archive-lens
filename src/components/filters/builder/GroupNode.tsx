import React, { useState } from 'react';
import { FilterNode } from '../../../lib/filters/types';
import '../../../styles/advanced-filter.css';

export interface GroupNodeProps {
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

export const GroupNode: React.FC<GroupNodeProps> = ({
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
  const [groupName, setGroupName] = useState('Filter Group');
  const [isEditingName, setIsEditingName] = useState(false);

  const childCount = node.children?.length || 0;

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

  const handleNameSubmit = () => {
    setIsEditingName(false);
    // In a full implementation, you might want to store the name in the node
  };

  return (
    <div
      className={`group-node ${isDropTarget ? 'group-node--drop-target' : ''}`}
      style={{ marginLeft: `${depth * 24}px` }}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="group-node__header">
        <button
          type="button"
          className="group-node__expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse group' : 'Expand group'}
        >
          <span className={`group-node__expand-icon ${isExpanded ? 'group-node__expand-icon--expanded' : ''}`}>
            ▶
          </span>
        </button>

        <div className="group-node__icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect
              x="2"
              y="2"
              width="16"
              height="16"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M6 6h8M6 10h8M6 14h5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="group-node__info">
          {isEditingName ? (
            <input
              type="text"
              className="group-node__name-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameSubmit();
                } else if (e.key === 'Escape') {
                  setIsEditingName(false);
                }
              }}
              autoFocus
              aria-label="Group name"
            />
          ) : (
            <>
              <span
                className="group-node__name"
                onClick={() => setIsEditingName(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setIsEditingName(true);
                  }
                }}
              >
                {groupName}
              </span>
              <span className="group-node__summary">
                {childCount} {childCount === 1 ? 'item' : 'items'}
              </span>
            </>
          )}
        </div>

        <div className="group-node__actions">
          <button
            type="button"
            className="group-node__action-btn"
            onClick={() => setIsEditingName(true)}
            aria-label="Rename group"
          >
            ✎
          </button>
          <button
            type="button"
            className="group-node__action-btn group-node__action-btn--danger"
            onClick={onRemove}
            aria-label="Remove group"
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="group-node__content">
          {childCount > 0 ? (
            <div className="group-node__children">
              {children}
            </div>
          ) : (
            <div className="group-node__empty">
              <p className="group-node__empty-text">
                Drop filters or operators here to group them together
              </p>
            </div>
          )}
        </div>
      )}

      {depth > 0 && (
        <div
          className="group-node__connector"
          style={{ left: `${(depth - 1) * 24 + 12}px` }}
        />
      )}
    </div>
  );
};

export default GroupNode;
