/**
 * URL Parameter Handling Utilities
 * 
 * Provides functions for parsing and updating URL parameters for deep linking
 * in content pages (Alumni, Publications, Photos, Faculty).
 */

import { SearchFilters } from '@/lib/database/types';

export interface ContentPageParams {
  // Selected record ID
  id?: string;
  
  // Search query
  q?: string;
  
  // Filters
  year?: string;
  yearStart?: string;
  yearEnd?: string;
  department?: string;
  publicationType?: string;
  collection?: string;
  eventType?: string;
  position?: string;
  
  // Pagination
  page?: string;
  
  // View mode
  view?: 'grid' | 'list';
}

/**
 * Parse URL search parameters into ContentPageParams
 */
export function parseUrlParams(searchParams: URLSearchParams): ContentPageParams {
  const params: ContentPageParams = {};
  
  // Selected record ID
  const id = searchParams.get('id');
  if (id) params.id = id;
  
  // Search query
  const q = searchParams.get('q');
  if (q) params.q = q;
  
  // Year filters
  const year = searchParams.get('year');
  if (year) params.year = year;
  
  const yearStart = searchParams.get('yearStart');
  if (yearStart) params.yearStart = yearStart;
  
  const yearEnd = searchParams.get('yearEnd');
  if (yearEnd) params.yearEnd = yearEnd;
  
  // Other filters
  const department = searchParams.get('department');
  if (department) params.department = department;
  
  const publicationType = searchParams.get('publicationType');
  if (publicationType) params.publicationType = publicationType;
  
  const collection = searchParams.get('collection');
  if (collection) params.collection = collection;
  
  const eventType = searchParams.get('eventType');
  if (eventType) params.eventType = eventType;
  
  const position = searchParams.get('position');
  if (position) params.position = position;
  
  // Pagination
  const page = searchParams.get('page');
  if (page) params.page = page;
  
  // View mode
  const view = searchParams.get('view');
  if (view === 'grid' || view === 'list') params.view = view;
  
  return params;
}

/**
 * Convert ContentPageParams to SearchFilters
 */
export function paramsToFilters(
  params: ContentPageParams,
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty'
): SearchFilters {
  const filters: SearchFilters = {
    type: contentType
  };
  
  // Year filters
  if (params.year) {
    const yearNum = parseInt(params.year, 10);
    if (!isNaN(yearNum)) {
      filters.year = yearNum;
    }
  }
  
  if (params.yearStart || params.yearEnd) {
    const start = params.yearStart ? parseInt(params.yearStart, 10) : undefined;
    const end = params.yearEnd ? parseInt(params.yearEnd, 10) : undefined;
    
    if ((start && !isNaN(start)) || (end && !isNaN(end))) {
      filters.yearRange = {
        start: start || 0,
        end: end || 9999
      };
    }
  }
  
  // Department filter
  if (params.department) {
    filters.department = params.department;
  }
  
  // Content-specific filters
  if (contentType === 'publication' && params.publicationType) {
    filters.publicationType = params.publicationType;
  }
  
  if (contentType === 'photo') {
    if (params.collection) {
      filters.collection = params.collection;
    }
    if (params.eventType) {
      filters.eventType = params.eventType;
    }
  }
  
  if (contentType === 'faculty' && params.position) {
    filters.position = params.position;
  }
  
  return filters;
}

/**
 * Convert SearchFilters to URL parameters
 */
export function filtersToParams(filters: SearchFilters): Partial<ContentPageParams> {
  const params: Partial<ContentPageParams> = {};
  
  // Year filters
  if (filters.year) {
    params.year = filters.year.toString();
  }
  
  if (filters.yearRange) {
    if (filters.yearRange.start > 0) {
      params.yearStart = filters.yearRange.start.toString();
    }
    if (filters.yearRange.end < 9999) {
      params.yearEnd = filters.yearRange.end.toString();
    }
  }
  
  // Department filter
  if (filters.department) {
    params.department = filters.department;
  }
  
  // Content-specific filters
  if (filters.publicationType) {
    params.publicationType = filters.publicationType;
  }
  
  if (filters.collection) {
    params.collection = filters.collection;
  }
  
  if (filters.eventType) {
    params.eventType = filters.eventType;
  }
  
  if (filters.position) {
    params.position = filters.position;
  }
  
  return params;
}

/**
 * Build URL search string from ContentPageParams
 */
export function buildUrlSearch(params: ContentPageParams): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value.toString());
    }
  });
  
  const search = searchParams.toString();
  return search ? `?${search}` : '';
}

/**
 * Update URL without triggering navigation
 */
export function updateUrl(params: ContentPageParams, replace: boolean = false): void {
  const search = buildUrlSearch(params);
  const url = `${window.location.pathname}${search}`;
  
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
}

/**
 * Get current URL parameters
 */
export function getCurrentParams(): ContentPageParams {
  const searchParams = new URLSearchParams(window.location.search);
  return parseUrlParams(searchParams);
}

/**
 * Validate record ID format
 */
export function isValidRecordId(id: string | undefined): boolean {
  if (!id) return false;
  
  // Record IDs should match pattern: type_number (e.g., alumni_001, publication_042)
  const pattern = /^(alumni|publication|photo|faculty)_\d+$/;
  return pattern.test(id);
}

/**
 * Extract content type from record ID
 */
export function getContentTypeFromId(id: string): 'alumni' | 'publication' | 'photo' | 'faculty' | null {
  if (!isValidRecordId(id)) return null;
  
  const prefix = id.split('_')[0];
  if (prefix === 'alumni' || prefix === 'publication' || prefix === 'photo' || prefix === 'faculty') {
    return prefix;
  }
  
  return null;
}

/**
 * Merge current params with new params
 */
export function mergeParams(current: ContentPageParams, updates: Partial<ContentPageParams>): ContentPageParams {
  return {
    ...current,
    ...updates
  };
}

/**
 * Clear specific params
 */
export function clearParams(current: ContentPageParams, keys: (keyof ContentPageParams)[]): ContentPageParams {
  const result = { ...current };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}
