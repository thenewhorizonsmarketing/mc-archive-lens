# Advanced Filter Integration

This document describes how the advanced filter system integrates with existing content pages.

## Overview

The advanced filter system has been integrated into all content pages (Alumni, Publications, Photos, Faculty) through the `AdvancedFilterIntegration` component. This component provides backward compatibility while enabling advanced filtering features.

## Architecture

```
Content Pages (AlumniRoom, etc.)
    ↓
AdvancedFilterIntegration
    ↓
    ├─→ AdvancedFilterPanel (when enableAdvancedFilters=true)
    └─→ FilterPanel (when enableAdvancedFilters=false)
```

## Components

### AdvancedFilterIntegration

**Location**: `src/components/filters/AdvancedFilterIntegration.tsx`

**Purpose**: Bridges the advanced filter system with existing content pages by:
- Converting between `SearchFilters` (legacy) and `FilterConfig` (advanced)
- Providing backward compatibility
- Enabling advanced features when requested
- Managing result count estimation

**Props**:
```typescript
interface AdvancedFilterIntegrationProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableYears?: number[];
  availableDepartments?: string[];
  availableCollections?: string[];
  availablePublicationTypes?: string[];
  availableEventTypes?: string[];
  availablePositions?: string[];
  enableAdvancedFilters?: boolean;  // Toggle advanced features
  className?: string;
}
```

### Search Context Updates

**Location**: `src/lib/search-context.tsx`

**New Features**:
- `advancedQueryBuilder`: Instance of `AdvancedQueryBuilder` for building complex queries
- `filterProcessor`: Instance of `FilterProcessor` for validation and processing
- `executeAdvancedQuery(config)`: Execute queries using advanced filter configuration
- `estimateFilterResults(config)`: Estimate result counts for filter options

## Usage

### Basic Usage (Backward Compatible)

By default, pages use the standard filter panel:

```tsx
<AdvancedFilterIntegration
  contentType="alumni"
  filters={filters}
  onFiltersChange={setFilters}
  availableYears={availableYears}
  availableDepartments={availableDepartments}
/>
```

### Advanced Usage

Enable advanced filters by setting the `enableAdvancedFilters` prop:

```tsx
<AdvancedFilterIntegration
  contentType="alumni"
  filters={filters}
  onFiltersChange={setFilters}
  availableYears={availableYears}
  availableDepartments={availableDepartments}
  enableAdvancedFilters={true}  // Enable advanced features
/>
```

## Content Page Integration

All content pages have been updated to support advanced filters:

### AlumniRoom

```tsx
interface AlumniRoomProps {
  onNavigateHome: () => void;
  searchQuery?: string;
  selectedResultName?: string;
  enableAdvancedFilters?: boolean;  // New prop
}
```

### PublicationsRoom

```tsx
interface PublicationsRoomProps {
  onNavigateHome: () => void;
  searchQuery?: string;
  selectedResultName?: string;
  enableAdvancedFilters?: boolean;  // New prop
}
```

### PhotosRoom

```tsx
interface PhotosRoomProps {
  onNavigateHome: () => void;
  searchQuery?: string;
  selectedResultName?: string;
  enableAdvancedFilters?: boolean;  // New prop
}
```

### FacultyRoom

```tsx
interface FacultyRoomProps {
  onNavigateHome: () => void;
  searchQuery?: string;
  selectedResultName?: string;
  enableAdvancedFilters?: boolean;  // New prop
}
```

## Filter Conversion

The integration component handles conversion between two filter formats:

### SearchFilters → FilterConfig

```typescript
{
  type: 'alumni',
  yearRange: { start: 1980, end: 1990 },
  department: 'Law'
}
```

Converts to:

```typescript
{
  type: 'alumni',
  operator: 'AND',
  rangeFilters: [
    { field: 'class_year', min: 1980, max: 1990 }
  ],
  textFilters: [
    { field: 'department', value: 'Law', matchType: 'equals', caseSensitive: false }
  ]
}
```

### FilterConfig → SearchFilters

The reverse conversion ensures that advanced filters can be used with existing hooks and components.

## Features

### Backward Compatibility

- Existing pages work without modification
- Standard filter panel remains default
- No breaking changes to existing functionality

### Advanced Features (When Enabled)

- MC Law blue styling with gold accents
- Collapsible filter categories
- Result count badges
- Multi-select filter options
- Real-time filter validation
- Query optimization
- Result count estimation

### Performance

- Debounced result count estimation (500ms)
- Optimized query building
- Efficient filter validation
- Cached filter results

## Testing

### Manual Testing

1. **Standard Mode** (default):
   - Navigate to any content page
   - Verify standard filter panel appears
   - Test all filter options work correctly
   - Verify results update properly

2. **Advanced Mode**:
   - Pass `enableAdvancedFilters={true}` to content page
   - Verify advanced filter panel appears with MC Blue styling
   - Test collapsible categories
   - Verify result counts appear (when available)
   - Test multi-select functionality
   - Verify clear all filters works

### Integration Testing

Test with all content types:
- Alumni (year range, department)
- Publications (year, publication type, department)
- Photos (year, collection, event type)
- Faculty (department, position)

## Future Enhancements

1. **Direct Query Execution**: Currently converts to SearchFilters for compatibility. Could execute advanced queries directly for better performance.

2. **Real-time Result Counts**: Implement efficient result count estimation for each filter option.

3. **Filter Persistence**: Save advanced filter configurations to localStorage or URL parameters.

4. **Visual Query Builder**: Integrate the visual filter builder component for complex queries.

5. **Smart Suggestions**: Add intelligent filter suggestions based on search history.

## Migration Path

To fully migrate a page to advanced filters:

1. Update page props to include `enableAdvancedFilters`
2. Set `enableAdvancedFilters={true}` when rendering
3. Test all filter combinations
4. Verify performance with large datasets
5. Update any page-specific filter logic

## Troubleshooting

### Filters Not Appearing

- Check that `enableAdvancedFilters` prop is set correctly
- Verify filter categories have available options
- Check console for validation errors

### Result Counts Not Showing

- Ensure search context is initialized
- Check that `estimateFilterResults` is available
- Verify database connection is healthy

### Conversion Issues

- Check filter field names match database schema
- Verify content type is correct
- Review conversion logic in `AdvancedFilterIntegration`

## Support

For issues or questions:
1. Check this README
2. Review component source code
3. Check browser console for errors
4. Verify search context initialization
