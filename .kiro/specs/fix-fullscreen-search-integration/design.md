# Design Document: Fullscreen Search Integration

## Overview

This design addresses the integration of the fullscreen search interface with the existing SQLite FTS5 search infrastructure. Currently, the fullscreen search uses a separate `BrowserSearchManager` with mock data, while the rest of the application uses the optimized `SearchManager` with FTS5 indexes. This creates inconsistency and prevents users from accessing the full search capabilities.

## Current Architecture Issues

### Problem 1: Duplicate Search Systems
- `FullscreenSearchPage` uses `SearchInterface` component
- `SearchInterface` expects a `SearchManager` instance
- `SearchContext` provides `BrowserSearchManager` instead of real `SearchManager`
- Results are inconsistent with the rest of the application

### Problem 2: Mock Data vs Real Data
- `BrowserSearchManager` loads from `/sample-alumni.csv` with limited parsing
- Real application uses SQLite database with FTS5 indexes
- Search results don't match between fullscreen and other views

### Problem 3: Missing Integration
- `FullscreenSearchPage` doesn't use the existing `useSearch()` hook properly
- `SearchInterface` component is designed for the kiosk but doesn't integrate with real search

## Proposed Solution

### Architecture Changes

```
┌─────────────────────────────────────────┐
│     FullscreenSearchPage Component      │
│  - Uses useSearch() hook from context   │
│  - Passes searchManager to interface    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│        SearchContext Provider           │
│  - Initializes real SearchManager       │
│  - Provides to all components           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      SearchInterface Component          │
│  - Accepts SearchManager prop           │
│  - Uses searchAll() method              │
│  - Displays real FTS5 results           │
└─────────────────────────────────────────┘
```

### Component Updates

#### 1. Update SearchContext
- Remove `BrowserSearchManager` and `BrowserDatabaseManager`
- Use the existing `SearchManager` from `src/lib/database/search-manager.ts`
- Initialize with proper database connection
- Provide real FTS5 search capabilities

#### 2. Update FullscreenSearchPage
- Already uses `useSearch()` hook correctly
- Passes `searchManager` to `SearchInterface`
- No changes needed - it's already designed correctly!

#### 3. Update SearchInterface Component
- Currently expects `SearchManager` prop
- Change to use `useSearch()` hook instead
- Remove prop requirement for better integration
- Use context-provided search manager

#### 4. Remove Browser-Specific Managers
- Delete or deprecate `BrowserSearchManager`
- Delete or deprecate `BrowserDatabaseManager`
- These are no longer needed with proper integration

## Data Flow

### Search Query Flow
1. User types in fullscreen search input
2. `SearchInterface` debounces input (150ms)
3. Calls `searchManager.searchAll(query, filters, options)`
4. `SearchManager` queries SQLite FTS5 indexes
5. Results formatted and returned
6. `SearchInterface` displays results
7. User selects result → navigates to detail page

### Initialization Flow
1. App starts → `SearchProvider` mounts
2. `SearchProvider` initializes `DatabaseManager`
3. `DatabaseManager` loads SQLite database
4. `SearchManager` creates FTS5 indexes
5. Search becomes available to all components
6. Fullscreen search uses same manager

## Error Handling

### Database Initialization Errors
- Display loading state while initializing
- Show error message if database fails to load
- Provide retry button
- Fall back to graceful degradation

### Search Query Errors
- Catch FTS5 query errors
- Display last successful results
- Show error notification
- Provide manual retry option

### Offline Operation
- Database is local, no network needed
- All operations work offline
- No special handling required

## Performance Considerations

### Search Performance
- FTS5 indexes provide sub-100ms queries
- Results cached for 5 minutes
- Debouncing prevents excessive queries
- Limit results to 50 items

### Memory Management
- Single SearchManager instance shared
- Cache size limited to 100 entries
- Old cache entries cleaned automatically
- No memory leaks from duplicate managers

## Testing Strategy

### Integration Tests
- Test fullscreen search with real database
- Verify results match other search views
- Test navigation from search results
- Verify offline operation

### Component Tests
- Test SearchInterface with real SearchManager
- Test error handling and recovery
- Test result selection and navigation
- Test filter application

### End-to-End Tests
- Search for known alumni names
- Verify correct results displayed
- Click result and verify navigation
- Verify detail page opens correctly

## Migration Path

### Phase 1: Update SearchContext
1. Import real `SearchManager` and `DatabaseManager`
2. Replace `BrowserSearchManager` initialization
3. Test that search context provides real manager
4. Verify no breaking changes to existing components

### Phase 2: Update SearchInterface
1. Change from prop-based to hook-based search manager
2. Remove `searchManager` prop requirement
3. Use `useSearch()` hook internally
4. Test with fullscreen search page

### Phase 3: Clean Up
1. Remove `BrowserSearchManager` file
2. Remove `BrowserDatabaseManager` file
3. Update imports throughout codebase
4. Remove unused mock data code

### Phase 4: Testing
1. Run integration tests
2. Test fullscreen search end-to-end
3. Verify performance metrics
4. Test offline operation

## Rollback Plan

If issues arise:
1. Revert SearchContext changes
2. Restore BrowserSearchManager temporarily
3. Fix issues in development
4. Re-deploy with fixes

## Success Criteria

- Fullscreen search returns same results as other views
- Search performance < 150ms for typical queries
- No mock data used in production
- All tests passing
- Offline operation verified
- Memory usage stable
