#!/usr/bin/env node

/**
 * Hit Target Validation Script
 * 
 * Validates that all 8 room tiles meet the minimum 56px hit target requirement.
 * 
 * Requirements:
 * - 3.1: Minimum 56px hit target size for all interactive elements
 * - 1.1: Render 3×3 grid with 8 room tiles around edges
 * 
 * Usage:
 *   node scripts/validate-hit-targets.js
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIN_HIT_TARGET_SIZE = 56; // pixels
const EXPECTED_ROOM_COUNT = 8;
const APP_URL = process.env.APP_URL || 'http://localhost:8081/board-test';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function validateHitTargets() {
  log('\n=== Room Tile Hit Target Validation ===\n', 'bold');
  log(`Target: ${MIN_HIT_TARGET_SIZE}px minimum hit target size`, 'cyan');
  log(`Expected: ${EXPECTED_ROOM_COUNT} interactive room tiles\n`, 'cyan');

  let browser;
  let exitCode = 0;

  try {
    // Launch browser
    log('Launching browser...', 'blue');
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set viewport to 4K (target hardware)
    await page.setViewportSize({ width: 3840, height: 2160 });
    log('Viewport set to 4K (3840x2160)', 'blue');

    // Navigate to app
    log(`Navigating to ${APP_URL}...`, 'blue');
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for 3D scene to load
    log('Waiting for 3D scene to load...', 'blue');
    await page.waitForTimeout(3000);

    // Validate room count
    log('\n--- Room Count Validation ---', 'bold');
    const roomCount = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return 0;

      const scene = canvas.__THREE__;
      if (!scene) return 0;

      const roomIds = new Set();
      scene.traverse((object) => {
        if (object.userData && object.userData.roomId) {
          roomIds.add(object.userData.roomId);
        }
      });

      return roomIds.size;
    });

    if (roomCount === EXPECTED_ROOM_COUNT) {
      log(`✓ Found ${roomCount} room tiles (expected ${EXPECTED_ROOM_COUNT})`, 'green');
    } else {
      log(`✗ Found ${roomCount} room tiles (expected ${EXPECTED_ROOM_COUNT})`, 'red');
      exitCode = 1;
    }

    // Validate hit target sizes
    log('\n--- Hit Target Size Validation ---', 'bold');
    const hitTargetResults = await page.evaluate((minSize) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { valid: false, results: [], error: 'Canvas not found' };

      const rect = canvas.getBoundingClientRect();
      const scene = canvas.__THREE__;
      const camera = canvas.__CAMERA__;

      if (!scene || !camera) {
        return { valid: false, results: [], error: 'Scene or camera not found' };
      }

      // Collect unique interactive objects
      const interactiveObjects = new Map();
      scene.traverse((object) => {
        if (object.userData && object.userData.roomId) {
          if (!interactiveObjects.has(object.userData.roomId)) {
            interactiveObjects.set(object.userData.roomId, object);
          }
        }
      });

      if (interactiveObjects.size === 0) {
        return { valid: false, results: [], error: 'No interactive objects found' };
      }

      // Calculate screen-space size for each object
      const results = Array.from(interactiveObjects.entries()).map(([roomId, object]) => {
        const box = new window.THREE.Box3().setFromObject(object);

        const corners = [
          new window.THREE.Vector3(box.min.x, box.min.y, box.min.z),
          new window.THREE.Vector3(box.max.x, box.min.y, box.min.z),
          new window.THREE.Vector3(box.min.x, box.max.y, box.min.z),
          new window.THREE.Vector3(box.max.x, box.max.y, box.min.z),
          new window.THREE.Vector3(box.min.x, box.min.y, box.max.z),
          new window.THREE.Vector3(box.max.x, box.min.y, box.max.z),
          new window.THREE.Vector3(box.min.x, box.max.y, box.max.z),
          new window.THREE.Vector3(box.max.x, box.max.y, box.max.z)
        ];

        const screenCorners = corners.map((corner) => {
          const projected = corner.clone().project(camera);
          return {
            x: (projected.x * 0.5 + 0.5) * rect.width,
            y: (-(projected.y * 0.5) + 0.5) * rect.height
          };
        });

        const minX = Math.min(...screenCorners.map((c) => c.x));
        const maxX = Math.max(...screenCorners.map((c) => c.x));
        const minY = Math.min(...screenCorners.map((c) => c.y));
        const maxY = Math.max(...screenCorners.map((c) => c.y));

        const width = maxX - minX;
        const height = maxY - minY;

        return {
          roomId,
          screenWidth: Math.round(width),
          screenHeight: Math.round(height),
          isValid: width >= minSize && height >= minSize
        };
      });

      const allValid = results.every((r) => r.isValid);

      return {
        valid: allValid,
        results,
        error: null
      };
    }, MIN_HIT_TARGET_SIZE);

    if (hitTargetResults.error) {
      log(`✗ Error: ${hitTargetResults.error}`, 'red');
      exitCode = 1;
    } else {
      const validCount = hitTargetResults.results.filter((r) => r.isValid).length;
      const totalCount = hitTargetResults.results.length;

      log(`\nValidation Results: ${validCount}/${totalCount} tiles meet requirements\n`);

      hitTargetResults.results.forEach((result) => {
        const status = result.isValid ? '✓' : '✗';
        const color = result.isValid ? 'green' : 'red';
        const size = `${result.screenWidth}px × ${result.screenHeight}px`;
        log(`${status} ${result.roomId.padEnd(15)} ${size}`, color);
      });

      if (hitTargetResults.valid) {
        log('\n✓ All room tiles meet the 56px minimum hit target requirement!', 'green');
      } else {
        log('\n✗ Some room tiles do not meet the 56px minimum hit target requirement', 'red');
        exitCode = 1;
      }
    }

    // Validate room configuration
    log('\n--- Room Configuration Validation ---', 'bold');
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

      const scene = canvas.__THREE__;
      if (!scene) return [];

      const roomIds = new Set();
      scene.traverse((object) => {
        if (object.userData && object.userData.roomId) {
          roomIds.add(object.userData.roomId);
        }
      });

      return Array.from(roomIds).sort();
    });

    let allRoomsPresent = true;
    expectedRooms.forEach((roomId) => {
      if (foundRooms.includes(roomId)) {
        log(`✓ ${roomId}`, 'green');
      } else {
        log(`✗ ${roomId} (missing)`, 'red');
        allRoomsPresent = false;
        exitCode = 1;
      }
    });

    if (allRoomsPresent) {
      log('\n✓ All expected rooms are configured!', 'green');
    } else {
      log('\n✗ Some expected rooms are missing', 'red');
    }

    // Summary
    log('\n=== Validation Summary ===\n', 'bold');
    if (exitCode === 0) {
      log('✓ All validations passed!', 'green');
      log('✓ All 8 room tiles are interactive with 56px+ hit targets', 'green');
    } else {
      log('✗ Some validations failed', 'red');
      log('Please review the results above and fix any issues', 'yellow');
    }

  } catch (error) {
    log(`\n✗ Error during validation: ${error.message}`, 'red');
    console.error(error);
    exitCode = 1;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  process.exit(exitCode);
}

// Run validation
validateHitTargets();
