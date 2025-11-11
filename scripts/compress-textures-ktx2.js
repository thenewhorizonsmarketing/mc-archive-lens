#!/usr/bin/env node

/**
 * KTX2 Texture Compression Script
 * 
 * Compresses textures to KTX2 format with Basis Universal compression
 * for optimal GPU texture streaming and memory usage.
 * 
 * Requirements: 7.4, 7.5
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEXTURES_DIR = path.join(__dirname, '../public/assets/textures');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/optimized/textures');

// Compression settings
const COMPRESSION_SETTINGS = {
  '2k': {
    maxSize: 2048,
    quality: 128, // Higher quality for desktop
    uastc: true, // Use UASTC for better quality
  },
  '1k': {
    maxSize: 1024,
    quality: 96, // Lower quality for lite tier
    uastc: false, // Use ETC1S for better compression
  },
};

/**
 * Check if basisu tool is available
 */
async function checkBasisu() {
  try {
    await execAsync('basisu --version');
    return true;
  } catch (error) {
    console.error('ERROR: basisu tool not found!');
    console.error('Please install KTX-Software from: https://github.com/KhronosGroup/KTX-Software');
    console.error('Or install via npm: npm install -g @gltf-transform/cli');
    return false;
  }
}

/**
 * Compress a texture to KTX2 format
 */
async function compressToKTX2(inputPath, outputPath, resolution = '2k') {
  const settings = COMPRESSION_SETTINGS[resolution];
  const basename = path.basename(inputPath, path.extname(inputPath));
  const outputFile = path.join(outputPath, `${basename}-${resolution}.ktx2`);
  
  console.log(`Compressing ${basename} to KTX2 (${resolution})...`);
  
  try {
    // Build basisu command
    const args = [
      '-ktx2',
      `-max_endpoints ${settings.quality}`,
      `-max_selectors ${settings.quality}`,
      settings.uastc ? '-uastc' : '',
      `-mipmap`,
      `-y_flip`,
      `-output_path "${outputPath}"`,
      `-output_file "${basename}-${resolution}.ktx2"`,
      `"${inputPath}"`,
    ].filter(Boolean).join(' ');
    
    const command = `basisu ${args}`;
    
    await execAsync(command);
    
    // Get file sizes
    const inputStats = await fs.stat(inputPath);
    const outputStats = await fs.stat(outputFile);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(2);
    
    console.log(`  Input: ${(inputStats.size / 1024).toFixed(2)} KB`);
    console.log(`  Output: ${(outputStats.size / 1024).toFixed(2)} KB`);
    console.log(`  Savings: ${savings}%`);
    console.log(`  Format: ${settings.uastc ? 'UASTC' : 'ETC1S'}`);
    
    return {
      inputSize: inputStats.size,
      outputSize: outputStats.size,
      format: settings.uastc ? 'UASTC' : 'ETC1S',
    };
  } catch (error) {
    console.error(`Error compressing ${inputPath}:`, error.message);
    return null;
  }
}

/**
 * Process all textures in directory
 */
async function processTextures() {
  console.log('=== KTX2 Texture Compression ===\n');
  
  // Check for basisu tool
  const hasBasisu = await checkBasisu();
  if (!hasBasisu) {
    console.log('\nFalling back to WebP compression...');
    console.log('Run: npm run optimize:assets');
    return;
  }
  
  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Check if textures directory exists
  try {
    await fs.access(TEXTURES_DIR);
  } catch (error) {
    console.log('No textures directory found.');
    console.log('Add textures to: public/assets/textures/');
    return;
  }
  
  // Get all texture files
  const files = await fs.readdir(TEXTURES_DIR);
  const textureFiles = files.filter(f => f.match(/\.(png|jpg|jpeg)$/i));
  
  if (textureFiles.length === 0) {
    console.log('No textures found to compress.');
    return;
  }
  
  console.log(`Found ${textureFiles.length} textures to compress\n`);
  
  const results = {
    total: 0,
    compressed: 0,
    failed: 0,
    totalInputSize: 0,
    totalOutputSize: 0,
  };
  
  // Process each texture at both resolutions
  for (const file of textureFiles) {
    const inputPath = path.join(TEXTURES_DIR, file);
    
    // Compress at 2k resolution
    console.log(`\nProcessing: ${file}`);
    const result2k = await compressToKTX2(inputPath, OUTPUT_DIR, '2k');
    if (result2k) {
      results.compressed++;
      results.totalInputSize += result2k.inputSize;
      results.totalOutputSize += result2k.outputSize;
    } else {
      results.failed++;
    }
    
    // Compress at 1k resolution
    const result1k = await compressToKTX2(inputPath, OUTPUT_DIR, '1k');
    if (result1k) {
      results.compressed++;
      results.totalInputSize += result1k.inputSize;
      results.totalOutputSize += result1k.outputSize;
    } else {
      results.failed++;
    }
    
    results.total += 2; // Count both resolutions
  }
  
  // Print summary
  console.log('\n=== Compression Summary ===');
  console.log(`Total textures processed: ${textureFiles.length}`);
  console.log(`Total variants created: ${results.compressed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total input size: ${(results.totalInputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total output size: ${(results.totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total savings: ${((1 - results.totalOutputSize / results.totalInputSize) * 100).toFixed(2)}%`);
  
  console.log('\n✓ KTX2 compression complete!');
  console.log('Compressed textures saved to: public/assets/optimized/textures/');
}

// Run the script
processTextures().catch(console.error);
