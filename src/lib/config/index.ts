// ============================================================================
// 3D CLUE BOARD KIOSK - CONFIGURATION MODULE EXPORTS
// ============================================================================

export { ConfigManager, ConfigValidationError, configManager } from './ConfigManager';
export type {
  KioskConfig,
  RoomDefinition,
  MotionTier,
  GridPosition,
  MotionTierConfig,
  AssetManifest,
  ModelAsset,
  TextureAsset,
  FontAsset,
  PerformanceMetrics,
  LoadedAssets,
} from '@/types/kiosk-config';
