#!/usr/bin/env node

/**
 * Asset Manifest Validation Script
 * 
 * Validates the asset manifest against performance budgets
 * Run: node scripts/validate-assets.js
 */

const fs = require('fs');
const path = require('path');

// Asset budget constraints
const ASSET_BUDGETS = {
  TOTAL_PAYLOAD: 3.5 * 1024 * 1024, // 3.5 MB
  PER_ROOM: 350 * 1024, // 350 KB
  TEXTURE_2K: 512 * 1024, // 512 KB
  TEXTURE_1K: 256 * 1024, // 256 KB
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Validate asset manifest
 */
function validateManifest(manifestPath) {
  console.log('📦 Validating Asset Manifest\n');
  console.log(`Reading: ${manifestPath}\n`);

  // Read manifest
  let manifest;
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    console.error('❌ Failed to read manifest:', error.message);
    process.exit(1);
  }

  const errors = [];
  const warnings = [];

  // Calculate metrics
  const modelsSize = manifest.models.reduce((sum, m) => sum + m.size, 0);
  const texturesSize = manifest.textures.reduce((sum, t) => sum + t.size, 0);
  const totalSize = modelsSize + texturesSize;

  console.log('📊 Metrics:');
  console.log(`  Total Size: ${formatBytes(totalSize)} / ${formatBytes(ASSET_BUDGETS.TOTAL_PAYLOAD)}`);
  console.log(`  Models: ${manifest.models.length} (${formatBytes(modelsSize)})`);
  console.log(`  Textures: ${manifest.textures.length} (${formatBytes(texturesSize)})`);
  console.log(`  Fonts: ${manifest.fonts.length}\n`);

  // Validate total payload
  if (totalSize > ASSET_BUDGETS.TOTAL_PAYLOAD) {
    errors.push(
      `Total payload size (${formatBytes(totalSize)}) exceeds budget (${formatBytes(ASSET_BUDGETS.TOTAL_PAYLOAD)})`
    );
  } else if (totalSize > ASSET_BUDGETS.TOTAL_PAYLOAD * 0.9) {
    warnings.push(
      `Total payload size (${formatBytes(totalSize)}) is approaching budget (${formatBytes(ASSET_BUDGETS.TOTAL_PAYLOAD)})`
    );
  }

  // Validate models
  console.log('🎨 Validating Models:');
  for (const model of manifest.models) {
    const status = model.compression !== 'none' ? '✓' : '⚠️';
    console.log(`  ${status} ${model.id}: ${formatBytes(model.size)} (${model.compression})`);

    if (model.compression === 'none' && model.size > 100 * 1024) {
      warnings.push(`Model '${model.id}' should use compression`);
    }
  }
  console.log();

  // Validate textures
  console.log('🖼️  Validating Textures:');
  for (const texture of manifest.textures) {
    const budget = texture.resolution === '2k' ? ASSET_BUDGETS.TEXTURE_2K : ASSET_BUDGETS.TEXTURE_1K;
    const status = texture.size <= budget ? '✓' : '❌';
    const percentage = ((texture.size / budget) * 100).toFixed(0);
    
    console.log(`  ${status} ${texture.id}: ${formatBytes(texture.size)} / ${formatBytes(budget)} (${percentage}%)`);

    if (texture.size > budget) {
      errors.push(
        `Texture '${texture.id}' (${formatBytes(texture.size)}) exceeds ${texture.resolution} budget (${formatBytes(budget)})`
      );
    }
  }
  console.log();

  // Validate room budgets
  console.log('🏠 Validating Room Budgets:');
  const roomAssets = new Map();

  for (const model of manifest.models) {
    const match = model.id.match(/room-(\w+)/);
    if (match) {
      const roomId = match[1];
      const current = roomAssets.get(roomId) || 0;
      roomAssets.set(roomId, current + model.size);
    }
  }

  for (const texture of manifest.textures) {
    const match = texture.id.match(/room-(\w+)/);
    if (match) {
      const roomId = match[1];
      const current = roomAssets.get(roomId) || 0;
      roomAssets.set(roomId, current + texture.size);
    }
  }

  for (const [roomId, size] of roomAssets.entries()) {
    const status = size <= ASSET_BUDGETS.PER_ROOM ? '✓' : '❌';
    const percentage = ((size / ASSET_BUDGETS.PER_ROOM) * 100).toFixed(0);
    
    console.log(`  ${status} ${roomId}: ${formatBytes(size)} / ${formatBytes(ASSET_BUDGETS.PER_ROOM)} (${percentage}%)`);

    if (size > ASSET_BUDGETS.PER_ROOM) {
      errors.push(
        `Room '${roomId}' assets (${formatBytes(size)}) exceed per-room budget (${formatBytes(ASSET_BUDGETS.PER_ROOM)})`
      );
    }
  }
  console.log();

  // Display warnings
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} Warning(s):`);
    warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log();
  }

  // Display errors
  if (errors.length > 0) {
    console.log(`❌ ${errors.length} Error(s):`);
    errors.forEach(error => console.log(`  - ${error}`));
    console.log();
    console.log('❌ Validation FAILED\n');
    process.exit(1);
  }

  console.log('✅ Validation PASSED\n');
  process.exit(0);
}

// Run validation
const manifestPath = path.join(__dirname, '../public/assets/manifest.json');
validateManifest(manifestPath);
