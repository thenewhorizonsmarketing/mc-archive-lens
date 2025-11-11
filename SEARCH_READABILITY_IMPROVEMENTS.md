# Search Interface Readability Improvements

## Changes Made

### 1. Full-Screen Expanded Search
- **Position**: Changed from absolute to fixed with centered positioning
- **Size**: Expanded to 95vw width and 90-95vh height for maximum screen usage
- **Max Width**: 1400px on desktop (1600px on large screens)
- **Z-index**: Increased to 1000 to ensure it's always on top

### 2. Backdrop Overlay
- Added dark backdrop (rgba(0, 0, 0, 0.75)) when search is expanded
- Backdrop blur effect for better focus on search interface
- Click backdrop to close search
- Smooth fade-in animation

### 3. Enhanced Text Readability

#### Header
- Increased padding: 32px 40px
- Larger title: 1.75rem (2rem on large screens)
- Larger icon: h-8 w-8
- Thicker border: 2px
- Better contrast background

#### Content Area
- Base font size: 1.125rem (1.25rem on large screens)
- Increased padding: 32px 40px 40px (40px 48px 48px on large screens)
- Line height: 1.6 for better readability

#### Input Fields
- Min height: 56px (64px on large screens)
- Font size: 1.25rem (1.375rem on large screens)
- Padding: 16px 20px (18px 24px on large screens)

#### Buttons
- Min height: 48px (52px on large screens)
- Font size: 1.125rem (1.25rem on large screens)
- Padding: 12px 24px (14px 28px on large screens)

#### Close Button
- Larger size: 52px × 52px
- Icon size: 28px × 28px
- Better touch target

### 4. Responsive Scaling

#### Desktop (1400px+)
- Maximum readability with largest text sizes
- Spacious padding for comfortable interaction

#### Tablet (768px - 1400px)
- Slightly reduced but still very readable
- 98vw width, 92-95vh height
- Font sizes: 1rem - 1.5rem range

#### Mobile (< 768px)
- Full viewport width (98vw)
- Nearly full height (92-95vh)
- Optimized font sizes: 0.95rem - 1.25rem
- Border radius reduced for edge-to-edge feel

#### Small Mobile (< 480px)
- Full screen experience (100vw, 95-98vh)
- No border radius for true full-screen
- Minimum readable font sizes maintained

### 5. Accessibility Improvements
- All interactive elements meet minimum touch target size (44px+)
- High contrast text for readability
- Proper focus states maintained
- Screen reader friendly labels
- Keyboard navigation support

## Result
- Search interface now takes up the full screen when expanded
- All text is properly sized for readability on any screen size
- Backdrop provides clear visual separation from homepage
- Smooth transitions and animations
- Consistent experience across all device sizes
- Touch-friendly for kiosk use

## Files Modified
1. `src/components/GlobalSearch.css` - Enhanced styling and responsiveness
2. `src/components/GlobalSearch.tsx` - Added backdrop overlay and improved structure
