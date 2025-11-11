# Design Document

## Overview

The flipbook integration adds support for interactive HTML5-based publications to the existing Publications Room. The design leverages iframe embedding to display self-contained flipbook packages while maintaining the kiosk application's UI consistency and touch-friendly controls.

The solution extends the existing database schema to support flipbook paths, creates a new FlipbookViewer component, and integrates seamlessly with the RecordDetail component to provide users with viewing options.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Publications Room                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           RecordDetail Component                      │   │
│  │  ┌────────────────┐  ┌──────────────────────────┐   │   │
│  │  │  View PDF      │  │  View Flipbook           │   │   │
│  │  │  (existing)    │  │  (new)                   │   │   │
│  │  └────────┬───────┘  └──────────┬───────────────┘   │   │
│  └───────────┼──────────────────────┼───────────────────┘   │
└──────────────┼──────────────────────┼───────────────────────┘
               │                      │
               ▼                      ▼
      ┌────────────────┐    ┌──────────────────────┐
      │  PDFViewer     │    │  FlipbookViewer      │
      │  Component     │    │  Component (new)     │
      │  (existing)    │    │                      │
      └────────────────┘    └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │  iframe embedding    │
                            │  flipbook HTML       │
                            └──────────────────────┘
```

### Directory Structure

```
public/
├── flipbooks/                    # New directory for flipbook packages
│   ├── amicus-2024-spring/      # Example flipbook package
│   │   ├── index.html           # Main flipbook HTML
│   │   ├── css/                 # Flipbook stylesheets
│   │   ├── js/                  # Flipbook JavaScript
│   │   └── images/              # Flipbook page images
│   └── law-review-vol-45/       # Another example
│       └── ...
└── pdfs/                         # Existing PDF directory
    └── publications/
```

### Database Schema Extension

Add `flipbook_path` column to the publications table:

```sql
ALTER TABLE publications ADD COLUMN flipbook_path TEXT;
```

The `flipbook_path` will store the relative path from the `public/` directory, e.g., `flipbooks/amicus-2024-spring/index.html`.

## Components and Interfaces

### FlipbookViewer Component

**Location:** `src/components/FlipbookViewer.tsx`

**Purpose:** Embeds and displays flipbook HTML content in an iframe with kiosk-friendly controls.

**Props Interface:**
```typescript
interface FlipbookViewerProps {
  flipbookUrl: string;      // URL to flipbook index.html
  title: string;            // Publication title
  onClose: () => void;      // Close handler
  className?: string;       // Optional styling
}
```

**Key Features:**
- Fullscreen iframe embedding
- Loading state with spinner
- Header with title and close button
- Touch-friendly close button (minimum 44x44px)
- Keyboard support (Escape to close)
- Responsive layout
- Error handling for failed loads

**Component Structure:**
```tsx
<div className="flipbook-viewer">
  <div className="flipbook-viewer__header">
    <h2>{title}</h2>
    <Button onClick={onClose}>Close</Button>
  </div>
  <div className="flipbook-viewer__content">
    {loading && <LoadingSpinner />}
    <iframe
      src={flipbookUrl}
      title={title}
      onLoad={handleLoad}
      onError={handleError}
    />
  </div>
</div>
```

### RecordDetail Component Updates

**Location:** `src/components/content/RecordDetail.tsx`

**Changes Required:**
1. Add flipbook detection logic in `renderPublicationContent()`
2. Display "View Flipbook" button when `flipbook_path` exists
3. Manage flipbook viewer state (open/closed)
4. Pass flipbook URL to FlipbookViewer component

**Updated Publication Rendering Logic:**
```typescript
const renderPublicationContent = () => {
  const data = record.data as any;
  const [showFlipbook, setShowFlipbook] = useState(false);
  
  const hasFlipbook = !!data.flipbook_path;
  const hasPDF = !!data.pdf_path;
  
  return (
    <>
      {/* Existing thumbnail and metadata */}
      
      <div className="record-detail__actions">
        {hasPDF && (
          <Button onClick={() => openPDF(data.pdf_path)}>
            View PDF
          </Button>
        )}
        {hasFlipbook && (
          <Button onClick={() => setShowFlipbook(true)}>
            View Flipbook
          </Button>
        )}
      </div>
      
      {showFlipbook && (
        <FlipbookViewer
          flipbookUrl={data.flipbook_path}
          title={data.title}
          onClose={() => setShowFlipbook(false)}
        />
      )}
    </>
  );
};
```

### Database Schema Updates

**Location:** `src/lib/database/schema.ts`

**Changes:**
1. Update `CREATE_PUBLICATIONS_TABLE` to include `flipbook_path`
2. Add migration logic to alter existing tables
3. Update FTS triggers if flipbook metadata should be searchable

**Updated Schema:**
```typescript
export const CREATE_PUBLICATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS publications (
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
`;

export const MIGRATION_ADD_FLIPBOOK_PATH = `
  ALTER TABLE publications ADD COLUMN flipbook_path TEXT;
`;
```

### Type Definitions

**Location:** `src/types/index.ts`

**Updates:**
```typescript
export interface PublicationData {
  title: string;
  pub_name: 'Amicus' | 'Legal Eye' | 'Law Review' | 'Directory';
  issue_date?: string;
  volume_issue?: string;
  pdf_path?: string;
  flipbook_path?: string;  // New field
  thumb_path?: string;
  description?: string;
  tags?: string;
}
```

## Data Models

### Publication Record with Flipbook

```typescript
{
  id: "pub_123",
  type: "publication",
  title: "Amicus Spring 2024",
  data: {
    title: "Amicus Spring 2024",
    pub_name: "Amicus",
    issue_date: "2024-03",
    volume_issue: "Vol 45, Issue 1",
    pdf_path: "/pdfs/publications/amicus-spring-2024.pdf",
    flipbook_path: "/flipbooks/amicus-2024-spring/index.html",
    thumb_path: "/images/thumbs/amicus-spring-2024.jpg",
    description: "Spring 2024 edition of Amicus magazine"
  }
}
```

### Flipbook Directory Structure

Each flipbook package should be self-contained:

```
flipbooks/
└── amicus-2024-spring/
    ├── index.html              # Entry point
    ├── css/
    │   ├── flipbook.css       # Flipbook styles
    │   └── theme.css          # Custom theme
    ├── js/
    │   ├── flipbook.min.js    # Flipbook library
    │   └── config.js          # Configuration
    └── images/
        ├── page-001.jpg       # Page images
        ├── page-002.jpg
        └── ...
```

## Error Handling

### Flipbook Loading Errors

**Scenarios:**
1. Flipbook path doesn't exist
2. Flipbook HTML fails to load
3. Flipbook JavaScript errors
4. Missing assets (images, CSS, JS)

**Handling Strategy:**
```typescript
const [loadError, setLoadError] = useState<string | null>(null);

const handleIframeError = () => {
  setLoadError('Failed to load flipbook. Please try again or view the PDF version.');
};

const handleIframeLoad = () => {
  setLoading(false);
  setLoadError(null);
};

// In render:
{loadError && (
  <div className="flipbook-viewer__error">
    <p>{loadError}</p>
    {hasPDF && (
      <Button onClick={() => openPDF(pdfPath)}>
        View PDF Instead
      </Button>
    )}
  </div>
)}
```

### Path Validation

Validate flipbook paths before rendering:

```typescript
function validateFlipbookPath(path: string): boolean {
  // Check if path starts with /flipbooks/
  if (!path.startsWith('/flipbooks/')) {
    return false;
  }
  
  // Check if path ends with .html
  if (!path.endsWith('.html')) {
    return false;
  }
  
  return true;
}
```

### Fallback Behavior

Priority order for viewing options:
1. If flipbook_path exists and valid → Show "View Flipbook" button
2. If pdf_path exists → Show "View PDF" button
3. If both exist → Show both buttons
4. If neither exists → Show "No viewer available" message

## Testing Strategy

### Unit Tests

**FlipbookViewer Component Tests:**
- Renders with correct props
- Displays loading state initially
- Handles iframe load event
- Handles iframe error event
- Calls onClose when close button clicked
- Responds to Escape key press
- Applies correct accessibility attributes

**RecordDetail Component Tests:**
- Shows flipbook button when flipbook_path exists
- Shows PDF button when pdf_path exists
- Shows both buttons when both paths exist
- Opens FlipbookViewer with correct props
- Handles missing paths gracefully

### Integration Tests

**Publications Room Flow:**
1. Load publication with flipbook_path
2. Click "View Flipbook" button
3. Verify FlipbookViewer opens
4. Verify iframe loads flipbook content
5. Click close button
6. Verify return to Publications Room

**Database Integration:**
1. Insert publication with flipbook_path
2. Query publication by ID
3. Verify flipbook_path is retrieved correctly
4. Update flipbook_path
5. Verify update persists

### Manual Testing Checklist

- [ ] Place flipbook package in `public/flipbooks/`
- [ ] Add publication record with flipbook_path to database
- [ ] Navigate to Publications Room
- [ ] Search for publication
- [ ] Click publication to open RecordDetail
- [ ] Verify "View Flipbook" button appears
- [ ] Click "View Flipbook" button
- [ ] Verify flipbook loads and displays correctly
- [ ] Test page turning with touch gestures
- [ ] Test page turning with flipbook controls
- [ ] Click close button
- [ ] Verify return to Publications Room
- [ ] Test with missing flipbook path (error handling)
- [ ] Test with both PDF and flipbook available

### Performance Testing

**Metrics to Monitor:**
- Flipbook initial load time (target: < 2 seconds)
- Iframe rendering time
- Memory usage during flipbook viewing
- Frame rate during page transitions (target: ≥ 30 FPS)

**Testing Approach:**
```typescript
// Performance monitoring
const startTime = performance.now();

iframe.onload = () => {
  const loadTime = performance.now() - startTime;
  console.log(`Flipbook loaded in ${loadTime}ms`);
  
  if (loadTime > 2000) {
    console.warn('Flipbook load time exceeds target');
  }
};
```

## Implementation Notes

### Iframe Security

Use sandbox attribute for security:
```tsx
<iframe
  src={flipbookUrl}
  sandbox="allow-scripts allow-same-origin"
  title={title}
/>
```

### Responsive Design

The FlipbookViewer should adapt to different screen sizes:
- Desktop: Full viewport with header
- Tablet: Full viewport with larger touch targets
- Mobile: Full viewport with simplified controls

### Accessibility

- Provide keyboard navigation (Escape to close)
- Use semantic HTML elements
- Include ARIA labels for screen readers
- Ensure minimum touch target size (44x44px)
- Provide alternative text for iframe content

### Browser Compatibility

The flipbook integration relies on:
- iframe support (universal)
- HTML5 features (modern browsers)
- Touch events (touchscreen devices)

All features are supported in modern browsers used for kiosk deployment.

## Migration Path

### Adding Flipbook to Existing Publication

1. Export publication from FlipbookHTML tool
2. Extract flipbook package to `public/flipbooks/[publication-name]/`
3. Update publication record in database:
   ```sql
   UPDATE publications 
   SET flipbook_path = '/flipbooks/[publication-name]/index.html'
   WHERE id = [publication_id];
   ```
4. Verify flipbook displays correctly in Publications Room

### Batch Import

For multiple flipbooks:
1. Create directory structure in `public/flipbooks/`
2. Copy all flipbook packages
3. Create CSV with publication IDs and flipbook paths
4. Run import script to update database records

## Future Enhancements

### Potential Improvements

1. **Flipbook Thumbnails:** Generate thumbnail from first page
2. **Progress Tracking:** Remember last viewed page
3. **Fullscreen Mode:** Native fullscreen API integration
4. **Download Option:** Allow downloading flipbook as PDF
5. **Analytics:** Track which publications are viewed most
6. **Search Integration:** Index flipbook text content for search
7. **Preloading:** Preload flipbook assets for faster display
8. **Offline Support:** Cache flipbooks for offline viewing

### Scalability Considerations

- **Storage:** Flipbooks can be large (10-50MB per publication)
- **Loading:** Consider lazy loading for flipbook assets
- **Caching:** Implement browser caching for flipbook resources
- **CDN:** For production, consider CDN for flipbook assets
