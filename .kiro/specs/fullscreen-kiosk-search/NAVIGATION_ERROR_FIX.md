# Navigation Error Fix - "removeChild" Issue

## Problem
When clicking a search result in the fullscreen kiosk search, the app would:
1. Navigate to the alumni main page
2. Become unresponsive
3. Show error: "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node"

## Root Cause
The ResultsDisplay component had its own navigation logic that tried to use React Router's `navigate()` function to go to routes like `/alumni`, `/publications`, etc. However, these routes don't exist in the app's routing configuration. The app uses a hybrid navigation system:

- **React Router** for top-level pages (`/`, `/search`, etc.)
- **State-based navigation** within the Index component for rooms

When ResultsDisplay tried to navigate to a non-existent route, React Router would fail, and during cleanup, it would try to remove DOM nodes that were already gone, causing the "removeChild" error.

## Solution
Simplified ResultsDisplay to ALWAYS use the `onResultSelect` callback instead of trying to navigate on its own:

### Before:
```typescript
const handleResultSelect = (result: SearchResult) => {
  if (onResultSelect) {
    onResultSelect(result);
    return;
  }

  // Default navigation behavior - THIS WAS THE PROBLEM
  setTimeout(() => {
    const roomPath = getRoomPath(result.type);
    navigate(roomPath, { state: { ... } });
  }, 300);
};
```

### After:
```typescript
const handleResultSelect = (result: SearchResult) => {
  // Always use the callback if provided
  if (onResultSelect) {
    onResultSelect(result);
    return;
  }

  // Fallback: log warning if no callback provided
  console.warn('[ResultsDisplay] No onResultSelect callback provided');
};
```

## How It Works Now

### Correct Flow:
1. User clicks result in FullscreenSearchPage
2. ResultsDisplay calls `onResultSelect(result)`
3. SearchInterface receives callback and calls its `handleResultSelect`
4. SearchInterface calls FullscreenSearchPage's `handleResultSelect`
5. FullscreenSearchPage stores selection in sessionStorage
6. FullscreenSearchPage navigates to `/` (home)
7. Index component mounts and checks sessionStorage
8. Index finds selection and sets state to show appropriate room
9. Room component renders with `selectedResultName` prop
10. Room's useEffect detects prop and opens detail dialog

### Key Points:
- ResultsDisplay is a **presentation component** - it should NOT handle navigation
- Navigation logic belongs in **container components** (FullscreenSearchPage, Index)
- Callbacks should be passed down the component tree
- Each component has a single responsibility

## Files Modified

### src/components/kiosk/ResultsDisplay.tsx
- Removed `useNavigate` hook and React Router import
- Removed `getRoomPath` function
- Simplified `handleResultSelect` to only use callback
- Added warning log if no callback provided

## Testing

Test the following flow:
1. Open fullscreen search (`/search`)
2. Search for an alumni member
3. Click on a result card
4. Verify:
   - No console errors
   - Navigation to home page
   - Alumni room opens
   - Detail dialog shows automatically
   - No "removeChild" error

## Prevention

To prevent similar issues in the future:

1. **Presentation components** (like ResultsDisplay) should:
   - Accept callbacks via props
   - Call callbacks when user interacts
   - NOT handle navigation directly

2. **Container components** (like FullscreenSearchPage) should:
   - Handle navigation logic
   - Pass callbacks to presentation components
   - Manage application state

3. **Navigation patterns**:
   - Use React Router for top-level routes
   - Use state for conditional rendering within a route
   - Use sessionStorage/localStorage to bridge between routes
   - Never try to navigate to non-existent routes

## Status
✅ Fixed - Navigation now works correctly without errors.
