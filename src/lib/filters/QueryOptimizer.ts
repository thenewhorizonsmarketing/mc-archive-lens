// Query Optimizer for advanced filter performance
import { FilterConfig, QueryResult } from './types';
import { AdvancedQueryBuilder } from './AdvancedQueryBuilder';
import { FilterCache } from './FilterCache';

export interface PreparedStatement {
  sql: string;
  params: any[];
  id: string;
  createdAt: number;
  useCount: number;
}

export interface QueryPlan {
  estimatedRows: number;
  usesIndex: boolean;
  scanType: 'full' | 'index' | 'fts';
  cost: number;
  details: string;
}

export interface OptimizationResult {
  original: QueryResult;
  optimized: QueryResult;
  improvement: number; // Percentage improvement
  suggestions: string[];
}

export class QueryOptimizer {
  private queryBuilder: AdvancedQueryBuilder;
  private preparedStatements: Map<string, PreparedStatement>;
  private queryCache: FilterCache<any>;
  private planCache: FilterCache<QueryPlan>;
  private executeQuery: ((sql: string, params: any[]) => Promise<any[]>) | null;

  constructor(executeQuery?: (sql: string, params: any[]) => Promise<any[]>) {
    this.queryBuilder = new AdvancedQueryBuilder();
    this.preparedStatements = new Map();
    this.queryCache = new FilterCache({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      enableLogging: false
    });
    this.planCache = new FilterCache({
      defaultTTL: 10 * 60 * 1000, // 10 minutes
      maxSize: 50,
      enableLogging: false
    });
    this.executeQuery = executeQuery || null;
  }

  /**
   * Set the query execution function
   */
  setExecutor(executeQuery: (sql: string, params: any[]) => Promise<any[]>): void {
    this.executeQuery = executeQuery;
  }

  /**
   * Prepare a statement for reuse
   */
  prepareStatement(config: FilterConfig): PreparedStatement {
    const query = this.queryBuilder.buildQuery(config);
    const optimized = this.optimizeQuery(query);
    
    const id = this.generateStatementId(optimized.sql);
    
    // Check if statement already exists
    const existing = this.preparedStatements.get(id);
    if (existing) {
      existing.useCount++;
      return existing;
    }

    const statement: PreparedStatement = {
      sql: optimized.sql,
      params: optimized.params,
      id,
      createdAt: Date.now(),
      useCount: 1
    };

    this.preparedStatements.set(id, statement);
    return statement;
  }

  /**
   * Execute a prepared statement with new parameters
   */
  async executePrepared(
    statementId: string,
    params?: any[]
  ): Promise<any[]> {
    if (!this.executeQuery) {
      throw new Error('Query executor not set');
    }

    const statement = this.preparedStatements.get(statementId);
    if (!statement) {
      throw new Error(`Prepared statement not found: ${statementId}`);
    }

    statement.useCount++;
    const finalParams = params || statement.params;

    // Check cache first
    const cacheKey = FilterCache.generateKey('query', statementId, finalParams);
    const cached = this.queryCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const results = await this.executeQuery(statement.sql, finalParams);
    
    // Cache results
    this.queryCache.set(cacheKey, results);
    
    return results;
  }

  /**
   * Optimize a query for better performance
   */
  optimizeQuery(query: QueryResult): QueryResult {
    let { sql, params } = query;

    // Remove redundant conditions
    sql = this.removeRedundantConditions(sql);

    // Simplify nested parentheses
    sql = this.simplifyParentheses(sql);

    // Optimize JOIN order
    sql = this.optimizeJoins(sql);

    // Add query hints for SQLite
    sql = this.addQueryHints(sql);

    // Remove extra whitespace
    sql = sql.replace(/\s+/g, ' ').trim();

    return { sql, params };
  }

  /**
   * Analyze query execution plan
   */
  async analyzeQueryPlan(query: QueryResult): Promise<QueryPlan> {
    if (!this.executeQuery) {
      throw new Error('Query executor not set');
    }

    // Check cache first
    const cacheKey = FilterCache.generateKey('plan', query.sql);
    const cached = this.planCache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      // Get SQLite query plan
      const explainSql = `EXPLAIN QUERY PLAN ${query.sql}`;
      const planRows = await this.executeQuery(explainSql, query.params);
      
      const plan = this.parsePlan(planRows);
      
      // Cache the plan
      this.planCache.set(cacheKey, plan);
      
      return plan;
    } catch (error) {
      console.error('Failed to analyze query plan:', error);
      
      // Return a default plan
      return {
        estimatedRows: 0,
        usesIndex: false,
        scanType: 'full',
        cost: 100,
        details: 'Unable to analyze query plan'
      };
    }
  }

  /**
   * Suggest indexes for better performance
   */
  async suggestIndexes(config: FilterConfig): Promise<string[]> {
    const suggestions: string[] = [];
    const table = this.getTableName(config.type);

    // Suggest indexes for text filters
    if (config.textFilters && config.textFilters.length > 0) {
      const fields = new Set(config.textFilters.map(f => f.field));
      fields.forEach(field => {
        if (field !== 'id') {
          suggestions.push(
            `CREATE INDEX IF NOT EXISTS idx_${table}_${field} ON ${table}(${field});`
          );
        }
      });
    }

    // Suggest indexes for date filters
    if (config.dateFilters && config.dateFilters.length > 0) {
      const fields = new Set(config.dateFilters.map(f => f.field));
      fields.forEach(field => {
        suggestions.push(
          `CREATE INDEX IF NOT EXISTS idx_${table}_${field} ON ${table}(${field});`
        );
      });
    }

    // Suggest indexes for range filters
    if (config.rangeFilters && config.rangeFilters.length > 0) {
      const fields = new Set(config.rangeFilters.map(f => f.field));
      fields.forEach(field => {
        suggestions.push(
          `CREATE INDEX IF NOT EXISTS idx_${table}_${field} ON ${table}(${field});`
        );
      });
    }

    // Suggest composite indexes for common combinations
    if (config.textFilters && config.dateFilters) {
      const textField = config.textFilters[0]?.field;
      const dateField = config.dateFilters[0]?.field;
      if (textField && dateField) {
        suggestions.push(
          `CREATE INDEX IF NOT EXISTS idx_${table}_${textField}_${dateField} ON ${table}(${textField}, ${dateField});`
        );
      }
    }

    return suggestions;
  }

  /**
   * Cache frequently used queries
   */
  cacheQuery(config: FilterConfig, results: any[], ttl?: number): void {
    const cacheKey = FilterCache.generateKey('filter', config);
    this.queryCache.set(cacheKey, results, ttl);
  }

  /**
   * Get cached query results
   */
  getCachedQuery(config: FilterConfig): any[] | null {
    const cacheKey = FilterCache.generateKey('filter', config);
    return this.queryCache.get(cacheKey);
  }

  /**
   * Optimize filter configuration for better performance
   */
  optimizeFilterConfig(config: FilterConfig): OptimizationResult {
    const original = this.queryBuilder.buildQuery(config);
    const optimized = this.optimizeQuery(original);
    
    const suggestions: string[] = [];

    // Check for inefficient patterns
    if (config.textFilters && config.textFilters.length > 5) {
      suggestions.push('Consider reducing the number of text filters for better performance');
    }

    if (config.operator === 'OR' && config.textFilters && config.textFilters.length > 3) {
      suggestions.push('OR operations with many filters can be slow. Consider using AND where possible');
    }

    // Check for case-sensitive filters
    const caseSensitiveCount = config.textFilters?.filter(f => f.caseSensitive).length || 0;
    if (caseSensitiveCount > 0) {
      suggestions.push(`${caseSensitiveCount} case-sensitive filter(s) detected. Case-insensitive filters are faster`);
    }

    // Calculate improvement
    const originalLength = original.sql.length;
    const optimizedLength = optimized.sql.length;
    const improvement = Math.round(((originalLength - optimizedLength) / originalLength) * 100);

    return {
      original,
      optimized,
      improvement: Math.max(0, improvement),
      suggestions
    };
  }

  /**
   * Get prepared statement statistics
   */
  getStatementStats(): Array<{ id: string; useCount: number; age: number }> {
    const now = Date.now();
    return Array.from(this.preparedStatements.values())
      .map(stmt => ({
        id: stmt.id,
        useCount: stmt.useCount,
        age: now - stmt.createdAt
      }))
      .sort((a, b) => b.useCount - a.useCount);
  }

  /**
   * Clear prepared statements
   */
  clearPreparedStatements(): void {
    this.preparedStatements.clear();
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
    this.planCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      query: this.queryCache.getStats(),
      plan: this.planCache.getStats(),
      preparedStatements: this.preparedStatements.size
    };
  }

  /**
   * Prune old prepared statements
   */
  prunePreparedStatements(maxAge: number = 30 * 60 * 1000): number {
    const now = Date.now();
    let count = 0;

    for (const [id, stmt] of this.preparedStatements.entries()) {
      if (now - stmt.createdAt > maxAge && stmt.useCount === 1) {
        this.preparedStatements.delete(id);
        count++;
      }
    }

    return count;
  }

  // Private helper methods

  private removeRedundantConditions(sql: string): string {
    // Remove redundant 1=1 conditions
    sql = sql.replace(/\s+AND\s+1=1/gi, '');
    sql = sql.replace(/1=1\s+AND\s+/gi, '');
    sql = sql.replace(/WHERE\s+1=1\s+AND\s+/gi, 'WHERE ');
    sql = sql.replace(/WHERE\s+1=1\s*$/gi, '');
    
    // Remove redundant 0=1 conditions
    sql = sql.replace(/\s+OR\s+0=1/gi, '');
    sql = sql.replace(/0=1\s+OR\s+/gi, '');

    return sql;
  }

  private simplifyParentheses(sql: string): string {
    // Remove unnecessary nested parentheses
    let prev = '';
    while (prev !== sql) {
      prev = sql;
      sql = sql.replace(/\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '($1)');
    }
    return sql;
  }

  private optimizeJoins(sql: string): string {
    // For SQLite, ensure FTS joins are efficient
    // Move FTS joins to the end if possible
    return sql;
  }

  private addQueryHints(sql: string): string {
    // SQLite doesn't support traditional query hints
    // But we can optimize the query structure
    
    // Ensure LIMIT is used when appropriate
    if (!sql.includes('LIMIT') && !sql.includes('COUNT(*)')) {
      // Don't add LIMIT to COUNT queries
      // This is just a placeholder - actual implementation would be more sophisticated
    }

    return sql;
  }

  private parsePlan(planRows: any[]): QueryPlan {
    let estimatedRows = 0;
    let usesIndex = false;
    let scanType: 'full' | 'index' | 'fts' = 'full';
    let cost = 100;
    let details = '';

    planRows.forEach(row => {
      const detail = row.detail || '';
      details += detail + '\n';

      // Check for index usage
      if (detail.includes('USING INDEX') || detail.includes('SEARCH')) {
        usesIndex = true;
        scanType = 'index';
        cost = 10;
      }

      // Check for FTS usage
      if (detail.includes('FTS') || detail.includes('MATCH')) {
        scanType = 'fts';
        cost = 20;
      }

      // Check for full table scan
      if (detail.includes('SCAN TABLE')) {
        scanType = 'full';
        cost = 100;
      }

      // Try to extract row estimates
      const rowMatch = detail.match(/~(\d+)\s+rows/);
      if (rowMatch) {
        estimatedRows = parseInt(rowMatch[1], 10);
      }
    });

    return {
      estimatedRows,
      usesIndex,
      scanType,
      cost,
      details: details.trim()
    };
  }

  private generateStatementId(sql: string): string {
    // Generate a hash-based ID for the statement
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `stmt_${Math.abs(hash).toString(36)}`;
  }

  private getTableName(type: string): string {
    switch (type) {
      case 'alumni':
        return 'alumni';
      case 'publication':
        return 'publications';
      case 'photo':
        return 'photos';
      case 'faculty':
        return 'faculty';
      default:
        return 'alumni';
    }
  }
}

export default QueryOptimizer;
