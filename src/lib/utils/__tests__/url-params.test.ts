/**
 * Tests for URL parameter handling utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseUrlParams,
  paramsToFilters,
  filtersToParams,
  buildUrlSearch,
  isValidRecordId,
  getContentTypeFromId,
  mergeParams,
  clearParams,
  ContentPageParams
} from '../url-params';
import { SearchFilters } from '@/lib/database/types';

describe('URL Parameter Utilities', () => {
  describe('parseUrlParams', () => {
    it('should parse basic URL parameters', () => {
      const searchParams = new URLSearchParams('?q=test&page=2&id=alumni_001');
      const result = parseUrlParams(searchParams);
      
      expect(result.q).toBe('test');
      expect(result.page).toBe('2');
      expect(result.id).toBe('alumni_001');
    });
    
    it('should parse filter parameters', () => {
      const searchParams = new URLSearchParams('?year=2020&department=Law&yearStart=2015&yearEnd=2025');
      const result = parseUrlParams(searchParams);
      
      expect(result.year).toBe('2020');
      expect(result.department).toBe('Law');
      expect(result.yearStart).toBe('2015');
      expect(result.yearEnd).toBe('2025');
    });
    
    it('should parse content-specific filters', () => {
      const searchParams = new URLSearchParams('?publicationType=Journal&collection=Archive&eventType=Graduation&position=Professor');
      const result = parseUrlParams(searchParams);
      
      expect(result.publicationType).toBe('Journal');
      expect(result.collection).toBe('Archive');
      expect(result.eventType).toBe('Graduation');
      expect(result.position).toBe('Professor');
    });
    
    it('should parse view mode', () => {
      const searchParams = new URLSearchParams('?view=grid');
      const result = parseUrlParams(searchParams);
      
      expect(result.view).toBe('grid');
    });
    
    it('should return empty object for no parameters', () => {
      const searchParams = new URLSearchParams('');
      const result = parseUrlParams(searchParams);
      
      expect(Object.keys(result).length).toBe(0);
    });
  });
  
  describe('paramsToFilters', () => {
    it('should convert params to filters for alumni', () => {
      const params: ContentPageParams = {
        year: '2020',
        department: 'Law'
      };
      
      const filters = paramsToFilters(params, 'alumni');
      
      expect(filters.type).toBe('alumni');
      expect(filters.year).toBe(2020);
      expect(filters.department).toBe('Law');
    });
    
    it('should convert year range params to filters', () => {
      const params: ContentPageParams = {
        yearStart: '2015',
        yearEnd: '2025'
      };
      
      const filters = paramsToFilters(params, 'publication');
      
      expect(filters.yearRange).toEqual({ start: 2015, end: 2025 });
    });
    
    it('should handle publication-specific filters', () => {
      const params: ContentPageParams = {
        publicationType: 'Journal'
      };
      
      const filters = paramsToFilters(params, 'publication');
      
      expect(filters.publicationType).toBe('Journal');
    });
    
    it('should handle photo-specific filters', () => {
      const params: ContentPageParams = {
        collection: 'Archive',
        eventType: 'Graduation'
      };
      
      const filters = paramsToFilters(params, 'photo');
      
      expect(filters.collection).toBe('Archive');
      expect(filters.eventType).toBe('Graduation');
    });
    
    it('should handle faculty-specific filters', () => {
      const params: ContentPageParams = {
        position: 'Professor'
      };
      
      const filters = paramsToFilters(params, 'faculty');
      
      expect(filters.position).toBe('Professor');
    });
  });
  
  describe('filtersToParams', () => {
    it('should convert filters to params', () => {
      const filters: SearchFilters = {
        type: 'alumni',
        year: 2020,
        department: 'Law'
      };
      
      const params = filtersToParams(filters);
      
      expect(params.year).toBe('2020');
      expect(params.department).toBe('Law');
    });
    
    it('should convert year range to params', () => {
      const filters: SearchFilters = {
        type: 'publication',
        yearRange: { start: 2015, end: 2025 }
      };
      
      const params = filtersToParams(filters);
      
      expect(params.yearStart).toBe('2015');
      expect(params.yearEnd).toBe('2025');
    });
    
    it('should handle content-specific filters', () => {
      const filters: SearchFilters = {
        type: 'publication',
        publicationType: 'Journal',
        collection: 'Archive',
        eventType: 'Graduation',
        position: 'Professor'
      };
      
      const params = filtersToParams(filters);
      
      expect(params.publicationType).toBe('Journal');
      expect(params.collection).toBe('Archive');
      expect(params.eventType).toBe('Graduation');
      expect(params.position).toBe('Professor');
    });
  });
  
  describe('buildUrlSearch', () => {
    it('should build URL search string from params', () => {
      const params: ContentPageParams = {
        q: 'test',
        page: '2',
        year: '2020'
      };
      
      const search = buildUrlSearch(params);
      
      expect(search).toContain('q=test');
      expect(search).toContain('page=2');
      expect(search).toContain('year=2020');
      expect(search.startsWith('?')).toBe(true);
    });
    
    it('should return empty string for no params', () => {
      const params: ContentPageParams = {};
      const search = buildUrlSearch(params);
      
      expect(search).toBe('');
    });
    
    it('should skip undefined and empty values', () => {
      const params: ContentPageParams = {
        q: 'test',
        page: undefined,
        year: ''
      };
      
      const search = buildUrlSearch(params);
      
      expect(search).toBe('?q=test');
    });
  });
  
  describe('isValidRecordId', () => {
    it('should validate correct record IDs', () => {
      expect(isValidRecordId('alumni_001')).toBe(true);
      expect(isValidRecordId('publication_042')).toBe(true);
      expect(isValidRecordId('photo_123')).toBe(true);
      expect(isValidRecordId('faculty_999')).toBe(true);
    });
    
    it('should reject invalid record IDs', () => {
      expect(isValidRecordId('invalid')).toBe(false);
      expect(isValidRecordId('alumni')).toBe(false);
      expect(isValidRecordId('alumni_')).toBe(false);
      expect(isValidRecordId('_001')).toBe(false);
      expect(isValidRecordId('other_001')).toBe(false);
      expect(isValidRecordId(undefined)).toBe(false);
      expect(isValidRecordId('')).toBe(false);
    });
  });
  
  describe('getContentTypeFromId', () => {
    it('should extract content type from valid IDs', () => {
      expect(getContentTypeFromId('alumni_001')).toBe('alumni');
      expect(getContentTypeFromId('publication_042')).toBe('publication');
      expect(getContentTypeFromId('photo_123')).toBe('photo');
      expect(getContentTypeFromId('faculty_999')).toBe('faculty');
    });
    
    it('should return null for invalid IDs', () => {
      expect(getContentTypeFromId('invalid')).toBe(null);
      expect(getContentTypeFromId('other_001')).toBe(null);
      expect(getContentTypeFromId('')).toBe(null);
    });
  });
  
  describe('mergeParams', () => {
    it('should merge params correctly', () => {
      const current: ContentPageParams = {
        q: 'test',
        page: '1'
      };
      
      const updates: Partial<ContentPageParams> = {
        page: '2',
        year: '2020'
      };
      
      const result = mergeParams(current, updates);
      
      expect(result.q).toBe('test');
      expect(result.page).toBe('2');
      expect(result.year).toBe('2020');
    });
  });
  
  describe('clearParams', () => {
    it('should clear specified params', () => {
      const current: ContentPageParams = {
        q: 'test',
        page: '2',
        year: '2020',
        department: 'Law'
      };
      
      const result = clearParams(current, ['page', 'year']);
      
      expect(result.q).toBe('test');
      expect(result.department).toBe('Law');
      expect(result.page).toBeUndefined();
      expect(result.year).toBeUndefined();
    });
  });
});
