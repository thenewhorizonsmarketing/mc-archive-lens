# Fullscreen Search Testing Guide

## Quick Start

The development server is running at: **http://localhost:8080/**

## What Changed

The fullscreen search now uses the **real SQLite FTS5 search** instead of mock data. This means:
- Search results will be consistent with the rest of the app
- All alumni from the CSV file are searchable
- Performance is optimized with FTS5 indexes
- Works completely offline

## Testing Steps

### 1. Open the Application
1. Navigate to http://localhost:8080/
2. Open browser DevTools (F12) and check Console tab
3. Look for initialization messages

### 2. Open Fullscreen Search
1. Click the search button on the homepage
2. The fullscreen search interface should appear
3. Check console for: `[SearchContext] Initializing real SearchManager with SQLite FTS5...`
4. Wait for: `[SearchContext] Search initialization complete`

### 3. Test Search Functionality
Try these searches:
- **"John"** - Should return alumni with "John" in their name
- **"Smith"** - Should return alumni with "Smith" in their name
- **"2015"** - Should return alumni from class of 2015
- **"Computer Science"** - Should return CS alumni

### 4. Verify Results
Check that results:
- Appear quickly (< 150ms)
- Show real alumni data (not mock data like "John Smith, Class of 2015")
- Include thumbnails if available
- Display correct metadata (year, role, etc.)

### 5. Test Result Selection
1. Click on any search result
2. Should navigate to `/alumni` page
3. Detail dialog should open with the correct person
4. Photo should display correctly

### 6. Test Error Handling
The search should handle errors gracefully:
- If database fails to initialize, error message appears
- Retry button should be available
- Last successful results should remain visible

## What to Look For

### ✅ Good Signs
- Console shows: `[SearchContext] Initializing real SearchManager with SQLite FTS5...`
- Console shows: `[SearchContext] Search initialization complete`
- Search results appear quickly
- Results show real alumni data from your CSV
- No console errors

### ❌ Warning Signs
- Console shows: `Failed to initialize search`
- No search results appear
- Results show mock data (e.g., "John Smith, Software Engineer at Google")
- Console errors about database connection

## Console Messages to Expect

### On App Load
```
[SearchContext] Initializing real SearchManager with SQLite FTS5...
[SearchContext] Testing search functionality...
[SearchContext] Search initialization complete
```

### On Search
```
[SearchInterface] Search query: "john"
[SearchManager] Executing FTS5 query...
[SearchManager] Found X results in Yms
```

### On Result Click
```
[FullscreenSearch] handleResultSelect called with: {...}
[FullscreenSearch] Stored selection in sessionStorage: {...}
[FullscreenSearch] Navigating to /alumni...
```

## Troubleshooting

### Issue: "Database not initialized" error
**Solution**: Check that sql.js wasm file is accessible at `/node_modules/sql.js/dist/`

### Issue: No search results
**Solution**: 
1. Check console for errors
2. Verify CSV file is loaded
3. Try the recovery button if available

### Issue: Mock data still appearing
**Solution**: This shouldn't happen anymore - the mock data files were deleted. If you see this, clear browser cache and reload.

### Issue: Search is slow
**Solution**: 
1. Check if database is still initializing
2. Verify FTS5 indexes are created
3. Check browser DevTools Performance tab

## Performance Benchmarks

Expected performance:
- **Database initialization**: < 2 seconds
- **Search query**: < 150ms
- **Result rendering**: < 200ms
- **Total search time**: < 350ms

## Browser DevTools Tips

### Console Tab
- Filter by "SearchContext" to see initialization
- Filter by "SearchInterface" to see search queries
- Filter by "SearchManager" to see database operations

### Network Tab
- Should see NO network requests during search (offline operation)
- Only initial page load and assets

### Performance Tab
- Record a search operation
- Check for layout shifts (should be minimal)
- Verify no memory leaks

### Application Tab
- Check sessionStorage for search selections
- Verify no unnecessary data stored

## Success Criteria

The integration is successful if:
- ✅ Search initializes without errors
- ✅ Results appear from real database
- ✅ Search is fast (< 150ms)
- ✅ Result selection works correctly
- ✅ No console errors
- ✅ Works offline
- ✅ Memory usage is stable

## Next Steps After Testing

If everything works:
1. Test with various search queries
2. Verify all alumni are searchable
3. Check performance on slower devices
4. Test in different browsers
5. Verify offline operation

If issues found:
1. Note the specific error messages
2. Check browser console for details
3. Try the recovery mechanism
4. Report issues for fixing
