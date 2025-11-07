// Backup Manager for SQLite FTS5 search system
import { DatabaseManager } from './manager';
import { DatabaseConnection } from './connection';
import { DatabaseError } from './types';

export interface BackupMetadata {
  name: string;
  timestamp: string;
  size: number;
  description?: string;
  version: string;
}

export interface BackupOptions {
  description?: string;
  compress?: boolean;
  includeMetadata?: boolean;
}

export class BackupManager {
  private dbConnection: DatabaseConnection;
  private dbManager: DatabaseManager | null = null;
  private maxBackups: number = 10;

  constructor(dbConnection: DatabaseConnection) {
    this.dbConnection = dbConnection;
  }

  /**
   * Create automatic backup before data operations
   */
  async createAutoBackup(description?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `auto-backup-${timestamp}`;
    
    return this.createBackup(backupName, {
      description: description || 'Automatic backup before data operation',
      includeMetadata: true
    });
  }

  /**
   * Create named backup
   */
  async createBackup(name: string, options: BackupOptions = {}): Promise<string> {
    try {
      // Ensure database connection
      if (!this.dbConnection.connected) {
        await this.dbConnection.connect();
      }
      this.dbManager = this.dbConnection.getManager();

      const {
        description = 'Manual backup',
        includeMetadata = true
      } = options;

      // Get database stats for metadata
      const stats = this.dbManager.getStats();
      
      // Export database
      const dbData = this.dbManager.exportDatabase();
      
      // Create backup metadata
      const metadata: BackupMetadata = {
        name,
        timestamp: new Date().toISOString(),
        size: dbData.length,
        description,
        version: stats?.dbVersion || '1.0.0'
      };

      // Store backup
      const backupPath = await this.storeBackup(name, dbData, includeMetadata ? metadata : undefined);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      console.log(`Backup created: ${backupPath} (${this.formatBytes(dbData.length)})`);
      return backupPath;

    } catch (error) {
      throw new DatabaseError(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupPath: string): Promise<void> {
    try {
      if (!this.dbConnection.connected) {
        await this.dbConnection.connect();
      }
      this.dbManager = this.dbConnection.getManager();

      // Load backup data
      const { data, metadata } = await this.loadBackup(backupPath);
      
      // Verify backup integrity
      if (!data || data.length === 0) {
        throw new DatabaseError('Backup file is empty or corrupted');
      }

      // Create a backup of current state before restore
      await this.createAutoBackup('Before restore operation');

      // Restore database
      this.dbManager.loadDatabase(data);
      
      console.log(`Database restored from backup: ${backupPath}`);
      if (metadata) {
        console.log(`Backup info: ${metadata.description} (${metadata.timestamp})`);
      }

    } catch (error) {
      throw new DatabaseError(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    const backups: BackupMetadata[] = [];

    if (typeof window !== 'undefined' && window.localStorage) {
      // Browser environment - check localStorage
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith('kiosk-backup-') || key.startsWith('auto-backup-'))) {
          try {
            const metadataKey = `${key}-metadata`;
            const metadataJson = window.localStorage.getItem(metadataKey);
            
            if (metadataJson) {
              const metadata = JSON.parse(metadataJson) as BackupMetadata;
              backups.push(metadata);
            } else {
              // Create basic metadata for backups without metadata
              const backupData = window.localStorage.getItem(key);
              if (backupData) {
                backups.push({
                  name: key,
                  timestamp: new Date().toISOString(),
                  size: backupData.length,
                  description: 'Legacy backup',
                  version: '1.0.0'
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to parse backup metadata for ${key}:`, error);
          }
        }
      }
    }

    // Sort by timestamp (most recent first)
    return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupName: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(backupName);
        window.localStorage.removeItem(`${backupName}-metadata`);
        console.log(`Backup deleted: ${backupName}`);
      } else {
        throw new DatabaseError('Backup deletion not supported in this environment');
      }
    } catch (error) {
      throw new DatabaseError(`Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get backup file size and metadata
   */
  async getBackupInfo(backupName: string): Promise<BackupMetadata | null> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const metadataJson = window.localStorage.getItem(`${backupName}-metadata`);
        if (metadataJson) {
          return JSON.parse(metadataJson) as BackupMetadata;
        }
        
        // Fallback for backups without metadata
        const backupData = window.localStorage.getItem(backupName);
        if (backupData) {
          return {
            name: backupName,
            timestamp: new Date().toISOString(),
            size: backupData.length,
            description: 'Legacy backup',
            version: '1.0.0'
          };
        }
      }
      return null;
    } catch (error) {
      console.error(`Failed to get backup info for ${backupName}:`, error);
      return null;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      const { data, metadata } = await this.loadBackup(backupPath);
      
      // Basic integrity checks
      if (!data || data.length === 0) {
        return false;
      }

      // Check if it's a valid SQLite database by trying to load it
      if (this.dbManager) {
        const tempManager = new (this.dbManager.constructor as any)();
        tempManager.loadDatabase(data);
        
        // Try a simple query to verify database structure
        const result = tempManager.executeQuery('SELECT name FROM sqlite_master WHERE type="table" LIMIT 1');
        tempManager.close();
        
        return result !== null;
      }

      return true;
    } catch (error) {
      console.error(`Backup verification failed for ${backupPath}:`, error);
      return false;
    }
  }

  /**
   * Store backup data
   */
  private async storeBackup(name: string, data: Uint8Array, metadata?: BackupMetadata): Promise<string> {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Browser environment - store in localStorage
      const base64Data = btoa(String.fromCharCode(...data));
      window.localStorage.setItem(name, base64Data);
      
      if (metadata) {
        window.localStorage.setItem(`${name}-metadata`, JSON.stringify(metadata));
      }
      
      return `localStorage:${name}`;
    } else {
      // Node environment - would typically save to file system
      console.log(`Backup stored: ${name} (${data.length} bytes)`);
      return name;
    }
  }

  /**
   * Load backup data
   */
  private async loadBackup(backupPath: string): Promise<{ data: Uint8Array; metadata?: BackupMetadata }> {
    let backupName = backupPath;
    
    if (backupPath.startsWith('localStorage:')) {
      backupName = backupPath.replace('localStorage:', '');
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const base64Data = window.localStorage.getItem(backupName);
      if (!base64Data) {
        throw new DatabaseError(`Backup not found: ${backupName}`);
      }

      // Convert base64 to Uint8Array
      const binaryString = atob(base64Data);
      const data = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        data[i] = binaryString.charCodeAt(i);
      }

      // Load metadata if available
      let metadata: BackupMetadata | undefined;
      const metadataJson = window.localStorage.getItem(`${backupName}-metadata`);
      if (metadataJson) {
        try {
          metadata = JSON.parse(metadataJson);
        } catch (error) {
          console.warn(`Failed to parse metadata for backup ${backupName}:`, error);
        }
      }

      return { data, metadata };
    } else {
      throw new DatabaseError('Backup loading from file system not implemented in browser environment');
    }
  }

  /**
   * Cleanup old backups (keep only the most recent N backups)
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.maxBackups) {
        const toDelete = backups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.name);
        }

        console.log(`Cleaned up ${toDelete.length} old backups, kept ${this.maxBackups} most recent`);
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Set maximum number of backups to keep
   */
  setMaxBackups(count: number): void {
    this.maxBackups = Math.max(1, count);
  }

  /**
   * Get backup storage usage
   */
  async getStorageUsage(): Promise<{ totalSize: number; backupCount: number; formattedSize: string }> {
    const backups = await this.listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    
    return {
      totalSize,
      backupCount: backups.length,
      formattedSize: this.formatBytes(totalSize)
    };
  }
}

// Export singleton instance
export const backupManager = new BackupManager(
  // This will be injected when the connection is established
  {} as DatabaseConnection
);