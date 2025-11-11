# Accessibility Guide

## Overview

This document describes the accessibility features implemented in the search system to ensure WCAG 2.1 Level AA compliance and provide an inclusive experience for all users.

## Table of Contents

1. [WCAG 2.1 AA Compliance](#wcag-21-aa-compliance)
2. [Accessibility Features](#accessibility-features)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Reader Support](#screen-reader-support)
5. [Visual Accessibility](#visual-accessibility)
6. [Touch Accessibility](#touch-accessibility)
7. [Audio Feedback](#audio-feedback)
8. [Testing Accessibility](#testing-accessibility)
9. [Best Practices](#best-practices)

## WCAG 2.1 AA Compliance

### Perceivable

#### Text Alternatives (1.1.1)
- All images have descriptive alt text
- Icons are accompanied by text labels or ARIA labels
- Decorative images use empty alt attributes

#### Time-based Media (1.2)
- Audio feedback can be disabled
- Visual alternatives provided for audio content

#### Adaptable (1.3)
- Semantic HTML structure
- Proper heading hierarchy
- ARIA landmarks for navigation
- Form labels properly associated with inputs

#### Distinguishable (1.4)
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **High Contrast Mode**: Available for users who need enhanced contrast
- **Text Resize**: Text can be resized up to 200% without loss of functionality
- **Text Spacing**: Adequate spacing between lines, paragraphs, and letters

### Operable

#### Keyboard Accessible (2.1)
- All functionality available via keyboard
- No keyboard traps
- Logical tab order
- Visible focus indicators

#### Enough Time (2.2)
- No time limits on search operations
- Users can control timing of interactions

#### Seizures and Physical Reactions (2.3)
- No flashing content
- Reduced motion option available

#### Navigable (2.4)
- Skip links to main content
- Descriptive page titles
- Clear focus order
- Multiple ways to navigate
- Descriptive link text

#### Input Modalities (2.5)
- Touch targets minimum 44x44 pixels
- Pointer gestures have keyboard alternatives
- Motion actuation can be disabled

### Understandable

#### Readable (3.1)
- Clear, simple language
- Consistent terminology
- Abbreviations explained

#### Predictable (3.2)
- Consistent navigation
- Consistent identification
- No unexpected context changes

#### Input Assistance (3.3)
- Error identification
- Labels and instructions
- Error suggestions
- Error prevention

### Robust

#### Compatible (4.1)
- Valid HTML
- Proper ARIA usage
- Status messages announced

## Accessibility Features

### High Contrast Mode

Provides enhanced visual contrast for users with low vision:

```typescript
// Enable high contrast mode
accessibilityManager.updateOptions({ highContrast: true });
```

Features:
- Black text on white background
- Bold borders (2px minimum)
- Enhanced focus indicators (3px outline)
- Simplified color palette

### Large Text Mode

Increases text size for better readability:

```typescript
// Enable large text mode
accessibilityManager.updateOptions({ largeText: true });
```

Features:
- Base font size: 1.25rem (20px)
- Proportionally scaled headings
- Increased padding and spacing
- Larger touch targets

### Reduced Motion

Minimizes animations for users sensitive to motion:

```typescript
// Enable reduced motion
accessibilityManager.updateOptions({ reducedMotion: true });
```

Features:
- Animations reduced to 0.01ms
- Transitions minimized
- Auto-scroll disabled
- Respects `prefers-reduced-motion` system setting

### Screen Reader Mode

Optimizes experience for screen reader users:

```typescript
// Enable screen reader mode
accessibilityManager.updateOptions({ screenReaderMode: true });
```

Features:
- Enhanced ARIA labels
- Live region announcements
- Descriptive button text
- Semantic HTML structure

## Keyboard Navigation

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + S` | Focus search input |
| `Alt + F` | Focus filters |
| `Alt + R` | Focus results |
| `Alt + H` | Toggle high contrast |
| `Alt + T` | Toggle large text |
| `Alt + A` | Toggle audio feedback |
| `Escape` | Clear focus / Close panels |
| `F1` | Show keyboard help |

### Navigation Keys

| Key | Action |
|-----|--------|
| `Tab` | Move to next focusable element |
| `Shift + Tab` | Move to previous focusable element |
| `Enter` | Activate button / link |
| `Space` | Activate button / toggle checkbox |
| `Arrow Keys` | Navigate within components |
| `Home` | Jump to first item |
| `End` | Jump to last item |

### Focus Management

```typescript
// Track focus changes
accessibilityManager.trackFocus(event);

// Get current focus
const currentFocus = accessibilityManager.getState().currentFocus;

// Focus specific element
accessibilityManager.focusSearchInput();
accessibilityManager.focusFilters();
accessibilityManager.focusResults();
```

## Screen Reader Support

### ARIA Labels

All interactive elements have descriptive ARIA labels:

```tsx
<button
  aria-label="Search for alumni, publications, photos, and faculty"
  aria-describedby="search-hint"
>
  Search
</button>

<span id="search-hint" className="sr-only">
  Enter at least 2 characters to begin searching
</span>
```

### Live Regions

Dynamic content changes are announced:

```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
  Found 42 results for "John Smith"
</div>
```

### Semantic HTML

Proper HTML structure for screen readers:

```tsx
<main role="main">
  <section aria-label="Search interface">
    <form role="search">
      <input type="search" aria-label="Search query" />
    </form>
  </section>
  
  <section aria-label="Search results">
    <ul role="list">
      <li role="listitem">...</li>
    </ul>
  </section>
</main>
```

### Announcements

```typescript
// Announce to screen readers
accessibilityManager.announce('Search completed. Found 42 results.');

// Urgent announcement
accessibilityManager.announce('Error: Search failed', 'assertive');
```

## Visual Accessibility

### Color Contrast

All text meets WCAG AA standards:

- **Normal text**: 4.5:1 minimum contrast ratio
- **Large text** (18pt+): 3:1 minimum contrast ratio
- **UI components**: 3:1 minimum contrast ratio

Example color combinations:
- Black (#000000) on White (#FFFFFF): 21:1 ✓
- Dark Gray (#333333) on White (#FFFFFF): 12.6:1 ✓
- Blue (#0066CC) on White (#FFFFFF): 7.7:1 ✓

### Focus Indicators

Visible focus indicators on all interactive elements:

```css
:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

.keyboard-navigation :focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 3px;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.2);
}
```

### Text Sizing

Text can be resized up to 200% without loss of functionality:

```css
.large-text {
  font-size: 1.25rem; /* 125% of base */
}

.large-text h1 {
  font-size: 3rem; /* Proportionally scaled */
}
```

## Touch Accessibility

### Touch Target Size

All interactive elements meet minimum size requirements:

- **Minimum size**: 44x44 pixels (WCAG 2.1 Level AA)
- **Recommended size**: 48x48 pixels for mobile
- **Spacing**: 8px minimum between targets

```css
button,
a,
[role="button"] {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 16px;
}
```

### Touch Gestures

All touch gestures have keyboard alternatives:

- Swipe → Arrow keys
- Pinch zoom → Ctrl + Plus/Minus
- Long press → Context menu key

### Touch Feedback

Visual and haptic feedback for touch interactions:

```tsx
<button
  onTouchStart={() => {
    // Visual feedback
    element.classList.add('active');
    
    // Haptic feedback (if supported)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }}
>
  Click me
</button>
```

## Audio Feedback

### Speech Synthesis

Text-to-speech for important announcements:

```typescript
// Enable audio feedback
accessibilityManager.updateOptions({ audioFeedback: true });

// Announce with speech
accessibilityManager.announce('Search completed');
```

### Audio Settings

```typescript
const utterance = new SpeechSynthesisUtterance(message);
utterance.rate = 1.2;    // Speaking rate
utterance.pitch = 1.0;   // Voice pitch
utterance.volume = 0.8;  // Volume level
```

### Audio Alternatives

All audio content has visual alternatives:

- Search status shown visually
- Error messages displayed as text
- Progress indicators visible

## Testing Accessibility

### Automated Testing

Run accessibility tests:

```bash
npm run test:accessibility
```

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] All interactive elements reachable via Tab
- [ ] Focus order is logical
- [ ] No keyboard traps
- [ ] Visible focus indicators
- [ ] Shortcuts work as expected

#### Screen Reader
- [ ] All content announced correctly
- [ ] ARIA labels are descriptive
- [ ] Live regions announce changes
- [ ] Form labels properly associated
- [ ] Headings create logical structure

#### Visual
- [ ] Color contrast meets standards
- [ ] Text resizable to 200%
- [ ] High contrast mode works
- [ ] Focus indicators visible
- [ ] No information conveyed by color alone

#### Touch
- [ ] Touch targets minimum 44x44px
- [ ] Adequate spacing between targets
- [ ] Touch feedback provided
- [ ] Gestures have alternatives

### Testing Tools

- **axe DevTools**: Browser extension for automated testing
- **WAVE**: Web accessibility evaluation tool
- **NVDA**: Free screen reader for Windows
- **JAWS**: Professional screen reader
- **VoiceOver**: Built-in macOS/iOS screen reader
- **Lighthouse**: Chrome DevTools accessibility audit

### Screen Reader Testing

#### NVDA (Windows)
```
1. Install NVDA from nvaccess.org
2. Press Ctrl+Alt+N to start
3. Navigate with Tab and Arrow keys
4. Listen for announcements
```

#### VoiceOver (macOS)
```
1. Press Cmd+F5 to enable
2. Use Ctrl+Option+Arrow keys to navigate
3. Press Ctrl+Option+Space to activate
```

#### JAWS (Windows)
```
1. Start JAWS
2. Navigate with Tab and Arrow keys
3. Use Insert+F7 for links list
4. Use Insert+F5 for forms list
```

## Best Practices

### Development Guidelines

1. **Use Semantic HTML**
   ```tsx
   // Good
   <button onClick={handleClick}>Submit</button>
   
   // Bad
   <div onClick={handleClick}>Submit</div>
   ```

2. **Provide Text Alternatives**
   ```tsx
   // Good
   <img src="photo.jpg" alt="John Smith, Class of 2020" />
   
   // Bad
   <img src="photo.jpg" />
   ```

3. **Label Form Inputs**
   ```tsx
   // Good
   <label htmlFor="search">Search</label>
   <input id="search" type="text" />
   
   // Bad
   <input type="text" placeholder="Search" />
   ```

4. **Use ARIA Appropriately**
   ```tsx
   // Good
   <button aria-label="Close dialog">×</button>
   
   // Unnecessary
   <button aria-label="Submit">Submit</button>
   ```

5. **Ensure Keyboard Access**
   ```tsx
   // Good
   <button onClick={handleClick}>Click</button>
   
   // Bad
   <div onClick={handleClick}>Click</div>
   ```

### Content Guidelines

1. **Write Clear Labels**
   - Use descriptive, concise text
   - Avoid jargon and abbreviations
   - Be consistent with terminology

2. **Provide Instructions**
   - Explain how to use features
   - Describe expected input format
   - Offer examples

3. **Handle Errors Gracefully**
   - Identify errors clearly
   - Explain what went wrong
   - Suggest how to fix

4. **Use Headings Properly**
   - Create logical hierarchy
   - Don't skip levels
   - Make headings descriptive

### Design Guidelines

1. **Color Contrast**
   - Test all color combinations
   - Don't rely on color alone
   - Provide patterns or icons

2. **Touch Targets**
   - Minimum 44x44 pixels
   - Adequate spacing
   - Clear hit areas

3. **Focus Indicators**
   - Always visible
   - High contrast
   - Clear boundaries

4. **Responsive Design**
   - Works at all zoom levels
   - Adapts to screen sizes
   - Maintains functionality

## Resources

### WCAG Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [How to Meet WCAG](https://www.w3.org/WAI/WCAG21/quickref/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Pa11y](https://pa11y.org/)

### Screen Readers
- [NVDA](https://www.nvaccess.org/)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/)

### Learning Resources
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Inclusive Components](https://inclusive-components.design/)

## Support

For accessibility issues or questions:
- Email: accessibility@example.com
- Report issues: GitHub Issues
- Documentation: /docs/ACCESSIBILITY.md

## Compliance Statement

This application strives to meet WCAG 2.1 Level AA standards. We are committed to providing an accessible experience for all users. If you encounter any accessibility barriers, please contact us.

Last Updated: November 10, 2025
