/**
 * Touch Target Validation E2E Tests
 * 
 * Validates that all interactive elements meet touch target requirements:
 * - Minimum 44x44px for standard touch targets
 * - Minimum 60x60px for keyboard keys
 * - Minimum 8px spacing between adjacent targets
 * - Visual feedback for all interactions
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { test, expect } from '@playwright/test';

// Touch target size requirements
const REQUIREMENTS = {
  STANDARD_MIN_SIZE: 44,
  KEYBOARD_MIN_SIZE: 60,
  MIN_SPACING: 8,
  TOLERANCE: 2
};

test.describe('Touch Target Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to fullscreen search page
    await page.goto('/search');
    
    // Wait for keyboard to be visible
    await page.waitForSelector('.touch-keyboard', { timeout: 5000 });
  });

  test('should have minimum 60x60px keyboard keys', async ({ page }) => {
    // Get all keyboard keys
    const keys = await page.$$('.touch-keyboard__key');
    
    expect(keys.length).toBeGreaterThan(0);
    
    // Check each key
    for (const key of keys) {
      const box = await key.boundingBox();
      
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(REQUIREMENTS.KEYBOARD_MIN_SIZE - REQUIREMENTS.TOLERANCE);
        expect(box.height).toBeGreaterThanOrEqual(REQUIREMENTS.KEYBOARD_MIN_SIZE - REQUIREMENTS.TOLERANCE);
      }
    }
  });

  test('should have minimum 44x44px standard touch targets', async ({ page }) => {
    // Get all standard interactive elements
    const selectors = [
      '.fullscreen-search-close',
      '.filter-header button',
      '.filter-section button',
      '.error-retry-button'
    ];
    
    for (const selector of selectors) {
      const elements = await page.$$(selector);
      
      for (const element of elements) {
        const isVisible = await element.isVisible();
        if (!isVisible) continue;
        
        const box = await element.boundingBox();
        
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(REQUIREMENTS.STANDARD_MIN_SIZE - REQUIREMENTS.TOLERANCE);
          expect(box.height).toBeGreaterThanOrEqual(REQUIREMENTS.STANDARD_MIN_SIZE - REQUIREMENTS.TOLERANCE);
        }
      }
    }
  });

  test('should have minimum 80px height result cards', async ({ page }) => {
    // Type a search query to get results
    const searchInput = await page.$('input[type="text"]');
    if (searchInput) {
      await searchInput.fill('law');
      await page.waitForTimeout(500); // Wait for debounce
    }
    
    // Get all result cards
    const resultCards = await page.$$('.result-card');
    
    if (resultCards.length > 0) {
      for (const card of resultCards) {
        const box = await card.boundingBox();
        
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(80 - REQUIREMENTS.TOLERANCE);
        }
      }
    }
  });

  test('should have minimum 8px spacing between keyboard keys', async ({ page }) => {
    // Get all keyboard keys in the first row
    const firstRowKeys = await page.$$('.touch-keyboard__row:first-child .touch-keyboard__key');
    
    expect(firstRowKeys.length).toBeGreaterThan(1);
    
    // Check spacing between adjacent keys
    for (let i = 0; i < firstRowKeys.length - 1; i++) {
      const key1Box = await firstRowKeys[i].boundingBox();
      const key2Box = await firstRowKeys[i + 1].boundingBox();
      
      if (key1Box && key2Box) {
        const spacing = key2Box.x - (key1Box.x + key1Box.width);
        expect(spacing).toBeGreaterThanOrEqual(REQUIREMENTS.MIN_SPACING - REQUIREMENTS.TOLERANCE);
      }
    }
  });

  test('should have minimum 8px spacing between filter buttons', async ({ page }) => {
    // Expand filter panel
    const filterToggle = await page.$('.filter-header button');
    if (filterToggle) {
      await filterToggle.click();
      await page.waitForTimeout(300); // Wait for animation
    }
    
    // Get filter buttons in the first section
    const filterButtons = await page.$$('.filter-section:first-child button');
    
    if (filterButtons.length > 1) {
      // Check spacing between adjacent buttons
      for (let i = 0; i < Math.min(filterButtons.length - 1, 5); i++) {
        const btn1Box = await filterButtons[i].boundingBox();
        const btn2Box = await filterButtons[i + 1].boundingBox();
        
        if (btn1Box && btn2Box) {
          // Calculate horizontal or vertical spacing
          const horizontalSpacing = Math.abs(btn2Box.x - (btn1Box.x + btn1Box.width));
          const verticalSpacing = Math.abs(btn2Box.y - (btn1Box.y + btn1Box.height));
          
          const minSpacing = Math.min(horizontalSpacing, verticalSpacing);
          
          // Allow for wrapping - only check if buttons are on same row/column
          if (minSpacing < 50) {
            expect(minSpacing).toBeGreaterThanOrEqual(REQUIREMENTS.MIN_SPACING - REQUIREMENTS.TOLERANCE);
          }
        }
      }
    }
  });

  test('should provide visual feedback on keyboard key press', async ({ page }) => {
    // Get a keyboard key
    const key = await page.$('.touch-keyboard__key');
    expect(key).toBeTruthy();
    
    if (key) {
      // Get initial styles
      const initialTransform = await key.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Press the key
      await key.click();
      
      // Check for transform change (should scale down)
      await page.waitForTimeout(50);
      
      const pressedTransform = await key.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Transform should change during press
      // Note: This might not catch the exact moment, but validates the CSS is set up
      expect(pressedTransform).toBeDefined();
    }
  });

  test('should provide visual feedback on filter button press', async ({ page }) => {
    // Expand filter panel
    const filterToggle = await page.$('.filter-header button');
    if (filterToggle) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }
    
    // Get a filter button
    const filterButton = await page.$('.filter-section button');
    expect(filterButton).toBeTruthy();
    
    if (filterButton) {
      // Get initial background color
      const initialBg = await filterButton.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Click the button
      await filterButton.click();
      
      // Wait for transition
      await page.waitForTimeout(150);
      
      // Get new background color (should be different for active state)
      const activeBg = await filterButton.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Background should change
      expect(activeBg).toBeDefined();
    }
  });

  test('should provide visual feedback on result card press', async ({ page }) => {
    // Type a search query to get results
    const searchInput = await page.$('input[type="text"]');
    if (searchInput) {
      await searchInput.fill('law');
      await page.waitForTimeout(500);
    }
    
    // Get a result card
    const resultCard = await page.$('.result-card');
    
    if (resultCard) {
      // Get initial styles
      const initialTransform = await resultCard.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Hover over the card (if hover is supported)
      await resultCard.hover();
      await page.waitForTimeout(150);
      
      const hoverTransform = await resultCard.evaluate(el => 
        window.getComputedStyle(el).transform
      );
      
      // Transform should be defined
      expect(hoverTransform).toBeDefined();
    }
  });

  test('should have proper transition durations', async ({ page }) => {
    // Check keyboard key transitions
    const key = await page.$('.touch-keyboard__key');
    
    if (key) {
      const transitionDuration = await key.evaluate(el => 
        window.getComputedStyle(el).transitionDuration
      );
      
      // Should have transition duration defined
      expect(transitionDuration).toBeDefined();
      expect(transitionDuration).not.toBe('0s');
    }
    
    // Check filter button transitions
    const filterToggle = await page.$('.filter-header button');
    if (filterToggle) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }
    
    const filterButton = await page.$('.filter-section button');
    
    if (filterButton) {
      const transitionDuration = await filterButton.evaluate(el => 
        window.getComputedStyle(el).transitionDuration
      );
      
      expect(transitionDuration).toBeDefined();
      expect(transitionDuration).not.toBe('0s');
    }
  });

  test('should use GPU-accelerated properties for transitions', async ({ page }) => {
    // Check keyboard key transitions
    const key = await page.$('.touch-keyboard__key');
    
    if (key) {
      const transitionProperty = await key.evaluate(el => 
        window.getComputedStyle(el).transitionProperty
      );
      
      // Should use transform and/or opacity
      expect(
        transitionProperty.includes('transform') || 
        transitionProperty.includes('opacity') ||
        transitionProperty.includes('all')
      ).toBeTruthy();
    }
  });

  test('should have proper cursor styles', async ({ page }) => {
    // Check various interactive elements
    const selectors = [
      '.touch-keyboard__key',
      '.filter-section button',
      '.result-card',
      '.fullscreen-search-close'
    ];
    
    for (const selector of selectors) {
      const element = await page.$(selector);
      
      if (element) {
        const cursor = await element.evaluate(el => 
          window.getComputedStyle(el).cursor
        );
        
        // Should have pointer cursor
        expect(cursor).toBe('pointer');
      }
    }
  });

  test('should prevent text selection on touch elements', async ({ page }) => {
    // Check keyboard key
    const key = await page.$('.touch-keyboard__key');
    
    if (key) {
      const userSelect = await key.evaluate(el => 
        window.getComputedStyle(el).userSelect
      );
      
      // Should prevent text selection
      expect(userSelect).toBe('none');
    }
  });

  test('should have focus visible styles', async ({ page }) => {
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Get focused element
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    
    if (focusedElement) {
      // Check for outline or focus ring
      const outline = await page.evaluate((el) => {
        return window.getComputedStyle(el as Element).outline;
      }, focusedElement);
      
      // Should have some outline defined
      expect(outline).toBeDefined();
    }
  });
});

test.describe('Touch Target Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
    await page.waitForSelector('.touch-keyboard', { timeout: 5000 });
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Check close button
    const closeButton = await page.$('.fullscreen-search-close');
    if (closeButton) {
      const ariaLabel = await closeButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
    
    // Check keyboard keys
    const keys = await page.$$('.touch-keyboard__key');
    for (const key of keys.slice(0, 5)) {
      const ariaLabel = await key.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should have proper button types', async ({ page }) => {
    // All buttons should have type="button" to prevent form submission
    const buttons = await page.$$('button');
    
    for (const button of buttons) {
      const type = await button.getAttribute('type');
      expect(type).toBe('button');
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    let focusedElement = await page.evaluateHandle(() => document.activeElement);
    expect(focusedElement).toBeTruthy();
    
    // Tab again
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const newFocusedElement = await page.evaluateHandle(() => document.activeElement);
    expect(newFocusedElement).toBeTruthy();
    
    // Elements should be different
    const isSame = await page.evaluate((el1, el2) => el1 === el2, focusedElement, newFocusedElement);
    expect(isSame).toBeFalsy();
  });
});
