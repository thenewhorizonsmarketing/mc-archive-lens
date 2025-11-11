# Styled Filter Components

MC Law Blue themed components for the advanced filter system.

## Components

### FilterButton

Styled button component with primary and secondary variants.

```tsx
import { FilterButton } from './styled';

<FilterButton variant="primary" onClick={handleClick}>
  Apply Filters
</FilterButton>

<FilterButton variant="secondary" icon={<SearchIcon />}>
  Search
</FilterButton>
```

**Props:**
- `variant`: 'primary' | 'secondary' (default: 'secondary')
- `icon`: Optional icon element
- All standard button HTML attributes

### FilterChip

Chip component for displaying active filters with remove functionality.

```tsx
import { FilterChip } from './styled';

<FilterChip
  label="Year"
  value="2020"
  onRemove={() => removeFilter('year')}
/>
```

**Props:**
- `label`: Filter label text
- `value`: Optional filter value
- `onRemove`: Callback when remove button is clicked
- `className`: Additional CSS classes

### FilterInput

Styled input field with label, helper text, and error states.

```tsx
import { FilterInput } from './styled';

<FilterInput
  label="Search"
  placeholder="Enter search term..."
  icon={<SearchIcon />}
  helperText="Search by name or keyword"
  error={errors.search}
/>
```

**Props:**
- `label`: Optional label text
- `icon`: Optional icon element
- `helperText`: Optional helper text
- `error`: Optional error message
- All standard input HTML attributes

### FilterBadge

Badge component for displaying counts and indicators.

```tsx
import { FilterBadge } from './styled';

<FilterBadge count={42} size="small" />
<FilterBadge count="New" size="large" />
```

**Props:**
- `count`: Number or string to display
- `size`: 'small' | 'large' (default: 'small')
- `ariaLabel`: Optional accessibility label
- `className`: Additional CSS classes

### FilterSpinner

Loading spinner with MC Law blue theme.

```tsx
import { FilterSpinner } from './styled';

<FilterSpinner size="medium" ariaLabel="Loading results" />
```

**Props:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `ariaLabel`: Accessibility label (default: 'Loading')
- `className`: Additional CSS classes

## Color Palette

```css
--mc-blue: #0C2340    /* Primary background */
--mc-gold: #C99700    /* Accents and borders */
--mc-white: #FFFFFF   /* Text and highlights */
```

## Usage

All components automatically apply MC Law blue styling. Import the CSS file in your component:

```tsx
import '../../../styles/advanced-filter.css';
```

Or import it once in your main app file:

```tsx
import './styles/advanced-filter.css';
```

## Accessibility

All components include:
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus indicators with gold outlines
- Screen reader support
- Reduced motion support

## Theming

Components use CSS custom properties for easy theming. Override variables in your CSS:

```css
:root {
  --mc-blue: #0C2340;
  --mc-gold: #C99700;
  --mc-white: #FFFFFF;
}
```
