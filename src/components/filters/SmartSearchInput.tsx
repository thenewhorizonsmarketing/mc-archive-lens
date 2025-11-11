/**
 * Smart Search Input Component
 * 
 * Intelligent search input with debounced input, MC Law blue styling,
 * and gold accents. Provides real-time suggestions as the user types.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import '../../styles/advanced-filter.css';

export interface SmartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSuggestionRequest?: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const SmartSearchInput: React.FC<SmartSearchInputProps> = ({
  value,
  onChange,
  onSuggestionRequest,
  onFocus,
  onBlur,
  placeholder = 'Search...',
  debounceMs = 150,
  disabled = false,
  className = '',
  ariaLabel = 'Search input'
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
      
      // Request suggestions if handler provided
      if (onSuggestionRequest && newValue.trim().length > 0) {
        onSuggestionRequest(newValue.trim());
      }
    }, debounceMs);
  }, [onChange, onSuggestionRequest, debounceMs]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (onFocus) {
      onFocus();
    }
    
    // Request suggestions for current value
    if (onSuggestionRequest && localValue.trim().length > 0) {
      onSuggestionRequest(localValue.trim());
    }
  }, [onFocus, onSuggestionRequest, localValue]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  }, [onBlur]);

  // Handle clear button
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    
    // Focus input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`smart-search-input-container ${className}`}>
      <div className={`smart-search-input-wrapper ${isFocused ? 'focused' : ''}`}>
        {/* Search Icon */}
        <span className="smart-search-icon" aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          className="smart-search-input"
          value={localValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {localValue && !disabled && (
          <button
            type="button"
            className="smart-search-clear"
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4l8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SmartSearchInput;
