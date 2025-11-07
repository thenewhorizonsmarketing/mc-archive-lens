# Search Functionality Testing Instructions

## How to Run the Tests

### Option 1: Automated Test Suite (Recommended)

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Navigate to the test page**:
   - Open your browser to: `http://localhost:8080/search-test`
   - Or click this link if the server is running: [Search Test Page](http://localhost:8080/search-test)

3. **Run the tests**:
   - Click the "Run All Tests" button
   - Watch as each test executes automatically
   - View the results summary showing passed/failed tests

4. **Review results**:
   - ✅ Green checkmarks = Test passed
   - ❌ Red X marks = Test failed
   - Each test shows:
     - Query used
     - Filters applied
     - Expected vs actual results
     - Names found
     - Error messages (if failed)

### Option 2: Manual Testing

#### Test 1: Search by First Name
1. Go to the home page or alumni page
2. Type "John" in the search box
3. **Expected**: Should find "John Smith"

#### Test 2: Search by Last Name
1. Type "Smith" in the search box
2. **Expected**: Should find "John Smith"

#### Test 3: Search by Full Name
1. Type "Sarah Johnson" in the search box
2. **Expected**: Should find "Sarah Johnson" with high relevance

#### Test 4: Search by Department
1. Type "Engineering" in the search box
2. **Expected**: Should find Sarah Johnson (Electrical Engineering) and possibly others

#### Test 5: Filter by Type
1. Click the "Filters" button
2. Select "Alumni" from the "Content Type" dropdown
3. **Expected**: Should show only alumni records (8 total)

#### Test 6: Name Filter
1. Open filters
2. Select "Alumni" type
3. Type "Johnson" in the "Name Search" field
4. **Expected**: Should find only "Sarah Johnson"

#### Test 7: Year Range Filter
1. Open filters
2. Select "Alumni" type
3. Adjust year range slider to 2015-2018
4. **Expected**: Should find 3 alumni (John Smith 2015, Michael Chen 2016, Sarah Johnson 2018)

#### Test 8: Combined Search and Filter
1. Type "Computer" in the search box
2. Open filters and select "Alumni" type
3. **Expected**: Should find "John Smith" (Computer Science)

#### Test 9: Partial Name Search
1. Type "Dav" in the search box
2. **Expected**: Should find "David Martinez"

#### Test 10: Department Filter
1. Open filters
2. Select "Alumni" type
3. Select "Law" from the Department dropdown (if available)
4. **Expected**: Should find "Emily Davis"

## Test Data Available

The system includes 8 test alumni records:

1. **John Smith** - Computer Science, Class of 2015
2. **Sarah Johnson** - Electrical Engineering, Class of 2018
3. **Michael Chen** - Business Administration, Class of 2016
4. **Emily Davis** - Law, Class of 2019
5. **David Martinez** - Medicine, Class of 2017
6. **Jennifer Lee** - Architecture, Class of 2020
7. **Robert Wilson** - Physics, Class of 2014
8. **Amanda Brown** - Psychology, Class of 2021

## Expected Test Results

All 10 tests should pass if the search functionality is working correctly:

- ✅ Name search (first, last, full name)
- ✅ Department search
- ✅ Type filtering
- ✅ Name filtering
- ✅ Year range filtering
- ✅ Combined search and filters
- ✅ Partial name matching
- ✅ Department filtering

## Troubleshooting

### If tests fail:

1. **Check browser console** for error messages
2. **Verify search system is initialized**:
   - Look for "System Status" section on test page
   - Should show "Initialized: Yes"
   - Should show "Error: None"

3. **Common issues**:
   - **"Search system not initialized"**: Wait a few seconds and try again
   - **"No results found"**: Check that mock data is loaded correctly
   - **Type errors**: Check browser console for TypeScript errors

### If manual testing doesn't work:

1. **Clear browser cache** and reload
2. **Check network tab** for failed requests
3. **Verify the SearchProvider** is wrapping the app in main.tsx
4. **Check console** for initialization errors

## Success Criteria

✅ **All tests pass** = Search functionality is working correctly
- Name search finds correct alumni
- Filters work independently and in combination
- Results are properly scored and sorted
- No errors in console

## Next Steps After Testing

Once all tests pass:
1. The search system is ready for integration with real data
2. Can replace mock data with actual database queries
3. Can add additional features like fuzzy matching, autocomplete, etc.

## Need Help?

If tests are failing or you encounter issues:
1. Check the browser console for detailed error messages
2. Review the SEARCH_IMPROVEMENTS.md file for implementation details
3. Verify all files were updated correctly
4. Check that the SearchProvider is properly configured in main.tsx
