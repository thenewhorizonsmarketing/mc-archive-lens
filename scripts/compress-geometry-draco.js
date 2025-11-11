#!/usr/bin/env node

/**
 * Draco Geometry Compression Script
 * 
 * Compresses 3D geometry using Draco compression for optimal
 * file size and loading performance.
 * 
 * Requirements: 7.6, 7.7
 */

import gltfPipeline from 'gltf-pipeline';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const { processGltf } = gltfPipeline;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.join(__dirname, '../public/assets/models');
const OUTPUT_DIR = path.join(__dirname, '../public/assets/optimized/models');

// Draco compression settings
const DRACO_OPTIONS = {
  compressionLevel: 10, // Maximum compression (0-10)
  quantizePositionBits: 14, // Position precision
  quantizeNormalBits: 10, // Normal precision
  quantizeTexcoordBits: 12, // UV precision
  quantizeColorBits: 8, // Color precision
  quantizeGenericBits: 12, // Generic attribute precision
  unifiedQuantization: false, // Separate quantization per attribute
};

/**
 * Compress a glTF/GLB file with Draco
 */
async function compressWithDraco(inputPath, outputPath) {
  const basename = path.basename(inputPath);
  console.log(`\nCompressing: ${basename}`);
  
  try {
    // Read input file
    const gltfBuffer = await fs.readFile(inputPath);
    const inputSize = gltfBuffer.length;
    
    console.log(`  Input size: ${(inputSize / 1024).toFixed(2)} KB`);
    
    // Process with Draco compression
    const options = {
      dracoOptions: DRACO_OPTIONS,
    };
    
    console.log('  Applying Draco compression...');
    const results = await processGltf(gltfBuffer, options);
    
    // Write output file
    await fs.writeFile(outputPath, results.gltf);
    const outputSize = results.gltf.length;
    
    // Calculate statistics
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(2);
    const ratio = (inputSize / outputSize).toFixed(2);
    
    console.log(`  Output size: ${(outputSize / 1024).toFixed(2)} KB`);
    console.log(`  Savings: ${savings}%`);
    console.log(`  Compression ratio: ${ratio}:1`);
    
    // Analyze geometry
    if (results.gltf.meshes) {
      const meshCount = results.gltf.meshes.length;
      let totalPrimitives = 0;
      results.gltf.meshes.forEach(mesh => {
        totalPrimitives += mesh.primitives?.length || 0;
      });
      console.log(`  Meshes: ${meshCount}`);
      console.log(`  Primitives: ${totalPrimitives}`);
    }
    
    return {
      inputSize,
      outputSize,
      savings: parseFloat(savings),
      ratio: parseFloat(ratio),
    };
  } catch (error) {
    console.error(`  ERROR: ${error.message}`);
    return null;
  }
}

/**
 * Validate compressed model
 */
async function validateModel(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const gltf = JSON.parse(buffer.toString());
    
    // Check for required properties
    if (!gltf.asset) {
      throw new Error('Missing asset property');
    }
    
    // Check for Draco extension
    const hasDraco = gltf.extensionsUsed?.includes('KHR_draco_mesh_compression');
    
    return {
      valid: true,
      hasDraco,
      version: gltf.asset.version,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Process all models in directory
 */
async function processModels() {
  console.log('=== Draco Geometry Compression ===\n');
  console.log('Compression settings:');
  console.log(`  Level: ${DRACO_OPTIONS.compressionLevel}/10`);
  console.log(`  Position bits: ${DRACO_OPTIONS.quantizePositionBits}`);
  console.log(`  Normal bits: ${DRACO_OPTIONS.quantizeNormalBits}`);
  console.log(`  Texcoord bits: ${DRACO_OPTIONS.quantizeTexcoordBits}`);
  
  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Check if models directory exists
  try {
    await fs.access(MODELS_DIR);
  } catch (error) {
    console.log('\nNo models directory found.');
    console.log('Add 3D models to: public/assets/models/');
    return;
  }
  
  // Get all model files
  const files = await fs.readdir(MODELS_DIR);
  const modelFiles = files.filter(f => f.match(/\.(gltf|glb)$/i));
  
  if (modelFiles.length === 0) {
    console.log('\nNo models found to compress.');
    return;
  }
  
  console.log(`\nFound ${modelFiles.length} models to compress`);
  
  const results = {
    total: modelFiles.length,
    compressed: 0,
    failed: 0,
    totalInputSize: 0,
    totalOutputSize: 0,
  };
  
  // Process each model
  for (const file of modelFiles) {
    const inputPath = path.join(MODELS_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);
    
    const result = await compressWithDraco(inputPath, outputPath);
    
    if (result) {
      results.compressed++;
      results.totalInputSize += result.inputSize;
      results.totalOutputSize += result.outputSize;
      
      // Validate compressed model
      const validation = await validateModel(outputPath);
      if (validation.valid) {
        console.log(`  ✓ Validation passed`);
        if (validation.hasDraco) {
          console.log(`  ✓ Draco extension present`);
        }
      } else {
        console.log(`  ⚠️  Validation warning: ${validation.error}`);
      }
    } else {
      results.failed++;
    }
  }
  
  // Print summary
  console.log('\n=== Compression Summary ===');
  console.log(`Total models: ${results.total}`);
  console.log(`Successfully compressed: ${results.compressed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Total input size: ${(results.totalInputSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total output size: ${(results.totalOutputSize / 1024 / 1024).toFixed(2)} MB`);
  
  if (results.totalInputSize > 0) {
    const totalSavings = ((1 - results.totalOutputSize / results.totalInputSize) * 100).toFixed(2);
    const totalRatio = (results.totalInputSize / results.totalOutputSize).toFixed(2);
    console.log(`Total savings: ${totalSavings}%`);
    console.log(`Average compression ratio: ${totalRatio}:1`);
  }
  
  console.log('\n✓ Draco compression complete!');
  console.log('Compressed models saved to: public/assets/optimized/models/');
  
  // Budget check
  console.log('\n=== Budget Check ===');
  const perRoomBudget = 350 * 1024; // 350 KB per room
  const avgPerModel = results.totalOutputSize / results.compressed;
  
  if (avgPerModel <= perRoomBudget) {
    console.log(`✓ Average model size (${(avgPerModel / 1024).toFixed(2)} KB) within budget (${(perRoomBudget / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`⚠️  Average model size (${(avgPerModel / 1024).toFixed(2)} KB) exceeds budget (${(perRoomBudget / 1024).toFixed(2)} KB)`);
    console.log('Consider:');
    console.log('  - Reducing polygon count');
    console.log('  - Removing unnecessary attributes');
    console.log('  - Splitting large models into smaller pieces');
  }
}

// Run the script
processModels().catch(console.error);
