// Fallback Search System using LIKE queries when FTS5 fails
import { DatabaseManager } from './manager';
import { SearchResult, AlumniRecord, PublicationRecord, PhotoRecord, FacultyRecord } from './types';

export interface FallbackSearchOptions {
  limit?: number;
  offset?: number;
  caseSensitive?: boolean;
  exactMatch?: boolean;
  wordBoundary?: boolean;
  fuzzyThreshold?: number;
}

export class FallbackSearchManager {
  constructor(private dbManager: DatabaseManager) {}

  /**
   * Generate improved LIKE patterns for better matching
   */
  private generateSearchPatterns(query: string, options: FallbackSearchOptions): string[] {
    const { exactMatch = false, wordBoundary = false, caseSensitive = false } = options;
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    
    const patterns: string[] = [];
    
    if (exactMatch) {
      patterns.push(normalizedQuery);
    } else {
      // Standard wildcard pattern
      patterns.push(`%${normalizedQuery}%`);
      
      // Word boundary patterns for better name matching
      if (wordBoundary) {
        patterns.push(`${normalizedQuery}%`); // Starts with
        patterns.push(`% ${normalizedQuery}%`); // Word starts with
        patterns.push(`%${normalizedQuery} %`); // Word ends with
      }
      
      // Split query into words for multi-word matching
      const words = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
      if (words.length > 1) {
        // Each word as separate pattern
        words.forEach(word => {
          patterns.push(`%${word}%`);
        });
      }
    }
    
    return patterns;
  }

  /**
   * Calculate simple relevance score for fallback results
   */
  private calculateRelevanceScore(text: string, query: string, matchType: string): number {
    if (!text || !query) return 0;
    
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    
    let score = 0;
    
    // Exact match gets highest score
    if (normalizedText === normalizedQuery) {
      score = 100;
    }
    // Starts with query gets high score
    else if (normalizedText.startsWith(normalizedQuery)) {
      score = 80;
    }
    // Contains query gets medium score
    else if (normalizedText.includes(normalizedQuery)) {
      score = 60;
    }
    // Word boundary matches get bonus
    else if (normalizedText.includes(` ${normalizedQuery}`)) {
      score = 70;
    }
    
    // Adjust score based on match type
    switch (matchType) {
      case 'name': score += 20; break;
      case 'title': score += 15; break;
      case 'role': score += 10; break;
      case 'year': score += 5; break;
      default: break;
    }
    
    // Penalize very long texts (less relevant)
    if (text.length > 100) {
      score -= Math.min(20, (text.length - 100) / 10);
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Perform fallback search across all tables using LIKE queries
   */
  async searchAll(query: string, options: FallbackSearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 50, offset = 0, caseSensitive = false } = options;
    
    if (!query.trim()) {
      return [];
    }

    try {
      const results: SearchResult[] = [];
      
      // Search each table type
      const [alumniResults, publicationResults, photoResults, facultyResults] = await Promise.all([
        this.searchAlumni(query, { ...options, limit: Math.ceil(limit / 4) }),
        this.searchPublications(query, { ...options, limit: Math.ceil(limit / 4) }),
        this.searchPhotos(query, { ...options, limit: Math.ceil(limit / 4) }),
        this.searchFaculty(query, { ...options, limit: Math.ceil(limit / 4) })
      ]);

      results.push(...alumniResults, ...publicationResults, ...photoResults, ...facultyResults);
      
      // Sort by relevance (simple scoring based on match position and field importance)
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return results.slice(offset, offset + limit);
    } catch (error) {
      console.error('Fallback search failed:', error);
      throw new Error('Search system is currently unavailable');
    }
  }

  /**
   * Search alumni using LIKE queries with improved matching
   */
  async searchAlumni(query: string, options: FallbackSearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 25, caseSensitive = false } = options;
    const likePattern = caseSensitive ? `%${query}%` : `%${query.toLowerCase()}%`;
    
    try {
      const sql = `
        SELECT * FROM alumni 
        WHERE ${caseSensitive ? '' : 'LOWER('}full_name${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}role${caseSensitive ? '' : ')'} LIKE ?
           OR CAST(class_year AS TEXT) LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}tags${caseSensitive ? '' : ')'} LIKE ?
        ORDER BY 
          CASE 
            WHEN ${caseSensitive ? '' : 'LOWER('}full_name${caseSensitive ? '' : ')'} LIKE ? THEN 1
            WHEN ${caseSensitive ? '' : 'LOWER('}role${caseSensitive ? '' : ')'} LIKE ? THEN 2
            WHEN CAST(class_year AS TEXT) LIKE ? THEN 3
            ELSE 4
          END,
          full_name
        LIMIT ?
      `;

      const params = [
        likePattern, likePattern, `%${query}%`, likePattern,
        likePattern, likePattern, `%${query}%`,
        limit
      ];

      const rows = await this.dbManager.executeQuery(sql, params) as AlumniRecord[];
      
      return rows.map(row => this.createAlumniResult(row, query));
    } catch (error) {
      console.error('Alumni fallback search failed:', error);
      return [];
    }
  }

  /**
   * Search publications using LIKE queries
   */
  async searchPublications(query: string, options: FallbackSearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 25, caseSensitive = false } = options;
    const likePattern = caseSensitive ? `%${query}%` : `%${query.toLowerCase()}%`;
    
    try {
      const sql = `
        SELECT * FROM publications 
        WHERE ${caseSensitive ? '' : 'LOWER('}title${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}pub_name${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}description${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}volume_issue${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}tags${caseSensitive ? '' : ')'} LIKE ?
        ORDER BY 
          CASE 
            WHEN ${caseSensitive ? '' : 'LOWER('}title${caseSensitive ? '' : ')'} LIKE ? THEN 1
            WHEN ${caseSensitive ? '' : 'LOWER('}pub_name${caseSensitive ? '' : ')'} LIKE ? THEN 2
            WHEN ${caseSensitive ? '' : 'LOWER('}description${caseSensitive ? '' : ')'} LIKE ? THEN 3
            ELSE 4
          END,
          title
        LIMIT ?
      `;

      const params = [
        likePattern, likePattern, likePattern, likePattern, likePattern,
        likePattern, likePattern, likePattern,
        limit
      ];

      const rows = await this.dbManager.executeQuery(sql, params) as PublicationRecord[];
      
      return rows.map(row => this.createPublicationResult(row, query));
    } catch (error) {
      console.error('Publications fallback search failed:', error);
      return [];
    }
  }

  /**
   * Search photos using LIKE queries
   */
  async searchPhotos(query: string, options: FallbackSearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 25, caseSensitive = false } = options;
    const likePattern = caseSensitive ? `%${query}%` : `%${query.toLowerCase()}%`;
    
    try {
      const sql = `
        SELECT * FROM photos 
        WHERE ${caseSensitive ? '' : 'LOWER('}title${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}collection${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}caption${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}year_or_decade${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}tags${caseSensitive ? '' : ')'} LIKE ?
        ORDER BY 
          CASE 
            WHEN ${caseSensitive ? '' : 'LOWER('}title${caseSensitive ? '' : ')'} LIKE ? THEN 1
            WHEN ${caseSensitive ? '' : 'LOWER('}collection${caseSensitive ? '' : ')'} LIKE ? THEN 2
            WHEN ${caseSensitive ? '' : 'LOWER('}caption${caseSensitive ? '' : ')'} LIKE ? THEN 3
            ELSE 4
          END,
          title
        LIMIT ?
      `;

      const params = [
        likePattern, likePattern, likePattern, likePattern, likePattern,
        likePattern, likePattern, likePattern,
        limit
      ];

      const rows = await this.dbManager.executeQuery(sql, params) as PhotoRecord[];
      
      return rows.map(row => this.createPhotoResult(row, query));
    } catch (error) {
      console.error('Photos fallback search failed:', error);
      return [];
    }
  }

  /**
   * Search faculty using LIKE queries
   */
  async searchFaculty(query: string, options: FallbackSearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 25, caseSensitive = false } = options;
    const likePattern = caseSensitive ? `%${query}%` : `%${query.toLowerCase()}%`;
    
    try {
      const sql = `
        SELECT * FROM faculty 
        WHERE ${caseSensitive ? '' : 'LOWER('}full_name${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}title${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}department${caseSensitive ? '' : ')'} LIKE ?
           OR ${caseSensitive ? '' : 'LOWER('}email${caseSensitive ? '' : ')'} LIKE ?
        ORDER BY 
          CASE 
            WHEN ${caseSensitive ? '' : 'LOWER('}full_name${caseSensitive ? '' : ')'} LIKE ? THEN 1
            WHEN ${caseSensitive ? '' : 'LOWER('}department${caseSensitive ? '' : ')'} LIKE ? THEN 2
            WHEN ${caseSensitive ? '' : 'LOWER('}title${caseSensitive ? '' : ')'} LIKE ? THEN 3
            ELSE 4
          END,
          full_name
        LIMIT ?
      `;

      const params = [
        likePattern, likePattern, likePattern, likePattern,
        likePattern, likePattern, likePattern,
        limit
      ];

      const rows = await this.dbManager.executeQuery(sql, params) as FacultyRecord[];
      
      return rows.map(row => this.createFacultyResult(row, query));
    } catch (error) {
      console.error('Faculty fallback search failed:', error);
      return [];
    }
  }

  /**
   * Create alumni search result with relevance scoring
   */
  private createAlumniResult(record: AlumniRecord, query: string): SearchResult {
    const score = this.calculateRelevanceScore(
      query,
      [record.full_name, record.role || '', record.class_year.toString(), record.tags || '']
    );

    return {
      id: record.id.toString(),
      type: 'alumni',
      title: record.full_name,
      subtitle: `Class of ${record.class_year}${record.role ? ` • ${record.role}` : ''}`,
      thumbnailPath: record.composite_image_path || record.portrait_path,
      thumbnail: record.composite_image_path || record.portrait_path,
      relevanceScore: score,
      score: score,
      snippet: this.createSnippet(query, [record.full_name, record.role || '', record.tags || '']),
      metadata: {
        year: record.class_year,
        name: record.full_name,
        department: record.role,
        tags: record.tags ? record.tags.split(',').map(t => t.trim()) : []
      },
      data: record
    };
  }

  /**
   * Create publication search result with relevance scoring
   */
  private createPublicationResult(record: PublicationRecord, query: string): SearchResult {
    const score = this.calculateRelevanceScore(
      query,
      [record.title, record.pub_name, record.description || '', record.tags || '']
    );

    return {
      id: record.id.toString(),
      type: 'publication',
      title: record.title,
      subtitle: `${record.pub_name} • ${record.volume_issue}`,
      thumbnailPath: record.thumb_path,
      thumbnail: record.thumb_path,
      relevanceScore: score,
      score: score,
      snippet: this.createSnippet(query, [record.title, record.description || '', record.tags || '']),
      metadata: {
        year: record.issue_date ? new Date(record.issue_date).getFullYear() : undefined,
        author: record.pub_name,
        publicationType: record.pub_name,
        tags: record.tags ? record.tags.split(',').map(t => t.trim()) : []
      },
      data: record
    };
  }

  /**
   * Create photo search result with relevance scoring
   */
  private createPhotoResult(record: PhotoRecord, query: string): SearchResult {
    const score = this.calculateRelevanceScore(
      query,
      [record.title, record.collection, record.caption || '', record.tags || '']
    );

    return {
      id: record.id.toString(),
      type: 'photo',
      title: record.title,
      subtitle: `${record.collection} • ${record.year_or_decade}`,
      thumbnailPath: record.image_path,
      thumbnail: record.image_path,
      relevanceScore: score,
      score: score,
      snippet: this.createSnippet(query, [record.title, record.caption || '', record.tags || '']),
      metadata: {
        year: parseInt(record.year_or_decade) || undefined,
        department: record.collection,
        tags: record.tags ? record.tags.split(',').map(t => t.trim()) : []
      },
      data: record
    };
  }

  /**
   * Create faculty search result with relevance scoring
   */
  private createFacultyResult(record: FacultyRecord, query: string): SearchResult {
    const score = this.calculateRelevanceScore(
      query,
      [record.full_name, record.title, record.department, record.email || '']
    );

    return {
      id: record.id.toString(),
      type: 'faculty',
      title: record.full_name,
      subtitle: `${record.title}${record.department ? ` • ${record.department}` : ''}`,
      thumbnailPath: record.headshot_path,
      thumbnail: record.headshot_path,
      relevanceScore: score,
      score: score,
      snippet: this.createSnippet(query, [record.full_name, record.title, record.department]),
      metadata: {
        name: record.full_name,
        department: record.department,
        tags: [record.title, record.department].filter(Boolean)
      },
      data: record
    };
  }

  /**
   * Calculate relevance score based on query matches
   */
  private calculateRelevanceScore(query: string, fields: string[]): number {
    const queryLower = query.toLowerCase();
    let score = 0;
    
    fields.forEach((field, index) => {
      if (!field) return;
      
      const fieldLower = field.toLowerCase();
      
      // Exact match gets highest score
      if (fieldLower === queryLower) {
        score += 100 - (index * 10);
      }
      // Starts with query gets high score
      else if (fieldLower.startsWith(queryLower)) {
        score += 80 - (index * 10);
      }
      // Contains query gets medium score
      else if (fieldLower.includes(queryLower)) {
        score += 60 - (index * 10);
      }
      // Word boundary match gets good score
      else if (new RegExp(`\\b${queryLower}`, 'i').test(field)) {
        score += 70 - (index * 10);
      }
    });
    
    return Math.max(0, score);
  }

  /**
   * Create text snippet with query highlighting
   */
  private createSnippet(query: string, fields: string[], maxLength: number = 150): string {
    const queryLower = query.toLowerCase();
    
    // Find the field with the best match
    let bestField = '';
    let bestScore = 0;
    
    fields.forEach(field => {
      if (!field) return;
      
      const fieldLower = field.toLowerCase();
      let score = 0;
      
      if (fieldLower.includes(queryLower)) {
        score = fieldLower.indexOf(queryLower) === 0 ? 100 : 50;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestField = field;
      }
    });
    
    if (!bestField) {
      bestField = fields.find(f => f && f.length > 0) || '';
    }
    
    // Truncate and add ellipsis if needed
    if (bestField.length > maxLength) {
      const queryIndex = bestField.toLowerCase().indexOf(queryLower);
      if (queryIndex >= 0) {
        const start = Math.max(0, queryIndex - 50);
        const end = Math.min(bestField.length, start + maxLength);
        bestField = (start > 0 ? '...' : '') + bestField.slice(start, end) + (end < bestField.length ? '...' : '');
      } else {
        bestField = bestField.slice(0, maxLength) + '...';
      }
    }
    
    return bestField;
  }
}

export default FallbackSearchManager;