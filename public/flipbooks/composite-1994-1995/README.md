# 1994-1995 Composite Flipbook

This directory contains the interactive flipbook for the 1994-1995 class composite.

## Flipbook Details

- **Academic Year**: 1994-1995
- **Publication Type**: Class Composite
- **Entry Point**: `index.html`
- **Flipbook Path**: `/flipbooks/composite-1994-1995/index.html`

## Database Record

To make this flipbook accessible in the Publications Room, add a publication record with the following information:

### Option 1: Using Admin Panel CSV Import

Create a CSV file with this content:

```csv
title,pub_name,issue_date,volume_issue,flipbook_path,description
"Class Composite 1994-1995","Directory","1995-05","1994-1995","/flipbooks/composite-1994-1995/index.html","Class composite for the 1994-1995 academic year"
```

Then:
1. Navigate to the Admin Panel
2. Go to the "Upload" tab
3. Select "Publications" as the table type
4. Upload the CSV file

### Option 2: Using Browser Console

Open the browser console and run:

```javascript
// Get database connection
const { dbConnection } = await import('/src/lib/database/connection.ts');
await dbConnection.connect();
const manager = dbConnection.getManager();

// Insert publication record
manager.executeStatement(`
  INSERT INTO publications (
    title, 
    pub_name, 
    issue_date, 
    volume_issue, 
    flipbook_path, 
    description,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`, [
  'Class Composite 1994-1995',
  'Directory',
  '1995-05',
  '1994-1995',
  '/flipbooks/composite-1994-1995/index.html',
  'Class composite for the 1994-1995 academic year'
]);

console.log('Publication record added successfully!');
```

## Verification

After adding the database record:

1. Navigate to the Publications Room
2. Search for "1994" or "1995" or "composite"
3. Click on the publication to open the detail view
4. Click "View Flipbook" to verify it loads correctly

## File Structure

```
composite-1994-1995/
├── README.md (this file)
├── index.html (entry point)
├── files/ (flipbook assets)
├── javascript/ (flipbook scripts)
├── slide_javascript/ (slide functionality)
├── style/ (stylesheets)
└── web.config (server configuration)
```

## Notes

- The flipbook is self-contained with all required assets
- All paths in the flipbook are relative to index.html
- The flipbook will load in an iframe within the kiosk application
- Touch gestures are supported for page navigation
