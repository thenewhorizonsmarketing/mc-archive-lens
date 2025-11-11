// ============================================================================
// 3D CLUE BOARD KIOSK - CONFIGURATION USAGE EXAMPLE
// ============================================================================

import { configManager } from './ConfigManager';
import type { KioskConfig } from '@/types/kiosk-config';

/**
 * Example: Loading and using configuration
 */
export async function loadKioskConfiguration(): Promise<KioskConfig> {
  try {
    // Load configuration from JSON files
    const config = await configManager.loadConfig();
    
    console.log('Configuration loaded successfully:');
    console.log(`- Rooms: ${config.rooms.length}`);
    console.log(`- Idle timeout: ${config.idleTimeout}s`);
    console.log(`- Attract timeout: ${config.attractTimeout}s`);
    console.log(`- Motion tier: ${config.motionTier}`);
    
    return config;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw error;
  }
}

/**
 * Example: Accessing room information
 */
export function getRoomExamples() {
  // Get all rooms
  const allRooms = configManager.getRooms();
  console.log('All rooms:', allRooms.map(r => r.title));
  
  // Get specific room by ID
  const alumniRoom = configManager.getRoomById('alumni');
  if (alumniRoom) {
    console.log('Alumni room:', alumniRoom.title, 'at', alumniRoom.position);
  }
  
  // Get room by route
  const publicationsRoom = configManager.getRoomByRoute('/publications');
  if (publicationsRoom) {
    console.log('Publications room:', publicationsRoom.title);
  }
  
  // Get room by grid position
  const topLeftRoom = configManager.getRoomByPosition('top-left');
  if (topLeftRoom) {
    console.log('Top-left room:', topLeftRoom.title);
  }
}

/**
 * Example: Updating configuration at runtime (admin overlay)
 */
export function updateKioskSettings() {
  try {
    // Update idle timeout
    configManager.updateConfig({
      idleTimeout: 60,
      attractTimeout: 180,
    });
    
    console.log('Configuration updated successfully');
  } catch (error) {
    console.error('Failed to update configuration:', error);
  }
}

/**
 * Example: Getting current configuration
 */
export function getCurrentConfig() {
  try {
    const config = configManager.getConfig();
    return config;
  } catch (error) {
    console.error('Configuration not loaded yet');
    return null;
  }
}

/**
 * Example: Complete initialization flow
 */
export async function initializeKiosk() {
  console.log('Initializing 3D Clue Board Kiosk...');
  
  // Step 1: Load configuration
  const config = await loadKioskConfiguration();
  
  // Step 2: Validate rooms
  if (config.rooms.length === 0) {
    throw new Error('No rooms configured');
  }
  
  // Step 3: Log room layout
  console.log('\nRoom Layout:');
  const positions = [
    ['top-left', 'top-center', 'top-right'],
    ['middle-left', 'center', 'middle-right'],
    ['bottom-left', 'bottom-center', 'bottom-right'],
  ];
  
  positions.forEach(row => {
    const rowRooms = row.map(pos => {
      const room = configManager.getRoomByPosition(pos as any);
      return room ? room.title.padEnd(15) : '(empty)'.padEnd(15);
    });
    console.log(rowRooms.join(' | '));
  });
  
  // Step 4: Return configuration for app initialization
  return config;
}
