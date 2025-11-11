#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script applies database migrations to add support for flipbook_path
 * and other schema changes to existing databases.
 * 
 * Usage:
 *   node scripts/migrate-database.cjs [database-file]
 * 
 * If no database file is specified, it will migrate the default database.
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('Database Migration Script');
console.log('='.repeat(60));
console.log('');

// Check if database file is provided
const dbFilePath = process.argv[2];

if (!dbFilePath) {
  console.log('Usage: node scripts/migrate-database.cjs [database-file]');
  console.log('');
  console.log('This script will add the flipbook_path column to the publications table.');
  console.log('');
  console.log('Note: This script requires sql.js to be installed.');
  console.log('      For production databases, use the built-in migration system');
  console.log('      which runs automatically when the database is initialized.');
  console.log('');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(dbFilePath)) {
  console.error(`Error: Database file not found: ${dbFilePath}`);
  process.exit(1);
}

console.log(`Database file: ${dbFilePath}`);
console.log('');

// Create backup
const backupPath = `${dbFilePath}.backup.${Date.now()}`;
console.log(`Creating backup: ${backupPath}`);
fs.copyFileSync(dbFilePath, backupPath);
console.log('✓ Backup created');
console.log('');

// Load sql.js
console.log('Loading sql.js...');
const initSqlJs = require('sql.js');

initSqlJs().then(SQL => {
  console.log('✓ sql.js loaded');
  console.log('');

  // Load database
  console.log('Loading database...');
  const dbData = fs.readFileSync(dbFilePath);
  const db = new SQL.Database(dbData);
  console.log('✓ Database loaded');
  console.log('');

  // Check current schema
  console.log('Checking current schema...');
  const tableInfo = db.exec("PRAGMA table_info(publications)");
  
  if (tableInfo.length === 0) {
    console.error('Error: publications table not found');
    db.close();
    process.exit(1);
  }

  const columns = tableInfo[0].values.map(row => row[1]);
  console.log('Current columns:', columns.join(', '));
  console.log('');

  // Check if migration is needed
  const hasFlipbookPath = columns.includes('flipbook_path');
  const hasPdfPathNullable = true; // We can't easily check this, assume it needs updating

  if (hasFlipbookPath) {
    console.log('✓ flipbook_path column already exists');
    console.log('');
    console.log('No migrations needed. Database is up to date.');
    db.close();
    process.exit(0);
  }

  // Apply migration
  console.log('Applying migrations...');
  console.log('');

  try {
    // Migration 1: Add flipbook_path column
    console.log('1. Adding flipbook_path column...');
    db.run('ALTER TABLE publications ADD COLUMN flipbook_path TEXT');
    console.log('   ✓ flipbook_path column added');

    // Update metadata
    console.log('2. Updating schema version...');
    db.run(`
      INSERT OR REPLACE INTO metadata (key, value, updated_at) 
      VALUES ('schema_version', '1.1.0', CURRENT_TIMESTAMP)
    `);
    console.log('   ✓ Schema version updated to 1.1.0');

    // Save database
    console.log('');
    console.log('Saving database...');
    const data = db.export();
    fs.writeFileSync(dbFilePath, data);
    console.log('✓ Database saved');

    // Verify migration
    console.log('');
    console.log('Verifying migration...');
    const newTableInfo = db.exec("PRAGMA table_info(publications)");
    const newColumns = newTableInfo[0].values.map(row => row[1]);
    
    if (newColumns.includes('flipbook_path')) {
      console.log('✓ Migration verified successfully');
    } else {
      console.error('✗ Migration verification failed');
      process.exit(1);
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('Migration completed successfully!');
    console.log('='.repeat(60));
    console.log('');
    console.log('New columns:', newColumns.join(', '));
    console.log('');
    console.log(`Backup saved to: ${backupPath}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('Migration failed:', error.message);
    console.error('');
    console.error('The database has not been modified.');
    console.error(`You can restore from backup: ${backupPath}`);
    process.exit(1);
  } finally {
    db.close();
  }

}).catch(error => {
  console.error('Failed to load sql.js:', error);
  console.error('');
  console.error('Make sure sql.js is installed:');
  console.error('  npm install sql.js');
  process.exit(1);
});
