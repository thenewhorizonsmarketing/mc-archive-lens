import React from 'react';
import '../../../styles/advanced-filter.css';

export interface FilterBadgeProps {
  count: number | string;
  size?: 'small' | 'large';
  className?: string;
  ariaLabel?: string;
}

/**
 * FilterBadge - Styled badge component for counts and indicators
 * 
 * Features:
 * - MC Gold background with blue text
 * - Small and large size variants
 * - Accessible count display
 */
export const FilterBadge: React.FC<FilterBadgeProps> = ({
  count,
  size = 'small',
  className = '',
  ariaLabel,
}) => {
  const sizeClass = size === 'large' ? 'filter-badge-large' : '';
  
  return (
    <span
      className={`filter-badge ${sizeClass} ${className}`}
      aria-label={ariaLabel || `${count} items`}
      role="status"
    >
      {count}
    </span>
  );
};

export default FilterBadge;
