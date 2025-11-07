// Query Builder for FTS5 search queries
import { SearchFilters, YearRange } from './types';

export interface QueryOptions {
  useBoolean?: boolean;
  usePhraseSearch?: boolean;
  useWildcards?: boolean;
  fieldWeights?: Record<string, number>;
}

export class QueryBuilder {
  /**
   * Build FTS5 query with proper escaping and operators
   */
  static buildFTS5Query(query: string, options: QueryOptions = {}): string {
    if (!query || query.trim().length === 0) {
      return '';
    }

    const {
      useBoolean = true,
      usePhraseSearch = true,
      useWildcards = true
    } = options;

    let sanitized = query.trim();

    // Handle phrase searches (quoted strings)
    if (usePhraseSearch && sanitized.includes('"')) {
      return this.sanitizeForFTS5(sanitized);
    }

    // Handle boolean operators
    if (useBoolean && this.containsBooleanOperators(sanitized)) {
      return this.processBooleanQuery(sanitized);
    }

    // Handle multi-word queries
    const words = sanitized.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 1) {
      const word = this.sanitizeWord(words[0]);
      return useWildcards && !word.includes('*') ? `${word}*` : word;
    }

    // Multi-word OR search for better recall
    return words
      .map(word => {
        const sanitizedWord = this.sanitizeWord(word);
        return useWildcards && !sanitizedWord.includes('*') 
          ? `"${sanitizedWord}"` 
          : `"${sanitizedWord}"`;
      })
      .join(' OR ');
  }

  /**
   * Build field-specific FTS5 query
   */
  static buildFieldQuery(query: string, field: string, options: QueryOptions = {}): string {
    const baseQuery = this.buildFTS5Query(query, options);
    if (!baseQuery) return '';

    return `${field}:${baseQuery}`;
  }

  /**
   * Build weighted query for multiple fields
   */
  static buildWeightedQuery(
    query: string, 
    fieldWeights: Record<string, number>,
    options: QueryOptions = {}
  ): string {
    const baseQuery = this.buildFTS5Query(query, options);
    if (!baseQuery) return '';

    const weightedQueries = Object.entries(fieldWeights)
      .map(([field, weight]) => {
        const fieldQuery = `${field}:${baseQuery}`;
        return weight > 1 ? `(${fieldQuery})^${weight}` : fieldQuery;
      });

    return weightedQueries.join(' OR ');
  }

  /**
   * Build complex search query with filters
   */
  static buildComplexQuery(
    query: string,
    table: string,
    filters?: SearchFilters,
    options: QueryOptions = {}
  ): { sql: string; params: any[] } {
    const ftsQuery = this.buildFTS5Query(query, options);
    const params: any[] = [ftsQuery];

    let sql = `
      SELECT 
        t.*,
        bm25(${table}_fts) as relevance_score
      FROM ${table}_fts f
      JOIN ${table} t ON t.id = f.rowid
      WHERE ${table}_fts MATCH ?
    `;

    // Add table-specific filters
    switch (table) {
      case 'alumni':
        if (filters?.yearRange) {
          sql += ` AND t.class_year BETWEEN ? AND ?`;
          params.push(filters.yearRange.start, filters.yearRange.end);
        }
        break;

      case 'publications':
        if (filters?.publicationType) {
          sql += ` AND t.pub_name = ?`;
          params.push(filters.publicationType);
        }
        break;

      case 'photos':
        if (filters?.decade) {
          sql += ` AND t.year_or_decade LIKE ?`;
          params.push(`%${filters.decade}%`);
        }
        break;

      case 'faculty':
        if (filters?.department) {
          sql += ` AND t.department = ?`;
          params.push(filters.department);
        }
        break;
    }

    return { sql, params };
  }

  /**
   * Build suggestion query for autocomplete
   */
  static buildSuggestionQuery(
    query: string,
    table: string,
    field: string,
    limit: number = 5
  ): { sql: string; params: any[] } {
    const searchTerm = `${query.trim()}%`;
    
    const sql = `
      SELECT DISTINCT ${field} as suggestion
      FROM ${table}
      WHERE ${field} LIKE ?
      ORDER BY ${field}
      LIMIT ?
    `;

    return { sql, params: [searchTerm, limit] };
  }

  /**
   * Build aggregation query for faceted search
   */
  static buildFacetQuery(
    query: string,
    table: string,
    facetField: string,
    limit: number = 10
  ): { sql: string; params: any[] } {
    const ftsQuery = this.buildFTS5Query(query);
    
    const sql = `
      SELECT 
        t.${facetField} as facet_value,
        COUNT(*) as count
      FROM ${table}_fts f
      JOIN ${table} t ON t.id = f.rowid
      WHERE ${table}_fts MATCH ?
      GROUP BY t.${facetField}
      ORDER BY count DESC, facet_value ASC
      LIMIT ?
    `;

    return { sql, params: [ftsQuery, limit] };
  }

  /**
   * Build query for similar items (based on tags or content)
   */
  static buildSimilarItemsQuery(
    itemId: number,
    table: string,
    limit: number = 5
  ): { sql: string; params: any[] } {
    // This is a simplified similarity search based on shared tags
    const sql = `
      SELECT 
        t2.*,
        (
          LENGTH(t1.tags) + LENGTH(t2.tags) - LENGTH(REPLACE(t1.tags || ',' || t2.tags, ',', ''))
        ) as similarity_score
      FROM ${table} t1
      JOIN ${table} t2 ON t2.id != t1.id
      WHERE t1.id = ? AND t1.tags IS NOT NULL AND t2.tags IS NOT NULL
      ORDER BY similarity_score DESC
      LIMIT ?
    `;

    return { sql, params: [itemId, limit] };
  }

  // Private helper methods

  private static containsBooleanOperators(query: string): boolean {
    return /\b(AND|OR|NOT)\b/i.test(query);
  }

  private static processBooleanQuery(query: string): string {
    // Normalize boolean operators for FTS5
    return query
      .replace(/\bAND\b/gi, ' AND ')
      .replace(/\bOR\b/gi, ' OR ')
      .replace(/\bNOT\b/gi, ' NOT ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static sanitizeForFTS5(query: string): string {
    // Escape FTS5 special characters but preserve quotes for phrase search
    return query
      .replace(/([(){}[\]^~*?\\])/g, '\\$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static sanitizeWord(word: string): string {
    // Remove FTS5 special characters from individual words
    return word
      .replace(/[^\w\-']/g, '')
      .trim();
  }

  /**
   * Validate FTS5 query syntax
   */
  static validateQuery(query: string): { isValid: boolean; error?: string } {
    if (!query || query.trim().length === 0) {
      return { isValid: false, error: 'Query cannot be empty' };
    }

    // Check for unmatched quotes
    const quoteCount = (query.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      return { isValid: false, error: 'Unmatched quotes in query' };
    }

    // Check for invalid characters that could break FTS5
    if (/[{}[\]^~\\]/.test(query)) {
      return { isValid: false, error: 'Query contains invalid characters' };
    }

    // Check for malformed boolean expressions
    if (/\b(AND|OR|NOT)\s*(AND|OR|NOT)\b/i.test(query)) {
      return { isValid: false, error: 'Malformed boolean expression' };
    }

    return { isValid: true };
  }

  /**
   * Get query complexity score (for performance optimization)
   */
  static getQueryComplexity(query: string): number {
    let complexity = 0;

    // Base complexity
    complexity += query.length * 0.1;

    // Boolean operators add complexity
    const booleanMatches = query.match(/\b(AND|OR|NOT)\b/gi);
    if (booleanMatches) {
      complexity += booleanMatches.length * 2;
    }

    // Phrase searches add complexity
    const phraseMatches = query.match(/"/g);
    if (phraseMatches) {
      complexity += (phraseMatches.length / 2) * 1.5;
    }

    // Wildcards add complexity
    const wildcardMatches = query.match(/\*/g);
    if (wildcardMatches) {
      complexity += wildcardMatches.length * 1.2;
    }

    return Math.round(complexity);
  }

  /**
   * Optimize query for better performance
   */
  static optimizeQuery(query: string, maxComplexity: number = 50): string {
    const complexity = this.getQueryComplexity(query);
    
    if (complexity <= maxComplexity) {
      return query;
    }

    // Simplify complex queries
    let optimized = query;

    // Remove excessive wildcards
    optimized = optimized.replace(/\*+/g, '*');

    // Limit the number of OR clauses
    const orParts = optimized.split(' OR ');
    if (orParts.length > 10) {
      optimized = orParts.slice(0, 10).join(' OR ');
    }

    // Truncate very long queries
    if (optimized.length > 200) {
      optimized = optimized.substring(0, 200).trim();
    }

    return optimized;
  }
}

export default QueryBuilder;