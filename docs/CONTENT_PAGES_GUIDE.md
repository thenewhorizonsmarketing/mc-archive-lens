# Content Pages User Guide

## Overview

The application provides four main content browsing pages that allow you to explore the database:

1. **Alumni Room** - Browse alumni records by graduation year, department, and more
2. **Publications Room** - Explore academic publications, journals, and documents
3. **Photos Room** - View historical photographs organized by collection and year
4. **Faculty Room** - Learn about faculty members and their specializations

All content pages share a consistent interface and provide powerful search and filtering capabilities.

## Getting Started

### Accessing Content Pages

From the home page, click on any of the four room cards to enter that content area:
- Click "Alumni" to browse alumni records
- Click "Publications" to explore publications
- Click "Photos" to view photo collections
- Click "Faculty" to see faculty information

### Navigation

- **Home Button**: Return to the main board at any time
- **Back Button**: Use your browser's back button to return to previous views
- **Direct Links**: Share URLs to specific records with others

## Browsing Content

### Grid and List Views

Content is displayed in an easy-to-browse format:
- **Alumni**: Grid view with photos and names
- **Publications**: List view with titles, authors, and years
- **Photos**: Masonry grid layout for optimal photo display
- **Faculty**: Grid view with headshots and titles

### Pagination

- Navigate through pages using the pagination controls at the bottom
- Page numbers show your current position
- Use "Previous" and "Next" buttons for quick navigation
- The system automatically preloads the next page for smooth browsing

## Searching and Filtering

### Search Bar

Each content page includes a search bar at the top:
- Type your search query to filter results in real-time
- Search is debounced (waits 300ms after you stop typing)
- Search looks through all relevant fields (names, titles, descriptions, etc.)
- Clear the search by clicking the X button or deleting all text

### Filter Panel

The filter panel on the left provides content-specific filters:

#### Alumni Filters
- **Year Range**: Filter by graduation year or year range
- **Department**: Select specific departments or schools
- **Class Role**: Filter by class positions or honors

#### Publications Filters
- **Year**: Filter by publication year
- **Publication Type**: Journal, book, article, etc.
- **Department**: Filter by academic department

#### Photos Filters
- **Year**: Filter by photo year
- **Collection**: Browse specific photo collections
- **Event Type**: Filter by event categories

#### Faculty Filters
- **Department**: Filter by academic department
- **Position**: Filter by faculty position or title

### Clearing Filters

- Click "Clear Filters" to reset all filters to default
- Individual filters can be cleared by deselecting options
- Clearing filters returns you to page 1 with all results

## Viewing Details

### Opening Record Details

Click on any record card to view full details:
- **Alumni**: See full bio, graduation year, department, and photo
- **Publications**: View complete metadata and PDF preview (if available)
- **Photos**: See full-size image with caption and metadata
- **Faculty**: View contact information, specialization, and bio

### Detail View Navigation

When viewing a record detail:
- **Close**: Click the X button or press Escape to close
- **Previous/Next**: Use arrow buttons or keyboard arrows to navigate between records
- **Keyboard Shortcuts**:
  - `Escape` - Close detail view
  - `←` Left Arrow - Previous record
  - `→` Right Arrow - Next record

## Deep Linking and Sharing

### URL Parameters

The application automatically updates the URL as you browse:
- Filters are saved in the URL
- Search queries are preserved
- Current page is tracked
- Selected records are included

### Sharing Links

You can share direct links to:
- **Specific Records**: Share a link that opens directly to a record detail
- **Filtered Views**: Share a link with specific filters applied
- **Search Results**: Share a link with a search query active

Example URLs:
```
/alumni?year=1980&department=Law
/publications?q=constitutional&publicationType=journal
/photos?id=photo_123
/faculty?department=Business&page=2
```

### Browser Navigation

- **Back/Forward**: Browser buttons work as expected
- **Bookmarks**: Bookmark any view to return to it later
- **History**: Your browsing history is preserved

## Performance Features

### Caching

The application caches search results for better performance:
- Recently viewed data loads instantly
- Cache expires after 5 minutes
- Manual refresh bypasses cache
- Cached data is used as fallback during errors

### Preloading

The system automatically preloads content for smooth browsing:
- Next page is preloaded when you're 80% through the current page
- Images are preloaded in the background
- Reduces wait time when navigating

### Lazy Loading

Images are loaded efficiently:
- Thumbnails load as you scroll
- Full-size images load on demand
- Placeholder images show while loading
- Optimized image sizes for performance

## Error Handling

### Connection Issues

If the database connection fails:
- An error message is displayed
- Cached data is shown if available
- Retry button allows manual retry
- Automatic retry with exponential backoff (up to 3 attempts)

### Empty Results

When no records match your criteria:
- A helpful message is displayed
- Suggestions to adjust filters or search
- "Clear Filters" button to reset

### Invalid Record IDs

If you navigate to an invalid record:
- Error message is displayed
- You're returned to the main list view
- Invalid ID is removed from URL

## Accessibility Features

### Keyboard Navigation

All features are accessible via keyboard:
- `Tab` - Navigate between interactive elements
- `Enter` - Select records or activate buttons
- `Escape` - Close modals and detail views
- `Arrow Keys` - Navigate pagination and records
- `Space` - Activate buttons and checkboxes

### Screen Reader Support

The application is fully compatible with screen readers:
- All images have alternative text
- Form controls have proper labels
- Dynamic updates are announced
- ARIA live regions for status updates
- Semantic HTML structure

### Visual Accessibility

- High contrast mode support
- Clear focus indicators on all interactive elements
- Sufficient color contrast ratios (WCAG AA compliant)
- Scalable text and UI elements
- Reduced motion support for animations

## Tips and Best Practices

### Efficient Searching

1. **Start Broad**: Begin with general searches, then refine with filters
2. **Use Filters**: Combine search with filters for precise results
3. **Year Ranges**: Use year filters to narrow down large result sets
4. **Clear Between Searches**: Clear filters when switching search topics

### Browsing Large Collections

1. **Use Pagination**: Don't try to scroll through everything at once
2. **Filter First**: Apply filters before browsing to reduce result count
3. **Bookmark Views**: Save useful filter combinations as bookmarks
4. **Share Links**: Use URL sharing to return to specific views

### Performance Tips

1. **Let It Load**: Wait for initial page load before interacting
2. **Smooth Scrolling**: Scroll smoothly to trigger preloading
3. **Refresh Sparingly**: Only refresh when you need fresh data
4. **Close Details**: Close detail views when done to free memory

## Troubleshooting

### Content Not Loading

1. Check your internet connection
2. Try refreshing the page (F5 or Cmd+R)
3. Clear your browser cache
4. Check the admin panel for database status

### Search Not Working

1. Ensure the database is initialized (check loading indicator)
2. Try clearing filters and searching again
3. Check for typos in your search query
4. Try a broader search term

### Filters Not Applying

1. Click "Apply" or wait for debounce delay
2. Check that you've selected valid filter options
3. Try clearing all filters and reapplying
4. Refresh the page if filters seem stuck

### Images Not Displaying

1. Check that image files exist in the correct directory
2. Verify image paths in the database
3. Check browser console for 404 errors
4. Try refreshing the page

## Technical Details

### Data Sources

- **Database**: SQLite with FTS5 full-text search
- **Search Engine**: BrowserSearchManager with query optimization
- **Cache**: In-memory cache with 5-minute expiration
- **Images**: Lazy-loaded from public directory

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance Metrics

- Initial load: < 500ms
- Filter updates: < 200ms
- Page navigation: < 100ms
- Search debounce: 300ms

## Support

For technical issues or questions:
1. Check the troubleshooting section above
2. Review the developer guide in `docs/CONTENT_PAGES_DEVELOPER_GUIDE.md`
3. Check the admin panel for system status
4. Review browser console for error messages
