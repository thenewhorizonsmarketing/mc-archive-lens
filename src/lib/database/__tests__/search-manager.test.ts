// Unit tests for SearchManager
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchManager } from '../search-manager';
import { DatabaseConnection } from '../connection';
import { DatabaseManager } from '../manager';

// Mock the database connection and manager
const mockDbManager = {
  executeQuery: vi.fn(),
  executeStatement: vi.fn(),
  getStats: vi.fn()
} as unknown as DatabaseManager;

const mockDbConnection = {
  connected: true,
  connect: vi.fn(),
  getManager: vi.fn(() => mockDbManager)
} as unknown as DatabaseConnection;

describe('SearchManager Tests', () => {
  let searchManager: SearchManager;

  beforeEach(() => {
    searchManager = new SearchManager(mockDbConnection);
    // Set up the database manager to be available
    (searchManager as any).dbManager = mockDbManager;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Query Sanitization', () => {
    it('should sanitize simple queries', () => {
      const sanitized = (searchManager as any).sanitizeQuery('john doe');
      expect(sanitized).toBe('"john" OR "doe"');
    });

    it('should handle phrase searches with quotes', () => {
      const sanitized = (searchManager as any).sanitizeQuery('"john doe"');
      expect(sanitized).toBe('"john doe"');
    });

    it('should handle empty queries', () => {
      const sanitized = (searchManager as any).sanitizeQuery('');
      expect(sanitized).toBe('');
    });

    it('should handle single word queries', () => {
      const sanitized = (searchManager as any).sanitizeQuery('john');
      expect(sanitized).toBe('john');
    });

    it('should remove special characters', () => {
      const sanitized = (searchManager as any).sanitizeQuery('john@#$%doe');
      expect(sanitized).toBe('"john" OR "doe"');
    });

    it('should normalize whitespace', () => {
      const sanitized = (searchManager as any).sanitizeQuery('  john   doe  ');
      expect(sanitized).toBe('"john" OR "doe"');
    });
  });

  describe('Alumni Search', () => {
    beforeEach(() => {
      mockDbManager.executeQuery = vi.fn().mockReturnValue([
        {
          id: 1,
          full_name: 'John Doe',
          class_year: 2020,
          role: 'Student',
          composite_image_path: '/path/to/composite.jpg',
          portrait_path: '/path/to/portrait.jpg',
          caption: 'Class President',
          tags: 'leadership,student',
          sort_key: 'doe_john',
          relevance_score: 0.95
        }
      ]);
    });

    it('should search alumni successfully', async () => {
      const results = await searchManager.searchAlumni('John Doe');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('alumni');
      expect(results[0].title).toBe('John Doe');
      expect(results[0].subtitle).toBe('Class of 2020 • Student');
      expect(results[0].data.full_name).toBe('John Doe');
    });

    it('should apply year range filter', async () => {
      await searchManager.searchAlumni('John', { start: 2019, end: 2021 });

      expect(mockDbManager.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('class_year BETWEEN ? AND ?'),
        expect.arrayContaining(['John', 2019, 2021, 50, 0])
      );
    });

    it('should handle empty query', async () => {
      const results = await searchManager.searchAlumni('');
      expect(results).toHaveLength(0);
    });

    it('should format alumni results correctly', () => {
      const mockRow = {
        id: 1,
        full_name: 'Jane Smith',
        class_year: 2021,
        role: 'Graduate',
        portrait_path: '/path/to/portrait.jpg',
        caption: 'Valedictorian',
        tags: 'academic,honor',
        sort_key: 'smith_jane',
        relevance_score: 0.88
      };

      const formatted = (searchManager as any).formatAlumniResult(mockRow);

      expect(formatted.type).toBe('alumni');
      expect(formatted.title).toBe('Jane Smith');
      expect(formatted.subtitle).toBe('Class of 2021 • Graduate');
      expect(formatted.thumbnailPath).toBe('/path/to/portrait.jpg');
      expect(formatted.relevanceScore).toBe(0.88);
      expect(formatted.data.full_name).toBe('Jane Smith');
    });
  });

  describe('Publications Search', () => {
    beforeEach(() => {
      mockDbManager.executeQuery = vi.fn().mockReturnValue([
        {
          id: 1,
          title: 'Legal Ethics in Practice',
          pub_name: 'Law Review',
          issue_date: '2023-01-15',
          volume_issue: 'Vol. 45, Issue 1',
          pdf_path: '/path/to/article.pdf',
          thumb_path: '/path/to/thumb.jpg',
          description: 'An analysis of legal ethics',
          tags: 'ethics,law,practice',
          relevance_score: 0.92
        }
      ]);
    });

    it('should search publications successfully', async () => {
      const results = await searchManager.searchPublications('legal ethics');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('publication');
      expect(results[0].title).toBe('Legal Ethics in Practice');
      expect(results[0].subtitle).toBe('Law Review • Vol. 45, Issue 1');
    });

    it('should apply publication type filter', async () => {
      await searchManager.searchPublications('ethics', 'Law Review');

      expect(mockDbManager.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('pub_name = ?'),
        expect.arrayContaining([expect.any(String), 'Law Review'])
      );
    });

    it('should format publication results correctly', () => {
      const mockRow = {
        id: 2,
        title: 'Constitutional Analysis',
        pub_name: 'Amicus',
        issue_date: '2023-03-01',
        volume_issue: 'Vol. 12, Issue 2',
        pdf_path: '/path/to/amicus.pdf',
        description: 'Constitutional law analysis',
        tags: 'constitutional,law',
        relevance_score: 0.85
      };

      const formatted = (searchManager as any).formatPublicationResult(mockRow);

      expect(formatted.type).toBe('publication');
      expect(formatted.title).toBe('Constitutional Analysis');
      expect(formatted.subtitle).toBe('Amicus • Vol. 12, Issue 2');
      expect(formatted.data.pub_name).toBe('Amicus');
    });
  });

  describe('Photos Search', () => {
    beforeEach(() => {
      mockDbManager.executeQuery = vi.fn().mockReturnValue([
        {
          id: 1,
          collection: '1960s Campus',
          title: 'Graduation Ceremony 1965',
          year_or_decade: '1965',
          image_path: '/path/to/photo.jpg',
          caption: 'Students receiving diplomas',
          tags: 'graduation,ceremony,1960s',
          relevance_score: 0.90
        }
      ]);
    });

    it('should search photos successfully', async () => {
      const results = await searchManager.searchPhotos('graduation');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('photo');
      expect(results[0].title).toBe('Graduation Ceremony 1965');
      expect(results[0].subtitle).toBe('1960s Campus • 1965');
    });

    it('should apply decade filter', async () => {
      await searchManager.searchPhotos('ceremony', '1960s');

      expect(mockDbManager.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('year_or_decade LIKE ?'),
        expect.arrayContaining([expect.any(String), '%1960s%'])
      );
    });

    it('should format photo results correctly', () => {
      const mockRow = {
        id: 2,
        collection: '1970s Events',
        title: 'Law School Opening',
        year_or_decade: '1972',
        image_path: '/path/to/opening.jpg',
        caption: 'Grand opening ceremony',
        tags: 'opening,ceremony,1970s',
        relevance_score: 0.87
      };

      const formatted = (searchManager as any).formatPhotoResult(mockRow);

      expect(formatted.type).toBe('photo');
      expect(formatted.title).toBe('Law School Opening');
      expect(formatted.subtitle).toBe('1970s Events • 1972');
      expect(formatted.thumbnailPath).toBe('/path/to/opening.jpg');
    });
  });

  describe('Faculty Search', () => {
    beforeEach(() => {
      mockDbManager.executeQuery = vi.fn().mockReturnValue([
        {
          id: 1,
          full_name: 'Dr. Jane Smith',
          title: 'Professor of Constitutional Law',
          department: 'Constitutional Law',
          email: 'j.smith@lawschool.edu',
          phone: '555-0123',
          headshot_path: '/path/to/headshot.jpg',
          relevance_score: 0.93
        }
      ]);
    });

    it('should search faculty successfully', async () => {
      const results = await searchManager.searchFaculty('Jane Smith');

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('faculty');
      expect(results[0].title).toBe('Dr. Jane Smith');
      expect(results[0].subtitle).toBe('Professor of Constitutional Law • Constitutional Law');
    });

    it('should apply department filter', async () => {
      await searchManager.searchFaculty('professor', 'Constitutional Law');

      expect(mockDbManager.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('department = ?'),
        expect.arrayContaining([expect.any(String), 'Constitutional Law'])
      );
    });

    it('should format faculty results correctly', () => {
      const mockRow = {
        id: 2,
        full_name: 'Prof. Bob Johnson',
        title: 'Associate Professor',
        department: 'Criminal Law',
        email: 'b.johnson@lawschool.edu',
        phone: '555-0456',
        headshot_path: '/path/to/bob.jpg',
        relevance_score: 0.89
      };

      const formatted = (searchManager as any).formatFacultyResult(mockRow);

      expect(formatted.type).toBe('faculty');
      expect(formatted.title).toBe('Prof. Bob Johnson');
      expect(formatted.subtitle).toBe('Associate Professor • Criminal Law');
      expect(formatted.data.email).toBe('b.johnson@lawschool.edu');
    });
  });

  describe('Search All', () => {
    it('should search across all data types', async () => {
      // Mock individual search methods
      searchManager.searchAlumni = vi.fn().mockResolvedValue([
        { id: '1', type: 'alumni', title: 'John Doe', relevanceScore: 0.9, data: {} }
      ]);
      searchManager.searchPublications = vi.fn().mockResolvedValue([
        { id: '2', type: 'publication', title: 'Legal Ethics', relevanceScore: 0.8, data: {} }
      ]);
      searchManager.searchPhotos = vi.fn().mockResolvedValue([
        { id: '3', type: 'photo', title: 'Graduation', relevanceScore: 0.7, data: {} }
      ]);
      searchManager.searchFaculty = vi.fn().mockResolvedValue([
        { id: '4', type: 'faculty', title: 'Dr. Smith', relevanceScore: 0.85, data: {} }
      ]);

      const results = await searchManager.searchAll('test query');

      expect(results).toHaveLength(4);
      expect(results.map(r => r.type)).toEqual(expect.arrayContaining(['alumni', 'publication', 'photo', 'faculty']));
    });

    it('should handle empty query', async () => {
      const results = await searchManager.searchAll('');
      expect(results).toHaveLength(0);
    });

    it('should apply filters to search all', async () => {
      searchManager.searchAlumni = vi.fn().mockResolvedValue([]);
      searchManager.searchPublications = vi.fn().mockResolvedValue([]);
      searchManager.searchPhotos = vi.fn().mockResolvedValue([]);
      searchManager.searchFaculty = vi.fn().mockResolvedValue([]);

      const filters = {
        yearRange: { start: 2020, end: 2023 },
        publicationType: 'Law Review',
        department: 'Constitutional Law',
        decade: '2020s'
      };

      await searchManager.searchAll('test', filters);

      expect(searchManager.searchAlumni).toHaveBeenCalledWith('test', filters.yearRange, expect.any(Object));
      expect(searchManager.searchPublications).toHaveBeenCalledWith('test', filters.publicationType, expect.any(Object));
      expect(searchManager.searchPhotos).toHaveBeenCalledWith('test', filters.decade, expect.any(Object));
      expect(searchManager.searchFaculty).toHaveBeenCalledWith('test', filters.department, expect.any(Object));
    });
  });

  describe('Search Suggestions', () => {
    beforeEach(() => {
      mockDbManager.executeQuery = vi.fn()
        .mockReturnValueOnce([{ suggestion: 'John Doe' }])
        .mockReturnValueOnce([{ suggestion: 'Legal Ethics' }])
        .mockReturnValueOnce([{ suggestion: 'Graduation Ceremony' }])
        .mockReturnValueOnce([{ suggestion: 'Dr. Jane Smith' }]);
    });

    it('should get search suggestions', async () => {
      const suggestions = await searchManager.getSearchSuggestions('jo', 5);

      expect(suggestions).toContain('John Doe');
      expect(mockDbManager.executeQuery).toHaveBeenCalledTimes(4); // One for each table
    });

    it('should handle short queries', async () => {
      const suggestions = await searchManager.getSearchSuggestions('j');
      expect(suggestions).toHaveLength(0);
    });

    it('should limit suggestions', async () => {
      const suggestions = await searchManager.getSearchSuggestions('test', 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Popular Searches', () => {
    it('should return popular search terms', async () => {
      const popular = await searchManager.getPopularSearches(5);

      expect(popular).toHaveLength(5);
      expect(popular).toContain('graduation');
      expect(popular).toContain('law review');
    });

    it('should limit popular searches', async () => {
      const popular = await searchManager.getPopularSearches(3);
      expect(popular).toHaveLength(3);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      expect(() => searchManager.clearCache()).not.toThrow();
    });

    it('should get cache statistics', () => {
      const stats = searchManager.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.size).toBe('number');
      expect(typeof stats.hitRate).toBe('number');
    });
  });

  describe('Result Sorting', () => {
    it('should sort results by relevance', () => {
      const results = [
        { id: '1', type: 'alumni', title: 'A', relevanceScore: 0.5, data: {} },
        { id: '2', type: 'alumni', title: 'B', relevanceScore: 0.9, data: {} },
        { id: '3', type: 'alumni', title: 'C', relevanceScore: 0.7, data: {} }
      ] as any[];

      const sorted = (searchManager as any).sortResults(results, 'relevance', 'asc');

      expect(sorted[0].relevanceScore).toBe(0.5);
      expect(sorted[1].relevanceScore).toBe(0.7);
      expect(sorted[2].relevanceScore).toBe(0.9);
    });

    it('should sort results by name', () => {
      const results = [
        { id: '1', type: 'alumni', title: 'Charlie', relevanceScore: 0.5, data: {} },
        { id: '2', type: 'alumni', title: 'Alice', relevanceScore: 0.9, data: {} },
        { id: '3', type: 'alumni', title: 'Bob', relevanceScore: 0.7, data: {} }
      ] as any[];

      const sorted = (searchManager as any).sortResults(results, 'name', 'asc');

      expect(sorted[0].title).toBe('Alice');
      expect(sorted[1].title).toBe('Bob');
      expect(sorted[2].title).toBe('Charlie');
    });

    it('should sort results in descending order', () => {
      const results = [
        { id: '1', type: 'alumni', title: 'A', relevanceScore: 0.5, data: {} },
        { id: '2', type: 'alumni', title: 'B', relevanceScore: 0.9, data: {} }
      ] as any[];

      const sorted = (searchManager as any).sortResults(results, 'relevance', 'desc');

      expect(sorted[0].relevanceScore).toBe(0.9);
      expect(sorted[1].relevanceScore).toBe(0.5);
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', () => {
      const results = Array.from({ length: 10 }, (_, i) => ({
        id: i.toString(),
        type: 'alumni',
        title: `Person ${i}`,
        relevanceScore: 0.5,
        data: {}
      })) as any[];

      const paginated = (searchManager as any).paginateResults(results, 2, 3);

      expect(paginated).toHaveLength(3);
      expect(paginated[0].title).toBe('Person 2'); // offset 2, so starts at index 2
      expect(paginated[1].title).toBe('Person 3');
      expect(paginated[2].title).toBe('Person 4');
    });

    it('should handle pagination beyond available results', () => {
      const results = [
        { id: '1', type: 'alumni', title: 'A', relevanceScore: 0.5, data: {} }
      ] as any[];

      const paginated = (searchManager as any).paginateResults(results, 10, 5);
      expect(paginated).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockDbManager.executeQuery = vi.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      await expect(searchManager.searchAlumni('test')).rejects.toThrow();
    });

    it('should fallback to simple search on FTS5 errors', async () => {
      // Mock FTS5 failure and fallback success
      mockDbManager.executeQuery = vi.fn()
        .mockImplementationOnce(() => { throw new Error('FTS5 error'); })
        .mockReturnValueOnce([
          {
            id: 1,
            full_name: 'John Doe',
            class_year: 2020,
            role: 'Student',
            sort_key: 'doe_john',
            relevance_score: 1.0
          }
        ]);

      const results = await searchManager.searchAlumni('John');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('John Doe');
      expect(mockDbManager.executeQuery).toHaveBeenCalledTimes(2); // FTS5 + fallback
    });
  });
});