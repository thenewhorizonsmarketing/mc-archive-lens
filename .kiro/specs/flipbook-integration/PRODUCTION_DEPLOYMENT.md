# Flipbook Integration - Production Deployment Guide

**Feature**: Flipbook Integration  
**Version**: 1.0.0  
**Date**: November 11, 2025  
**Status**: Ready for Production Deployment

---

## Overview

This guide provides step-by-step instructions for deploying the flipbook integration feature to production. The flipbook integration allows users to view publications in an interactive, magazine-style format with realistic page-turning animations.

## Pre-Deployment Checklist

### ✅ Verification Complete

- [x] All flipbook tests passing (80/80 tests)
- [x] FlipbookViewer component production-ready
- [x] Database schema includes flipbook_path column
- [x] TypeScript types updated with flipbook_path
- [x] Documentation complete (User Guide, Admin Guide, README)
- [x] Production build successful
- [x] Migration script available

### 📋 Pre-Deployment Requirements

- [ ] Production database backup created
- [ ] Flipbook packages prepared (if any)
- [ ] Production server access confirmed
- [ ] Deployment window scheduled

---

## Deployment Steps

### Step 1: Backup Production Database

**CRITICAL**: Always backup before making schema changes.

```bash
# Create timestamped backup
cp data/kiosk.db data/kiosk.db.backup.$(date +%Y%m%d_%H%M%S)

# Verify backup
ls -lh data/kiosk.db.backup.*
```

### Step 2: Build for Production

```bash
# Clean previous build
rm -rf dist/

# Build production version
npm run build

# Verify build output
ls -lh dist/
```

**Expected Output**:
- `dist/index.html` - Main HTML file
- `dist/assets/` - Compiled CSS and JavaScript
- `dist/flipbooks/` - Flipbook directory with README
- `dist/flipbooks/README.md` - Instructions for adding flipbooks

### Step 3: Run Database Migration

The migration adds the `flipbook_path` column to the publications table.

**Option A: Automatic Migration (Recommended)**

The migration runs automatically when the application initializes the database. No manual action required.

**Option B: Manual Migration (For Existing Databases)**

```bash
# Run migration script
node scripts/migrate-database.cjs data/kiosk.db

# Verify migration
sqlite3 data/kiosk.db "PRAGMA table_info(publications);" | grep flipbook_path
```

**Expected Output**:
```
✓ Backup created
✓ sql.js loaded
✓ Database loaded
✓ flipbook_path column added
✓ Schema version updated to 1.1.0
✓ Database saved
✓ Migration verified successfully
```

### Step 4: Deploy Flipbook Directory Structure

The flipbook directory is already included in the build. Verify it exists:

```bash
# Check flipbook directory
ls -la dist/flipbooks/

# Should show:
# - README.md (instructions for adding flipbooks)
```

### Step 5: Deploy Application Files

**For Web Server Deployment**:

```bash
# Copy built files to production server
rsync -av --delete dist/ user@production-server:/var/www/kiosk/

# Or use your deployment method
scp -r dist/* user@production-server:/var/www/kiosk/
```

**For Electron/Kiosk Deployment**:

```bash
# Package Electron app
npm run electron:build

# Deploy to kiosk hardware
# (Follow your organization's deployment process)
```

### Step 6: Verify Deployment

1. **Access the application**:
   - Navigate to the production URL
   - Or launch the Electron app

2. **Test Publications Room**:
   - Navigate to Publications Room
   - Search for a publication
   - Verify the interface loads correctly

3. **Test FlipbookViewer (if flipbooks available)**:
   - Open a publication with flipbook_path
   - Click "View Flipbook" button
   - Verify flipbook loads and displays correctly
   - Test close button functionality

4. **Check for errors**:
   - Open browser console (F12)
   - Look for JavaScript errors
   - Check network tab for failed requests

---

## Post-Deployment Tasks

### Verify Database Schema

```bash
# Connect to production database
sqlite3 data/kiosk.db

# Check publications table schema
PRAGMA table_info(publications);

# Should include:
# - flipbook_path TEXT column

# Exit
.quit
```

### Monitor Application Logs

```bash
# Check for errors
tail -f logs/application.log

# Check for flipbook-related issues
grep -i "flipbook" logs/application.log
```

### Performance Validation

1. Open Admin Panel (Ctrl+Shift+A)
2. Navigate to Performance tab
3. Run performance tests
4. Verify all tests pass

---

## Adding Flipbooks (Post-Deployment)

Once deployed, you can add flipbook publications:

### Step 1: Prepare Flipbook Package

1. Export publication from FlipbookHTML or similar tool
2. Verify package includes `index.html` and all assets
3. Test flipbook locally by opening `index.html` in browser

### Step 2: Upload to Server

```bash
# Create directory for flipbook
mkdir -p /var/www/kiosk/flipbooks/publication-name

# Upload flipbook files
scp -r flipbook-package/* user@server:/var/www/kiosk/flipbooks/publication-name/

# Verify upload
ssh user@server "ls -la /var/www/kiosk/flipbooks/publication-name/"
```

### Step 3: Update Database

```bash
# Connect to database
sqlite3 data/kiosk.db

# Update publication record
UPDATE publications 
SET flipbook_path = '/flipbooks/publication-name/index.html'
WHERE id = [publication_id];

# Verify update
SELECT id, title, flipbook_path FROM publications WHERE id = [publication_id];

# Exit
.quit
```

### Step 4: Test Flipbook

1. Navigate to Publications Room
2. Search for the publication
3. Open publication details
4. Click "View Flipbook" button
5. Verify flipbook loads and functions correctly

---

## Rollback Procedure

If issues occur, follow these steps to rollback:

### Step 1: Restore Database Backup

```bash
# Stop application
systemctl stop kiosk-app  # or your stop command

# Restore backup
cp data/kiosk.db.backup.[timestamp] data/kiosk.db

# Verify restoration
sqlite3 data/kiosk.db "PRAGMA table_info(publications);"

# Restart application
systemctl start kiosk-app
```

### Step 2: Revert Application Files

```bash
# Restore previous version
# (Use your version control or backup system)
git checkout [previous-commit]
npm run build
# Deploy previous build
```

### Step 3: Verify Rollback

1. Access application
2. Test basic functionality
3. Verify no errors in logs

---

## Troubleshooting

### Issue: Migration Fails

**Symptoms**: Migration script reports errors

**Solutions**:
1. Check database file permissions
2. Verify database is not locked by another process
3. Restore from backup and try again
4. Check migration script output for specific error

### Issue: Flipbook Directory Missing

**Symptoms**: 404 errors when accessing flipbooks

**Solutions**:
1. Verify `dist/flipbooks/` exists in build
2. Check web server configuration
3. Verify file permissions
4. Check deployment script copied all files

### Issue: FlipbookViewer Not Loading

**Symptoms**: Blank screen or error when opening flipbook

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify flipbook_path in database is correct
3. Test flipbook file directly in browser
4. Check network tab for failed asset requests

### Issue: Database Schema Not Updated

**Symptoms**: flipbook_path column missing

**Solutions**:
1. Run migration script manually
2. Check migration script output
3. Verify database file path is correct
4. Check database file permissions

---

## Monitoring and Maintenance

### Daily Checks

- [ ] Application is running
- [ ] No errors in logs
- [ ] Publications Room loads correctly

### Weekly Checks

- [ ] Review flipbook usage (if analytics available)
- [ ] Check for broken flipbook links
- [ ] Verify database integrity

### Monthly Checks

- [ ] Review and archive logs
- [ ] Update documentation if needed
- [ ] Test adding new flipbooks

---

## Support and Resources

### Documentation

- **User Guide**: `docs/FLIPBOOK_USER_GUIDE.md`
- **Admin Guide**: `docs/FLIPBOOK_ADMIN_GUIDE.md`
- **Flipbook README**: `public/flipbooks/README.md`
- **Requirements**: `.kiro/specs/flipbook-integration/requirements.md`
- **Design**: `.kiro/specs/flipbook-integration/design.md`
- **Tasks**: `.kiro/specs/flipbook-integration/tasks.md`

### Migration Script

- **Location**: `scripts/migrate-database.cjs`
- **Usage**: `node scripts/migrate-database.cjs [database-file]`

### Test Files

- **Component Tests**: `src/components/__tests__/FlipbookViewer.test.tsx`
- **Validation Tests**: `src/lib/flipbook/__tests__/validation.test.ts`
- **Integration Tests**: `src/__tests__/integration/flipbook-publications-flow.test.ts`

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Production build successful
- [ ] Database backup created
- [ ] Deployment window scheduled
- [ ] Team notified

### During Deployment

- [ ] Application stopped (if required)
- [ ] Database migration completed
- [ ] Application files deployed
- [ ] Application restarted
- [ ] Basic smoke tests passed

### Post-Deployment

- [ ] Full functionality verified
- [ ] No errors in logs
- [ ] Performance metrics normal
- [ ] Team notified of completion
- [ ] Documentation updated (if needed)

---

## Success Criteria

Deployment is successful when:

✅ Application loads without errors  
✅ Publications Room is accessible  
✅ Database schema includes flipbook_path  
✅ FlipbookViewer component renders correctly  
✅ No JavaScript errors in console  
✅ No failed network requests  
✅ Performance metrics are normal  
✅ Logs show no critical errors  

---

## Deployment Complete!

The flipbook integration is now deployed to production. Users can view publications in an interactive flipbook format once flipbook packages are added to the system.

For questions or issues, refer to the documentation or contact the development team.

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**Deployed By**: [Your Name]  
**Deployment Date**: [Date]

