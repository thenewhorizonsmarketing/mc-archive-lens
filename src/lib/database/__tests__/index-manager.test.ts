// Unit tests for IndexManager
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IndexManager } from '../index-manager';
import { DatabaseConnection } from '../connection';
import { DatabaseManager } from '../manager';
import { TableType } from '../types';

// Mock the database connection and manager
const mockDbManager = {
  executeStatement: vi.fn(),
  executeQuery: vi.fn(),
  getMetadata: vi.fn(),
  close: vi.fn()
} as unknown as DatabaseManager;

const mockDbConnection = {
  connected: true,
  connect: vi.fn(),
  getManager: vi.fn(() => mockDbManager)
} as unknown as DatabaseConnection;

describe('IndexManager Tests', () => {
  let indexManager: IndexManager;

  beforeEach(() => {
    indexManager = new IndexManager(mockDbConnection);
    // Set up the database manager to be available
    (indexManager as any).dbManager = mockDbManager;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Index Rebuilding', () => {
    it('should rebuild all indexes successfully', async () => {
      mockDbManager.executeStatement = vi.fn();

      await indexManager.rebuildIndexes();

      // Should call rebuild for each table
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        "INSERT INTO alumni_fts(alumni_fts) VALUES('rebuild')"
      );
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        "INSERT INTO publications_fts(publications_fts) VALUES('rebuild')"
      );
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        "INSERT INTO photos_fts(photos_fts) VALUES('rebuild')"
      );
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        "INSERT INTO faculty_fts(faculty_fts) VALUES('rebuild')"
      );

      // Should run ANALYZE
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith('ANALYZE');

      // Should update metadata
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        expect.arrayContaining(['last_index_rebuild', expect.any(String)])
      );
    });

    it('should rebuild specific tables only', async () => {
      mockDbManager.executeStatement = vi.fn();

      await indexManager.rebuildIndexes(['alumni', 'publications']);

      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        "INSERT INTO alumni_fts(alumni_fts) VALUES('rebuild')"
      );
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        "INSERT INTO publications_fts(publications_fts) VALUES('rebuild')"
      );

      // Should not rebuild photos or faculty
      expect(mockDbManager.executeStatement).not.toHaveBeenCalledWith(
        "INSERT INTO photos_fts(photos_fts) VALUES('rebuild')"
      );
      expect(mockDbManager.executeStatement).not.toHaveBeenCalledWith(
        "INSERT INTO faculty_fts(faculty_fts) VALUES('rebuild')"
      );
    });

    it('should handle rebuild errors gracefully', async () => {
      mockDbManager.executeStatement = vi.fn().mockImplementation((sql) => {
        if (sql.includes('alumni_fts')) {
          throw new Error('Rebuild failed');
        }
      });

      await expect(indexManager.rebuildIndexes(['alumni'])).rejects.toThrow('Failed to rebuild indexes');
    });
  });

  describe('Index Optimization', () => {
    it('should optimize all indexes successfully', async () => {
      mockDbManager.executeStatement = vi.fn();

      const result = await indexManager.optimizeIndexes();

      expect(result.success).toBe(true);
      expect(result.tablesOptimized).toEqual(['alumni', 'publications', 'photos', 'faculty']);
      expect(result.errors).toHaveLength(0);
      expect(result.timeTaken).toBeGreaterThan(0);

      // Should call optimize for each table
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        "INSERT INTO alumni_fts(alumni_fts) VALUES('optimize')"
      );
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith(
        "INSERT INTO publications_fts(publications_fts) VALUES('optimize')"
      );
    });

    it('should handle partial optimization failures', async () => {
      mockDbManager.executeStatement = vi.fn().mockImplementation((sql) => {
        if (sql.includes('alumni_fts') && sql.includes('optimize')) {
          throw new Error('Optimization failed for alumni');
        }
      });

      const result = await indexManager.optimizeIndexes();

      expect(result.success).toBe(false);
      expect(result.tablesOptimized).toEqual(['publications', 'photos', 'faculty']);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('alumni: Optimization failed for alumni');
    });

    it('should measure optimization time accurately', async () => {
      mockDbManager.executeStatement = vi.fn().mockImplementation(() => {
        // Simulate some processing time
        return new Promise(resolve => setTimeout(resolve, 10));
      });

      const result = await indexManager.optimizeIndexes();

      expect(result.timeTaken).toBeGreaterThan(0);
    });
  });

  describe('Index Integrity Verification', () => {
    it('should verify healthy indexes', async () => {
      mockDbManager.executeQuery = vi.fn()
        .mockReturnValueOnce([{ count: 100 }]) // alumni count
        .mockReturnValueOnce([{ count: 100 }]) // alumni_fts count
        .mockReturnValueOnce([{ size: 1000 }]) // alumni_fts size
        .mockReturnValueOnce([{ count: 50 }])  // publications count
        .mockReturnValueOnce([{ count: 50 }])  // publications_fts count
        .mockReturnValueOnce([{ size: 500 }])  // publications_fts size
        .mockReturnValueOnce([{ count: 200 }]) // photos count
        .mockReturnValueOnce([{ count: 200 }]) // photos_fts count
        .mockReturnValueOnce([{ size: 2000 }]) // photos_fts size
        .mockReturnValueOnce([{ count: 25 }])  // faculty count
        .mockReturnValueOnce([{ count: 25 }])  // faculty_fts count
        .mockReturnValueOnce([{ size: 250 }]); // faculty_fts size

      mockDbManager.getMetadata = vi.fn().mockReturnValue('2023-01-01T00:00:00.000Z');

      const stats = await indexManager.verifyIndexIntegrity();

      expect(stats).toHaveLength(4);
      expect(stats[0].tableName).toBe('alumni');
      expect(stats[0].isHealthy).toBe(true);
      expect(stats[0].recordCount).toBe(100);
      expect(stats[0].lastRebuild).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should detect unhealthy indexes with mismatched counts', async () => {
      mockDbManager.executeQuery = vi.fn()
        .mockReturnValueOnce([{ count: 100 }]) // alumni count
        .mockReturnValueOnce([{ count: 80 }])  // alumni_fts count (mismatch)
        .mockReturnValueOnce([{ size: 1000 }]); // alumni_fts size

      const stats = await indexManager.verifyIndexIntegrity();

      expect(stats[0].isHealthy).toBe(false);
    });

    it('should detect corrupted indexes that fail queries', async () => {
      mockDbManager.executeQuery = vi.fn()
        .mockReturnValueOnce([{ count: 100 }]) // alumni count
        .mockImplementationOnce(() => { throw new Error('FTS query failed'); }); // alumni_fts fails

      const stats = await indexManager.verifyIndexIntegrity();

      expect(stats[0].isHealthy).toBe(false);
    });

    it('should handle missing metadata gracefully', async () => {
      mockDbManager.executeQuery = vi.fn()
        .mockReturnValue([{ count: 100 }]);

      mockDbManager.getMetadata = vi.fn().mockReturnValue(null);

      const stats = await indexManager.verifyIndexIntegrity();

      expect(stats[0].lastRebuild).toBeUndefined();
    });
  });

  describe('Index Repair', () => {
    it('should repair corrupted indexes', async () => {
      // Mock corrupted index detection
      mockDbManager.executeQuery = vi.fn()
        .mockReturnValueOnce([{ count: 100 }]) // alumni count
        .mockImplementationOnce(() => { throw new Error('FTS query failed'); }) // alumni_fts fails
        .mockReturnValue([{ count: 50 }]); // Other tables healthy

      mockDbManager.executeStatement = vi.fn();

      const repairedTables = await indexManager.repairCorruptedIndexes();

      expect(repairedTables).toContain('alumni');
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith('DROP TABLE IF EXISTS alumni_fts');
    });

    it('should handle repair failures gracefully', async () => {
      // Mock corrupted index detection
      mockDbManager.executeQuery = vi.fn()
        .mockReturnValueOnce([{ count: 100 }]) // alumni count
        .mockImplementationOnce(() => { throw new Error('FTS query failed'); }); // alumni_fts fails

      mockDbManager.executeStatement = vi.fn().mockImplementation((sql) => {
        if (sql.includes('DROP TABLE')) {
          throw new Error('Drop failed');
        }
      });

      const repairedTables = await indexManager.repairCorruptedIndexes();

      expect(repairedTables).toHaveLength(0); // No tables successfully repaired
    });

    it('should report when all indexes are healthy', async () => {
      mockDbManager.executeQuery = vi.fn()
        .mockReturnValue([{ count: 100 }]); // All queries succeed

      const repairedTables = await indexManager.repairCorruptedIndexes();

      expect(repairedTables).toHaveLength(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should collect comprehensive performance metrics', async () => {
      const mockIndexStats = [
        { tableName: 'alumni', ftsTableName: 'alumni_fts', recordCount: 100, indexSize: 1000, isHealthy: true }
      ];

      // Mock the verifyIndexIntegrity method
      indexManager.verifyIndexIntegrity = vi.fn().mockResolvedValue(mockIndexStats);

      mockDbManager.getMetadata = vi.fn().mockReturnValue('2023-01-01T00:00:00.000Z');
      mockDbManager.executeQuery = vi.fn().mockReturnValue([{ compile_option: 'ENABLE_FTS5' }]);

      const metrics = await indexManager.getPerformanceMetrics();

      expect(metrics.indexStats).toEqual(mockIndexStats);
      expect(metrics.lastRebuild).toBe('2023-01-01T00:00:00.000Z');
      expect(metrics.queryPlannerStats).toBeDefined();
    });

    it('should handle metrics collection errors gracefully', async () => {
      indexManager.verifyIndexIntegrity = vi.fn().mockRejectedValue(new Error('Stats failed'));

      await expect(indexManager.getPerformanceMetrics()).rejects.toThrow('Stats failed');
    });
  });

  describe('FTS Table Creation', () => {
    it('should generate correct FTS SQL for each table type', () => {
      const tables: TableType[] = ['alumni', 'publications', 'photos', 'faculty'];

      tables.forEach(table => {
        const sql = (indexManager as any).getFTSCreateSQL(table);
        
        expect(sql).toContain(`CREATE VIRTUAL TABLE ${table}_fts USING fts5`);
        expect(sql).toContain("tokenize='porter unicode61'");
        expect(sql).toContain(`content='${table}'`);
        expect(sql).toContain("content_rowid='id'");
      });
    });

    it('should include correct fields for alumni FTS table', () => {
      const sql = (indexManager as any).getFTSCreateSQL('alumni');
      
      expect(sql).toContain('full_name, caption, tags, role');
    });

    it('should include correct fields for publications FTS table', () => {
      const sql = (indexManager as any).getFTSCreateSQL('publications');
      
      expect(sql).toContain('title, description, tags, pub_name, volume_issue');
    });

    it('should throw error for unknown table type', () => {
      expect(() => {
        (indexManager as any).getFTSCreateSQL('unknown' as TableType);
      }).toThrow('Unknown table type: unknown');
    });
  });

  describe('Database Analysis', () => {
    it('should run ANALYZE command successfully', async () => {
      mockDbManager.executeStatement = vi.fn();

      // Access private method through any cast for testing
      await (indexManager as any).analyzeDatabase();

      expect(mockDbManager.executeStatement).toHaveBeenCalledWith('ANALYZE');
    });

    it('should handle ANALYZE errors', async () => {
      mockDbManager.executeStatement = vi.fn().mockImplementation((sql) => {
        if (sql === 'ANALYZE') {
          throw new Error('ANALYZE failed');
        }
      });

      await expect((indexManager as any).analyzeDatabase()).rejects.toThrow('ANALYZE failed');
    });
  });
});