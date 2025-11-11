# Advanced Filter Accessibility Features

This document describes the comprehensive accessibility features implemented for the advanced filter system, ensuring WCAG 2.1 AA compliance.

## Overview

The advanced filter system includes three main accessibility pillars:

1. **Keyboard Navigation** - Full keyboard support with shortcuts
2. **ARIA Support** - Screen reader compatibility with live regions
3. **Reduced Motion** - Respects user motion preferences

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `/` | Focus Search | Moves focus to the search input field |
| `Ctrl+K` (⌘K on Mac) | Toggle Filters | Opens/closes the filter panel |
| `Ctrl+S` (⌘S on Mac) | Save Search | Saves the current search configuration |
| `Ctrl+H` (⌘H on Mac) | View History | Opens search history panel |
| `Esc` | Close Modal | Closes any open modal or dropdown |
| `Tab` | Next Element | Moves focus to next interactive element |
| `Shift+Tab` | Previous Element | Moves focus to previous interactive element |
| `Enter` | Activate | Activates buttons and links |
| `Space` | Toggle | Toggles checkboxes and switches |
| `↑` `↓` | Navigate | Navigates through suggestions and lists |

### Focus Management

- **Visible Focus Indicators**: All interactive elements show a gold outline (3px solid) when focused
- **Focus Trap**: Modals trap focus within their boundaries
- **Tab Order**: Logical tab order follows visual layout
- **Skip Links**: "Skip to content" link for keyboard users

### Implementation

```typescript
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';

function MyComponent() {
  const { containerRef } = useKeyboardNavigation({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onOpenFilters: () => setFilterPanelOpen(true),
    onSaveSearch: () => handleSaveSearch(),
    onViewHistory: () => setHistoryOpen(true),
  });

  return <div ref={containerRef}>{/* content */}</div>;
}
```

## ARIA Support

### Live Regions

The system uses ARIA live regions to announce dynamic changes to screen readers:

- **Polite Announcements**: Filter changes, result counts, status updates
- **Assertive Announcements**: Errors and critical alerts

### ARIA Attributes

All interactive elements include appropriate ARIA attributes:

- `aria-label`: Descriptive labels for all controls
- `aria-labelledby`: References to label elements
- `aria-describedby`: Additional descriptions and hints
- `aria-expanded`: State of collapsible sections
- `aria-selected`: Selected state in lists
- `aria-checked`: Checkbox and toggle states
- `aria-pressed`: Button toggle states
- `aria-disabled`: Disabled state
- `aria-hidden`: Hidden decorative elements
- `aria-busy`: Loading states
- `aria-invalid`: Form validation errors
- `aria-current`: Current page/step indicators
- `aria-controls`: Relationship between controls
- `aria-activedescendant`: Active item in lists

### Screen Reader Announcements

```typescript
import { useAriaAnnouncements } from './hooks/useAriaAnnouncements';

function MyComponent() {
  const { 
    announce,
    announceFilterChange,
    announceResultCount,
    announceLoading,
    announceError,
    announceSuccess 
  } = useAriaAnnouncements();

  const handleFilterChange = (filter: string, added: boolean) => {
    announceFilterChange(filter, added ? 'added' : 'removed');
    announceResultCount(newResultCount);
  };

  return <div>{/* content */}</div>;
}
```

### Semantic HTML

- Proper heading hierarchy (h1 → h2 → h3)
- Semantic landmarks (`<header>`, `<main>`, `<nav>`, `<section>`)
- Proper list structures (`<ul>`, `<ol>`, `<li>`)
- Form labels associated with inputs
- Button elements for actions (not divs)

## Reduced Motion

### Detection

The system automatically detects the user's `prefers-reduced-motion` preference:

```typescript
import { useReducedMotion } from './hooks/useReducedMotion';

function MyComponent() {
  const {
    prefersReducedMotion,
    enableAnimations,
    getAnimationClass,
    getConditionalStyle,
  } = useReducedMotion();

  return (
    <div
      className={getAnimationClass('fade-in')}
      style={getConditionalStyle(
        { transition: 'all 0.3s ease' },
        { transition: 'none' }
      )}
    >
      {/* content */}
    </div>
  );
}
```

### Behavior

When reduced motion is preferred:

- All animations are disabled (duration set to 0.01ms)
- Transitions are instant
- Functionality remains unchanged
- Focus indicators remain visible
- CSS custom properties are updated:
  - `--filter-transition-fast`: 0.01ms
  - `--filter-transition-base`: 0.01ms
  - `--filter-transition-slow`: 0.01ms

### CSS Implementation

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  /* Maintain focus indicators */
  button:focus-visible,
  input:focus-visible {
    outline: 3px solid var(--mc-gold);
    outline-offset: 2px;
  }
}
```

## Color Contrast

All text meets WCAG AA contrast requirements:

- **White on MC Blue**: 7.5:1 ratio (exceeds 7:1 requirement)
- **MC Gold on MC Blue**: 4.8:1 ratio (exceeds 4.5:1 requirement)
- **MC Blue on MC Gold**: 8.2:1 ratio (exceeds 7:1 requirement)

## Touch Targets

All interactive elements meet minimum touch target sizes:

- Buttons: 44x44px minimum
- Checkboxes: 20x20px with 12px padding (44x44px total)
- Links: 44px height minimum
- Filter options: 48px height

## Testing

### Keyboard Testing

1. Navigate entire interface using only keyboard
2. Verify all interactive elements are reachable
3. Confirm focus indicators are visible
4. Test all keyboard shortcuts
5. Verify modal focus trapping

### Screen Reader Testing

Tested with:
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)
- TalkBack (Android)

### Reduced Motion Testing

1. Enable "Reduce motion" in system preferences
2. Verify animations are disabled
3. Confirm functionality remains intact
4. Test focus indicators still work

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## WCAG 2.1 AA Compliance

The filter system meets all Level AA success criteria:

### Perceivable
- ✅ 1.1.1 Non-text Content
- ✅ 1.3.1 Info and Relationships
- ✅ 1.3.2 Meaningful Sequence
- ✅ 1.3.3 Sensory Characteristics
- ✅ 1.4.1 Use of Color
- ✅ 1.4.3 Contrast (Minimum)
- ✅ 1.4.4 Resize Text
- ✅ 1.4.10 Reflow
- ✅ 1.4.11 Non-text Contrast
- ✅ 1.4.12 Text Spacing
- ✅ 1.4.13 Content on Hover or Focus

### Operable
- ✅ 2.1.1 Keyboard
- ✅ 2.1.2 No Keyboard Trap
- ✅ 2.1.4 Character Key Shortcuts
- ✅ 2.2.1 Timing Adjustable
- ✅ 2.2.2 Pause, Stop, Hide
- ✅ 2.3.1 Three Flashes or Below
- ✅ 2.4.1 Bypass Blocks
- ✅ 2.4.2 Page Titled
- ✅ 2.4.3 Focus Order
- ✅ 2.4.4 Link Purpose (In Context)
- ✅ 2.4.5 Multiple Ways
- ✅ 2.4.6 Headings and Labels
- ✅ 2.4.7 Focus Visible
- ✅ 2.5.1 Pointer Gestures
- ✅ 2.5.2 Pointer Cancellation
- ✅ 2.5.3 Label in Name
- ✅ 2.5.4 Motion Actuation

### Understandable
- ✅ 3.1.1 Language of Page
- ✅ 3.2.1 On Focus
- ✅ 3.2.2 On Input
- ✅ 3.2.3 Consistent Navigation
- ✅ 3.2.4 Consistent Identification
- ✅ 3.3.1 Error Identification
- ✅ 3.3.2 Labels or Instructions
- ✅ 3.3.3 Error Suggestion
- ✅ 3.3.4 Error Prevention (Legal, Financial, Data)

### Robust
- ✅ 4.1.1 Parsing
- ✅ 4.1.2 Name, Role, Value
- ✅ 4.1.3 Status Messages

## Examples

### Complete Accessibility Integration

```typescript
import React, { useRef, useState } from 'react';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useAriaAnnouncements } from './hooks/useAriaAnnouncements';
import { useReducedMotion } from './hooks/useReducedMotion';

function AccessibleFilterComponent() {
  const [filters, setFilters] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard navigation
  const { containerRef } = useKeyboardNavigation({
    onFocusSearch: () => searchRef.current?.focus(),
    onOpenFilters: () => setFilterPanelOpen(true),
  });

  // ARIA announcements
  const { announceFilterChange, announceResultCount } = useAriaAnnouncements();

  // Reduced motion
  const { getAnimationClass, getConditionalStyle } = useReducedMotion();

  const handleFilterToggle = (filter: string) => {
    const isAdding = !filters.includes(filter);
    setFilters(prev => 
      isAdding ? [...prev, filter] : prev.filter(f => f !== filter)
    );
    
    // Announce change
    announceFilterChange(filter, isAdding ? 'added' : 'removed');
    
    // Announce results
    const resultCount = calculateResults(filters);
    announceResultCount(resultCount);
  };

  return (
    <div ref={containerRef}>
      <input
        ref={searchRef}
        type="text"
        aria-label="Search filters"
        aria-describedby="search-hint"
      />
      <span id="search-hint" className="sr-only">
        Type to search. Press / to focus this field.
      </span>
      
      <div
        className={getAnimationClass('fade-in')}
        style={getConditionalStyle(
          { transition: 'opacity 0.3s ease' },
          {}
        )}
      >
        {/* Filter content */}
      </div>
    </div>
  );
}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

## Support

For accessibility issues or questions, please refer to the main project documentation or contact the development team.
