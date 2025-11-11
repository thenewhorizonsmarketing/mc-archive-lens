import React from 'react';
import '../../../styles/advanced-filter.css';

export interface FilterChipProps {
  label: string;
  value?: string;
  onRemove?: () => void;
  className?: string;
}

/**
 * FilterChip - Styled chip component for active filters
 * 
 * Features:
 * - MC Blue background with gold borders
 * - Removable with gold close button
 * - Hover effects with elevation
 * - Smooth transitions
 */
export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  value,
  onRemove,
  className = '',
}) => {
  const displayText = value ? `${label}: ${value}` : label;
  
  return (
    <div className={`filter-chip ${className}`}>
      <span className="filter-chip-label">{displayText}</span>
      {onRemove && (
        <button
          className="filter-chip-remove"
          onClick={onRemove}
          aria-label={`Remove ${displayText} filter`}
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default FilterChip;
