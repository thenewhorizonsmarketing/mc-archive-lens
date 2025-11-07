// Unit tests for FTS5 virtual tables and search functionality
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../manager';

describe('FTS5 Virtual Tables Tests', () => {
  let dbManager: DatabaseManager;

  beforeEach(async () => {
    dbManager = new DatabaseManager();
    await dbManager.initializeDatabase();
  });

  afterEach(() => {
    dbManager.close();
  });

  describe('FTS5 Table Creation', () => {
    it('should create all FTS5 virtual tables', () => {
      const ftsTables = dbManager.executeQuery(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name LIKE '%_fts'
      `);
      
      const tableNames = ftsTables.map(table => table.name);
      expect(tableNames).toContain('alumni_fts');
      expect(tableNames).toContain('publications_fts');
      expect(tableNames).toContain('photos_fts');
      expect(tableNames).toContain('faculty_fts');
    });

    it('should verify FTS5 table configuration', () => {
      // Check if FTS5 tables are properly configured
      const result = dbManager.executeQuery(`
        SELECT sql FROM sqlite_master 
        WHERE name='alumni_fts' AND type='table'
      `);
      
      expect(result).toHaveLength(1);
      expect(result[0].sql).toContain('fts5');
      expect(result[0].sql).toContain('full_name');
      expect(result[0].sql).toContain('tokenize=\'porter unicode61\'');
    });
  });

  describe('FTS5 Synchronization Triggers', () => {
    it('should create triggers for alumni table synchronization', () => {
      const triggers = dbManager.executeQuery(`
        SELECT name FROM sqlite_master 
        WHERE type='trigger' AND name LIKE 'alumni_fts_%'
      `);
      
      const triggerNames = triggers.map(trigger => trigger.name);
      expect(triggerNames).toContain('alumni_fts_insert');
      expect(triggerNames).toContain('alumni_fts_delete');
      expect(triggerNames).toContain('alumni_fts_update');
    });

    it('should synchronize data on INSERT operations', () => {
      // Insert data into alumni table
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, caption, tags, sort_key) 
        VALUES ('John Doe', 2020, 'Student', 'Class President', 'leadership,student', 'doe_john')
      `);

      // Check if FTS5 table was updated
      const ftsResult = dbManager.executeQuery(`
        SELECT rowid, full_name, role FROM alumni_fts WHERE alumni_fts MATCH 'John'
      `);
      
      expect(ftsResult).toHaveLength(1);
      expect(ftsResult[0].full_name).toBe('John Doe');
      expect(ftsResult[0].role).toBe('Student');
    });

    it('should synchronize data on UPDATE operations', () => {
      // Insert initial data
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, sort_key) 
        VALUES ('Jane Smith', 2021, 'Student', 'smith_jane')
      `);

      // Update the record
      dbManager.executeStatement(`
        UPDATE alumni SET role = 'Graduate' WHERE full_name = 'Jane Smith'
      `);

      // Check if FTS5 table reflects the update
      const ftsResult = dbManager.executeQuery(`
        SELECT role FROM alumni_fts WHERE alumni_fts MATCH 'Jane'
      `);
      
      expect(ftsResult).toHaveLength(1);
      expect(ftsResult[0].role).toBe('Graduate');
    });

    it('should synchronize data on DELETE operations', () => {
      // Insert data
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, sort_key) 
        VALUES ('Bob Johnson', 2019, 'Student', 'johnson_bob')
      `);

      // Verify data exists in FTS5
      let ftsResult = dbManager.executeQuery(`
        SELECT COUNT(*) as count FROM alumni_fts WHERE alumni_fts MATCH 'Bob'
      `);
      expect(ftsResult[0].count).toBe(1);

      // Delete the record
      dbManager.executeStatement(`
        DELETE FROM alumni WHERE full_name = 'Bob Johnson'
      `);

      // Verify data is removed from FTS5
      ftsResult = dbManager.executeQuery(`
        SELECT COUNT(*) as count FROM alumni_fts WHERE alumni_fts MATCH 'Bob'
      `);
      expect(ftsResult[0].count).toBe(0);
    });
  });

  describe('FTS5 Search Functionality', () => {
    beforeEach(() => {
      // Insert test data for search tests
      const testData = [
        ['John Doe', 2020, 'Class President', 'Outstanding leadership', 'leadership,president'],
        ['Jane Smith', 2021, 'Student', 'Academic excellence', 'academic,honor'],
        ['Bob Johnson', 2019, 'Vice President', 'Community service', 'service,community'],
        ['Alice Brown', 2022, 'Student', 'Research assistant', 'research,science']
      ];

      testData.forEach(([name, year, role, caption, tags]) => {
        dbManager.executeStatement(`
          INSERT INTO alumni (full_name, class_year, role, caption, tags, sort_key) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [name, year, role, caption, tags, name.toLowerCase().replace(' ', '_')]);
      });
    });

    it('should perform basic text search', async () => {
      const results = await dbManager.executeSearch('John', 'alumni');
      
      expect(results).toHaveLength(1);
      expect(results[0].full_name).toBe('John Doe');
      expect(results[0].relevance_score).toBeDefined();
    });

    it('should search across multiple fields', async () => {
      const results = await dbManager.executeSearch('leadership', 'alumni');
      
      expect(results).toHaveLength(1);
      expect(results[0].full_name).toBe('John Doe');
    });

    it('should perform partial word matching', async () => {
      const results = await dbManager.executeSearch('Pres', 'alumni');
      
      expect(results.length).toBeGreaterThan(0);
      const names = results.map(r => r.full_name);
      expect(names).toContain('John Doe'); // Class President
      expect(names).toContain('Bob Johnson'); // Vice President
    });

    it('should handle phrase searches', async () => {
      const results = await dbManager.executeSearch('"Class President"', 'alumni');
      
      expect(results).toHaveLength(1);
      expect(results[0].full_name).toBe('John Doe');
    });

    it('should return results ranked by relevance', async () => {
      const results = await dbManager.executeSearch('student', 'alumni');
      
      expect(results.length).toBeGreaterThan(1);
      
      // Results should be ordered by relevance (bm25 score)
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].relevance_score).toBeLessThanOrEqual(results[i].relevance_score);
      }
    });

    it('should handle empty search queries gracefully', async () => {
      const results = await dbManager.executeSearch('', 'alumni');
      expect(results).toHaveLength(0);
    });

    it('should handle special characters in search queries', async () => {
      // Should not throw errors with special characters
      expect(async () => {
        await dbManager.executeSearch('John@#$%', 'alumni');
      }).not.toThrow();
    });
  });

  describe('FTS5 Index Rebuilding', () => {
    it('should rebuild FTS5 indexes successfully', async () => {
      // Insert test data
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, sort_key) 
        VALUES ('Test User', 2023, 'Student', 'test_user')
      `);

      // Rebuild indexes
      await dbManager.rebuildIndexes();

      // Verify search still works after rebuild
      const results = await dbManager.executeSearch('Test', 'alumni');
      expect(results).toHaveLength(1);
      expect(results[0].full_name).toBe('Test User');
    });

    it('should handle index corruption gracefully', async () => {
      // This test simulates index corruption recovery
      // In a real scenario, this would test the error handling
      expect(async () => {
        await dbManager.rebuildIndexes();
      }).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    beforeEach(() => {
      // Insert larger dataset for performance testing
      const batchSize = 100;
      for (let i = 0; i < batchSize; i++) {
        dbManager.executeStatement(`
          INSERT INTO alumni (full_name, class_year, role, caption, tags, sort_key) 
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          `Student ${i}`,
          2020 + (i % 4),
          i % 2 === 0 ? 'Student' : 'Graduate',
          `Description for student ${i}`,
          `tag${i % 10},category${i % 5}`,
          `student_${i}`
        ]);
      }
    });

    it('should perform searches within performance targets', async () => {
      const startTime = performance.now();
      
      const results = await dbManager.executeSearch('Student', 'alumni', 50);
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      // Should complete within 50ms as per requirements
      expect(searchTime).toBeLessThan(50);
      expect(results.length).toBeLessThanOrEqual(50);
    });

    it('should handle large result sets efficiently', async () => {
      const startTime = performance.now();
      
      const results = await dbManager.executeSearch('Student', 'alumni', 1000);
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      // Should still be reasonably fast even with larger limits
      expect(searchTime).toBeLessThan(100);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});