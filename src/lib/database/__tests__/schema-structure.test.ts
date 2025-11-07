// Unit tests for database schema structure and SQL validation
import { describe, it, expect } from 'vitest';
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
  CREATE_INDEXES,
  CREATE_ALUMNI_TRIGGERS,
  CREATE_PUBLICATIONS_TRIGGERS,
  CREATE_PHOTOS_TRIGGERS,
  CREATE_FACULTY_TRIGGERS
} from '../schema';

describe('Database Schema Structure Tests', () => {
  describe('Core Table SQL Validation', () => {
    it('should have valid alumni table SQL', () => {
      expect(CREATE_ALUMNI_TABLE).toContain('CREATE TABLE IF NOT EXISTS alumni');
      expect(CREATE_ALUMNI_TABLE).toContain('full_name TEXT NOT NULL');
      expect(CREATE_ALUMNI_TABLE).toContain('class_year INTEGER');
      expect(CREATE_ALUMNI_TABLE).toContain('composite_image_path TEXT');
      expect(CREATE_ALUMNI_TABLE).toContain('portrait_path TEXT');
      expect(CREATE_ALUMNI_TABLE).toContain('PRIMARY KEY AUTOINCREMENT');
    });

    it('should have valid publications table SQL with constraints', () => {
      expect(CREATE_PUBLICATIONS_TABLE).toContain('CREATE TABLE IF NOT EXISTS publications');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('title TEXT NOT NULL');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('pub_name TEXT NOT NULL');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('pdf_path TEXT NOT NULL');
      expect(CREATE_PUBLICATIONS_TABLE).toContain("CHECK(pub_name IN ('Amicus', 'Legal Eye', 'Law Review', 'Directory'))");
    });

    it('should have valid photos table SQL', () => {
      expect(CREATE_PHOTOS_TABLE).toContain('CREATE TABLE IF NOT EXISTS photos');
      expect(CREATE_PHOTOS_TABLE).toContain('collection TEXT NOT NULL');
      expect(CREATE_PHOTOS_TABLE).toContain('title TEXT NOT NULL');
      expect(CREATE_PHOTOS_TABLE).toContain('image_path TEXT NOT NULL');
      expect(CREATE_PHOTOS_TABLE).toContain('year_or_decade TEXT');
    });

    it('should have valid faculty table SQL', () => {
      expect(CREATE_FACULTY_TABLE).toContain('CREATE TABLE IF NOT EXISTS faculty');
      expect(CREATE_FACULTY_TABLE).toContain('full_name TEXT NOT NULL');
      expect(CREATE_FACULTY_TABLE).toContain('title TEXT NOT NULL');
      expect(CREATE_FACULTY_TABLE).toContain('department TEXT NOT NULL');
      expect(CREATE_FACULTY_TABLE).toContain('email TEXT');
      expect(CREATE_FACULTY_TABLE).toContain('phone TEXT');
    });

    it('should have valid metadata table SQL', () => {
      expect(CREATE_METADATA_TABLE).toContain('CREATE TABLE IF NOT EXISTS metadata');
      expect(CREATE_METADATA_TABLE).toContain('key TEXT UNIQUE NOT NULL');
      expect(CREATE_METADATA_TABLE).toContain('value TEXT');
    });
  });

  describe('FTS5 Virtual Table SQL Validation', () => {
    it('should have valid alumni FTS5 table SQL', () => {
      expect(CREATE_ALUMNI_FTS).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS alumni_fts USING fts5');
      expect(CREATE_ALUMNI_FTS).toContain('full_name, caption, tags, role');
      expect(CREATE_ALUMNI_FTS).toContain("content='alumni'");
      expect(CREATE_ALUMNI_FTS).toContain("content_rowid='id'");
      expect(CREATE_ALUMNI_FTS).toContain("tokenize='porter unicode61'");
    });

    it('should have valid publications FTS5 table SQL', () => {
      expect(CREATE_PUBLICATIONS_FTS).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS publications_fts USING fts5');
      expect(CREATE_PUBLICATIONS_FTS).toContain('title, description, tags, pub_name, volume_issue');
      expect(CREATE_PUBLICATIONS_FTS).toContain("content='publications'");
    });

    it('should have valid photos FTS5 table SQL', () => {
      expect(CREATE_PHOTOS_FTS).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS photos_fts USING fts5');
      expect(CREATE_PHOTOS_FTS).toContain('title, caption, tags, collection, year_or_decade');
      expect(CREATE_PHOTOS_FTS).toContain("content='photos'");
    });

    it('should have valid faculty FTS5 table SQL', () => {
      expect(CREATE_FACULTY_FTS).toContain('CREATE VIRTUAL TABLE IF NOT EXISTS faculty_fts USING fts5');
      expect(CREATE_FACULTY_FTS).toContain('full_name, title, department');
      expect(CREATE_FACULTY_FTS).toContain("content='faculty'");
    });
  });

  describe('Index SQL Validation', () => {
    it('should have all required performance indexes', () => {
      expect(CREATE_INDEXES).toHaveLength(7);
      
      const indexNames = CREATE_INDEXES.join(' ');
      expect(indexNames).toContain('idx_alumni_class_year');
      expect(indexNames).toContain('idx_alumni_sort_key');
      expect(indexNames).toContain('idx_publications_pub_name');
      expect(indexNames).toContain('idx_publications_issue_date');
      expect(indexNames).toContain('idx_photos_collection');
      expect(indexNames).toContain('idx_photos_year_decade');
      expect(indexNames).toContain('idx_faculty_department');
    });

    it('should have valid index SQL syntax', () => {
      CREATE_INDEXES.forEach(indexSQL => {
        expect(indexSQL).toContain('CREATE INDEX IF NOT EXISTS');
        expect(indexSQL).toMatch(/ON \w+\(\w+\)/);
      });
    });
  });

  describe('Trigger SQL Validation', () => {
    it('should have complete alumni triggers', () => {
      expect(CREATE_ALUMNI_TRIGGERS).toHaveLength(3);
      
      const triggerSQL = CREATE_ALUMNI_TRIGGERS.join(' ');
      expect(triggerSQL).toContain('alumni_fts_insert');
      expect(triggerSQL).toContain('alumni_fts_delete');
      expect(triggerSQL).toContain('alumni_fts_update');
      expect(triggerSQL).toContain('AFTER INSERT ON alumni');
      expect(triggerSQL).toContain('AFTER DELETE ON alumni');
      expect(triggerSQL).toContain('AFTER UPDATE ON alumni');
    });

    it('should have complete publications triggers', () => {
      expect(CREATE_PUBLICATIONS_TRIGGERS).toHaveLength(3);
      
      const triggerSQL = CREATE_PUBLICATIONS_TRIGGERS.join(' ');
      expect(triggerSQL).toContain('publications_fts_insert');
      expect(triggerSQL).toContain('publications_fts_delete');
      expect(triggerSQL).toContain('publications_fts_update');
    });

    it('should have complete photos triggers', () => {
      expect(CREATE_PHOTOS_TRIGGERS).toHaveLength(3);
      
      const triggerSQL = CREATE_PHOTOS_TRIGGERS.join(' ');
      expect(triggerSQL).toContain('photos_fts_insert');
      expect(triggerSQL).toContain('photos_fts_delete');
      expect(triggerSQL).toContain('photos_fts_update');
    });

    it('should have complete faculty triggers', () => {
      expect(CREATE_FACULTY_TRIGGERS).toHaveLength(3);
      
      const triggerSQL = CREATE_FACULTY_TRIGGERS.join(' ');
      expect(triggerSQL).toContain('faculty_fts_insert');
      expect(triggerSQL).toContain('faculty_fts_delete');
      expect(triggerSQL).toContain('faculty_fts_update');
    });

    it('should have proper trigger syntax for FTS5 synchronization', () => {
      const allTriggers = [
        ...CREATE_ALUMNI_TRIGGERS,
        ...CREATE_PUBLICATIONS_TRIGGERS,
        ...CREATE_PHOTOS_TRIGGERS,
        ...CREATE_FACULTY_TRIGGERS
      ];

      allTriggers.forEach(trigger => {
        expect(trigger).toContain('CREATE TRIGGER IF NOT EXISTS');
        expect(trigger).toContain('BEGIN');
        expect(trigger).toContain('END;');
        
        if (trigger.includes('_insert')) {
          expect(trigger).toContain('AFTER INSERT');
          expect(trigger).toContain('INSERT INTO');
        }
        
        if (trigger.includes('_delete')) {
          expect(trigger).toContain('AFTER DELETE');
          expect(trigger).toContain("VALUES('delete'");
        }
        
        if (trigger.includes('_update')) {
          expect(trigger).toContain('AFTER UPDATE');
          expect(trigger).toContain("VALUES('delete'");
        }
      });
    });
  });

  describe('Schema Consistency', () => {
    it('should have matching field names between core and FTS tables', () => {
      // Alumni table fields should match FTS5 configuration
      expect(CREATE_ALUMNI_TABLE).toContain('full_name');
      expect(CREATE_ALUMNI_TABLE).toContain('caption');
      expect(CREATE_ALUMNI_TABLE).toContain('tags');
      expect(CREATE_ALUMNI_TABLE).toContain('role');
      expect(CREATE_ALUMNI_FTS).toContain('full_name, caption, tags, role');

      // Publications table fields should match FTS5 configuration
      expect(CREATE_PUBLICATIONS_TABLE).toContain('title');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('description');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('tags');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('pub_name');
      expect(CREATE_PUBLICATIONS_FTS).toContain('title, description, tags, pub_name');
    });

    it('should have consistent timestamp fields across all tables', () => {
      const tables = [
        CREATE_ALUMNI_TABLE,
        CREATE_PUBLICATIONS_TABLE,
        CREATE_PHOTOS_TABLE,
        CREATE_FACULTY_TABLE,
        CREATE_METADATA_TABLE
      ];

      tables.forEach(tableSQL => {
        expect(tableSQL).toContain('created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
        expect(tableSQL).toContain('updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
      });
    });

    it('should have consistent primary key definitions', () => {
      const tables = [
        CREATE_ALUMNI_TABLE,
        CREATE_PUBLICATIONS_TABLE,
        CREATE_PHOTOS_TABLE,
        CREATE_FACULTY_TABLE,
        CREATE_METADATA_TABLE
      ];

      tables.forEach(tableSQL => {
        expect(tableSQL).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
      });
    });
  });

  describe('Data Type Validation', () => {
    it('should use appropriate data types for different field types', () => {
      // Text fields
      expect(CREATE_ALUMNI_TABLE).toContain('full_name TEXT NOT NULL');
      expect(CREATE_ALUMNI_TABLE).toContain('role TEXT');
      expect(CREATE_ALUMNI_TABLE).toContain('caption TEXT');
      
      // Integer fields
      expect(CREATE_ALUMNI_TABLE).toContain('class_year INTEGER');
      
      // Path fields (should be TEXT)
      expect(CREATE_ALUMNI_TABLE).toContain('composite_image_path TEXT');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('pdf_path TEXT NOT NULL');
      expect(CREATE_PHOTOS_TABLE).toContain('image_path TEXT NOT NULL');
    });

    it('should have proper NOT NULL constraints on required fields', () => {
      // Alumni required fields
      expect(CREATE_ALUMNI_TABLE).toContain('full_name TEXT NOT NULL');
      
      // Publications required fields
      expect(CREATE_PUBLICATIONS_TABLE).toContain('title TEXT NOT NULL');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('pub_name TEXT NOT NULL');
      expect(CREATE_PUBLICATIONS_TABLE).toContain('pdf_path TEXT NOT NULL');
      
      // Photos required fields
      expect(CREATE_PHOTOS_TABLE).toContain('collection TEXT NOT NULL');
      expect(CREATE_PHOTOS_TABLE).toContain('title TEXT NOT NULL');
      expect(CREATE_PHOTOS_TABLE).toContain('image_path TEXT NOT NULL');
      
      // Faculty required fields
      expect(CREATE_FACULTY_TABLE).toContain('full_name TEXT NOT NULL');
      expect(CREATE_FACULTY_TABLE).toContain('title TEXT NOT NULL');
      expect(CREATE_FACULTY_TABLE).toContain('department TEXT NOT NULL');
    });
  });
});