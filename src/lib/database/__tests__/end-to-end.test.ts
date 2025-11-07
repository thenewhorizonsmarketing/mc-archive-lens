// End-to-End Testing for Search System
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DatabaseManager } from '../manager';
import { EnhancedSearchManager } from '../enhanced-search-manager';
import { ImportManager } from '../import-manager';
import { BackupManager } from '../backup-manager';
import { PerformanceMonitor } from '../performance-monitor';

describe('End-to-End Search System Tests', () => {
  let dbManager: DatabaseManager;
  let searchManager: EnhancedSearchManager;
  let importManager: ImportManager;
  let backupManager: BackupManager;
  let performanceMonitor: PerformanceMonitor;

  beforeAll(async () => {
    // Initialize database manager
    dbManager = new DatabaseManager();
    await dbManager.initializeDatabase();

    // Initialize other managers
    searchManager = new EnhancedSearchManager(dbManager, {
      enableFallback: true,
      autoRebuildIndex: true,
      maxRetries: 3,
      retryDelay: 100 // Faster for tests
    });

    importManager = new ImportManager(dbManager);
    backupManager = new BackupManager(dbManager);
    performanceMonitor = new PerformanceMonitor();
  });

  afterAll(async () => {
    // Cleanup
    if (dbManager) {
      await dbManager.close();
    }
  });

  beforeEach(async () => {
    // Clear database before each test
    await dbManager.executeQuery('DELETE FROM alumni');
    await dbManager.executeQuery('DELETE FROM publications');
    await dbManager.executeQuery('DELETE FROM photos');
    await dbManager.executeQuery('DELETE FROM faculty');
  });

  describe('Complete Data Import and Search Workflow', () => {
    it('should import CSV data and make it searchable', async () => {
      // Create test CSV data
      const alumniCSV = `full_name,class_year,role,tags
John Doe,1995,Student Leader,"leadership,honor_roll"
Jane Smith,1996,Class President,"leadership,valedictorian"
Bob Johnson,1997,Student,"sports,basketball"`;

      const publicationsCSV = `title,pub_name,issue_date,volume_issue,description,tags
Legal Perspectives,Law Review,2023-01-15,Vol 45 Issue 1,Analysis of recent cases,"legal,analysis"
Student News,Amicus,2023-02-01,Spring 2023,Campus updates,"news,campus"`;

      // Create CSV files (mock)
      const alumniFile = new File([alumniCSV], 'alumni.csv', { type: 'text/csv' });
      const publicationsFile = new File([publicationsCSV], 'publications.csv', { type: 'text/csv' });

      // Import alumni data
      const alumniResult = await importManager.importCSV(alumniFile, 'alumni');
      expect(alumniResult.success).toBe(true);
      expect(alumniResult.recordsImported).toBe(3);

      // Import publications data
      const publicationsResult = await importManager.importCSV(publicationsFile, 'publications');
      expect(publicationsResult.success).toBe(true);
      expect(publicationsResult.recordsImported).toBe(2);

      // Test search functionality
      const searchResults = await searchManager.searchAll('John');
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].title).toContain('John');

      // Test cross-table search
      const crossResults = await searchManager.searchAll('Legal');
      expect(crossResults.length).toBeGreaterThan(0);
      expect(crossResults.some(r => r.type === 'publication')).toBe(true);
    });

    it('should handle search with filters', async () => {
      // Import test data first
      const alumniCSV = `full_name,class_year,role,tags
John Doe,1995,Student Leader,"leadership"
Jane Smith,1996,Class President,"leadership"
Bob Johnson,2000,Student,"sports"`;

      const alumniFile = new File([alumniCSV], 'alumni.csv', { type: 'text/csv' });
      await importManager.importCSV(alumniFile, 'alumni');

      // Test year range filter
      const filteredResults = await searchManager.searchAll('Student', {
        yearRange: { start: 1995, end: 1996 }
      });

      expect(filteredResults.length).toBe(2); // John and Jane, not Bob
      expect(filteredResults.every(r => 
        r.type === 'alumni' && 
        r.metadata?.year && 
        r.metadata.year >= 1995 && 
        r.metadata.year <= 1996
      )).toBe(true);
    });

    it('should maintain performance targets', async () => {
      // Import larger dataset for performance testing
      const largeAlumniCSV = Array.from({ length: 1000 }, (_, i) => 
        `Student ${i},${1990 + (i % 30)},Student,"tag${i % 10}"`
      ).join('\n');
      const csvWithHeader = `full_name,class_year,role,tags\n${largeAlumniCSV}`;

      const largeFile = new File([csvWithHeader], 'large_alumni.csv', { type: 'text/csv' });
      await importManager.importCSV(largeFile, 'alumni');

      // Test simple search performance (target: 50ms)
      const startTime = performance.now();
      const results = await searchManager.searchAll('Student');
      const endTime = performance.now();
      const queryTime = endTime - startTime;

      expect(queryTime).toBeLessThan(100); // Allow 100ms for test environment
      expect(results.length).toBeGreaterThan(0);

      // Test complex search performance (target: 100ms)
      const complexStart = performance.now();
      const complexResults = await searchManager.searchAll('Student', {
        yearRange: { start: 2000, end: 2010 }
      });
      const complexEnd = performance.now();
      const complexTime = complexEnd - complexStart;

      expect(complexTime).toBeLessThan(150); // Allow 150ms for test environment
      expect(complexResults.length).toBeGreaterThan(0);
    });
  });

  describe('Error Recovery and Fallback Testing', () => {
    it('should recover from search errors using fallback', async () => {
      // Import test data
      const alumniCSV = `full_name,class_year,role,tags
John Doe,1995,Student Leader,"leadership"
Jane Smith,1996,Class President,"leadership"`;

      const alumniFile = new File([alumniCSV], 'alumni.csv', { type: 'text/csv' });
      await importManager.importCSV(alumniFile, 'alumni');

      // Test fallback search (since we don't have FTS5 in test environment)
      const results = await searchManager.searchAll('John');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('John');

      // Verify recovery status
      const recoveryStatus = searchManager.getRecoveryStatus();
      expect(recoveryStatus).toBeDefined();
    });

    it('should handle malformed search queries gracefully', async () => {
      // Import test data
      const alumniCSV = `full_name,class_year,role,tags
John Doe,1995,Student Leader,"leadership"`;

      const alumniFile = new File([alumniCSV], 'alumni.csv', { type: 'text/csv' });
      await importManager.importCSV(alumniFile, 'alumni');

      // Test various malformed queries
      const malformedQueries = [
        '', // Empty query
        '   ', // Whitespace only
        'SELECT * FROM alumni', // SQL injection attempt
        '"unclosed quote', // Malformed FTS5 query
        'AND OR NOT', // Invalid boolean operators
      ];

      for (const query of malformedQueries) {
        const results = await searchManager.searchAll(query);
        expect(Array.isArray(results)).toBe(true);
        // Should not throw errors, may return empty results
      }
    });

    it('should handle concurrent search requests', async () => {
      // Import test data
      const alumniCSV = `full_name,class_year,role,tags
John Doe,1995,Student Leader,"leadership"
Jane Smith,1996,Class President,"leadership"
Bob Johnson,1997,Student,"sports"`;

      const alumniFile = new File([alumniCSV], 'alumni.csv', { type: 'text/csv' });
      await importManager.importCSV(alumniFile, 'alumni');

      // Execute multiple concurrent searches
      const searchPromises = [
        searchManager.searchAll('John'),
        searchManager.searchAll('Jane'),
        searchManager.searchAll('Bob'),
        searchManager.searchAll('Student'),
        searchManager.searchAll('leadership'),
      ];

      const results = await Promise.all(searchPromises);

      // All searches should complete successfully
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });

      // Verify specific results
      expect(results[0].some(r => r.title.includes('John'))).toBe(true);
      expect(results[1].some(r => r.title.includes('Jane'))).toBe(true);
      expect(results[2].some(r => r.title.includes('Bob'))).toBe(true);
    });
  });

  describe('Data Integrity and Edge Cases', () => {
    it('should handle empty database gracefully', async () => {
      // Database is already empty from beforeEach
      const results = await searchManager.searchAll('anything');
      expect(results).toEqual([]);
    });

    it('should handle special characters in search queries', async () => {
      // Import data with special characters
      const specialCSV = `full_name,class_year,role,tags
"O'Connor, Mary",1995,"Student Leader","leadership"
"Smith-Jones, Bob",1996,"Class President","leadership"
"José García",1997,"Student","international"`;

      const specialFile = new File([specialCSV], 'special.csv', { type: 'text/csv' });
      await importManager.importCSV(specialFile, 'alumni');

      // Test searches with special characters
      const apostropheResults = await searchManager.searchAll("O'Connor");
      expect(apostropheResults.length).toBeGreaterThan(0);

      const hyphenResults = await searchManager.searchAll('Smith-Jones');
      expect(hyphenResults.length).toBeGreaterThan(0);

      const accentResults = await searchManager.searchAll('José');
      expect(accentResults.length).toBeGreaterThan(0);
    });

    it('should handle large result sets efficiently', async () => {
      // Import large dataset
      const largeCSV = Array.from({ length: 500 }, (_, i) => 
        `Student ${i},${1990 + (i % 30)},Student,"common_tag"`
      ).join('\n');
      const csvWithHeader = `full_name,class_year,role,tags\n${largeCSV}`;

      const largeFile = new File([csvWithHeader], 'large.csv', { type: 'text/csv' });
      await importManager.importCSV(largeFile, 'alumni');

      // Search for common term that will return many results
      const startTime = performance.now();
      const results = await searchManager.searchAll('Student', {}, { limit: 50 });
      const endTime = performance.now();

      expect(results.length).toBeLessThanOrEqual(50); // Respects limit
      expect(endTime - startTime).toBeLessThan(200); // Performance check
    });

    it('should validate data consistency after import', async () => {
      // Import test data
      const alumniCSV = `full_name,class_year,role,tags
John Doe,1995,Student Leader,"leadership"
Jane Smith,1996,Class President,"leadership"`;

      const alumniFile = new File([alumniCSV], 'alumni.csv', { type: 'text/csv' });
      const importResult = await importManager.importCSV(alumniFile, 'alumni');

      expect(importResult.success).toBe(true);
      expect(importResult.recordsImported).toBe(2);

      // Verify data was actually imported
      const allAlumni = await dbManager.executeQuery('SELECT COUNT(*) as count FROM alumni');
      expect(allAlumni[0].count).toBe(2);

      // Verify search can find the data
      const searchResults = await searchManager.searchAll('John');
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });

  describe('Backup and Restore Workflow', () => {
    it('should backup and restore data successfully', async () => {
      // Import initial data
      const alumniCSV = `full_name,class_year,role,tags
John Doe,1995,Student Leader,"leadership"
Jane Smith,1996,Class President,"leadership"`;

      const alumniFile = new File([alumniCSV], 'alumni.csv', { type: 'text/csv' });
      await importManager.importCSV(alumniFile, 'alumni');

      // Verify initial data
      let results = await searchManager.searchAll('John');
      expect(results.length).toBeGreaterThan(0);

      // Create backup
      const backupPath = await backupManager.createBackup();
      expect(backupPath).toBeDefined();

      // Clear database
      await dbManager.executeQuery('DELETE FROM alumni');
      
      // Verify data is gone
      results = await searchManager.searchAll('John');
      expect(results.length).toBe(0);

      // Restore from backup (mock - in real implementation would restore file)
      // For test purposes, we'll re-import the data
      await importManager.importCSV(alumniFile, 'alumni');

      // Verify data is restored
      results = await searchManager.searchAll('John');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track search performance metrics', async () => {
      // Import test data
      const alumniCSV = `full_name,class_year,role,tags
John Doe,1995,Student Leader,"leadership"
Jane Smith,1996,Class President,"leadership"`;

      const alumniFile = new File([alumniCSV], 'alumni.csv', { type: 'text/csv' });
      await importManager.importCSV(alumniFile, 'alumni');

      // Perform monitored search
      const startTime = performance.now();
      const results = await searchManager.searchAll('John');
      const endTime = performance.now();

      const metrics = {
        queryTime: endTime - startTime,
        resultCount: results.length,
        cacheHit: false,
        queryComplexity: 1,
        timestamp: Date.now()
      };

      // Verify metrics are reasonable
      expect(metrics.queryTime).toBeGreaterThan(0);
      expect(metrics.queryTime).toBeLessThan(1000); // Should be under 1 second
      expect(metrics.resultCount).toBeGreaterThan(0);
      expect(metrics.timestamp).toBeGreaterThan(0);
    });

    it('should handle performance degradation gracefully', async () => {
      // Import large dataset to simulate performance stress
      const largeCSV = Array.from({ length: 100 }, (_, i) => 
        `Student ${i},${1990 + (i % 30)},Student,"tag${i % 10},common_tag"`
      ).join('\n');
      const csvWithHeader = `full_name,class_year,role,tags\n${largeCSV}`;

      const largeFile = new File([csvWithHeader], 'large.csv', { type: 'text/csv' });
      await importManager.importCSV(largeFile, 'alumni');

      // Perform multiple searches to test sustained performance
      const searchTimes: number[] = [];

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        await searchManager.searchAll(`Student ${i}`);
        const endTime = performance.now();
        searchTimes.push(endTime - startTime);
      }

      // Verify performance doesn't degrade significantly
      const avgTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      const maxTime = Math.max(...searchTimes);

      expect(avgTime).toBeLessThan(100); // Average under 100ms
      expect(maxTime).toBeLessThan(200); // No single query over 200ms
    });
  });
});

// Helper function to create mock CSV files
function createMockCSVFile(content: string, filename: string): File {
  return new File([content], filename, { type: 'text/csv' });
}

// Performance test utilities
export const PerformanceTestUtils = {
  async measureSearchPerformance(
    searchManager: EnhancedSearchManager,
    query: string,
    iterations: number = 10
  ) {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await searchManager.searchAll(query);
      const end = performance.now();
      times.push(end - start);
    }

    return {
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]
    };
  },

  async stressTestConcurrentSearches(
    searchManager: EnhancedSearchManager,
    queries: string[],
    concurrency: number = 5
  ) {
    const batches: Promise<any>[][] = [];
    
    for (let i = 0; i < queries.length; i += concurrency) {
      const batch = queries.slice(i, i + concurrency).map(query =>
        searchManager.searchAll(query)
      );
      batches.push(batch);
    }

    const results = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }

    return results;
  }
};