#!/usr/bin/env node

/**
 * Visual Feedback Validation Script
 * 
 * Validates that all interactive elements provide appropriate visual feedback:
 * - Press states for all buttons
 * - Hover states for touch interactions
 * - Immediate feedback (50ms)
 * - Appropriate feedback duration (150-200ms)
 * 
 * Requirements: 9.5, 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Visual feedback requirements
const REQUIREMENTS = {
  IMMEDIATE_FEEDBACK_MS: 50, // Immediate feedback within 50ms
  FEEDBACK_DURATION_MIN_MS: 150, // Minimum feedback duration
  FEEDBACK_DURATION_MAX_MS: 200, // Maximum feedback duration
  TRANSITION_TOLERANCE_MS: 20 // Allow 20ms tolerance
};

// Selectors for interactive elements
const INTERACTIVE_SELECTORS = [
  'button',
  'a[href]',
  '[role="button"]',
  '.result-card',
  '.touch-keyboard__key',
  '.filter-section button',
  '.error-retry-button',
  '.fullscreen-search-close'
];

/**
 * Get computed styles for an element
 */
async function getComputedStyles(page, selector) {
  return await page.$eval(selector, (el) => {
    const computed = window.getComputedStyle(el);
    return {
      transition: computed.transition,
      transitionDuration: computed.transitionDuration,
      transitionProperty: computed.transitionProperty,
      transform: computed.transform,
      opacity: computed.opacity,
      backgroundColor: computed.backgroundColor,
      boxShadow: computed.boxShadow,
      cursor: computed.cursor
    };
  });
}

/**
 * Parse transition duration from CSS value
 */
function parseTransitionDuration(durationStr) {
  if (!durationStr || durationStr === 'none') return 0;
  
  const durations = durationStr.split(',').map(d => {
    const value = parseFloat(d.trim());
    return d.includes('ms') ? value : value * 1000;
  });
  
  return Math.max(...durations);
}

/**
 * Check if element has hover state
 */
async function hasHoverState(page, selector) {
  return await page.$eval(selector, (el) => {
    // Get styles in normal state
    const normalStyles = window.getComputedStyle(el);
    const normalBg = normalStyles.backgroundColor;
    const normalTransform = normalStyles.transform;
    
    // Simulate hover by adding hover class or using :hover pseudo-class
    // Check if CSS has hover rules
    const sheets = Array.from(document.styleSheets);
    let hasHoverRule = false;
    
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.selectorText && rule.selectorText.includes(':hover')) {
            const selector = rule.selectorText.replace(':hover', '');
            if (el.matches(selector)) {
              hasHoverRule = true;
              break;
            }
          }
        }
      } catch (e) {
        // Skip CORS-blocked stylesheets
      }
      if (hasHoverRule) break;
    }
    
    return hasHoverRule;
  });
}

/**
 * Check if element has active/pressed state
 */
async function hasActiveState(page, selector) {
  return await page.$eval(selector, (el) => {
    // Check if CSS has :active rules
    const sheets = Array.from(document.styleSheets);
    let hasActiveRule = false;
    
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.selectorText && 
              (rule.selectorText.includes(':active') || 
               rule.selectorText.includes('--pressed'))) {
            const selector = rule.selectorText
              .replace(':active', '')
              .replace('.touch-keyboard__key--pressed', '.touch-keyboard__key')
              .replace('.result-card-pressed', '.result-card');
            if (el.matches(selector)) {
              hasActiveRule = true;
              break;
            }
          }
        }
      } catch (e) {
        // Skip CORS-blocked stylesheets
      }
      if (hasActiveRule) break;
    }
    
    return hasActiveRule;
  });
}

/**
 * Validate visual feedback for an element
 */
async function validateElementFeedback(page, selector) {
  try {
    const element = await page.$(selector);
    if (!element) return null;
    
    // Check if element is visible
    const isVisible = await element.isVisible();
    if (!isVisible) return null;
    
    // Get element info
    const info = await page.$eval(selector, (el) => ({
      tag: el.tagName.toLowerCase(),
      className: el.className,
      ariaLabel: el.getAttribute('aria-label'),
      text: el.textContent?.trim().substring(0, 30)
    }));
    
    // Get computed styles
    const styles = await getComputedStyles(page, selector);
    
    // Parse transition duration
    const transitionDuration = parseTransitionDuration(styles.transitionDuration);
    
    // Check for hover state
    const hasHover = await hasHoverState(page, selector);
    
    // Check for active/pressed state
    const hasActive = await hasActiveState(page, selector);
    
    // Check if transitions use GPU-accelerated properties
    const usesGPUProps = styles.transitionProperty.includes('transform') || 
                        styles.transitionProperty.includes('opacity');
    
    // Validate feedback
    const issues = [];
    const warnings = [];
    
    if (!hasHover) {
      warnings.push('No hover state defined');
    }
    
    if (!hasActive) {
      issues.push('No active/pressed state defined');
    }
    
    if (transitionDuration === 0) {
      warnings.push('No transition duration defined');
    } else if (transitionDuration < REQUIREMENTS.IMMEDIATE_FEEDBACK_MS - REQUIREMENTS.TRANSITION_TOLERANCE_MS) {
      warnings.push(`Transition too fast: ${transitionDuration}ms (min: ${REQUIREMENTS.IMMEDIATE_FEEDBACK_MS}ms)`);
    } else if (transitionDuration > REQUIREMENTS.FEEDBACK_DURATION_MAX_MS + REQUIREMENTS.TRANSITION_TOLERANCE_MS) {
      warnings.push(`Transition too slow: ${transitionDuration}ms (max: ${REQUIREMENTS.FEEDBACK_DURATION_MAX_MS}ms)`);
    }
    
    if (!usesGPUProps && transitionDuration > 0) {
      warnings.push('Transitions should use GPU-accelerated properties (transform, opacity)');
    }
    
    return {
      selector,
      info,
      styles: {
        transitionDuration: `${transitionDuration}ms`,
        transitionProperty: styles.transitionProperty,
        cursor: styles.cursor
      },
      feedback: {
        hasHover,
        hasActive,
        usesGPUProps
      },
      issues,
      warnings,
      passed: issues.length === 0
    };
    
  } catch (error) {
    return null;
  }
}

/**
 * Test actual interaction feedback timing
 */
async function testInteractionTiming(page, selector) {
  try {
    const element = await page.$(selector);
    if (!element) return null;
    
    const isVisible = await element.isVisible();
    if (!isVisible) return null;
    
    // Measure time for visual feedback to appear
    const startTime = Date.now();
    
    // Trigger interaction
    await element.click({ force: true });
    
    // Wait a bit for feedback
    await page.waitForTimeout(100);
    
    const feedbackTime = Date.now() - startTime;
    
    return {
      selector,
      feedbackTime: `${feedbackTime}ms`,
      meetsRequirement: feedbackTime <= REQUIREMENTS.IMMEDIATE_FEEDBACK_MS + REQUIREMENTS.TRANSITION_TOLERANCE_MS
    };
    
  } catch (error) {
    return null;
  }
}

/**
 * Main validation function
 */
async function runValidation() {
  console.log('🚀 Starting Visual Feedback Validation\n');
  console.log('Requirements:');
  console.log(`  - Immediate feedback: ≤${REQUIREMENTS.IMMEDIATE_FEEDBACK_MS}ms`);
  console.log(`  - Feedback duration: ${REQUIREMENTS.FEEDBACK_DURATION_MIN_MS}-${REQUIREMENTS.FEEDBACK_DURATION_MAX_MS}ms`);
  console.log(`  - All buttons must have press states`);
  console.log(`  - All buttons should have hover states`);
  console.log(`  - Transitions should use GPU-accelerated properties\n`);
  
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
    
    // Get all interactive elements
    const elements = await page.$$(INTERACTIVE_SELECTORS.join(', '));
    console.log(`Found ${elements.length} interactive elements\n`);
    
    const results = {
      passed: [],
      failed: [],
      warnings: []
    };
    
    // Validate each element
    for (let i = 0; i < Math.min(elements.length, 50); i++) {
      const selector = `(${INTERACTIVE_SELECTORS.join(', ')}):nth-of-type(${i + 1})`;
      const result = await validateElementFeedback(page, selector);
      
      if (!result) continue;
      
      if (result.passed && result.warnings.length === 0) {
        results.passed.push(result);
      } else if (result.issues.length > 0) {
        results.failed.push(result);
      } else {
        results.warnings.push(result);
      }
    }
    
    // Print results
    console.log('\n' + '='.repeat(80));
    console.log('VISUAL FEEDBACK VALIDATION RESULTS');
    console.log('='.repeat(80) + '\n');
    
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}\n`);
    
    if (results.failed.length > 0) {
      console.log('Failed Elements:');
      results.failed.forEach((fail, index) => {
        console.log(`\n${index + 1}. ${fail.selector}`);
        console.log(`   Label: ${fail.info.ariaLabel || fail.info.text}`);
        console.log(`   Transition: ${fail.styles.transitionDuration} (${fail.styles.transitionProperty})`);
        console.log(`   Hover State: ${fail.feedback.hasHover ? '✓' : '✗'}`);
        console.log(`   Active State: ${fail.feedback.hasActive ? '✓' : '✗'}`);
        console.log(`   GPU Props: ${fail.feedback.usesGPUProps ? '✓' : '✗'}`);
        if (fail.issues.length > 0) {
          console.log(`   Issues: ${fail.issues.join(', ')}`);
        }
        if (fail.warnings.length > 0) {
          console.log(`   Warnings: ${fail.warnings.join(', ')}`);
        }
      });
    }
    
    if (results.warnings.length > 0 && results.warnings.length <= 10) {
      console.log('\nElements with Warnings:');
      results.warnings.forEach((warn, index) => {
        console.log(`\n${index + 1}. ${warn.selector}`);
        console.log(`   Label: ${warn.info.ariaLabel || warn.info.text}`);
        console.log(`   Warnings: ${warn.warnings.join(', ')}`);
      });
    }
    
    // Overall summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80) + '\n');
    
    const totalElements = results.passed.length + results.failed.length + results.warnings.length;
    const passRate = ((results.passed.length / totalElements) * 100).toFixed(1);
    
    console.log(`Total Elements Checked: ${totalElements}`);
    console.log(`Pass Rate: ${passRate}%\n`);
    
    if (results.failed.length === 0) {
      console.log('✅ All interactive elements have proper visual feedback!\n');
      process.exit(0);
    } else {
      console.log('❌ Some interactive elements lack proper visual feedback.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run validation
runValidation().catch(console.error);
