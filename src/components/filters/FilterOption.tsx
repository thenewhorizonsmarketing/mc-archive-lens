/**
 * Filter Option Component
 * 
 * Individual filter option with checkbox, label, and optional result count.
 * Features MC Law blue styling with gold highlights on hover.
 */

import React, { useId } from 'react';
import { ResultCountBadge } from './ResultCountBadge';
import '../../styles/advanced-filter.css';

export interface FilterOptionProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  count?: number;
  showCount?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FilterOption: React.FC<FilterOptionProps> = ({
  label,
  value,
  checked,
  onChange,
  count,
  showCount = true,
  disabled = false,
  className = ''
}) => {
  const id = useId();
  const checkboxId = `filter-option-${id}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(e.target.checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div
      className={`filter-option ${disabled ? 'filter-option-disabled' : ''} ${className}`}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Custom Checkbox */}
      <div className="filter-option-checkbox-wrapper">
        <input
          type="checkbox"
          id={checkboxId}
          className="filter-option-checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
        />
        <div
          className="filter-option-checkbox-custom"
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid var(--filter-border)',
            borderRadius: 'var(--filter-radius-sm)',
            background: checked ? 'var(--mc-gold)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--filter-transition-fast)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1
          }}
        >
          {checked && (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                stroke="var(--mc-blue)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Label */}
      <label
        htmlFor={checkboxId}
        className="filter-option-label"
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
      >
        {label}
      </label>

      {/* Result Count Badge */}
      {showCount && count !== undefined && (
        <ResultCountBadge count={count} loading={false} />
      )}
    </div>
  );
};

export default FilterOption;
