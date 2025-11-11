# Asset Loading System

This directory contains the asset loading and validation system for the 3D Clue Board Kiosk.

## Overview

The asset loading system handles:
- Preloading 3D models (glTF/GLB)
- Preloading textures (KTX2/PNG/JPG)
- Preloading fonts (WOFF2)
- Progress tracking and reporting
- Asset budget validation
- Loading metrics and diagnostics

## Components

### AssetLoader

React component that preloads all assets defined in the manifest.

```tsx
import { AssetLoader } from '@/lib/assets';

<AssetLoader
  manifest={manifest}
  onProgress={(progress) => {
    console.log(`Loading: ${progress.percentage}%`);
  }}
  onComplete={(assets) => {
    console.log('All assets loaded');
  }}
  onError={(error) => {
    console.error('Loading failed:', error);
  }}
>
  {/* Your app content */}
</AssetLoader>
```

### AssetValidator

Validates asset manifest against performance budgets.

```tsx
import { AssetValidator } from '@/lib/assets';

const result = AssetValidator.validate(manifest);
AssetValidator.logResults(result);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
}
```

### LoadingScreen

Visual loading screen component with progress bar.

```tsx
import { LoadingScreen } from '@/components/system';

<LoadingScreen
  progress={progress}
  bootStartTime={Date.now()}
  showMetrics={true}
/>
```

## Asset Manifest

The asset manifest (`public/assets/manifest.json`) defines all assets to preload:

```json
{
  "models": [
    {
      "id": "board-frame",
      "path": "/assets/optimized/models/board-frame.glb",
      "format": "glb",
      "compression": "draco",
      "size": 245760
    }
  ],
  "textures": [
    {
      "id": "walnut-wood-2k",
      "path": "/assets/optimized/textures/walnut-wood-2k.ktx2",
      "format": "ktx2",
      "resolution": "2k",
      "size": 409600
    }
  ],
  "fonts": [
    {
      "id": "cinzel-regular",
      "path": "/assets/fonts/cinzel-regular.woff2",
      "format": "woff2"
    }
  ]
}
```

## Performance Budgets

The system enforces these budgets (Requirements 7.1, 7.5):

- **Total Payload**: ≤3.5 MB
- **Per-Room Assets**: ≤350 KB
- **2k Textures**: ≤512 KB each
- **1k Textures**: ≤256 KB each

## Validation

Validate your asset manifest:

```bash
npm run validate:assets
```

This will:
- Check total payload size
- Validate individual asset sizes
- Check per-room budgets
- Verify compression settings
- Display detailed metrics

## Motion Tier Support

Load different texture resolutions based on motion tier:

```tsx
// Full tier: Use 2k textures
const fullTierManifest = {
  ...manifest,
  textures: manifest.textures.filter(t => t.resolution === '2k')
};

// Lite tier: Use 1k textures
const liteTierManifest = {
  ...manifest,
  textures: manifest.textures.filter(t => t.resolution === '1k')
};
```

## Asset Naming Conventions

### Models
- `board-frame.glb` - Main board frame
- `glass-pane.glb` - Glass overlay
- `room-{name}-tile.glb` - Room tiles (e.g., `room-alumni-tile.glb`)
- `center-logo.glb` - Center branding

### Textures
- `{material}-{resolution}.ktx2` - Material textures
- Examples: `walnut-wood-2k.ktx2`, `brass-metal-1k.ktx2`

### Room Grouping
Assets with `room-{name}` prefix are grouped for per-room budget validation.

## Loading Phases

The asset loader progresses through these phases:

1. **models** - Loading 3D models
2. **textures** - Loading textures
3. **fonts** - Loading fonts
4. **complete** - All assets loaded

## Error Handling

The system handles these error scenarios:

- **Missing manifest** - Falls back to minimal assets
- **Asset load failure** - Reports specific asset that failed
- **Budget exceeded** - Validation fails with detailed report
- **Network errors** - Retries with exponential backoff

## Metrics

The system tracks these metrics:

- Total payload size
- Individual asset sizes
- Loading time per asset
- Total boot time
- Memory usage

## Integration Example

Complete integration with boot sequence:

```tsx
import { useState, useEffect } from 'react';
import { AssetLoader, AssetValidator } from '@/lib/assets';
import { LoadingScreen } from '@/components/system';

function App() {
  const [manifest, setManifest] = useState(null);
  const [assets, setAssets] = useState(null);
  const [progress, setProgress] = useState({...});
  const bootStartTime = Date.now();

  useEffect(() => {
    fetch('/assets/manifest.json')
      .then(res => res.json())
      .then(data => {
        const result = AssetValidator.validate(data);
        if (result.valid) {
          setManifest(data);
        }
      });
  }, []);

  if (!assets) {
    return (
      <>
        <LoadingScreen progress={progress} bootStartTime={bootStartTime} />
        {manifest && (
          <AssetLoader
            manifest={manifest}
            onProgress={setProgress}
            onComplete={setAssets}
          />
        )}
      </>
    );
  }

  return <YourApp assets={assets} />;
}
```

## Requirements Satisfied

- ✅ **7.1**: Initial app payload ≤3.5 MB
- ✅ **7.4**: Use KTX2 format with dual sets (2k/1k)
- ✅ **7.5**: Per-room assets ≤350 KB
- ✅ **8.1**: Boot within 5 seconds
- ✅ **13.1**: Display boot time metrics

## See Also

- [Asset Pipeline Documentation](../../../public/assets/README.md)
- [Asset Optimization Script](../../../scripts/optimize-assets.js)
- [Asset Validation Script](../../../scripts/validate-assets.cjs)
