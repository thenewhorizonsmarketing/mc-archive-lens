// ============================================================================
// 3D CLUE BOARD KIOSK - CONFIGURATION MANAGER
// ============================================================================

import type { 
  KioskConfig, 
  RoomDefinition, 
  MotionTier,
  GridPosition 
} from '@/types/kiosk-config';

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: KioskConfig = {
  rooms: [],
  idleTimeout: 45,
  attractTimeout: 120,
  adminPin: '1234',
  motionTier: 'auto',
  reducedMotion: false,
};

/**
 * Valid grid positions for room placement
 */
const VALID_GRID_POSITIONS: GridPosition[] = [
  'top-left', 'top-center', 'top-right',
  'middle-left', 'center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
];

/**
 * ConfigManager handles loading, validation, and access to kiosk configuration
 */
export class ConfigManager {
  private config: KioskConfig | null = null;
  private rooms: RoomDefinition[] = [];

  /**
   * Load configuration from JSON files
   */
  async loadConfig(): Promise<KioskConfig> {
    try {
      // Load rooms configuration
      const roomsResponse = await fetch('/config/rooms.json');
      if (!roomsResponse.ok) {
        throw new Error(`Failed to load rooms.json: ${roomsResponse.statusText}`);
      }
      const roomsData = await roomsResponse.json();
      this.rooms = this.validateRooms(roomsData.rooms || roomsData);

      // Load main configuration
      let mainConfig: Partial<KioskConfig> = {};
      try {
        const configResponse = await fetch('/config/config.json');
        if (configResponse.ok) {
          mainConfig = await configResponse.json();
        }
      } catch (error) {
        console.warn('config.json not found, using defaults');
      }

      // Merge with defaults
      this.config = {
        ...DEFAULT_CONFIG,
        ...mainConfig,
        rooms: this.rooms,
      };

      // Validate final configuration
      this.validateConfig(this.config);

      return this.config;
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw error;
      }
      throw new ConfigValidationError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): KioskConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  /**
   * Get all room definitions
   */
  getRooms(): RoomDefinition[] {
    return this.rooms;
  }

  /**
   * Get a specific room by ID
   */
  getRoomById(id: string): RoomDefinition | undefined {
    return this.rooms.find(room => room.id === id);
  }

  /**
   * Get a room by route path
   */
  getRoomByRoute(route: string): RoomDefinition | undefined {
    return this.rooms.find(room => room.route === route);
  }

  /**
   * Get a room by grid position
   */
  getRoomByPosition(position: GridPosition): RoomDefinition | undefined {
    return this.rooms.find(room => room.position === position);
  }

  /**
   * Validate rooms configuration
   */
  private validateRooms(rooms: any[]): RoomDefinition[] {
    if (!Array.isArray(rooms)) {
      throw new ConfigValidationError('Rooms must be an array');
    }

    if (rooms.length === 0) {
      throw new ConfigValidationError('At least one room must be defined');
    }

    if (rooms.length > 9) {
      throw new ConfigValidationError('Maximum 9 rooms allowed (3x3 grid)');
    }

    const validatedRooms: RoomDefinition[] = [];
    const usedIds = new Set<string>();
    const usedPositions = new Set<GridPosition>();
    const usedRoutes = new Set<string>();

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];

      // Validate required fields
      if (!room.id || typeof room.id !== 'string') {
        throw new ConfigValidationError(`Room at index ${i} missing valid 'id'`);
      }
      if (!room.title || typeof room.title !== 'string') {
        throw new ConfigValidationError(`Room '${room.id}' missing valid 'title'`);
      }
      if (!room.route || typeof room.route !== 'string') {
        throw new ConfigValidationError(`Room '${room.id}' missing valid 'route'`);
      }
      if (!room.position || !VALID_GRID_POSITIONS.includes(room.position)) {
        throw new ConfigValidationError(
          `Room '${room.id}' has invalid position. Must be one of: ${VALID_GRID_POSITIONS.join(', ')}`
        );
      }

      // Check for duplicates
      if (usedIds.has(room.id)) {
        throw new ConfigValidationError(`Duplicate room ID: ${room.id}`);
      }
      if (usedPositions.has(room.position)) {
        throw new ConfigValidationError(`Duplicate room position: ${room.position}`);
      }
      if (usedRoutes.has(room.route)) {
        throw new ConfigValidationError(`Duplicate room route: ${room.route}`);
      }

      usedIds.add(room.id);
      usedPositions.add(room.position);
      usedRoutes.add(room.route);

      // Validate and add room
      validatedRooms.push({
        id: room.id,
        title: room.title,
        description: room.description || '',
        icon: room.icon || '',
        route: room.route,
        position: room.position,
        color: room.color || '#F5E6C8',
      });
    }

    return validatedRooms;
  }

  /**
   * Validate complete configuration
   */
  private validateConfig(config: KioskConfig): void {
    // Validate idle timeout
    if (typeof config.idleTimeout !== 'number' || config.idleTimeout < 0) {
      throw new ConfigValidationError('idleTimeout must be a positive number');
    }

    // Validate attract timeout
    if (typeof config.attractTimeout !== 'number' || config.attractTimeout < 0) {
      throw new ConfigValidationError('attractTimeout must be a positive number');
    }

    // Validate attract timeout is greater than idle timeout
    if (config.attractTimeout <= config.idleTimeout) {
      throw new ConfigValidationError('attractTimeout must be greater than idleTimeout');
    }

    // Validate admin PIN
    if (!config.adminPin || typeof config.adminPin !== 'string') {
      throw new ConfigValidationError('adminPin must be a non-empty string');
    }

    // Validate motion tier
    const validMotionTiers: (MotionTier | 'auto')[] = ['full', 'lite', 'static', 'auto'];
    if (!validMotionTiers.includes(config.motionTier)) {
      throw new ConfigValidationError(
        `motionTier must be one of: ${validMotionTiers.join(', ')}`
      );
    }

    // Validate reduced motion
    if (typeof config.reducedMotion !== 'boolean') {
      throw new ConfigValidationError('reducedMotion must be a boolean');
    }
  }

  /**
   * Update configuration at runtime (for admin overlay)
   */
  updateConfig(updates: Partial<KioskConfig>): void {
    if (!this.config) {
      throw new Error('Configuration not loaded');
    }

    const newConfig = {
      ...this.config,
      ...updates,
      rooms: this.rooms, // Rooms cannot be updated at runtime
    };

    this.validateConfig(newConfig);
    this.config = newConfig;
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    this.config = null;
    this.rooms = [];
  }
}

/**
 * Singleton instance
 */
export const configManager = new ConfigManager();
