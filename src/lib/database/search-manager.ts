// Search Manager for SQLite FTS5 search system
import { DatabaseConnection } from './connection';
import { DatabaseManager } from './manager';
import {
  SearchResult,
  SearchFilters,
  YearRange,
  AlumniRecord,
  PublicationRecord,
  PhotoRecord,
  FacultyRecord,
  TableType,
  DatabaseError
} from './types';

export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'name' | 'date' | 'year';
  sortOrder?: 'asc' | 'desc';
}

export interface AlumniResult extends SearchResult {
  type: 'alumni';
  data: AlumniRecord;
}

export interface PublicationResult extends SearchResult {
  type: 'publication';
  data: PublicationRecord;
}

export interface PhotoResult extends SearchResult {
  type: 'photo';
  data: PhotoRecord;
}

export interface FacultyResult extends SearchResult {
  type: 'faculty';
  data: FacultyRecord;
}

export type TypedSearchResult = AlumniResult | PublicationResult | PhotoResult | FacultyResult;

export class SearchManager {
  private dbConnection: DatabaseConnection;
  private dbManager: DatabaseManager | null = null;
  private queryCache: Map<string, { results: SearchResult[]; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(dbConnection: DatabaseConnection) {
    this.dbConnection = dbConnection;
  }

  /**
   * Search across all data types
   */
  async searchAll(
    query: string,
    filters?: SearchFilters,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      await this.ensureConnection();

      const { limit = 50, offset = 0 } = options;
      const cacheKey = this.getCacheKey('all', query, filters, options);
      
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return this.paginateResults(cached, offset, limit);
      }

      // Search each table type
      const [alumniResults, publicationResults, photoResults, facultyResults] = await Promise.all([
        this.searchAlumni(query, filters?.yearRange, { limit: Math.ceil(limit / 4) }),
        this.searchPublications(query, filters?.publicationType, { limit: Math.ceil(limit / 4) }),
        this.searchPhotos(query, filters?.decade, { limit: Math.ceil(limit / 4) }),
        this.searchFaculty(query, filters?.department, { limit: Math.ceil(limit / 4) })
      ]);

      // Combine and sort results
      const allResults = [
        ...alumniResults,
        ...publicationResults,
        ...photoResults,
        ...facultyResults
      ];

      const sortedResults = this.sortResults(allResults, options.sortBy, options.sortOrder);
      
      // Cache results
      this.setCache(cacheKey, sortedResults);

      return this.paginateResults(sortedResults, offset, limit);

    } catch (error) {
      throw new DatabaseError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search alumni records
   */
  async searchAlumni(
    query: string,
    yearRange?: YearRange,
    options: SearchOptions = {}
  ): Promise<AlumniResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      await this.ensureConnection();

      const { limit = 50, offset = 0 } = options;
      const cacheKey = this.getCacheKey('alumni', query, { yearRange }, options);
      
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return this.paginateResults(cached as AlumniResult[], offset, limit);
      }

      // Build search query
      let searchQuery = `
        SELECT 
          a.*,
          bm25(alumni_fts) as relevance_score
        FROM alumni_fts f
        JOIN alumni a ON a.id = f.rowid
        WHERE alumni_fts MATCH ?
      `;

      const params: any[] = [this.sanitizeQuery(query)];

      // Add year range filter
      if (yearRange) {
        searchQuery += ` AND a.class_year BETWEEN ? AND ?`;
        params.push(yearRange.start, yearRange.end);
      }

      // Add sorting
      searchQuery += ` ORDER BY bm25(alumni_fts)`;
      
      if (options.sortBy === 'name') {
        searchQuery += `, a.full_name ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      } else if (options.sortBy === 'year') {
        searchQuery += `, a.class_year ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      }

      searchQuery += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const rawResults = this.dbManager!.executeQuery(searchQuery, params);
      const results = rawResults.map(row => this.formatAlumniResult(row));

      this.setCache(cacheKey, results);
      return results;

    } catch (error) {
      console.warn('FTS5 alumni search failed, falling back to simple search:', error);
      return this.fallbackAlumniSearch(query, yearRange, options);
    }
  }

  /**
   * Search publications
   */
  async searchPublications(
    query: string,
    pubType?: string,
    options: SearchOptions = {}
  ): Promise<PublicationResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      await this.ensureConnection();

      const { limit = 50, offset = 0 } = options;
      const cacheKey = this.getCacheKey('publications', query, { publicationType: pubType }, options);
      
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return this.paginateResults(cached as PublicationResult[], offset, limit);
      }

      let searchQuery = `
        SELECT 
          p.*,
          bm25(publications_fts) as relevance_score
        FROM publications_fts f
        JOIN publications p ON p.id = f.rowid
        WHERE publications_fts MATCH ?
      `;

      const params: any[] = [this.sanitizeQuery(query)];

      // Add publication type filter
      if (pubType) {
        searchQuery += ` AND p.pub_name = ?`;
        params.push(pubType);
      }

      // Add sorting
      searchQuery += ` ORDER BY bm25(publications_fts)`;
      
      if (options.sortBy === 'name') {
        searchQuery += `, p.title ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      } else if (options.sortBy === 'date') {
        searchQuery += `, p.issue_date ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      }

      searchQuery += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const rawResults = this.dbManager!.executeQuery(searchQuery, params);
      const results = rawResults.map(row => this.formatPublicationResult(row));

      this.setCache(cacheKey, results);
      return results;

    } catch (error) {
      console.warn('FTS5 publications search failed, falling back to simple search:', error);
      return this.fallbackPublicationsSearch(query, pubType, options);
    }
  }

  /**
   * Search photos
   */
  async searchPhotos(
    query: string,
    decade?: string,
    options: SearchOptions = {}
  ): Promise<PhotoResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      await this.ensureConnection();

      const { limit = 50, offset = 0 } = options;
      const cacheKey = this.getCacheKey('photos', query, { decade }, options);
      
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return this.paginateResults(cached as PhotoResult[], offset, limit);
      }

      let searchQuery = `
        SELECT 
          p.*,
          bm25(photos_fts) as relevance_score
        FROM photos_fts f
        JOIN photos p ON p.id = f.rowid
        WHERE photos_fts MATCH ?
      `;

      const params: any[] = [this.sanitizeQuery(query)];

      // Add decade filter
      if (decade) {
        searchQuery += ` AND p.year_or_decade LIKE ?`;
        params.push(`%${decade}%`);
      }

      // Add sorting
      searchQuery += ` ORDER BY bm25(photos_fts)`;
      
      if (options.sortBy === 'name') {
        searchQuery += `, p.title ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      } else if (options.sortBy === 'date') {
        searchQuery += `, p.year_or_decade ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      }

      searchQuery += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const rawResults = this.dbManager!.executeQuery(searchQuery, params);
      const results = rawResults.map(row => this.formatPhotoResult(row));

      this.setCache(cacheKey, results);
      return results;

    } catch (error) {
      console.warn('FTS5 photos search failed, falling back to simple search:', error);
      return this.fallbackPhotosSearch(query, decade, options);
    }
  }

  /**
   * Search faculty
   */
  async searchFaculty(
    query: string,
    department?: string,
    options: SearchOptions = {}
  ): Promise<FacultyResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      await this.ensureConnection();

      const { limit = 50, offset = 0 } = options;
      const cacheKey = this.getCacheKey('faculty', query, { department }, options);
      
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return this.paginateResults(cached as FacultyResult[], offset, limit);
      }

      let searchQuery = `
        SELECT 
          f.*,
          bm25(faculty_fts) as relevance_score
        FROM faculty_fts ft
        JOIN faculty f ON f.id = ft.rowid
        WHERE faculty_fts MATCH ?
      `;

      const params: any[] = [this.sanitizeQuery(query)];

      // Add department filter
      if (department) {
        searchQuery += ` AND f.department = ?`;
        params.push(department);
      }

      // Add sorting
      searchQuery += ` ORDER BY bm25(faculty_fts)`;
      
      if (options.sortBy === 'name') {
        searchQuery += `, f.full_name ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      }

      searchQuery += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const rawResults = this.dbManager!.executeQuery(searchQuery, params);
      const results = rawResults.map(row => this.formatFacultyResult(row));

      this.setCache(cacheKey, results);
      return results;

    } catch (error) {
      console.warn('FTS5 faculty search failed, falling back to simple search:', error);
      return this.fallbackFacultySearch(query, department, options);
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      await this.ensureConnection();

      const suggestions = new Set<string>();
      const searchTerm = `${query.trim()}*`;

      // Get suggestions from each table
      const tables = ['alumni', 'publications', 'photos', 'faculty'];
      
      for (const table of tables) {
        try {
          const results = this.dbManager!.executeQuery(`
            SELECT DISTINCT 
              CASE 
                WHEN ${table === 'alumni' ? 'full_name' : 
                      table === 'publications' ? 'title' : 
                      table === 'photos' ? 'title' : 'full_name'} LIKE ? 
                THEN ${table === 'alumni' ? 'full_name' : 
                       table === 'publications' ? 'title' : 
                       table === 'photos' ? 'title' : 'full_name'}
              END as suggestion
            FROM ${table}
            WHERE ${table === 'alumni' ? 'full_name' : 
                   table === 'publications' ? 'title' : 
                   table === 'photos' ? 'title' : 'full_name'} LIKE ?
            LIMIT ?
          `, [`${query}%`, `${query}%`, Math.ceil(limit / tables.length)]);

          results.forEach(row => {
            if (row.suggestion && suggestions.size < limit) {
              suggestions.add(row.suggestion);
            }
          });
        } catch (error) {
          console.warn(`Failed to get suggestions from ${table}:`, error);
        }
      }

      return Array.from(suggestions).slice(0, limit);

    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }

  /**
   * Get popular search terms
   */
  async getPopularSearches(limit: number = 10): Promise<string[]> {
    // In a real implementation, this would track search frequency
    // For now, return some common terms based on the data
    return [
      'graduation',
      'law review',
      'faculty',
      'class president',
      'amicus',
      'legal eye',
      'constitutional law',
      'professor',
      'dean',
      'ceremony'
    ].slice(0, limit);
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This would track hit/miss rates in a real implementation
    return {
      size: this.queryCache.size,
      hitRate: 0.85 // Placeholder
    };
  }

  // Private helper methods

  private async ensureConnection(): Promise<void> {
    if (!this.dbConnection.connected) {
      await this.dbConnection.connect();
    }
    this.dbManager = this.dbConnection.getManager();
  }

  private sanitizeQuery(query: string): string {
    if (!query || query.trim().length === 0) {
      return '';
    }

    // Remove or escape FTS5 special characters
    let sanitized = query
      .replace(/[^\w\s\-'"]/g, ' ') // Remove special chars except word chars, spaces, hyphens, quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // If query contains quotes, handle phrase search
    if (sanitized.includes('"')) {
      return sanitized;
    }

    // For multi-word queries, create an OR search
    const words = sanitized.split(' ').filter(word => word.length > 0);
    if (words.length > 1) {
      return words.map(word => `"${word}"`).join(' OR ');
    }

    return sanitized;
  }

  private formatAlumniResult(row: any): AlumniResult {
    // Construct proper photo path with year directory
    const photoFile = row.portrait_path || row.composite_image_path;
    const thumbnailPath = photoFile && row.class_year 
      ? `/photos/${row.class_year}/${photoFile}` 
      : undefined;
    
    return {
      id: row.id.toString(),
      type: 'alumni',
      title: row.full_name,
      subtitle: `Class of ${row.class_year}${row.role ? ` • ${row.role}` : ''}`,
      thumbnailPath,
      relevanceScore: row.relevance_score || 1.0,
      data: {
        id: row.id,
        full_name: row.full_name,
        class_year: row.class_year,
        role: row.role,
        composite_image_path: row.composite_image_path,
        portrait_path: row.portrait_path,
        caption: row.caption,
        tags: row.tags || '',
        sort_key: row.sort_key
      }
    };
  }

  private formatPublicationResult(row: any): PublicationResult {
    // Construct proper thumbnail path
    const thumbnailPath = row.thumb_path ? `/publications/thumbnails/${row.thumb_path}` : undefined;
    
    return {
      id: row.id.toString(),
      type: 'publication',
      title: row.title,
      subtitle: `${row.pub_name}${row.volume_issue ? ` • ${row.volume_issue}` : ''}`,
      thumbnailPath,
      relevanceScore: row.relevance_score || 1.0,
      data: {
        id: row.id,
        title: row.title,
        pub_name: row.pub_name,
        issue_date: row.issue_date,
        volume_issue: row.volume_issue,
        pdf_path: row.pdf_path,
        thumb_path: row.thumb_path,
        description: row.description,
        tags: row.tags || ''
      }
    };
  }

  private formatPhotoResult(row: any): PhotoResult {
    // Construct proper image path
    const thumbnailPath = row.image_path ? `/photos/${row.image_path}` : undefined;
    
    return {
      id: row.id.toString(),
      type: 'photo',
      title: row.title,
      subtitle: `${row.collection}${row.year_or_decade ? ` • ${row.year_or_decade}` : ''}`,
      thumbnailPath,
      relevanceScore: row.relevance_score || 1.0,
      data: {
        id: row.id,
        collection: row.collection,
        title: row.title,
        year_or_decade: row.year_or_decade,
        image_path: row.image_path,
        caption: row.caption,
        tags: row.tags || ''
      }
    };
  }

  private formatFacultyResult(row: any): FacultyResult {
    // Construct proper headshot path
    const thumbnailPath = row.headshot_path ? `/faculty/headshots/${row.headshot_path}` : undefined;
    
    return {
      id: row.id.toString(),
      type: 'faculty',
      title: row.full_name,
      subtitle: `${row.title}${row.department ? ` • ${row.department}` : ''}`,
      thumbnailPath,
      relevanceScore: row.relevance_score || 1.0,
      data: {
        id: row.id,
        full_name: row.full_name,
        title: row.title,
        department: row.department,
        email: row.email,
        phone: row.phone,
        headshot_path: row.headshot_path
      }
    };
  }

  private sortResults(
    results: SearchResult[],
    sortBy: SearchOptions['sortBy'] = 'relevance',
    sortOrder: SearchOptions['sortOrder'] = 'asc'
  ): SearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        default:
          comparison = a.relevanceScore - b.relevanceScore;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  private paginateResults<T extends SearchResult>(
    results: T[],
    offset: number,
    limit: number
  ): T[] {
    return results.slice(offset, offset + limit);
  }

  private getCacheKey(
    type: string,
    query: string,
    filters?: any,
    options?: SearchOptions
  ): string {
    return JSON.stringify({ type, query, filters, options });
  }

  private getFromCache(key: string): SearchResult[] | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }
    if (cached) {
      this.queryCache.delete(key);
    }
    return null;
  }

  private setCache(key: string, results: SearchResult[]): void {
    // Limit cache size
    if (this.queryCache.size >= 100) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(key, {
      results,
      timestamp: Date.now()
    });
  }

  // Fallback search methods using simple LIKE queries

  private async fallbackAlumniSearch(
    query: string,
    yearRange?: YearRange,
    options: SearchOptions = {}
  ): Promise<AlumniResult[]> {
    const { limit = 50, offset = 0 } = options;
    const searchTerm = `%${query}%`;

    let sql = `
      SELECT *, 1.0 as relevance_score 
      FROM alumni 
      WHERE full_name LIKE ? OR caption LIKE ? OR tags LIKE ? OR role LIKE ?
    `;

    const params = [searchTerm, searchTerm, searchTerm, searchTerm];

    if (yearRange) {
      sql += ` AND class_year BETWEEN ? AND ?`;
      params.push(yearRange.start, yearRange.end);
    }

    sql += ` ORDER BY full_name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rawResults = this.dbManager!.executeQuery(sql, params);
    return rawResults.map(row => this.formatAlumniResult(row));
  }

  private async fallbackPublicationsSearch(
    query: string,
    pubType?: string,
    options: SearchOptions = {}
  ): Promise<PublicationResult[]> {
    const { limit = 50, offset = 0 } = options;
    const searchTerm = `%${query}%`;

    let sql = `
      SELECT *, 1.0 as relevance_score 
      FROM publications 
      WHERE title LIKE ? OR description LIKE ? OR tags LIKE ?
    `;

    const params = [searchTerm, searchTerm, searchTerm];

    if (pubType) {
      sql += ` AND pub_name = ?`;
      params.push(pubType);
    }

    sql += ` ORDER BY title LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rawResults = this.dbManager!.executeQuery(sql, params);
    return rawResults.map(row => this.formatPublicationResult(row));
  }

  private async fallbackPhotosSearch(
    query: string,
    decade?: string,
    options: SearchOptions = {}
  ): Promise<PhotoResult[]> {
    const { limit = 50, offset = 0 } = options;
    const searchTerm = `%${query}%`;

    let sql = `
      SELECT *, 1.0 as relevance_score 
      FROM photos 
      WHERE title LIKE ? OR caption LIKE ? OR tags LIKE ? OR collection LIKE ?
    `;

    const params = [searchTerm, searchTerm, searchTerm, searchTerm];

    if (decade) {
      sql += ` AND year_or_decade LIKE ?`;
      params.push(`%${decade}%`);
    }

    sql += ` ORDER BY title LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rawResults = this.dbManager!.executeQuery(sql, params);
    return rawResults.map(row => this.formatPhotoResult(row));
  }

  private async fallbackFacultySearch(
    query: string,
    department?: string,
    options: SearchOptions = {}
  ): Promise<FacultyResult[]> {
    const { limit = 50, offset = 0 } = options;
    const searchTerm = `%${query}%`;

    let sql = `
      SELECT *, 1.0 as relevance_score 
      FROM faculty 
      WHERE full_name LIKE ? OR title LIKE ? OR department LIKE ?
    `;

    const params = [searchTerm, searchTerm, searchTerm];

    if (department) {
      sql += ` AND department = ?`;
      params.push(department);
    }

    sql += ` ORDER BY full_name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rawResults = this.dbManager!.executeQuery(sql, params);
    return rawResults.map(row => this.formatFacultyResult(row));
  }
}

// Export singleton instance
export const searchManager = new SearchManager(
  // This will be injected when the connection is established
  {} as DatabaseConnection
);