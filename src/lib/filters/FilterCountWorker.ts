// Web Worker for heavy filter count calculations
import { FilterConfig } from './types';

// This file will be used as a Web Worker
// It runs in a separate thread to avoid blocking the main UI

interface WorkerMessage {
  type: 'COUNT_FILTERS' | 'ESTIMATE_RESULTS';
  payload: {
    config: FilterConfig;
    data?: any[];
  };
  id: string;
}

interface WorkerResponse {
  type: 'COUNT_RESULT' | 'ESTIMATE_RESULT' | 'ERROR';
  payload: any;
  id: string;
}

// Worker message handler
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload, id } = event.data;

  try {
    switch (type) {
      case 'COUNT_FILTERS':
        handleCountFilters(payload.config, id);
        break;
      
      case 'ESTIMATE_RESULTS':
        handleEstimateResults(payload.config, payload.data || [], id);
        break;
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'ERROR',
      payload: { error: (error as Error).message },
      id
    };
    self.postMessage(response);
  }
};

/**
 * Count active filters in configuration
 */
function handleCountFilters(config: FilterConfig, id: string): void {
  const counts = {
    text: config.textFilters?.length || 0,
    date: config.dateFilters?.length || 0,
    range: config.rangeFilters?.length || 0,
    boolean: config.booleanFilters?.length || 0,
    custom: config.customFilters?.length || 0
  };

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  const response: WorkerResponse = {
    type: 'COUNT_RESULT',
    payload: { counts, total },
    id
  };

  self.postMessage(response);
}

/**
 * Estimate result count by applying filters to data
 */
function handleEstimateResults(
  config: FilterConfig,
  data: any[],
  id: string
): void {
  let filteredData = [...data];

  // Apply text filters
  if (config.textFilters && config.textFilters.length > 0) {
    config.textFilters.forEach(filter => {
      filteredData = filteredData.filter(item => {
        const value = String(item[filter.field] || '');
        const searchValue = filter.caseSensitive ? filter.value : filter.value.toLowerCase();
        const itemValue = filter.caseSensitive ? value : value.toLowerCase();

        switch (filter.matchType) {
          case 'equals':
            return itemValue === searchValue;
          case 'contains':
            return itemValue.includes(searchValue);
          case 'startsWith':
            return itemValue.startsWith(searchValue);
          case 'endsWith':
            return itemValue.endsWith(searchValue);
          default:
            return true;
        }
      });
    });
  }

  // Apply date filters
  if (config.dateFilters && config.dateFilters.length > 0) {
    config.dateFilters.forEach(filter => {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item[filter.field]);
        
        if (filter.startDate && itemDate < filter.startDate) {
          return false;
        }
        
        if (filter.endDate && itemDate > filter.endDate) {
          return false;
        }
        
        return true;
      });
    });
  }

  // Apply range filters
  if (config.rangeFilters && config.rangeFilters.length > 0) {
    config.rangeFilters.forEach(filter => {
      filteredData = filteredData.filter(item => {
        const value = Number(item[filter.field]);
        return value >= filter.min && value <= filter.max;
      });
    });
  }

  // Apply boolean filters
  if (config.booleanFilters && config.booleanFilters.length > 0) {
    config.booleanFilters.forEach(filter => {
      filteredData = filteredData.filter(item => {
        return Boolean(item[filter.field]) === filter.value;
      });
    });
  }

  const response: WorkerResponse = {
    type: 'ESTIMATE_RESULT',
    payload: { count: filteredData.length },
    id
  };

  self.postMessage(response);
}

// Export empty object for TypeScript
export {};
