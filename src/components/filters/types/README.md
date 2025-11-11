# Advanced Filter Types

Type-specific filter components with MC Law blue styling for the advanced search system.

## Overview

This directory contains four specialized filter components that provide different input methods for various data types:

1. **TextFilter** - Text search with match types and case sensitivity
2. **DateFilter** - Calendar picker with preset date ranges
3. **RangeFilter** - Dual slider for numeric ranges
4. **BooleanFilter** - Toggle switch for yes/no options

All components follow the MC Law blue color scheme and provide consistent styling and behavior.

## Components

### TextFilter

Text-based filtering with multiple match types and case sensitivity control.

**Features:**
- Match types: contains, equals, startsWith, endsWith
- Case-sensitive toggle
- Real-time value updates
- MC Blue styling with gold accents

**Usage:**
```tsx
import { TextFilter } from './components/filters/types';

<TextFilter
  field="name"
  label="Search by Name"
  placeholder="Enter name..."
  onChange={(config) => console.log(config)}
/>
```

**Props:**
- `field` (string): Field identifier
- `label` (string): Display label
- `value` (string, optional): Initial value
- `matchType` (TextMatchType, optional): Initial match type
- `caseSensitive` (boolean, optional): Initial case sensitivity
- `onChange` (function): Callback with TextFilterConfig
- `placeholder` (string, optional): Input placeholder

### DateFilter

Date range filtering with preset options and custom date picker.

**Features:**
- Preset ranges: Today, This Week, This Month, This Year
- Custom date range selection
- MC Blue calendar styling
- Date range display

**Usage:**
```tsx
import { DateFilter } from './components/filters/types';

<DateFilter
  field="graduationDate"
  label="Graduation Date"
  onChange={(config) => console.log(config)}
  showPresets={true}
/>
```

**Props:**
- `field` (string): Field identifier
- `label` (string): Display label
- `startDate` (Date, optional): Initial start date
- `endDate` (Date, optional): Initial end date
- `preset` (DatePreset, optional): Initial preset
- `onChange` (function): Callback with DateFilterConfig
- `showPresets` (boolean, optional): Show preset buttons

### RangeFilter

Numeric range filtering with dual slider and input fields.

**Features:**
- Dual slider with gold handles
- Min/max value inputs
- Visual range indicator
- Configurable step size
- Custom value formatting

**Usage:**
```tsx
import { RangeFilter } from './components/filters/types';

<RangeFilter
  field="year"
  label="Graduation Year"
  min={1980}
  max={2025}
  currentMin={1990}
  currentMax={2020}
  step={1}
  onChange={(config) => console.log(config)}
  formatValue={(value) => value.toString()}
/>
```

**Props:**
- `field` (string): Field identifier
- `label` (string): Display label
- `min` (number): Minimum value
- `max` (number): Maximum value
- `currentMin` (number, optional): Initial min value
- `currentMax` (number, optional): Initial max value
- `step` (number, optional): Step increment
- `onChange` (function): Callback with RangeFilterConfig
- `formatValue` (function, optional): Value formatter

### BooleanFilter

Boolean filtering with toggle switch.

**Features:**
- Smooth toggle animation
- MC Blue/Gold color scheme
- On/Off labels
- Optional description
- Status badge

**Usage:**
```tsx
import { BooleanFilter } from './components/filters/types';

<BooleanFilter
  field="hasPhoto"
  label="Has Photo"
  description="Filter alumni records that include a photo"
  onLabel="With Photo"
  offLabel="No Photo"
  onChange={(config) => console.log(config)}
/>
```

**Props:**
- `field` (string): Field identifier
- `label` (string): Display label
- `value` (boolean, optional): Initial value
- `onChange` (function): Callback with BooleanFilterConfig
- `onLabel` (string, optional): Label for true state
- `offLabel` (string, optional): Label for false state
- `description` (string, optional): Help text

## Type Definitions

### TextFilterConfig
```typescript
interface TextFilterConfig {
  field: string;
  value: string;
  matchType: 'contains' | 'equals' | 'startsWith' | 'endsWith';
  caseSensitive: boolean;
}
```

### DateFilterConfig
```typescript
interface DateFilterConfig {
  field: string;
  startDate?: Date;
  endDate?: Date;
  preset?: 'today' | 'week' | 'month' | 'year' | 'custom';
}
```

### RangeFilterConfig
```typescript
interface RangeFilterConfig {
  field: string;
  min: number;
  max: number;
  step?: number;
}
```

### BooleanFilterConfig
```typescript
interface BooleanFilterConfig {
  field: string;
  value: boolean;
}
```

## Styling

All components use the MC Law blue color palette defined in `src/styles/advanced-filter.css`:

- **MC Blue** (#0C2340): Primary background
- **MC Gold** (#C99700): Accents, borders, and active states
- **MC White** (#FFFFFF): Text and highlights

### CSS Classes

Each filter type has its own set of CSS classes following BEM naming:

- `.text-filter`, `.text-filter__*`
- `.date-filter`, `.date-filter__*`
- `.range-filter`, `.range-filter__*`
- `.boolean-filter`, `.boolean-filter__*`

## Accessibility

All filter components include:

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus indicators with gold outlines
- Screen reader announcements
- Semantic HTML structure

### Keyboard Support

- **Tab**: Navigate between controls
- **Enter/Space**: Activate buttons and toggles
- **Arrow Keys**: Navigate suggestions (where applicable)
- **Esc**: Close dropdowns (where applicable)

## Example

See `FilterTypesExample.tsx` for a complete demonstration of all filter types in action.

To view the example:
```tsx
import { FilterTypesExample } from './components/filters/types/FilterTypesExample';

<FilterTypesExample />
```

## Integration

These filter types are designed to integrate with the Advanced Filter Panel and Query Builder:

```tsx
import { TextFilter, DateFilter, RangeFilter, BooleanFilter } from './components/filters/types';

// Use in your filter panel
<AdvancedFilterPanel>
  <TextFilter field="name" label="Name" onChange={handleTextFilter} />
  <DateFilter field="date" label="Date" onChange={handleDateFilter} />
  <RangeFilter field="year" label="Year" min={1980} max={2025} onChange={handleRangeFilter} />
  <BooleanFilter field="active" label="Active" onChange={handleBooleanFilter} />
</AdvancedFilterPanel>
```

## Requirements

Implements requirements from the Advanced Search Filter specification:

- **Requirement 5**: Advanced Filter Types
- **Requirement 12**: MC Law Blue Styling

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Debounced input handling
- Optimized re-renders
- Smooth animations (60fps)
- Reduced motion support
