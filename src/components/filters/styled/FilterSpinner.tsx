import React from 'react';
import '../../../styles/advanced-filter.css';

export interface FilterSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  ariaLabel?: string;
}

/**
 * FilterSpinner - Loading spinner with MC Law blue theme
 * 
 * Features:
 * - Gold spinning animation
 * - Multiple size variants
 * - Accessible loading indicator
 */
export const FilterSpinner: React.FC<FilterSpinnerProps> = ({
  size = 'medium',
  className = '',
  ariaLabel = 'Loading',
}) => {
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 32,
  };
  
  const spinnerSize = sizeMap[size];
  
  return (
    <div
      className={`filter-spinner ${className}`}
      style={{
        width: spinnerSize,
        height: spinnerSize,
      }}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
};

export default FilterSpinner;
