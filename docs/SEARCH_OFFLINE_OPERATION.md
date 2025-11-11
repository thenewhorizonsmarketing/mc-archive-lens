# Search Interface Offline Operation Guide

## Overview

The Fullscreen Kiosk Search Interface is designed to operate **100% offline** with no external network requests. This document describes the offline operation implementation specific to the search functionality.

**Requirements**: 6.1, 6.2, 6.3, 6.4, 6.5 - Search System SHALL operate entirely offline

## Implementation

### 1. Local SQLite Database

#### Database Initialization (Requirement 6.1)

The search system uses SQL.js, a JavaScript implementation of SQLite that runs entirely in the browser:

```typescript
// src/lib/database/manager.ts
private async initializeSQL(): Promise<void> {
  this.SQL = await initSqlJs({
    // Load the wasm file from local bundle (offline)
    locateFile: (file: string) => {
      return `/node_modules/sql.js/dist/${file}`;
    }
  });
}
```

**Key Features**:
- No server connection required
- Database runs in browser memory
- WASM file bundled with application
- Automatic initialization on app start

#### Database Access (Requirement 6.2)

All search queries execute against the local SQLite database:

```typescript
// src/lib/database/search-manager.ts
async searchAll(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
  await this.ensureConnection();
  
  // Execute FTS5 search locally
  const results = await searchManager.searchAll(query, filters, {
    limit: maxResults,
    sortBy: 'relevance'
  });
  
  return results;
}
```

**Search Capabilities**:
- Full-text search (FTS5)
- Filtered search by category
- Relevance ranking
- Result caching
- No network dependency

### 2. Offline Error Handling (Requirement 6.3)

#### Error Detection

The search interface detects and handles offline-related errors:

```typescript
// src/components/kiosk/KioskSearchInterface.tsx
catch (error) {
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'Search failed. Please try again.';

  const isFTS5Error = errorMessage.includes('FTS5') || 
                     errorMessage.includes('fts_');
  
  const isTransientError = errorMessage.includes('timeout') || 
                          errorMessage.includes('network');

  // Handle appropriately
  if (isFTS5Error && fallbackSearchManager) {
    await executeFallbackSearch(query, filters);
  }
}
```

#### Error Messages (Requirement 6.3)

Appropriate messaging for offline scenarios:

- **Database initialization**: "Initializing search database..."
- **FTS5 unavailable**: "Using simplified search mode"
- **Transient errors**: Automatic retry with visual feedback
- **No network errors**: System operates without network checks

### 3. Fallback Search (Requirement 6.5)

#### Graceful Degradation

When FTS5 is unavailable, the system falls back to LIKE queries:

```typescript
// src/lib/database/fallback-search.ts
async searchAll(query: string, options?: SearchOptions): Promise<SearchResult[]> {
  const searchTerm = `%${query}%`;
  
  // Use simple LIKE queries instead of FTS5
  const sql = `
    SELECT *, 1.0 as relevance_score 
    FROM alumni 
    WHERE full_name LIKE ? OR caption LIKE ? OR tags LIKE ?
    ORDER BY full_name
    LIMIT ?
  `;
  
  return this.dbManager.executeQuery(sql, [searchTerm, searchTerm, searchTerm, limit]);
}
```

**Fallback Features**:
- Automatic detection of FTS5 errors
- Seamless switch to LIKE queries
- Visual indicator for users
- Logging for monitoring
- No functionality loss

#### Fallback Indicator

Users are informed when fallback mode is active:

```typescript
{state.usingFallback && (
  <p className="text-xs text-amber-600">
    Using simplified search mode
  </p>
)}
```

### 4. Asset Bundling (Requirement 6.4)

#### SQL.js WASM File

The SQL.js WebAssembly file is bundled locally:

```typescript
// vite.config.ts
{
  name: 'copy-sql-wasm',
  closeBundle() {
    const wasmSrc = 'node_modules/sql.js/dist/sql-wasm.wasm';
    const wasmDest = 'dist/node_modules/sql.js/dist/sql-wasm.wasm';
    
    fs.mkdirSync(path.dirname(wasmDest), { recursive: true });
    fs.copyFileSync(wasmSrc, wasmDest);
  }
}
```

#### Search Interface Assets

All search UI assets are bundled:

- **Styles**: `src/styles/*.css`
- **Components**: `src/components/kiosk/*.tsx`
- **Icons**: Lucide React (bundled)
- **Fonts**: System fonts or bundled web fonts

### 5. Network Blocker Integration

The search interface respects the global network blocker:

```typescript
// src/main.tsx
import { initializeNetworkBlocker } from '@/lib/utils/network-blocker';

// Block all external network requests
initializeNetworkBlocker();
```

**Blocked Operations**:
- External API calls
- CDN requests
- Analytics tracking
- Remote font loading
- External image loading

**Allowed Operations**:
- Local file access
- Data URLs
- Blob URLs
- Relative URLs
- Localhost (development only)

### 6. Search Result Caching

Results are cached locally to improve performance:

```typescript
// src/components/kiosk/KioskSearchInterface.tsx
const resultsCacheRef = useRef<Map<string, { results: SearchResult[]; timestamp: number }>>(
  new Map()
);

const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const getCachedResults = (cacheKey: string): SearchResult[] | null => {
  const cached = resultsCacheRef.current.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.results;
  }
  return null;
};
```

**Cache Benefits**:
- Instant results for repeated searches
- Reduced database queries
- Better performance
- No network dependency

## Testing

### Automated Tests

Run the search offline operation test suite:

```bash
npm run test:e2e -- search-offline-operation.test.ts
```

**Test Coverage**:
- ✓ Database initialization offline
- ✓ Search query execution offline
- ✓ Local database result loading
- ✓ No network error messages
- ✓ Local asset loading
- ✓ Database initialization handling
- ✓ Fallback search activation
- ✓ Result caching
- ✓ Keyboard input offline
- ✓ Filter operations offline
- ✓ Error recovery
- ✓ State maintenance
- ✓ Operation logging

### Manual Testing

#### Test Search Offline

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser DevTools → Network tab

3. Set "Offline" mode in DevTools

4. Navigate to `/search`

5. Verify:
   - Search interface loads
   - Database initializes
   - Search queries execute
   - Results display
   - No network errors

#### Test in Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Package for Electron:
   ```bash
   npm run build:electron
   ```

3. Install and run the packaged application

4. Disconnect from network

5. Test all search functionality:
   - Text input
   - Virtual keyboard
   - Filters
   - Result selection
   - Error handling

### Validation Script

Run the comprehensive offline validation:

```bash
node scripts/validate-offline-operation.js
```

This validates:
- Network blocker implementation
- Electron configuration
- Asset bundling
- Dependencies
- Content Security Policy

## Monitoring

### Console Logging

Search operations are logged for debugging:

```typescript
console.log(`[KioskSearch] Search completed in ${queryTime}ms, found ${results.length} results`);
console.log('[KioskSearch] FTS5 error detected, switching to fallback search');
console.log('[KioskSearch] Fallback search completed in ${queryTime}ms');
```

### Fallback Usage Tracking

Fallback search usage is logged to localStorage:

```typescript
const logEntry = {
  timestamp: new Date().toISOString(),
  query,
  resultCount,
  queryTime,
  context: 'kiosk-search'
};

localStorage.setItem('fallbackSearchLogs', JSON.stringify(recentLogs));
```

### Performance Metrics

Search performance is tracked:

```typescript
const startTime = performance.now();
const results = await searchManager.searchAll(query, filters);
const endTime = performance.now();
const queryTime = Math.round(endTime - startTime);

console.log(`Search completed in ${queryTime}ms`);
```

## Troubleshooting

### Issue: Search interface fails to load

**Cause**: Database initialization failed

**Solution**:
1. Check browser console for errors
2. Verify SQL.js WASM file is bundled
3. Check `dist/node_modules/sql.js/dist/sql-wasm.wasm` exists
4. Rebuild the application

### Issue: Search returns no results

**Cause**: Database not populated or FTS5 error

**Solution**:
1. Check if database has data (Admin Panel → Statistics)
2. Import CSV data if needed
3. Check for FTS5 errors in console
4. Verify fallback search activates

### Issue: "Using simplified search mode" appears

**Cause**: FTS5 unavailable, fallback active

**Solution**:
- This is expected behavior
- Fallback search provides basic functionality
- Check console for FTS5 error details
- Rebuild FTS5 indexes if needed

### Issue: Search is slow

**Cause**: Large dataset or no caching

**Solution**:
1. Check result cache is working
2. Verify database indexes exist
3. Limit result count
4. Use filters to narrow search

### Issue: Virtual keyboard not working

**Cause**: Component not loaded or event handlers broken

**Solution**:
1. Check browser console for errors
2. Verify TouchKeyboard component loaded
3. Check event handlers are attached
4. Test with physical keyboard

## Best Practices

### 1. Database Management

- Initialize database on app start
- Handle initialization errors gracefully
- Provide loading indicators
- Cache frequently accessed data

### 2. Error Handling

- Detect offline-specific errors
- Provide clear user messaging
- Implement automatic retry
- Use fallback mechanisms

### 3. Performance

- Cache search results
- Debounce search input (150ms)
- Limit result count
- Use indexes for queries

### 4. User Experience

- Show loading states
- Provide error recovery options
- Indicate fallback mode
- Maintain search state

### 5. Testing

- Test with network disabled
- Verify all assets load locally
- Check error handling
- Validate fallback search

## Compliance

This implementation satisfies:

- **Requirement 6.1**: Search System SHALL access local SQLite database offline
- **Requirement 6.2**: Search System SHALL execute queries without network connection
- **Requirement 6.3**: Search System SHALL handle offline state gracefully
- **Requirement 6.4**: Search System SHALL load all assets from local storage
- **Requirement 6.5**: Search System SHALL provide appropriate offline messaging

## References

- Search Interface: `src/components/kiosk/KioskSearchInterface.tsx`
- Database Manager: `src/lib/database/manager.ts`
- Search Manager: `src/lib/database/search-manager.ts`
- Fallback Search: `src/lib/database/fallback-search.ts`
- Network Blocker: `src/lib/utils/network-blocker.ts`
- Test Suite: `src/__tests__/e2e/search-offline-operation.test.ts`
- General Offline Docs: `docs/OFFLINE_OPERATION.md`

---

**Last Updated**: 2025-01-10
**Status**: ✓ Complete
**Requirements**: 6.1, 6.2, 6.3, 6.4, 6.5
