// Unit tests for ImportManager
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImportManager } from '../import-manager';
import { DatabaseConnection } from '../connection';
import { DatabaseManager } from '../manager';
import { TableType } from '../types';

// Mock the database connection and manager
const mockDbManager = {
  executeStatement: vi.fn(),
  executeQuery: vi.fn(),
  exportDatabase: vi.fn(),
  loadDatabase: vi.fn(),
  rebuildIndexes: vi.fn(),
  getStats: vi.fn()
} as unknown as DatabaseManager;

const mockDbConnection = {
  connected: true,
  connect: vi.fn(),
  getManager: vi.fn(() => mockDbManager)
} as unknown as DatabaseConnection;

describe('ImportManager Tests', () => {
  let importManager: ImportManager;

  beforeEach(() => {
    importManager = new ImportManager(mockDbConnection);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CSV Data Validation', () => {
    it('should validate alumni CSV data correctly', () => {
      const validData = [
        {
          full_name: 'John Doe',
          class_year: '2020',
          role: 'Student',
          sort_key: 'doe_john',
          caption: 'Class President',
          tags: 'leadership,student'
        }
      ];

      const result = importManager.validateCSVData(validData, 'alumni');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields in alumni data', () => {
      const invalidData = [
        {
          full_name: 'John Doe',
          // Missing class_year, role, sort_key
          caption: 'Student'
        }
      ];

      const result = importManager.validateCSVData(invalidData, 'alumni');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('class_year'))).toBe(true);
      expect(result.errors.some(error => error.includes('role'))).toBe(true);
    });

    it('should validate publications CSV data correctly', () => {
      const validData = [
        {
          title: 'Legal Ethics in Practice',
          pub_name: 'Law Review',
          pdf_path: '/path/to/article.pdf',
          description: 'An analysis of legal ethics',
          tags: 'ethics,law'
        }
      ];

      const result = importManager.validateCSVData(validData, 'publications');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid publication types', () => {
      const invalidData = [
        {
          title: 'Test Article',
          pub_name: 'Invalid Publication',
          pdf_path: '/path/to/article.pdf'
        }
      ];

      const result = importManager.validateCSVData(invalidData, 'publications');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid pub_name'))).toBe(true);
    });

    it('should validate photos CSV data correctly', () => {
      const validData = [
        {
          collection: '1960s Campus',
          title: 'Graduation Ceremony',
          image_path: '/path/to/photo.jpg',
          caption: 'Students receiving diplomas',
          year_or_decade: '1965'
        }
      ];

      const result = importManager.validateCSVData(validData, 'photos');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate faculty CSV data correctly', () => {
      const validData = [
        {
          full_name: 'Dr. Jane Smith',
          title: 'Professor',
          department: 'Constitutional Law',
          email: 'j.smith@law.edu',
          phone: '555-0123'
        }
      ];

      const result = importManager.validateCSVData(validData, 'faculty');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty CSV data', () => {
      const result = importManager.validateCSVData([], 'alumni');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CSV file is empty or contains no valid data');
    });

    it('should limit error reporting to prevent overwhelming output', () => {
      // Create data with many errors
      const invalidData = Array.from({ length: 15 }, (_, i) => ({
        // Missing all required fields
        invalid_field: `value_${i}`
      }));

      const result = importManager.validateCSVData(invalidData, 'alumni');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeLessThanOrEqual(11); // 10 errors + summary message
      expect(result.errors.some(error => error.includes('more validation errors'))).toBe(true);
    });
  });

  describe('Data Transformation', () => {
    it('should transform alumni CSV row to database record', () => {
      const csvRow = {
        full_name: '  John Doe  ',
        class_year: '2020',
        role: '  Student  ',
        composite_image_path: '/path/to/composite.jpg',
        caption: '  Class President  ',
        tags: '  leadership,student  ',
        sort_key: 'doe_john'
      };

      // Access private method through any cast for testing
      const transformed = (importManager as any).transformRowToRecord(csvRow, 'alumni');

      expect(transformed.full_name).toBe('John Doe');
      expect(transformed.class_year).toBe(2020);
      expect(transformed.role).toBe('Student');
      expect(transformed.caption).toBe('Class President');
      expect(transformed.tags).toBe('leadership,student');
    });

    it('should handle missing optional fields in transformation', () => {
      const csvRow = {
        full_name: 'Jane Smith',
        class_year: '2021',
        role: 'Student',
        sort_key: 'smith_jane'
        // Missing optional fields
      };

      const transformed = (importManager as any).transformRowToRecord(csvRow, 'alumni');

      expect(transformed.full_name).toBe('Jane Smith');
      expect(transformed.composite_image_path).toBeNull();
      expect(transformed.portrait_path).toBeNull();
      expect(transformed.caption).toBeNull();
    });

    it('should generate sort_key from full_name if not provided', () => {
      const csvRow = {
        full_name: 'Bob Johnson',
        class_year: '2019',
        role: 'Student'
        // Missing sort_key
      };

      const transformed = (importManager as any).transformRowToRecord(csvRow, 'alumni');

      expect(transformed.sort_key).toBe('bob_johnson');
    });

    it('should transform publications data correctly', () => {
      const csvRow = {
        title: '  Legal Ethics  ',
        pub_name: 'Law Review',
        pdf_path: '/path/to/article.pdf',
        description: '  Analysis of ethics  ',
        tags: '  ethics,law  '
      };

      const transformed = (importManager as any).transformRowToRecord(csvRow, 'publications');

      expect(transformed.title).toBe('Legal Ethics');
      expect(transformed.pub_name).toBe('Law Review');
      expect(transformed.description).toBe('Analysis of ethics');
      expect(transformed.tags).toBe('ethics,law');
    });
  });

  describe('Required Fields Validation', () => {
    it('should return correct required fields for each table type', () => {
      const alumniFields = (importManager as any).getRequiredFields('alumni');
      expect(alumniFields).toContain('full_name');
      expect(alumniFields).toContain('class_year');
      expect(alumniFields).toContain('role');
      expect(alumniFields).toContain('sort_key');

      const publicationFields = (importManager as any).getRequiredFields('publications');
      expect(publicationFields).toContain('title');
      expect(publicationFields).toContain('pub_name');
      expect(publicationFields).toContain('pdf_path');

      const photoFields = (importManager as any).getRequiredFields('photos');
      expect(photoFields).toContain('collection');
      expect(photoFields).toContain('title');
      expect(photoFields).toContain('image_path');

      const facultyFields = (importManager as any).getRequiredFields('faculty');
      expect(facultyFields).toContain('full_name');
      expect(facultyFields).toContain('title');
      expect(facultyFields).toContain('department');
    });

    it('should return empty array for unknown table type', () => {
      const fields = (importManager as any).getRequiredFields('unknown' as TableType);
      expect(fields).toEqual([]);
    });
  });

  describe('Row Validation', () => {
    it('should validate alumni row data types', () => {
      const validRow = {
        full_name: 'John Doe',
        class_year: '2020',
        role: 'Student'
      };

      const errors = (importManager as any).validateRow(validRow, 'alumni', 1);
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid alumni data types', () => {
      const invalidRow = {
        full_name: '',
        class_year: 'not_a_number',
        role: null
      };

      const errors = (importManager as any).validateRow(invalidRow, 'alumni', 1);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('Invalid or missing full_name'))).toBe(true);
      expect(errors.some(error => error.includes('Invalid or missing class_year'))).toBe(true);
      expect(errors.some(error => error.includes('Invalid or missing role'))).toBe(true);
    });

    it('should validate publication row with valid pub_name', () => {
      const validRow = {
        title: 'Test Article',
        pub_name: 'Amicus',
        pdf_path: '/path/to/pdf'
      };

      const errors = (importManager as any).validateRow(validRow, 'publications', 1);
      expect(errors).toHaveLength(0);
    });

    it('should reject publication row with invalid pub_name', () => {
      const invalidRow = {
        title: 'Test Article',
        pub_name: 'Invalid Publication',
        pdf_path: '/path/to/pdf'
      };

      const errors = (importManager as any).validateRow(invalidRow, 'publications', 1);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.includes('Invalid pub_name'))).toBe(true);
    });
  });

  describe('Backup Operations', () => {
    it('should create backup before import', async () => {
      // Mock localStorage for Node environment
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        length: 0,
        key: vi.fn(),
        clear: vi.fn()
      };
      
      Object.defineProperty(global, 'window', {
        value: { localStorage: mockLocalStorage },
        writable: true
      });

      // Mock the database manager to be available
      (importManager as any).dbManager = mockDbManager;
      mockDbManager.exportDatabase = vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4]));

      const backupPath = await importManager.backupDatabase();

      expect(backupPath).toContain('localStorage:');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle backup creation errors gracefully', async () => {
      // Mock the database manager to be available
      (importManager as any).dbManager = mockDbManager;
      mockDbManager.exportDatabase = vi.fn().mockImplementation(() => {
        throw new Error('Export failed');
      });

      await expect(importManager.backupDatabase()).rejects.toThrow('Export failed');
    });
  });

  describe('Import Statistics', () => {
    it('should return database statistics', () => {
      const mockStats = {
        alumni: 100,
        publications: 50,
        photos: 200,
        faculty: 25
      };

      // Mock the database manager to be available
      (importManager as any).dbManager = mockDbManager;
      mockDbManager.getStats = vi.fn().mockReturnValue(mockStats);

      const stats = importManager.getImportStats();
      expect(stats).toEqual(mockStats);
    });

    it('should return null when database manager not available', () => {
      const importManagerWithoutDb = new ImportManager({} as DatabaseConnection);
      const stats = importManagerWithoutDb.getImportStats();
      expect(stats).toBeNull();
    });
  });

  describe('Backup Management', () => {
    beforeEach(() => {
      // Mock localStorage for Node environment
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        length: 3,
        key: vi.fn((index: number) => {
          const keys = ['kiosk-backup-2023-01-01', 'kiosk-backup-2023-01-02', 'other-key'];
          return keys[index];
        }),
        clear: vi.fn()
      };
      
      Object.defineProperty(global, 'window', {
        value: { localStorage: mockLocalStorage },
        writable: true
      });
    });

    it('should list available backups', () => {
      const backups = importManager.listBackups();
      expect(backups.length).toBeGreaterThan(0);
      expect(backups.every(backup => backup.startsWith('localStorage:'))).toBe(true);
    });

    it('should cleanup old backups', () => {
      const mockRemoveItem = vi.fn();
      Object.defineProperty(global, 'window', {
        value: {
          localStorage: {
            removeItem: mockRemoveItem,
            length: 10,
            key: vi.fn((index: number) => `kiosk-backup-2023-01-${index.toString().padStart(2, '0')}`)
          }
        },
        writable: true
      });

      importManager.cleanupBackups(5);
      expect(mockRemoveItem).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle CSV parsing errors', async () => {
      const invalidCSV = 'invalid,csv,data\nwith"unclosed,quotes';

      const result = await importManager.importFromCSV(invalidCSV, 'alumni');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should rollback transaction on import failure', async () => {
      // Mock localStorage for backup
      Object.defineProperty(global, 'window', {
        value: { localStorage: { setItem: vi.fn() } },
        writable: true
      });

      // Mock database manager methods
      (importManager as any).dbManager = mockDbManager;
      mockDbManager.exportDatabase = vi.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
      mockDbManager.rebuildIndexes = vi.fn().mockImplementation(() => {
        throw new Error('Index rebuild failed');
      });
      
      mockDbManager.executeStatement = vi.fn();

      const csvData = 'full_name,class_year,role,sort_key\nJohn Doe,2020,Student,doe_john';

      const result = await importManager.importFromCSV(csvData, 'alumni');
      expect(result.success).toBe(false);
      expect(mockDbManager.executeStatement).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});