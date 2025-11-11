/**
 * Accessibility Example Component
 * 
 * Demonstrates keyboard navigation, ARIA support, and reduced motion
 * features for the advanced filter system.
 */

import React, { useState, useRef } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useAriaAnnouncements } from './hooks/useAriaAnnouncements';
import { useReducedMotion } from './hooks/useReducedMotion';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import '../../styles/advanced-filter.css';

export const AccessibilityExample: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Keyboard navigation
  const { containerRef } = useKeyboardNavigation({
    onFocusSearch: () => {
      searchInputRef.current?.focus();
    },
    onOpenFilters: () => {
      setIsFilterPanelOpen(prev => !prev);
    },
    onSaveSearch: () => {
      announce('Search saved successfully', 'polite');
    },
    onViewHistory: () => {
      announce('Opening search history', 'polite');
    },
  });

  // ARIA announcements
  const { announce, announceFilterChange, announceResultCount } = useAriaAnnouncements();

  // Reduced motion
  const {
    prefersReducedMotion,
    enableAnimations,
    getAnimationClass,
    getConditionalStyle,
  } = useReducedMotion();

  // Handle filter toggle
  const handleFilterToggle = (filterId: string) => {
    setSelectedFilters(prev => {
      const isAdding = !prev.includes(filterId);
      const next = isAdding
        ? [...prev, filterId]
        : prev.filter(id => id !== filterId);
      
      // Announce change
      announceFilterChange(filterId, isAdding ? 'added' : 'removed');
      
      // Announce result count (simulated)
      const resultCount = Math.max(0, 100 - next.length * 10);
      announceResultCount(resultCount);
      
      return next;
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    if (value.trim()) {
      // Simulate search results
      const resultCount = Math.floor(Math.random() * 50) + 10;
      announceResultCount(resultCount);
    }
  };

  return (
    <div 
      ref={containerRef as React.RefObject<HTMLDivElement>}
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        background: 'var(--mc-blue)',
        minHeight: '100vh',
      }}
    >
      {/* Skip to content link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Header */}
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: 'var(--mc-white)',
            marginBottom: '16px',
          }}
        >
          Accessibility Features Demo
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '800px',
            margin: '0 auto 24px',
            lineHeight: 1.6,
          }}
        >
          This demo showcases keyboard navigation, ARIA support, and reduced motion features.
          Try using keyboard shortcuts or enable reduced motion in your system preferences.
        </p>

        {/* Status indicators */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--filter-bg-light)',
              border: '1px solid var(--filter-border-light)',
              borderRadius: 'var(--filter-radius-md)',
              color: 'var(--filter-text)',
              fontSize: '0.875rem',
            }}
          >
            <strong style={{ color: 'var(--mc-gold)' }}>Reduced Motion:</strong>{' '}
            {prefersReducedMotion ? 'Enabled' : 'Disabled'}
          </div>
          <div
            style={{
              padding: '8px 16px',
              background: 'var(--filter-bg-light)',
              border: '1px solid var(--filter-border-light)',
              borderRadius: 'var(--filter-radius-md)',
              color: 'var(--filter-text)',
              fontSize: '0.875rem',
            }}
          >
            <strong style={{ color: 'var(--mc-gold)' }}>Animations:</strong>{' '}
            {enableAnimations ? 'Enabled' : 'Disabled'}
          </div>
          <button
            type="button"
            className="filter-button filter-button-secondary"
            onClick={() => setShowShortcuts(true)}
            style={{ fontSize: '0.875rem' }}
          >
            View Keyboard Shortcuts
          </button>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content">
        {/* Search section */}
        <section
          style={{
            background: 'var(--filter-bg)',
            border: '2px solid var(--filter-border)',
            borderRadius: 'var(--filter-radius-lg)',
            padding: 'var(--filter-spacing-2xl)',
            marginBottom: '24px',
          }}
          aria-labelledby="search-section-title"
        >
          <h2
            id="search-section-title"
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--filter-text)',
              marginBottom: '16px',
            }}
          >
            Search
            <span className="keyboard-shortcut-hint" style={{ marginLeft: '12px' }}>
              Press <span className="keyboard-shortcut-key">/</span> to focus
            </span>
          </h2>

          <div className="smart-search-input-wrapper">
            <span className="smart-search-icon" aria-hidden="true">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              className="smart-search-input"
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search..."
              aria-label="Search input"
              aria-describedby="search-hint"
            />
            {searchValue && (
              <button
                type="button"
                className="smart-search-clear"
                onClick={() => handleSearch('')}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <p
            id="search-hint"
            style={{
              fontSize: '0.875rem',
              color: 'var(--filter-text-muted)',
              marginTop: '8px',
            }}
          >
            Type to search. Results will be announced to screen readers.
          </p>
        </section>

        {/* Filter section */}
        <section
          style={{
            background: 'var(--filter-bg)',
            border: '2px solid var(--filter-border)',
            borderRadius: 'var(--filter-radius-lg)',
            padding: 'var(--filter-spacing-2xl)',
            marginBottom: '24px',
          }}
          aria-labelledby="filter-section-title"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2
              id="filter-section-title"
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--filter-text)',
                margin: 0,
              }}
            >
              Filters
              <span className="keyboard-shortcut-hint" style={{ marginLeft: '12px' }}>
                Press <span className="keyboard-shortcut-key">Ctrl</span>+<span className="keyboard-shortcut-key">K</span> to toggle
              </span>
            </h2>
            <button
              type="button"
              className="filter-button filter-button-secondary"
              onClick={() => setIsFilterPanelOpen(prev => !prev)}
              aria-expanded={isFilterPanelOpen}
              aria-controls="filter-panel"
            >
              {isFilterPanelOpen ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {isFilterPanelOpen && (
            <div
              id="filter-panel"
              role="region"
              aria-labelledby="filter-section-title"
              className={getAnimationClass('filter-slide-enter-active')}
              style={getConditionalStyle(
                { transition: 'all 0.3s ease' },
                {}
              )}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Category A', 'Category B', 'Category C', 'Category D'].map((filter) => (
                  <label
                    key={filter}
                    className="filter-option"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilters.includes(filter)}
                      onChange={() => handleFilterToggle(filter)}
                      className="filter-option-checkbox"
                      aria-label={`Filter by ${filter}`}
                    />
                    <span className="filter-option-label">{filter}</span>
                    <span
                      className="filter-badge"
                      aria-label={`${Math.floor(Math.random() * 50)} results`}
                    >
                      {Math.floor(Math.random() * 50)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedFilters.length > 0 && (
            <div
              style={{
                marginTop: '16px',
                padding: '16px',
                background: 'var(--filter-bg-light)',
                borderRadius: 'var(--filter-radius-md)',
              }}
              role="status"
              aria-live="polite"
            >
              <strong style={{ color: 'var(--mc-gold)' }}>Active Filters:</strong>{' '}
              {selectedFilters.join(', ')}
            </div>
          )}
        </section>

        {/* Instructions */}
        <section
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--mc-gold-light)',
            borderRadius: 'var(--filter-radius-lg)',
            padding: '24px',
          }}
          aria-labelledby="instructions-title"
        >
          <h2
            id="instructions-title"
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: 'var(--mc-gold)',
              marginBottom: '16px',
            }}
          >
            Accessibility Features
          </h2>
          <ul
            style={{
              color: 'var(--mc-white)',
              fontSize: '14px',
              lineHeight: 1.8,
              margin: 0,
              paddingLeft: '24px',
            }}
          >
            <li>
              <strong>Keyboard Navigation:</strong> Use Tab to navigate, Enter/Space to activate,
              and Esc to close modals
            </li>
            <li>
              <strong>Keyboard Shortcuts:</strong> / for search, Ctrl+K for filters, Ctrl+S to save,
              Ctrl+H for history
            </li>
            <li>
              <strong>Screen Reader Support:</strong> All actions are announced with ARIA live regions
            </li>
            <li>
              <strong>Focus Indicators:</strong> Gold outlines show keyboard focus position
            </li>
            <li>
              <strong>Reduced Motion:</strong> Animations are disabled when system preference is set
            </li>
            <li>
              <strong>ARIA Labels:</strong> All interactive elements have descriptive labels
            </li>
          </ul>
        </section>
      </main>

      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
};

export default AccessibilityExample;
