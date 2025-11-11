/**
 * Hook for managing content data with URL parameter synchronization
 * 
 * Extends useContentData to automatically sync state with URL parameters
 * for deep linking support.
 */

import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useContentData, UseContentDataOptions, UseContentDataReturn } from './useContentData';
import {
  parseUrlParams,
  paramsToFilters,
  filtersToParams,
  updateUrl,
  getCurrentParams,
  isValidRecordId,
  mergeParams,
  clearParams,
  ContentPageParams
} from '@/lib/utils/url-params';

export interface UseContentDataWithUrlReturn extends UseContentDataReturn {
  // URL-specific functions
  updateUrlParams: (params: Partial<ContentPageParams>, replace?: boolean) => void;
  clearUrlParams: (keys: (keyof ContentPageParams)[]) => void;
}

/**
 * Hook that combines content data management with URL parameter handling
 */
export function useContentDataWithUrl(
  options: UseContentDataOptions
): UseContentDataWithUrlReturn {
  const { contentType } = options;
  const location = useLocation();
  
  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // Parse initial URL parameters
  const initialParams = parseUrlParams(new URLSearchParams(location.search));
  const initialFilters = paramsToFilters(initialParams, contentType);
  const initialSearchQuery = initialParams.q || '';
  
  // Use base content data hook with initial values from URL
  const contentData = useContentData({
    ...options,
    initialFilters
  });
  
  const {
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    currentPage,
    goToPage,
    selectedRecord,
    selectRecord,
    clearSelection,
    records
  } = contentData;
  
  // Initialize search query from URL on mount
  useEffect(() => {
    if (isInitialMount && initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setIsInitialMount(false);
    }
  }, [isInitialMount, initialSearchQuery, setSearchQuery]);
  
  // Initialize selected record from URL on mount
  useEffect(() => {
    if (initialParams.id && records.length > 0 && !selectedRecord) {
      const recordId = initialParams.id;
      
      // Validate record ID format
      if (isValidRecordId(recordId)) {
        // Check if record exists in current results
        const record = records.find(r => r.id === recordId);
        if (record) {
          selectRecord(recordId);
        } else {
          // Record ID is valid but not found in results
          console.warn(`Record ${recordId} not found in current results`);
          // Clear invalid ID from URL
          const currentParams = getCurrentParams();
          const updatedParams = clearParams(currentParams, ['id']);
          updateUrl(updatedParams, true);
        }
      } else {
        // Invalid record ID format
        console.warn(`Invalid record ID format: ${recordId}`);
        // Clear invalid ID from URL
        const currentParams = getCurrentParams();
        const updatedParams = clearParams(currentParams, ['id']);
        updateUrl(updatedParams, true);
      }
    }
  }, [initialParams.id, records, selectedRecord, selectRecord]);
  
  // Initialize page from URL on mount
  useEffect(() => {
    if (initialParams.page) {
      const pageNum = parseInt(initialParams.page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        goToPage(pageNum);
      }
    }
  }, [initialParams.page, goToPage]);
  
  // Sync filters to URL (skip on initial mount to avoid double update)
  useEffect(() => {
    if (isInitialMount) return;
    
    const currentParams = getCurrentParams();
    const filterParams = filtersToParams(filters);
    const updatedParams = mergeParams(currentParams, filterParams);
    
    // Clear filter params that are no longer set
    const allFilterKeys: (keyof ContentPageParams)[] = [
      'year', 'yearStart', 'yearEnd', 'department',
      'publicationType', 'collection', 'eventType', 'position'
    ];
    
    allFilterKeys.forEach(key => {
      if (!(key in filterParams) && key in currentParams) {
        delete updatedParams[key];
      }
    });
    
    updateUrl(updatedParams, true);
  }, [filters, isInitialMount]);
  
  // Sync search query to URL (skip on initial mount)
  useEffect(() => {
    if (isInitialMount) return;
    
    const currentParams = getCurrentParams();
    const updatedParams = searchQuery
      ? mergeParams(currentParams, { q: searchQuery })
      : clearParams(currentParams, ['q']);
    
    updateUrl(updatedParams, true);
  }, [searchQuery, isInitialMount]);
  
  // Sync current page to URL (skip on initial mount)
  useEffect(() => {
    if (isInitialMount) return;
    
    const currentParams = getCurrentParams();
    const updatedParams = currentPage > 1
      ? mergeParams(currentParams, { page: currentPage.toString() })
      : clearParams(currentParams, ['page']);
    
    updateUrl(updatedParams, true);
  }, [currentPage, isInitialMount]);
  
  // Sync selected record to URL
  useEffect(() => {
    if (isInitialMount) return;
    
    const currentParams = getCurrentParams();
    const updatedParams = selectedRecord
      ? mergeParams(currentParams, { id: selectedRecord.id })
      : clearParams(currentParams, ['id']);
    
    updateUrl(updatedParams, false); // Use push for record selection
  }, [selectedRecord, isInitialMount]);
  
  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = getCurrentParams();
      
      // Update filters
      const newFilters = paramsToFilters(params, contentType);
      setFilters(newFilters);
      
      // Update search query
      setSearchQuery(params.q || '');
      
      // Update page
      if (params.page) {
        const pageNum = parseInt(params.page, 10);
        if (!isNaN(pageNum) && pageNum > 0) {
          goToPage(pageNum);
        }
      } else {
        goToPage(1);
      }
      
      // Update selected record
      if (params.id && isValidRecordId(params.id)) {
        const record = records.find(r => r.id === params.id);
        if (record) {
          selectRecord(params.id);
        } else {
          clearSelection();
        }
      } else {
        clearSelection();
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [contentType, setFilters, setSearchQuery, goToPage, selectRecord, clearSelection, records]);
  
  // Custom URL update function
  const updateUrlParams = useCallback((
    params: Partial<ContentPageParams>,
    replace: boolean = false
  ) => {
    const currentParams = getCurrentParams();
    const updatedParams = mergeParams(currentParams, params);
    updateUrl(updatedParams, replace);
  }, []);
  
  // Custom URL clear function
  const clearUrlParams = useCallback((keys: (keyof ContentPageParams)[]) => {
    const currentParams = getCurrentParams();
    const updatedParams = clearParams(currentParams, keys);
    updateUrl(updatedParams, true);
  }, []);
  
  return {
    ...contentData,
    updateUrlParams,
    clearUrlParams
  };
}
