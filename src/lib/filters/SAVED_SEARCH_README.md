# Saved Search & Share Functionality

Complete implementation of saved search management and filter sharing capabilities with MC Law blue styling.

## Overview

This module provides comprehensive functionality for:
- Saving and managing search filter configurations
- Sharing filters via URLs
- Exporting/importing filter configurations
- Usage tracking and analytics
- MC Law branded UI components

## Components

### 1. SavedSearchManager (`SavedSearchManager.ts`)

Core manager for CRUD operations on saved searches.

**Features:**
- Save/load/delete search configurations
- localStorage persistence
- Usage statistics tracking
- Search and filtering capabilities
- Import/export functionality
- Automatic cleanup of unused searches

**Usage:**
```typescript
import { getSavedSearchManager } from './SavedSearchManager';

const manager = getSavedSearchManager();

// Save a search
const saved = manager.save(
  'Alumni 1980s',
  filterConfig,
  'Search for alumni from the 1980s',
  ['alumni', 'decade']
);

// Load a search (updates usage stats)
const search = manager.load(saved.id);

// Get all searches
const all = manager.getAll();

// Get recent searches
const recent = manager.getRecent(5);

// Get popular searches
const popular = manager.getPopular(5);

// Search by name/description
const results = manager.search('alumni');

// Delete a search
manager.delete(saved.id);

// Get statistics
const stats = manager.getStatistics();
```

### 2. ShareManager (`ShareManager.ts`)

Manages sharing functionality for filter configurations.

**Features:**
- Generate shareable URLs with encoded filters
- Copy to clipboard functionality
- Parse shared URLs to restore filters
- Export as JSON files
- Native share API support (mobile)
- QR code generation (with library)
- URL validation

**Usage:**
```typescript
import { getShareManager } from './ShareManager';

const manager = getShareManager();

// Generate shareable URL
const url = manager.generateShareableURL(filterConfig, {
  name: 'My Search',
  description: 'Search description'
});

// Copy to clipboard
const success = await manager.copyToClipboard(filterConfig);

// Parse shared URL
const shared = manager.parseSharedURL(url);
if (shared) {
  const filters = shared.filters;
}

// Check if current URL has shared filters
if (manager.hasSharedFilters()) {
  const filters = manager.getSharedFilters();
}

// Export as JSON
manager.exportAsJSON(filterConfig, 'my-filters.json');

// Import from JSON
const file = await getFileFromInput();
const imported = await manager.importFromJSON(file);

// Native share (mobile)
const shared = await manager.shareNative(filterConfig, metadata);

// Validate filters before sharing
const validation = manager.validateFilters(filterConfig);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### 3. SavedSearches Component (`SavedSearches.tsx`)

UI component for displaying and managing saved searches.

**Features:**
- Grid layout with MC Blue cards
- Search within saved searches
- Sort by recent/popular/name
- Edit/delete/duplicate actions
- Quick load functionality
- Save current search dialog
- Usage statistics display

**Props:**
```typescript
interface SavedSearchesProps {
  onLoad: (filters: FilterConfig) => void;
  onClose?: () => void;
  currentFilters?: FilterConfig;
}
```

**Usage:**
```tsx
import { SavedSearches } from './SavedSearches';

<SavedSearches
  onLoad={(filters) => {
    setCurrentFilters(filters);
  }}
  onClose={() => setShowSaved(false)}
  currentFilters={currentFilters}
/>
```

### 4. ShareDialog Component (`ShareDialog.tsx`)

UI component for sharing filter configurations.

**Features:**
- Display shareable URL
- Copy to clipboard button
- Native share integration
- Export options
- URL length validation
- MC Blue styling

**Props:**
```typescript
interface ShareDialogProps {
  filters: FilterConfig;
  onClose: () => void;
  metadata?: {
    name?: string;
    description?: string;
  };
}
```

**Usage:**
```tsx
import { ShareDialog } from './ShareDialog';

<ShareDialog
  filters={currentFilters}
  onClose={() => setShowShare(false)}
  metadata={{
    name: 'My Search',
    description: 'Search description'
  }}
/>
```

## Data Models

### SavedSearch
```typescript
interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: FilterConfig;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
  tags?: string[];
}
```

### ShareableFilter
```typescript
interface ShareableFilter {
  version: number;
  filters: FilterConfig;
  timestamp: number;
  metadata?: {
    name?: string;
    description?: string;
    creator?: string;
  };
}
```

## Storage

### localStorage
Saved searches are stored in localStorage under the key `mc-law-saved-searches`:

```json
{
  "version": 1,
  "searches": {
    "search-123": {
      "id": "search-123",
      "name": "Alumni 1980s",
      "filters": { ... },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastUsed": "2024-01-15T12:30:00.000Z",
      "useCount": 5
    }
  }
}
```

### URL Parameters
Shared filters are encoded in the URL as a base64 string:

```
https://example.com/search?filters=eyJ2ZXJzaW9uIjoxLCJmaWx0ZXJzIjp7...
```

## Styling

All components use MC Law blue color scheme:

```css
--mc-blue: #0C2340
--mc-gold: #C99700
--mc-white: #FFFFFF
```

### Key Style Features:
- MC Blue backgrounds
- Gold borders and accents
- White text for contrast
- Smooth transitions and animations
- Hover effects with gold highlights
- Responsive design for mobile

## API Reference

### SavedSearchManager Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `save(name, filters, description?, tags?, id?)` | Save or update a search | `SavedSearch` |
| `load(id)` | Load search and update stats | `SavedSearch \| null` |
| `get(id)` | Get search without updating stats | `SavedSearch \| null` |
| `getAll()` | Get all saved searches | `SavedSearch[]` |
| `getRecent(limit?)` | Get recent searches | `SavedSearch[]` |
| `getPopular(limit?)` | Get popular searches | `SavedSearch[]` |
| `search(query)` | Search by name/description | `SavedSearch[]` |
| `getByTag(tag)` | Get searches by tag | `SavedSearch[]` |
| `delete(id)` | Delete a search | `boolean` |
| `update(id, updates)` | Update a search | `SavedSearch \| null` |
| `duplicate(id, newName?)` | Duplicate a search | `SavedSearch \| null` |
| `clear()` | Clear all searches | `void` |
| `export()` | Export as JSON string | `string` |
| `import(json, merge?)` | Import from JSON | `boolean` |
| `getStatistics()` | Get usage statistics | `Statistics` |
| `cleanup(daysUnused?)` | Clean up old searches | `number` |

### ShareManager Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `generateShareableURL(filters, metadata?)` | Generate shareable URL | `string` |
| `parseSharedURL(url?)` | Parse shared URL | `ShareableFilter \| null` |
| `hasSharedFilters()` | Check if URL has filters | `boolean` |
| `getSharedFilters()` | Get filters from URL | `FilterConfig \| null` |
| `copyToClipboard(filters, metadata?)` | Copy URL to clipboard | `Promise<boolean>` |
| `generateShortCode(filters)` | Generate short code | `string` |
| `clearSharedFilters()` | Clear filters from URL | `void` |
| `updateURL(filters, metadata?)` | Update URL without reload | `void` |
| `exportAsJSON(filters, filename?)` | Export as JSON file | `void` |
| `importFromJSON(file)` | Import from JSON file | `Promise<FilterConfig \| null>` |
| `generateQRCode(filters)` | Generate QR code | `Promise<string \| null>` |
| `shareNative(filters, metadata?)` | Native share (mobile) | `Promise<boolean>` |
| `validateFilters(filters)` | Validate filters | `ValidationResult` |
| `getShareStatistics()` | Get share stats | `Statistics` |

## Examples

### Complete Integration Example

See `SavedSearchExample.tsx` for a complete working example that demonstrates:
- Saving current search
- Loading saved searches
- Sharing filters via URL
- Exporting/importing
- Usage statistics
- All UI components

### Basic Usage

```tsx
import { useState } from 'react';
import { SavedSearches } from './SavedSearches';
import { ShareDialog } from './ShareDialog';
import { getSavedSearchManager } from './SavedSearchManager';
import { getShareManager } from './ShareManager';

function MySearchPage() {
  const [filters, setFilters] = useState<FilterConfig>({ ... });
  const [showSaved, setShowSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const savedManager = getSavedSearchManager();
  const shareManager = getShareManager();

  // Check for shared filters on mount
  useEffect(() => {
    if (shareManager.hasSharedFilters()) {
      const shared = shareManager.getSharedFilters();
      if (shared) setFilters(shared);
    }
  }, []);

  return (
    <div>
      <button onClick={() => setShowSaved(true)}>
        Saved Searches
      </button>
      <button onClick={() => setShowShare(true)}>
        Share
      </button>

      {showSaved && (
        <SavedSearches
          onLoad={setFilters}
          onClose={() => setShowSaved(false)}
          currentFilters={filters}
        />
      )}

      {showShare && (
        <ShareDialog
          filters={filters}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required APIs:
- localStorage (required)
- Clipboard API (optional, fallback available)
- Web Share API (optional, mobile only)
- File API (for import/export)

## Performance Considerations

- Saved searches are cached in memory
- localStorage operations are synchronous
- URL encoding is limited to ~2000 characters
- Large filter configurations should use export instead of URL sharing
- Automatic cleanup of unused searches (90 days default)

## Security

- All data is stored locally (no server)
- URL parameters are base64 encoded (not encrypted)
- No sensitive data should be included in filters
- Shared URLs are public and can be accessed by anyone

## Testing

Run the example component to test all functionality:

```bash
npm run dev
# Navigate to the SavedSearchExample component
```

## Future Enhancements

- Server-side storage for cross-device sync
- Encrypted sharing for sensitive filters
- Collaborative filter editing
- Filter templates library
- Advanced analytics dashboard
- QR code generation (requires library)
- Social media sharing integration
