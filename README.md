# MCLAW Kiosk Application

A touchscreen kiosk application for browsing Mississippi College School of Law alumni, publications, photos, and faculty information.

## Project Overview

This application provides an interactive kiosk experience with:

- **3D Clue Board Interface**: Navigate through content using an interactive 3D board
- **Four Content Rooms**: Browse Alumni, Publications, Photos, and Faculty
- **Full-Text Search**: Powerful SQLite FTS5 search across all content
- **Touchscreen Optimized**: Large touch targets, on-screen keyboard, gesture support
- **Offline Operation**: Fully functional without internet connection
- **Accessibility**: WCAG AA compliant with keyboard navigation and screen reader support

## Features

### Content Browsing

- **Alumni Room**: Browse alumni by graduation year, department, and class
- **Publications Room**: Explore academic publications, journals, and documents
- **Photos Room**: View historical photographs organized by collection and year
- **Faculty Room**: Learn about faculty members and their specializations

### Search and Filtering

- Real-time full-text search across all content types
- Advanced filtering by year, department, collection, and more
- URL-based deep linking to specific records
- Cached results for improved performance

### Kiosk Features

- Fullscreen kiosk mode with idle timeout and attract loop
- Admin overlay for system management (4-corner gesture)
- Performance monitoring and optimization
- Automatic error recovery and fallback modes
- Touch-optimized on-screen keyboard

## Quick Start

### Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Kiosk Deployment

```sh
# Build and package for Electron
npm run build
npm run electron:build

# Deploy to kiosk hardware
# See docs/DEPLOYMENT.md for detailed instructions
```

## Documentation

### User Guides

- [Content Pages User Guide](docs/CONTENT_PAGES_GUIDE.md) - How to browse and search content
- [Kiosk Search User Guide](docs/KIOSK_SEARCH_USER_GUIDE.md) - Using the fullscreen search interface
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

### Developer Guides

- [Content Pages Developer Guide](docs/CONTENT_PAGES_DEVELOPER_GUIDE.md) - Architecture and implementation
- [Kiosk Search Developer Guide](docs/KIOSK_SEARCH_DEVELOPER_GUIDE.md) - Search system details
- [3D Board Implementation](src/components/3d/README.md) - 3D scene and components
- [Database Schema](src/lib/database/schema.ts) - Database structure and types

### Deployment and Operations

- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [Kiosk Setup](docs/KIOSK_SETUP.md) - Hardware and software setup
- [Offline Operation](docs/OFFLINE_OPERATION.md) - Offline functionality details
- [Performance Optimization](docs/BOOT_PERFORMANCE.md) - Performance tuning

### Technical Documentation

- [Accessibility](docs/ACCESSIBILITY.md) - Accessibility features and compliance
- [Asset Optimization](docs/ASSET_OPTIMIZATION.md) - 3D asset optimization
- [URL Deep Linking](docs/URL_DEEP_LINKING_GUIDE.md) - URL parameter system
- [FPS Performance](docs/FPS_PERFORMANCE.md) - Frame rate optimization

## Technology Stack

### Core Technologies

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **Electron** - Desktop application framework

### 3D Graphics

- **Three.js** - 3D rendering engine
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F

### Database and Search

- **SQLite** - Embedded database
- **FTS5** - Full-text search extension
- **sql.js** - SQLite compiled to WebAssembly

### UI Components

- **shadcn/ui** - Component library
- **Tailwind CSS** - Utility-first CSS
- **Radix UI** - Accessible component primitives

### State Management

- **Zustand** - Lightweight state management
- **React Context** - Global state for search and database

### Testing

- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **Testing Library** - React component testing

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── 3d/             # 3D scene components
│   │   ├── admin/          # Admin panel components
│   │   ├── content/        # Content browsing components
│   │   ├── kiosk/          # Kiosk-specific components
│   │   ├── search/         # Search interface components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   │   ├── database/       # Database and search logic
│   │   ├── assets/         # Asset loading and optimization
│   │   ├── config/         # Configuration management
│   │   └── utils/          # Utility functions
│   ├── pages/              # Page components
│   ├── store/              # Zustand stores
│   └── styles/             # Global styles
├── public/                 # Static assets
│   ├── assets/            # 3D models and textures
│   ├── config/            # Configuration files
│   ├── images/            # Image assets
│   └── photos/            # Photo collections
├── electron/              # Electron main process
├── docs/                  # Documentation
└── scripts/               # Build and deployment scripts
```

## Key Components

### Content Pages

- `AlumniRoom.tsx` - Alumni browsing page
- `PublicationsRoom.tsx` - Publications browsing page
- `PhotosRoom.tsx` - Photos browsing page
- `FacultyRoom.tsx` - Faculty browsing page

### Shared Components

- `ContentList` - Reusable list component with loading states
- `RecordCard` - Card component for displaying records
- `RecordDetail` - Modal for displaying full record details
- `FilterPanel` - Reusable filter controls

### Hooks

- `useContentData` - Data fetching, filtering, and pagination
- `useContentDataWithUrl` - URL parameter synchronization
- `useSearch` - Access to search manager context
- `useIdleTimer` - Idle detection for kiosk mode

## Configuration

### Kiosk Configuration

Edit `public/config/config.json`:

```json
{
  "kiosk": {
    "idleTimeout": 120000,
    "attractLoopEnabled": true,
    "adminGestureEnabled": true
  },
  "search": {
    "debounceDelay": 300,
    "maxResults": 100,
    "cacheEnabled": true
  },
  "performance": {
    "motionTierDetection": true,
    "targetFPS": 60,
    "enablePreloading": true
  }
}
```

### Room Configuration

Edit `public/config/rooms.json` to customize room cards and navigation.

## Development

### Running Tests

```sh
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Code Quality

```sh
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

### Performance Validation

```sh
# Validate FPS performance
npm run validate:fps

# Validate boot performance
npm run validate:boot

# Validate touch targets
npm run validate:touch

# Run all validations
npm run validate:all
```

## Deployment

### Production Build

```sh
# Build web application
npm run build

# Build Electron application
npm run electron:build

# Deploy to kiosk
npm run deploy
```

### Deployment Checklist

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment instructions.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Targets

- Initial load: < 3 seconds
- Time to interactive: < 5 seconds
- Frame rate: 60 FPS (or 30 FPS on low-end hardware)
- Search response: < 200ms
- Filter updates: < 200ms

## Accessibility

- WCAG 2.1 Level AA compliant
- Full keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Reduced motion support
- Touch target size: minimum 44x44px

## License

See [LICENSE.txt](LICENSE.txt) for details.

## Support

For technical issues or questions:

1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Review relevant documentation in the `docs/` directory
3. Check the admin panel for system status
4. Review browser console for error messages

## Contributing

This project follows standard React and TypeScript best practices. When contributing:

1. Write tests for new features
2. Follow the existing code style
3. Update documentation as needed
4. Ensure accessibility compliance
5. Test on target hardware when possible
