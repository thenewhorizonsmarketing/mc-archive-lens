# Visual Filter Builder

A drag-and-drop query builder for creating complex database filters with MC Law blue styling.

## Overview

The Visual Filter Builder provides an intuitive interface for constructing complex SQL queries without writing code. Users can drag and drop filter nodes, combine them with logical operators (AND/OR), and organize them into groups.

## Components

### VisualFilterBuilder

Main component that orchestrates the visual query building experience.

**Props:**
```typescript
interface VisualFilterBuilderProps {
  contentType: 'alumni' | 'publication' | 'photo' | 'faculty';
  onQueryChange?: (sql: string, params: any[]) => void;
  onFilterChange?: (rootNode: FilterNode) => void;
  initialNode?: FilterNode;
}
```

**Features:**
- Drag-and-drop interface
- Real-time SQL query generation
- Query optimization
- Export to JSON
- Collapsible nodes
- Visual drop zone highlights

### FilterNode

Represents a single filter with configurable conditions.

**Features:**
- Displays filter summary
- Expandable/collapsible
- Edit mode (placeholder for full implementation)
- Remove functionality
- Draggable

### OperatorNode

Represents a logical operator (AND/OR) that combines multiple conditions.

**Features:**
- Toggle between AND/OR
- Accepts child nodes
- Visual badge showing operator type
- Drop zone for adding children
- Draggable

### GroupNode

Container for organizing related filters together.

**Features:**
- Editable group name
- Accepts child nodes
- Visual grouping indicator
- Drop zone for adding children
- Draggable

## Usage

### Basic Example

```tsx
import VisualFilterBuilder from './components/filters/VisualFilterBuilder';

function MyComponent() {
  const handleQueryChange = (sql: string, params: any[]) => {
    console.log('Generated SQL:', sql);
    console.log('Parameters:', params);
  };

  return (
    <VisualFilterBuilder
      contentType="alumni"
      onQueryChange={handleQueryChange}
    />
  );
}
```

### With Initial Filter Tree

```tsx
const initialNode: FilterNode = {
  id: 'root',
  type: 'operator',
  operator: 'AND',
  children: [
    {
      id: 'filter-1',
      type: 'filter',
      filter: {
        type: 'alumni',
        operator: 'AND',
        textFilters: [
          {
            field: 'name',
            value: 'Smith',
            matchType: 'contains',
            caseSensitive: false,
          },
        ],
      },
    },
  ],
};

<VisualFilterBuilder
  contentType="alumni"
  initialNode={initialNode}
  onQueryChange={handleQueryChange}
/>
```

## Node Types

### Filter Node Structure

```typescript
{
  id: string;
  type: 'filter';
  filter: {
    type: 'alumni' | 'publication' | 'photo' | 'faculty';
    operator: 'AND' | 'OR';
    textFilters?: TextFilter[];
    dateFilters?: DateFilter[];
    rangeFilters?: RangeFilter[];
    booleanFilters?: BooleanFilter[];
  };
}
```

### Operator Node Structure

```typescript
{
  id: string;
  type: 'operator';
  operator: 'AND' | 'OR';
  children: FilterNode[];
}
```

### Group Node Structure

```typescript
{
  id: string;
  type: 'group';
  children: FilterNode[];
}
```

## Query Generation

The Visual Filter Builder automatically generates optimized SQL queries from the filter tree:

1. **Filter Nodes** → WHERE conditions
2. **Operator Nodes** → AND/OR combinations
3. **Group Nodes** → Parenthesized sub-queries

### Example Query Generation

**Filter Tree:**
```
AND
├── Filter: name contains "Smith"
└── OR
    ├── Filter: year equals "1980"
    └── Filter: year equals "1981"
```

**Generated SQL:**
```sql
SELECT t.*, 0 as relevance_score
FROM alumni t
WHERE (
  LOWER(t.name) LIKE LOWER(?)
  AND (
    t.year = ?
    OR t.year = ?
  )
)
ORDER BY t.id DESC
```

**Parameters:** `['%Smith%', '1980', '1981']`

## Drag and Drop

### How It Works

1. **Drag Start**: Click and hold on any node header
2. **Drag Over**: Hover over a valid drop target (operator or group node)
3. **Drop**: Release to add the node as a child
4. **Visual Feedback**: Drop targets highlight with gold glow

### Valid Drop Targets

- **Operator Nodes**: Can accept any child nodes
- **Group Nodes**: Can accept any child nodes
- **Root Node**: Always accepts new nodes

## Styling

All components use MC Law blue color scheme:

- **Primary Background**: `#0C2340` (MC Blue)
- **Accent Color**: `#C99700` (MC Gold)
- **Text Color**: `#FFFFFF` (White)

### CSS Classes

- `.visual-filter-builder` - Main container
- `.filter-node` - Filter node styling
- `.operator-node` - Operator node styling
- `.group-node` - Group node styling
- `.filter-node--drop-target` - Drop target highlight

## Keyboard Accessibility

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons
- **Escape**: Close modals/editors
- **Arrow Keys**: Navigate suggestions (when implemented)

## Query Validation

The builder validates queries in real-time:

- ✅ Valid SQL structure
- ⚠️ Missing WHERE clause
- ❌ Invalid SQL syntax
- ❌ Empty query

## Export/Import

### Export Query

```typescript
// Exports to JSON file
{
  "sql": "SELECT ...",
  "params": [...],
  "filterTree": {...}
}
```

### Import Query

Currently not implemented, but the structure supports it:

```typescript
const importedData = JSON.parse(jsonString);
<VisualFilterBuilder
  initialNode={importedData.filterTree}
  contentType="alumni"
/>
```

## Performance Considerations

- **Query Optimization**: Automatic removal of redundant conditions
- **Debouncing**: Query generation is debounced to prevent excessive updates
- **Virtual Scrolling**: For large filter trees (future enhancement)
- **Memoization**: Node rendering is optimized with React.memo (future enhancement)

## Future Enhancements

1. **Full Filter Editor**: Complete UI for editing filter configurations
2. **Filter Templates**: Pre-built filter combinations
3. **Query History**: Track and reuse previous queries
4. **Undo/Redo**: Support for reverting changes
5. **Keyboard Shortcuts**: Quick actions for power users
6. **Filter Validation**: Real-time validation of filter values
7. **Auto-Complete**: Suggestions for field names and values
8. **Query Explanation**: Human-readable description of the query

## Integration with Search System

The Visual Filter Builder integrates with the existing search infrastructure:

```typescript
import { AdvancedQueryBuilder } from '../../lib/filters/AdvancedQueryBuilder';
import { BrowserSearchManager } from '../../lib/database/browser-search-manager';

const queryBuilder = new AdvancedQueryBuilder();
const searchManager = new BrowserSearchManager();

// Generate query from visual builder
const { sql, params } = queryBuilder.buildQueryFromNodes(rootNode, 'alumni');

// Execute search
const results = await searchManager.executeQuery(sql, params);
```

## Testing

Example test cases:

```typescript
describe('VisualFilterBuilder', () => {
  it('should generate valid SQL for simple filter', () => {
    // Test implementation
  });

  it('should handle AND operator correctly', () => {
    // Test implementation
  });

  it('should handle nested groups', () => {
    // Test implementation
  });

  it('should optimize redundant conditions', () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Query Not Generating

- Ensure at least one filter node is added
- Check that filter nodes have valid configurations
- Verify content type is set correctly

### Drag and Drop Not Working

- Ensure nodes are draggable (check `draggable` attribute)
- Verify drop targets are accepting drops
- Check browser console for errors

### Styling Issues

- Ensure `advanced-filter.css` is imported
- Check CSS variable definitions
- Verify MC Law color palette is loaded

## Related Components

- `AdvancedFilterPanel` - Traditional filter interface
- `SmartSearchInput` - Search with suggestions
- `FilterProcessor` - Filter validation and processing
- `AdvancedQueryBuilder` - SQL query generation

## License

Part of the MC Law Alumni Database project.
