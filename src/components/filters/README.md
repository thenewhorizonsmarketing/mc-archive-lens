# Advanced Filter Components

This directory contains the Advanced Filter Panel components for the MC Law Archive Lens application. These components provide a modern, feature-rich filtering interface with MC Law blue styling.

## Components

### AdvancedFilterPanel

The main filter panel component with collapsible categories, multi-select options, and result count badges.

**Features:**
- Collapsible filter categories with expand/collapse animation
- Multi-select checkbox interface for filter options
- Active filter count badges in gold
- MC Blue background with gold borders and accents
- Keyboard navigation support
- ARIA labels for accessibility
- Clear all filters functionality

**Usage:**

```tsx
import { AdvancedFilterPanel, FilterCategory } from './components/filters';
import { FilterConfig } from './lib/filters/types';

const categories: FilterCategory[] = [
  {
    id: 'graduation-year',
    title: 'Graduation Year',
    field: 'graduation_year',
    type: 'text',
    options: [
      { value: '1980', label: '1980', count: 64 },
      { value: '1981', label: '1981', count: 63 }
    ]
  }
];

const [activeFilters, setActiveFilters] = useState<FilterConfig>({
  type: 'alumni',
  operator: 'AND',
  textFilters: []
});

<AdvancedFilterPanel
  contentType="alumni"
  categories={categories}
  activeFilters={activeFilters}
  onFilterChange={setActiveFilters}
  onClearAll={() => setActiveFilters({ type: 'alumni', operator: 'AND' })}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `contentType` | `'alumni' \| 'publication' \| 'photo' \| 'faculty'` | Yes | Type of content being filtered |
| `categories` | `FilterCategory[]` | Yes | Array of filter categories to display |
| `activeFilters` | `FilterConfig` | Yes | Current active filter configuration |
| `onFilterChange` | `(filters: FilterConfig) => void` | Yes | Callback when filters change |
| `onClearAll` | `() => void` | No | Callback for clear all button |
| `className` | `string` | No | Additional CSS classes |

### FilterOption

Individual filter option with checkbox, label, and optional result count badge.

**Features:**
- Custom styled checkbox with gold accent when checked
- Hover effects with gold highlights
- Result count badge display
- Keyboard navigation (Enter/Space to toggle)
- Disabled state support
- ARIA attributes for accessibility

**Usage:**

```tsx
import { FilterOption } from './components/filters';

<FilterOption
  label="Class of 1980"
  value="1980"
  checked={isSelected}
  onChange={(checked) => handleChange(checked)}
  count={64}
  showCount={true}
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `label` | `string` | Yes | Display label for the option |
| `value` | `string` | Yes | Value of the option |
| `checked` | `boolean` | Yes | Whether option is selected |
| `onChange` | `(checked: boolean) => void` | Yes | Callback when selection changes |
| `count` | `number` | No | Result count for this option |
| `showCount` | `boolean` | No | Whether to show count badge (default: true) |
| `disabled` | `boolean` | No | Whether option is disabled |
| `className` | `string` | No | Additional CSS classes |

### ResultCountBadge

Displays result count in a gold badge with loading skeleton support.

**Features:**
- Gold badge with MC Blue text
- Automatic count formatting (1K, 1M, etc.)
- Loading skeleton animation
- Multiple size options (small, medium, large)
- Optional zero count display

**Usage:**

```tsx
import { ResultCountBadge } from './components/filters';

<ResultCountBadge
  count={1234}
  loading={false}
  size="small"
/>
```

**Props:**

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `count` | `number` | Yes | Number to display |
| `loading` | `boolean` | No | Show loading skeleton (default: false) |
| `size` | `'small' \| 'medium' \| 'large'` | No | Badge size (default: 'small') |
| `showZero` | `boolean` | No | Show badge when count is 0 (default: true) |
| `className` | `string` | No | Additional CSS classes |

### AutoUpdateResultCountBadge

Result count badge that automatically fetches and updates count when filter changes.

**Usage:**

```tsx
import { AutoUpdateResultCountBadge } from './components/filters';

<AutoUpdateResultCountBadge
  filterValue="1980"
  onCountFetch={async (value) => {
    // Fetch count from database
    return await fetchCount(value);
  }}
  debounceMs={200}
  size="small"
/>
```

### ResultCountBadges

Container for displaying multiple count badges in a row.

**Usage:**

```tsx
import { ResultCountBadges } from './components/filters';

<ResultCountBadges
  counts={[
    { label: 'Alumni', count: 285, loading: false },
    { label: 'Publications', count: 142, loading: false },
    { label: 'Photos', count: 1523, loading: true }
  ]}
/>
```

## Styling

All components use the MC Law color palette defined in `src/styles/advanced-filter.css`:

- **MC Blue**: `#0C2340` - Primary background color
- **MC Gold**: `#C99700` - Accent color for borders, badges, and highlights
- **MC White**: `#FFFFFF` - Text color

### CSS Variables

```css
--mc-blue: #0C2340
--mc-gold: #C99700
--mc-white: #FFFFFF
--filter-bg: var(--mc-blue)
--filter-text: var(--mc-white)
--filter-border: var(--mc-gold)
--filter-hover: rgba(201, 151, 0, 0.2)
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Color Contrast**: White on MC Blue exceeds 7:1 contrast ratio
- **Focus Management**: Logical tab order and focus trapping
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

### Keyboard Shortcuts

- **Tab**: Navigate between filter options
- **Enter/Space**: Toggle filter selection
- **Arrow Keys**: Navigate within categories (when focused)
- **Escape**: Close expanded categories

## Integration

### With Existing Search System

The filter panel integrates with the existing SQLite FTS5 search infrastructure:

```tsx
import { AdvancedFilterPanel } from './components/filters';
import { AdvancedQueryBuilder } from './lib/filters/AdvancedQueryBuilder';
import { FilterProcessor } from './lib/filters/FilterProcessor';

const queryBuilder = new AdvancedQueryBuilder();
const filterProcessor = new FilterProcessor();

// Build SQL query from filters
const { sql, params } = queryBuilder.buildQuery(activeFilters);

// Execute query
const results = await database.execute(sql, params);
```

### With Content Pages

Example integration with AlumniRoom page:

```tsx
import { AdvancedFilterPanel } from '../components/filters';
import { useContentData } from '../hooks/useContentData';

const AlumniRoom = () => {
  const [filters, setFilters] = useState<FilterConfig>({
    type: 'alumni',
    operator: 'AND'
  });

  const { data, loading } = useContentData('alumni', filters);

  return (
    <div className="alumni-room">
      <AdvancedFilterPanel
        contentType="alumni"
        categories={alumniCategories}
        activeFilters={filters}
        onFilterChange={setFilters}
      />
      <ResultsList data={data} loading={loading} />
    </div>
  );
};
```

## Examples

See `AdvancedFilterPanelExample.tsx` for a complete working example with:
- Sample filter categories
- Filter state management
- Active filter display
- Mock results display
- Debug state viewer

To view the example:

```tsx
import { AdvancedFilterPanelExample } from './components/filters/AdvancedFilterPanelExample';

// In your app or test page
<AdvancedFilterPanelExample />
```

## Performance

- **Debounced Updates**: Filter changes are debounced to prevent excessive re-renders
- **Memoized Callbacks**: Uses `useCallback` to prevent unnecessary re-renders
- **Virtual Scrolling**: Large filter lists use virtual scrolling (when implemented)
- **Result Caching**: Filter results are cached for 5 minutes

## Testing

Components include comprehensive test coverage:

```bash
# Run filter component tests
npm test -- src/components/filters

# Run with coverage
npm test -- --coverage src/components/filters
```

## Future Enhancements

Planned features for upcoming tasks:

1. **Smart Search Input** (Task 4) - Intelligent search with suggestions
2. **Advanced Filter Types** (Task 5) - Date pickers, range sliders
3. **Visual Filter Builder** (Task 6) - Drag-and-drop query builder
4. **Saved Searches** (Task 7) - Save and share filter configurations
5. **Search Analytics** (Task 8) - Track and analyze search patterns

## Related Files

- `src/lib/filters/AdvancedQueryBuilder.ts` - Query building logic
- `src/lib/filters/FilterProcessor.ts` - Filter validation and processing
- `src/lib/filters/FilterCache.ts` - Result caching
- `src/lib/filters/types.ts` - TypeScript type definitions
- `src/styles/advanced-filter.css` - Component styling

## Support

For questions or issues with the filter components, please refer to:
- Design document: `.kiro/specs/advanced-search-filter/design.md`
- Requirements: `.kiro/specs/advanced-search-filter/requirements.md`
- Task list: `.kiro/specs/advanced-search-filter/tasks.md`
