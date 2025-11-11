# Smart Search Input with Suggestions

## Overview

This implementation provides an intelligent search input system with real-time suggestions, keyboard navigation, and MC Law blue styling. The system consists of three main components working together:

1. **SmartSearchInput** - Debounced search input with MC Law styling
2. **SuggestionEngine** - Intelligent suggestion generation and ranking
3. **SuggestionsDropdown** - Keyboard-navigable dropdown with grouped suggestions

## Components

### SmartSearchInput

A search input component with debounced input handling and MC Law blue styling.

**Features:**
- 150ms debounced input (configurable)
- MC Blue background with gold accents
- Search icon with gold color
- Clear button when text is present
- Focus/blur event handling
- Automatic suggestion requests

**Props:**
```typescript
interface SmartSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSuggestionRequest?: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}
```

**Usage:**
```tsx
<SmartSearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  onSuggestionRequest={handleSuggestionRequest}
  placeholder="Search..."
  debounceMs={150}
/>
```

### SuggestionEngine

Generates intelligent search suggestions based on history, popularity, and context.

**Features:**
- Recent search suggestions
- Popular search tracking
- Category-based suggestions
- Smart pattern matching
- Relevance ranking
- Local storage persistence
- Learning from user selections

**API:**
```typescript
class SuggestionEngine {
  // Generate suggestions for input
  async generateSuggestions(
    input: string,
    context?: FilterConfig
  ): Promise<Suggestion[]>

  // Record a search in history
  recordSearch(
    query: string,
    resultCount: number,
    filters?: FilterConfig
  ): void

  // Learn from user selection
  learnFromSelection(suggestion: Suggestion): void

  // Get search history
  getHistory(): HistoryEntry[]

  // Get popular searches
  getPopularSearchTerms(limit?: number): Array<{
    term: string;
    count: number;
  }>

  // Clear history
  clearHistory(): void
}
```

**Suggestion Types:**
- `recent` - Recent searches from history
- `popular` - Frequently searched terms
- `category` - Content type specific suggestions
- `smart` - Pattern-based intelligent suggestions

**Usage:**
```typescript
const engine = new SuggestionEngine({
  maxSuggestions: 10,
  maxHistorySize: 100,
  popularThreshold: 3
});

// Generate suggestions
const suggestions = await engine.generateSuggestions('john', filterContext);

// Record a search
engine.recordSearch('John Smith', 15, filterContext);

// Learn from selection
engine.learnFromSelection(selectedSuggestion);
```

### SuggestionsDropdown

Displays suggestions in a dropdown with keyboard navigation and MC Law styling.

**Features:**
- Grouped suggestions by type
- Gold dividers between groups
- Keyboard navigation (↑↓ Enter Esc)
- Mouse hover support
- Loading state
- Empty state
- Result count badges
- Category badges
- Smooth animations

**Props:**
```typescript
interface SuggestionsDropdownProps {
  suggestions: Suggestion[];
  isOpen: boolean;
  onSelect: (suggestion: Suggestion) => void;
  onClose: () => void;
  loading?: boolean;
  className?: string;
}
```

**Keyboard Navigation:**
- `↑` - Navigate up
- `↓` - Navigate down
- `Enter` - Select suggestion
- `Esc` - Close dropdown
- `Tab` - Close dropdown

**Usage:**
```tsx
<SuggestionsDropdown
  suggestions={suggestions}
  isOpen={showSuggestions}
  onSelect={handleSelect}
  onClose={handleClose}
  loading={loading}
/>
```

## Integration Example

See `SmartSearchExample.tsx` for a complete working example:

```tsx
import { SmartSearchInput } from './SmartSearchInput';
import { SuggestionsDropdown } from './SuggestionsDropdown';
import { SuggestionEngine } from '../../lib/filters/SuggestionEngine';

const MySearchComponent = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [engine] = useState(() => new SuggestionEngine());

  const handleSuggestionRequest = async (q: string) => {
    const results = await engine.generateSuggestions(q, context);
    setSuggestions(results);
    setShowSuggestions(true);
  };

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    engine.learnFromSelection(suggestion);
    engine.recordSearch(suggestion.text, 42, context);
  };

  return (
    <div style={{ position: 'relative' }}>
      <SmartSearchInput
        value={query}
        onChange={setQuery}
        onSuggestionRequest={handleSuggestionRequest}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      <SuggestionsDropdown
        suggestions={suggestions}
        isOpen={showSuggestions}
        onSelect={handleSelect}
        onClose={() => setShowSuggestions(false)}
      />
    </div>
  );
};
```

## Styling

All components use the MC Law blue color palette defined in `advanced-filter.css`:

**Colors:**
- MC Blue: `#0C2340` (Primary background)
- MC Gold: `#C99700` (Accents and borders)
- MC White: `#FFFFFF` (Text)

**CSS Variables:**
```css
--mc-blue: #0C2340
--mc-gold: #C99700
--mc-white: #FFFFFF
--mc-gold-light: rgba(201, 151, 0, 0.2)
--mc-gold-glow: rgba(201, 151, 0, 0.4)
```

## Performance

**Targets:**
- Suggestion generation: <100ms
- Debounce delay: 150ms
- Smooth 60fps animations
- Efficient local storage usage

**Optimizations:**
- Debounced input to reduce API calls
- Cached suggestions with TTL
- Efficient relevance ranking
- Virtual scrolling for large suggestion lists (future)

## Accessibility

**WCAG 2.1 AA Compliant:**
- Full keyboard navigation
- ARIA labels and roles
- Screen reader support
- Focus indicators with gold outlines
- High contrast (7:1 ratio)
- Reduced motion support

**Keyboard Shortcuts:**
- `/` - Focus search (when implemented globally)
- `↑↓` - Navigate suggestions
- `Enter` - Select suggestion
- `Esc` - Close dropdown
- `Tab` - Navigate away

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Testing

Run the example component to test:

```bash
npm run dev
# Navigate to the SmartSearchExample component
```

**Test Cases:**
1. Type to see suggestions appear
2. Use keyboard navigation
3. Select suggestions with Enter
4. Clear with X button
5. Check search history persistence
6. Verify popular searches tracking

## Future Enhancements

1. **Voice Search** - Speech-to-text integration
2. **Natural Language** - AI-powered query understanding
3. **Collaborative Filters** - Share searches with others
4. **Advanced Analytics** - ML-based insights
5. **Custom Suggestions** - User-defined suggestion sources
6. **Offline Support** - Service worker caching

## Requirements Met

This implementation satisfies **Requirement 2** from the design document:

✅ Real-time suggestions within 100ms
✅ MC Blue dropdown styling
✅ Immediate search execution on selection
✅ Search history prioritization
✅ Category grouping with gold dividers
✅ Full keyboard navigation (↑↓ Enter Esc)

## Files Created

- `src/components/filters/SmartSearchInput.tsx`
- `src/lib/filters/SuggestionEngine.ts`
- `src/components/filters/SuggestionsDropdown.tsx`
- `src/components/filters/SmartSearchExample.tsx`
- `src/styles/advanced-filter.css` (updated)

## Dependencies

No additional dependencies required. Uses only:
- React 18
- TypeScript
- CSS custom properties
- Local Storage API
