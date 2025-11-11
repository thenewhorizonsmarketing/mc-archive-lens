# Content Components

Shared components and hooks for displaying database content across all content pages (Alumni, Publications, Photos, Faculty).

## Components

### ContentList
Reusable component for displaying lists of content records with loading and empty states.

**Features:**
- Grid and list view modes
- Loading skeleton states
- Empty state with clear filters option
- Responsive layout

**Usage:**
```tsx
import { ContentList } from '@/components/content';

<ContentList
  records={records}
  contentType="alumni"
  loading={loading}
  onSelectRecord={selectRecord}
  viewMode="grid"
  emptyMessage="No alumni found"
  onClearFilters={() => setFilters({})}
>
  {records.map(record => (
    <RecordCard key={record.id} record={record} />
  ))}
</ContentList>
```

### RecordCard
Card component for displaying individual records with thumbnails and metadata.

**Features:**
- Support for all content types
- Lazy loading images
- Grid and list view modes
- Hover and focus states
- Accessibility attributes

**Usage:**
```tsx
import { RecordCard } from '@/components/content';

<RecordCard
  record={record}
  contentType="alumni"
  onClick={() => selectRecord(record.id)}
  viewMode="grid"
/>
```

### RecordDetail
Modal component for displaying full record details.

**Features:**
- Type-specific content rendering
- Keyboard navigation (Escape to close, arrows for prev/next)
- Responsive design
- Accessibility support

**Usage:**
```tsx
import { RecordDetail } from '@/components/content';

{selectedRecord && (
  <RecordDetail
    record={selectedRecord}
    contentType="alumni"
    onClose={clearSelection}
    onNavigate={handleNavigate}
    showNavigation={true}
  />
)}
```

### FilterPanel
Reusable filter panel with type-specific filter options.

**Features:**
- Content-type specific filters
- Year range, department, collection filters
- Collapsible on mobile
- Clear filters button
- Accessible form controls

**Usage:**
```tsx
import { FilterPanel } from '@/components/content';

<FilterPanel
  contentType="alumni"
  filters={filters}
  onFiltersChange={setFilters}
  availableYears={[2020, 2021, 2022]}
  availableDepartments={['Law', 'Business']}
/>
```

## Hook

### useContentData
Custom hook for managing content data with search, filters, and pagination.

**Features:**
- Integrates with SearchProvider context
- Debounced search and filter updates
- Automatic retry logic with exponential backoff
- Pagination support
- Error handling and recovery
- Loading states

**Usage:**
```tsx
import { useContentData } from '@/hooks/useContentData';

const {
  records,
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
  clearSelection,
  refresh
} = useContentData({
  contentType: 'alumni',
  pageSize: 24,
  enableAutoRetry: true
});
```

## Architecture

All components follow these principles:
- **Accessibility**: Full keyboard navigation, ARIA labels, screen reader support
- **Responsive**: Mobile-first design with breakpoints
- **Performance**: Lazy loading, debouncing, caching
- **Reusability**: Type-safe props, flexible configuration
- **Error Handling**: Graceful degradation, retry logic

## Styling

Each component has its own CSS file with:
- CSS custom properties for theming
- Responsive breakpoints
- High contrast mode support
- Reduced motion support
- Dark mode support (where applicable)

## Integration

These components are designed to work with:
- `SearchProvider` context from `@/lib/search-context`
- `BrowserSearchManager` for data fetching
- Database types from `@/lib/database/types`

## Next Steps

Use these components to implement the content pages:
1. AlumniRoom
2. PublicationsRoom
3. PhotosRoom
4. FacultyRoom

See the implementation plan in `.kiro/specs/connect-database-to-pages/tasks.md` for details.
