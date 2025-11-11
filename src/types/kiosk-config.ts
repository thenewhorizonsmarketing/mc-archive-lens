// ============================================================================
// 3D CLUE BOARD KIOSK - CONFIGURATION TYPE DEFINITIONS
// ============================================================================

/**
 * Motion tier determines the level of visual effects and animations
 * based on hardware capabilities and performance
 */
export type MotionTier = 'full' | 'lite' | 'static';

/**
 * Grid position for room tiles in the 3x3 board layout
 */
export type GridPosition = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Room definition for each navigable section in the kiosk
 */
export interface RoomDefinition {
  /** Unique identifier for the room */
  id: string;
  /** Display title for the room */
  title: string;
  /** Brief description of the room content */
  description: string;
  /** Path to icon asset */
  icon: string;
  /** Navigation route path */
  route: string;
  /** Position in the 3x3 grid */
  position: GridPosition;
  /** Accent color for the room (hex format) */
  color: string;
}

/**
 * Main kiosk configuration
 */
export interface KioskConfig {
  /** Array of room definitions */
  rooms: RoomDefinition[];
  /** Idle timeout in seconds before attract loop starts (default: 45) */
  idleTimeout: number;
  /** Attract timeout in seconds before auto-reset to home (default: 120) */
  attractTimeout: number;
  /** Admin PIN for accessing admin overlay */
  adminPin: string;
  /** Motion tier setting ('full', 'lite', 'static', or 'auto' for detection) */
  motionTier: MotionTier | 'auto';
  /** Force reduced motion mode */
  reducedMotion: boolean;
}

/**
 * Motion tier configuration with feature flags
 */
export interface MotionTierConfig {
  /** Current motion tier */
  tier: MotionTier;
  /** Feature flags for this tier */
  features: {
    /** Enable board tilt effect */
    boardTilt: boolean;
    /** Enable parallax effect */
    parallax: boolean;
    /** Enable emissive pulse on interaction */
    emissivePulse: boolean;
    /** Enable camera transition animations */
    cameraTransition: boolean;
  };
  /** Target FPS for this tier */
  targetFPS: number;
}

/**
 * 3D model asset definition
 */
export interface ModelAsset {
  /** Unique identifier for the model */
  id: string;
  /** Path to the model file */
  path: string;
  /** Model format */
  format: 'gltf' | 'glb';
  /** Compression method used */
  compression: 'draco' | 'meshopt' | 'none';
  /** File size in bytes */
  size: number;
}

/**
 * Texture asset definition
 */
export interface TextureAsset {
  /** Unique identifier for the texture */
  id: string;
  /** Path to the texture file */
  path: string;
  /** Texture format */
  format: 'ktx2' | 'png' | 'jpg';
  /** Texture resolution */
  resolution: '1k' | '2k';
  /** File size in bytes */
  size: number;
}

/**
 * Font asset definition
 */
export interface FontAsset {
  /** Unique identifier for the font */
  id: string;
  /** Path to the font file */
  path: string;
  /** Font format */
  format: 'woff2';
}

/**
 * Asset manifest containing all preloadable assets
 */
export interface AssetManifest {
  /** 3D model assets */
  models: ModelAsset[];
  /** Texture assets */
  textures: TextureAsset[];
  /** Font assets */
  fonts: FontAsset[];
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  /** Frame time in milliseconds */
  frameTime: number;
  /** Number of draw calls */
  drawCalls: number;
  /** Number of triangles rendered */
  triangles: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** GPU memory usage in MB */
  gpuMemory: number;
}

/**
 * Loaded assets after preloading
 */
export interface LoadedAssets {
  models: Map<string, any>;
  textures: Map<string, any>;
  fonts: Map<string, any>;
}
