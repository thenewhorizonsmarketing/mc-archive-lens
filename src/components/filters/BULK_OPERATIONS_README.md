# Bulk Filter Operations

This directory contains components for bulk filter operations with MC Law blue styling.

## Components

### BulkFilterSelector

Multi-select interface for bulk filter operations.

**Features:**
- Multi-select checkboxes with MC Blue styling
- "Select All" functionality for all filters and per-category
- Selection count displayed in gold badges
- Category grouping with expand/collapse
- Active filter indicators
- Keyboard navigation support
- Indeterminate checkbox states for partial category selection

**Props:**
```typescript
interface BulkFilterSelectorProps {
  availableFilters: BulkFilterOption[];
  activeFilters: FilterConfig;
  onSelectionChange: (selectedIds: string[]) => void;
  onApplySelected: (selectedFilters: BulkFilterOption[]) => void;
  className?: string;
}
```

**Usage:**
```tsx
import { BulkFilterSelector } from './components/filters/BulkFilterSelector';

const filters: BulkFilterOption[] = [
  {
    id: 'year-1980',
    field: 'graduationYear',
    value: '1980',
    label: '1980',
    category: 'Graduation Year',
    type: 'text'
  },
  // ... more filters
];

<BulkFilterSelector
  availableFilters={filters}
  activeFilters={activeFilters}
  onSelectionChange={(ids) => console.log('Selected:', ids)}
  onApplySelected={(filters) => applyFilters(filters)}
/>
```

### BulkOperations

Bulk filter operation controls with confirmation dialogs.

**Features:**
- Apply all selected filters with query optimization
- Clear all filters with confirmation dialog
- Active filter count display with gold badges
- Filter breakdown by type
- Quick action buttons
- Destructive action confirmations
- Reset to default functionality

**Props:**
```typescript
interface BulkOperationsProps {
  activeFilters: FilterConfig;
  onApplyFilters: (filters: FilterConfig) => void;
  onClearAllFilters: () => void;
  className?: string;
}
```

**Usage:**
```tsx
import { BulkOperations } from './components/filters/BulkOperations';

<BulkOperations
  activeFilters={activeFilters}
  onApplyFilters={(filters) => setActiveFilters(filters)}
  onClearAllFilters={() => clearAllFilters()}
/>
```

## Styling

All components use the MC Law color palette:
- **MC Blue (#0C2340)**: Primary background
- **MC Gold (#C99700)**: Accents, borders, and badges
- **MC White (#FFFFFF)**: Text and highlights

### CSS Classes

**BulkFilterSelector:**
- `.bulk-filter-selector` - Main container
- `.bulk-filter-selector__header` - Header with title and actions
- `.bulk-filter-selector__category` - Category container
- `.bulk-filter-selector__option` - Individual filter option
- `.bulk-filter-selector__option--active` - Active filter indicator

**BulkOperations:**
- `.bulk-operations` - Main container
- `.bulk-operations__summary` - Active filter summary
- `.bulk-operations__breakdown` - Filter type breakdown
- `.bulk-operations__quick-actions` - Quick action buttons
- `.bulk-operations__dialog` - Confirmation dialog

## Query Optimization

The bulk operations system optimizes queries by:

1. **Deduplication**: Prevents duplicate filters from being applied
2. **Grouping**: Groups filters by type for efficient SQL generation
3. **Single Query**: Applies all selected filters in one optimized query
4. **Caching**: Leverages the FilterCache for performance

## Accessibility

Both components are fully accessible:

- **Keyboard Navigation**: Full keyboard support with Tab, Enter, Space, and Arrow keys
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Focus Management**: Visible focus indicators with gold outlines
- **Semantic HTML**: Proper use of semantic elements and roles
- **Announcements**: Live regions for dynamic updates

### Keyboard Shortcuts

- `Tab` - Navigate between elements
- `Enter` / `Space` - Toggle selection
- `Escape` - Close dialogs

## Confirmation Dialogs

Destructive actions (like "Clear All") show confirmation dialogs:

**Features:**
- Modal overlay with backdrop
- Clear action description
- Confirm/Cancel buttons
- Keyboard support (Enter to confirm, Escape to cancel)
- Danger styling for destructive actions

## Performance

**Optimization Strategies:**
- Memoized filter grouping
- Efficient state updates with Set data structures
- Debounced selection changes
- Virtual scrolling for large filter lists (future enhancement)

**Performance Targets:**
- Selection update: <50ms
- Apply filters: <200ms
- Clear all: <100ms

## Integration Example

```tsx
import React, { useState } from 'react';
import { BulkFilterSelector } from './components/filters/BulkFilterSelector';
import { BulkOperations } from './components/filters/BulkOperations';
import { FilterConfig } from './lib/filters/types';

export const MyFilterPage: React.FC = () => {
  const [activeFilters, setActiveFilters] = useState<FilterConfig>({
    type: 'alumni',
    operator: 'AND',
    textFilters: [],
    booleanFilters: []
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleApplySelected = (selectedFilters: BulkFilterOption[]) => {
    // Create optimized filter config
    const newConfig = { ...activeFilters };
    
    selectedFilters.forEach(filter => {
      // Add filters based on type
      // ... implementation
    });
    
    setActiveFilters(newConfig);
    setSelectedIds([]); // Clear selection
  };

  return (
    <div>
      <BulkOperations
        activeFilters={activeFilters}
        onApplyFilters={setActiveFilters}
        onClearAllFilters={() => setActiveFilters({
          type: 'alumni',
          operator: 'AND'
        })}
      />
      
      <BulkFilterSelector
        availableFilters={availableFilters}
        activeFilters={activeFilters}
        onSelectionChange={setSelectedIds}
        onApplySelected={handleApplySelected}
      />
    </div>
  );
};
```

## Testing

Run the example component to test functionality:

```bash
npm run dev
# Navigate to the bulk filter example page
```

## Requirements Met

- ✅ **Requirement 8**: Bulk filter operations with multi-select
- ✅ **Requirement 12**: MC Law blue styling throughout
- ✅ Multi-select checkboxes with gold badges
- ✅ "Select All" functionality
- ✅ Bulk apply with query optimization
- ✅ Clear all with confirmation dialog
- ✅ Active filter indicators
- ✅ Category grouping
- ✅ Keyboard navigation
- ✅ Responsive design

## Future Enhancements

1. **Drag and Drop**: Reorder selected filters
2. **Filter Templates**: Save and load filter combinations
3. **Bulk Edit**: Modify multiple filters at once
4. **Export/Import**: Share filter selections
5. **Undo/Redo**: Revert filter changes
6. **Filter Presets**: Quick access to common filter combinations
7. **Advanced Search**: Search within available filters
8. **Filter Statistics**: Show usage analytics

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Part of the MC Law Advanced Search Filter system.
