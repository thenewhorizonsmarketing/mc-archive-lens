// FTS5 Index Manager for maintenance and optimization
import { DatabaseManager } from './manager';
import { DatabaseConnection } from './connection';
import { DatabaseError, TableType } from './types';

export interface IndexStats {
  tableName: string;
  ftsTableName: string;
  recordCount: number;
  indexSize: number;
  lastRebuild?: string;
  isHealthy: boolean;
}

export interface OptimizationResult {
  success: boolean;
  tablesOptimized: string[];
  timeTaken: number;
  errors: string[];
}

export class IndexManager {
  private dbConnection: DatabaseConnection;
  private dbManager: DatabaseManager | null = null;

  constructor(dbConnection: DatabaseConnection) {
    this.dbConnection = dbConnection;
  }

  /**
   * Rebuild FTS5 indexes after data imports
   */
  async rebuildIndexes(tables?: TableType[]): Promise<void> {
    try {
      if (!this.dbConnection.connected) {
        await this.dbConnection.connect();
      }
      this.dbManager = this.dbConnection.getManager();

      const tablesToRebuild = tables || ['alumni', 'publications', 'photos', 'faculty'];
      const startTime = performance.now();

      console.log(`Starting FTS5 index rebuild for tables: ${tablesToRebuild.join(', ')}`);

      for (const table of tablesToRebuild) {
        await this.rebuildTableIndex(table);
      }

      // Run ANALYZE to update query planner statistics
      await this.analyzeDatabase();

      const endTime = performance.now();
      const timeTaken = Math.round(endTime - startTime);

      // Update metadata with rebuild timestamp
      this.dbManager.executeStatement(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        ['last_index_rebuild', new Date().toISOString()]
      );

      console.log(`FTS5 index rebuild completed in ${timeTaken}ms`);

    } catch (error) {
      throw new DatabaseError(`Failed to rebuild indexes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rebuild index for a specific table
   */
  private async rebuildTableIndex(table: TableType): Promise<void> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    const ftsTable = `${table}_fts`;
    
    try {
      console.log(`Rebuilding index for ${table}...`);

      // Use FTS5 rebuild command
      this.dbManager.executeStatement(`INSERT INTO ${ftsTable}(${ftsTable}) VALUES('rebuild')`);
      
      console.log(`Index rebuilt for ${table}`);
    } catch (error) {
      console.error(`Failed to rebuild index for ${table}:`, error);
      throw error;
    }
  }

  /**
   * Optimize FTS5 indexes for better query performance
   */
  async optimizeIndexes(): Promise<OptimizationResult> {
    const startTime = performance.now();
    const tablesOptimized: string[] = [];
    const errors: string[] = [];

    try {
      if (!this.dbConnection.connected) {
        await this.dbConnection.connect();
      }
      this.dbManager = this.dbConnection.getManager();

      const tables: TableType[] = ['alumni', 'publications', 'photos', 'faculty'];

      for (const table of tables) {
        try {
          await this.optimizeTableIndex(table);
          tablesOptimized.push(table);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${table}: ${errorMessage}`);
        }
      }

      // Run ANALYZE for query optimization
      await this.analyzeDatabase();

      const endTime = performance.now();
      const timeTaken = Math.round(endTime - startTime);

      console.log(`Index optimization completed in ${timeTaken}ms`);

      return {
        success: errors.length === 0,
        tablesOptimized,
        timeTaken,
        errors
      };

    } catch (error) {
      const endTime = performance.now();
      const timeTaken = Math.round(endTime - startTime);

      return {
        success: false,
        tablesOptimized,
        timeTaken,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Optimize index for a specific table
   */
  private async optimizeTableIndex(table: TableType): Promise<void> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    const ftsTable = `${table}_fts`;
    
    try {
      // Use FTS5 optimize command
      this.dbManager.executeStatement(`INSERT INTO ${ftsTable}(${ftsTable}) VALUES('optimize')`);
      console.log(`Index optimized for ${table}`);
    } catch (error) {
      console.error(`Failed to optimize index for ${table}:`, error);
      throw error;
    }
  }

  /**
   * Run ANALYZE to update query planner statistics
   */
  private async analyzeDatabase(): Promise<void> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    try {
      this.dbManager.executeStatement('ANALYZE');
      console.log('Database analysis completed');
    } catch (error) {
      console.error('Failed to analyze database:', error);
      throw error;
    }
  }

  /**
   * Check FTS5 index integrity and health
   */
  async verifyIndexIntegrity(): Promise<IndexStats[]> {
    try {
      if (!this.dbConnection.connected) {
        await this.dbConnection.connect();
      }
      this.dbManager = this.dbConnection.getManager();

      const tables: TableType[] = ['alumni', 'publications', 'photos', 'faculty'];
      const stats: IndexStats[] = [];

      for (const table of tables) {
        const tableStats = await this.getTableIndexStats(table);
        stats.push(tableStats);
      }

      return stats;

    } catch (error) {
      throw new DatabaseError(`Failed to verify index integrity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get index statistics for a specific table
   */
  private async getTableIndexStats(table: TableType): Promise<IndexStats> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    const ftsTable = `${table}_fts`;
    let isHealthy = true;
    let recordCount = 0;
    let indexSize = 0;

    try {
      // Get record count from main table
      const countResult = this.dbManager.executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
      recordCount = countResult[0]?.count || 0;

      // Try to query FTS table to check if it's working
      try {
        const ftsResult = this.dbManager.executeQuery(`SELECT COUNT(*) as count FROM ${ftsTable}`);
        const ftsCount = ftsResult[0]?.count || 0;
        
        // Check if FTS table has roughly the same number of records
        if (Math.abs(recordCount - ftsCount) > recordCount * 0.1) {
          isHealthy = false;
        }
      } catch (error) {
        isHealthy = false;
      }

      // Estimate index size (this is approximate)
      try {
        const sizeResult = this.dbManager.executeQuery(`
          SELECT SUM(length(content)) as size 
          FROM ${ftsTable} 
          WHERE ${ftsTable} MATCH '*'
        `);
        indexSize = sizeResult[0]?.size || 0;
      } catch (error) {
        // If we can't get size, it might indicate index corruption
        isHealthy = false;
      }

    } catch (error) {
      isHealthy = false;
      console.error(`Failed to get stats for ${table}:`, error);
    }

    // Get last rebuild timestamp
    let lastRebuild: string | undefined;
    try {
      const rebuildResult = this.dbManager.executeQuery(
        'SELECT value FROM metadata WHERE key = ?',
        ['last_index_rebuild']
      );
      lastRebuild = rebuildResult[0]?.value;
    } catch (error) {
      // Metadata might not exist yet
    }

    return {
      tableName: table,
      ftsTableName: ftsTable,
      recordCount,
      indexSize,
      lastRebuild,
      isHealthy
    };
  }

  /**
   * Detect and repair corrupted indexes
   */
  async repairCorruptedIndexes(): Promise<string[]> {
    const repairedTables: string[] = [];

    try {
      const stats = await this.verifyIndexIntegrity();
      const corruptedTables = stats.filter(stat => !stat.isHealthy);

      if (corruptedTables.length === 0) {
        console.log('All indexes are healthy');
        return repairedTables;
      }

      console.log(`Found ${corruptedTables.length} corrupted indexes, attempting repair...`);

      for (const stat of corruptedTables) {
        try {
          await this.repairTableIndex(stat.tableName as TableType);
          repairedTables.push(stat.tableName);
        } catch (error) {
          console.error(`Failed to repair index for ${stat.tableName}:`, error);
        }
      }

      console.log(`Repaired ${repairedTables.length} indexes`);
      return repairedTables;

    } catch (error) {
      throw new DatabaseError(`Failed to repair corrupted indexes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Repair index for a specific table
   */
  private async repairTableIndex(table: TableType): Promise<void> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    const ftsTable = `${table}_fts`;

    try {
      console.log(`Repairing index for ${table}...`);

      // Drop and recreate the FTS table
      this.dbManager.executeStatement(`DROP TABLE IF EXISTS ${ftsTable}`);

      // Recreate FTS table based on table type
      const createFTSSQL = this.getFTSCreateSQL(table);
      this.dbManager.executeStatement(createFTSSQL);

      // Recreate triggers
      const triggers = this.getTriggerSQL(table);
      for (const trigger of triggers) {
        this.dbManager.executeStatement(trigger);
      }

      // Rebuild the index
      this.dbManager.executeStatement(`INSERT INTO ${ftsTable}(${ftsTable}) VALUES('rebuild')`);

      console.log(`Index repaired for ${table}`);

    } catch (error) {
      throw new DatabaseError(`Failed to repair index for ${table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get FTS table creation SQL for a specific table
   */
  private getFTSCreateSQL(table: TableType): string {
    switch (table) {
      case 'alumni':
        return `
          CREATE VIRTUAL TABLE alumni_fts USING fts5(
            full_name, caption, tags, role,
            content='alumni',
            content_rowid='id',
            tokenize='porter unicode61'
          )
        `;
      case 'publications':
        return `
          CREATE VIRTUAL TABLE publications_fts USING fts5(
            title, description, tags, pub_name, volume_issue,
            content='publications',
            content_rowid='id',
            tokenize='porter unicode61'
          )
        `;
      case 'photos':
        return `
          CREATE VIRTUAL TABLE photos_fts USING fts5(
            title, caption, tags, collection, year_or_decade,
            content='photos',
            content_rowid='id',
            tokenize='porter unicode61'
          )
        `;
      case 'faculty':
        return `
          CREATE VIRTUAL TABLE faculty_fts USING fts5(
            full_name, title, department,
            content='faculty',
            content_rowid='id',
            tokenize='porter unicode61'
          )
        `;
      default:
        throw new DatabaseError(`Unknown table type: ${table}`);
    }
  }

  /**
   * Get trigger SQL for a specific table
   */
  private getTriggerSQL(table: TableType): string[] {
    // This would return the appropriate trigger SQL based on the table
    // For brevity, returning empty array - in real implementation,
    // this would return the full trigger definitions from schema.ts
    return [];
  }

  /**
   * Get performance metrics for FTS5 queries
   */
  async getPerformanceMetrics(): Promise<any> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    const metrics = {
      indexStats: await this.verifyIndexIntegrity(),
      lastRebuild: this.dbManager.getMetadata('last_index_rebuild'),
      queryPlannerStats: await this.getQueryPlannerStats()
    };

    return metrics;
  }

  /**
   * Get query planner statistics
   */
  private async getQueryPlannerStats(): Promise<any> {
    if (!this.dbManager) {
      return null;
    }

    try {
      // Get SQLite query planner statistics
      const stats = this.dbManager.executeQuery('PRAGMA compile_options');
      return stats;
    } catch (error) {
      console.error('Failed to get query planner stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const indexManager = new IndexManager(
  // This will be injected when the connection is established
  {} as DatabaseConnection
);