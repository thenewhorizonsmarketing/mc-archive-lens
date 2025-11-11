# URL Deep Linking Developer Guide

## Quick Start

All content pages (Alumni, Publications, Photos, Faculty) now support URL deep linking. This allows users to share direct links to specific records, filtered views, and search results.

## For Users

### Sharing a Link

Simply copy the URL from your browser's address bar. The URL will include:
- Current search query
- Applied filters
- Current page number
- Selected record (if viewing details)

**Example URLs:**

```
# View all alumni from Law department, years 2015-2025
https://yoursite.com/alumni?department=Law&yearStart=2015&yearEnd=2025

# Search for "John Smith" in alumni
https://yoursite.com/alumni?q=John%20Smith

# View specific alumnus
https://yoursite.com/alumni?id=alumni_042

# View publications filtered by type, page 3
https://yoursite.com/publications?publicationType=Law%20Review&page=3
```

### Using Shared Links

When you open a shared link:
1. The page loads with all filters applied
2. Search queries are automatically executed
3. If a record ID is in the URL, the detail view opens automatically
4. The browser back button works as expected

## For Developers

### Using the URL-Aware Hook

All content pages use `useContentDataWithUrl` instead of `useContentData`:

```typescript
import { useContentDataWithUrl } from '@/hooks/useContentDataWithUrl';

function MyContentPage() {
  const {
    records,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    selectedRecord,
    selectRecord,
    // ... other properties
  } = useContentDataWithUrl({
    contentType: 'alumni',
    pageSize: 24
  });
  
  // State automatically syncs with URL!
  // No manual URL management needed
}
```

### URL Parameter Schema

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Record ID (e.g., `alumni_001`) |
| `q` | string | Search query |
| `page` | number | Current page |
| `view` | 'grid' \| 'list' | View mode |
| `year` | number | Specific year |
| `yearStart` | number | Year range start |
| `yearEnd` | number | Year range end |
| `department` | string | Department filter |
| `publicationType` | string | Publication type (publications only) |
| `collection` | string | Collection (photos only) |
| `eventType` | string | Event type (photos only) |
| `position` | string | Position (faculty only) |

### Manual URL Updates

If you need to manually update URL parameters:

```typescript
import { updateUrl, getCurrentParams, mergeParams } from '@/lib/utils/url-params';

// Get current parameters
const currentParams = getCurrentParams();

// Update specific parameters
const updatedParams = mergeParams(currentParams, {
  year: '2020',
  department: 'Law'
});

// Update URL (replace = true to avoid creating history entry)
updateUrl(updatedParams, true);
```

### Validating Record IDs

```typescript
import { isValidRecordId, getContentTypeFromId } from '@/lib/utils/url-params';

// Check if ID is valid
if (isValidRecordId('alumni_001')) {
  // Valid format
}

// Extract content type
const type = getContentTypeFromId('alumni_001'); // Returns 'alumni'
```

### Converting Between Filters and URL Params

```typescript
import { paramsToFilters, filtersToParams } from '@/lib/utils/url-params';

// URL params → SearchFilters
const params = { year: '2020', department: 'Law' };
const filters = paramsToFilters(params, 'alumni');
// Result: { type: 'alumni', year: 2020, department: 'Law' }

// SearchFilters → URL params
const filters = { type: 'alumni', year: 2020, department: 'Law' };
const params = filtersToParams(filters);
// Result: { year: '2020', department: 'Law' }
```

## How It Works

### State Synchronization

The `useContentDataWithUrl` hook automatically syncs state with URL:

1. **On Mount**: Reads URL parameters and initializes state
2. **On Filter Change**: Updates URL (replace state)
3. **On Search Change**: Updates URL (replace state)
4. **On Page Change**: Updates URL (replace state)
5. **On Record Selection**: Updates URL (push state)
6. **On Browser Back/Forward**: Reads URL and updates state

### URL Update Strategy

- **Replace State**: Used for filters, search, pagination
  - Doesn't create new history entries
  - Prevents cluttering browser history
  
- **Push State**: Used for record selection
  - Creates new history entry
  - Allows back button to close detail view

### Error Handling

Invalid URLs are handled gracefully:

```typescript
// Invalid record ID format
/alumni?id=invalid_format
// → ID cleared, list view shown

// Valid format but record not found
/alumni?id=alumni_999999
// → Warning logged, ID cleared, list view shown

// Wrong content type
/alumni?id=publication_042
// → ID cleared, list view shown
```

## Testing

### Unit Tests

Run the URL parameter tests:

```bash
npm test src/lib/utils/__tests__/url-params.test.ts
```

### Manual Testing

1. Apply filters → Check URL updates
2. Search → Check URL updates
3. Select record → Check URL updates
4. Copy URL → Open in new tab → Verify state restored
5. Press back button → Verify previous state restored
6. Press forward button → Verify next state restored

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Uses standard Web APIs:
- `URLSearchParams`
- `window.history.pushState`
- `window.history.replaceState`
- `popstate` event

## Performance

- Search query changes are debounced (300ms)
- URL updates use replace state to avoid history pollution
- Record IDs are validated before attempting to load
- Invalid URLs fall back to default list view

## Common Patterns

### Share Current View

```typescript
// User clicks "Share" button
const currentUrl = window.location.href;
navigator.clipboard.writeText(currentUrl);
```

### Reset to Default View

```typescript
// Clear all filters and return to page 1
setFilters({ type: contentType });
setSearchQuery('');
goToPage(1);
// URL automatically updates to /alumni (or other page)
```

### Deep Link to Specific Record

```typescript
// Navigate to specific record
window.location.href = `/alumni?id=alumni_042`;
// Or use React Router
navigate(`/alumni?id=alumni_042`);
```

### Combine Multiple Filters

```typescript
// All filters work together
const url = `/alumni?q=Smith&department=Law&yearStart=2010&yearEnd=2020&page=2`;
// Opens Alumni Room with:
// - Search: "Smith"
// - Department: Law
// - Year range: 2010-2020
// - Page: 2
```

## Troubleshooting

### URL Not Updating

Check that you're using `useContentDataWithUrl` instead of `useContentData`:

```typescript
// ❌ Wrong
import { useContentData } from '@/hooks/useContentData';

// ✅ Correct
import { useContentDataWithUrl } from '@/hooks/useContentDataWithUrl';
```

### State Not Restoring from URL

Ensure the hook is initialized before trying to access state:

```typescript
const { records, loading } = useContentDataWithUrl({ ... });

if (loading) {
  return <LoadingSpinner />;
}

// Now safe to use records
```

### Record Not Opening from URL

Check that:
1. Record ID format is valid: `(alumni|publication|photo|faculty)_\d+`
2. Record exists in the current filtered results
3. Content type matches the page (e.g., `alumni_001` on `/alumni`)

## Future Enhancements

Potential improvements:
- URL shortening for complex filter combinations
- QR code generation for mobile sharing
- Open Graph meta tags for rich social previews
- Analytics tracking for shared links
- Named bookmarks for saved views

## Support

For issues or questions:
1. Check the comprehensive documentation: `.kiro/specs/connect-database-to-pages/URL_DEEP_LINKING.md`
2. Review the implementation: `src/hooks/useContentDataWithUrl.ts`
3. Check the test suite: `src/lib/utils/__tests__/url-params.test.ts`
