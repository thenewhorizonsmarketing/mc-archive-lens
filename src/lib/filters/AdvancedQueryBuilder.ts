// Advanced Query Builder for complex filter combinations
import {
  FilterConfig,
  FilterNode,
  TextFilter,
  DateFilter,
  RangeFilter,
  BooleanFilter,
  CustomFilter,
  QueryResult,
  FilterOperator
} from './types';

export class AdvancedQueryBuilder {
  /**
   * Build complex SQL query from filter configuration
   */
  buildQuery(config: FilterConfig): QueryResult {
    const params: any[] = [];
    const conditions: string[] = [];

    // Build base FTS query if text filters exist
    const ftsCondition = this.buildFTSCondition(config, params);
    if (ftsCondition) {
      conditions.push(ftsCondition);
    }

    // Add text filters
    if (config.textFilters && config.textFilters.length > 0) {
      const textConditions = config.textFilters.map(filter =>
        this.buildTextFilterCondition(filter, params)
      );
      conditions.push(...textConditions);
    }

    // Add date filters
    if (config.dateFilters && config.dateFilters.length > 0) {
      const dateConditions = config.dateFilters.map(filter =>
        this.buildDateFilterCondition(filter, params)
      );
      conditions.push(...dateConditions);
    }

    // Add range filters
    if (config.rangeFilters && config.rangeFilters.length > 0) {
      const rangeConditions = config.rangeFilters.map(filter =>
        this.buildRangeFilterCondition(filter, params)
      );
      conditions.push(...rangeConditions);
    }

    // Add boolean filters
    if (config.booleanFilters && config.booleanFilters.length > 0) {
      const booleanConditions = config.booleanFilters.map(filter =>
        this.buildBooleanFilterCondition(filter, params)
      );
      conditions.push(...booleanConditions);
    }

    // Add custom filters
    if (config.customFilters && config.customFilters.length > 0) {
      const customConditions = config.customFilters.map(filter =>
        this.buildCustomFilterCondition(filter, params)
      );
      conditions.push(...customConditions);
    }

    // Combine conditions with operator
    const whereClause = conditions.length > 0
      ? conditions.join(` ${config.operator} `)
      : '1=1';

    // Build final SQL query
    const table = this.getTableName(config.type);
    const sql = `
      SELECT 
        t.*,
        ${ftsCondition ? `bm25(${table}_fts) as relevance_score` : '0 as relevance_score'}
      FROM ${table} t
      ${ftsCondition ? `JOIN ${table}_fts f ON t.id = f.rowid` : ''}
      WHERE ${whereClause}
      ORDER BY ${ftsCondition ? 'relevance_score ASC' : 't.id DESC'}
    `.trim();

    return { sql, params };
  }

  /**
   * Build query from visual filter builder nodes
   */
  buildQueryFromNodes(rootNode: FilterNode, contentType: string): QueryResult {
    const params: any[] = [];
    const condition = this.buildNodeCondition(rootNode, params);
    
    const table = this.getTableName(contentType as any);
    const sql = `
      SELECT 
        t.*,
        0 as relevance_score
      FROM ${table} t
      WHERE ${condition || '1=1'}
      ORDER BY t.id DESC
    `.trim();

    return { sql, params };
  }

  /**
   * Optimize query for better performance
   */
  optimizeQuery(query: QueryResult): QueryResult {
    let { sql, params } = query;

    // Remove redundant conditions
    sql = sql.replace(/\s+AND\s+1=1/gi, '');
    sql = sql.replace(/1=1\s+AND\s+/gi, '');
    sql = sql.replace(/\s+OR\s+0=1/gi, '');
    sql = sql.replace(/0=1\s+OR\s+/gi, '');

    // Simplify nested parentheses
    sql = sql.replace(/\(\s*\(\s*([^()]+)\s*\)\s*\)/g, '($1)');

    // Remove extra whitespace
    sql = sql.replace(/\s+/g, ' ').trim();

    return { sql, params };
  }

  /**
   * Generate shareable URL from filter configuration
   */
  generateShareableURL(config: FilterConfig, baseUrl: string = ''): string {
    const encoded = btoa(JSON.stringify(config));
    return `${baseUrl}?filters=${encodeURIComponent(encoded)}`;
  }

  /**
   * Parse shareable URL to restore filter configuration
   */
  parseSharedURL(url: string): FilterConfig | null {
    try {
      const urlObj = new URL(url);
      const filtersParam = urlObj.searchParams.get('filters');
      
      if (!filtersParam) {
        return null;
      }

      const decoded = atob(decodeURIComponent(filtersParam));
      return JSON.parse(decoded) as FilterConfig;
    } catch (error) {
      console.error('Failed to parse shared URL:', error);
      return null;
    }
  }

  /**
   * Estimate result count for filter configuration
   */
  async estimateResultCount(
    config: FilterConfig,
    executeQuery: (sql: string, params: any[]) => Promise<any[]>
  ): Promise<number> {
    const { sql, params } = this.buildQuery(config);
    
    // Convert to COUNT query
    const countSql = sql.replace(
      /SELECT\s+.*?\s+FROM/is,
      'SELECT COUNT(*) as count FROM'
    ).replace(/ORDER BY.*$/is, '');

    try {
      const result = await executeQuery(countSql, params);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Failed to estimate result count:', error);
      return 0;
    }
  }

  // Private helper methods

  private buildFTSCondition(config: FilterConfig, params: any[]): string | null {
    // Check if we need FTS search (text filters with contains/startsWith/endsWith)
    const needsFTS = config.textFilters?.some(
      f => f.matchType !== 'equals'
    );

    if (!needsFTS) {
      return null;
    }

    const table = this.getTableName(config.type);
    const ftsTerms: string[] = [];

    config.textFilters?.forEach(filter => {
      if (filter.matchType !== 'equals' && filter.value) {
        let term = filter.value;
        
        if (filter.matchType === 'startsWith') {
          term = `${term}*`;
        } else if (filter.matchType === 'contains') {
          term = `*${term}*`;
        } else if (filter.matchType === 'endsWith') {
          term = `*${term}`;
        }

        ftsTerms.push(`${filter.field}:${term}`);
      }
    });

    if (ftsTerms.length === 0) {
      return null;
    }

    const ftsQuery = ftsTerms.join(` ${config.operator} `);
    params.unshift(ftsQuery);
    return `${table}_fts MATCH ?`;
  }

  private buildTextFilterCondition(filter: TextFilter, params: any[]): string {
    const field = `t.${filter.field}`;
    
    switch (filter.matchType) {
      case 'equals':
        params.push(filter.value);
        return filter.caseSensitive
          ? `${field} = ?`
          : `LOWER(${field}) = LOWER(?)`;
      
      case 'contains':
        params.push(`%${filter.value}%`);
        return filter.caseSensitive
          ? `${field} LIKE ?`
          : `LOWER(${field}) LIKE LOWER(?)`;
      
      case 'startsWith':
        params.push(`${filter.value}%`);
        return filter.caseSensitive
          ? `${field} LIKE ?`
          : `LOWER(${field}) LIKE LOWER(?)`;
      
      case 'endsWith':
        params.push(`%${filter.value}`);
        return filter.caseSensitive
          ? `${field} LIKE ?`
          : `LOWER(${field}) LIKE LOWER(?)`;
      
      default:
        params.push(`%${filter.value}%`);
        return `LOWER(${field}) LIKE LOWER(?)`;
    }
  }

  private buildDateFilterCondition(filter: DateFilter, params: any[]): string {
    const field = `t.${filter.field}`;
    const conditions: string[] = [];

    // Handle presets
    if (filter.preset && filter.preset !== 'custom') {
      const { startDate, endDate } = this.getDateRangeFromPreset(filter.preset);
      filter.startDate = startDate;
      filter.endDate = endDate;
    }

    if (filter.startDate) {
      params.push(filter.startDate.toISOString().split('T')[0]);
      conditions.push(`${field} >= ?`);
    }

    if (filter.endDate) {
      params.push(filter.endDate.toISOString().split('T')[0]);
      conditions.push(`${field} <= ?`);
    }

    return conditions.length > 0 ? `(${conditions.join(' AND ')})` : '1=1';
  }

  private buildRangeFilterCondition(filter: RangeFilter, params: any[]): string {
    const field = `t.${filter.field}`;
    params.push(filter.min, filter.max);
    return `${field} BETWEEN ? AND ?`;
  }

  private buildBooleanFilterCondition(filter: BooleanFilter, params: any[]): string {
    const field = `t.${filter.field}`;
    params.push(filter.value ? 1 : 0);
    return `${field} = ?`;
  }

  private buildCustomFilterCondition(filter: CustomFilter, params: any[]): string {
    const field = `t.${filter.field}`;
    params.push(filter.value);
    return `${field} ${filter.operator} ?`;
  }

  private buildNodeCondition(node: FilterNode, params: any[]): string {
    if (node.type === 'filter' && node.filter) {
      const { sql } = this.buildQuery(node.filter);
      // Extract WHERE clause
      const match = sql.match(/WHERE\s+(.+?)\s+ORDER BY/is);
      return match ? `(${match[1]})` : '1=1';
    }

    if (node.type === 'operator' && node.children && node.children.length > 0) {
      const childConditions = node.children
        .map(child => this.buildNodeCondition(child, params))
        .filter(cond => cond !== '1=1');
      
      if (childConditions.length === 0) {
        return '1=1';
      }

      const operator = node.operator || 'AND';
      return `(${childConditions.join(` ${operator} `)})`;
    }

    if (node.type === 'group' && node.children && node.children.length > 0) {
      const childConditions = node.children
        .map(child => this.buildNodeCondition(child, params))
        .filter(cond => cond !== '1=1');
      
      if (childConditions.length === 0) {
        return '1=1';
      }

      return `(${childConditions.join(' AND ')})`;
    }

    return '1=1';
  }

  private getDateRangeFromPreset(preset: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (preset) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;

      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;

      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;

      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;

      default:
        startDate.setFullYear(1900);
        endDate.setFullYear(2100);
    }

    return { startDate, endDate };
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

export default AdvancedQueryBuilder;
