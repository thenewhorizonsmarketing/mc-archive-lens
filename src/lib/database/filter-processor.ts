// Filter Processor for search results
import {
  SearchResult,
  SearchFilters,
  YearRange,
  AlumniResult,
  PublicationResult,
  PhotoResult,
  FacultyResult
} from './types';

export interface FilterOptions {
  yearRange?: YearRange;
  publicationType?: string;
  department?: string;
  decade?: string;
  collection?: string;
  role?: string;
  tags?: string[];
}

export interface SortOptions {
  field: 'relevance' | 'name' | 'date' | 'year' | 'title';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

export interface ProcessedResults<T extends SearchResult = SearchResult> {
  results: T[];
  totalCount: number;
  filteredCount: number;
  facets: Record<string, FacetValue[]>;
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface FacetValue {
  value: string;
  count: number;
  selected: boolean;
}

export class FilterProcessor {
  /**
   * Process and filter search results
   */
  static processResults<T extends SearchResult>(
    results: T[],
    filters: FilterOptions = {},
    sortOptions: SortOptions = { field: 'relevance', direction: 'asc' },
    paginationOptions: PaginationOptions = { page: 1, pageSize: 50 }
  ): ProcessedResults<T> {
    const totalCount = results.length;

    // Apply filters
    let filteredResults = this.applyFilters(results, filters);
    const filteredCount = filteredResults.length;

    // Generate facets before sorting/pagination
    const facets = this.generateFacets(filteredResults, filters);

    // Apply sorting
    filteredResults = this.sortResults(filteredResults, sortOptions);

    // Apply pagination
    const { paginatedResults, pagination } = this.paginateResults(
      filteredResults,
      paginationOptions
    );

    return {
      results: paginatedResults,
      totalCount,
      filteredCount,
      facets,
      pagination
    };
  }

  /**
   * Apply filters to search results
   */
  static applyFilters<T extends SearchResult>(
    results: T[],
    filters: FilterOptions
  ): T[] {
    return results.filter(result => {
      // Year range filter (for alumni)
      if (filters.yearRange && result.type === 'alumni') {
        const alumniResult = result as AlumniResult;
        const year = alumniResult.data.class_year;
        if (year < filters.yearRange.start || year > filters.yearRange.end) {
          return false;
        }
      }

      // Publication type filter
      if (filters.publicationType && result.type === 'publication') {
        const pubResult = result as PublicationResult;
        if (pubResult.data.pub_name !== filters.publicationType) {
          return false;
        }
      }

      // Department filter (for faculty)
      if (filters.department && result.type === 'faculty') {
        const facultyResult = result as FacultyResult;
        if (facultyResult.data.department !== filters.department) {
          return false;
        }
      }

      // Decade filter (for photos)
      if (filters.decade && result.type === 'photo') {
        const photoResult = result as PhotoResult;
        if (!photoResult.data.year_or_decade?.includes(filters.decade)) {
          return false;
        }
      }

      // Collection filter (for photos)
      if (filters.collection && result.type === 'photo') {
        const photoResult = result as PhotoResult;
        if (photoResult.data.collection !== filters.collection) {
          return false;
        }
      }

      // Role filter (for alumni)
      if (filters.role && result.type === 'alumni') {
        const alumniResult = result as AlumniResult;
        if (alumniResult.data.role !== filters.role) {
          return false;
        }
      }

      // Tags filter (any type)
      if (filters.tags && filters.tags.length > 0) {
        const resultTags = this.getResultTags(result);
        const hasMatchingTag = filters.tags.some(tag =>
          resultTags.some(resultTag =>
            resultTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort search results
   */
  static sortResults<T extends SearchResult>(
    results: T[],
    sortOptions: SortOptions
  ): T[] {
    return [...results].sort((a, b) => {
      let comparison = 0;

      switch (sortOptions.field) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;

        case 'name':
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;

        case 'date':
          comparison = this.compareDates(a, b);
          break;

        case 'year':
          comparison = this.compareYears(a, b);
          break;

        default:
          comparison = a.relevanceScore - b.relevanceScore;
      }

      return sortOptions.direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Paginate search results
   */
  static paginateResults<T extends SearchResult>(
    results: T[],
    paginationOptions: PaginationOptions
  ): {
    paginatedResults: T[];
    pagination: ProcessedResults<T>['pagination'];
  } {
    const { page, pageSize } = paginationOptions;
    const totalPages = Math.ceil(results.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const paginatedResults = results.slice(startIndex, endIndex);

    const pagination = {
      currentPage: page,
      totalPages,
      pageSize,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };

    return { paginatedResults, pagination };
  }

  /**
   * Generate facets for filtering
   */
  static generateFacets<T extends SearchResult>(
    results: T[],
    currentFilters: FilterOptions
  ): Record<string, FacetValue[]> {
    const facets: Record<string, FacetValue[]> = {};

    // Type facet
    facets.type = this.generateTypeFacet(results);

    // Year range facet (for alumni)
    const alumniResults = results.filter(r => r.type === 'alumni') as AlumniResult[];
    if (alumniResults.length > 0) {
      facets.decade = this.generateDecadeFacet(alumniResults, currentFilters.yearRange);
    }

    // Publication type facet
    const publicationResults = results.filter(r => r.type === 'publication') as PublicationResult[];
    if (publicationResults.length > 0) {
      facets.publicationType = this.generatePublicationTypeFacet(
        publicationResults,
        currentFilters.publicationType
      );
    }

    // Department facet (for faculty)
    const facultyResults = results.filter(r => r.type === 'faculty') as FacultyResult[];
    if (facultyResults.length > 0) {
      facets.department = this.generateDepartmentFacet(
        facultyResults,
        currentFilters.department
      );
    }

    // Collection facet (for photos)
    const photoResults = results.filter(r => r.type === 'photo') as PhotoResult[];
    if (photoResults.length > 0) {
      facets.collection = this.generateCollectionFacet(
        photoResults,
        currentFilters.collection
      );
    }

    // Tags facet
    facets.tags = this.generateTagsFacet(results, currentFilters.tags);

    return facets;
  }

  /**
   * Get available filter options for a result set
   */
  static getAvailableFilters<T extends SearchResult>(results: T[]): {
    yearRanges: YearRange[];
    publicationTypes: string[];
    departments: string[];
    decades: string[];
    collections: string[];
    roles: string[];
    tags: string[];
  } {
    const yearRanges: YearRange[] = [];
    const publicationTypes = new Set<string>();
    const departments = new Set<string>();
    const decades = new Set<string>();
    const collections = new Set<string>();
    const roles = new Set<string>();
    const tags = new Set<string>();

    results.forEach(result => {
      switch (result.type) {
        case 'alumni':
          const alumniResult = result as AlumniResult;
          const year = alumniResult.data.class_year;
          const decade = Math.floor(year / 10) * 10;
          decades.add(`${decade}s`);
          if (alumniResult.data.role) {
            roles.add(alumniResult.data.role);
          }
          break;

        case 'publication':
          const pubResult = result as PublicationResult;
          publicationTypes.add(pubResult.data.pub_name);
          break;

        case 'faculty':
          const facultyResult = result as FacultyResult;
          departments.add(facultyResult.data.department);
          break;

        case 'photo':
          const photoResult = result as PhotoResult;
          collections.add(photoResult.data.collection);
          if (photoResult.data.year_or_decade) {
            decades.add(photoResult.data.year_or_decade);
          }
          break;
      }

      // Extract tags
      const resultTags = this.getResultTags(result);
      resultTags.forEach(tag => tags.add(tag));
    });

    // Generate year ranges from decades
    Array.from(decades).forEach(decade => {
      const startYear = parseInt(decade.replace('s', ''));
      if (!isNaN(startYear)) {
        yearRanges.push({ start: startYear, end: startYear + 9 });
      }
    });

    return {
      yearRanges: yearRanges.sort((a, b) => a.start - b.start),
      publicationTypes: Array.from(publicationTypes).sort(),
      departments: Array.from(departments).sort(),
      decades: Array.from(decades).sort(),
      collections: Array.from(collections).sort(),
      roles: Array.from(roles).sort(),
      tags: Array.from(tags).sort()
    };
  }

  /**
   * Create filter summary for display
   */
  static createFilterSummary(filters: FilterOptions): string[] {
    const summary: string[] = [];

    if (filters.yearRange) {
      summary.push(`Years: ${filters.yearRange.start}-${filters.yearRange.end}`);
    }

    if (filters.publicationType) {
      summary.push(`Publication: ${filters.publicationType}`);
    }

    if (filters.department) {
      summary.push(`Department: ${filters.department}`);
    }

    if (filters.decade) {
      summary.push(`Decade: ${filters.decade}`);
    }

    if (filters.collection) {
      summary.push(`Collection: ${filters.collection}`);
    }

    if (filters.role) {
      summary.push(`Role: ${filters.role}`);
    }

    if (filters.tags && filters.tags.length > 0) {
      summary.push(`Tags: ${filters.tags.join(', ')}`);
    }

    return summary;
  }

  // Private helper methods

  private static getResultTags(result: SearchResult): string[] {
    let tagsString = '';

    switch (result.type) {
      case 'alumni':
        tagsString = (result as AlumniResult).data.tags || '';
        break;
      case 'publication':
        tagsString = (result as PublicationResult).data.tags || '';
        break;
      case 'photo':
        tagsString = (result as PhotoResult).data.tags || '';
        break;
      case 'faculty':
        // Faculty doesn't have tags, but we could use department or title
        tagsString = (result as FacultyResult).data.department || '';
        break;
    }

    return tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  private static compareDates(a: SearchResult, b: SearchResult): number {
    const getDate = (result: SearchResult): Date => {
      switch (result.type) {
        case 'publication':
          const pubResult = result as PublicationResult;
          return new Date(pubResult.data.issue_date || '1900-01-01');
        case 'photo':
          const photoResult = result as PhotoResult;
          const year = parseInt(photoResult.data.year_or_decade || '1900');
          return new Date(year, 0, 1);
        case 'alumni':
          const alumniResult = result as AlumniResult;
          return new Date(alumniResult.data.class_year, 0, 1);
        default:
          return new Date('1900-01-01');
      }
    };

    return getDate(a).getTime() - getDate(b).getTime();
  }

  private static compareYears(a: SearchResult, b: SearchResult): number {
    const getYear = (result: SearchResult): number => {
      switch (result.type) {
        case 'alumni':
          return (result as AlumniResult).data.class_year;
        case 'publication':
          const pubDate = (result as PublicationResult).data.issue_date;
          return pubDate ? new Date(pubDate).getFullYear() : 1900;
        case 'photo':
          const yearStr = (result as PhotoResult).data.year_or_decade;
          return parseInt(yearStr || '1900');
        default:
          return 1900;
      }
    };

    return getYear(a) - getYear(b);
  }

  private static generateTypeFacet<T extends SearchResult>(results: T[]): FacetValue[] {
    const typeCounts = new Map<string, number>();

    results.forEach(result => {
      const count = typeCounts.get(result.type) || 0;
      typeCounts.set(result.type, count + 1);
    });

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({
        value: type,
        count,
        selected: false
      }))
      .sort((a, b) => b.count - a.count);
  }

  private static generateDecadeFacet(
    alumniResults: AlumniResult[],
    selectedYearRange?: YearRange
  ): FacetValue[] {
    const decadeCounts = new Map<string, number>();

    alumniResults.forEach(result => {
      const year = result.data.class_year;
      const decade = `${Math.floor(year / 10) * 10}s`;
      const count = decadeCounts.get(decade) || 0;
      decadeCounts.set(decade, count + 1);
    });

    return Array.from(decadeCounts.entries())
      .map(([decade, count]) => ({
        value: decade,
        count,
        selected: selectedYearRange ? 
          decade === `${Math.floor(selectedYearRange.start / 10) * 10}s` : 
          false
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  private static generatePublicationTypeFacet(
    publicationResults: PublicationResult[],
    selectedType?: string
  ): FacetValue[] {
    const typeCounts = new Map<string, number>();

    publicationResults.forEach(result => {
      const type = result.data.pub_name;
      const count = typeCounts.get(type) || 0;
      typeCounts.set(type, count + 1);
    });

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({
        value: type,
        count,
        selected: type === selectedType
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  private static generateDepartmentFacet(
    facultyResults: FacultyResult[],
    selectedDepartment?: string
  ): FacetValue[] {
    const deptCounts = new Map<string, number>();

    facultyResults.forEach(result => {
      const dept = result.data.department;
      const count = deptCounts.get(dept) || 0;
      deptCounts.set(dept, count + 1);
    });

    return Array.from(deptCounts.entries())
      .map(([dept, count]) => ({
        value: dept,
        count,
        selected: dept === selectedDepartment
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  private static generateCollectionFacet(
    photoResults: PhotoResult[],
    selectedCollection?: string
  ): FacetValue[] {
    const collectionCounts = new Map<string, number>();

    photoResults.forEach(result => {
      const collection = result.data.collection;
      const count = collectionCounts.get(collection) || 0;
      collectionCounts.set(collection, count + 1);
    });

    return Array.from(collectionCounts.entries())
      .map(([collection, count]) => ({
        value: collection,
        count,
        selected: collection === selectedCollection
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  private static generateTagsFacet<T extends SearchResult>(
    results: T[],
    selectedTags?: string[]
  ): FacetValue[] {
    const tagCounts = new Map<string, number>();

    results.forEach(result => {
      const tags = this.getResultTags(result);
      tags.forEach(tag => {
        const count = tagCounts.get(tag) || 0;
        tagCounts.set(tag, count + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        value: tag,
        count,
        selected: selectedTags ? selectedTags.includes(tag) : false
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Limit to top 20 tags
  }
}

export default FilterProcessor;