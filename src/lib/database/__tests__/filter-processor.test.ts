// Unit tests for FilterProcessor
import { describe, it, expect } from 'vitest';
import { FilterProcessor } from '../filter-processor';
import { SearchResult } from '../types';
import { AlumniResult, PublicationResult, PhotoResult, FacultyResult } from '../search-manager';

describe('FilterProcessor Tests', () => {
  // Mock data for testing
  const mockAlumniResults: AlumniResult[] = [
    {
      id: '1',
      type: 'alumni',
      title: 'John Doe',
      subtitle: 'Class of 2020',
      relevanceScore: 0.9,
      data: {
        id: 1,
        full_name: 'John Doe',
        class_year: 2020,
        role: 'Student',
        tags: 'leadership,student',
        sort_key: 'doe_john'
      }
    },
    {
      id: '2',
      type: 'alumni',
      title: 'Jane Smith',
      subtitle: 'Class of 2019',
      relevanceScore: 0.8,
      data: {
        id: 2,
        full_name: 'Jane Smith',
        class_year: 2019,
        role: 'President',
        tags: 'leadership,president',
        sort_key: 'smith_jane'
      }
    }
  ];

  const mockPublicationResults: PublicationResult[] = [
    {
      id: '3',
      type: 'publication',
      title: 'Legal Ethics',
      subtitle: 'Law Review',
      relevanceScore: 0.85,
      data: {
        id: 3,
        title: 'Legal Ethics',
        pub_name: 'Law Review',
        issue_date: '2023-01-01',
        volume_issue: 'Vol. 1',
        pdf_path: '/path/to/pdf',
        description: 'Ethics in law',
        tags: 'ethics,law'
      }
    },
    {
      id: '4',
      type: 'publication',
      title: 'Constitutional Analysis',
      subtitle: 'Amicus',
      relevanceScore: 0.75,
      data: {
        id: 4,
        title: 'Constitutional Analysis',
        pub_name: 'Amicus',
        issue_date: '2023-02-01',
        volume_issue: 'Vol. 2',
        pdf_path: '/path/to/pdf2',
        description: 'Constitutional law',
        tags: 'constitutional,law'
      }
    }
  ];

  const mockPhotoResults: PhotoResult[] = [
    {
      id: '5',
      type: 'photo',
      title: 'Graduation 2020',
      subtitle: '2020s Campus',
      relevanceScore: 0.7,
      data: {
        id: 5,
        collection: '2020s Campus',
        title: 'Graduation 2020',
        year_or_decade: '2020',
        image_path: '/path/to/image',
        caption: 'Graduation ceremony',
        tags: 'graduation,ceremony'
      }
    }
  ];

  const mockFacultyResults: FacultyResult[] = [
    {
      id: '6',
      type: 'faculty',
      title: 'Dr. Bob Johnson',
      subtitle: 'Constitutional Law',
      relevanceScore: 0.95,
      data: {
        id: 6,
        full_name: 'Dr. Bob Johnson',
        title: 'Professor',
        department: 'Constitutional Law',
        email: 'bob@law.edu',
        phone: '555-0123'
      }
    }
  ];

  const allMockResults: SearchResult[] = [
    ...mockAlumniResults,
    ...mockPublicationResults,
    ...mockPhotoResults,
    ...mockFacultyResults
  ];

  describe('Filter Application', () => {
    it('should apply year range filter to alumni', () => {
      const filters = { yearRange: { start: 2019, end: 2020 } };
      const filtered = FilterProcessor.applyFilters(mockAlumniResults, filters);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => {
        const alumni = r as AlumniResult;
        return alumni.data.class_year >= 2019 && alumni.data.class_year <= 2020;
      })).toBe(true);
    });

    it('should apply publication type filter', () => {
      const filters = { publicationType: 'Law Review' };
      const filtered = FilterProcessor.applyFilters(mockPublicationResults, filters);

      expect(filtered).toHaveLength(1);
      expect((filtered[0] as PublicationResult).data.pub_name).toBe('Law Review');
    });

    it('should apply department filter to faculty', () => {
      const filters = { department: 'Constitutional Law' };
      const filtered = FilterProcessor.applyFilters(mockFacultyResults, filters);

      expect(filtered).toHaveLength(1);
      expect((filtered[0] as FacultyResult).data.department).toBe('Constitutional Law');
    });

    it('should apply decade filter to photos', () => {
      const filters = { decade: '2020' };
      const filtered = FilterProcessor.applyFilters(mockPhotoResults, filters);

      expect(filtered).toHaveLength(1);
      expect((filtered[0] as PhotoResult).data.year_or_decade).toContain('2020');
    });

    it('should apply collection filter to photos', () => {
      const filters = { collection: '2020s Campus' };
      const filtered = FilterProcessor.applyFilters(mockPhotoResults, filters);

      expect(filtered).toHaveLength(1);
      expect((filtered[0] as PhotoResult).data.collection).toBe('2020s Campus');
    });

    it('should apply role filter to alumni', () => {
      const filters = { role: 'President' };
      const filtered = FilterProcessor.applyFilters(mockAlumniResults, filters);

      expect(filtered).toHaveLength(1);
      expect((filtered[0] as AlumniResult).data.role).toBe('President');
    });

    it('should apply tags filter', () => {
      const filters = { tags: ['leadership'] };
      const filtered = FilterProcessor.applyFilters(mockAlumniResults, filters);

      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => {
        const alumni = r as AlumniResult;
        return alumni.data.tags?.includes('leadership');
      })).toBe(true);
    });

    it('should apply multiple filters', () => {
      const filters = {
        yearRange: { start: 2020, end: 2020 },
        role: 'Student'
      };
      const filtered = FilterProcessor.applyFilters(mockAlumniResults, filters);

      expect(filtered).toHaveLength(1);
      expect((filtered[0] as AlumniResult).data.class_year).toBe(2020);
      expect((filtered[0] as AlumniResult).data.role).toBe('Student');
    });

    it('should return empty array when no results match filters', () => {
      const filters = { yearRange: { start: 2025, end: 2030 } };
      const filtered = FilterProcessor.applyFilters(mockAlumniResults, filters);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('Result Sorting', () => {
    it('should sort by relevance ascending', () => {
      const sorted = FilterProcessor.sortResults(allMockResults, { field: 'relevance', direction: 'asc' });

      expect(sorted[0].relevanceScore).toBeLessThanOrEqual(sorted[1].relevanceScore);
      expect(sorted[sorted.length - 2].relevanceScore).toBeLessThanOrEqual(sorted[sorted.length - 1].relevanceScore);
    });

    it('should sort by relevance descending', () => {
      const sorted = FilterProcessor.sortResults(allMockResults, { field: 'relevance', direction: 'desc' });

      expect(sorted[0].relevanceScore).toBeGreaterThanOrEqual(sorted[1].relevanceScore);
      expect(sorted[sorted.length - 2].relevanceScore).toBeGreaterThanOrEqual(sorted[sorted.length - 1].relevanceScore);
    });

    it('should sort by name ascending', () => {
      const sorted = FilterProcessor.sortResults(allMockResults, { field: 'name', direction: 'asc' });

      expect(sorted[0].title.localeCompare(sorted[1].title)).toBeLessThanOrEqual(0);
    });

    it('should sort by name descending', () => {
      const sorted = FilterProcessor.sortResults(allMockResults, { field: 'name', direction: 'desc' });

      expect(sorted[0].title.localeCompare(sorted[1].title)).toBeGreaterThanOrEqual(0);
    });

    it('should sort by date', () => {
      const sorted = FilterProcessor.sortResults(mockPublicationResults, { field: 'date', direction: 'asc' });

      expect(sorted).toHaveLength(2);
      // First publication should have earlier date
      expect(sorted[0].data.issue_date).toBe('2023-01-01');
      expect(sorted[1].data.issue_date).toBe('2023-02-01');
    });

    it('should sort by year', () => {
      const sorted = FilterProcessor.sortResults(mockAlumniResults, { field: 'year', direction: 'asc' });

      expect(sorted).toHaveLength(2);
      expect((sorted[0] as AlumniResult).data.class_year).toBe(2019);
      expect((sorted[1] as AlumniResult).data.class_year).toBe(2020);
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', () => {
      const { paginatedResults, pagination } = FilterProcessor.paginateResults(
        allMockResults,
        { page: 1, pageSize: 3 }
      );

      expect(paginatedResults).toHaveLength(3);
      expect(pagination.currentPage).toBe(1);
      expect(pagination.totalPages).toBe(2);
      expect(pagination.hasNext).toBe(true);
      expect(pagination.hasPrevious).toBe(false);
    });

    it('should handle second page', () => {
      const { paginatedResults, pagination } = FilterProcessor.paginateResults(
        allMockResults,
        { page: 2, pageSize: 3 }
      );

      expect(paginatedResults).toHaveLength(3); // 6 total - 3 on first page = 3 remaining
      expect(pagination.currentPage).toBe(2);
      expect(pagination.totalPages).toBe(2);
      expect(pagination.hasNext).toBe(false);
      expect(pagination.hasPrevious).toBe(true);
    });

    it('should handle page beyond available results', () => {
      const { paginatedResults, pagination } = FilterProcessor.paginateResults(
        allMockResults,
        { page: 10, pageSize: 3 }
      );

      expect(paginatedResults).toHaveLength(0);
      expect(pagination.currentPage).toBe(10);
      expect(pagination.hasNext).toBe(false);
      expect(pagination.hasPrevious).toBe(true);
    });
  });

  describe('Complete Result Processing', () => {
    it('should process results with all options', () => {
      const processed = FilterProcessor.processResults(
        allMockResults,
        { tags: ['law'] },
        { field: 'relevance', direction: 'desc' },
        { page: 1, pageSize: 2 }
      );

      expect(processed.totalCount).toBe(6);
      expect(processed.filteredCount).toBe(3); // 2 publications + 1 faculty (department contains 'law')
      expect(processed.results).toHaveLength(2);
      expect(processed.pagination.currentPage).toBe(1);
      expect(processed.pagination.pageSize).toBe(2);
      expect(processed.facets).toBeDefined();
    });

    it('should generate facets', () => {
      const processed = FilterProcessor.processResults(allMockResults);

      expect(processed.facets.type).toBeDefined();
      expect(processed.facets.type.length).toBeGreaterThan(0);
      
      // Should have facets for each type present
      const typeValues = processed.facets.type.map(f => f.value);
      expect(typeValues).toContain('alumni');
      expect(typeValues).toContain('publication');
      expect(typeValues).toContain('photo');
      expect(typeValues).toContain('faculty');
    });
  });

  describe('Facet Generation', () => {
    it('should generate type facets', () => {
      const facets = FilterProcessor.generateFacets(allMockResults, {});

      expect(facets.type).toBeDefined();
      expect(facets.type).toHaveLength(4); // alumni, publication, photo, faculty
      
      const alumniFacet = facets.type.find(f => f.value === 'alumni');
      expect(alumniFacet?.count).toBe(2);
    });

    it('should generate publication type facets', () => {
      const facets = FilterProcessor.generateFacets(mockPublicationResults, {});

      expect(facets.publicationType).toBeDefined();
      expect(facets.publicationType).toHaveLength(2); // Law Review, Amicus
      
      const lawReviewFacet = facets.publicationType.find(f => f.value === 'Law Review');
      expect(lawReviewFacet?.count).toBe(1);
    });

    it('should generate department facets', () => {
      const facets = FilterProcessor.generateFacets(mockFacultyResults, {});

      expect(facets.department).toBeDefined();
      expect(facets.department).toHaveLength(1);
      expect(facets.department[0].value).toBe('Constitutional Law');
    });

    it('should generate tags facets', () => {
      const facets = FilterProcessor.generateFacets(allMockResults, {});

      expect(facets.tags).toBeDefined();
      expect(facets.tags.length).toBeGreaterThan(0);
      
      const leadershipTag = facets.tags.find(f => f.value === 'leadership');
      expect(leadershipTag?.count).toBe(2);
    });

    it('should mark selected facets', () => {
      const filters = { publicationType: 'Law Review' };
      const facets = FilterProcessor.generateFacets(mockPublicationResults, filters);

      const lawReviewFacet = facets.publicationType.find(f => f.value === 'Law Review');
      expect(lawReviewFacet?.selected).toBe(true);
      
      const amicusFacet = facets.publicationType.find(f => f.value === 'Amicus');
      expect(amicusFacet?.selected).toBe(false);
    });
  });

  describe('Available Filters', () => {
    it('should get available filter options', () => {
      const available = FilterProcessor.getAvailableFilters(allMockResults);

      expect(available.publicationTypes).toContain('Law Review');
      expect(available.publicationTypes).toContain('Amicus');
      expect(available.departments).toContain('Constitutional Law');
      expect(available.collections).toContain('2020s Campus');
      expect(available.roles).toContain('Student');
      expect(available.roles).toContain('President');
      expect(available.tags).toContain('leadership');
      expect(available.tags).toContain('law');
    });

    it('should generate year ranges from decades', () => {
      const available = FilterProcessor.getAvailableFilters(allMockResults);

      expect(available.yearRanges.length).toBeGreaterThan(0);
      expect(available.yearRanges[0]).toHaveProperty('start');
      expect(available.yearRanges[0]).toHaveProperty('end');
    });

    it('should sort available options', () => {
      const available = FilterProcessor.getAvailableFilters(allMockResults);

      // Check if arrays are sorted
      expect(available.publicationTypes).toEqual([...available.publicationTypes].sort());
      expect(available.departments).toEqual([...available.departments].sort());
      expect(available.tags).toEqual([...available.tags].sort());
    });
  });

  describe('Filter Summary', () => {
    it('should create filter summary', () => {
      const filters = {
        yearRange: { start: 2020, end: 2023 },
        publicationType: 'Law Review',
        department: 'Constitutional Law',
        tags: ['leadership', 'law']
      };

      const summary = FilterProcessor.createFilterSummary(filters);

      expect(summary).toContain('Years: 2020-2023');
      expect(summary).toContain('Publication: Law Review');
      expect(summary).toContain('Department: Constitutional Law');
      expect(summary).toContain('Tags: leadership, law');
    });

    it('should handle empty filters', () => {
      const summary = FilterProcessor.createFilterSummary({});
      expect(summary).toHaveLength(0);
    });

    it('should handle partial filters', () => {
      const filters = { publicationType: 'Amicus' };
      const summary = FilterProcessor.createFilterSummary(filters);

      expect(summary).toHaveLength(1);
      expect(summary[0]).toBe('Publication: Amicus');
    });
  });

  describe('Helper Methods', () => {
    it('should extract tags from results', () => {
      const tags = (FilterProcessor as any).getResultTags(mockAlumniResults[0]);
      expect(tags).toContain('leadership');
      expect(tags).toContain('student');
    });

    it('should handle empty tags', () => {
      const mockResult = {
        ...mockAlumniResults[0],
        data: { ...mockAlumniResults[0].data, tags: '' }
      };
      const tags = (FilterProcessor as any).getResultTags(mockResult);
      expect(tags).toHaveLength(0);
    });

    it('should compare dates correctly', () => {
      const comparison = (FilterProcessor as any).compareDates(
        mockPublicationResults[0],
        mockPublicationResults[1]
      );
      expect(comparison).toBeLessThan(0); // First publication is earlier
    });

    it('should compare years correctly', () => {
      const comparison = (FilterProcessor as any).compareYears(
        mockAlumniResults[1], // 2019
        mockAlumniResults[0]  // 2020
      );
      expect(comparison).toBeLessThan(0); // 2019 < 2020
    });
  });
});