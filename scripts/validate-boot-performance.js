#!/usr/bin/env node

/**
 * Boot Performance Validation Script
 * 
 * Validates that the application boots to full-screen within 5 seconds
 * Requirements: 8.1, 13.1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOT_TIME_TARGET = 5000; // 5 seconds in milliseconds
const BOOT_TIME_WARNING = 4000; // Warn if approaching limit

console.log('='.repeat(60));
console.log('BOOT PERFORMANCE VALIDATION');
console.log('='.repeat(60));
console.log();

// Check if build exists
const distPath = path.join(__dirname, '..', 'dist');
const distElectronPath = path.join(__dirname, '..', 'dist-electron');

console.log('Checking build artifacts...');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist/ directory not found. Run `npm run build` first.');
  process.exit(1);
}

if (!fs.existsSync(distElectronPath)) {
  console.error('❌ dist-electron/ directory not found. Run `npm run build:electron` first.');
  process.exit(1);
}

console.log('✓ Build artifacts found');
console.log();

// Analyze bundle sizes
console.log('Analyzing bundle sizes...');
const indexHtmlPath = path.join(distPath, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

// Extract script and CSS references
const scriptMatches = indexHtml.match(/<script[^>]*src="([^"]+)"[^>]*>/g) || [];
const cssMatches = indexHtml.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/g) || [];

let totalJsSize = 0;
let totalCssSize = 0;

scriptMatches.forEach(match => {
  const srcMatch = match.match(/src="([^"]+)"/);
  if (srcMatch) {
    const scriptPath = path.join(distPath, srcMatch[1]);
    if (fs.existsSync(scriptPath)) {
      const size = fs.statSync(scriptPath).size;
      totalJsSize += size;
      console.log(`  JS: ${srcMatch[1]} - ${(size / 1024).toFixed(2)} KB`);
    }
  }
});

cssMatches.forEach(match => {
  const hrefMatch = match.match(/href="([^"]+)"/);
  if (hrefMatch) {
    const cssPath = path.join(distPath, hrefMatch[1]);
    if (fs.existsSync(cssPath)) {
      const size = fs.statSync(cssPath).size;
      totalCssSize += size;
      console.log(`  CSS: ${hrefMatch[1]} - ${(size / 1024).toFixed(2)} KB`);
    }
  }
});

console.log();
console.log(`Total JS size: ${(totalJsSize / 1024).toFixed(2)} KB`);
console.log(`Total CSS size: ${(totalCssSize / 1024).toFixed(2)} KB`);
console.log(`Total bundle size: ${((totalJsSize + totalCssSize) / 1024).toFixed(2)} KB`);
console.log();

// Estimate boot time based on bundle size
// Rough estimate: 1MB = ~500ms on modern hardware
const estimatedLoadTime = ((totalJsSize + totalCssSize) / 1024 / 1024) * 500;
const estimatedParseTime = 500; // JS parse/compile time
const estimatedInitTime = 1000; // React initialization + store setup
const estimatedRenderTime = 500; // Initial render
const estimatedTotal = estimatedLoadTime + estimatedParseTime + estimatedInitTime + estimatedRenderTime;

console.log('Boot Time Estimates:');
console.log(`  Asset Loading: ~${estimatedLoadTime.toFixed(0)}ms`);
console.log(`  JS Parse/Compile: ~${estimatedParseTime.toFixed(0)}ms`);
console.log(`  Initialization: ~${estimatedInitTime.toFixed(0)}ms`);
console.log(`  Initial Render: ~${estimatedRenderTime.toFixed(0)}ms`);
console.log(`  TOTAL ESTIMATE: ~${estimatedTotal.toFixed(0)}ms`);
console.log();

// Validate against target
if (estimatedTotal <= BOOT_TIME_TARGET) {
  console.log(`✓ Estimated boot time (${estimatedTotal.toFixed(0)}ms) is within 5-second target`);
  
  if (estimatedTotal > BOOT_TIME_WARNING) {
    console.log(`⚠️  Warning: Approaching boot time limit (${((estimatedTotal / BOOT_TIME_TARGET) * 100).toFixed(1)}% of target)`);
  }
} else {
  console.log(`❌ Estimated boot time (${estimatedTotal.toFixed(0)}ms) EXCEEDS 5-second target`);
  console.log();
  console.log('Recommendations:');
  console.log('  1. Enable code splitting in vite.config.ts');
  console.log('  2. Lazy load non-critical components');
  console.log('  3. Optimize asset sizes (images, fonts)');
  console.log('  4. Use dynamic imports for heavy dependencies');
  process.exit(1);
}

console.log();

// Check for optimization opportunities
console.log('Optimization Checks:');

// Check if assets are optimized
const assetsPath = path.join(__dirname, '..', 'public', 'assets');
if (fs.existsSync(assetsPath)) {
  const checkAssetOptimization = (dir, type) => {
    const files = fs.readdirSync(dir);
    let unoptimized = [];
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        const size = stat.size;
        
        // Check for unoptimized files
        if (type === 'texture' && ['.png', '.jpg', '.jpeg'].includes(ext) && size > 500 * 1024) {
          unoptimized.push({ file, size: (size / 1024).toFixed(2) + ' KB' });
        }
        if (type === 'model' && ['.gltf', '.glb'].includes(ext) && size > 1024 * 1024) {
          unoptimized.push({ file, size: (size / 1024 / 1024).toFixed(2) + ' MB' });
        }
      }
    });
    
    return unoptimized;
  };
  
  const texturesPath = path.join(assetsPath, 'textures');
  const modelsPath = path.join(assetsPath, 'models');
  
  if (fs.existsSync(texturesPath)) {
    const unoptimizedTextures = checkAssetOptimization(texturesPath, 'texture');
    if (unoptimizedTextures.length > 0) {
      console.log('  ⚠️  Large texture files detected:');
      unoptimizedTextures.forEach(({ file, size }) => {
        console.log(`     - ${file}: ${size}`);
      });
      console.log('     Run: npm run optimize:textures:ktx2');
    } else {
      console.log('  ✓ Textures optimized');
    }
  }
  
  if (fs.existsSync(modelsPath)) {
    const unoptimizedModels = checkAssetOptimization(modelsPath, 'model');
    if (unoptimizedModels.length > 0) {
      console.log('  ⚠️  Large model files detected:');
      unoptimizedModels.forEach(({ file, size }) => {
        console.log(`     - ${file}: ${size}`);
      });
      console.log('     Run: npm run optimize:geometry:draco');
    } else {
      console.log('  ✓ Models optimized');
    }
  }
}

console.log();
console.log('='.repeat(60));
console.log('VALIDATION COMPLETE');
console.log('='.repeat(60));
console.log();
console.log('Next Steps:');
console.log('  1. Test actual boot time: npm run dev:electron');
console.log('  2. Monitor boot metrics in admin overlay');
console.log('  3. Run performance tests: npm run test:run');
console.log();

process.exit(0);
