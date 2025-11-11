/**
 * Database Migration Utilities
 * 
 * This module provides utilities for migrating existing databases to support
 * new schema changes, particularly the addition of flipbook_path support.
 */

import { DatabaseManager } from './manager';
import { DatabaseError } from './types';

export interface MigrationResult {
  success: boolean;
  version: string;
  migrationsApplied: string[];
  errors: string[];
}

/**
 * Apply all pending migrations to the database
 * This function is idempotent and safe to run multiple times
 */
export async function applyMigrations(dbManager: DatabaseManager): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    version: '1.1.0',
    migrationsApplied: [],
    errors: []
  };

  try {
    if (!dbManager.initialized) {
      throw new DatabaseError('Database must be initialized before running migrations');
    }

    // Get current schema version
    const currentVersion = dbManager.getMetadata('schema_version') || '1.0.0';
    console.log(`Current schema version: ${currentVersion}`);

    // Migration 1: Add flipbook_path column (v1.1.0)
    if (compareVersions(currentVersion, '1.1.0') < 0) {
      try {
        await migrateAddFlipbookPath(dbManager);
        result.migrationsApplied.push('add_flipbook_path');
        console.log('✓ Migration: Added flipbook_path column');
      } catch (error) {
        const errorMsg = `Failed to add flipbook_path column: ${error}`;
        result.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // Update schema version if all migrations succeeded
    if (result.errors.length === 0) {
      dbManager.executeStatement(
        "INSERT OR REPLACE INTO metadata (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        ['schema_version', '1.1.0']
      );
      console.log('✓ Schema version updated to 1.1.0');
    } else {
      result.success = false;
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error('Migration error:', error);
  }

  return result;
}

/**
 * Migration: Add flipbook_path column to publications table
 */
async function migrateAddFlipbookPath(dbManager: DatabaseManager): Promise<void> {
  try {
    // Check if column already exists
    const tableInfo = dbManager.executeQuery("PRAGMA table_info(publications)");
    const hasFlipbookPath = tableInfo.some((col: any) => col.name === 'flipbook_path');

    if (hasFlipbookPath) {
      console.log('flipbook_path column already exists, skipping migration');
      return;
    }

    // Add the column
    dbManager.executeStatement('ALTER TABLE publications ADD COLUMN flipbook_path TEXT');
    console.log('Successfully added flipbook_path column to publications table');

  } catch (error) {
    throw new DatabaseError(`Failed to add flipbook_path column: ${error}`);
  }
}

/**
 * Check if a specific migration has been applied
 */
export function isMigrationApplied(dbManager: DatabaseManager, migrationName: string): boolean {
  try {
    const tableInfo = dbManager.executeQuery("PRAGMA table_info(publications)");
    
    switch (migrationName) {
      case 'add_flipbook_path':
        return tableInfo.some((col: any) => col.name === 'flipbook_path');
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking migration status: ${error}`);
    return false;
  }
}

/**
 * Get list of all available migrations
 */
export function getAvailableMigrations(): string[] {
  return [
    'add_flipbook_path'
  ];
}

/**
 * Compare semantic version strings
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

/**
 * Rollback a specific migration (if possible)
 * Note: SQLite doesn't support DROP COLUMN, so rollback is limited
 */
export async function rollbackMigration(
  dbManager: DatabaseManager, 
  migrationName: string
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    version: '1.0.0',
    migrationsApplied: [],
    errors: ['Rollback not supported for SQLite ALTER TABLE operations']
  };

  console.warn('SQLite does not support DROP COLUMN. To rollback, you must restore from a backup.');
  
  return result;
}
