// Unit tests for BackupManager
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BackupManager } from '../backup-manager';
import { DatabaseConnection } from '../connection';
import { DatabaseManager } from '../manager';

// Mock the database connection and manager
const mockDbManager = {
  exportDatabase: vi.fn(),
  loadDatabase: vi.fn(),
  getStats: vi.fn(),
  executeStatement: vi.fn(),
  executeQuery: vi.fn(),
  close: vi.fn()
} as unknown as DatabaseManager;

const mockDbConnection = {
  connected: true,
  connect: vi.fn(),
  getManager: vi.fn(() => mockDbManager)
} as unknown as DatabaseConnection;

describe('BackupManager Tests', () => {
  let backupManager: BackupManager;

  beforeEach(() => {
    backupManager = new BackupManager(mockDbConnection);
    // Set up the database manager to be available
    (backupManager as any).dbManager = mockDbManager;
    vi.clearAllMocks();

    // Mock localStorage for Node environment
    const mockLocalStorage = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      length: 0,
      key: vi.fn(),
      clear: vi.fn()
    };
    
    // Mock window object for Node environment
    Object.defineProperty(global, 'window', {
      value: { localStorage: mockLocalStorage },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Backup Creation', () => {
    it('should create automatic backup successfully', async () => {
      const mockDbData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockStats = { dbVersion: '1.0.0', alumni: 100 };

      mockDbManager.exportDatabase = vi.fn().mockReturnValue(mockDbData);
      mockDbManager.getStats = vi.fn().mockReturnValue(mockStats);

      const backupPath = await backupManager.createAutoBackup('Test backup');

      expect(backupPath).toContain('localStorage:auto-backup-');
      expect(mockDbManager.exportDatabase).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalled();
    });

    it('should create named backup with metadata', async () => {
      const mockDbData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockStats = { dbVersion: '1.0.0', alumni: 100 };

      mockDbManager.exportDatabase = vi.fn().mockReturnValue(mockDbData);
      mockDbManager.getStats = vi.fn().mockReturnValue(mockStats);

      const backupPath = await backupManager.createBackup('test-backup', {
        description: 'Test backup',
        includeMetadata: true
      });

      expect(backupPath).toBe('localStorage:test-backup');
      expect(window.localStorage.setItem).toHaveBeenCalledTimes(2); // Data + metadata
    });

    it('should create backup without metadata when requested', async () => {
      const mockDbData = new Uint8Array([1, 2, 3, 4, 5]);
      const mockStats = { dbVersion: '1.0.0' };

      mockDbManager.exportDatabase = vi.fn().mockReturnValue(mockDbData);
      mockDbManager.getStats = vi.fn().mockReturnValue(mockStats);

      await backupManager.createBackup('test-backup', {
        includeMetadata: false
      });

      expect(window.localStorage.setItem).toHaveBeenCalledTimes(1); // Only data, no metadata
    });

    it('should handle backup creation errors', async () => {
      mockDbManager.exportDatabase = vi.fn().mockImplementation(() => {
        throw new Error('Export failed');
      });

      await expect(backupManager.createBackup('test-backup')).rejects.toThrow('Failed to create backup');
    });
  });

  describe('Backup Restoration', () => {
    it('should restore backup successfully', async () => {
      const mockDbData = new Uint8Array([1, 2, 3, 4, 5]);
      const base64Data = btoa(String.fromCharCode(...mockDbData));
      const mockMetadata = {
        name: 'test-backup',
        timestamp: '2023-01-01T00:00:00.000Z',
        size: 5,
        description: 'Test backup',
        version: '1.0.0'
      };

      window.localStorage.getItem = vi.fn()
        .mockReturnValueOnce(base64Data) // Backup data
        .mockReturnValueOnce(JSON.stringify(mockMetadata)); // Metadata

      mockDbManager.exportDatabase = vi.fn().mockReturnValue(new Uint8Array([6, 7, 8])); // For auto-backup

      await backupManager.restoreBackup('localStorage:test-backup');

      expect(mockDbManager.loadDatabase).toHaveBeenCalledWith(mockDbData);
      expect(window.localStorage.setItem).toHaveBeenCalled(); // Auto-backup before restore
    });

    it('should handle missing backup file', async () => {
      window.localStorage.getItem = vi.fn().mockReturnValue(null);

      await expect(backupManager.restoreBackup('localStorage:missing-backup')).rejects.toThrow('Backup not found');
    });

    it('should handle corrupted backup data', async () => {
      window.localStorage.getItem = vi.fn().mockReturnValue(''); // Empty backup

      await expect(backupManager.restoreBackup('localStorage:corrupted-backup')).rejects.toThrow('Backup file is empty or corrupted');
    });
  });

  describe('Backup Listing', () => {
    it('should list backups with metadata', async () => {
      const mockMetadata1 = {
        name: 'backup-1',
        timestamp: '2023-01-01T00:00:00.000Z',
        size: 100,
        description: 'First backup',
        version: '1.0.0'
      };

      const mockMetadata2 = {
        name: 'backup-2',
        timestamp: '2023-01-02T00:00:00.000Z',
        size: 200,
        description: 'Second backup',
        version: '1.0.0'
      };

      window.localStorage.length = 4;
      window.localStorage.key = vi.fn()
        .mockReturnValueOnce('kiosk-backup-1')
        .mockReturnValueOnce('kiosk-backup-1-metadata')
        .mockReturnValueOnce('auto-backup-2')
        .mockReturnValueOnce('other-key');

      window.localStorage.getItem = vi.fn()
        .mockReturnValueOnce(JSON.stringify(mockMetadata1))
        .mockReturnValueOnce(JSON.stringify(mockMetadata2));

      const backups = await backupManager.listBackups();

      expect(backups).toHaveLength(2);
      expect(backups[0].timestamp).toBe('2023-01-02T00:00:00.000Z'); // Most recent first
      expect(backups[1].timestamp).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should handle backups without metadata', async () => {
      window.localStorage.length = 2;
      window.localStorage.key = vi.fn()
        .mockReturnValueOnce('kiosk-backup-legacy')
        .mockReturnValueOnce('other-key');

      window.localStorage.getItem = vi.fn()
        .mockReturnValueOnce(null) // No metadata
        .mockReturnValueOnce('backup-data'); // Has backup data

      const backups = await backupManager.listBackups();

      expect(backups).toHaveLength(1);
      expect(backups[0].name).toBe('kiosk-backup-legacy');
      expect(backups[0].description).toBe('Legacy backup');
    });
  });

  describe('Backup Deletion', () => {
    it('should delete backup and metadata', async () => {
      await backupManager.deleteBackup('test-backup');

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('test-backup');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('test-backup-metadata');
    });

    it('should handle deletion errors gracefully', async () => {
      window.localStorage.removeItem = vi.fn().mockImplementation(() => {
        throw new Error('Deletion failed');
      });

      await expect(backupManager.deleteBackup('test-backup')).rejects.toThrow('Failed to delete backup');
    });
  });

  describe('Backup Information', () => {
    it('should get backup info with metadata', async () => {
      const mockMetadata = {
        name: 'test-backup',
        timestamp: '2023-01-01T00:00:00.000Z',
        size: 100,
        description: 'Test backup',
        version: '1.0.0'
      };

      window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(mockMetadata));

      const info = await backupManager.getBackupInfo('test-backup');

      expect(info).toEqual(mockMetadata);
    });

    it('should return null for non-existent backup', async () => {
      window.localStorage.getItem = vi.fn().mockReturnValue(null);

      const info = await backupManager.getBackupInfo('non-existent');

      expect(info).toBeNull();
    });

    it('should handle corrupted metadata gracefully', async () => {
      window.localStorage.getItem = vi.fn().mockReturnValue('invalid-json');

      const info = await backupManager.getBackupInfo('corrupted-metadata');

      expect(info).toBeNull();
    });
  });

  describe('Backup Verification', () => {
    it('should verify valid backup', async () => {
      const mockDbData = new Uint8Array([1, 2, 3, 4, 5]);
      const base64Data = btoa(String.fromCharCode(...mockDbData));

      window.localStorage.getItem = vi.fn().mockReturnValue(base64Data);

      // Mock a temporary database manager for verification
      const mockTempManager = {
        loadDatabase: vi.fn(),
        executeQuery: vi.fn().mockReturnValue([{ name: 'test_table' }]),
        close: vi.fn()
      };

      // Mock the constructor to return our mock
      const originalConstructor = mockDbManager.constructor;
      (mockDbManager.constructor as any) = vi.fn().mockReturnValue(mockTempManager);

      const isValid = await backupManager.verifyBackup('localStorage:test-backup');

      expect(isValid).toBe(true);

      // Restore original constructor
      (mockDbManager.constructor as any) = originalConstructor;
    });

    it('should detect invalid backup', async () => {
      window.localStorage.getItem = vi.fn().mockReturnValue(''); // Empty backup

      const isValid = await backupManager.verifyBackup('localStorage:invalid-backup');

      expect(isValid).toBe(false);
    });
  });

  describe('Storage Management', () => {
    it('should calculate storage usage', async () => {
      const mockBackups = [
        { name: 'backup-1', timestamp: '2023-01-01', size: 100, description: 'Test', version: '1.0.0' },
        { name: 'backup-2', timestamp: '2023-01-02', size: 200, description: 'Test', version: '1.0.0' }
      ];

      // Mock listBackups method
      backupManager.listBackups = vi.fn().mockResolvedValue(mockBackups);

      const usage = await backupManager.getStorageUsage();

      expect(usage.totalSize).toBe(300);
      expect(usage.backupCount).toBe(2);
      expect(usage.formattedSize).toBe('300 Bytes');
    });

    it('should format bytes correctly', () => {
      // Access private method through any cast for testing
      const formatBytes = (backupManager as any).formatBytes;

      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should set maximum backup count', () => {
      backupManager.setMaxBackups(3);
      // This would be tested by checking if cleanup works with the new limit
      // For now, we just verify the method doesn't throw
      expect(() => backupManager.setMaxBackups(3)).not.toThrow();
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup old backups when limit exceeded', async () => {
      const mockBackups = Array.from({ length: 12 }, (_, i) => ({
        name: `backup-${i}`,
        timestamp: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
        size: 100,
        description: 'Test',
        version: '1.0.0'
      }));

      backupManager.listBackups = vi.fn().mockResolvedValue(mockBackups);
      backupManager.deleteBackup = vi.fn().mockResolvedValue(undefined);

      // Set max backups to 10
      backupManager.setMaxBackups(10);

      // Trigger cleanup by creating a new backup
      mockDbManager.exportDatabase = vi.fn().mockReturnValue(new Uint8Array([1, 2, 3]));
      mockDbManager.getStats = vi.fn().mockReturnValue({ dbVersion: '1.0.0' });

      await backupManager.createBackup('new-backup');

      // Should have called deleteBackup for excess backups
      expect(backupManager.deleteBackup).toHaveBeenCalled();
    });
  });
});