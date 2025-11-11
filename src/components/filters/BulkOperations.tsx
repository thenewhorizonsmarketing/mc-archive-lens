/**
 * Bulk Operations Component
 * 
 * Handles bulk filter operations including apply all, clear all,
 * and confirmation dialogs for destructive actions.
 * 
 * Requirements: 8, 12
 */

import React, { useState, useCallback } from 'react';
import { FilterConfig } from '../../lib/filters/types';
import { FilterBadge } from './styled/FilterBadge';
import '../../styles/advanced-filter.css';

export interface BulkOperationsProps {
  activeFilters: FilterConfig;
  onApplyFilters: (filters: FilterConfig) => void;
  onClearAllFilters: () => void;
  className?: string;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

/**
 * Confirmation Dialog for destructive actions
 */
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="bulk-operations__dialog-overlay" onClick={onCancel}>
      <div
        className="bulk-operations__dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div className="bulk-operations__dialog-header">
          <h3 id="dialog-title" className="bulk-operations__dialog-title">
            {title}
          </h3>
        </div>

        <div className="bulk-operations__dialog-body">
          <p id="dialog-message" className="bulk-operations__dialog-message">
            {message}
          </p>
        </div>

        <div className="bulk-operations__dialog-footer">
          <button
            className="filter-button filter-button-secondary"
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            className={`filter-button ${isDangerous ? 'bulk-operations__button--danger' : 'filter-button-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * BulkOperations - Bulk filter operation controls
 * 
 * Features:
 * - Apply all selected filters with optimization
 * - Clear all filters with confirmation
 * - Gold styling for primary actions
 * - Confirmation dialogs for destructive actions
 * - Active filter count display
 */
export const BulkOperations: React.FC<BulkOperationsProps> = ({
  activeFilters,
  onApplyFilters,
  onClearAllFilters,
  className = ''
}) => {
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);

  // Calculate total active filter count
  const activeFilterCount = 
    (activeFilters.textFilters?.length || 0) +
    (activeFilters.dateFilters?.length || 0) +
    (activeFilters.rangeFilters?.length || 0) +
    (activeFilters.booleanFilters?.length || 0) +
    (activeFilters.customFilters?.length || 0);

  // Handle clear all with confirmation
  const handleClearAll = useCallback(() => {
    if (activeFilterCount === 0) return;
    setShowClearConfirmation(true);
  }, [activeFilterCount]);

  const confirmClearAll = useCallback(() => {
    onClearAllFilters();
    setShowClearConfirmation(false);
  }, [onClearAllFilters]);

  const cancelClearAll = useCallback(() => {
    setShowClearConfirmation(false);
  }, []);

  return (
    <>
      <div className={`bulk-operations ${className}`}>
        {/* Active Filters Summary */}
        <div className="bulk-operations__summary">
          <div className="bulk-operations__summary-content">
            <span className="bulk-operations__summary-label">
              Active Filters:
            </span>
            {activeFilterCount > 0 ? (
              <FilterBadge 
                count={activeFilterCount} 
                size="large"
                ariaLabel={`${activeFilterCount} active filters`}
              />
            ) : (
              <span className="bulk-operations__summary-none">
                None
              </span>
            )}
          </div>

          {/* Clear All Button */}
          {activeFilterCount > 0 && (
            <button
              className="bulk-operations__clear-button"
              onClick={handleClearAll}
              aria-label="Clear all active filters"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Clear All Filters
            </button>
          )}
        </div>

        {/* Filter Breakdown */}
        {activeFilterCount > 0 && (
          <div className="bulk-operations__breakdown">
            <h4 className="bulk-operations__breakdown-title">
              Active Filter Breakdown
            </h4>
            <div className="bulk-operations__breakdown-list">
              {activeFilters.textFilters && activeFilters.textFilters.length > 0 && (
                <div className="bulk-operations__breakdown-item">
                  <span className="bulk-operations__breakdown-type">Text Filters:</span>
                  <FilterBadge count={activeFilters.textFilters.length} />
                </div>
              )}
              {activeFilters.dateFilters && activeFilters.dateFilters.length > 0 && (
                <div className="bulk-operations__breakdown-item">
                  <span className="bulk-operations__breakdown-type">Date Filters:</span>
                  <FilterBadge count={activeFilters.dateFilters.length} />
                </div>
              )}
              {activeFilters.rangeFilters && activeFilters.rangeFilters.length > 0 && (
                <div className="bulk-operations__breakdown-item">
                  <span className="bulk-operations__breakdown-type">Range Filters:</span>
                  <FilterBadge count={activeFilters.rangeFilters.length} />
                </div>
              )}
              {activeFilters.booleanFilters && activeFilters.booleanFilters.length > 0 && (
                <div className="bulk-operations__breakdown-item">
                  <span className="bulk-operations__breakdown-type">Boolean Filters:</span>
                  <FilterBadge count={activeFilters.booleanFilters.length} />
                </div>
              )}
              {activeFilters.customFilters && activeFilters.customFilters.length > 0 && (
                <div className="bulk-operations__breakdown-item">
                  <span className="bulk-operations__breakdown-type">Custom Filters:</span>
                  <FilterBadge count={activeFilters.customFilters.length} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bulk-operations__quick-actions">
          <h4 className="bulk-operations__quick-actions-title">
            Quick Actions
          </h4>
          <div className="bulk-operations__quick-actions-grid">
            <button
              className="bulk-operations__quick-action"
              onClick={handleClearAll}
              disabled={activeFilterCount === 0}
              aria-label="Clear all filters"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Clear All</span>
            </button>

            <button
              className="bulk-operations__quick-action"
              onClick={() => {
                // Reset to default filters
                onApplyFilters({
                  type: activeFilters.type,
                  operator: 'AND'
                });
              }}
              disabled={activeFilterCount === 0}
              aria-label="Reset to default filters"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10C16 13.3137 13.3137 16 10 16C8.34315 16 6.84315 15.3284 5.75736 14.2426"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4 14V10H8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearConfirmation}
        title="Clear All Filters?"
        message={`Are you sure you want to clear all ${activeFilterCount} active filters? This action cannot be undone.`}
        confirmLabel="Clear All"
        cancelLabel="Cancel"
        onConfirm={confirmClearAll}
        onCancel={cancelClearAll}
        isDangerous={true}
      />
    </>
  );
};

export default BulkOperations;
