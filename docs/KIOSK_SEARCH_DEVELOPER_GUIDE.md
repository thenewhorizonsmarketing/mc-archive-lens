# Kiosk Search Developer Guide

## Overview

This guide provides technical documentation for developers working with the Fullscreen Kiosk Search Interface. It covers component APIs, integration patterns, error handling, and maintenance procedures.

## Architecture

### Component Hierarchy

```
FullscreenSearchPage
├── KioskSearchInterface (Main Container)
│   ├── SearchInput (with clear button)
│   ├── TouchKeyboard (Virtual keyboard)
│   ├── FilterPanel (Category/year filters)
│   └── ResultsDisplay (Search results)
└── KioskSearchErrorBoundary (Error handling)
```

### Data Flow

1. User input → TouchKeyboard or physical keyboard
2. Input → SearchInput component (debounced 150ms)
3. Query → SearchManager (SQLite FTS5)
4. Filters → FilterProcessor
5. Results → ResultsDisplay
6. Selection → Navigation to detail page

## Component APIs

### KioskSearchInterface

Main container component for the kiosk search experience.

**Props:**

```typescript
interface KioskSearchInterfaceProps {
  onClose?: () => void;           // Callback when search is closed
  initialQuery?: string;           // Pre-populate search query
  initialFilters?: FilterState;    // Pre-populate filters
  className?: string;              // Additional CSS classes
}
```

**Usage:**

```typescript
import { KioskSearchInterface } from '@/components/kiosk/KioskSearchInterface';

function MyPage() {
  return (
    <KioskSearchInterface
      onClose={() => navigate('/')}
      initialQuery="John Smith"
    />
  );
}
```

**State Management:**

- `query`: Current search query string
- `results`: Array of search results
- `filters`: Active filter state
- `isLoading`: Loading state indicator
- `error`: Error state (if any)

### TouchKeyboard

Virtual keyboard component optimized for touch input.

**Props:**

```typescript
interface TouchKeyboardProps {
  onKeyPress: (key: string) => void;     // Single key press
  onBackspace: () => void;                // Delete last character
  onClear: () => void;                    // Clear all text
  onEnter?: () => void;                   // Submit action
  disabled?: boolean;                     // Disable keyboard
  className?: string;
}
```

**Usage:**

```typescript
import { TouchKeyboard } from '@/components/kiosk/TouchKeyboard';

<TouchKeyboard
  onKeyPress={(key) => setQuery(prev => prev + key)}
  onBackspace={() => setQuery(prev => prev.slice(0, -1))}
  onClear={() => setQuery('')}
/>
```

**Key Layout:**

- QWERTY layout with 3 rows
- Key size: 60x60 pixels
- Spacing: 8 pixels between keys
- Special keys: BACK, SPACE, CLEAR, ENTER

**Performance:**

- Touch feedback: < 50ms
- Visual state change: Immediate
- Haptic feedback: Optional (if supported)

### FilterPanel

Filter controls for narrowing search results.

**Props:**

```typescript
interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  resultCount: number;              // Display result count
  className?: string;
}

interface FilterState {
  categories: string[];             // ['alumni', 'publications', etc.]
  yearRange: [number, number];      // [startYear, endYear]
  publicationTypes: string[];       // For publications only
}
```

**Usage:**

```typescript
import { FilterPanel } from '@/components/kiosk/FilterPanel';

<FilterPanel
  filters={filters}
  onFilterChange={setFilters}
  resultCount={results.length}
/>
```

**Filter Types:**

1. **Category Filters**: Alumni, Publications, Photos, Faculty
2. **Year Range**: Slider with min/max values
3. **Decade Filters**: Quick select buttons
4. **Publication Types**: Specific to publications category

### ResultsDisplay

Displays search results with loading and error states.

**Props:**

```typescript
interface ResultsDisplayProps {
  results: SearchResult[];
  isLoading: boolean;
  error: Error | null;
  onResultClick: (result: SearchResult) => void;
  onRetry?: () => void;
  className?: string;
}

interface SearchResult {
  id: string;
  type: 'alumni' | 'publication' | 'photo' | 'faculty';
  title: string;
  subtitle?: string;
  thumbnail?: string;
  year?: number;
  relevance: number;
}
```

**Usage:**

```typescript
import { ResultsDisplay } from '@/components/kiosk/ResultsDisplay';

<ResultsDisplay
  results={results}
  isLoading={isLoading}
  error={error}
  onResultClick={(result) => navigate(`/detail/${result.id}`)}
  onRetry={() => performSearch()}
/>
```

**States:**

- **Loading**: Skeleton loaders (8 items)
- **Empty**: No results message with suggestions
- **Error**: Error message with retry button
- **Results**: Grid of result cards

### KioskSearchErrorBoundary

Error boundary for graceful error handling.

**Props:**

```typescript
interface KioskSearchErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: React.ReactNode;
}
```

**Usage:**

```typescript
import { KioskSearchErrorBoundary } from '@/components/kiosk/KioskSearchErrorBoundary';

<KioskSearchErrorBoundary
  onError={(error) => logError(error)}
>
  <KioskSearchInterface />
</KioskSearchErrorBoundary>
```

## Integration Examples

### Basic Integration

```typescript
import { FullscreenSearchPage } from '@/pages/FullscreenSearchPage';
import { BrowserRouter, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Route path="/search" element={<FullscreenSearchPage />} />
    </BrowserRouter>
  );
}
```

### With Initial State

```typescript
import { KioskSearchInterface } from '@/components/kiosk/KioskSearchInterface';

function SearchWithDefaults() {
  return (
    <KioskSearchInterface
      initialQuery="Class of 1990"
      initialFilters={{
        categories: ['alumni'],
        yearRange: [1985, 1995],
        publicationTypes: []
      }}
    />
  );
}
```

### Custom Close Handler

```typescript
function SearchWithAnalytics() {
  const handleClose = () => {
    // Track analytics
    trackEvent('search_closed', {
      query: currentQuery,
      resultsCount: results.length
    });
    
    // Navigate away
    navigate('/');
  };

  return <KioskSearchInterface onClose={handleClose} />;
}
```

### Programmatic Search

```typescript
function SearchWithAPI() {
  const searchRef = useRef<KioskSearchInterfaceRef>(null);

  const performSearch = (query: string) => {
    searchRef.current?.setQuery(query);
    searchRef.current?.executeSearch();
  };

  return (
    <>
      <button onClick={() => performSearch('John Doe')}>
        Search John Doe
      </button>
      <KioskSearchInterface ref={searchRef} />
    </>
  );
}
```

## Error Handling Patterns

### Component-Level Error Handling

```typescript
function SafeSearchInterface() {
  const [error, setError] = useState<Error | null>(null);

  const handleSearch = async (query: string) => {
    try {
      setError(null);
      const results = await searchDatabase(query);
      setResults(results);
    } catch (err) {
      setError(err as Error);
      // Fallback to cached results
      setResults(getCachedResults());
    }
  };

  return (
    <KioskSearchInterface
      onSearch={handleSearch}
      error={error}
    />
  );
}
```

### Retry Logic

```typescript
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function searchWithRetry(query: string, attempt = 1): Promise<SearchResult[]> {
  try {
    return await searchDatabase(query);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      return searchWithRetry(query, attempt + 1);
    }
    throw error;
  }
}
```

### Graceful Degradation

```typescript
function ResilientSearch() {
  const [searchMode, setSearchMode] = useState<'fts5' | 'basic'>('fts5');

  const handleSearch = async (query: string) => {
    try {
      if (searchMode === 'fts5') {
        return await fts5Search(query);
      } else {
        return await basicSearch(query);
      }
    } catch (error) {
      // Fallback to basic search
      if (searchMode === 'fts5') {
        setSearchMode('basic');
        return await basicSearch(query);
      }
      throw error;
    }
  };

  return <KioskSearchInterface onSearch={handleSearch} />;
}
```

### Error Logging

```typescript
function SearchWithLogging() {
  const logError = (error: Error, context: Record<string, any>) => {
    console.error('Search Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context
    });
    
    // Send to monitoring service
    if (window.errorTracker) {
      window.errorTracker.captureException(error, context);
    }
  };

  return (
    <KioskSearchErrorBoundary
      onError={(error, errorInfo) => {
        logError(error, {
          componentStack: errorInfo.componentStack,
          query: currentQuery,
          filters: currentFilters
        });
      }}
    >
      <KioskSearchInterface />
    </KioskSearchErrorBoundary>
  );
}
```

## Performance Optimization

### Debouncing Search Input

```typescript
import { useDebouncedCallback } from 'use-debounce';

function OptimizedSearch() {
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      performSearch(query);
    },
    150 // 150ms delay
  );

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Memoizing Results

```typescript
import { useMemo } from 'react';

function MemoizedResults({ results, filters }: Props) {
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      // Apply filters
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(result.type)) return false;
      }
      if (filters.yearRange) {
        if (result.year < filters.yearRange[0]) return false;
        if (result.year > filters.yearRange[1]) return false;
      }
      return true;
    });
  }, [results, filters]);

  return <ResultsDisplay results={filteredResults} />;
}
```

### Virtual Scrolling

```typescript
import { FixedSizeList } from 'react-window';

function VirtualizedResults({ results }: Props) {
  return (
    <FixedSizeList
      height={600}
      itemCount={results.length}
      itemSize={120}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ResultCard result={results[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### Lazy Loading Images

```typescript
function LazyResultCard({ result }: Props) {
  return (
    <div className="result-card">
      <img
        src={result.thumbnail}
        loading="lazy"
        alt={result.title}
      />
      <h3>{result.title}</h3>
    </div>
  );
}
```


## Testing

### Unit Testing Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TouchKeyboard } from '@/components/kiosk/TouchKeyboard';

describe('TouchKeyboard', () => {
  it('should call onKeyPress when key is clicked', () => {
    const onKeyPress = jest.fn();
    render(<TouchKeyboard onKeyPress={onKeyPress} />);
    
    fireEvent.click(screen.getByText('A'));
    expect(onKeyPress).toHaveBeenCalledWith('A');
  });

  it('should call onBackspace when BACK is clicked', () => {
    const onBackspace = jest.fn();
    render(<TouchKeyboard onBackspace={onBackspace} />);
    
    fireEvent.click(screen.getByText('BACK'));
    expect(onBackspace).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KioskSearchInterface } from '@/components/kiosk/KioskSearchInterface';

describe('KioskSearchInterface Integration', () => {
  it('should perform search and display results', async () => {
    const mockSearch = jest.fn().mockResolvedValue([
      { id: '1', title: 'John Doe', type: 'alumni' }
    ]);
    
    render(<KioskSearchInterface searchFn={mockSearch} />);
    
    // Type in search
    const input = screen.getByPlaceholderText('Search...');
    await userEvent.type(input, 'John');
    
    // Wait for debounce and results
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith('John');
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

### E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test('kiosk search flow', async ({ page }) => {
  await page.goto('/search');
  
  // Type search query
  await page.fill('[data-testid="search-input"]', 'John Smith');
  
  // Wait for results
  await page.waitForSelector('[data-testid="result-card"]');
  
  // Verify results appear
  const results = await page.locator('[data-testid="result-card"]').count();
  expect(results).toBeGreaterThan(0);
  
  // Click first result
  await page.click('[data-testid="result-card"]:first-child');
  
  // Verify navigation
  await expect(page).toHaveURL(/\/detail\/.+/);
});
```

### Performance Testing

```typescript
import { performance } from 'perf_hooks';

describe('Search Performance', () => {
  it('should return results within 150ms', async () => {
    const start = performance.now();
    const results = await searchDatabase('test query');
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(150);
    expect(results).toBeDefined();
  });

  it('should handle 1000 results efficiently', async () => {
    const largeResultSet = generateMockResults(1000);
    
    const start = performance.now();
    render(<ResultsDisplay results={largeResultSet} />);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(200);
  });
});
```

## Styling and Theming

### CSS Variables

```css
:root {
  /* Colors */
  --kiosk-primary: #0C2340;      /* MC Law Navy */
  --kiosk-secondary: #C99700;    /* MC Law Gold */
  --kiosk-background: #FFFFFF;
  --kiosk-text: #1A1A1A;
  --kiosk-border: #E5E5E5;
  
  /* Spacing */
  --kiosk-spacing-xs: 4px;
  --kiosk-spacing-sm: 8px;
  --kiosk-spacing-md: 16px;
  --kiosk-spacing-lg: 24px;
  --kiosk-spacing-xl: 32px;
  
  /* Touch Targets */
  --kiosk-touch-min: 44px;
  --kiosk-key-size: 60px;
  
  /* Transitions */
  --kiosk-transition-fast: 150ms;
  --kiosk-transition-normal: 300ms;
  --kiosk-transition-slow: 500ms;
}
```

### Custom Styling

```typescript
import { KioskSearchInterface } from '@/components/kiosk/KioskSearchInterface';
import './custom-kiosk-styles.css';

function CustomStyledSearch() {
  return (
    <KioskSearchInterface
      className="custom-kiosk-search"
    />
  );
}
```

```css
/* custom-kiosk-styles.css */
.custom-kiosk-search {
  --kiosk-primary: #FF0000;
  --kiosk-secondary: #00FF00;
}

.custom-kiosk-search .keyboard-key {
  border-radius: 12px;
  font-weight: bold;
}
```

## Accessibility

### ARIA Labels

All components include proper ARIA labels:

```typescript
<button
  aria-label="Clear search input"
  onClick={handleClear}
>
  <X />
</button>

<div
  role="search"
  aria-label="Alumni search interface"
>
  <input
    aria-label="Search query"
    aria-describedby="search-help"
  />
</div>
```

### Keyboard Navigation

```typescript
function AccessibleSearch() {
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        handleClose();
        break;
      case 'Enter':
        if (results.length > 0) {
          selectResult(results[0]);
        }
        break;
      case 'ArrowDown':
        focusNextResult();
        break;
      case 'ArrowUp':
        focusPreviousResult();
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Search interface */}
    </div>
  );
}
```

### Screen Reader Support

```typescript
import { useAnnounce } from '@/hooks/useAnnounce';

function AccessibleResults({ results, isLoading }: Props) {
  const announce = useAnnounce();

  useEffect(() => {
    if (isLoading) {
      announce('Searching...');
    } else {
      announce(`Found ${results.length} results`);
    }
  }, [results, isLoading]);

  return <ResultsDisplay results={results} />;
}
```

## Database Integration

### Search Manager API

```typescript
import { SearchManager } from '@/lib/database/search-manager';

const searchManager = new SearchManager();

// Basic search
const results = await searchManager.search('John Smith');

// Search with filters
const filteredResults = await searchManager.search('John Smith', {
  categories: ['alumni'],
  yearRange: [1980, 1990]
});

// Get suggestions
const suggestions = await searchManager.getSuggestions('Joh');
```

### Custom Query Builder

```typescript
import { QueryBuilder } from '@/lib/database/query-builder';

const builder = new QueryBuilder();

const query = builder
  .select(['id', 'name', 'year'])
  .from('alumni')
  .where('name MATCH ?', ['John*'])
  .andWhere('year BETWEEN ? AND ?', [1980, 1990])
  .orderBy('relevance', 'DESC')
  .limit(50)
  .build();

const results = await db.execute(query);
```

### Offline Support

```typescript
import { OfflineSearchManager } from '@/lib/database/offline-search';

const offlineSearch = new OfflineSearchManager();

// Initialize offline database
await offlineSearch.initialize();

// Sync data when online
if (navigator.onLine) {
  await offlineSearch.sync();
}

// Search works offline
const results = await offlineSearch.search('query');
```

## Maintenance Guide

### Regular Maintenance Tasks

#### 1. Database Optimization

```bash
# Run monthly
npm run db:optimize

# Rebuild FTS5 index
npm run db:rebuild-index

# Vacuum database
npm run db:vacuum
```

#### 2. Clear Cache

```typescript
// Clear search cache
localStorage.removeItem('search-cache');
sessionStorage.clear();

// Clear service worker cache
if ('serviceWorker' in navigator) {
  const caches = await window.caches.keys();
  await Promise.all(caches.map(cache => window.caches.delete(cache)));
}
```

#### 3. Update Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit security
npm audit
npm audit fix
```

#### 4. Performance Monitoring

```typescript
// Add performance monitoring
import { PerformanceMonitor } from '@/lib/monitoring';

const monitor = new PerformanceMonitor();

monitor.trackSearch((metrics) => {
  console.log('Search Performance:', {
    queryTime: metrics.queryTime,
    renderTime: metrics.renderTime,
    totalTime: metrics.totalTime
  });
  
  if (metrics.totalTime > 500) {
    console.warn('Slow search detected');
  }
});
```

### Troubleshooting Common Issues

#### Issue: Slow Search Performance

**Diagnosis:**
```typescript
// Enable query logging
const searchManager = new SearchManager({ debug: true });

// Check index health
const indexStats = await searchManager.getIndexStats();
console.log('Index size:', indexStats.size);
console.log('Last optimized:', indexStats.lastOptimized);
```

**Solutions:**
1. Rebuild FTS5 index: `npm run db:rebuild-index`
2. Optimize database: `npm run db:optimize`
3. Check for large result sets and add pagination
4. Verify debounce is working (150ms delay)

#### Issue: Touch Targets Not Responding

**Diagnosis:**
```typescript
// Check touch event listeners
document.addEventListener('touchstart', (e) => {
  console.log('Touch detected:', e.touches[0]);
});

// Verify CSS pointer-events
const element = document.querySelector('.keyboard-key');
const styles = window.getComputedStyle(element);
console.log('pointer-events:', styles.pointerEvents);
```

**Solutions:**
1. Verify touch target size (minimum 44x44 pixels)
2. Check for overlapping elements with higher z-index
3. Ensure pointer-events is not set to 'none'
4. Test on actual touch device (not just mouse simulation)

#### Issue: Results Not Updating

**Diagnosis:**
```typescript
// Check state updates
useEffect(() => {
  console.log('Query changed:', query);
  console.log('Results:', results);
}, [query, results]);

// Verify search is being called
const handleSearch = async (query: string) => {
  console.log('Search called with:', query);
  const results = await searchDatabase(query);
  console.log('Results received:', results.length);
  return results;
};
```

**Solutions:**
1. Verify debounce is not blocking updates
2. Check for errors in console
3. Ensure state is being updated correctly
4. Clear browser cache and reload

#### Issue: Layout Shifting

**Diagnosis:**
```typescript
// Measure layout shifts
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'layout-shift') {
      console.log('Layout shift detected:', entry.value);
    }
  }
});

observer.observe({ entryTypes: ['layout-shift'] });
```

**Solutions:**
1. Add explicit dimensions to images and containers
2. Use skeleton loaders with fixed heights
3. Avoid inserting content above existing content
4. Use CSS containment: `contain: layout`

### Logging and Debugging

#### Enable Debug Mode

```typescript
// In development
localStorage.setItem('kiosk-search-debug', 'true');

// In component
const DEBUG = localStorage.getItem('kiosk-search-debug') === 'true';

if (DEBUG) {
  console.log('Search query:', query);
  console.log('Filters:', filters);
  console.log('Results:', results);
}
```

#### Custom Logger

```typescript
class SearchLogger {
  private logs: Array<{ timestamp: Date; event: string; data: any }> = [];

  log(event: string, data?: any) {
    this.logs.push({
      timestamp: new Date(),
      event,
      data
    });
    
    if (this.logs.length > 1000) {
      this.logs.shift(); // Keep last 1000 logs
    }
  }

  export() {
    return JSON.stringify(this.logs, null, 2);
  }

  clear() {
    this.logs = [];
  }
}

const logger = new SearchLogger();
logger.log('search_started', { query: 'John' });
logger.log('results_received', { count: 42 });
```

### Deployment Checklist

- [ ] Run all tests: `npm test`
- [ ] Check bundle size: `npm run build --analyze`
- [ ] Verify offline functionality
- [ ] Test on target devices (tablets, kiosks)
- [ ] Validate touch targets (44x44 minimum)
- [ ] Check accessibility with screen reader
- [ ] Verify performance metrics (< 150ms search)
- [ ] Test error handling and recovery
- [ ] Review console for warnings/errors
- [ ] Update documentation
- [ ] Tag release in version control
- [ ] Deploy to staging first
- [ ] Perform smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours

## API Reference

### SearchManager

```typescript
class SearchManager {
  constructor(options?: SearchOptions);
  
  search(query: string, filters?: FilterState): Promise<SearchResult[]>;
  getSuggestions(partial: string): Promise<string[]>;
  getIndexStats(): Promise<IndexStats>;
  optimize(): Promise<void>;
  rebuildIndex(): Promise<void>;
}
```

### FilterProcessor

```typescript
class FilterProcessor {
  applyFilters(results: SearchResult[], filters: FilterState): SearchResult[];
  validateFilters(filters: FilterState): boolean;
  getAvailableFilters(results: SearchResult[]): AvailableFilters;
}
```

### ResultFormatter

```typescript
class ResultFormatter {
  format(result: RawResult): SearchResult;
  formatBatch(results: RawResult[]): SearchResult[];
  highlight(text: string, query: string): string;
}
```

## Version History

### v1.0.0 (November 2025)
- Initial release
- Full-text search with SQLite FTS5
- Touch-optimized keyboard
- Filter panel with categories and year ranges
- Offline support
- Accessibility features
- Error handling and recovery

## Support and Resources

### Documentation
- [User Guide](./KIOSK_SEARCH_USER_GUIDE.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Code Examples
- See `src/components/kiosk/*Example.tsx` files for usage examples
- Check `src/__tests__/` for test examples

### Getting Help
- Check existing documentation first
- Review test files for usage patterns
- Check console for error messages
- Enable debug mode for detailed logging

---

Last Updated: November 2025
