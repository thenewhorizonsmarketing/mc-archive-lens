# Design Document: Connect Database to Content Pages

## Overview

This design integrates the existing database infrastructure (DatabaseManager, BrowserDatabaseManager, BrowserSearchManager) with the four main content pages (Alumni, Publications, Photos, Faculty). The solution leverages the existing SearchProvider context to provide consistent database access across all pages while maintaining performance through caching and pagination.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     App.tsx                              │
│              (SearchProvider wrapper)                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ├─────────────────────────────────┐
                          │                                 │
                          ▼                                 ▼
┌──────────────────────────────────┐    ┌──────────────────────────────────┐
│      Content Pages                │    │    Existing Pages                │
│  - AlumniRoom.tsx                 │    │  - FullscreenSearchPage.tsx     │
│  - PublicationsRoom.tsx (new)     │    │  - AdminPanel.tsx               │
│  - PhotosRoom.tsx (new)           │    │                                 │
│  - FacultyRoom.tsx (new)          │    │                                 │
└──────────────────────────────────┘    └──────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              useSearch() Hook                            │
│         (from SearchProvider context)                    │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│           BrowserSearchManager                           │
│  - searchAll()                                           │
│  - searchByType()                                        │
│  - getRecordById()                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         BrowserDatabaseManager                           │
│  - searchMockData()                                      │
│  - getMockData()                                         │
│  - Filter and query logic                               │
└─────────────────────────────────────────────────────────┘
```

### Component Structure

Each content page will follow this structure:

```
ContentPage (e.g., AlumniRoom)
├── useSearch() hook - Access to searchManager
├── useState() - Local state for filters, pagination, selected record
├── useEffect() - Initial data load and filter updates
├── ContentList Component
│   ├── FilterPanel - Year, department, type filters
│   ├── SearchBar - Local search within content type
│   └── RecordGrid/List - Display records with pagination
└── RecordDetail Component (modal or side panel)
    └── Display full record information
```

## Components and Interfaces

### 1. Content Page Hook (useContentData)

Create a reusable hook for fetching and managing content data:

```typescript
interface UseContentDataOptions {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  initialFilters?: SearchFilters;
  pageSize?: number;
}

interface UseContentDataReturn {
  records: SearchResult[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  selectedRecord: SearchResult | null;
  selectRecord: (id: string) => void;
  clearSelection: () => void;
  refresh: () => Promise<void>;
}

function useContentData(options: UseContentDataOptions): UseContentDataReturn
```

### 2. Content List Component

Reusable component for displaying lists of records:

```typescript
interface ContentListProps {
  records: SearchResult[];
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  loading: boolean;
  onSelectRecord: (id: string) => void;
  viewMode: 'grid' | 'list';
}

function ContentList(props: ContentListProps): JSX.Element
```

### 3. Record Card Component

Display individual records in grid or list view:

```typescript
interface RecordCardProps {
  record: SearchResult;
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onClick: () => void;
  viewMode: 'grid' | 'list';
}

function RecordCard(props: RecordCardProps): JSX.Element
```

### 4. Record Detail Component

Display full record information:

```typescript
interface RecordDetailProps {
  record: SearchResult;
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

function RecordDetail(props: RecordDetailProps): JSX.Element
```

### 5. Filter Panel Component

Reusable filter controls:

```typescript
interface FilterPanelProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableYears: number[];
  availableDepartments: string[];
}

function FilterPanel(props: FilterPanelProps): JSX.Element
```

## Data Models

### SearchResult (existing, from types.ts)

```typescript
interface SearchResult {
  id: string;
  type: 'alumni' | 'publication' | 'photo' | 'faculty';
  title: string;
  snippet: string;
  relevanceScore: number;
  score: number;
  metadata: Record<string, any>;
  thumbnail?: string;
  thumbnailPath?: string;
  data: any; // Type-specific data
}
```

### SearchFilters (existing, from types.ts)

```typescript
interface SearchFilters {
  type?: 'alumni' | 'publication' | 'photo' | 'faculty';
  year?: number;
  yearRange?: { start: number; end: number };
  department?: string;
  name?: string;
  tags?: string[];
}
```

### ContentPageState

```typescript
interface ContentPageState {
  records: SearchResult[];
  filteredRecords: SearchResult[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  selectedRecordId: string | null;
  viewMode: 'grid' | 'list';
}
```

## Page Implementations

### AlumniRoom Page

**Current State:** Exists but may have placeholder content

**Updates Needed:**
1. Integrate useSearch() hook
2. Implement useContentData hook with type='alumni'
3. Display alumni records in grid view with photos
4. Add filters: year range, department, class role
5. Add search bar for name search
6. Implement detail view for individual alumni
7. Support URL parameters for deep linking (e.g., `/alumni?id=alumni_001`)

**Layout:**
- Header with title and search bar
- Filter panel (collapsible on mobile)
- Grid of alumni cards with photos and names
- Pagination controls
- Detail modal/panel when alumni selected

### PublicationsRoom Page (New)

**Implementation:**
1. Create new page at `src/pages/PublicationsRoom.tsx`
2. Use useContentData hook with type='publication'
3. Display publications in list view with thumbnails
4. Add filters: year, publication type, department
5. Add search bar for title/author search
6. Implement detail view with PDF preview if available
7. Support URL parameters for deep linking

**Layout:**
- Header with title and search bar
- Filter panel (collapsible on mobile)
- List of publication cards with title, author, year
- Pagination controls
- Detail modal/panel with publication metadata

### PhotosRoom Page (New)

**Implementation:**
1. Create new page at `src/pages/PhotosRoom.tsx`
2. Use useContentData hook with type='photo'
3. Display photos in masonry grid layout
4. Add filters: year, collection, event type
5. Add search bar for caption/title search
6. Implement lightbox for full-size photo viewing
7. Support URL parameters for deep linking

**Layout:**
- Header with title and search bar
- Filter panel (collapsible on mobile)
- Masonry grid of photo thumbnails
- Pagination controls
- Lightbox modal for full-size viewing

### FacultyRoom Page (New)

**Implementation:**
1. Create new page at `src/pages/FacultyRoom.tsx`
2. Use useContentData hook with type='faculty'
3. Display faculty in grid view with headshots
4. Add filters: department, position/title
5. Add search bar for name search
6. Implement detail view with contact information
7. Support URL parameters for deep linking

**Layout:**
- Header with title and search bar
- Filter panel (collapsible on mobile)
- Grid of faculty cards with headshots and names
- Pagination controls
- Detail modal/panel with full faculty information

## Data Flow

### Initial Page Load

1. Page component mounts
2. useContentData hook initializes
3. Hook calls useSearch() to get searchManager
4. If searchManager not ready, show loading state
5. Once ready, call searchManager.searchAll() with type filter
6. Store results in local state
7. Apply any URL parameters (filters, selected record)
8. Render content

### Filter Change

1. User updates filter (e.g., selects year range)
2. setFilters() called with new filter values
3. useEffect triggers on filter change
4. Call searchManager.searchAll() with updated filters
5. Update records state with new results
6. Update URL parameters to reflect filters
7. Re-render content

### Search Query

1. User types in search bar
2. setSearchQuery() called (debounced)
3. useEffect triggers on query change
4. Call searchManager.searchAll() with query and filters
5. Update records state with new results
6. Update URL parameters to reflect query
7. Re-render content

### Record Selection

1. User clicks on a record card
2. selectRecord(id) called
3. Update selectedRecordId state
4. Update URL to include record ID
5. Render detail view (modal or panel)
6. Optionally fetch additional record details if needed

### Pagination

1. User clicks page number or next/prev
2. goToPage(pageNumber) called
3. Calculate slice of records to display
4. Update currentPage state
5. Scroll to top of content area
6. Re-render with new page of records

## Error Handling

### Database Not Initialized

```typescript
if (!searchManager || !isInitialized) {
  return <LoadingState message="Initializing database..." />;
}

if (error) {
  return <ErrorState 
    message="Failed to connect to database" 
    error={error}
    onRetry={attemptRecovery}
  />;
}
```

### Data Fetch Errors

```typescript
try {
  const results = await searchManager.searchAll(query, filters, options);
  setRecords(results);
  setError(null);
} catch (err) {
  console.error('Failed to fetch records:', err);
  setError(err.message);
  // Keep existing records if available
  if (records.length === 0) {
    setRecords([]);
  }
}
```

### Empty Results

```typescript
if (records.length === 0 && !loading) {
  return (
    <EmptyState
      message="No records found"
      description="Try adjusting your filters or search query"
      onClearFilters={() => setFilters({})}
    />
  );
}
```

## Testing Strategy

### Unit Tests

1. Test useContentData hook with different content types
2. Test filter logic and state updates
3. Test pagination calculations
4. Test URL parameter parsing and generation
5. Test error handling and recovery

### Integration Tests

1. Test full page load with database integration
2. Test filter changes update results correctly
3. Test search query updates results correctly
4. Test record selection and detail view
5. Test navigation between pages maintains state
6. Test deep linking with URL parameters

### Manual Testing

1. Load each content page and verify data displays
2. Test all filter combinations
3. Test search functionality
4. Test pagination
5. Test record selection and detail view
6. Test URL deep linking
7. Test error states (disconnect database, etc.)
8. Test performance with large datasets
9. Test accessibility (keyboard navigation, screen readers)
10. Test responsive design on different screen sizes

## Performance Considerations

### Caching Strategy

- Cache search results in useContentData hook
- Invalidate cache on filter/query changes
- Use React Query or similar for advanced caching
- Cache record details separately from list results

### Pagination

- Default page size: 24 records (grid) or 50 records (list)
- Implement virtual scrolling for very large datasets
- Preload next page when user reaches 80% of current page

### Image Loading

- Use lazy loading for thumbnails
- Implement progressive image loading
- Provide placeholder images while loading
- Optimize image sizes for thumbnails vs. full view

### Debouncing

- Debounce search input (300ms)
- Debounce filter changes (200ms)
- Avoid unnecessary re-renders with React.memo

## Accessibility

### Keyboard Navigation

- Tab through all interactive elements
- Enter to select records
- Escape to close detail views
- Arrow keys for pagination

### Screen Reader Support

- Proper ARIA labels on all controls
- Announce filter changes
- Announce page changes
- Announce record count updates
- Provide alternative text for images

### Visual Accessibility

- High contrast mode support
- Focus indicators on all interactive elements
- Sufficient color contrast ratios
- Scalable text and UI elements

## Migration Path

### Phase 1: Update AlumniRoom

1. Update existing AlumniRoom.tsx to use database
2. Test thoroughly
3. Deploy and monitor

### Phase 2: Create PublicationsRoom

1. Create new PublicationsRoom.tsx
2. Add route to App.tsx
3. Update navigation from HomePage
4. Test and deploy

### Phase 3: Create PhotosRoom

1. Create new PhotosRoom.tsx
2. Add route to App.tsx
3. Update navigation from HomePage
4. Test and deploy

### Phase 4: Create FacultyRoom

1. Create new FacultyRoom.tsx
2. Add route to App.tsx
3. Update navigation from HomePage
4. Test and deploy

### Phase 5: Polish and Optimize

1. Implement shared components
2. Optimize performance
3. Add advanced features (sorting, advanced filters)
4. Final accessibility audit
