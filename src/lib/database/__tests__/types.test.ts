// Unit tests for database types and interfaces
import { describe, it, expect } from 'vitest';
import { DatabaseError } from '../types';
import type {
  AlumniRecord,
  PublicationRecord,
  PhotoRecord,
  FacultyRecord,
  SearchResult,
  SearchFilters,
  YearRange,
  TableType,
  ImportResult,
  ValidationResult
} from '../types';

describe('Database Types Tests', () => {
  describe('DatabaseError Class', () => {
    it('should create DatabaseError with default values', () => {
      const error = new DatabaseError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Test error');
      expect(error.type).toBe('CONNECTION_ERROR');
      expect(error.query).toBeUndefined();
    });

    it('should create DatabaseError with custom type and query', () => {
      const error = new DatabaseError('Syntax error', 'SYNTAX_ERROR', 'SELECT * FROM invalid');
      
      expect(error.type).toBe('SYNTAX_ERROR');
      expect(error.query).toBe('SELECT * FROM invalid');
    });

    it('should support all error types', () => {
      const types: DatabaseError['type'][] = ['SYNTAX_ERROR', 'INDEX_CORRUPT', 'TIMEOUT', 'CONNECTION_ERROR'];
      
      types.forEach(type => {
        const error = new DatabaseError('Test', type);
        expect(error.type).toBe(type);
      });
    });
  });

  describe('Record Type Validation', () => {
    it('should validate AlumniRecord structure', () => {
      const alumni: AlumniRecord = {
        id: 1,
        full_name: 'John Doe',
        class_year: 2020,
        role: 'Student',
        composite_image_path: '/path/to/composite.jpg',
        portrait_path: '/path/to/portrait.jpg',
        caption: 'Class President',
        tags: 'leadership,student',
        sort_key: 'doe_john'
      };

      expect(alumni.id).toBe(1);
      expect(alumni.full_name).toBe('John Doe');
      expect(alumni.class_year).toBe(2020);
      expect(alumni.role).toBe('Student');
      expect(typeof alumni.tags).toBe('string');
    });

    it('should validate PublicationRecord structure', () => {
      const publication: PublicationRecord = {
        id: 1,
        title: 'Legal Ethics in Practice',
        pub_name: 'Law Review',
        issue_date: '2023-01-15',
        volume_issue: 'Vol. 45, Issue 1',
        pdf_path: '/path/to/article.pdf',
        thumb_path: '/path/to/thumb.jpg',
        description: 'An analysis of legal ethics',
        tags: 'ethics,law,practice'
      };

      expect(publication.pub_name).toBe('Law Review');
      expect(['Amicus', 'Legal Eye', 'Law Review', 'Directory']).toContain(publication.pub_name);
      expect(publication.pdf_path).toBeTruthy();
    });

    it('should validate PhotoRecord structure', () => {
      const photo: PhotoRecord = {
        id: 1,
        collection: '1960s Campus',
        title: 'Graduation Ceremony 1965',
        year_or_decade: '1965',
        image_path: '/path/to/photo.jpg',
        caption: 'Students receiving diplomas',
        tags: 'graduation,ceremony,1960s'
      };

      expect(photo.collection).toBe('1960s Campus');
      expect(photo.image_path).toBeTruthy();
      expect(typeof photo.tags).toBe('string');
    });

    it('should validate FacultyRecord structure', () => {
      const faculty: FacultyRecord = {
        id: 1,
        full_name: 'Dr. Jane Smith',
        title: 'Professor of Constitutional Law',
        department: 'Constitutional Law',
        email: 'j.smith@lawschool.edu',
        phone: '555-0123',
        headshot_path: '/path/to/headshot.jpg'
      };

      expect(faculty.full_name).toBe('Dr. Jane Smith');
      expect(faculty.department).toBeTruthy();
      expect(faculty.email).toContain('@');
    });
  });

  describe('Search Type Validation', () => {
    it('should validate SearchResult structure', () => {
      const alumniData: AlumniRecord = {
        id: 1,
        full_name: 'John Doe',
        class_year: 2020,
        role: 'Student',
        tags: 'student',
        sort_key: 'doe_john'
      };

      const searchResult: SearchResult = {
        id: '1',
        type: 'alumni',
        title: 'John Doe',
        subtitle: 'Class of 2020',
        thumbnailPath: '/path/to/thumb.jpg',
        relevanceScore: 0.95,
        data: alumniData
      };

      expect(searchResult.type).toBe('alumni');
      expect(['alumni', 'publication', 'photo', 'faculty']).toContain(searchResult.type);
      expect(searchResult.relevanceScore).toBeGreaterThan(0);
      expect(searchResult.data).toBe(alumniData);
    });

    it('should validate SearchFilters structure', () => {
      const filters: SearchFilters = {
        yearRange: { start: 2000, end: 2020 },
        publicationType: 'Law Review',
        department: 'Constitutional Law',
        decade: '2000s'
      };

      expect(filters.yearRange?.start).toBe(2000);
      expect(filters.yearRange?.end).toBe(2020);
      expect(filters.publicationType).toBe('Law Review');
    });

    it('should validate YearRange structure', () => {
      const yearRange: YearRange = {
        start: 1990,
        end: 2023
      };

      expect(yearRange.start).toBeLessThan(yearRange.end);
      expect(typeof yearRange.start).toBe('number');
      expect(typeof yearRange.end).toBe('number');
    });
  });

  describe('Utility Type Validation', () => {
    it('should validate TableType union', () => {
      const validTypes: TableType[] = ['alumni', 'publications', 'photos', 'faculty'];
      
      validTypes.forEach(type => {
        expect(['alumni', 'publications', 'photos', 'faculty']).toContain(type);
      });
    });

    it('should validate ImportResult structure', () => {
      const successResult: ImportResult = {
        success: true,
        recordsImported: 150,
        errors: []
      };

      const failureResult: ImportResult = {
        success: false,
        recordsImported: 0,
        errors: ['Invalid CSV format', 'Missing required fields']
      };

      expect(successResult.success).toBe(true);
      expect(successResult.recordsImported).toBeGreaterThan(0);
      expect(successResult.errors).toHaveLength(0);

      expect(failureResult.success).toBe(false);
      expect(failureResult.errors.length).toBeGreaterThan(0);
    });

    it('should validate ValidationResult structure', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: []
      };

      const invalidResult: ValidationResult = {
        isValid: false,
        errors: ['Missing full_name field', 'Invalid class_year format']
      };

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Type Compatibility', () => {
    it('should allow optional fields in records', () => {
      const minimalAlumni: AlumniRecord = {
        id: 1,
        full_name: 'Jane Doe',
        class_year: 2021,
        role: 'Student',
        tags: 'student',
        sort_key: 'doe_jane'
        // Optional fields omitted
      };

      expect(minimalAlumni.composite_image_path).toBeUndefined();
      expect(minimalAlumni.portrait_path).toBeUndefined();
      expect(minimalAlumni.caption).toBeUndefined();
    });

    it('should support different data types in SearchResult', () => {
      const alumniResult: SearchResult = {
        id: '1',
        type: 'alumni',
        title: 'Test',
        relevanceScore: 1.0,
        data: {
          id: 1,
          full_name: 'Test',
          class_year: 2020,
          role: 'Student',
          tags: 'test',
          sort_key: 'test'
        }
      };

      const publicationResult: SearchResult = {
        id: '2',
        type: 'publication',
        title: 'Test Article',
        relevanceScore: 0.8,
        data: {
          id: 2,
          title: 'Test Article',
          pub_name: 'Law Review',
          issue_date: '2023-01-01',
          volume_issue: 'Vol. 1',
          pdf_path: '/test.pdf',
          description: 'Test',
          tags: 'test'
        }
      };

      expect(alumniResult.type).toBe('alumni');
      expect(publicationResult.type).toBe('publication');
      expect(alumniResult.data).toHaveProperty('class_year');
      expect(publicationResult.data).toHaveProperty('pdf_path');
    });
  });
});