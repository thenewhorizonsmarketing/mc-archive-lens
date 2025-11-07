// Unit tests for database schema and table creation
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseManager } from '../manager';
import {
  CREATE_ALUMNI_TABLE,
  CREATE_PUBLICATIONS_TABLE,
  CREATE_PHOTOS_TABLE,
  CREATE_FACULTY_TABLE,
  CREATE_METADATA_TABLE,
  CREATE_ALUMNI_FTS,
  CREATE_PUBLICATIONS_FTS,
  CREATE_PHOTOS_FTS,
  CREATE_FACULTY_FTS,
  CREATE_INDEXES
} from '../schema';

describe('Database Schema Tests', () => {
  let dbManager: DatabaseManager;

  beforeEach(async () => {
    dbManager = new DatabaseManager();
    await dbManager.initializeDatabase();
  });

  afterEach(() => {
    dbManager.close();
  });

  describe('Core Table Creation', () => {
    it('should create alumni table with correct schema', () => {
      const result = dbManager.executeQuery(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' AND name='alumni'
      `);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('alumni');
      expect(result[0].sql).toContain('full_name TEXT NOT NULL');
      expect(result[0].sql).toContain('class_year INTEGER');
      expect(result[0].sql).toContain('composite_image_path TEXT');
    });

    it('should create publications table with correct constraints', () => {
      const result = dbManager.executeQuery(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' AND name='publications'
      `);
      
      expect(result).toHaveLength(1);
      expect(result[0].sql).toContain('pub_name TEXT NOT NULL');
      expect(result[0].sql).toContain("CHECK(pub_name IN ('Amicus', 'Legal Eye', 'Law Review', 'Directory'))");
      expect(result[0].sql).toContain('pdf_path TEXT NOT NULL');
    });

    it('should create photos table with required fields', () => {
      const result = dbManager.executeQuery(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' AND name='photos'
      `);
      
      expect(result).toHaveLength(1);
      expect(result[0].sql).toContain('collection TEXT NOT NULL');
      expect(result[0].sql).toContain('image_path TEXT NOT NULL');
      expect(result[0].sql).toContain('title TEXT NOT NULL');
    });

    it('should create faculty table with contact fields', () => {
      const result = dbManager.executeQuery(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' AND name='faculty'
      `);
      
      expect(result).toHaveLength(1);
      expect(result[0].sql).toContain('full_name TEXT NOT NULL');
      expect(result[0].sql).toContain('department TEXT NOT NULL');
      expect(result[0].sql).toContain('email TEXT');
      expect(result[0].sql).toContain('phone TEXT');
    });

    it('should create metadata table for system tracking', () => {
      const result = dbManager.executeQuery(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' AND name='metadata'
      `);
      
      expect(result).toHaveLength(1);
      expect(result[0].sql).toContain('key TEXT UNIQUE NOT NULL');
      expect(result[0].sql).toContain('value TEXT');
    });
  });

  describe('Index Creation', () => {
    it('should create performance indexes on frequently queried columns', () => {
      const indexes = dbManager.executeQuery(`
        SELECT name FROM sqlite_master 
        WHERE type='index' AND name LIKE 'idx_%'
      `);
      
      const indexNames = indexes.map(idx => idx.name);
      expect(indexNames).toContain('idx_alumni_class_year');
      expect(indexNames).toContain('idx_publications_pub_name');
      expect(indexNames).toContain('idx_photos_collection');
      expect(indexNames).toContain('idx_faculty_department');
    });

    it('should verify index effectiveness on alumni class_year queries', () => {
      // Insert test data
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, sort_key) 
        VALUES ('John Doe', 2020, 'Student', 'doe_john')
      `);

      // Query using index
      const result = dbManager.executeQuery(`
        SELECT * FROM alumni WHERE class_year = 2020
      `);
      
      expect(result).toHaveLength(1);
      expect(result[0].full_name).toBe('John Doe');
    });
  });

  describe('Data Integrity Constraints', () => {
    it('should enforce NOT NULL constraints on required fields', () => {
      expect(() => {
        dbManager.executeStatement(`
          INSERT INTO alumni (class_year, role) VALUES (2020, 'Student')
        `);
      }).toThrow();
    });

    it('should enforce CHECK constraint on publication types', () => {
      expect(() => {
        dbManager.executeStatement(`
          INSERT INTO publications (title, pub_name, pdf_path) 
          VALUES ('Test', 'Invalid Type', '/path/to/pdf')
        `);
      }).toThrow();
    });

    it('should allow valid publication types', () => {
      const validTypes = ['Amicus', 'Legal Eye', 'Law Review', 'Directory'];
      
      validTypes.forEach((type, index) => {
        expect(() => {
          dbManager.executeStatement(`
            INSERT INTO publications (title, pub_name, pdf_path) 
            VALUES (?, ?, ?)
          `, [`Test ${index}`, type, `/path/to/pdf${index}`]);
        }).not.toThrow();
      });

      const result = dbManager.executeQuery('SELECT COUNT(*) as count FROM publications');
      expect(result[0].count).toBe(4);
    });
  });

  describe('Timestamp Fields', () => {
    it('should automatically set created_at and updated_at timestamps', () => {
      dbManager.executeStatement(`
        INSERT INTO alumni (full_name, class_year, role, sort_key) 
        VALUES ('Jane Smith', 2021, 'Student', 'smith_jane')
      `);

      const result = dbManager.executeQuery(`
        SELECT created_at, updated_at FROM alumni WHERE full_name = 'Jane Smith'
      `);
      
      expect(result).toHaveLength(1);
      expect(result[0].created_at).toBeTruthy();
      expect(result[0].updated_at).toBeTruthy();
    });
  });
});