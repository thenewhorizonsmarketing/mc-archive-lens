// ============================================================================
// 3D CLUE BOARD KIOSK - ASSET LOADING EXAMPLE
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AssetLoader } from './AssetLoader';
import { AssetValidator } from './AssetValidator';
import { LoadingScreen } from '@/components/system/LoadingScreen';
import type { AssetManifest, LoadedAssets } from '@/types/kiosk-config';
import type { AssetLoadProgress } from './AssetLoader';

/**
 * Example component demonstrating asset loading workflow
 */
export const AssetLoadingExample: React.FC = () => {
  const [manifest, setManifest] = useState<AssetManifest | null>(null);
  const [loadedAssets, setLoadedAssets] = useState<LoadedAssets | null>(null);
  const [progress, setProgress] = useState<AssetLoadProgress>({
    total: 0,
    loaded: 0,
    percentage: 0,
    currentAsset: '',
    phase: 'models',
  });
  const [error, setError] = useState<Error | null>(null);
  const bootStartTime = Date.now();

  // Load and validate manifest
  useEffect(() => {
    const loadManifest = async () => {
      try {
        // Fetch manifest
        const response = await fetch('/assets/manifest.json');
        if (!response.ok) {
          throw new Error('Failed to load asset manifest');
        }
        const manifestData: AssetManifest = await response.json();

        // Validate manifest
        const validationResult = AssetValidator.validate(manifestData);
        AssetValidator.logResults(validationResult);

        if (!validationResult.valid) {
          throw new Error('Asset manifest validation failed');
        }

        setManifest(manifestData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    };

    loadManifest();
  }, []);

  // Handle asset loading completion
  const handleLoadComplete = (assets: LoadedAssets) => {
    console.log('✅ All assets loaded successfully');
    console.log(`  Models: ${assets.models.size}`);
    console.log(`  Textures: ${assets.textures.size}`);
    console.log(`  Fonts: ${assets.fonts.size}`);
    setLoadedAssets(assets);
  };

  // Handle loading error
  const handleLoadError = (err: Error) => {
    console.error('❌ Asset loading failed:', err);
    setError(err);
  };

  // Show error state
  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h1>Asset Loading Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  // Show loading state
  if (!manifest || !loadedAssets) {
    return (
      <>
        <LoadingScreen
          progress={progress}
          bootStartTime={bootStartTime}
          showMetrics={true}
        />
        {manifest && (
          <AssetLoader
            manifest={manifest}
            onProgress={setProgress}
            onComplete={handleLoadComplete}
            onError={handleLoadError}
          />
        )}
      </>
    );
  }

  // Show loaded state
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Assets Loaded Successfully</h1>
      <p>Models: {loadedAssets.models.size}</p>
      <p>Textures: {loadedAssets.textures.size}</p>
      <p>Fonts: {loadedAssets.fonts.size}</p>
      <p>Boot Time: {((Date.now() - bootStartTime) / 1000).toFixed(2)}s</p>
    </div>
  );
};

/**
 * Example: Load assets with motion tier selection
 */
export const AssetLoadingWithMotionTier: React.FC<{
  motionTier: 'full' | 'lite';
}> = ({ motionTier }) => {
  const [manifest, setManifest] = useState<AssetManifest | null>(null);

  useEffect(() => {
    const loadManifest = async () => {
      const response = await fetch('/assets/manifest.json');
      const manifestData: AssetManifest = await response.json();

      // Filter textures based on motion tier
      const filteredManifest: AssetManifest = {
        ...manifestData,
        textures: manifestData.textures.filter(texture => {
          // Use 2k textures for 'full' tier, 1k for 'lite'
          return motionTier === 'full'
            ? texture.resolution === '2k'
            : texture.resolution === '1k';
        }),
      };

      setManifest(filteredManifest);
    };

    loadManifest();
  }, [motionTier]);

  if (!manifest) {
    return <div>Loading manifest...</div>;
  }

  return (
    <AssetLoader
      manifest={manifest}
      onComplete={(assets) => {
        console.log(`Assets loaded for ${motionTier} tier`);
      }}
    >
      <div>Content goes here</div>
    </AssetLoader>
  );
};
