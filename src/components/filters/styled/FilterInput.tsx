import React, { forwardRef } from 'react';
import '../../../styles/advanced-filter.css';

export interface FilterInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

/**
 * FilterInput - Styled input component with MC Law blue theme
 * 
 * Features:
 * - MC Blue background with gold borders
 * - Focus states with gold glow
 * - Optional label and helper text
 * - Icon support
 * - Error state handling
 * - Full accessibility support
 */
export const FilterInput = forwardRef<HTMLInputElement, FilterInputProps>(
  ({ label, error, helperText, icon, className = '', id, ...props }, ref) => {
    const inputId = id || `filter-input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    
    return (
      <div className={`filter-input-wrapper ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="filter-input-label"
            style={{
              display: 'block',
              marginBottom: 'var(--filter-spacing-sm)',
              color: 'var(--filter-text)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {label}
          </label>
        )}
        
        <div style={{ position: 'relative' }}>
          {icon && (
            <div
              style={{
                position: 'absolute',
                left: 'var(--filter-spacing-md)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--filter-text-muted)',
                pointerEvents: 'none',
              }}
            >
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`filter-input filter-focus-visible ${hasError ? 'filter-input-error' : ''}`}
            style={{
              paddingLeft: icon ? 'calc(var(--filter-spacing-xl) + 24px)' : undefined,
              borderColor: hasError ? '#ef4444' : undefined,
            }}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
        </div>
        
        {error && (
          <p
            id={`${inputId}-error`}
            className="filter-input-error-text"
            style={{
              marginTop: 'var(--filter-spacing-xs)',
              color: '#ef4444',
              fontSize: '0.75rem',
            }}
          >
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="filter-input-helper-text"
            style={{
              marginTop: 'var(--filter-spacing-xs)',
              color: 'var(--filter-text-muted)',
              fontSize: '0.75rem',
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FilterInput.displayName = 'FilterInput';

export default FilterInput;
