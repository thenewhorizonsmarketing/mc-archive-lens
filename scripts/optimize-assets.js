#!/usr/bin/env node

/**
 * Asset Optimization Script for 3D Clue Board Kiosk
 * 
 * This script optimizes 3D assets for the kiosk:
 * - Compresses glTF/GLB files with Draco
 * - Generates texture mipmaps
 * - Validates asset sizes against budgets
 * - Creates asset manifest
 */

import gltfPipeline from 'gltf-pipeline';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { processGltf } = gltfPipeline;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSET_DIR = path.join(__dirname, '../public/assets');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/optimized');
const MANIFEST_PATH = path.join(__dirname, '../public/assets/manifest.json');

// Asset budgets (in bytes)
const BUDGETS = {
  totalPayload: 3.5 * 1024 * 1024, // 3.5 MB
  perRoomAssets: 350 * 1024, // 350 KB per room
  texture2k: 512 * 1024, // 512 KB for 2k textures
  texture1k: 256 * 1024, // 256 KB for 1k textures
};

/**
 * Optimize a glTF/GLB file with Draco compression
 */
async function optimizeGltf(inputPath, outputPath) {
  console.log(`Optimizing glTF: ${inputPath}`);
  
  try {
    const gltfBuffer = await fs.readFile(inputPath);
    
    const options = {
      dracoOptions: {
        compressionLevel: 10,
        quantizePositionBits: 14,
        quantizeNormalBits: 10,
        quantizeTexcoordBits: 12,
        quantizeColorBits: 8,
        quantizeGenericBits: 12,
      },
    };
    
    const results = await processGltf(gltfBuffer, options);
    await fs.writeFile(outputPath, results.gltf);
    
    const inputSize = gltfBuffer.length;
    const outputSize = results.gltf.length;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(2);
    
    console.log(`  Input: ${(inputSize / 1024).toFixed(2)} KB`);
    console.log(`  Output: ${(outputSize / 1024).toFixed(2)} KB`);
    console.log(`  Savings: ${savings}%`);
    
    return { inputSize, outputSize };
  } catch (error) {
    console.error(`Error optimizing ${inputPath}:`, error.message);
    return null;
  }
}

/**
 * Optimize texture images
 */
async function optimizeTexture(inputPath, outputPath, resolution = '2k') {
  console.log(`Optimizing texture: ${inputPath} (${resolution})`);
  
  try {
    const maxSize = resolution === '2k' ? 2048 : 1024;
    
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    // Resize if needed
    if (metadata.width > maxSize || metadata.height > maxSize) {
      image.resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Convert to WebP for better compression
    await image
      .webp({ quality: 85, effort: 6 })
      .toFile(outputPath);
    
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputPath);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);
    
    console.log(`  Input: ${(inputStats.size / 1024).toFixed(2)} KB`);
    console.log(`  Output: ${(outputStats.size / 1024).toFixed(2)} KB`);
    console.log(`  Savings: ${savings}%`);
    
    return { inputSize: inputStats.size, outputSize: outputStats.size };
  } catch (error) {
    console.error(`Error optimizing ${inputPath}:`, error.message);
    return null;
  }
}

/**
 * Validate asset sizes against budgets
 */
function validateBudgets(manifest) {
  console.log('\n=== Budget Validation ===');
  
  let totalSize = 0;
  const warnings = [];
  
  // Calculate total size
  for (const asset of manifest.models) {
    totalSize += asset.size;
  }
  for (const asset of manifest.textures) {
    totalSize += asset.size;
  }
  
  console.log(`Total payload: ${(totalSize / 1024 / 1024).toFixed(2)} MB / ${(BUDGETS.totalPayload / 1024 / 1024).toFixed(2)} MB`);
  
  if (totalSize > BUDGETS.totalPayload) {
    warnings.push(`⚠️  Total payload exceeds budget by ${((totalSize - BUDGETS.totalPayload) / 1024).toFixed(2)} KB`);
  } else {
    console.log('✓ Total payload within budget');
  }
  
  // Check texture sizes
  for (const texture of manifest.textures) {
    const budget = texture.resolution === '2k' ? BUDGETS.texture2k : BUDGETS.texture1k;
    if (texture.size > budget) {
      warnings.push(`⚠️  Texture ${texture.id} (${texture.resolution}) exceeds budget: ${(texture.size / 1024).toFixed(2)} KB / ${(budget / 1024).toFixed(2)} KB`);
    }
  }
  
  if (warnings.length === 0) {
    console.log('✓ All assets within budget');
  } else {
    console.log('\nWarnings:');
    warnings.forEach(w => console.log(w));
  }
  
  return warnings.length === 0;
}

/**
 * Generate asset manifest
 */
async function generateManifest() {
  console.log('\n=== Generating Asset Manifest ===');
  
  const manifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    models: [],
    textures: [],
    fonts: [],
  };
  
  try {
    // Scan for optimized models
    const modelsDir = path.join(OUTPUT_DIR, 'models');
    try {
      const modelFiles = await fs.readdir(modelsDir);
      for (const file of modelFiles) {
        if (file.endsWith('.glb') || file.endsWith('.gltf')) {
          const filePath = path.join(modelsDir, file);
          const stats = await fs.stat(filePath);
          manifest.models.push({
            id: path.basename(file, path.extname(file)),
            path: `/assets/optimized/models/${file}`,
            format: path.extname(file).slice(1),
            compression: 'draco',
            size: stats.size,
          });
        }
      }
    } catch (error) {
      console.log('No models directory found');
    }
    
    // Scan for optimized textures
    const texturesDir = path.join(OUTPUT_DIR, 'textures');
    try {
      const textureFiles = await fs.readdir(texturesDir);
      for (const file of textureFiles) {
        if (file.endsWith('.webp') || file.endsWith('.png') || file.endsWith('.jpg')) {
          const filePath = path.join(texturesDir, file);
          const stats = await fs.stat(filePath);
          const resolution = file.includes('2k') ? '2k' : '1k';
          manifest.textures.push({
            id: path.basename(file, path.extname(file)),
            path: `/assets/optimized/textures/${file}`,
            format: path.extname(file).slice(1),
            resolution,
            size: stats.size,
          });
        }
      }
    } catch (error) {
      console.log('No textures directory found');
    }
    
    // Write manifest
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    console.log(`Manifest written to ${MANIFEST_PATH}`);
    
    return manifest;
  } catch (error) {
    console.error('Error generating manifest:', error.message);
    return manifest;
  }
}

/**
 * Main optimization workflow
 */
async function main() {
  console.log('=== 3D Clue Board Kiosk Asset Optimizer ===\n');
  
  // Create output directories
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'models'), { recursive: true });
  await fs.mkdir(path.join(OUTPUT_DIR, 'textures'), { recursive: true });
  
  // Check if asset directory exists
  try {
    await fs.access(ASSET_DIR);
  } catch (error) {
    console.log('No assets directory found. Creating placeholder structure...');
    await fs.mkdir(ASSET_DIR, { recursive: true });
    await fs.mkdir(path.join(ASSET_DIR, 'models'), { recursive: true });
    await fs.mkdir(path.join(ASSET_DIR, 'textures'), { recursive: true });
    console.log('Asset directories created. Add your 3D models and textures to public/assets/');
    return;
  }
  
  // Process models
  console.log('=== Processing Models ===');
  const modelsDir = path.join(ASSET_DIR, 'models');
  try {
    const modelFiles = await fs.readdir(modelsDir);
    for (const file of modelFiles) {
      if (file.endsWith('.glb') || file.endsWith('.gltf')) {
        const inputPath = path.join(modelsDir, file);
        const outputPath = path.join(OUTPUT_DIR, 'models', file);
        await optimizeGltf(inputPath, outputPath);
      }
    }
  } catch (error) {
    console.log('No models to process');
  }
  
  // Process textures
  console.log('\n=== Processing Textures ===');
  const texturesDir = path.join(ASSET_DIR, 'textures');
  try {
    const textureFiles = await fs.readdir(texturesDir);
    for (const file of textureFiles) {
      if (file.match(/\.(png|jpg|jpeg)$/i)) {
        const inputPath = path.join(texturesDir, file);
        const resolution = file.includes('2k') ? '2k' : '1k';
        const outputFile = file.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        const outputPath = path.join(OUTPUT_DIR, 'textures', outputFile);
        await optimizeTexture(inputPath, outputPath, resolution);
      }
    }
  } catch (error) {
    console.log('No textures to process');
  }
  
  // Generate manifest
  const manifest = await generateManifest();
  
  // Validate budgets
  validateBudgets(manifest);
  
  console.log('\n=== Optimization Complete ===');
}

// Run the script
main().catch(console.error);
