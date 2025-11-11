# Content Pages Developer Guide

## Architecture Overview

The content pages system provides a reusable architecture for browsing database content across four content types: Alumni, Publications, Photos, and Faculty.

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│                     SearchProvider                       │
│              (Global database context)                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Content Page Components                     │
│  - AlumniRoom, PublicationsRoom, PhotosRoom,           │
│    FacultyRoom                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              useContentData Hook                         │
│  - Data fetching, filtering, pagination                 │
│  - Caching, retry logic, error handling                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Shared Components                           │
│  - ContentList, RecordCard, RecordDetail,               │
│    FilterPanel                                          │
└─────────────────────────────────────────────────────────┘
```

## Core Hooks

### useContentData

The primary hook for managing content data with search, filters, and pagination.

**Location**: `src/hooks/useContentData.ts`

**Features**:
- Database integration via SearchProvider
- Debounced search and filter updates (300ms)
- Automatic retry logic with exponential backoff (up to 3 attempts)
- In-memory caching with configurable expiration (default 5 minutes)
- Pagination with preloading support
- Error handling and recovery
- Loading states and retry tracking

**Usage**:
```typescript
import { useContentData } from '@/hooks/useContentData';

const {
  records,              // All matching records
  paginatedRecords,     // Current page records
  loading,              // Loading state
  error,                // Error message
  filters,              // Current filters
  setFilters,           // Update filters
  searchQuery,          // Current search query
  setSearchQuery,       // Update search query
  currentPage,          // Current page number
  totalPages,           // Total page count
  totalRecords,         // Total record count
  goToPage,             // Navigate to page
  nextPage,             // Go to next page
  prevPage,             // Go to previous page
  selectedRecord,       // Currently selected record
  selectRecord,         // Select a record by ID
  clearSelection,       // Clear selection
  refresh,              // Manual refresh (bypasses cache)
  retryCount,           // Current retry attempt
  isRetrying,           // Retry in progress
  isCached,             // Data from cache
  clearCache,           // Clear cache for content type
  isPreloading,         // Preloading next page
  onScrollProgress      // Trigger preloading
} = useContentData({
  contentType: 'alumni',
  pageSize: 24,
  enableAutoRetry: true,
  maxRetries: 3,
  cacheEnabled: true,
  cacheExpirationMs: 5 * 60 * 1000,
  enablePreloading: true,
  preloadThreshold: 0.8,
  virtualScrolling: false
});
```

**Configuration Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `contentType` | `'alumni' \| 'publication' \| 'photo' \| 'faculty'` | Required | Content type to fetch |
| `initialFilters` | `SearchFilters` | `{}` | Initial filter values |
| `pageSize` | `number` | `24` | Records per page |
| `enableAutoRetry` | `boolean` | `true` | Enable automatic retry on errors |
| `maxRetries` | `number` | `3` | Maximum retry attempts |
| `cacheEnabled` | `boolean` | `true` | Enable result caching |
| `cacheExpirationMs` | `number` | `300000` | Cache expiration time (5 min) |
| `enablePreloading` | `boolean` | `true` | Enable next page preloading |
| `preloadThreshold` | `number` | `0.8` | Scroll threshold for preloading |
| `virtualScrolling` | `boolean` | `false` | Enable virtual scrolling optimization |

### useContentDataWithUrl

Extends `useContentData` with URL parameter synchronization for deep linking.

**Location**: `src/hooks/useContentDataWithUrl.ts`

**Additional Features**:
- Automatic URL parameter synchronization
- Browser back/forward navigation support
- Deep linking to specific records
- Filter and search state in URL
- Pagination state in URL

**Usage**:
```typescript
import { useContentDataWithUrl } from '@/hooks/useContentDataWithUrl';

const {
  // All useContentData features, plus:
  updateUrlParams,      // Update URL parameters
  clearUrlParams        // Clear specific URL parameters
} = useContentDataWithUrl({
  contentType: 'alumni',
  pageSize: 24
});

// Update URL with custom parameters
updateUrlParams({ year: '1980', department: 'Law' }, true);

// Clear specific parameters
clearUrlParams(['year', 'department']);
```

**URL Parameter Format**:

| Parameter | Description | Example |
|-----------|-------------|---------|
| `q` | Search query | `?q=john` |
| `year` | Single year filter | `?year=1980` |
| `yearStart` | Year range start | `?yearStart=1980` |
| `yearEnd` | Year range end | `?yearEnd=1990` |
| `department` | Department filter | `?department=Law` |
| `publicationType` | Publication type | `?publicationType=journal` |
| `collection` | Photo collection | `?collection=graduation` |
| `eventType` | Event type | `?eventType=ceremony` |
| `position` | Faculty position | `?position=professor` |
| `page` | Current page | `?page=2` |
| `id` | Selected record | `?id=alumni_001` |

## Shared Components

### ContentList

Reusable list component with loading and empty states.

**Location**: `src/components/content/ContentList.tsx`

**Props**:
```typescript
interface ContentListProps {
  records: SearchResult[];
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  loading: boolean;
  onSelectRecord: (id: string) => void;
  viewMode: 'grid' | 'list';
  emptyMessage?: string;
  onClearFilters?: () => void;
  children?: React.ReactNode;
}
```

**Features**:
- Grid and list view modes
- Loading skeleton states
- Empty state with clear filters option
- Responsive layout with breakpoints
- Accessibility support

### RecordCard

Card component for displaying individual records.

**Location**: `src/components/content/RecordCard.tsx`

**Props**:
```typescript
interface RecordCardProps {
  record: SearchResult;
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onClick: () => void;
  viewMode: 'grid' | 'list';
}
```

**Features**:
- Type-specific rendering
- Lazy-loaded images
- Hover and focus states
- Keyboard navigation support
- ARIA labels and roles

### RecordDetail

Modal component for displaying full record details.

**Location**: `src/components/content/RecordDetail.tsx`

**Props**:
```typescript
interface RecordDetailProps {
  record: SearchResult;
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  showNavigation?: boolean;
}
```

**Features**:
- Type-specific detail rendering
- Keyboard navigation (Escape, arrows)
- Responsive modal design
- Focus trap for accessibility
- Previous/next navigation

### FilterPanel

Reusable filter panel with type-specific filters.

**Location**: `src/components/content/FilterPanel.tsx`

**Props**:
```typescript
interface FilterPanelProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableYears: number[];
  availableDepartments: string[];
}
```

**Features**:
- Content-type specific filters
- Year range, department, collection filters
- Collapsible on mobile
- Clear filters button
- Accessible form controls

## Content Page Implementation

### Basic Page Structure

```typescript
import { useContentDataWithUrl } from '@/hooks/useContentDataWithUrl';
import { ContentList, RecordCard, RecordDetail, FilterPanel } from '@/components/content';

export function AlumniRoom() {
  const {
    paginatedRecords,
    loading,
    error,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    currentPage,
    totalPages,
    goToPage,
    selectedRecord,
    selectRecord,
    clearSelection
  } = useContentDataWithUrl({
    contentType: 'alumni',
    pageSize: 24
  });

  return (
    <div className="content-page">
      {/* Header with search */}
      <header>
        <h1>Alumni</h1>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search alumni..."
        />
      </header>

      <div className="content-layout">
        {/* Filter panel */}
        <aside>
          <FilterPanel
            contentType="alumni"
            filters={filters}
            onFiltersChange={setFilters}
            availableYears={[2020, 2021, 2022]}
            availableDepartments={['Law', 'Business']}
          />
        </aside>

        {/* Main content */}
        <main>
          <ContentList
            records={paginatedRecords}
            contentType="alumni"
            loading={loading}
            onSelectRecord={selectRecord}
            viewMode="grid"
          >
            {paginatedRecords.map(record => (
              <RecordCard
                key={record.id}
                record={record}
                contentType="alumni"
                onClick={() => selectRecord(record.id)}
                viewMode="grid"
              />
            ))}
          </ContentList>

          {/* Pagination */}
          <div className="pagination">
            <button onClick={() => goToPage(currentPage - 1)}>Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)}>Next</button>
          </div>
        </main>
      </div>

      {/* Detail modal */}
      {selectedRecord && (
        <RecordDetail
          record={selectedRecord}
          contentType="alumni"
          onClose={clearSelection}
          showNavigation={true}
        />
      )}
    </div>
  );
}
```

## Performance Optimization

### Caching Strategy

The system implements multi-level caching:

1. **Search Results Cache**: Caches full search results by query + filters
2. **Record Details Cache**: Caches individual record details
3. **Preloaded Pages Cache**: Tracks preloaded pages to avoid duplicate work

**Cache Keys**:
```typescript
// Search results cache key
const cacheKey = JSON.stringify({ query, filters });

// Record details cache key
const recordKey = record.id;
```

**Cache Invalidation**:
- Automatic expiration after 5 minutes (configurable)
- Manual refresh bypasses cache
- Filter/query changes invalidate relevant cache entries

### Debouncing

Search and filter updates are debounced to reduce unnecessary API calls:

```typescript
const DEBOUNCE_DELAY = 300; // milliseconds

// Debounced fetch function
const debouncedFetch = useCallback((query: string, filters: SearchFilters) => {
  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
  }
  
  debounceTimerRef.current = setTimeout(() => {
    fetchData(query, filters);
  }, DEBOUNCE_DELAY);
}, [fetchData]);
```

### Preloading

Next page preloading improves perceived performance:

```typescript
// Trigger preloading when user scrolls 80% through current page
const onScrollProgress = useCallback((progress: number) => {
  if (progress >= 0.8) {
    preloadNextPage();
  }
}, [preloadNextPage]);

// Preload images for next page
const preloadNextPage = useCallback(async () => {
  const nextPageRecords = records.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );
  
  nextPageRecords.forEach(record => {
    if (record.thumbnail) {
      const img = new Image();
      img.src = record.thumbnail;
    }
  });
}, [records, currentPage, pageSize]);
```

### Virtual Scrolling

For very large datasets, enable virtual scrolling:

```typescript
const contentData = useContentData({
  contentType: 'alumni',
  virtualScrolling: true // Automatically calculates optimal page size
});
```

## Error Handling

### Retry Logic

Automatic retry with exponential backoff:

```typescript
const fetchData = async (query, filters, attempt = 1) => {
  try {
    const results = await searchManager.searchAll(query, filters);
    setRecords(results);
  } catch (err) {
    if (attempt < maxRetries) {
      // Wait before retry with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, RETRY_DELAY * attempt)
      );
      await fetchData(query, filters, attempt + 1);
    } else {
      // Use cached data as fallback
      const cachedEntry = searchResultsCache.get(cacheKey);
      if (cachedEntry) {
        setRecords(cachedEntry.data);
        setError('Using cached data');
      }
    }
  }
};
```

### Error States

Display user-friendly error messages:

```typescript
if (error) {
  return (
    <div className="error-state">
      <p>{error}</p>
      {isCached && <p>Showing cached data</p>}
      <button onClick={refresh}>Retry</button>
    </div>
  );
}
```

## Testing

### Unit Tests

Test hooks and components in isolation:

```typescript
// Test useContentData hook
describe('useContentData', () => {
  it('fetches records on mount', async () => {
    const { result } = renderHook(() => 
      useContentData({ contentType: 'alumni' })
    );
    
    await waitFor(() => {
      expect(result.current.records.length).toBeGreaterThan(0);
    });
  });
  
  it('applies filters correctly', async () => {
    const { result } = renderHook(() => 
      useContentData({ contentType: 'alumni' })
    );
    
    act(() => {
      result.current.setFilters({ year: 1980 });
    });
    
    await waitFor(() => {
      expect(result.current.records.every(r => 
        r.metadata.year === 1980
      )).toBe(true);
    });
  });
});
```

### Integration Tests

Test full page functionality:

```typescript
describe('AlumniRoom', () => {
  it('loads and displays alumni records', async () => {
    render(<AlumniRoom />);
    
    await waitFor(() => {
      expect(screen.getByText(/alumni/i)).toBeInTheDocument();
    });
    
    const cards = screen.getAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);
  });
  
  it('filters records by year', async () => {
    render(<AlumniRoom />);
    
    const yearFilter = screen.getByLabelText(/year/i);
    fireEvent.change(yearFilter, { target: { value: '1980' } });
    
    await waitFor(() => {
      const cards = screen.getAllByRole('article');
      cards.forEach(card => {
        expect(card).toHaveTextContent('1980');
      });
    });
  });
});
```

## Accessibility

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```typescript
// Record card keyboard handler
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onClick();
  }
};

return (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={handleKeyDown}
    aria-label={`View ${record.title}`}
  >
    {/* Card content */}
  </div>
);
```

### Screen Reader Support

Use ARIA attributes and live regions:

```typescript
// Announce filter changes
<div aria-live="polite" aria-atomic="true">
  {loading ? 'Loading results...' : `${totalRecords} results found`}
</div>

// Accessible filter controls
<label htmlFor="year-filter">
  Filter by year
</label>
<select
  id="year-filter"
  aria-describedby="year-filter-help"
  value={filters.year}
  onChange={handleYearChange}
>
  <option value="">All years</option>
  {years.map(year => (
    <option key={year} value={year}>{year}</option>
  ))}
</select>
<span id="year-filter-help" className="sr-only">
  Select a year to filter results
</span>
```

## Best Practices

### Component Organization

```
src/
├── pages/
│   ├── AlumniRoom.tsx
│   ├── PublicationsRoom.tsx
│   ├── PhotosRoom.tsx
│   └── FacultyRoom.tsx
├── components/
│   └── content/
│       ├── ContentList.tsx
│       ├── RecordCard.tsx
│       ├── RecordDetail.tsx
│       ├── FilterPanel.tsx
│       └── README.md
├── hooks/
│   ├── useContentData.ts
│   └── useContentDataWithUrl.ts
└── lib/
    └── utils/
        └── url-params.ts
```

### Code Style

- Use TypeScript for type safety
- Follow React hooks best practices
- Implement proper cleanup in useEffect
- Use useCallback and useMemo for optimization
- Add JSDoc comments for public APIs

### Performance

- Enable caching for frequently accessed data
- Use debouncing for user input
- Implement pagination for large datasets
- Lazy load images and heavy components
- Monitor performance with React DevTools

### Accessibility

- Test with keyboard only
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Ensure sufficient color contrast
- Support reduced motion preferences
- Provide alternative text for images

## Troubleshooting

### Common Issues

**Issue**: Records not loading
- Check SearchProvider is initialized
- Verify database connection in admin panel
- Check browser console for errors
- Ensure contentType matches database schema

**Issue**: Filters not working
- Verify filter values match database fields
- Check debounce delay hasn't been set too high
- Ensure filters are properly typed
- Check URL parameters are being parsed correctly

**Issue**: Performance problems
- Enable caching if disabled
- Reduce page size for large datasets
- Check for memory leaks in useEffect cleanup
- Monitor network requests in DevTools

**Issue**: URL parameters not syncing
- Verify useContentDataWithUrl is being used
- Check browser history API is available
- Ensure URL parameter format is correct
- Check for conflicting URL updates

## Additional Resources

- [Content Components README](../src/components/content/README.md)
- [URL Deep Linking Guide](./URL_DEEP_LINKING_GUIDE.md)
- [Database Schema](../src/lib/database/schema.ts)
- [Search Manager API](../src/lib/database/browser-search-manager.ts)
