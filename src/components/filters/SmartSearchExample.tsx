/**
 * Smart Search Example Component
 * 
 * Demonstrates the integration of SmartSearchInput, SuggestionEngine,
 * and SuggestionsDropdown components.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { SmartSearchInput } from './SmartSearchInput';
import { SuggestionsDropdown } from './SuggestionsDropdown';
import { SuggestionEngine, Suggestion } from '../../lib/filters/SuggestionEngine';
import { FilterConfig } from '../../lib/filters/types';
import '../../styles/advanced-filter.css';

export const SmartSearchExample: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestionEngine] = useState(() => new SuggestionEngine({
    maxSuggestions: 10,
    maxHistorySize: 100,
    popularThreshold: 3,
    enableLogging: true
  }));

  // Mock filter context
  const filterContext: FilterConfig = {
    type: 'alumni',
    operator: 'AND'
  };

  // Handle search query change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle suggestion request
  const handleSuggestionRequest = useCallback(async (query: string) => {
    setLoading(true);
    setShowSuggestions(true);

    try {
      // Generate suggestions
      const newSuggestions = await suggestionEngine.generateSuggestions(
        query,
        filterContext
      );
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [suggestionEngine, filterContext]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: Suggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);

    // Learn from selection
    suggestionEngine.learnFromSelection(suggestion);

    // Record search (mock result count)
    suggestionEngine.recordSearch(suggestion.text, 42, filterContext);

    console.log('Selected suggestion:', suggestion);
  }, [suggestionEngine, filterContext]);

  // Handle focus
  const handleFocus = useCallback(() => {
    if (searchQuery.trim().length > 0) {
      handleSuggestionRequest(searchQuery);
    } else {
      // Show default suggestions
      suggestionEngine.generateSuggestions('', filterContext).then(setSuggestions);
      setShowSuggestions(true);
    }
  }, [searchQuery, handleSuggestionRequest, suggestionEngine, filterContext]);

  // Handle blur (with delay to allow click on suggestions)
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  // Handle close
  const handleClose = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  // Simulate some initial search history
  useEffect(() => {
    suggestionEngine.recordSearch('John Smith', 15, filterContext);
    suggestionEngine.recordSearch('Class of 2020', 45, filterContext);
    suggestionEngine.recordSearch('Harvard Law', 23, filterContext);
    suggestionEngine.recordSearch('John', 8, filterContext);
    suggestionEngine.recordSearch('2020', 50, filterContext);
  }, [suggestionEngine, filterContext]);

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--mc-white)', marginBottom: '24px' }}>
        Smart Search Example
      </h1>

      <div style={{ position: 'relative' }}>
        <SmartSearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          onSuggestionRequest={handleSuggestionRequest}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search alumni, publications, photos..."
          debounceMs={150}
          ariaLabel="Smart search input"
        />

        <SuggestionsDropdown
          suggestions={suggestions}
          isOpen={showSuggestions}
          onSelect={handleSuggestionSelect}
          onClose={handleClose}
          loading={loading}
        />
      </div>

      {/* Search Results Display */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ color: 'var(--mc-white)', fontSize: '1.25rem', marginBottom: '16px' }}>
          Current Search Query
        </h2>
        <div
          style={{
            background: 'var(--filter-bg)',
            border: '2px solid var(--filter-border)',
            borderRadius: 'var(--filter-radius-lg)',
            padding: '20px',
            color: 'var(--filter-text)'
          }}
        >
          {searchQuery ? (
            <p style={{ margin: 0 }}>
              <strong>Query:</strong> {searchQuery}
            </p>
          ) : (
            <p style={{ margin: 0, color: 'var(--filter-text-muted)' }}>
              No search query entered
            </p>
          )}
        </div>
      </div>

      {/* Search History */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ color: 'var(--mc-white)', fontSize: '1.25rem', marginBottom: '16px' }}>
          Search History
        </h2>
        <div
          style={{
            background: 'var(--filter-bg)',
            border: '2px solid var(--filter-border)',
            borderRadius: 'var(--filter-radius-lg)',
            padding: '20px',
            color: 'var(--filter-text)'
          }}
        >
          {suggestionEngine.getHistory().length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {suggestionEngine.getHistory().slice(0, 5).map((entry, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <strong>{entry.query}</strong> - {entry.resultCount} results
                  <span style={{ color: 'var(--filter-text-muted)', marginLeft: '8px' }}>
                    ({entry.timestamp.toLocaleTimeString()})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: 'var(--filter-text-muted)' }}>
              No search history
            </p>
          )}
        </div>
      </div>

      {/* Popular Searches */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ color: 'var(--mc-white)', fontSize: '1.25rem', marginBottom: '16px' }}>
          Popular Searches
        </h2>
        <div
          style={{
            background: 'var(--filter-bg)',
            border: '2px solid var(--filter-border)',
            borderRadius: 'var(--filter-radius-lg)',
            padding: '20px',
            color: 'var(--filter-text)'
          }}
        >
          {suggestionEngine.getPopularSearchTerms(5).length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {suggestionEngine.getPopularSearchTerms(5).map((item, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <strong>{item.term}</strong>
                  <span
                    style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      background: 'var(--mc-gold)',
                      color: 'var(--mc-blue)',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {item.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, color: 'var(--filter-text-muted)' }}>
              No popular searches yet
            </p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ color: 'var(--mc-white)', fontSize: '1.25rem', marginBottom: '16px' }}>
          Instructions
        </h2>
        <div
          style={{
            background: 'var(--filter-bg)',
            border: '2px solid var(--filter-border)',
            borderRadius: 'var(--filter-radius-lg)',
            padding: '20px',
            color: 'var(--filter-text)'
          }}
        >
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li style={{ marginBottom: '8px' }}>
              Type in the search box to see suggestions
            </li>
            <li style={{ marginBottom: '8px' }}>
              Use <kbd style={{ background: 'var(--mc-gold)', color: 'var(--mc-blue)', padding: '2px 6px', borderRadius: '4px' }}>↑</kbd> and <kbd style={{ background: 'var(--mc-gold)', color: 'var(--mc-blue)', padding: '2px 6px', borderRadius: '4px' }}>↓</kbd> to navigate suggestions
            </li>
            <li style={{ marginBottom: '8px' }}>
              Press <kbd style={{ background: 'var(--mc-gold)', color: 'var(--mc-blue)', padding: '2px 6px', borderRadius: '4px' }}>Enter</kbd> to select a suggestion
            </li>
            <li style={{ marginBottom: '8px' }}>
              Press <kbd style={{ background: 'var(--mc-gold)', color: 'var(--mc-blue)', padding: '2px 6px', borderRadius: '4px' }}>Esc</kbd> to close suggestions
            </li>
            <li>
              Click the X button to clear the search
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SmartSearchExample;
