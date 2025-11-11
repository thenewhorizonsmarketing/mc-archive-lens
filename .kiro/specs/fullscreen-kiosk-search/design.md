# Design Document: Fullscreen Kiosk Search Interface

## Overview

This document outlines the design for a fullscreen search interface optimized for kiosk environments. The system provides a touch-friendly, error-resilient search experience with integrated virtual keyboard, real-time filtering, and seamless navigation. The design leverages existing search infrastructure while adding kiosk-specific enhancements for reliability and usability.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Fullscreen Search Page                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              FullscreenSearchPage Component            │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         Search Error Boundary (Top Level)       │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │      KioskSearchInterface Component       │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │   Search Input + Clear Button       │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │   Touch Keyboard (Fixed Position)   │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │   Filter Panel (Collapsible)        │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────┐  │  │  │  │
│  │  │  │  │   Results Display (Scrollable)      │  │  │  │  │
│  │  │  │  └─────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─── Search Context (useSearch)
                            ├─── Search Manager (SQLite FTS5)
                            ├─── Error Recovery System
                            └─── Analytics Tracking
```

### Component Hierarchy

1. **FullscreenSearchPage** (Route: `/search`)
   - Top-level page component
   - Manages fullscreen state
   - Handles navigation and routing
   - Provides close/exit functionality

2. **KioskSearchInterface**
   - Core search UI component
   - Integrates all sub-components
   - Manages search state
   - Coordinates keyboard, filters, and results

3. **TouchKeyboard**
   - Virtual keyboard component
   - Fixed positioning (no layout shift)
   - Touch-optimized key sizes
   - Visual feedback on key press

4. **FilterPanel**
   - Collapsible filter controls
   - Touch-friendly toggles
   - Active filter indicators
   - Clear all functionality

5. **ResultsDisplay**
   - Scrollable results list
   - Touch-optimized result cards
   - Loading states
   - Empty states

6. **SearchErrorBoundary**
   - Catches and handles errors
   - Provides recovery UI
   - Logs errors for debugging
   - Prevents app crashes

## Components and Interfaces

### 1. FullscreenSearchPage Component

**Purpose**: Top-level page component that provides fullscreen search experience

**Props**:
```typescript
interface FullscreenSearchPageProps {
  onClose?: () => void;
  initialQuery?: string;
  onResultSelect?: (result: SearchResult) => void;
}
```

**State**:
- `isFullscreen`: boolean - tracks fullscreen status
- `searchHistory`: string[] - recent searches for quick access

**Key Features**:
- Fullscreen mode with escape handling
- Close button (60x60px minimum)
- Smooth transitions (300ms)
- Background scroll prevention
- Integration with app routing

### 2. KioskSearchInterface Component

**Purpose**: Main search interface with keyboard, filters, and results

**Props**:
```typescript
interface KioskSearchInterfaceProps {
  onResultSelect: (result: SearchResult) => void;
  showKeyboard?: boolean;
  showFilters?: boolean;
  maxResults?: number;
  className?: string;
}
```

**State**:
- `query`: string - current search query
- `filters`: FilterOptions - active filters
- `results`: SearchResult[] - search results
- `isLoading`: boolean - loading state
- `error`: string | null - error state
- `keyboardVisible`: boolean - keyboard visibility

**Key Features**:
- Real-time search (150ms debounce)
- Integrated virtual keyboard
- Filter management
- Error handling with recovery
- Layout stability (CLS < 0.1)

### 3. TouchKeyboard Component

**Purpose**: On-screen virtual keyboard optimized for touch input

**Props**:
```typescript
interface TouchKeyboardProps {
  onKeyPress: (key: string) => void;
  layout?: 'qwerty' | 'compact';
  theme?: 'light' | 'dark' | 'kiosk';
  className?: string;
}
```

**Key Features**:
- QWERTY layout with 60x60px keys
- 8px spacing between keys
- Visual press feedback (50ms)
- Special keys: backspace, space, enter, clear
- Fixed positioning to prevent layout shift
- MC Law branding colors

**Layout**:
```
[1][2][3][4][5][6][7][8][9][0][-][=][BACK]
[Q][W][E][R][T][Y][U][I][O][P]
[A][S][D][F][G][H][J][K][L]
[Z][X][C][V][B][N][M][,][.]
[    SPACE    ][CLEAR][ENTER]
```

### 4. FilterPanel Component

**Purpose**: Collapsible panel for search result filtering

**Props**:
```typescript
interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
  availableFilters: AvailableFilters;
  className?: string;
}
```

**Filter Types**:
- **Category**: Alumni, Publications, Photos, Faculty
- **Year Range**: Start year - End year slider
- **Decade**: 1950s, 1960s, 1970s, etc.
- **Publication Type**: Law Review, Amicus, Legal Eye, etc.
- **Department**: For faculty filtering

**Key Features**:
- Touch-friendly toggles (44x44px minimum)
- Active filter badges
- Clear all button
- Smooth expand/collapse animation
- Filter count indicator

### 5. ResultsDisplay Component

**Purpose**: Displays search results in touch-friendly format

**Props**:
```typescript
interface ResultsDisplayProps {
  results: SearchResult[];
  isLoading: boolean;
  error?: string;
  onResultSelect: (result: SearchResult) => void;
  highlightTerms?: string[];
}
```

**Result Card Design**:
- Minimum height: 80px
- Touch target: Full card width
- Content: Thumbnail, title, subtitle, type badge
- Visual feedback on tap (50ms)
- Smooth navigation transition (300ms)

**States**:
- Loading: Skeleton loaders
- Empty: "No results" message with suggestions
- Error: Error message with retry button
- Results: Scrollable list of result cards

## Data Models

### SearchResult Interface
```typescript
interface SearchResult {
  id: string;
  type: 'alumni' | 'publication' | 'photo' | 'faculty';
  title: string;
  subtitle: string;
  thumbnailPath?: string;
  relevanceScore: number;
  data: AlumniRecord | PublicationRecord | PhotoRecord | FacultyRecord;
}
```

### FilterOptions Interface
```typescript
interface FilterOptions {
  categories?: ('alumni' | 'publication' | 'photo' | 'faculty')[];
  yearRange?: { start: number; end: number };
  decade?: string;
  publicationType?: string;
  department?: string;
}
```

### SearchState Interface
```typescript
interface SearchState {
  query: string;
  filters: FilterOptions;
  results: SearchResult[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  metrics: SearchMetrics;
}
```

## Error Handling

### Error Boundary Strategy

**Three-Level Error Handling**:

1. **Component-Level Errors**
   - Caught by SearchErrorBoundary
   - Display inline error message
   - Provide "Try Again" button
   - Log error details

2. **Search Query Errors**
   - Catch database errors
   - Display last successful results
   - Show error notification
   - Auto-retry after 3 seconds

3. **Critical System Errors**
   - Catch initialization failures
   - Display "Return to Home" button
   - Log error for debugging
   - Prevent app crash

### Error Recovery Mechanisms

**Automatic Recovery**:
- Retry failed queries (max 3 attempts)
- Fallback to simple LIKE search if FTS5 fails
- Cache last successful results
- Graceful degradation

**Manual Recovery**:
- "Try Again" button for transient errors
- "Clear Search" to reset state
- "Return to Home" for critical errors
- "Refresh" to reinitialize system

### Error Messages

**User-Friendly Messages**:
- "Search temporarily unavailable. Trying again..."
- "No results found. Try different search terms."
- "Unable to load filters. Using default settings."
- "Connection issue. Please try again."

## Testing Strategy

### Unit Tests

**Components to Test**:
1. FullscreenSearchPage
   - Fullscreen mode activation/deactivation
   - Close button functionality
   - Navigation handling

2. KioskSearchInterface
   - Search query handling
   - Filter application
   - Result selection
   - Error states

3. TouchKeyboard
   - Key press events
   - Character input
   - Special key handling
   - Visual feedback

4. FilterPanel
   - Filter toggle
   - Clear all functionality
   - Filter state management

5. ResultsDisplay
   - Result rendering
   - Loading states
   - Empty states
   - Error states

### Integration Tests

**Test Scenarios**:
1. End-to-end search flow
   - Enter query → See results → Select result → Navigate
2. Filter application
   - Apply filter → Results update → Clear filter → Results reset
3. Keyboard interaction
   - Type query → Results update → Clear → Results reset
4. Error recovery
   - Trigger error → See error message → Retry → Success

### Performance Tests

**Metrics to Validate**:
- Search query response time < 150ms
- Keyboard key press feedback < 50ms
- Result rendering < 200ms
- Layout Cumulative Layout Shift < 0.1
- Touch target sizes >= 44x44px

### Accessibility Tests

**WCAG 2.1 AA Compliance**:
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader announcements
- ARIA labels and roles
- Focus management
- Color contrast ratios

## Integration Points

### Existing Systems

**1. Search Manager Integration**
- Use existing `SearchManager` class
- Leverage FTS5 search capabilities
- Utilize search caching
- Apply existing query optimization

**2. Database Connection**
- Use existing `DatabaseConnection`
- Leverage connection pooling
- Apply existing error handling
- Use offline-first approach

**3. Theme Integration**
- Apply MC Law brand colors
- Use existing CSS variables
- Maintain consistent typography
- Follow existing spacing system

**4. Routing Integration**
- Add `/search` route
- Integrate with React Router
- Handle navigation state
- Support deep linking

**5. Analytics Integration**
- Track search queries
- Log filter usage
- Monitor error rates
- Measure performance metrics

### New Interfaces

**1. Kiosk Search Context**
```typescript
interface KioskSearchContext {
  isFullscreen: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  searchHistory: string[];
  addToHistory: (query: string) => void;
}
```

**2. Touch Feedback System**
```typescript
interface TouchFeedbackSystem {
  provideFeedback: (element: HTMLElement, duration: number) => void;
  vibrate: (pattern: number[]) => void;
  playSound: (soundType: 'key' | 'success' | 'error') => void;
}
```

## Performance Optimization

### Layout Stability

**Preventing Layout Shift**:
- Fixed keyboard positioning (bottom of viewport)
- Reserve space for loading states
- Use CSS containment
- Avoid dynamic height changes
- Smooth transitions only

**CSS Strategy**:
```css
.kiosk-search-keyboard {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  contain: layout style;
}
```

### Search Performance

**Optimization Techniques**:
- Debounce search input (150ms)
- Cache search results (5 min TTL)
- Limit results to 50 per query
- Use virtual scrolling for large result sets
- Prefetch common searches

### Rendering Performance

**React Optimization**:
- Memoize keyboard component
- Use React.memo for result cards
- Implement virtual scrolling
- Lazy load images
- Debounce filter changes

## Security Considerations

### Input Sanitization

**Query Sanitization**:
- Escape FTS5 special characters
- Limit query length (200 chars)
- Remove SQL injection attempts
- Validate filter values

### XSS Prevention

**Output Encoding**:
- Sanitize result titles
- Escape HTML in descriptions
- Use React's built-in XSS protection
- Validate image paths

### Rate Limiting

**Abuse Prevention**:
- Limit searches to 10 per second
- Throttle rapid filter changes
- Prevent automated scraping
- Log suspicious activity

## Deployment Considerations

### Browser Compatibility

**Target Browsers**:
- Chrome 90+ (primary kiosk browser)
- Firefox 88+
- Safari 14+
- Edge 90+

**Polyfills Required**:
- None (modern browsers only)

### Kiosk Configuration

**Recommended Settings**:
- Fullscreen mode enabled
- Touch events enabled
- Keyboard shortcuts disabled
- Context menu disabled
- Auto-refresh disabled

### Monitoring

**Metrics to Track**:
- Search query volume
- Average response time
- Error rate
- Filter usage
- User session duration

## Future Enhancements

### Phase 2 Features

1. **Voice Search**
   - Speech-to-text input
   - Voice commands
   - Accessibility improvement

2. **Advanced Filters**
   - Date range picker
   - Multi-select categories
   - Saved filter presets

3. **Search Suggestions**
   - Autocomplete dropdown
   - Popular searches
   - Recent searches

4. **Offline Sync**
   - Background database updates
   - Sync status indicator
   - Manual refresh option

5. **Analytics Dashboard**
   - Search trends
   - Popular queries
   - User behavior insights
