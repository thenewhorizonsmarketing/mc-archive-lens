# Design Document: 3D Clue Board Homepage

## Overview

Transform the MC Museum & Archives homepage into an immersive 3D Clue board-inspired interface featuring modern glassmorphism, smooth zoom animations, and MC Law branding. The design leverages cutting-edge CSS techniques including backdrop filters, 3D transforms, and multi-layer shadows to create a premium, tactile experience.

## Architecture

### Component Structure

```
HomePage (Updated)
├── ClueBoard (New)
│   ├── BoardFrame (New)
│   ├── CentralBranding (New)
│   └── RoomCardGrid (New)
│       └── RoomCard (New) × 4
└── GlobalSearch (Existing)
```

### Technology Stack

- **React 18** - Component framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling with custom extensions
- **Framer Motion** - Advanced animation library for zoom effects
- **CSS 3D Transforms** - Native browser 3D rendering
- **CSS Custom Properties** - Dynamic theming with MC Law colors

## Design System

### Color Palette (MC Law Brand)

```css
:root {
  /* Primary Colors */
  --mc-blue: #0C2340;           /* PANTONE 289 */
  --mc-gold: #C99700;           /* PANTONE 117 */
  --celestial-blue: #69B3E7;    /* PANTONE 292 */
  
  /* Derived Colors */
  --mc-blue-light: rgba(12, 35, 64, 0.8);
  --mc-blue-dark: rgba(12, 35, 64, 0.95);
  --mc-gold-light: rgba(201, 151, 0, 0.8);
  --mc-gold-glow: rgba(201, 151, 0, 0.3);
  
  /* Material Colors */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --wood-brown: #8B4513;
  --wood-dark: #654321;
}
```

### Typography

```css
/* Primary Font: New Atten (with fallbacks) */
--font-primary: 'New Atten', 'Source Sans 3', 'Trebuchet MS', sans-serif;
--font-primary-bold: 'New Atten Bold', 'Source Sans 3', sans-serif;
--font-primary-extra-bold: 'New Atten Extra Bold', 'Source Sans 3', sans-serif;

/* Secondary Font: PS Fournier (with fallbacks) */
--font-secondary: 'PS Fournier Std', 'Source Serif 4', 'Georgia', serif;
--font-secondary-grand: 'PS Fournier Std Grand', 'Source Serif 4', serif;
```

### Shadow System (Multi-Layer)

```css
/* Ambient Shadow - Soft, diffused */
--shadow-ambient: 0 2px 8px rgba(0, 0, 0, 0.04);

/* Direct Shadow - Stronger, directional */
--shadow-direct: 0 4px 16px rgba(0, 0, 0, 0.12);

/* Contact Shadow - Darkest, closest to surface */
--shadow-contact: 0 1px 2px rgba(0, 0, 0, 0.2);

/* Combined Elevation Shadows */
--shadow-sm: var(--shadow-ambient), var(--shadow-contact);
--shadow-md: var(--shadow-ambient), var(--shadow-direct), var(--shadow-contact);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16), var(--shadow-direct), var(--shadow-contact);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.24), var(--shadow-lg);

/* Gold Glow Shadow */
--shadow-gold-glow: 0 0 20px var(--mc-gold-glow), 0 0 40px var(--mc-gold-glow);
```

## Components

### 1. ClueBoard Container

**Purpose:** Main container providing 3D perspective and board game aesthetic

**Structure:**
```tsx
<div className="clue-board">
  <BoardFrame />
  <div className="board-content">
    <CentralBranding />
    <RoomCardGrid />
  </div>
</div>
```

**Styling:**
```css
.clue-board {
  perspective: 1200px;
  perspective-origin: center center;
  min-height: 100vh;
  background: linear-gradient(135deg, 
    var(--mc-blue-dark) 0%, 
    var(--mc-blue) 50%, 
    var(--mc-blue-light) 100%
  );
  position: relative;
  overflow: hidden;
}

/* Subtle noise texture overlay */
.clue-board::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('data:image/svg+xml,...'); /* Noise pattern */
  opacity: 0.03;
  pointer-events: none;
}
```

### 2. BoardFrame Component

**Purpose:** Decorative wood frame border with 3D depth

**Structure:**
```tsx
<div className="board-frame">
  <div className="frame-top" />
  <div className="frame-right" />
  <div className="frame-bottom" />
  <div className="frame-left" />
  <div className="frame-corner frame-corner-tl" />
  <div className="frame-corner frame-corner-tr" />
  <div className="frame-corner frame-corner-bl" />
  <div className="frame-corner frame-corner-br" />
</div>
```

**Styling:**
```css
.board-frame {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.frame-top, .frame-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(180deg, var(--wood-dark), var(--wood-brown));
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3),
              inset 0 -2px 4px rgba(255, 255, 255, 0.1);
}

.frame-top { top: 0; }
.frame-bottom { bottom: 0; }

/* Similar for left/right and corners */
```

### 3. CentralBranding Component

**Purpose:** Central "Clue" branded area with MC Law identity

**Structure:**
```tsx
<div className="central-branding">
  <div className="branding-inset">
    <h1 className="branding-title">MC Museum & Archives</h1>
    <p className="branding-tagline">Explore our history, alumni, and legacy</p>
    <div className="branding-emblem">
      {/* Optional: MC Law seal/logo */}
    </div>
  </div>
</div>
```

**Styling:**
```css
.central-branding {
  position: relative;
  background: var(--mc-blue-dark);
  border: 3px solid var(--mc-gold);
  border-radius: 16px;
  padding: 48px;
  transform: translateZ(20px);
  box-shadow: var(--shadow-lg), var(--shadow-gold-glow);
}

.branding-inset {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05), 
    rgba(255, 255, 255, 0.02)
  );
  border-radius: 12px;
  padding: 32px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.branding-title {
  font-family: var(--font-primary-extra-bold);
  font-size: 3rem;
  color: var(--mc-gold);
  text-align: center;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.02em;
}

.branding-tagline {
  font-family: var(--font-secondary);
  font-size: 1.25rem;
  color: var(--celestial-blue);
  text-align: center;
  margin-top: 12px;
}
```

### 4. RoomCard Component

**Purpose:** Interactive 3D card for each collection with glassmorphism

**Props:**
```typescript
interface RoomCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

**Structure:**
```tsx
<motion.div 
  className="room-card"
  whileHover={{ scale: 1.05, translateY: -8 }}
  whileTap={{ scale: 0.98 }}
  onClick={handleClick}
>
  <div className="card-glass">
    <div className="card-icon">{icon}</div>
    <h3 className="card-title">{title}</h3>
    <p className="card-description">{description}</p>
    <div className="card-shine" />
  </div>
</motion.div>
```

**Styling:**
```css
.room-card {
  position: relative;
  width: 280px;
  height: 320px;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-glass {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.15),
    rgba(255, 255, 255, 0.05)
  );
  backdrop-filter: blur(10px) saturate(180%);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  padding: 32px;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
  transform: translateZ(10px);
}

/* Hover state */
.room-card:hover .card-glass {
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.1)
  );
  border-color: var(--mc-gold);
  box-shadow: var(--shadow-lg), var(--shadow-gold-glow);
}

/* Shine effect overlay */
.card-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.room-card:hover .card-shine {
  transform: translateX(100%);
}

.card-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  color: var(--mc-gold);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.card-title {
  font-family: var(--font-primary-bold);
  font-size: 1.75rem;
  color: white;
  text-align: center;
  margin-bottom: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.card-description {
  font-family: var(--font-primary);
  font-size: 0.95rem;
  color: var(--celestial-blue);
  text-align: center;
  line-height: 1.5;
}
```

### 5. Zoom Animation System

**Purpose:** Smooth zoom-in effect on card click before navigation

**Implementation using Framer Motion:**

```typescript
const RoomCard: React.FC<RoomCardProps> = ({ title, onClick, ...props }) => {
  const [isZooming, setIsZooming] = useState(false);
  
  const handleClick = async () => {
    setIsZooming(true);
    
    // Wait for zoom animation to complete
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Navigate to room
    onClick();
  };
  
  return (
    <motion.div
      className="room-card"
      animate={isZooming ? {
        scale: 1.5,
        z: 100,
        opacity: 1
      } : {
        scale: 1,
        z: 0,
        opacity: 1
      }}
      transition={{
        duration: 0.6,
        ease: [0.43, 0.13, 0.23, 0.96] // Custom cubic-bezier
      }}
      onClick={handleClick}
    >
      {/* Card content */}
    </motion.div>
  );
};
```

**Sibling Card Fade Effect:**

```typescript
const RoomCardGrid: React.FC = () => {
  const [zoomingCard, setZoomingCard] = useState<string | null>(null);
  
  return (
    <div className="room-card-grid">
      {rooms.map(room => (
        <motion.div
          key={room.id}
          animate={{
            opacity: zoomingCard && zoomingCard !== room.id ? 0 : 1,
            scale: zoomingCard && zoomingCard !== room.id ? 0.9 : 1
          }}
          transition={{ duration: 0.4 }}
        >
          <RoomCard
            {...room}
            onZoomStart={() => setZoomingCard(room.id)}
          />
        </motion.div>
      ))}
    </div>
  );
};
```

## Layout

### Grid System

```css
.room-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 48px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 32px;
}

/* Responsive breakpoints */
@media (max-width: 1024px) {
  .room-card-grid {
    gap: 32px;
    padding: 48px 24px;
  }
}

@media (max-width: 768px) {
  .room-card-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
```

### Positioning Strategy

```
┌─────────────────────────────────────┐
│         Board Frame (Wood)          │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │    ┌─────┐     ┌─────┐       │  │
│  │    │ Alm │     │ Pub │       │  │
│  │    └─────┘     └─────┘       │  │
│  │                               │  │
│  │      ┌─────────────┐          │  │
│  │      │   Central   │          │  │
│  │      │  Branding   │          │  │
│  │      └─────────────┘          │  │
│  │                               │  │
│  │    ┌─────┐     ┌─────┐       │  │
│  │    │ Pho │     │ Fac │       │  │
│  │    └─────┘     └─────┘       │  │
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Animation Specifications

### Hover Animation

```typescript
const hoverAnimation = {
  scale: 1.05,
  translateY: -8,
  rotateX: 5,
  transition: {
    duration: 0.3,
    ease: 'easeOut'
  }
};
```

### Click/Zoom Animation

```typescript
const zoomAnimation = {
  scale: 1.5,
  z: 100,
  transition: {
    duration: 0.6,
    ease: [0.43, 0.13, 0.23, 0.96] // Custom easing
  }
};
```

### Fade Out Animation (Siblings)

```typescript
const fadeOutAnimation = {
  opacity: 0,
  scale: 0.9,
  transition: {
    duration: 0.4,
    ease: 'easeIn'
  }
};
```

## Accessibility

### Keyboard Navigation

```typescript
const RoomCard: React.FC<RoomCardProps> = (props) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Navigate to ${props.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onClick();
        }
      }}
    >
      {/* Card content */}
    </div>
  );
};
```

### ARIA Labels

```tsx
<div className="clue-board" aria-label="MC Museum & Archives Navigation Board">
  <div className="central-branding" role="banner">
    <h1 id="page-title">MC Museum & Archives</h1>
  </div>
  <nav aria-labelledby="page-title" className="room-card-grid">
    {/* Room cards */}
  </nav>
</div>
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .room-card,
  .card-shine,
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Optimizations

### CSS Containment

```css
.room-card {
  contain: layout style paint;
}
```

### GPU Acceleration

```css
.room-card,
.card-glass {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}
```

### Lazy Loading

```typescript
// Defer non-critical animations
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);
  
  return prefersReducedMotion;
};
```

## Testing Strategy

### Visual Regression Tests
- Snapshot tests for each card state (default, hover, zooming)
- Cross-browser rendering tests (Chrome, Firefox, Safari)

### Animation Performance Tests
- FPS monitoring during zoom animations
- Memory usage during transitions
- Touch responsiveness on kiosk hardware

### Accessibility Tests
- Keyboard navigation flow
- Screen reader compatibility
- Color contrast validation (WCAG 2.1 AA)

## Implementation Notes

1. **Framer Motion** is required for smooth zoom animations
2. **CSS backdrop-filter** requires modern browser support (check caniuse.com)
3. **Custom fonts** (New Atten, PS Fournier) need to be loaded via Adobe Fonts or self-hosted
4. **3D transforms** work best with hardware acceleration enabled
5. **Touch events** should be tested on actual kiosk hardware for optimal responsiveness

## Browser Support

- Chrome/Edge 88+
- Firefox 103+
- Safari 15.4+
- Modern kiosk browsers with CSS 3D transform support

## Future Enhancements

- Parallax effect on mouse movement
- Particle effects on hover
- Sound effects on interaction (optional)
- Dynamic lighting based on time of day
- Seasonal theme variations
