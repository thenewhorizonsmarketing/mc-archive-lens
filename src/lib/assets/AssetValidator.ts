// ============================================================================
// 3D CLUE BOARD KIOSK - ASSET VALIDATOR
// ============================================================================

import type { AssetManifest, ModelAsset, TextureAsset } from '@/types/kiosk-config';

/**
 * Asset budget constraints (Requirements 7.1, 7.5)
 */
export const ASSET_BUDGETS = {
  /** Total initial payload budget */
  TOTAL_PAYLOAD: 3.5 * 1024 * 1024, // 3.5 MB
  /** Per-room asset budget */
  PER_ROOM: 350 * 1024, // 350 KB
  /** 2k texture budget */
  TEXTURE_2K: 512 * 1024, // 512 KB
  /** 1k texture budget */
  TEXTURE_1K: 256 * 1024, // 256 KB
} as const;

/**
 * Asset validation result
 */
export interface AssetValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Asset size metrics */
  metrics: AssetMetrics;
}

/**
 * Asset size metrics
 */
export interface AssetMetrics {
  /** Total size of all assets */
  totalSize: number;
  /** Total size of models */
  modelsSize: number;
  /** Total size of textures */
  texturesSize: number;
  /** Number of models */
  modelCount: number;
  /** Number of textures */
  textureCount: number;
  /** Number of fonts */
  fontCount: number;
  /** Largest asset */
  largestAsset: {
    id: string;
    size: number;
    type: 'model' | 'texture';
  } | null;
}

/**
 * Validate asset manifest against performance budgets
 * 
 * Requirements:
 * - 7.1: Initial app payload ≤3.5 MB
 * - 7.5: Per-room assets ≤350 KB
 */
export class AssetValidator {
  /**
   * Validate complete asset manifest
   */
  static validate(manifest: AssetManifest): AssetValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Calculate metrics
    const metrics = this.calculateMetrics(manifest);

    // Validate total payload size
    if (metrics.totalSize > ASSET_BUDGETS.TOTAL_PAYLOAD) {
      errors.push(
        `Total payload size (${formatBytes(metrics.totalSize)}) exceeds budget ` +
        `(${formatBytes(ASSET_BUDGETS.TOTAL_PAYLOAD)})`
      );
    } else if (metrics.totalSize > ASSET_BUDGETS.TOTAL_PAYLOAD * 0.9) {
      warnings.push(
        `Total payload size (${formatBytes(metrics.totalSize)}) is approaching budget ` +
        `(${formatBytes(ASSET_BUDGETS.TOTAL_PAYLOAD)})`
      );
    }

    // Validate individual models
    for (const model of manifest.models) {
      const modelErrors = this.validateModel(model);
      errors.push(...modelErrors);
    }

    // Validate individual textures
    for (const texture of manifest.textures) {
      const textureErrors = this.validateTexture(texture);
      errors.push(...textureErrors);
    }

    // Validate room budgets (if room grouping is available)
    const roomErrors = this.validateRoomBudgets(manifest);
    errors.push(...roomErrors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metrics,
    };
  }

  /**
   * Calculate asset metrics
   */
  static calculateMetrics(manifest: AssetManifest): AssetMetrics {
    const modelsSize = manifest.models.reduce((sum, m) => sum + m.size, 0);
    const texturesSize = manifest.textures.reduce((sum, t) => sum + t.size, 0);
    const totalSize = modelsSize + texturesSize;

    let largestAsset: AssetMetrics['largestAsset'] = null;
    let maxSize = 0;

    // Find largest model
    for (const model of manifest.models) {
      if (model.size > maxSize) {
        maxSize = model.size;
        largestAsset = { id: model.id, size: model.size, type: 'model' };
      }
    }

    // Find largest texture
    for (const texture of manifest.textures) {
      if (texture.size > maxSize) {
        maxSize = texture.size;
        largestAsset = { id: texture.id, size: texture.size, type: 'texture' };
      }
    }

    return {
      totalSize,
      modelsSize,
      texturesSize,
      modelCount: manifest.models.length,
      textureCount: manifest.textures.length,
      fontCount: manifest.fonts.length,
      largestAsset,
    };
  }

  /**
   * Validate a single model asset
   */
  private static validateModel(model: ModelAsset): string[] {
    const errors: string[] = [];

    // Validate required fields
    if (!model.id) {
      errors.push('Model missing required field: id');
    }
    if (!model.path) {
      errors.push(`Model '${model.id}' missing required field: path`);
    }
    if (!model.size || model.size <= 0) {
      errors.push(`Model '${model.id}' has invalid size: ${model.size}`);
    }

    // Validate format
    if (!['gltf', 'glb'].includes(model.format)) {
      errors.push(`Model '${model.id}' has invalid format: ${model.format}`);
    }

    // Validate compression
    if (!['draco', 'meshopt', 'none'].includes(model.compression)) {
      errors.push(`Model '${model.id}' has invalid compression: ${model.compression}`);
    }

    // Warn if no compression
    if (model.compression === 'none' && model.size > 100 * 1024) {
      errors.push(
        `Model '${model.id}' (${formatBytes(model.size)}) should use compression`
      );
    }

    return errors;
  }

  /**
   * Validate a single texture asset
   */
  private static validateTexture(texture: TextureAsset): string[] {
    const errors: string[] = [];

    // Validate required fields
    if (!texture.id) {
      errors.push('Texture missing required field: id');
    }
    if (!texture.path) {
      errors.push(`Texture '${texture.id}' missing required field: path`);
    }
    if (!texture.size || texture.size <= 0) {
      errors.push(`Texture '${texture.id}' has invalid size: ${texture.size}`);
    }

    // Validate format
    if (!['ktx2', 'png', 'jpg'].includes(texture.format)) {
      errors.push(`Texture '${texture.id}' has invalid format: ${texture.format}`);
    }

    // Validate resolution
    if (!['1k', '2k'].includes(texture.resolution)) {
      errors.push(`Texture '${texture.id}' has invalid resolution: ${texture.resolution}`);
    }

    // Validate size against budget
    const budget = texture.resolution === '2k' 
      ? ASSET_BUDGETS.TEXTURE_2K 
      : ASSET_BUDGETS.TEXTURE_1K;

    if (texture.size > budget) {
      errors.push(
        `Texture '${texture.id}' (${formatBytes(texture.size)}) exceeds ` +
        `${texture.resolution} budget (${formatBytes(budget)})`
      );
    }

    return errors;
  }

  /**
   * Validate per-room asset budgets
   */
  private static validateRoomBudgets(manifest: AssetManifest): string[] {
    const errors: string[] = [];

    // Group assets by room (based on naming convention)
    const roomAssets = new Map<string, number>();

    for (const model of manifest.models) {
      const roomId = this.extractRoomId(model.id);
      if (roomId) {
        const current = roomAssets.get(roomId) || 0;
        roomAssets.set(roomId, current + model.size);
      }
    }

    for (const texture of manifest.textures) {
      const roomId = this.extractRoomId(texture.id);
      if (roomId) {
        const current = roomAssets.get(roomId) || 0;
        roomAssets.set(roomId, current + texture.size);
      }
    }

    // Validate each room's budget
    for (const [roomId, size] of roomAssets.entries()) {
      if (size > ASSET_BUDGETS.PER_ROOM) {
        errors.push(
          `Room '${roomId}' assets (${formatBytes(size)}) exceed per-room budget ` +
          `(${formatBytes(ASSET_BUDGETS.PER_ROOM)})`
        );
      }
    }

    return errors;
  }

  /**
   * Extract room ID from asset ID (e.g., "room-alumni-tile" -> "alumni")
   */
  private static extractRoomId(assetId: string): string | null {
    const match = assetId.match(/room-(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * Log validation results to console
   */
  static logResults(result: AssetValidationResult): void {
    console.group('📦 Asset Validation Results');
    
    // Log metrics
    console.log('Metrics:');
    console.log(`  Total Size: ${formatBytes(result.metrics.totalSize)} / ${formatBytes(ASSET_BUDGETS.TOTAL_PAYLOAD)}`);
    console.log(`  Models: ${result.metrics.modelCount} (${formatBytes(result.metrics.modelsSize)})`);
    console.log(`  Textures: ${result.metrics.textureCount} (${formatBytes(result.metrics.texturesSize)})`);
    console.log(`  Fonts: ${result.metrics.fontCount}`);
    
    if (result.metrics.largestAsset) {
      console.log(`  Largest Asset: ${result.metrics.largestAsset.id} (${formatBytes(result.metrics.largestAsset.size)})`);
    }

    // Log errors
    if (result.errors.length > 0) {
      console.error(`\n❌ ${result.errors.length} Error(s):`);
      result.errors.forEach(error => console.error(`  - ${error}`));
    }

    // Log warnings
    if (result.warnings.length > 0) {
      console.warn(`\n⚠️  ${result.warnings.length} Warning(s):`);
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    // Log status
    if (result.valid) {
      console.log('\n✅ All validations passed');
    } else {
      console.error('\n❌ Validation failed');
    }

    console.groupEnd();
  }
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
