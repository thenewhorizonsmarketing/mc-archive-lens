// CSV Import Manager for SQLite FTS5 search system
import Papa from 'papaparse';
import { DatabaseManager } from './manager';
import { DatabaseConnection } from './connection';
import {
  AlumniRecord,
  PublicationRecord,
  PhotoRecord,
  FacultyRecord,
  TableType,
  ImportResult,
  ValidationResult,
  DatabaseError
} from './types';

export interface CSVImportOptions {
  skipFirstRow?: boolean;
  delimiter?: string;
  encoding?: string;
  batchSize?: number;
}

export class ImportManager {
  private dbConnection: DatabaseConnection;
  private dbManager: DatabaseManager | null = null;

  constructor(dbConnection: DatabaseConnection) {
    this.dbConnection = dbConnection;
  }

  /**
   * Import data from CSV file
   */
  async importFromCSV(
    csvContent: string,
    tableType: TableType,
    options: CSVImportOptions = {}
  ): Promise<ImportResult> {
    const {
      skipFirstRow = true,
      delimiter = ',',
      batchSize = 100
    } = options;

    try {
      // Ensure database connection
      if (!this.dbConnection.connected) {
        await this.dbConnection.connect();
      }
      this.dbManager = this.dbConnection.getManager();

      // Create backup before import
      const backupPath = await this.backupDatabase();
      console.log(`Database backed up to: ${backupPath}`);

      // Parse CSV data
      const parseResult = Papa.parse(csvContent, {
        delimiter,
        header: skipFirstRow,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_')
      });

      if (parseResult.errors.length > 0) {
        throw new DatabaseError(
          `CSV parsing failed: ${parseResult.errors.map(e => e.message).join(', ')}`
        );
      }

      const rawData = parseResult.data as any[];
      console.log(`Parsed ${rawData.length} rows from CSV`);

      // Validate CSV data
      const validation = this.validateCSVData(rawData, tableType);
      if (!validation.isValid) {
        return {
          success: false,
          recordsImported: 0,
          errors: validation.errors
        };
      }

      // Transform and import data in batches
      let recordsImported = 0;
      const errors: string[] = [];

      // Begin transaction
      this.dbManager.executeStatement('BEGIN TRANSACTION');

      try {
        // Clear existing data for the table
        await this.clearTableData(tableType);

        // Process data in batches
        for (let i = 0; i < rawData.length; i += batchSize) {
          const batch = rawData.slice(i, i + batchSize);
          const batchResult = await this.processBatch(batch, tableType);
          
          recordsImported += batchResult.recordsImported;
          errors.push(...batchResult.errors);

          // Log progress
          if (i % (batchSize * 5) === 0) {
            console.log(`Processed ${Math.min(i + batchSize, rawData.length)} / ${rawData.length} records`);
          }
        }

        // Rebuild FTS5 indexes
        await this.updateFTSIndexes();

        // Commit transaction
        this.dbManager.executeStatement('COMMIT');

        console.log(`Import completed: ${recordsImported} records imported`);

        return {
          success: errors.length === 0,
          recordsImported,
          errors
        };

      } catch (error) {
        // Rollback transaction on error
        this.dbManager.executeStatement('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        recordsImported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown import error']
      };
    }
  }

  /**
   * Validate CSV data structure and content
   */
  validateCSVData(data: any[], tableType: TableType): ValidationResult {
    const errors: string[] = [];

    if (!data || data.length === 0) {
      errors.push('CSV file is empty or contains no valid data');
      return { isValid: false, errors };
    }

    // Check required fields based on table type
    const requiredFields = this.getRequiredFields(tableType);
    const firstRow = data[0];

    // Validate headers
    for (const field of requiredFields) {
      if (!(field in firstRow)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate data types and content
    data.forEach((row, index) => {
      const rowErrors = this.validateRow(row, tableType, index + 1);
      errors.push(...rowErrors);
    });

    // Limit error reporting to first 10 errors
    if (errors.length > 10) {
      const remainingErrors = errors.length - 10;
      errors.splice(10);
      errors.push(`... and ${remainingErrors} more validation errors`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get required fields for each table type
   */
  private getRequiredFields(tableType: TableType): string[] {
    switch (tableType) {
      case 'alumni':
        return ['full_name', 'class_year', 'role', 'sort_key'];
      case 'publications':
        return ['title', 'pub_name', 'pdf_path'];
      case 'photos':
        return ['collection', 'title', 'image_path'];
      case 'faculty':
        return ['full_name', 'title', 'department'];
      default:
        return [];
    }
  }

  /**
   * Validate individual row data
   */
  private validateRow(row: any, tableType: TableType, rowNumber: number): string[] {
    const errors: string[] = [];

    switch (tableType) {
      case 'alumni':
        if (!row.full_name || typeof row.full_name !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing full_name`);
        }
        if (!row.class_year || isNaN(parseInt(row.class_year))) {
          errors.push(`Row ${rowNumber}: Invalid or missing class_year`);
        }
        if (!row.role || typeof row.role !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing role`);
        }
        break;

      case 'publications':
        if (!row.title || typeof row.title !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing title`);
        }
        if (!['Amicus', 'Legal Eye', 'Law Review', 'Directory'].includes(row.pub_name)) {
          errors.push(`Row ${rowNumber}: Invalid pub_name. Must be one of: Amicus, Legal Eye, Law Review, Directory`);
        }
        if (!row.pdf_path || typeof row.pdf_path !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing pdf_path`);
        }
        break;

      case 'photos':
        if (!row.collection || typeof row.collection !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing collection`);
        }
        if (!row.title || typeof row.title !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing title`);
        }
        if (!row.image_path || typeof row.image_path !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing image_path`);
        }
        break;

      case 'faculty':
        if (!row.full_name || typeof row.full_name !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing full_name`);
        }
        if (!row.title || typeof row.title !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing title`);
        }
        if (!row.department || typeof row.department !== 'string') {
          errors.push(`Row ${rowNumber}: Invalid or missing department`);
        }
        break;
    }

    return errors;
  }

  /**
   * Process a batch of records
   */
  private async processBatch(batch: any[], tableType: TableType): Promise<ImportResult> {
    let recordsImported = 0;
    const errors: string[] = [];

    for (const row of batch) {
      try {
        const transformedRecord = this.transformRowToRecord(row, tableType);
        await this.insertRecord(transformedRecord, tableType);
        recordsImported++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to import record: ${errorMessage}`);
      }
    }

    return {
      success: errors.length === 0,
      recordsImported,
      errors
    };
  }

  /**
   * Transform CSV row to database record
   */
  private transformRowToRecord(row: any, tableType: TableType): any {
    switch (tableType) {
      case 'alumni':
        return {
          full_name: row.full_name?.trim() || '',
          class_year: parseInt(row.class_year) || null,
          role: row.role?.trim() || '',
          composite_image_path: row.composite_image_path?.trim() || null,
          portrait_path: row.portrait_path?.trim() || null,
          caption: row.caption?.trim() || null,
          tags: row.tags?.trim() || '',
          sort_key: row.sort_key?.trim() || row.full_name?.toLowerCase().replace(/\s+/g, '_') || ''
        } as Partial<AlumniRecord>;

      case 'publications':
        return {
          title: row.title?.trim() || '',
          pub_name: row.pub_name?.trim() || '',
          issue_date: row.issue_date?.trim() || null,
          volume_issue: row.volume_issue?.trim() || null,
          pdf_path: row.pdf_path?.trim() || '',
          thumb_path: row.thumb_path?.trim() || null,
          description: row.description?.trim() || '',
          tags: row.tags?.trim() || ''
        } as Partial<PublicationRecord>;

      case 'photos':
        return {
          collection: row.collection?.trim() || '',
          title: row.title?.trim() || '',
          year_or_decade: row.year_or_decade?.trim() || null,
          image_path: row.image_path?.trim() || '',
          caption: row.caption?.trim() || '',
          tags: row.tags?.trim() || ''
        } as Partial<PhotoRecord>;

      case 'faculty':
        return {
          full_name: row.full_name?.trim() || '',
          title: row.title?.trim() || '',
          department: row.department?.trim() || '',
          email: row.email?.trim() || null,
          phone: row.phone?.trim() || null,
          headshot_path: row.headshot_path?.trim() || null
        } as Partial<FacultyRecord>;

      default:
        throw new DatabaseError(`Unknown table type: ${tableType}`);
    }
  }

  /**
   * Insert record into database
   */
  private async insertRecord(record: any, tableType: TableType): Promise<void> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    const fields = Object.keys(record).filter(key => record[key] !== null && record[key] !== undefined);
    const values = fields.map(key => record[key]);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `
      INSERT INTO ${tableType} (${fields.join(', ')})
      VALUES (${placeholders})
    `;

    this.dbManager.executeStatement(sql, values);
  }

  /**
   * Clear existing data from table
   */
  private async clearTableData(tableType: TableType): Promise<void> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    this.dbManager.executeStatement(`DELETE FROM ${tableType}`);
    console.log(`Cleared existing data from ${tableType} table`);
  }

  /**
   * Create database backup
   */
  async backupDatabase(): Promise<string> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `kiosk-backup-${timestamp}`;

    // Export database to Uint8Array
    const dbData = this.dbManager.exportDatabase();

    // In a real application, you would save this to a file
    // For now, we'll store it in localStorage or return the data
    if (typeof window !== 'undefined' && window.localStorage) {
      // Browser environment - store in localStorage
      const base64Data = btoa(String.fromCharCode(...dbData));
      window.localStorage.setItem(backupName, base64Data);
      return `localStorage:${backupName}`;
    } else {
      // Node environment - would typically save to file system
      console.log(`Backup created: ${backupName} (${dbData.length} bytes)`);
      return backupName;
    }
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    try {
      let dbData: Uint8Array;

      if (backupPath.startsWith('localStorage:')) {
        // Restore from localStorage
        const backupName = backupPath.replace('localStorage:', '');
        const base64Data = window.localStorage.getItem(backupName);
        
        if (!base64Data) {
          throw new DatabaseError(`Backup not found: ${backupName}`);
        }

        const binaryString = atob(base64Data);
        dbData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          dbData[i] = binaryString.charCodeAt(i);
        }
      } else {
        throw new DatabaseError('Backup restoration from file system not implemented in browser environment');
      }

      // Load the backup data
      this.dbManager.loadDatabase(dbData);
      console.log(`Database restored from backup: ${backupPath}`);

    } catch (error) {
      throw new DatabaseError(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update FTS5 indexes after data import
   */
  async updateFTSIndexes(): Promise<void> {
    if (!this.dbManager) {
      throw new DatabaseError('Database manager not initialized');
    }

    await this.dbManager.rebuildIndexes();
    console.log('FTS5 indexes updated successfully');
  }

  /**
   * Get import statistics
   */
  getImportStats(): any {
    if (!this.dbManager) {
      return null;
    }

    return this.dbManager.getStats();
  }

  /**
   * List available backups
   */
  listBackups(): string[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      const backups: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('kiosk-backup-')) {
          backups.push(`localStorage:${key}`);
        }
      }
      return backups.sort().reverse(); // Most recent first
    }
    return [];
  }

  /**
   * Delete old backups (keep only the most recent N backups)
   */
  cleanupBackups(keepCount: number = 5): void {
    const backups = this.listBackups();
    
    if (backups.length > keepCount) {
      const toDelete = backups.slice(keepCount);
      
      toDelete.forEach(backup => {
        if (backup.startsWith('localStorage:')) {
          const backupName = backup.replace('localStorage:', '');
          window.localStorage.removeItem(backupName);
        }
      });

      console.log(`Cleaned up ${toDelete.length} old backups, kept ${keepCount} most recent`);
    }
  }
}

// Export singleton instance
export const importManager = new ImportManager(
  // This will be injected when the connection is established
  {} as DatabaseConnection
);