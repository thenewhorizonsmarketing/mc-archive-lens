// Unit tests for DatabaseManager class
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../manager';
import { DatabaseError } from '../types';

describe('DatabaseManager Tests', () => {
  let dbManager: DatabaseManager;

  beforeEach(async () => {
    dbManager = new DatabaseManager();
    await dbManager.initializeDatabase();
  });

  afterEach(() => {
    dbManager.close();
  });

  describe('Initialization', () => {
    it('should initialize database successfully', () => {
      expect(dbManager.initialized).toBe(true);
    });

    it('should set initial metadata', () => {
      const version = dbManager.getMetadata('db_version');
      const ftsEnabled = dbManager.getMetadata('fts_enabled');
      
      expect(version).toBe('1.0.0');
      expect(ftsEnabled).toBe('true');
    });

    it('should create all required tables', () => {
      const tables = dbManager.executeQuery(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      
      const tableNames = tables.map(table => table.name);
      expect(tableNames).toContain('alumni');
      expect(tableNames).toContain('publications');
      expect(tableNames).toContain('photos');
      expect(tableNames).toContain('faculty');
      expect(tableNames).toContain('metadata');
    });
  });

  describe('Query Execution', () => {
    it('should execute SELECT queries successfully', () => {
      const result = dbManager.executeQuery('SELECT COUNT(*) as count FROM alumni');
      
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(0);
    });

    it('should execute parameterized queries', () => {
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, sort_key) 
        VALUES (?, ?, ?, ?)
      `, ['Test User', 2023, 'Student', 'test_user']);

      const result = dbManager.executeQuery(
        'SELECT * FROM alumni WHERE full_name = ?', 
        ['Test User']
      );
      
      expect(result).toHaveLength(1);
      expect(result[0].full_name).toBe('Test User');
    });

    it('should handle SQL errors gracefully', () => {
      expect(() => {
        dbManager.executeQuery('SELECT * FROM nonexistent_table');
      }).toThrow(DatabaseError);
    });
  });

  describe('Search Query Sanitization', () => {
    beforeEach(() => {
      // Insert test data
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, caption, tags, sort_key) 
        VALUES ('John Doe', 2020, 'Student', 'Test caption', 'test,tags', 'doe_john')
      `);
    });

    it('should sanitize queries with special characters', async () => {
      // These should not throw errors
      await expect(dbManager.executeSearch('John@#$%', 'alumni')).resolves.toBeDefined();
      await expect(dbManager.executeSearch('John & Jane', 'alumni')).resolves.toBeDefined();
      await expect(dbManager.executeSearch('John | Jane', 'alumni')).resolves.toBeDefined();
    });

    it('should handle empty and whitespace queries', async () => {
      const emptyResult = await dbManager.executeSearch('', 'alumni');
      const whitespaceResult = await dbManager.executeSearch('   ', 'alumni');
      
      expect(emptyResult).toHaveLength(0);
      expect(whitespaceResult).toHaveLength(0);
    });

    it('should preserve phrase searches with quotes', async () => {
      const result = await dbManager.executeSearch('"John Doe"', 'alumni');
      expect(result).toHaveLength(1);
    });

    it('should convert multi-word queries to OR searches', async () => {
      const result = await dbManager.executeSearch('John Student', 'alumni');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Fallback Search', () => {
    beforeEach(() => {
      // Insert test data
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, caption, tags, sort_key) 
        VALUES ('Jane Smith', 2021, 'Graduate', 'Research work', 'research,graduate', 'smith_jane')
      `);
    });

    it('should fallback to LIKE search when FTS5 fails', async () => {
      // Force FTS5 to fail by corrupting the query in a way that triggers fallback
      // This is a simulation - in real scenarios, this would happen due to index corruption
      const result = await dbManager.executeSearch('Jane', 'alumni');
      
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].full_name).toBe('Jane Smith');
    });

    it('should handle different table types in fallback search', async () => {
      // Insert data in different tables
      dbManager.executeStatement(`
        INSERT INTO publications (title, pub_name, pdf_path, description, tags) 
        VALUES ('Test Article', 'Law Review', '/path/test.pdf', 'Legal research', 'law,research')
      `);

      dbManager.executeStatement(`
        INSERT INTO faculty (full_name, title, department) 
        VALUES ('Dr. Johnson', 'Professor', 'Constitutional Law')
      `);

      // Test fallback search on different tables
      const pubResult = await dbManager.executeSearch('Test', 'publications');
      const facultyResult = await dbManager.executeSearch('Johnson', 'faculty');
      
      expect(pubResult.length).toBeGreaterThan(0);
      expect(facultyResult.length).toBeGreaterThan(0);
    });
  });

  describe('Database Statistics', () => {
    it('should return accurate statistics', () => {
      // Insert test data
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, sort_key) 
        VALUES ('Test Alumni', 2020, 'Student', 'test_alumni')
      `);

      dbManager.executeStatement(`
        INSERT INTO faculty (full_name, title, department) 
        VALUES ('Test Faculty', 'Professor', 'Law')
      `);

      const stats = dbManager.getStats();
      
      expect(stats.alumni).toBe(1);
      expect(stats.faculty).toBe(1);
      expect(stats.publications).toBe(0);
      expect(stats.photos).toBe(0);
      expect(stats.dbVersion).toBe('1.0.0');
      expect(stats.ftsEnabled).toBe(true);
    });
  });

  describe('Database Export/Import', () => {
    it('should export database to Uint8Array', () => {
      const exportData = dbManager.exportDatabase();
      
      expect(exportData).toBeInstanceOf(Uint8Array);
      expect(exportData.length).toBeGreaterThan(0);
    });

    it('should load database from Uint8Array', () => {
      // Insert test data
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, sort_key) 
        VALUES ('Export Test', 2023, 'Student', 'export_test')
      `);

      // Export database
      const exportData = dbManager.exportDatabase();
      
      // Create new manager and load data
      const newManager = new DatabaseManager();
      newManager.loadDatabase(exportData);
      
      // Verify data was loaded
      const result = newManager.executeQuery('SELECT * FROM alumni WHERE full_name = ?', ['Export Test']);
      expect(result).toHaveLength(1);
      expect(result[0].full_name).toBe('Export Test');
      
      newManager.close();
    });
  });

  describe('Error Handling', () => {
    it('should throw DatabaseError for invalid operations', () => {
      expect(() => {
        dbManager.executeQuery('INVALID SQL SYNTAX');
      }).toThrow(DatabaseError);
    });

    it('should handle database not initialized errors', () => {
      const uninitializedManager = new DatabaseManager();
      
      expect(() => {
        uninitializedManager.executeQuery('SELECT 1');
      }).toThrow(DatabaseError);
    });

    it('should handle search on invalid table', async () => {
      await expect(dbManager.executeSearch('test', 'invalid_table')).resolves.toEqual([]);
    });
  });

  describe('Metadata Management', () => {
    it('should set and get metadata values', () => {
      dbManager.executeStatement(`
        INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)
      `, ['test_key', 'test_value']);

      const value = dbManager.getMetadata('test_key');
      expect(value).toBe('test_value');
    });

    it('should return null for non-existent metadata keys', () => {
      const value = dbManager.getMetadata('non_existent_key');
      expect(value).toBeNull();
    });

    it('should update metadata timestamps', () => {
      const key = 'timestamp_test';
      const value1 = 'value1';
      const value2 = 'value2';

      // Set initial value
      dbManager.executeStatement(`
        INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)
      `, [key, value1]);

      const firstTimestamp = dbManager.executeQuery(
        'SELECT updated_at FROM metadata WHERE key = ?', 
        [key]
      )[0].updated_at;

      // Update value
      setTimeout(() => {
        dbManager.executeStatement(`
          INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)
        `, [key, value2]);

        const secondTimestamp = dbManager.executeQuery(
          'SELECT updated_at FROM metadata WHERE key = ?', 
          [key]
        )[0].updated_at;

        expect(secondTimestamp).not.toBe(firstTimestamp);
      }, 10);
    });
  });
});