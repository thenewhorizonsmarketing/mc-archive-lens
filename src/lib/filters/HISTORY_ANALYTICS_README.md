# Search History & Analytics

Comprehensive search history tracking and analytics system with MC Law blue styling.

## Overview

The history and analytics system provides:
- **Persistent History Tracking**: Stores all searches in IndexedDB
- **Timeline View**: Visual timeline of search history
- **Analytics Dashboard**: Comprehensive statistics and insights
- **Auto Cleanup**: Removes entries older than 30 days
- **Re-execution**: Quickly re-run previous searches

## Components

### 1. HistoryTracker

Core service for tracking and managing search history.

**Location**: `src/lib/filters/HistoryTracker.ts`

**Features**:
- IndexedDB storage for persistence
- Automatic cleanup of old entries
- Comprehensive statistics generation
- Import/export functionality
- Efficient querying with indexes

**Usage**:
```typescript
import { getHistoryTracker } from '@/lib/filters/HistoryTracker';

const tracker = getHistoryTracker();

// Record a search
await tracker.recordSearch(
  'John Smith',           // query
  filterConfig,           // FilterConfig object
  42,                     // result count
  156,                    // execution time (ms)
  { source: 'homepage' }  // optional metadata
);

// Get recent history
const recent = await tracker.getRecent(50);

// Get statistics
const stats = await tracker.getStatistics();

// Clean up old entries
const deletedCount = await tracker.cleanup(30); // 30 days
```

### 2. SearchHistory Component

Timeline view of search history with MC Blue styling.

**Location**: `src/components/filters/SearchHistory.tsx`

**Features**:
- Grouped timeline by date (Today, Yesterday, etc.)
- Filter by time range (All, Today, Week, Month)
- Re-execute previous searches
- Delete individual entries
- Clear all history
- Hover details with filter summary

**Props**:
```typescript
interface SearchHistoryProps {
  onExecuteSearch?: (filters: FilterConfig, query: string) => void;
  onClose?: () => void;
  contentType?: string;
  maxEntries?: number;
}
```

**Usage**:
```tsx
import { SearchHistory } from '@/components/filters/SearchHistory';

<SearchHistory
  onExecuteSearch={(filters, query) => {
    // Re-execute the search
    console.log('Re-running:', query);
  }}
  onClose={() => setShowHistory(false)}
  maxEntries={50}
/>
```

### 3. SearchAnalytics Component

Comprehensive analytics dashboard with visualizations.

**Location**: `src/components/filters/SearchAnalytics.tsx`

**Features**:
- Summary cards (total searches, unique queries, avg results, avg speed)
- Top search terms with bar charts
- Category distribution (bar chart + pie chart)
- Time distribution (hourly activity chart)
- Recent activity list

**Props**:
```typescript
interface SearchAnalyticsProps {
  onClose?: () => void;
  contentType?: string;
}
```

**Usage**:
```tsx
import { SearchAnalytics } from '@/components/filters/SearchAnalytics';

<SearchAnalytics
  onClose={() => setShowAnalytics(false)}
  contentType="alumni"
/>
```

## Data Models

### HistoryEntry

```typescript
interface HistoryEntry {
  id: string;
  query: string;
  filters: FilterConfig;
  timestamp: Date;
  resultCount: number;
  executionTime: number;
  contentType: string;
  metadata?: {
    userAgent?: string;
    screenSize?: string;
    [key: string]: any;
  };
}
```

### HistoryStats

```typescript
interface HistoryStats {
  totalSearches: number;
  uniqueQueries: number;
  avgResultsPerSearch: number;
  avgExecutionTime: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  categoryBreakdown: Map<string, number>;
  timeDistribution: Map<string, number>;
  recentSearches: HistoryEntry[];
}
```

## Storage

### IndexedDB Schema

**Database**: `mc-law-search-history`
**Version**: 1
**Object Store**: `history`

**Indexes**:
- `timestamp`: For date range queries
- `contentType`: For filtering by content type
- `query`: For text search

### Auto Cleanup

The system automatically cleans up entries older than 30 days:
- Runs once per day
- Triggered on initialization
- Last cleanup time stored in localStorage
- Can be manually triggered via `tracker.cleanup(days)`

## Integration Example

```typescript
import { getHistoryTracker } from '@/lib/filters/HistoryTracker';
import { SearchHistory } from '@/components/filters/SearchHistory';
import { SearchAnalytics } from '@/components/filters/SearchAnalytics';

// In your search component
const handleSearch = async (query: string, filters: FilterConfig) => {
  const startTime = Date.now();
  
  // Execute search
  const results = await executeSearch(query, filters);
  
  const executionTime = Date.now() - startTime;
  
  // Record in history
  const tracker = getHistoryTracker();
  await tracker.recordSearch(
    query,
    filters,
    results.length,
    executionTime
  );
  
  return results;
};

// Show history
<SearchHistory
  onExecuteSearch={(filters, query) => {
    handleSearch(query, filters);
  }}
/>

// Show analytics
<SearchAnalytics />
```

## Styling

All components use MC Law blue color scheme:

```css
--mc-blue: #0C2340      /* Primary background */
--mc-gold: #C99700      /* Accents and highlights */
--mc-white: #FFFFFF     /* Text and borders */
```

### Key Visual Elements

- **Timeline Markers**: Gold circles with connecting lines
- **Cards**: MC Blue background with gold borders
- **Charts**: Gold bars and pie slices
- **Hover Effects**: Gold highlights and shadows
- **Buttons**: Gold primary, transparent secondary

## Performance

### Optimization Strategies

1. **Indexed Queries**: All common queries use IndexedDB indexes
2. **Lazy Loading**: Only load visible entries
3. **Debounced Updates**: Prevent excessive re-renders
4. **Cached Statistics**: Statistics calculated once per load
5. **Virtual Scrolling**: For large history lists (future enhancement)

### Performance Targets

- History load: < 100ms for 1000 entries
- Statistics calculation: < 200ms for 1000 entries
- Record search: < 50ms
- UI render: 60fps animations

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels on all interactive elements
- **Color Contrast**: White on MC Blue exceeds 7:1 ratio
- **Focus Indicators**: Gold outlines on focused elements
- **Semantic HTML**: Proper heading hierarchy

### Keyboard Shortcuts

- `Tab`: Navigate between elements
- `Enter`: Execute action
- `Escape`: Close modals
- `Arrow Keys`: Navigate timeline entries

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All browsers with IndexedDB support.

## Testing

### Unit Tests

```typescript
// Test history recording
test('records search in history', async () => {
  const tracker = getHistoryTracker();
  const entry = await tracker.recordSearch(
    'test query',
    mockFilters,
    10,
    100
  );
  expect(entry.query).toBe('test query');
});

// Test statistics
test('calculates statistics correctly', async () => {
  const tracker = getHistoryTracker();
  const stats = await tracker.getStatistics();
  expect(stats.totalSearches).toBeGreaterThan(0);
});
```

### Integration Tests

```typescript
// Test history UI
test('displays history timeline', async () => {
  render(<SearchHistory />);
  await waitFor(() => {
    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});

// Test analytics UI
test('displays analytics dashboard', async () => {
  render(<SearchAnalytics />);
  await waitFor(() => {
    expect(screen.getByText('Total Searches')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Common Issues

**Issue**: History not persisting
- **Solution**: Check IndexedDB is enabled in browser
- **Solution**: Verify storage quota not exceeded

**Issue**: Slow statistics calculation
- **Solution**: Run cleanup to reduce entry count
- **Solution**: Clear old entries manually

**Issue**: Charts not displaying
- **Solution**: Ensure data exists (generate sample data)
- **Solution**: Check browser console for errors

### Debug Mode

Enable debug logging:

```typescript
localStorage.setItem('mc-law-history-debug', 'true');
```

## Future Enhancements

1. **Export/Import**: Export history as CSV/JSON
2. **Search History**: Full-text search within history
3. **Favorites**: Mark important searches
4. **Sharing**: Share search configurations
5. **Trends**: Long-term trend analysis
6. **Recommendations**: Suggest related searches
7. **Filters**: Advanced filtering of history
8. **Comparison**: Compare search performance over time

## API Reference

### HistoryTracker Methods

```typescript
class HistoryTracker {
  // Record a search
  recordSearch(query, filters, resultCount, executionTime, metadata?): Promise<HistoryEntry>
  
  // Retrieve history
  getAll(): Promise<HistoryEntry[]>
  getRecent(limit): Promise<HistoryEntry[]>
  getByDateRange(start, end): Promise<HistoryEntry[]>
  getByContentType(type): Promise<HistoryEntry[]>
  getById(id): Promise<HistoryEntry | null>
  
  // Search history
  searchHistory(term): Promise<HistoryEntry[]>
  
  // Statistics
  getStatistics(): Promise<HistoryStats>
  
  // Management
  delete(id): Promise<boolean>
  clearAll(): Promise<void>
  cleanup(days): Promise<number>
  
  // Import/Export
  export(): Promise<string>
  import(json, merge): Promise<number>
}
```

## License

Part of the MC Law Advanced Search Filter system.
