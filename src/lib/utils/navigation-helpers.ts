/**
 * Navigation helper utilities for the fullscreen search interface
 * Provides consistent navigation patterns across the application
 */

import { NavigateFunction } from 'react-router-dom';

export interface SearchNavigationOptions {
  query?: string;
  fromPath?: string;
  filters?: Record<string, unknown>;
}

/**
 * Navigate to the fullscreen search page with optional query and context
 * Supports deep linking via URL parameters (Requirement 10.3)
 * 
 * @param navigate - React Router navigate function
 * @param options - Navigation options including query, fromPath, and filters
 */
export function navigateToSearch(
  navigate: NavigateFunction,
  options: SearchNavigationOptions = {}
): void {
  const { query, fromPath, filters } = options;
  
  // Build URL with query parameters for deep linking
  const searchParams = new URLSearchParams();
  if (query) {
    searchParams.set('q', query);
  }
  
  // Add filter parameters if provided
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value));
      }
    });
  }
  
  const queryString = searchParams.toString();
  const path = queryString ? `/search?${queryString}` : '/search';
  
  // Navigate with state to preserve context
  navigate(path, {
    state: {
      from: fromPath || window.location.pathname
    }
  });
}

/**
 * Navigate back from search to the previous page
 * 
 * @param navigate - React Router navigate function
 * @param fallbackPath - Path to navigate to if no history (default: '/')
 */
export function navigateFromSearch(
  navigate: NavigateFunction,
  fallbackPath: string = '/'
): void {
  // Try to go back in history, or navigate to fallback
  if (window.history.length > 1) {
    navigate(-1);
  } else {
    navigate(fallbackPath);
  }
}

/**
 * Get the current search query from URL parameters
 * Useful for components that need to read the search state
 * 
 * @returns The current search query or null
 */
export function getCurrentSearchQuery(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('q');
}

/**
 * Update the search query in the URL without navigation
 * Useful for updating the URL as the user types
 * 
 * @param query - The new search query
 */
export function updateSearchQuery(query: string): void {
  const url = new URL(window.location.href);
  if (query) {
    url.searchParams.set('q', query);
  } else {
    url.searchParams.delete('q');
  }
  window.history.replaceState({}, '', url.toString());
}
