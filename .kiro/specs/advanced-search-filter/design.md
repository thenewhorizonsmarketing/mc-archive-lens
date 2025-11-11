# Design Document: Advanced SQLite Search Filter

## Overview

This design document outlines the architecture for a modern, feature-rich search filter system built on SQLite FTS5 with MC Law blue styling. The system provides advanced filtering, smart suggestions, saved searches, and analytics while maintaining excellent performance and accessibility.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Advanced Search Filter                     │
│                    (Main Component)                          │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Filter Panel │  │ Search Input │  │ Results View │
│  Component   │  │  Component   │  │  Component   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────────────────────────────────────────┐
│           Filter Engine (Core Logic)              │
│  - Query Builder                                  │
│  - Filter Processor                               │
│  - Suggestion Engine                              │
│  - Analytics Tracker                              │
└──────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────┐
│         SQLite FTS5 Database Layer                │
│  - Full-text search                               │
│  - Indexed queries                                │
│  - Result caching                                 │
└──────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. AdvancedSearchFilter (Main Component)

**Purpose**: Orchestrates all search and filter functionality

**Props**:
```typescript
interface AdvancedSearchFilterProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onResultsChange: (results: SearchResult[]) => void;
  initialFilters?: FilterConfig;
  enableSavedSearches?: boolean;
  enableAnalytics?: boolean;
  enableVisualBuilder?: boolean;
}
```

**State**:
```typescript
interface SearchFilterState {
  activeFilters: FilterConfig;
  searchQuery: string;
  suggestions: Suggestion[];
  savedSearches: SavedSearch[];
  searchHistory: HistoryEntry[];
  resultCounts: Map<string, number>;
  isLoading: boolean;
}
```

### 2. FilterPanel Component

**Purpose**: Displays and manages all filter options

**Features**:
- Collapsible filter categories
- Multi-select with checkboxes
- Range sliders for numeric filters
- Date pickers for temporal filters
- Real-time result count badges
- Clear all filters button

**Styling**:
- MC Blue background (#0C2340)
- White text (#FFFFFF)
- Gold borders and accents (#C99700)
- Smooth transitions on hover
- Gold focus indicators

### 3. SmartSearchInput Component

**Purpose**: Intelligent search input with autocomplete

**Features**:
- Debounced input (150ms)
- Real-time suggestions dropdown
- Recent searches
- Popular searches
- Category-based suggestions
- Keyboard navigation (↑↓ Enter Esc)

**Suggestion Types**:
```typescript
interface Suggestion {
  type: 'recent' | 'popular' | 'category' | 'smart';
  text: string;
  category?: string;
  resultCount: number;
  icon?: string;
}
```

### 4. VisualFilterBuilder Component

**Purpose**: Drag-and-drop query builder

**Features**:
- Draggable filter blocks
- Logical operator nodes (AND/OR)
- Nested filter groups
- Visual query preview
- Export to SQL

**Structure**:
```typescript
interface FilterNode {
  id: string;
  type: 'filter' | 'operator' | 'group';
  operator?: 'AND' | 'OR';
  children?: FilterNode[];
  filter?: FilterConfig;
}
```

### 5. SavedSearchManager Component

**Purpose**: Manage saved search presets

**Features**:
- Grid view of saved searches
- Quick load buttons
- Edit/delete options
- Share functionality
- Import/export

**Storage**:
```typescript
interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  filters: FilterConfig;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}
```

### 6. SearchAnalytics Component

**Purpose**: Display search history and analytics

**Features**:
- Timeline view of searches
- Most searched terms
- Category distribution chart
- Time-based analytics
- Export analytics data

**Metrics**:
```typescript
interface SearchMetrics {
  totalSearches: number;
  uniqueQueries: number;
  avgResultsPerSearch: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  categoryBreakdown: Map<string, number>;
  timeDistribution: Map<string, number>;
}
```

## Data Models

### FilterConfig

```typescript
interface FilterConfig {
  type: 'alumni' | 'publication' | 'photo' | 'faculty';
  textFilters?: TextFilter[];
  dateFilters?: DateFilter[];
  rangeFilters?: RangeFilter[];
  booleanFilters?: BooleanFilter[];
  customFilters?: CustomFilter[];
  operator: 'AND' | 'OR';
}

interface TextFilter {
  field: string;
  value: string;
  matchType: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  caseSensitive: boolean;
}

interface DateFilter {
  field: string;
  startDate?: Date;
  endDate?: Date;
  preset?: 'today' | 'week' | 'month' | 'year' | 'custom';
}

interface RangeFilter {
  field: string;
  min: number;
  max: number;
  step?: number;
}

interface BooleanFilter {
  field: string;
  value: boolean;
}
```

### Query Builder

```typescript
class AdvancedQueryBuilder {
  buildQuery(config: FilterConfig): string;
  optimizeQuery(query: string): string;
  estimateResultCount(config: FilterConfig): Promise<number>;
  generateShareableURL(config: FilterConfig): string;
  parseSharedURL(url: string): FilterConfig;
}
```

### Suggestion Engine

```typescript
class SuggestionEngine {
  generateSuggestions(
    input: string,
    context: FilterConfig,
    history: HistoryEntry[]
  ): Promise<Suggestion[]>;
  
  rankSuggestions(suggestions: Suggestion[]): Suggestion[];
  
  learnFromSelection(suggestion: Suggestion): void;
}
```

## Styling System

### Color Palette

```css
:root {
  /* MC Law Colors */
  --mc-blue: #0C2340;
  --mc-gold: #C99700;
  --mc-white: #FFFFFF;
  
  /* Derived Colors */
  --mc-blue-light: rgba(12, 35, 64, 0.8);
  --mc-blue-dark: rgba(12, 35, 64, 0.95);
  --mc-gold-light: rgba(201, 151, 0, 0.2);
  --mc-gold-glow: rgba(201, 151, 0, 0.4);
  
  /* Functional Colors */
  --filter-bg: var(--mc-blue);
  --filter-text: var(--mc-white);
  --filter-border: var(--mc-gold);
  --filter-hover: var(--mc-gold-light);
  --filter-active: var(--mc-gold);
  --filter-disabled: rgba(255, 255, 255, 0.3);
}
```

### Component Styles

**Filter Panel**:
```css
.advanced-filter-panel {
  background: var(--mc-blue);
  border: 2px solid var(--mc-gold);
  border-radius: 12px;
  padding: 24px;
  color: var(--mc-white);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.filter-category {
  border-bottom: 1px solid var(--mc-gold-light);
  padding: 16px 0;
}

.filter-option {
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.filter-option:hover {
  background: var(--mc-gold-light);
  border-color: var(--mc-gold);
}

.filter-chip {
  background: var(--mc-blue-light);
  border: 1px solid var(--mc-gold);
  color: var(--mc-white);
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
```

**Search Input**:
```css
.smart-search-input {
  background: var(--mc-blue);
  border: 2px solid var(--mc-gold);
  color: var(--mc-white);
  padding: 16px 20px;
  font-size: 18px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.smart-search-input:focus {
  outline: none;
  border-color: var(--mc-gold);
  box-shadow: 0 0 0 4px var(--mc-gold-glow);
}

.suggestions-dropdown {
  background: var(--mc-blue);
  border: 2px solid var(--mc-gold);
  border-radius: 12px;
  margin-top: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background: var(--mc-gold-light);
}
```

**Saved Searches**:
```css
.saved-search-card {
  background: var(--mc-blue);
  border: 2px solid var(--mc-gold);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.saved-search-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(201, 151, 0, 0.3);
  border-color: var(--mc-gold);
}
```

## Error Handling

### Error States

```typescript
enum FilterErrorType {
  INVALID_QUERY = 'INVALID_QUERY',
  NO_RESULTS = 'NO_RESULTS',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR'
}

interface FilterError {
  type: FilterErrorType;
  message: string;
  recoverable: boolean;
  suggestion?: string;
}
```

### Error Recovery

1. **Invalid Query**: Show validation message, highlight problematic filter
2. **No Results**: Suggest relaxing filters, show similar searches
3. **Database Error**: Retry with exponential backoff, show cached results
4. **Network Error**: Use offline mode, queue operations
5. **Permission Error**: Show appropriate message, disable restricted features

## Performance Optimization

### Query Optimization

```typescript
class QueryOptimizer {
  // Use prepared statements
  prepareStatement(query: string): PreparedStatement;
  
  // Index suggestions
  suggestIndexes(filters: FilterConfig): string[];
  
  // Query plan analysis
  analyzeQueryPlan(query: string): QueryPlan;
  
  // Result caching
  cacheResults(key: string, results: SearchResult[], ttl: number): void;
}
```

### Caching Strategy

- **Filter counts**: Cache for 5 minutes
- **Search results**: Cache for 3 minutes
- **Suggestions**: Cache for 10 minutes
- **Saved searches**: Persist to localStorage
- **Search history**: Persist to IndexedDB

### Virtual Scrolling

For large result sets (>100 items):
- Render only visible items + buffer
- Use `react-window` or `react-virtual`
- Lazy load images
- Implement infinite scroll

## Testing Strategy

### Unit Tests

- Filter logic validation
- Query builder correctness
- Suggestion ranking algorithm
- Cache management
- URL encoding/decoding

### Integration Tests

- Filter combinations
- Search with multiple filters
- Saved search CRUD operations
- Analytics data collection
- Export/import functionality

### E2E Tests

- Complete search flow
- Filter application and removal
- Saved search workflow
- Keyboard navigation
- Mobile responsiveness

### Performance Tests

- Query execution time (<200ms)
- Suggestion generation (<100ms)
- Filter count updates (<200ms)
- Large dataset handling (10,000+ records)
- Memory usage monitoring

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Readers**: ARIA labels, live regions for dynamic updates
- **Color Contrast**: White on MC Blue exceeds 7:1 ratio
- **Focus Management**: Logical tab order, focus trapping in modals
- **Alternative Text**: All icons have text alternatives

### Keyboard Shortcuts

- `/` - Focus search input
- `Ctrl+K` - Open filter panel
- `Ctrl+S` - Save current search
- `Ctrl+H` - View search history
- `Esc` - Close dropdowns/modals
- `↑↓` - Navigate suggestions
- `Enter` - Select suggestion/apply filter

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Considerations

- Touch-friendly controls (44x44px minimum)
- Swipe gestures for filter categories
- Bottom sheet for filter panel
- Simplified visual builder
- Responsive grid layouts

## Future Enhancements

1. **AI-Powered Search**: Natural language query processing
2. **Voice Search**: Speech-to-text integration
3. **Collaborative Filters**: Share and collaborate on searches
4. **Advanced Analytics**: Machine learning insights
5. **Custom Filter Templates**: User-created filter types
6. **Real-time Collaboration**: Live search sessions
7. **Search Recommendations**: Suggest related searches
8. **Filter Presets Library**: Community-shared filters

