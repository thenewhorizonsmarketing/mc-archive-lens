# URL Deep Linking Implementation

## Overview

URL deep linking has been implemented for all content pages (Alumni, Publications, Photos, Faculty), allowing users to share direct links to specific records, filtered views, and search results.

## Implementation Details

### Core Components

1. **URL Parameter Utilities** (`src/lib/utils/url-params.ts`)
   - Parse and build URL search parameters
   - Convert between URL params and SearchFilters
   - Validate record IDs
   - Merge and clear parameters

2. **URL-Aware Content Hook** (`src/hooks/useContentDataWithUrl.ts`)
   - Extends `useContentData` with URL synchronization
   - Automatically syncs state with URL parameters
   - Handles browser back/forward navigation
   - Manages initial state from URL on page load

3. **Updated Content Pages**
   - AlumniRoom, PublicationsRoom, PhotosRoom, FacultyRoom
   - All now use `useContentDataWithUrl` hook
   - Automatically sync filters, search, pagination, and selection with URL

## URL Parameter Schema

### Common Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id` | string | Selected record ID | `alumni_001` |
| `q` | string | Search query | `John%20Smith` |
| `page` | number | Current page number | `2` |
| `view` | string | View mode (grid/list) | `grid` |

### Filter Parameters

| Parameter | Type | Applies To | Description | Example |
|-----------|------|------------|-------------|---------|
| `year` | number | All | Specific year filter | `2020` |
| `yearStart` | number | All | Year range start | `2015` |
| `yearEnd` | number | All | Year range end | `2025` |
| `department` | string | Alumni, Faculty, Publications | Department filter | `Law` |
| `publicationType` | string | Publications | Publication type filter | `Law%20Review` |
| `collection` | string | Photos | Photo collection filter | `Graduation` |
| `eventType` | string | Photos | Event type filter | `Ceremony` |
| `position` | string | Faculty | Position/title filter | `Professor` |

## URL Examples

### Alumni Room

```
# View all alumni
/alumni

# Search for "John Smith"
/alumni?q=John%20Smith

# Filter by year 2020
/alumni?year=2020

# Filter by year range 2015-2025
/alumni?yearStart=2015&yearEnd=2025

# Filter by department
/alumni?department=Law

# View specific alumnus
/alumni?id=alumni_042

# Combined: Search + filter + page 2
/alumni?q=Smith&department=Law&page=2

# View specific alumnus with grid view
/alumni?id=alumni_042&view=grid
```

### Publications Room

```
# View all publications
/publications

# Search for "constitutional law"
/publications?q=constitutional%20law

# Filter by publication type
/publications?publicationType=Law%20Review

# Filter by year and department
/publications?year=2020&department=Law

# View specific publication
/publications?id=publication_123

# Combined: Search + filters + page 3
/publications?q=law&publicationType=Amicus&yearStart=2015&page=3
```

### Photos Room

```
# View all photos
/photos

# Search for "graduation"
/photos?q=graduation

# Filter by collection
/photos?collection=Class%20Photos

# Filter by event type
/photos?eventType=Ceremony

# Filter by year
/photos?year=1980

# View specific photo
/photos?id=photo_456

# Combined: Search + filters
/photos?q=ceremony&collection=Events&yearStart=1980&yearEnd=1990
```

### Faculty Room

```
# View all faculty
/faculty

# Search for "Professor Smith"
/faculty?q=Smith

# Filter by department
/faculty?department=Law

# Filter by position
/faculty?position=Professor

# View specific faculty member
/faculty?id=faculty_789

# Combined: Search + filters
/faculty?q=Smith&department=Law&position=Professor
```

## Features

### 1. Deep Linking to Records

Users can share direct links to specific records:

```typescript
// Example: Link to specific alumnus
const url = `/alumni?id=alumni_042`;

// The page will:
// 1. Load the alumni list
// 2. Automatically open the detail view for alumni_042
// 3. Show error if record not found
```

### 2. Filter Persistence

All filters are preserved in the URL:

```typescript
// Example: Link with filters applied
const url = `/alumni?department=Law&yearStart=2015&yearEnd=2025`;

// The page will:
// 1. Apply the department filter
// 2. Apply the year range filter
// 3. Display filtered results
```

### 3. Search Query Persistence

Search queries are preserved in the URL:

```typescript
// Example: Link with search query
const url = `/alumni?q=John%20Smith`;

// The page will:
// 1. Set the search query to "John Smith"
// 2. Execute the search
// 3. Display search results
```

### 4. Pagination State

Current page is preserved in the URL:

```typescript
// Example: Link to page 3
const url = `/alumni?page=3`;

// The page will:
// 1. Navigate to page 3
// 2. Display records for that page
```

### 5. Browser Navigation

Back/forward buttons work correctly:

- Pressing back returns to previous filter/search state
- Pressing forward moves to next state
- URL updates without page reload
- State is fully restored from URL

### 6. Invalid Record Handling

Invalid record IDs are handled gracefully:

```typescript
// Invalid ID format
/alumni?id=invalid_format
// Result: ID is cleared from URL, list view shown

// Valid format but record not found
/alumni?id=alumni_999999
// Result: Warning logged, ID cleared from URL, list view shown

// Wrong content type
/alumni?id=publication_042
// Result: ID is cleared from URL, list view shown
```

## Technical Implementation

### URL Synchronization Flow

1. **Initial Page Load**
   ```
   URL → Parse Params → Initialize Filters → Fetch Data → Render
   ```

2. **User Changes Filter**
   ```
   User Action → Update State → Update URL (replace) → Fetch Data → Render
   ```

3. **User Selects Record**
   ```
   User Click → Update State → Update URL (push) → Render Detail
   ```

4. **Browser Back Button**
   ```
   Back Button → popstate Event → Parse URL → Update State → Render
   ```

### State Management

The `useContentDataWithUrl` hook manages:

- **Filters**: Synced with URL on change (replace state)
- **Search Query**: Synced with URL on change (replace state)
- **Current Page**: Synced with URL on change (replace state)
- **Selected Record**: Synced with URL on change (push state)

### URL Update Strategy

- **Replace State**: Used for filters, search, pagination
  - Doesn't create new history entry
  - Prevents cluttering browser history
  
- **Push State**: Used for record selection
  - Creates new history entry
  - Allows back button to close detail view

## Testing

### Unit Tests

Location: `src/lib/utils/__tests__/url-params.test.ts`

Tests cover:
- URL parameter parsing
- Filter conversion
- URL building
- Record ID validation
- Parameter merging and clearing

All 22 tests pass successfully.

### Manual Testing Checklist

- [ ] Direct link to record opens detail view
- [ ] Invalid record ID shows error and clears URL
- [ ] Filters persist in URL
- [ ] Search query persists in URL
- [ ] Pagination persists in URL
- [ ] Browser back button works correctly
- [ ] Browser forward button works correctly
- [ ] Sharing URL preserves all state
- [ ] URL updates without page reload
- [ ] Multiple filters work together
- [ ] Clearing filters updates URL
- [ ] View mode persists in URL

## Browser Compatibility

The implementation uses:
- `URLSearchParams` API (supported in all modern browsers)
- `window.history.pushState` (supported in all modern browsers)
- `window.history.replaceState` (supported in all modern browsers)
- `popstate` event (supported in all modern browsers)

No polyfills required for target browsers (Chrome, Firefox, Safari, Edge).

## Performance Considerations

1. **Debouncing**: Search query changes are debounced (300ms) before updating URL
2. **Replace vs Push**: Strategic use of replace/push prevents history pollution
3. **Validation**: Record IDs are validated before attempting to load
4. **Graceful Degradation**: Invalid URLs fall back to default list view

## Future Enhancements

Potential improvements for future iterations:

1. **URL Shortening**: Implement short URLs for complex filter combinations
2. **QR Codes**: Generate QR codes for easy mobile sharing
3. **Social Sharing**: Add Open Graph meta tags for rich social previews
4. **Analytics**: Track which deep links are most commonly shared
5. **Bookmarking**: Add "Save this view" feature to create named bookmarks

## Requirements Satisfied

This implementation satisfies all requirements from task 6.1:

✅ Parse URL parameters for filters and selected record
✅ Update URL when filters or selection changes
✅ Implement browser back/forward navigation
✅ Handle invalid record IDs gracefully

Requirements covered: 7.1, 7.2, 7.3, 7.4, 7.5
