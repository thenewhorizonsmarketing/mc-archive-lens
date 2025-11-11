# Kiosk Search User Guide

## Overview

The Fullscreen Kiosk Search Interface provides a touch-optimized search experience for finding alumni, publications, photos, and faculty information. This guide explains how to use all features of the search interface.

## Accessing the Search Interface

### From the Homepage

1. **Tap the Search Button**: Look for the prominent search button on the homepage
2. **Keyboard Shortcut**: Press `Ctrl+K` (Windows) or `Cmd+K` (Mac) to open search instantly
3. **Direct URL**: Navigate to `/search` in the browser

The search interface will open in fullscreen mode, providing an immersive search experience.

## Using the Search Interface

### Basic Search

1. **Enter Your Query**: Use the on-screen keyboard or physical keyboard to type your search terms
2. **Real-Time Results**: Results appear instantly as you type (after a brief 150ms delay)
3. **View Results**: Scroll through the results list to find what you're looking for
4. **Select a Result**: Tap any result card to view detailed information

### On-Screen Keyboard

The virtual keyboard is optimized for touch input:

- **Key Size**: Each key is 60x60 pixels for easy tapping
- **Layout**: Standard QWERTY layout with all letters and numbers
- **Special Keys**:
  - **BACK**: Delete the last character
  - **SPACE**: Add a space
  - **CLEAR**: Remove all text and start over
  - **ENTER**: Submit search (same as tapping a result)

**Visual Feedback**: Keys provide immediate visual feedback when tapped (50ms response time)

### Clearing Your Search

**Option 1: Clear Button**
- A clear button (X) appears in the search input when you have text
- Tap it to remove all text instantly

**Option 2: Clear Key**
- Use the CLEAR key on the virtual keyboard
- Removes all text and resets the search

### Filtering Results

The filter panel helps narrow down your search results:

#### Available Filters

**By Category**:
- Alumni
- Publications
- Photos
- Faculty

**By Year Range**:
- Use the year slider to select a specific time period
- Drag the start and end points to adjust the range

**By Decade**:
- Quick filters for 1950s, 1960s, 1970s, etc.
- Tap a decade to filter results

**By Publication Type** (for publications):
- Law Review
- Amicus
- Legal Eye
- Other publication types

#### Using Filters

1. **Open Filter Panel**: Tap the filter icon or "Filters" button
2. **Select Filters**: Tap any filter option to activate it
3. **Active Filters**: Selected filters are highlighted with distinct styling
4. **Filter Badge**: A number badge shows how many filters are active
5. **Clear All**: Tap "Clear All" to remove all active filters at once

**Filter Behavior**:
- Filters apply immediately when selected
- Results update in real-time
- Multiple filters can be active simultaneously
- Filters work together (AND logic)

### Understanding Results

Each result card displays:

- **Thumbnail**: Visual preview (if available)
- **Title**: Primary information (name, publication title, etc.)
- **Subtitle**: Secondary information (year, department, etc.)
- **Type Badge**: Category indicator (Alumni, Publication, Photo, Faculty)
- **Relevance**: Results are sorted by relevance to your query

**Result States**:
- **Loading**: Skeleton loaders appear while searching
- **No Results**: Helpful message with suggestions if nothing matches
- **Error**: Clear error message with retry option if something goes wrong

### Navigating Results

1. **Scroll**: Swipe up/down to browse through results
2. **Tap to View**: Tap any result card to view full details
3. **Smooth Transition**: 300ms animation when navigating to details
4. **Back Navigation**: Use the back button to return to search with your query preserved

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open search interface |
| `Escape` | Close search interface |
| `Enter` | Select first result (if available) |
| `Tab` | Navigate between interface elements |

## Closing the Search Interface

**Option 1: Close Button**
- Tap the X button in the top-right corner (60x60 pixels)

**Option 2: Escape Key**
- Press the `Escape` key on a physical keyboard

**Option 3: Browser Back**
- Use the browser's back button

The interface will smoothly transition back to the previous page (300ms animation).

## Tips for Best Results

### Search Tips

1. **Be Specific**: More specific queries return more relevant results
   - Good: "John Smith 1985"
   - Less Good: "Smith"

2. **Use Full Names**: Search by first and last name for alumni
   - Example: "Mary Johnson"

3. **Include Years**: Add graduation years to narrow results
   - Example: "Class of 1990"

4. **Try Variations**: If you don't find what you're looking for, try:
   - Different spellings
   - Nicknames vs. formal names
   - Partial names

### Filter Tips

1. **Start Broad**: Begin with category filters, then narrow with year ranges
2. **Combine Filters**: Use multiple filters together for precise results
3. **Clear and Retry**: If results are too narrow, clear filters and try again

### Performance Tips

1. **Wait for Results**: Allow 150ms for search to complete after typing
2. **Scroll Smoothly**: Use gentle swipes for best scrolling performance
3. **One Tap**: Tap once and wait for response (50ms feedback time)

## Troubleshooting

### No Results Found

**Possible Causes**:
- Query is too specific
- Spelling errors
- Filters are too restrictive
- Information not in database

**Solutions**:
1. Clear all filters and try again
2. Try broader search terms
3. Check spelling
4. Try searching by category only

### Search Not Responding

**Possible Causes**:
- Database temporarily unavailable
- System overload
- Browser issue

**Solutions**:
1. Wait 3 seconds for automatic retry
2. Tap "Try Again" button if it appears
3. Close and reopen search interface
4. Refresh the page
5. Contact administrator if problem persists

### Keyboard Not Working

**Possible Causes**:
- Touch input not detected
- Browser compatibility issue
- Screen calibration needed

**Solutions**:
1. Try tapping keys more firmly
2. Use physical keyboard instead
3. Close and reopen search interface
4. Contact administrator for screen calibration

### Results Not Loading

**Possible Causes**:
- Network issue (shouldn't affect offline kiosk)
- Database connection problem
- Query error

**Solutions**:
1. System will automatically retry (max 3 attempts)
2. Last successful results will be displayed
3. Tap "Try Again" if manual retry is needed
4. Clear search and start over
5. Return to home and try again

### Layout Shifting

**Possible Causes**:
- Browser zoom enabled
- Screen resolution issue
- CSS not loaded properly

**Solutions**:
1. Reset browser zoom to 100%
2. Refresh the page
3. Contact administrator if problem persists

### Slow Performance

**Expected Performance**:
- Search query response: < 150ms
- Key press feedback: < 50ms
- Result rendering: < 200ms
- Navigation transition: 300ms

**If Slower**:
1. Close other applications
2. Restart the kiosk application
3. Contact administrator for system check

## Accessibility Features

### Keyboard Navigation

- **Tab**: Move between interactive elements
- **Enter**: Activate buttons and select results
- **Escape**: Close search interface
- **Arrow Keys**: Navigate through results

### Screen Reader Support

- All interactive elements have ARIA labels
- Search status is announced
- Result count is announced
- Error messages are announced

### High Contrast

- Interface uses high contrast colors for readability
- MC Law brand colors (Navy #0C2340, Gold #C99700)
- Clear visual feedback for all interactions

### Touch Targets

- All buttons are minimum 44x44 pixels
- Keyboard keys are 60x60 pixels
- 8 pixels spacing between interactive elements
- Large tap areas for easy interaction

## Privacy and Data

### What Gets Stored

- Search queries are logged for analytics (anonymous)
- Filter preferences are not saved between sessions
- No personal information is collected

### What Doesn't Get Stored

- Individual user identity
- Browsing history
- Personal preferences

### Data Security

- All data is stored locally on the kiosk
- No network transmission of search queries
- Offline operation ensures privacy

## Getting Help

### For Users

If you encounter issues:
1. Try the troubleshooting steps above
2. Use the "Return to Home" button
3. Ask kiosk staff for assistance

### For Administrators

See the [Developer Documentation](./KIOSK_SEARCH_DEVELOPER_GUIDE.md) and [Troubleshooting Guide](./TROUBLESHOOTING.md) for technical support.

## Frequently Asked Questions

### Q: Why don't I see recent alumni?

**A**: The database is updated periodically. Contact the administrator to request updates.

### Q: Can I search for multiple people at once?

**A**: No, search for one person at a time for best results.

### Q: How do I print results?

**A**: The kiosk interface doesn't support printing. Note the information and contact the office for printed materials.

### Q: Can I save my search?

**A**: Searches are not saved. The interface is designed for quick, one-time lookups.

### Q: Why is the keyboard always visible?

**A**: The keyboard is always visible for easy access on touch-only kiosks without physical keyboards.

### Q: Can I use voice search?

**A**: Voice search is not currently available but may be added in future updates.

### Q: What if I find incorrect information?

**A**: Contact the MC Law administration to report data corrections.

## Version Information

- **Interface Version**: 1.0
- **Last Updated**: November 2025
- **Compatibility**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

For technical documentation, see [Developer Guide](./KIOSK_SEARCH_DEVELOPER_GUIDE.md)
