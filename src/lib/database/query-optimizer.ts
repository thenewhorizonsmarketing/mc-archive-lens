// Query Optimizer for Performance Enhancement
import { DatabaseManager } from './manager';
import { SearchFilters } from './types';

export interface QueryOptimizationConfig {
  enableQueryCache: boolean;
  cacheSize: number;
  cacheTTL: number;
  enableQueryPlan: boolean;
  enableIndexHints: boolean;
  maxResultLimit: number;
}

export interface QueryPlan {
  query: string;
  estimatedCost: number;
  indexesUsed: string[];
  optimizations: string[];
  executionTime?: number;
}

export interface OptimizedQuery {
  sql: string;
  params: any[];
  plan: QueryPlan;
  cacheKey?: string;
}

export class QueryOptimizer {
  private config: QueryOptimizationConfig;
  private queryCache: Map<string, { result: any; timestamp: number }> = new Map();
  private queryStats: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  constructor(config: Partial<QueryOptimizationConfig> = {}) {
    this.config = {
      enableQueryCache: true,
      cacheSize: 1000,
      cacheTTL: 300000, // 5 minutes
      enableQueryPlan: true,
      enableIndexHints: true,
      maxResultLimit: 1000,
      ...config
    };
  }

  /**
   * Optimize a search query for better performance
   */
  optimizeSearchQuery(
    query: string,
    filters: SearchFilters = {},
    options: { limit?: number; offset?: number } = {}
  ): OptimizedQuery {
    const { limit = 50, offset = 0 } = options;
    
    // Sanitize and prepare query
    const sanitizedQuery = this.sanitizeQuery(query);
    
    // Build optimized SQL based on query type
    let sql: string;
    let params: any[];
    let plan: QueryPlan;

    if (this.shouldUseFTS5(sanitizedQuery, filters)) {
      ({ sql, params, plan } = this.buildFTS5Query(sanitizedQuery, filters, limit, offset));
    } else {
      ({ sql, params, plan } = this.buildLikeQuery(sanitizedQuery, filters, limit, offset));
    }

    // Generate cache key
    const cacheKey = this.config.enableQueryCache 
      ? this.generateCacheKey(sql, params)
      : undefined;

    return {
      sql,
      params,
      plan,
      cacheKey
    };
  }

  /**
   * Execute optimized query with caching
   */
  async executeOptimizedQuery(
    dbManager: DatabaseManager,
    optimizedQuery: OptimizedQuery
  ): Promise<any[]> {
    const { sql, params, cacheKey } = optimizedQuery;
    
    // Check cache first
    if (cacheKey && this.config.enableQueryCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Execute query with timing
    const startTime = performance.now();
    const result = await dbManager.executeQuery(sql, params);
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Update query plan with actual execution time
    optimizedQuery.plan.executionTime = executionTime;

    // Update statistics
    this.updateQueryStats(sql, executionTime);

    // Cache result
    if (cacheKey && this.config.enableQueryCache) {
      this.setCache(cacheKey, result);
    }

    return result;
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): Array<{
    query: string;
    count: number;
    totalTime: number;
    avgTime: number;
  }> {
    return Array.from(this.queryStats.entries()).map(([query, stats]) => ({
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      ...stats
    }));
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  } {
    // This would be implemented with proper hit/miss tracking
    return {
      size: this.queryCache.size,
      maxSize: this.config.cacheSize,
      hitRate: 0.85, // Mock value
      totalHits: 0,
      totalMisses: 0
    };
  }

  /**
   * Determine if FTS5 should be used for this query
   */
  private shouldUseFTS5(query: string, filters: SearchFilters): boolean {
    // Use FTS5 for complex text searches
    if (query.length >= 3 && /[a-zA-Z]/.test(query)) {
      return true;
    }

    // Use LIKE for simple patterns or when FTS5 might not be optimal
    if (query.includes('%') || query.includes('_')) {
      return false;
    }

    // Use FTS5 for filtered searches
    if (Object.keys(filters).length > 0) {
      return true;
    }

    return query.length >= 2;
  }

  /**
   * Build optimized FTS5 query
   */
  private buildFTS5Query(
    query: string,
    filters: SearchFilters,
    limit: number,
    offset: number
  ): { sql: string; params: any[]; plan: QueryPlan } {
    const ftsQuery = this.buildFTSQueryString(query);
    const params: any[] = [];
    const whereClauses: string[] = [];
    const joinClauses: string[] = [];
    const indexesUsed: string[] = ['fts_search_index'];
    const optimizations: string[] = ['FTS5 full-text search'];

    // Build filter conditions
    if (filters.yearRange) {
      whereClauses.push('year BETWEEN ? AND ?');
      params.push(filters.yearRange.start, filters.yearRange.end);
      optimizations.push('Year range filter');
    }

    if (filters.publicationType) {
      whereClauses.push('type = ?');
      params.push(filters.publicationType);
      optimizations.push('Type filter');
    }

    if (filters.department) {
      whereClauses.push('department = ?');
      params.push(filters.department);
      optimizations.push('Department filter');
    }

    // Build the main query
    let sql = `
      SELECT DISTINCT 
        id, type, title, subtitle, thumbnail_path, relevance_score, metadata
      FROM search_view 
      WHERE search_view MATCH ?
    `;
    params.unshift(ftsQuery);

    // Add filter conditions
    if (whereClauses.length > 0) {
      sql += ' AND ' + whereClauses.join(' AND ');
    }

    // Add ordering and limits
    sql += ' ORDER BY rank, relevance_score DESC';
    
    if (limit > 0) {
      sql += ' LIMIT ?';
      params.push(Math.min(limit, this.config.maxResultLimit));
      
      if (offset > 0) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }

    const plan: QueryPlan = {
      query: sql,
      estimatedCost: this.estimateQueryCost('fts5', query, filters),
      indexesUsed,
      optimizations
    };

    return { sql, params, plan };
  }

  /**
   * Build optimized LIKE query for fallback
   */
  private buildLikeQuery(
    query: string,
    filters: SearchFilters,
    limit: number,
    offset: number
  ): { sql: string; params: any[]; plan: QueryPlan } {
    const likePattern = `%${query}%`;
    const params: any[] = [];
    const whereClauses: string[] = [];
    const indexesUsed: string[] = [];
    const optimizations: string[] = ['LIKE pattern matching'];

    // Build search conditions for each table
    const searchConditions = [
      '(type = "alumni" AND (full_name LIKE ? OR role LIKE ? OR tags LIKE ?))',
      '(type = "publication" AND (title LIKE ? OR description LIKE ? OR tags LIKE ?))',
      '(type = "photo" AND (title LIKE ? OR caption LIKE ? OR tags LIKE ?))',
      '(type = "faculty" AND (full_name LIKE ? OR title LIKE ? OR department LIKE ?))'
    ];

    // Add LIKE parameters for each condition
    searchConditions.forEach(() => {
      params.push(likePattern, likePattern, likePattern);
    });

    // Build filter conditions
    if (filters.yearRange) {
      whereClauses.push('year BETWEEN ? AND ?');
      params.push(filters.yearRange.start, filters.yearRange.end);
      indexesUsed.push('idx_year');
      optimizations.push('Year range filter with index');
    }

    if (filters.publicationType) {
      whereClauses.push('type = ?');
      params.push(filters.publicationType);
      indexesUsed.push('idx_type');
      optimizations.push('Type filter with index');
    }

    // Build the main query
    let sql = `
      SELECT DISTINCT 
        id, type, title, subtitle, thumbnail_path, 
        CASE 
          WHEN title LIKE ? THEN 100
          WHEN subtitle LIKE ? THEN 80
          ELSE 60
        END as relevance_score,
        metadata
      FROM unified_search_view 
      WHERE (${searchConditions.join(' OR ')})
    `;

    // Add relevance scoring parameters
    params.unshift(likePattern, likePattern);

    // Add filter conditions
    if (whereClauses.length > 0) {
      sql += ' AND ' + whereClauses.join(' AND ');
    }

    // Add ordering and limits
    sql += ' ORDER BY relevance_score DESC, title ASC';
    
    if (limit > 0) {
      sql += ' LIMIT ?';
      params.push(Math.min(limit, this.config.maxResultLimit));
      
      if (offset > 0) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }

    const plan: QueryPlan = {
      query: sql,
      estimatedCost: this.estimateQueryCost('like', query, filters),
      indexesUsed,
      optimizations
    };

    return { sql, params, plan };
  }

  /**
   * Build FTS5 query string with proper escaping
   */
  private buildFTSQueryString(query: string): string {
    // Remove special FTS5 characters that could cause issues
    let ftsQuery = query.replace(/[^\w\s-]/g, ' ');
    
    // Split into terms and handle each
    const terms = ftsQuery.split(/\s+/).filter(term => term.length > 0);
    
    if (terms.length === 0) {
      return '""'; // Empty query
    }

    if (terms.length === 1) {
      return `"${terms[0]}"*`; // Single term with prefix matching
    }

    // Multiple terms - use AND logic with prefix matching on last term
    const quotedTerms = terms.slice(0, -1).map(term => `"${term}"`);
    const lastTerm = `"${terms[terms.length - 1]}"*`;
    
    return quotedTerms.concat(lastTerm).join(' AND ');
  }

  /**
   * Sanitize query input
   */
  private sanitizeQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Remove potentially dangerous characters
    return query
      .trim()
      .replace(/[<>]/g, '') // Remove HTML-like characters
      .replace(/[;]/g, '') // Remove SQL statement terminators
      .substring(0, 200); // Limit length
  }

  /**
   * Estimate query cost for optimization decisions
   */
  private estimateQueryCost(
    queryType: 'fts5' | 'like',
    query: string,
    filters: SearchFilters
  ): number {
    let cost = 0;

    // Base cost by query type
    if (queryType === 'fts5') {
      cost += 10; // FTS5 is generally faster
    } else {
      cost += 50; // LIKE queries are more expensive
    }

    // Query complexity cost
    const terms = query.split(/\s+/).length;
    cost += terms * 5;

    // Filter cost
    cost += Object.keys(filters).length * 10;

    // Pattern matching cost for LIKE queries
    if (queryType === 'like' && query.length < 3) {
      cost += 100; // Short patterns are expensive
    }

    return cost;
  }

  /**
   * Generate cache key for query
   */
  private generateCacheKey(sql: string, params: any[]): string {
    const key = sql + JSON.stringify(params);
    return btoa(key).substring(0, 32); // Base64 encode and truncate
  }

  /**
   * Get result from cache
   */
  private getFromCache(cacheKey: string): any[] | null {
    const cached = this.queryCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > this.config.cacheTTL) {
      this.queryCache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  /**
   * Set result in cache
   */
  private setCache(cacheKey: string, result: any[]): void {
    // Remove oldest entries if cache is full
    if (this.queryCache.size >= this.config.cacheSize) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(cacheKey, {
      result: [...result], // Clone to prevent mutations
      timestamp: Date.now()
    });
  }

  /**
   * Update query statistics
   */
  private updateQueryStats(sql: string, executionTime: number): void {
    const queryKey = sql.substring(0, 100); // Truncate for grouping
    const existing = this.queryStats.get(queryKey);

    if (existing) {
      existing.count++;
      existing.totalTime += executionTime;
      existing.avgTime = existing.totalTime / existing.count;
    } else {
      this.queryStats.set(queryKey, {
        count: 1,
        totalTime: executionTime,
        avgTime: executionTime
      });
    }
  }
}

export default QueryOptimizer;