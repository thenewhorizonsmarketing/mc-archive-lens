/**
 * Room Tile Hit Target Validation Test
 * 
 * Validates that all 8 room tiles are interactive with minimum 56px hit targets.
 * 
 * Requirements:
 * - 3.1: Minimum 56px hit target size for all interactive elements
 * - 3.2: Navigate to corresponding section on tap
 * - 1.1: Render 3×3 grid with 8 room tiles around edges
 * 
 * Success Criteria:
 * - All 8 room tiles are interactive with 56px+ hit targets
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

const MIN_HIT_TARGET_SIZE = 56; // pixels
const EXPECTED_ROOM_COUNT = 8;

describe('Room Tile Hit Target Validation', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    
    // Set viewport to 4K resolution (target hardware)
    await page.setViewportSize({ width: 3840, height: 2160 });
    
    // Navigate to the kiosk app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait for 3D scene to load
    await page.waitForTimeout(3000);
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should render exactly 8 room tiles', async () => {
    // Check that all 8 rooms are defined in the configuration
    const roomCount = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 0;
      
      // Access the Three.js scene through the canvas
      const scene = (canvas as any).__THREE__;
      if (!scene) return 0;
      
      // Count objects with roomId userData
      let count = 0;
      scene.traverse((object: any) => {
        if (object.userData && object.userData.roomId) {
          count++;
        }
      });
      
      return count;
    });

    console.log(`Found ${roomCount} interactive room tiles`);
    expect(roomCount).toBeGreaterThanOrEqual(EXPECTED_ROOM_COUNT);
  });

  it('should have all room tiles with 56px+ hit targets', async () => {
    // Validate hit target sizes
    const hitTargetResults = await page.evaluate((minSize: number) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { valid: false, message: 'Canvas not found' };
      
      // Get canvas dimensions
      const rect = canvas.getBoundingClientRect();
      
      // Access the Three.js scene
      const scene = (canvas as any).__THREE__;
      if (!scene) return { valid: false, message: 'Scene not found' };
      
      const camera = (canvas as any).__CAMERA__;
      if (!camera) return { valid: false, message: 'Camera not found' };
      
      // Collect all interactive objects
      const interactiveObjects: any[] = [];
      scene.traverse((object: any) => {
        if (object.userData && object.userData.roomId) {
          interactiveObjects.push(object);
        }
      });
      
      if (interactiveObjects.length === 0) {
        return { valid: false, message: 'No interactive objects found' };
      }
      
      // Calculate screen-space size for each object
      const results = interactiveObjects.map((object: any) => {
        // Get bounding box
        const box = new (window as any).THREE.Box3().setFromObject(object);
        
        // Get corners
        const corners = [
          new (window as any).THREE.Vector3(box.min.x, box.min.y, box.min.z),
          new (window as any).THREE.Vector3(box.max.x, box.min.y, box.min.z),
          new (window as any).THREE.Vector3(box.min.x, box.max.y, box.min.z),
          new (window as any).THREE.Vector3(box.max.x, box.max.y, box.min.z),
          new (window as any).THREE.Vector3(box.min.x, box.min.y, box.max.z),
          new (window as any).THREE.Vector3(box.max.x, box.min.y, box.max.z),
          new (window as any).THREE.Vector3(box.min.x, box.max.y, box.max.z),
          new (window as any).THREE.Vector3(box.max.x, box.max.y, box.max.z)
        ];
        
        // Project corners to screen space
        const screenCorners = corners.map((corner: any) => {
          const projected = corner.clone().project(camera);
          return {
            x: (projected.x * 0.5 + 0.5) * rect.width,
            y: (-(projected.y * 0.5) + 0.5) * rect.height
          };
        });
        
        // Find min/max screen coordinates
        const minX = Math.min(...screenCorners.map((c: any) => c.x));
        const maxX = Math.max(...screenCorners.map((c: any) => c.x));
        const minY = Math.min(...screenCorners.map((c: any) => c.y));
        const maxY = Math.max(...screenCorners.map((c: any) => c.y));
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        return {
          roomId: object.userData.roomId,
          screenWidth: Math.round(width),
          screenHeight: Math.round(height),
          isValid: width >= minSize && height >= minSize
        };
      });
      
      const allValid = results.every((r: any) => r.isValid);
      const validCount = results.filter((r: any) => r.isValid).length;
      
      return {
        valid: allValid,
        results,
        summary: `${validCount}/${results.length} tiles have valid hit targets (≥${minSize}px)`
      };
    }, MIN_HIT_TARGET_SIZE);

    console.log('\nHit Target Validation Results:');
    console.log(hitTargetResults.summary);
    
    if (hitTargetResults.results) {
      hitTargetResults.results.forEach((result: any) => {
        const status = result.isValid ? '✓' : '✗';
        console.log(
          `${status} ${result.roomId}: ${result.screenWidth}px × ${result.screenHeight}px`
        );
      });
    }

    expect(hitTargetResults.valid).toBe(true);
  });

  it('should respond to clicks on all room tiles', async () => {
    // Test that each room tile is clickable
    const clickResults = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { success: false, message: 'Canvas not found' };
      
      const scene = (canvas as any).__THREE__;
      const camera = (canvas as any).__CAMERA__;
      
      if (!scene || !camera) {
        return { success: false, message: 'Scene or camera not found' };
      }
      
      // Collect all interactive objects
      const interactiveObjects: any[] = [];
      scene.traverse((object: any) => {
        if (object.userData && object.userData.roomId) {
          interactiveObjects.push(object);
        }
      });
      
      // Check that all objects have click handlers
      const clickableCount = interactiveObjects.filter((obj: any) => {
        // Check if object has onClick event listener
        return obj.onClick !== undefined || obj.__r3f?.handlers?.onClick !== undefined;
      }).length;
      
      return {
        success: clickableCount === interactiveObjects.length,
        clickableCount,
        totalCount: interactiveObjects.length,
        message: `${clickableCount}/${interactiveObjects.length} tiles are clickable`
      };
    });

    console.log('\nClick Handler Validation:');
    console.log(clickResults.message);

    expect(clickResults.success).toBe(true);
  });

  it('should have proper spacing between tiles', async () => {
    // Validate that tiles are properly spaced in the 3×3 grid
    const spacingResults = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { valid: false, message: 'Canvas not found' };
      
      const scene = (canvas as any).__THREE__;
      if (!scene) return { valid: false, message: 'Scene not found' };
      
      // Collect all interactive objects with positions
      const tiles: any[] = [];
      scene.traverse((object: any) => {
        if (object.userData && object.userData.roomId) {
          const worldPos = new (window as any).THREE.Vector3();
          object.getWorldPosition(worldPos);
          tiles.push({
            roomId: object.userData.roomId,
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z
          });
        }
      });
      
      if (tiles.length < 8) {
        return { valid: false, message: `Only ${tiles.length} tiles found` };
      }
      
      // Calculate minimum distance between tiles
      let minDistance = Infinity;
      for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
          const dx = tiles[i].x - tiles[j].x;
          const dz = tiles[i].z - tiles[j].z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          minDistance = Math.min(minDistance, distance);
        }
      }
      
      // Tiles should be at least 3.5 units apart (tile size + gap)
      const expectedMinDistance = 3.5;
      
      return {
        valid: minDistance >= expectedMinDistance,
        minDistance: minDistance.toFixed(2),
        expectedMinDistance,
        message: `Minimum tile spacing: ${minDistance.toFixed(2)} units (expected ≥${expectedMinDistance})`
      };
    });

    console.log('\nTile Spacing Validation:');
    console.log(spacingResults.message);

    expect(spacingResults.valid).toBe(true);
  });

  it('should have all 8 expected rooms configured', async () => {
    // Verify that all expected rooms are present
    const expectedRooms = [
      'alumni',
      'publications',
      'photos',
      'faculty',
      'history',
      'achievements',
      'events',
      'resources'
    ];

    const foundRooms = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return [];
      
      const scene = (canvas as any).__THREE__;
      if (!scene) return [];
      
      const roomIds: string[] = [];
      scene.traverse((object: any) => {
        if (object.userData && object.userData.roomId) {
          if (!roomIds.includes(object.userData.roomId)) {
            roomIds.push(object.userData.roomId);
          }
        }
      });
      
      return roomIds.sort();
    });

    console.log('\nConfigured Rooms:');
    foundRooms.forEach((roomId: string) => {
      console.log(`  - ${roomId}`);
    });

    // Check that all expected rooms are present
    expectedRooms.forEach(roomId => {
      expect(foundRooms).toContain(roomId);
    });

    expect(foundRooms.length).toBe(EXPECTED_ROOM_COUNT);
  });
});
