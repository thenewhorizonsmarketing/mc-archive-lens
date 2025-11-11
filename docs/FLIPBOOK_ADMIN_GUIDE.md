# Flipbook Integration Admin Guide

## Overview

This guide provides instructions for system administrators to add, manage, and troubleshoot flipbook publications in the kiosk application. Flipbooks are interactive HTML5-based publications that provide a realistic page-turning experience.

## Prerequisites

Before adding flipbooks, ensure you have:

- Access to the kiosk application file system
- Database access (SQLite)
- Flipbook packages exported from FlipbookHTML or similar tools
- Basic knowledge of SQL and file system operations

## Directory Structure Requirements

### Flipbook Storage Location

All flipbook packages must be stored in the `public/flipbooks/` directory:

```
public/
└── flipbooks/
    ├── amicus-2024-spring/
    │   ├── index.html
    │   ├── css/
    │   ├── js/
    │   └── images/
    ├── law-review-vol-45/
    │   ├── index.html
    │   ├── css/
    │   ├── js/
    │   └── images/
    └── legal-eye-fall-2024/
        ├── index.html
        ├── css/
        ├── js/
        └── images/
```

### Flipbook Package Structure

Each flipbook package should be self-contained with the following structure:

```
flipbook-name/
├── index.html              # Entry point (required)
├── css/
│   ├── flipbook.css       # Flipbook styles
│   └── theme.css          # Custom theme (optional)
├── js/
│   ├── flipbook.min.js    # Flipbook library
│   └── config.js          # Configuration
└── images/
    ├── page-001.jpg       # Page images
    ├── page-002.jpg
    ├── page-003.jpg
    └── ...
```

**Important Requirements:**
- The entry point MUST be named `index.html`
- All assets (CSS, JS, images) MUST use relative paths
- The package MUST be self-contained (no external dependencies)
- Directory names should use kebab-case (lowercase with hyphens)

### Naming Conventions

Use descriptive, URL-friendly directory names:

- **Good:** `amicus-spring-2024`, `law-review-vol-45-issue-2`
- **Bad:** `Amicus Spring 2024`, `LR_Vol45#2`, `flipbook (1)`

## Adding Flipbooks to the Application

### Method 1: Single Flipbook Addition

#### Step 1: Prepare the Flipbook Package

1. Export the publication from FlipbookHTML or your flipbook generation tool
2. Extract the flipbook package to a temporary location
3. Verify the package contains `index.html` and all required assets
4. Test the flipbook by opening `index.html` in a web browser

#### Step 2: Copy to Flipbooks Directory

1. Navigate to the kiosk application directory
2. Create a new directory in `public/flipbooks/` with a descriptive name:
   ```bash
   mkdir -p public/flipbooks/amicus-spring-2024
   ```

3. Copy the flipbook package contents:
   ```bash
   cp -r /path/to/flipbook-export/* public/flipbooks/amicus-spring-2024/
   ```

4. Verify the structure:
   ```bash
   ls -la public/flipbooks/amicus-spring-2024/
   ```

#### Step 3: Add flipbook_path to Database

1. Open the SQLite database:
   ```bash
   sqlite3 public/data/kiosk.db
   ```

2. Find the publication record:
   ```sql
   SELECT id, title, pub_name FROM publications 
   WHERE title LIKE '%Amicus%' AND issue_date LIKE '%2024%';
   ```

3. Update the record with the flipbook path:
   ```sql
   UPDATE publications 
   SET flipbook_path = '/flipbooks/amicus-spring-2024/index.html'
   WHERE id = 123;
   ```

4. Verify the update:
   ```sql
   SELECT id, title, flipbook_path FROM publications WHERE id = 123;
   ```

5. Exit SQLite:
   ```sql
   .quit
   ```

#### Step 4: Test the Flipbook

1. Launch the kiosk application
2. Navigate to the Publications Room
3. Search for the publication
4. Verify the "View Flipbook" button appears
5. Click the button and test the flipbook functionality

### Method 2: Batch Import Multiple Flipbooks

#### Step 1: Prepare Flipbook Packages

1. Organize all flipbook packages in a staging directory:
   ```
   staging/
   ├── amicus-spring-2024/
   ├── amicus-fall-2024/
   ├── law-review-vol-45/
   └── legal-eye-winter-2024/
   ```

2. Verify each package has the correct structure

#### Step 2: Copy All Packages

```bash
cp -r staging/* public/flipbooks/
```

#### Step 3: Create Import CSV

Create a CSV file (`flipbook-import.csv`) with publication IDs and paths:

```csv
id,flipbook_path
123,/flipbooks/amicus-spring-2024/index.html
124,/flipbooks/amicus-fall-2024/index.html
125,/flipbooks/law-review-vol-45/index.html
126,/flipbooks/legal-eye-winter-2024/index.html
```

#### Step 4: Run Batch Import Script

Create a batch import script (`import-flipbooks.sh`):

```bash
#!/bin/bash

# Read CSV and update database
while IFS=',' read -r id flipbook_path; do
  if [ "$id" != "id" ]; then  # Skip header
    sqlite3 public/data/kiosk.db "UPDATE publications SET flipbook_path = '$flipbook_path' WHERE id = $id;"
    echo "Updated publication $id with flipbook path: $flipbook_path"
  fi
done < flipbook-import.csv

echo "Batch import complete!"
```

Make it executable and run:

```bash
chmod +x import-flipbooks.sh
./import-flipbooks.sh
```

#### Step 5: Verify Batch Import

```sql
sqlite3 public/data/kiosk.db "SELECT id, title, flipbook_path FROM publications WHERE flipbook_path IS NOT NULL;"
```

## Database Schema Reference

### Publications Table Structure

The `publications` table includes the following relevant fields:

```sql
CREATE TABLE publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  pub_name TEXT NOT NULL CHECK(pub_name IN ('Amicus', 'Legal Eye', 'Law Review', 'Directory')),
  issue_date TEXT,
  volume_issue TEXT,
  pdf_path TEXT,
  flipbook_path TEXT,
  thumb_path TEXT,
  description TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Adding flipbook_path to Existing Database

If your database doesn't have the `flipbook_path` column, add it with:

```sql
ALTER TABLE publications ADD COLUMN flipbook_path TEXT;
```

## Example SQL Commands

### Query Publications Without Flipbooks

```sql
SELECT id, title, pub_name, issue_date 
FROM publications 
WHERE pdf_path IS NOT NULL 
  AND flipbook_path IS NULL
ORDER BY issue_date DESC;
```

### Update Single Publication

```sql
UPDATE publications 
SET flipbook_path = '/flipbooks/amicus-spring-2024/index.html',
    updated_at = CURRENT_TIMESTAMP
WHERE id = 123;
```

### Add New Publication with Flipbook

```sql
INSERT INTO publications (
  title, 
  pub_name, 
  issue_date, 
  volume_issue, 
  pdf_path, 
  flipbook_path,
  description
) VALUES (
  'Amicus Spring 2024',
  'Amicus',
  '2024-03-01',
  'Vol 45, Issue 1',
  '/pdfs/publications/amicus-spring-2024.pdf',
  '/flipbooks/amicus-spring-2024/index.html',
  'Spring 2024 edition featuring alumni spotlights'
);
```

### Remove Flipbook Path

```sql
UPDATE publications 
SET flipbook_path = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 123;
```

### List All Publications with Flipbooks

```sql
SELECT 
  id,
  title,
  pub_name,
  issue_date,
  flipbook_path,
  CASE 
    WHEN pdf_path IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_pdf
FROM publications 
WHERE flipbook_path IS NOT NULL
ORDER BY issue_date DESC;
```

## Validation and Testing

### Validate Flipbook Path Format

Flipbook paths must follow this format:

```
/flipbooks/[directory-name]/index.html
```

**Valid Examples:**
- `/flipbooks/amicus-spring-2024/index.html`
- `/flipbooks/law-review-vol-45/index.html`

**Invalid Examples:**
- `flipbooks/amicus-spring-2024/index.html` (missing leading slash)
- `/flipbooks/amicus-spring-2024/` (missing index.html)
- `/flipbooks/amicus-spring-2024/main.html` (wrong filename)

### Test Flipbook Accessibility

1. **File System Check:**
   ```bash
   test -f public/flipbooks/amicus-spring-2024/index.html && echo "File exists" || echo "File not found"
   ```

2. **Browser Test:**
   Open the flipbook directly in a browser:
   ```
   http://localhost:5173/flipbooks/amicus-spring-2024/index.html
   ```

3. **Application Test:**
   - Launch the kiosk application
   - Navigate to Publications Room
   - Open the publication
   - Click "View Flipbook"
   - Verify loading and functionality

### Verify Database Updates

```sql
-- Check if flipbook_path was added
SELECT flipbook_path FROM publications WHERE id = 123;

-- Verify updated_at timestamp changed
SELECT id, title, updated_at FROM publications WHERE id = 123;

-- Count publications with flipbooks
SELECT COUNT(*) as flipbook_count FROM publications WHERE flipbook_path IS NOT NULL;
```

## Troubleshooting

### Flipbook Won't Load

**Problem:** Flipbook displays error or infinite loading spinner.

**Diagnosis:**
1. Check file path:
   ```bash
   ls -la public/flipbooks/[directory-name]/index.html
   ```

2. Verify database path:
   ```sql
   SELECT flipbook_path FROM publications WHERE id = [id];
   ```

3. Check browser console for errors

**Solutions:**
- Ensure path starts with `/flipbooks/` and ends with `/index.html`
- Verify all flipbook assets are present
- Check file permissions (should be readable)
- Ensure no special characters in directory names

### Broken Asset References

**Problem:** Flipbook loads but images/styles don't appear.

**Diagnosis:**
- Open browser developer tools
- Check Network tab for 404 errors
- Inspect flipbook HTML for asset paths

**Solutions:**
- Ensure all asset paths in flipbook HTML are relative
- Verify directory structure matches flipbook expectations
- Re-export flipbook with correct path settings
- Check that all asset files were copied

### Database Update Fails

**Problem:** SQL UPDATE command returns error.

**Diagnosis:**
```sql
-- Check if column exists
PRAGMA table_info(publications);

-- Verify publication exists
SELECT * FROM publications WHERE id = [id];
```

**Solutions:**
- Add `flipbook_path` column if missing (see schema section)
- Verify publication ID is correct
- Check SQL syntax (quotes, commas)
- Ensure database isn't locked by another process

### Permission Issues

**Problem:** Cannot copy files or access database.

**Solutions:**
```bash
# Fix file permissions
chmod -R 755 public/flipbooks/

# Fix database permissions
chmod 644 public/data/kiosk.db

# Ensure ownership is correct
chown -R [user]:[group] public/flipbooks/
```

## Maintenance and Best Practices

### Regular Maintenance Tasks

1. **Monitor Storage Usage:**
   ```bash
   du -sh public/flipbooks/
   ```

2. **Verify Flipbook Integrity:**
   ```bash
   find public/flipbooks/ -name "index.html" -type f
   ```

3. **Database Backup:**
   ```bash
   cp public/data/kiosk.db public/data/kiosk.db.backup
   ```

4. **Clean Up Unused Flipbooks:**
   ```sql
   -- Find flipbook paths not in database
   SELECT flipbook_path FROM publications WHERE flipbook_path IS NOT NULL;
   ```

### Performance Optimization

1. **Optimize Images:**
   - Use compressed JPEG images for pages
   - Recommended resolution: 1920x1080 or lower
   - Keep individual page images under 500KB

2. **Minimize Package Size:**
   - Remove unnecessary files from flipbook packages
   - Use minified CSS and JavaScript
   - Consider progressive loading for large publications

3. **Monitor Load Times:**
   - Test flipbook load times on target hardware
   - Aim for < 2 seconds initial load
   - Consider splitting very large publications

### Security Considerations

1. **Validate Flipbook Content:**
   - Review flipbook HTML for malicious scripts
   - Ensure flipbooks don't make external network requests
   - Test in isolated environment first

2. **File Permissions:**
   - Set read-only permissions for flipbook files
   - Restrict write access to administrators only

3. **Database Security:**
   - Use parameterized queries for batch imports
   - Validate all input data
   - Maintain regular database backups

## Migration from PDF-Only

### Converting Existing Publications

1. **Identify Candidates:**
   ```sql
   SELECT id, title, pub_name, pdf_path 
   FROM publications 
   WHERE pdf_path IS NOT NULL 
     AND flipbook_path IS NULL
   ORDER BY issue_date DESC
   LIMIT 10;
   ```

2. **Generate Flipbooks:**
   - Use FlipbookHTML or similar tool to convert PDFs
   - Export each flipbook package
   - Follow naming conventions

3. **Update Database:**
   - Keep existing `pdf_path` values
   - Add `flipbook_path` alongside PDF
   - Users will see both viewing options

### Gradual Rollout Strategy

1. **Phase 1:** Add flipbooks for newest publications
2. **Phase 2:** Convert high-traffic publications
3. **Phase 3:** Backfill older publications as needed

## Backup and Recovery

### Backup Flipbook Files

```bash
# Create timestamped backup
tar -czf flipbooks-backup-$(date +%Y%m%d).tar.gz public/flipbooks/

# Backup to external location
rsync -av public/flipbooks/ /backup/location/flipbooks/
```

### Restore Flipbooks

```bash
# Extract from backup
tar -xzf flipbooks-backup-20241111.tar.gz -C /

# Restore from rsync backup
rsync -av /backup/location/flipbooks/ public/flipbooks/
```

### Database Backup

```bash
# Backup database
sqlite3 public/data/kiosk.db ".backup public/data/kiosk-backup-$(date +%Y%m%d).db"

# Restore database
cp public/data/kiosk-backup-20241111.db public/data/kiosk.db
```

## Support and Resources

### Useful Commands Reference

```bash
# List all flipbooks
ls -1 public/flipbooks/

# Count flipbooks
ls -1 public/flipbooks/ | wc -l

# Find large flipbooks
du -sh public/flipbooks/* | sort -hr | head -10

# Check database size
ls -lh public/data/kiosk.db

# Verify flipbook structure
find public/flipbooks/[name] -type f | head -20
```

### SQL Query Templates

```sql
-- Publications with both PDF and flipbook
SELECT title, pdf_path, flipbook_path 
FROM publications 
WHERE pdf_path IS NOT NULL AND flipbook_path IS NOT NULL;

-- Publications by type with flipbook status
SELECT 
  pub_name,
  COUNT(*) as total,
  SUM(CASE WHEN flipbook_path IS NOT NULL THEN 1 ELSE 0 END) as with_flipbook
FROM publications 
GROUP BY pub_name;

-- Recent publications needing flipbooks
SELECT id, title, issue_date, pdf_path
FROM publications 
WHERE pdf_path IS NOT NULL 
  AND flipbook_path IS NULL
  AND issue_date >= '2024-01-01'
ORDER BY issue_date DESC;
```

### Getting Help

For technical issues or questions:

1. Check this guide's troubleshooting section
2. Review application logs for errors
3. Test flipbooks in isolation (direct browser access)
4. Consult the FlipbookHTML documentation
5. Contact the development team for application-specific issues

---

**Last Updated:** November 2025  
**Version:** 1.0  
**Maintainer:** Kiosk Development Team
