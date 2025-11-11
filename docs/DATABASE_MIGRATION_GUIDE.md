# Database Migration Guide

## Overview

This guide explains how to migrate existing databases to support the new flipbook integration feature. The migration adds a `flipbook_path` column to the publications table and makes the `pdf_path` column optional.

## What's Changed

### Schema Changes

1. **New Column**: `flipbook_path TEXT` added to `publications` table
2. **Modified Column**: `pdf_path` is now optional (nullable) instead of required
3. **Schema Version**: Updated from 1.0.0 to 1.1.0

### Database Schema (v1.1.0)

```sql
CREATE TABLE publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  pub_name TEXT NOT NULL CHECK(pub_name IN ('Amicus', 'Legal Eye', 'Law Review', 'Directory')),
  issue_date TEXT,
  volume_issue TEXT,
  pdf_path TEXT,              -- Now optional
  flipbook_path TEXT,         -- New column
  thumb_path TEXT,
  description TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Migration Methods

### Method 1: Automatic Migration (Recommended)

The database system automatically applies migrations when initialized. This is the safest and easiest method.

**How it works:**
- When the application starts, it checks the current schema version
- If migrations are needed, they are applied automatically
- The process is idempotent (safe to run multiple times)

**No action required** - migrations run automatically on application startup.

### Method 2: Manual Migration Script

For production databases or offline migration, use the migration script.

**Prerequisites:**
```bash
npm install sql.js
```

**Usage:**
```bash
node scripts/migrate-database.cjs path/to/database.db
```

**What it does:**
1. Creates a backup of your database (`.backup.timestamp`)
2. Checks current schema version
3. Applies pending migrations
4. Verifies the migration succeeded
5. Updates schema version to 1.1.0

**Example:**
```bash
$ node scripts/migrate-database.cjs data/kiosk.db

============================================================
Database Migration Script
============================================================

Database file: data/kiosk.db

Creating backup: data/kiosk.db.backup.1699564800000
✓ Backup created

Loading sql.js...
✓ sql.js loaded

Loading database...
✓ Database loaded

Checking current schema...
Current columns: id, title, pub_name, issue_date, volume_issue, pdf_path, thumb_path, description, tags, created_at, updated_at

Applying migrations...

1. Adding flipbook_path column...
   ✓ flipbook_path column added
2. Updating schema version...
   ✓ Schema version updated to 1.1.0

Saving database...
✓ Database saved

Verifying migration...
✓ Migration verified successfully

============================================================
Migration completed successfully!
============================================================

New columns: id, title, pub_name, issue_date, volume_issue, pdf_path, flipbook_path, thumb_path, description, tags, created_at, updated_at

Backup saved to: data/kiosk.db.backup.1699564800000
```

### Method 3: Programmatic Migration

Use the migration API in your code:

```typescript
import { databaseManager, applyMigrations } from '@/lib/database';

// Initialize database
await databaseManager.initializeDatabase();

// Apply migrations
const result = await applyMigrations(databaseManager);

if (result.success) {
  console.log('Migrations applied:', result.migrationsApplied);
  console.log('Schema version:', result.version);
} else {
  console.error('Migration errors:', result.errors);
}
```

## Verifying Migration

### Check Schema Version

```typescript
import { databaseManager } from '@/lib/database';

const version = databaseManager.getMetadata('schema_version');
console.log('Schema version:', version); // Should be "1.1.0"
```

### Check Column Exists

```typescript
const tableInfo = databaseManager.executeQuery("PRAGMA table_info(publications)");
const hasFlipbookPath = tableInfo.some(col => col.name === 'flipbook_path');
console.log('Has flipbook_path:', hasFlipbookPath); // Should be true
```

### SQL Query

```sql
PRAGMA table_info(publications);
```

Expected output should include:
```
...
5|pdf_path|TEXT|0||0
6|flipbook_path|TEXT|0||0
7|thumb_path|TEXT|0||0
...
```

## Adding Flipbook Paths to Publications

After migration, you can add flipbook paths to publications:

### SQL Update

```sql
UPDATE publications 
SET flipbook_path = '/flipbooks/amicus-spring-2024/index.html'
WHERE id = 1;
```

### Batch Update

```sql
-- Update multiple publications
UPDATE publications 
SET flipbook_path = '/flipbooks/' || LOWER(REPLACE(title, ' ', '-')) || '/index.html'
WHERE pub_name = 'Amicus' AND issue_date >= '2024-01-01';
```

### CSV Import

Create a CSV file with publication IDs and flipbook paths:

```csv
id,flipbook_path
1,/flipbooks/amicus-spring-2024/index.html
2,/flipbooks/law-review-vol-45/index.html
3,/flipbooks/legal-eye-2024/index.html
```

Then use the import manager to update records.

## Rollback

### Restore from Backup

If you need to rollback, restore from the backup created by the migration script:

```bash
cp data/kiosk.db.backup.1699564800000 data/kiosk.db
```

### Note on Column Removal

SQLite does not support `DROP COLUMN`, so you cannot remove the `flipbook_path` column without recreating the entire table. The column is nullable, so it won't affect existing functionality if unused.

## Troubleshooting

### Migration Already Applied

If you see "flipbook_path column already exists", the migration has already been applied. No action needed.

### Migration Failed

1. Check the error message
2. Restore from backup if needed
3. Verify database file permissions
4. Ensure sql.js is installed
5. Check database file is not corrupted

### Column Not Showing

1. Verify migration completed successfully
2. Check schema version: `SELECT value FROM metadata WHERE key = 'schema_version'`
3. Run `PRAGMA table_info(publications)` to see all columns
4. Restart the application to reload schema

## Best Practices

1. **Always backup** before running migrations
2. **Test migrations** on a copy of production data first
3. **Verify success** after migration completes
4. **Keep backups** for at least 30 days
5. **Document changes** when adding flipbook paths to publications

## Support

For issues or questions about database migrations:
1. Check the error logs
2. Review this documentation
3. Verify backup exists before attempting fixes
4. Contact the development team if problems persist
