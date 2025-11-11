// ============================================================================
// 3D CLUE BOARD KIOSK - ASSET LOADER COMPONENT
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import type { AssetManifest, LoadedAssets } from '@/types/kiosk-config';

/**
 * Asset loading progress information
 */
export interface AssetLoadProgress {
  /** Total number of assets to load */
  total: number;
  /** Number of assets loaded */
  loaded: number;
  /** Current loading percentage (0-100) */
  percentage: number;
  /** Currently loading asset ID */
  currentAsset: string;
  /** Loading phase */
  phase: 'models' | 'textures' | 'fonts' | 'complete';
}

/**
 * Props for AssetLoader component
 */
export interface AssetLoaderProps {
  /** Asset manifest to load */
  manifest: AssetManifest;
  /** Callback for progress updates */
  onProgress?: (progress: AssetLoadProgress) => void;
  /** Callback when loading completes */
  onComplete?: (assets: LoadedAssets) => void;
  /** Callback for loading errors */
  onError?: (error: Error) => void;
  /** Children to render after loading */
  children?: React.ReactNode;
}

/**
 * AssetLoader preloads all 3D assets (models, textures, fonts) and tracks progress
 * 
 * Requirements:
 * - 7.1: Initial app payload ≤3.5 MB
 * - 7.4: Use KTX2 format with dual sets (2k desktop, 1k lite)
 * - 7.5: Per-room assets ≤350 KB
 */
export const AssetLoader: React.FC<AssetLoaderProps> = ({
  manifest,
  onProgress,
  onComplete,
  onError,
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedAssets, setLoadedAssets] = useState<LoadedAssets | null>(null);
  const [progress, setProgress] = useState<AssetLoadProgress>({
    total: 0,
    loaded: 0,
    percentage: 0,
    currentAsset: '',
    phase: 'models',
  });

  /**
   * Update progress and notify callback
   */
  const updateProgress = useCallback((update: Partial<AssetLoadProgress>) => {
    setProgress(prev => {
      const newProgress = { ...prev, ...update };
      newProgress.percentage = newProgress.total > 0 
        ? Math.round((newProgress.loaded / newProgress.total) * 100)
        : 0;
      
      onProgress?.(newProgress);
      return newProgress;
    });
  }, [onProgress]);

  /**
   * Load all assets
   */
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const startTime = performance.now();
        
        // Calculate total assets
        const totalAssets = 
          manifest.models.length + 
          manifest.textures.length + 
          manifest.fonts.length;

        updateProgress({
          total: totalAssets,
          loaded: 0,
          phase: 'models',
        });

        const assets: LoadedAssets = {
          models: new Map(),
          textures: new Map(),
          fonts: new Map(),
        };

        let loadedCount = 0;

        // Load models
        updateProgress({ phase: 'models' });
        for (const model of manifest.models) {
          updateProgress({ 
            currentAsset: model.id,
            loaded: loadedCount,
          });

          try {
            const gltf = await loadGLTF(model.path);
            assets.models.set(model.id, gltf);
            loadedCount++;
            
            console.log(`✓ Loaded model: ${model.id} (${formatBytes(model.size)})`);
          } catch (error) {
            console.error(`✗ Failed to load model: ${model.id}`, error);
            throw new Error(`Failed to load model: ${model.id}`);
          }
        }

        // Load textures
        updateProgress({ phase: 'textures', loaded: loadedCount });
        for (const texture of manifest.textures) {
          updateProgress({ 
            currentAsset: texture.id,
            loaded: loadedCount,
          });

          try {
            const tex = await loadTexture(texture.path);
            assets.textures.set(texture.id, tex);
            loadedCount++;
            
            console.log(`✓ Loaded texture: ${texture.id} (${formatBytes(texture.size)})`);
          } catch (error) {
            console.error(`✗ Failed to load texture: ${texture.id}`, error);
            throw new Error(`Failed to load texture: ${texture.id}`);
          }
        }

        // Load fonts
        updateProgress({ phase: 'fonts', loaded: loadedCount });
        for (const font of manifest.fonts) {
          updateProgress({ 
            currentAsset: font.id,
            loaded: loadedCount,
          });

          try {
            await loadFont(font.path);
            assets.fonts.set(font.id, font.path);
            loadedCount++;
            
            console.log(`✓ Loaded font: ${font.id}`);
          } catch (error) {
            console.error(`✗ Failed to load font: ${font.id}`, error);
            throw new Error(`Failed to load font: ${font.id}`);
          }
        }

        // Complete
        const loadTime = performance.now() - startTime;
        updateProgress({ 
          phase: 'complete',
          loaded: totalAssets,
          percentage: 100,
        });

        console.log(`✓ All assets loaded in ${loadTime.toFixed(0)}ms`);
        
        setLoadedAssets(assets);
        setIsLoading(false);
        onComplete?.(assets);

      } catch (error) {
        console.error('Asset loading failed:', error);
        setIsLoading(false);
        onError?.(error instanceof Error ? error : new Error('Unknown error'));
      }
    };

    loadAssets();
  }, [manifest, updateProgress, onComplete, onError]);

  // Don't render children until loading is complete
  if (isLoading || !loadedAssets) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Load a glTF model
 */
async function loadGLTF(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    useGLTF.preload(path);
    
    // Use a timeout to ensure the asset is loaded
    const checkLoaded = () => {
      try {
        const gltf = useGLTF(path);
        resolve(gltf);
      } catch (error) {
        setTimeout(checkLoaded, 100);
      }
    };
    
    setTimeout(checkLoaded, 100);
  });
}

/**
 * Load a texture
 */
async function loadTexture(path: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve(img);
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load texture: ${path}`));
    };
    
    img.src = path;
  });
}

/**
 * Load a font
 */
async function loadFont(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = path;
    link.crossOrigin = 'anonymous';
    
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load font: ${path}`));
    
    document.head.appendChild(link);
  });
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Hook to access loaded assets
 */
export function useLoadedAssets(): LoadedAssets | null {
  // This would be provided via context in a real implementation
  return null;
}
