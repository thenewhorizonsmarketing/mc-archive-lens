#!/usr/bin/env node

/**
 * Touch Target Validation Script
 * 
 * Validates that all interactive elements meet touch target size requirements:
 * - Minimum 44x44px for standard touch targets
 * - Minimum 60x60px for keyboard keys
 * - Minimum 8px spacing between adjacent targets
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Touch target size requirements
const REQUIREMENTS = {
  STANDARD_MIN_SIZE: 44, // 44x44px for standard touch targets
  KEYBOARD_MIN_SIZE: 60, // 60x60px for keyboard keys
  MIN_SPACING: 8, // 8px minimum spacing between targets
  TOLERANCE: 2 // Allow 2px tolerance for rounding
};

// Selectors for interactive elements
const INTERACTIVE_SELECTORS = [
  'button',
  'a[href]',
  'input:not([type="hidden"])',
  '[role="button"]',
  '[tabindex]:not([tabindex="-1"])',
  '.result-card',
  '.touch-keyboard__key',
  '.filter-section button'
];

/**
 * Get element dimensions and position
 */
function getElementMetrics(element) {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  
  return {
    width: rect.width,
    height: rect.height,
    x: rect.x,
    y: rect.y,
    right: rect.right,
    bottom: rect.bottom,
    minWidth: parseFloat(computedStyle.minWidth) || 0,
    minHeight: parseFloat(computedStyle.minHeight) || 0,
    padding: {
      top: parseFloat(computedStyle.paddingTop) || 0,
      right: parseFloat(computedStyle.paddingRight) || 0,
      bottom: parseFloat(computedStyle.paddingBottom) || 0,
      left: parseFloat(computedStyle.paddingLeft) || 0
    }
  };
}

/**
 * Check if element is a keyboard key
 */
function isKeyboardKey(element) {
  return element.classList.contains('touch-keyboard__key') ||
         element.closest('.touch-keyboard');
}

/**
 * Calculate spacing between two elements
 */
function calculateSpacing(elem1Metrics, elem2Metrics) {
  // Calculate horizontal and vertical spacing
  const horizontalSpacing = Math.min(
    Math.abs(elem1Metrics.right - elem2Metrics.x),
    Math.abs(elem2Metrics.right - elem1Metrics.x)
  );
  
  const verticalSpacing = Math.min(
    Math.abs(elem1Metrics.bottom - elem2Metrics.y),
    Math.abs(elem2Metrics.bottom - elem1Metrics.y)
  );
  
  // Return the minimum spacing
  return Math.min(horizontalSpacing, verticalSpacing);
}

/**
 * Check if two elements are adjacent (close enough to check spacing)
 */
function areElementsAdjacent(elem1Metrics, elem2Metrics, threshold = 50) {
  const horizontalDistance = Math.min(
    Math.abs(elem1Metrics.right - elem2Metrics.x),
    Math.abs(elem2Metrics.right - elem1Metrics.x)
  );
  
  const verticalDistance = Math.min(
    Math.abs(elem1Metrics.bottom - elem2Metrics.y),
    Math.abs(elem2Metrics.bottom - elem1Metrics.y)
  );
  
  return horizontalDistance < threshold || verticalDistance < threshold;
}

/**
 * Validate touch target sizes
 */
async function validateTouchTargets(page) {
  console.log('\n🎯 Validating Touch Target Sizes...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  // Get all interactive elements
  const elements = await page.$$eval(
    INTERACTIVE_SELECTORS.join(', '),
    (elements, reqs) => {
      return elements.map((el, index) => {
        const rect = el.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(el);
        const isKeyboard = el.classList.contains('touch-keyboard__key') || 
                          el.closest('.touch-keyboard');
        
        return {
          index,
          selector: el.tagName.toLowerCase() + 
                   (el.id ? `#${el.id}` : '') + 
                   (el.className ? `.${el.className.split(' ')[0]}` : ''),
          width: rect.width,
          height: rect.height,
          minWidth: parseFloat(computedStyle.minWidth) || 0,
          minHeight: parseFloat(computedStyle.minHeight) || 0,
          isKeyboard,
          isVisible: rect.width > 0 && rect.height > 0,
          text: el.textContent?.trim().substring(0, 30) || '',
          ariaLabel: el.getAttribute('aria-label') || ''
        };
      });
    },
    REQUIREMENTS
  );
  
  // Validate each element
  for (const element of elements) {
    if (!element.isVisible) continue;
    
    const minRequired = element.isKeyboard 
      ? REQUIREMENTS.KEYBOARD_MIN_SIZE 
      : REQUIREMENTS.STANDARD_MIN_SIZE;
    
    const widthOk = element.width >= (minRequired - REQUIREMENTS.TOLERANCE);
    const heightOk = element.height >= (minRequired - REQUIREMENTS.TOLERANCE);
    
    if (widthOk && heightOk) {
      results.passed.push({
        element: element.selector,
        size: `${Math.round(element.width)}x${Math.round(element.height)}px`,
        type: element.isKeyboard ? 'keyboard' : 'standard',
        label: element.ariaLabel || element.text
      });
    } else {
      results.failed.push({
        element: element.selector,
        size: `${Math.round(element.width)}x${Math.round(element.height)}px`,
        required: `${minRequired}x${minRequired}px`,
        type: element.isKeyboard ? 'keyboard' : 'standard',
        label: element.ariaLabel || element.text,
        issues: [
          !widthOk && `Width ${Math.round(element.width)}px < ${minRequired}px`,
          !heightOk && `Height ${Math.round(element.height)}px < ${minRequired}px`
        ].filter(Boolean)
      });
    }
  }
  
  return results;
}

/**
 * Validate spacing between touch targets
 */
async function validateSpacing(page) {
  console.log('\n📏 Validating Touch Target Spacing...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  // Get all interactive elements with their positions
  const elements = await page.$$eval(
    INTERACTIVE_SELECTORS.join(', '),
    (elements) => {
      return elements.map((el, index) => {
        const rect = el.getBoundingClientRect();
        return {
          index,
          selector: el.tagName.toLowerCase() + 
                   (el.id ? `#${el.id}` : '') + 
                   (el.className ? `.${el.className.split(' ')[0]}` : ''),
          x: rect.x,
          y: rect.y,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
          isVisible: rect.width > 0 && rect.height > 0,
          parent: el.parentElement?.className || ''
        };
      });
    }
  );
  
  // Check spacing between adjacent elements
  const checked = new Set();
  
  for (let i = 0; i < elements.length; i++) {
    const elem1 = elements[i];
    if (!elem1.isVisible) continue;
    
    for (let j = i + 1; j < elements.length; j++) {
      const elem2 = elements[j];
      if (!elem2.isVisible) continue;
      
      const pairKey = `${i}-${j}`;
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);
      
      // Check if elements are adjacent (within 50px)
      const horizontalDistance = Math.min(
        Math.abs(elem1.right - elem2.x),
        Math.abs(elem2.right - elem1.x)
      );
      
      const verticalDistance = Math.min(
        Math.abs(elem1.bottom - elem2.y),
        Math.abs(elem2.bottom - elem1.y)
      );
      
      const isAdjacent = horizontalDistance < 50 || verticalDistance < 50;
      
      if (!isAdjacent) continue;
      
      // Calculate actual spacing
      const spacing = Math.min(horizontalDistance, verticalDistance);
      
      if (spacing >= REQUIREMENTS.MIN_SPACING - REQUIREMENTS.TOLERANCE) {
        results.passed.push({
          elements: `${elem1.selector} ↔ ${elem2.selector}`,
          spacing: `${Math.round(spacing)}px`
        });
      } else {
        results.failed.push({
          elements: `${elem1.selector} ↔ ${elem2.selector}`,
          spacing: `${Math.round(spacing)}px`,
          required: `${REQUIREMENTS.MIN_SPACING}px`,
          issue: `Spacing ${Math.round(spacing)}px < ${REQUIREMENTS.MIN_SPACING}px`
        });
      }
    }
  }
  
  return results;
}

/**
 * Main validation function
 */
async function runValidation() {
  console.log('🚀 Starting Touch Target Validation\n');
  console.log('Requirements:');
  console.log(`  - Standard touch targets: ${REQUIREMENTS.STANDARD_MIN_SIZE}x${REQUIREMENTS.STANDARD_MIN_SIZE}px`);
  console.log(`  - Keyboard keys: ${REQUIREMENTS.KEYBOARD_MIN_SIZE}x${REQUIREMENTS.KEYBOARD_MIN_SIZE}px`);
  console.log(`  - Minimum spacing: ${REQUIREMENTS.MIN_SPACING}px`);
  console.log(`  - Tolerance: ±${REQUIREMENTS.TOLERANCE}px\n`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    // Navigate to fullscreen search page
    console.log('📱 Loading fullscreen search interface...\n');
    await page.goto('http://localhost:5173/search', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait for keyboard to be visible
    await page.waitForSelector('.touch-keyboard', { timeout: 5000 });
    
    // Validate touch target sizes
    const sizeResults = await validateTouchTargets(page);
    
    // Validate spacing
    const spacingResults = await validateSpacing(page);
    
    // Print results
    console.log('\n' + '='.repeat(80));
    console.log('TOUCH TARGET SIZE VALIDATION RESULTS');
    console.log('='.repeat(80) + '\n');
    
    console.log(`✅ Passed: ${sizeResults.passed.length}`);
    console.log(`❌ Failed: ${sizeResults.failed.length}`);
    console.log(`⚠️  Warnings: ${sizeResults.warnings.length}\n`);
    
    if (sizeResults.failed.length > 0) {
      console.log('Failed Elements:');
      sizeResults.failed.forEach((fail, index) => {
        console.log(`\n${index + 1}. ${fail.element}`);
        console.log(`   Type: ${fail.type}`);
        console.log(`   Label: ${fail.label}`);
        console.log(`   Size: ${fail.size} (Required: ${fail.required})`);
        console.log(`   Issues: ${fail.issues.join(', ')}`);
      });
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('TOUCH TARGET SPACING VALIDATION RESULTS');
    console.log('='.repeat(80) + '\n');
    
    console.log(`✅ Passed: ${spacingResults.passed.length}`);
    console.log(`❌ Failed: ${spacingResults.failed.length}`);
    console.log(`⚠️  Warnings: ${spacingResults.warnings.length}\n`);
    
    if (spacingResults.failed.length > 0) {
      console.log('Failed Spacing:');
      spacingResults.failed.forEach((fail, index) => {
        console.log(`\n${index + 1}. ${fail.elements}`);
        console.log(`   Spacing: ${fail.spacing} (Required: ${fail.required})`);
        console.log(`   Issue: ${fail.issue}`);
      });
    }
    
    // Overall summary
    console.log('\n' + '='.repeat(80));
    console.log('OVERALL SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    const totalPassed = sizeResults.passed.length + spacingResults.passed.length;
    const totalFailed = sizeResults.failed.length + spacingResults.failed.length;
    const totalWarnings = sizeResults.warnings.length + spacingResults.warnings.length;
    
    console.log(`Total Passed: ${totalPassed}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log(`Total Warnings: ${totalWarnings}\n`);
    
    if (totalFailed === 0) {
      console.log('✅ All touch targets meet requirements!\n');
      process.exit(0);
    } else {
      console.log('❌ Some touch targets do not meet requirements.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run validation
runValidation().catch(console.error);
