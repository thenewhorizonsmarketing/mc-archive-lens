# Flipbook Integration Testing Checklist

Quick reference checklist for manual testing of the flipbook integration feature.

## Pre-Testing Setup

- [ ] Sample flipbook placed in `public/flipbooks/test-publication/`
- [ ] Test publication record added to database with flipbook_path
- [ ] Test publication with both flipbook and PDF added
- [ ] Application running (dev or production mode)
- [ ] Browser DevTools open for debugging

## Core Functionality Tests

### Basic Operations
- [ ] Can navigate to Publications Room
- [ ] Can search for test publication
- [ ] Can open publication RecordDetail
- [ ] "View Flipbook" button is visible
- [ ] Can click "View Flipbook" button
- [ ] Flipbook opens in fullscreen
- [ ] Flipbook content loads correctly
- [ ] Can close flipbook with Close button
- [ ] Can close flipbook with Escape key
- [ ] Returns to RecordDetail after closing

### Viewing Options
- [ ] Flipbook-only publication shows only "View Flipbook" button
- [ ] PDF-only publication shows only "View PDF" button
- [ ] Publication with both shows both buttons
- [ ] Can switch between flipbook and PDF viewers
- [ ] No viewer available message shown when neither exists

### Loading States
- [ ] Loading indicator appears when opening flipbook
- [ ] Progress bar is visible during load
- [ ] Loading messages update during progress
- [ ] Loading indicator disappears when loaded
- [ ] Flipbook content is visible after load

## Error Handling Tests

### Invalid Paths
- [ ] Invalid flipbook_path shows error message
- [ ] Error message is user-friendly
- [ ] Can close error and return to list
- [ ] No application crash on invalid path

### Load Failures
- [ ] Non-existent flipbook file shows error
- [ ] Error message explains the issue
- [ ] Timeout error appears after 30 seconds
- [ ] Can recover from load failure

### PDF Fallback
- [ ] "View PDF Instead" button shown when PDF available
- [ ] Can click fallback button to open PDF
- [ ] PDF opens correctly
- [ ] No errors when using fallback

## Accessibility Tests

### Keyboard Navigation
- [ ] Can tab to "View Flipbook" button
- [ ] Can activate button with Enter key
- [ ] Can close flipbook with Escape key
- [ ] Focus returns appropriately after closing
- [ ] No keyboard traps
- [ ] All interactive elements are keyboard accessible

### Screen Reader
- [ ] "View Flipbook" button is announced
- [ ] Flipbook opening is announced
- [ ] Close button is announced
- [ ] Escape key hint is provided
- [ ] Error messages are announced
- [ ] ARIA labels are present and correct

### Visual Accessibility
- [ ] Close button is large enough (≥ 44x44px)
- [ ] Sufficient color contrast
- [ ] Text is readable
- [ ] Icons have text labels
- [ ] Focus indicators are visible

## Touch Interaction Tests (Touchscreen Device)

- [ ] Can tap "View Flipbook" button
- [ ] Can tap Close button
- [ ] Touch targets are appropriate size (≥ 44x44px)
- [ ] Swipe gestures work within flipbook
- [ ] Page navigation responds to touch
- [ ] No accidental activations
- [ ] Pinch-to-zoom works (if supported)

## Performance Tests

### Load Performance
- [ ] Flipbook loads in < 2 seconds (typical size)
- [ ] Assets load progressively
- [ ] No blocking during load
- [ ] Network requests are efficient

### Runtime Performance
- [ ] Page transitions are smooth (≥ 30 FPS)
- [ ] No lag during interactions
- [ ] Memory usage is reasonable
- [ ] No memory leaks after multiple open/close cycles

### Browser Performance
- [ ] No console errors
- [ ] No console warnings
- [ ] DevTools Performance tab shows good metrics
- [ ] No long tasks (> 50ms)

## Responsive Design Tests

### Desktop (1920x1080)
- [ ] Flipbook is fullscreen
- [ ] Controls are accessible
- [ ] Layout is correct
- [ ] No overflow or clipping

### Tablet (768x1024)
- [ ] Flipbook is fullscreen
- [ ] Touch targets are appropriate
- [ ] Layout adapts correctly
- [ ] No overflow or clipping

### Mobile (375x667)
- [ ] Flipbook is fullscreen
- [ ] Touch targets are large enough
- [ ] Layout is usable
- [ ] No overflow or clipping

## Browser Compatibility Tests

### Chrome/Edge
- [ ] Flipbook opens correctly
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

### Firefox
- [ ] Flipbook opens correctly
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

### Safari
- [ ] Flipbook opens correctly
- [ ] All features work
- [ ] No console errors
- [ ] Performance is good

## Edge Cases

### Multiple Operations
- [ ] Can open/close flipbook 10 times without issues
- [ ] No memory leaks
- [ ] No performance degradation
- [ ] No console errors accumulate

### Body Scroll
- [ ] Page scroll is prevented when flipbook open
- [ ] Flipbook content can scroll (if applicable)
- [ ] Page scroll restored after closing
- [ ] No scroll position jump

### Focus Management
- [ ] Focus moves to close button on open
- [ ] Focus is trapped within flipbook
- [ ] Focus returns correctly on close
- [ ] Tab order is logical

## Database Integration

### Data Validation
- [ ] flipbook_path field exists in database
- [ ] flipbook_path is optional (can be NULL)
- [ ] Publications with flipbook_path load correctly
- [ ] Publications without flipbook_path work normally
- [ ] Both flipbook_path and pdf_path can coexist

### Path Validation
- [ ] Paths starting with /flipbooks/ are accepted
- [ ] Paths without leading slash are normalized
- [ ] Paths not ending in .html are rejected
- [ ] Path traversal attempts are blocked (..)
- [ ] Double slashes are rejected (//)

## Documentation Tests

### User Documentation
- [ ] User guide is clear and accurate
- [ ] Screenshots are up-to-date
- [ ] Instructions are easy to follow
- [ ] Troubleshooting section is helpful

### Admin Documentation
- [ ] Admin guide is clear and accurate
- [ ] Database schema is documented
- [ ] File structure is explained
- [ ] Examples are provided

## Final Checks

### Code Quality
- [ ] No console errors in production build
- [ ] No console warnings in production build
- [ ] TypeScript types are correct
- [ ] Code follows project conventions

### User Experience
- [ ] Feature is intuitive to use
- [ ] Error messages are helpful
- [ ] Loading states are clear
- [ ] Transitions are smooth

### Production Readiness
- [ ] All tests pass
- [ ] Performance is acceptable
- [ ] Accessibility requirements met
- [ ] Documentation is complete
- [ ] No known critical bugs

## Sign-Off

**Testing completed by:** _________________

**Date:** _________________

**Overall Status:** ☐ Pass ☐ Fail ☐ Pass with Issues

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Ready for Production:** ☐ Yes ☐ No ☐ With Conditions

**Conditions (if any):**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
