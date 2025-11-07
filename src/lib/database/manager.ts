// Database Manager for SQLite FTS5 search system
import initSqlJs, { Database } from 'sql.js';
import {
  ALL_TABLES,
  ALL_FTS_TABLES,
  ALL_TRIGGERS,
  CREATE_INDEXES
} from './schema';
import { DatabaseError } from './types';

export class DatabaseManager {
  private db: Database | null = null;
  private SQL: any = null;
  private isInitialized = false;

  constructor() {
    this.initializeSQL();
  }

  /**
   * Initialize SQL.js library
   */
  private async initializeSQL(): Promise<void> {
    try {
      this.SQL = await initSqlJs({
        // Load the wasm file from CDN or local path
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });
    } catch (error) {
      throw new DatabaseError(`Failed to initialize SQL.js: ${error}`);
    }
  }

  /**
   * Initialize the database with schema and FTS5 tables
   */
  async initializeDatabase(): Promise<void> {
    try {
      if (!this.SQL) {
        await this.initializeSQL();
      }

      // Create new database or load existing one
      this.db = new this.SQL.Database();
      
      // Create all core tables
      for (const tableSQL of ALL_TABLES) {
        this.db.run(tableSQL);
      }

      // Create all FTS5 virtual tables
      for (const ftsSQL of ALL_FTS_TABLES) {
        this.db.run(ftsSQL);
      }

      // Create indexes for performance
      for (const indexSQL of CREATE_INDEXES) {
        this.db.run(indexSQL);
      }

      // Create triggers to keep FTS5 tables synchronized
      for (const triggerSQL of ALL_TRIGGERS) {
        this.db.run(triggerSQL);
      }

      // Set database metadata
      this.setMetadata('db_version', '1.0.0');
      this.setMetadata('created_at', new Date().toISOString());
      this.setMetadata('fts_enabled', 'true');

      this.isInitialized = true;
      console.log('Database initialized successfully with FTS5 support');
    } catch (error) {
      throw new DatabaseError(`Failed to initialize database: ${error}`);
    }
  }

  /**
   * Create FTS5 indexes for all tables
   */
  async createFTSIndexes(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    try {
      // Rebuild FTS5 indexes
      const tables = ['alumni_fts', 'publications_fts', 'photos_fts', 'faculty_fts'];
      
      for (const table of tables) {
        this.db.run(`INSERT INTO ${table}(${table}) VALUES('rebuild')`);
      }

      console.log('FTS5 indexes created successfully');
    } catch (error) {
      throw new DatabaseError(`Failed to create FTS5 indexes: ${error}`);
    }
  }

  /**
   * Execute a search query on FTS5 tables
   */
  async executeSearch(query: string, table: string, limit: number = 50): Promise<any[]> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    try {
      // Sanitize the query to prevent FTS5 syntax errors
      const sanitizedQuery = this.sanitizeQuery(query);
      
      if (!sanitizedQuery) {
        return [];
      }

      const ftsTable = `${table}_fts`;
      const sql = `
        SELECT 
          c.*,
          bm25(${ftsTable}) as relevance_score
        FROM ${ftsTable} f
        JOIN ${table} c ON c.id = f.rowid
        WHERE ${ftsTable} MATCH ?
        ORDER BY bm25(${ftsTable})
        LIMIT ?
      `;

      const stmt = this.db.prepare(sql);
      const results = [];
      
      stmt.bind([sanitizedQuery, limit]);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();

      return results;
    } catch (error) {
      // Fallback to simple LIKE search if FTS5 fails
      console.warn('FTS5 search failed, falling back to LIKE search:', error);
      return this.fallbackSearch(query, table, limit);
    }
  }

  /**
   * Fallback search using simple LIKE queries
   */
  private async fallbackSearch(query: string, table: string, limit: number): Promise<any[]> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    const searchTerm = `%${query}%`;
    let sql = '';

    switch (table) {
      case 'alumni':
        sql = `
          SELECT *, 1.0 as relevance_score 
          FROM alumni 
          WHERE full_name LIKE ? OR caption LIKE ? OR tags LIKE ? OR role LIKE ?
          ORDER BY full_name
          LIMIT ?
        `;
        break;
      case 'publications':
        sql = `
          SELECT *, 1.0 as relevance_score 
          FROM publications 
          WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? OR pub_name LIKE ?
          ORDER BY title
          LIMIT ?
        `;
        break;
      case 'photos':
        sql = `
          SELECT *, 1.0 as relevance_score 
          FROM photos 
          WHERE title LIKE ? OR caption LIKE ? OR tags LIKE ? OR collection LIKE ?
          ORDER BY title
          LIMIT ?
        `;
        break;
      case 'faculty':
        sql = `
          SELECT *, 1.0 as relevance_score 
          FROM faculty 
          WHERE full_name LIKE ? OR title LIKE ? OR department LIKE ?
          ORDER BY full_name
          LIMIT ?
        `;
        break;
      default:
        return [];
    }

    const stmt = this.db.prepare(sql);
    const results = [];
    
    if (table === 'faculty') {
      stmt.bind([searchTerm, searchTerm, searchTerm, limit]);
    } else {
      stmt.bind([searchTerm, searchTerm, searchTerm, searchTerm, limit]);
    }
    
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return results;
  }

  /**
   * Sanitize search query to prevent FTS5 syntax errors
   */
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

  /**
   * Rebuild FTS5 indexes
   */
  async rebuildIndexes(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    try {
      const tables = ['alumni_fts', 'publications_fts', 'photos_fts', 'faculty_fts'];
      
      for (const table of tables) {
        // Drop and recreate FTS5 table
        this.db.run(`DROP TABLE IF EXISTS ${table}`);
      }

      // Recreate FTS5 tables
      for (const ftsSQL of ALL_FTS_TABLES) {
        this.db.run(ftsSQL);
      }

      // Recreate triggers
      for (const triggerSQL of ALL_TRIGGERS) {
        this.db.run(triggerSQL);
      }

      // Rebuild indexes
      await this.createFTSIndexes();

      console.log('FTS5 indexes rebuilt successfully');
    } catch (error) {
      throw new DatabaseError(`Failed to rebuild indexes: ${error}`);
    }
  }

  /**
   * Execute a raw SQL query
   */
  executeQuery(sql: string, params: any[] = []): any[] {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    try {
      const stmt = this.db.prepare(sql);
      const results = [];
      
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();

      return results;
    } catch (error) {
      throw new DatabaseError(`Query execution failed: ${error}`);
    }
  }

  /**
   * Execute a SQL statement without returning results
   */
  executeStatement(sql: string, params: any[] = []): void {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }

    try {
      if (params.length > 0) {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        stmt.step();
        stmt.free();
      } else {
        this.db.run(sql);
      }
    } catch (error) {
      throw new DatabaseError(`Statement execution failed: ${error}`);
    }
  }

  /**
   * Set metadata value
   */
  private setMetadata(key: string, value: string): void {
    const sql = `
      INSERT OR REPLACE INTO metadata (key, value, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    this.executeStatement(sql, [key, value]);
  }

  /**
   * Get metadata value
   */
  getMetadata(key: string): string | null {
    const results = this.executeQuery('SELECT value FROM metadata WHERE key = ?', [key]);
    return results.length > 0 ? results[0].value : null;
  }

  /**
   * Export database to Uint8Array for saving
   */
  exportDatabase(): Uint8Array {
    if (!this.db) {
      throw new DatabaseError('Database not initialized');
    }
    return this.db.export();
  }

  /**
   * Load database from Uint8Array
   */
  loadDatabase(data: Uint8Array): void {
    if (!this.SQL) {
      throw new DatabaseError('SQL.js not initialized');
    }
    this.db = new this.SQL.Database(data);
    this.isInitialized = true;
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Check if database is initialized
   */
  get initialized(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Get database statistics
   */
  getStats(): any {
    if (!this.db) {
      return null;
    }

    const stats = {
      alumni: this.executeQuery('SELECT COUNT(*) as count FROM alumni')[0].count,
      publications: this.executeQuery('SELECT COUNT(*) as count FROM publications')[0].count,
      photos: this.executeQuery('SELECT COUNT(*) as count FROM photos')[0].count,
      faculty: this.executeQuery('SELECT COUNT(*) as count FROM faculty')[0].count,
      dbVersion: this.getMetadata('db_version'),
      createdAt: this.getMetadata('created_at'),
      ftsEnabled: this.getMetadata('fts_enabled') === 'true'
    };

    return stats;
  }
}

// Singleton instance
export const databaseManager = new DatabaseManager();