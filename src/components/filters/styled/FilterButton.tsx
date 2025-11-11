import React from 'react';
import '../../../styles/advanced-filter.css';

export interface FilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * FilterButton - Styled button component with MC Law blue theme
 * 
 * Features:
 * - MC Blue background with gold borders
 * - Hover effects with gold highlights
 * - Primary and secondary variants
 * - Icon support
 * - Full accessibility support
 */
export const FilterButton: React.FC<FilterButtonProps> = ({
  variant = 'secondary',
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const variantClass = variant === 'primary' ? 'filter-button-primary' : 'filter-button-secondary';
  
  return (
    <button
      className={`filter-button ${variantClass} filter-focus-visible ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="filter-button-icon">{icon}</span>}
      <span className="filter-button-text">{children}</span>
    </button>
  );
};

export default FilterButton;
