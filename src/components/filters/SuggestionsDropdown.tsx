/**
 * Suggestions Dropdown Component
 * 
 * Displays search suggestions in a dropdown with MC Law blue styling,
 * grouped by category with gold dividers, and full keyboard navigation.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Suggestion, SuggestionType } from '../../lib/filters/SuggestionEngine';
import '../../styles/advanced-filter.css';

export interface SuggestionsDropdownProps {
  suggestions: Suggestion[];
  isOpen: boolean;
  onSelect: (suggestion: Suggestion) => void;
  onClose: () => void;
  loading?: boolean;
  className?: string;
}

interface GroupedSuggestions {
  type: SuggestionType;
  label: string;
  suggestions: Suggestion[];
}

export const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
  suggestions,
  isOpen,
  onSelect,
  onClose,
  loading = false,
  className = ''
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Group suggestions by type
  const groupedSuggestions = React.useMemo(() => {
    const groups: GroupedSuggestions[] = [];
    const typeLabels: Record<SuggestionType, string> = {
      recent: 'Recent Searches',
      popular: 'Popular Searches',
      category: 'Categories',
      smart: 'Suggestions'
    };

    // Group by type
    const suggestionsByType = suggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.type]) {
        acc[suggestion.type] = [];
      }
      acc[suggestion.type].push(suggestion);
      return acc;
    }, {} as Record<SuggestionType, Suggestion[]>);

    // Create ordered groups
    const typeOrder: SuggestionType[] = ['recent', 'popular', 'smart', 'category'];
    typeOrder.forEach(type => {
      if (suggestionsByType[type] && suggestionsByType[type].length > 0) {
        groups.push({
          type,
          label: typeLabels[type],
          suggestions: suggestionsByType[type]
        });
      }
    });

    return groups;
  }, [suggestions]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current.get(selectedIndex);
    if (selectedItem && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      const dropdownTop = dropdown.scrollTop;
      const dropdownBottom = dropdownTop + dropdown.clientHeight;

      if (itemTop < dropdownTop) {
        dropdown.scrollTop = itemTop;
      } else if (itemBottom > dropdownBottom) {
        dropdown.scrollTop = itemBottom - dropdown.clientHeight;
      }
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;

      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;

      case 'Tab':
        // Allow tab to close dropdown
        onClose();
        break;

      default:
        break;
    }
  }, [isOpen, suggestions, selectedIndex, onSelect, onClose]);

  // Add keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    onSelect(suggestion);
  }, [onSelect]);

  // Handle mouse enter on suggestion
  const handleMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={`suggestions-dropdown ${className}`}
      role="listbox"
      aria-label="Search suggestions"
    >
      {loading ? (
        <div className="suggestions-loading">
          <div className="filter-spinner" />
          <span style={{ marginLeft: '12px', color: 'var(--filter-text-muted)' }}>
            Loading suggestions...
          </span>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="suggestions-empty">
          <span style={{ color: 'var(--filter-text-muted)' }}>
            No suggestions found
          </span>
        </div>
      ) : (
        <>
          {groupedSuggestions.map((group, groupIndex) => (
            <div key={group.type} className="suggestions-group">
              {/* Group Header */}
              <div className="suggestions-group-header">
                {group.label}
              </div>

              {/* Group Items */}
              {group.suggestions.map((suggestion) => {
                // Calculate global index
                const globalIndex = suggestions.findIndex(s => s.id === suggestion.id);
                const isSelected = globalIndex === selectedIndex;

                return (
                  <div
                    key={suggestion.id}
                    ref={el => {
                      if (el) {
                        itemRefs.current.set(globalIndex, el);
                      }
                    }}
                    className={`suggestion-item ${isSelected ? 'selected' : ''}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => handleMouseEnter(globalIndex)}
                  >
                    {/* Icon */}
                    {suggestion.icon && (
                      <span className="suggestion-icon" aria-hidden="true">
                        {suggestion.icon}
                      </span>
                    )}

                    {/* Text */}
                    <span className="suggestion-text">
                      {suggestion.text}
                    </span>

                    {/* Category Badge */}
                    {suggestion.category && (
                      <span className="suggestion-category">
                        {suggestion.category}
                      </span>
                    )}

                    {/* Result Count */}
                    {suggestion.resultCount !== undefined && (
                      <span className="suggestion-count">
                        {suggestion.resultCount} results
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Group Divider */}
              {groupIndex < groupedSuggestions.length - 1 && (
                <div className="suggestions-divider" />
              )}
            </div>
          ))}

          {/* Keyboard Hint */}
          <div className="suggestions-hint">
            <span style={{ color: 'var(--filter-text-muted)', fontSize: '0.75rem' }}>
              Use ↑↓ to navigate, Enter to select, Esc to close
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default SuggestionsDropdown;
