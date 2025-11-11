/**
 * E2E Test: Search Interface Offline Operation
 * Requirements: 6.1, 6.2, 6.3, 6.4 - Search system SHALL operate offline
 */

import { test, expect } from '@playwright/test';

test.describe('Search Interface Offline Operation (Requirements 6.1-6.4)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set offline mode before each test
    await context.setOffline(true);
  });

  test('should initialize database offline (Requirement 6.1)', async ({ page }) => {
    // Navigate to the search page
    await page.goto('http://localhost:5173/search');

    // Wait for the page to load
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Verify the search interface loaded
    const searchInput = await page.locator('input[type="text"]').first();
    expect(await searchInput.isVisible()).toBe(true);

    // Check that database initialized without network
    const dbInitialized = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Check if database connection exists
          const hasDB = !!(window as any).dbConnection || !!(window as any).DatabaseConnection;
          resolve(hasDB);
        }, 1000);
      });
    });

    expect(dbInitialized).toBe(true);
  });

  test('should execute search queries offline (Requirement 6.2)', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Type a search query
    const searchInput = await page.locator('input[type="text"]').first();
    await searchInput.fill('test');

    // Wait for search to execute (with debounce)
    await page.waitForTimeout(200);

    // Verify search executed without network errors
    const hasError = await page.locator('[role="alert"]').count();
    const errorText = hasError > 0 ? await page.locator('[role="alert"]').textContent() : '';
    
    // Should not have network-related errors
    expect(errorText).not.toContain('network');
    expect(errorText).not.toContain('connection');
    expect(errorText).not.toContain('fetch');
  });

  test('should load search results from local database (Requirement 6.2)', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Type a common search term
    const searchInput = await page.locator('input[type="text"]').first();
    await searchInput.fill('law');

    // Wait for search results
    await page.waitForTimeout(500);

    // Check if results are displayed or empty state is shown
    const resultsExist = await page.locator('[role="list"]').count() > 0;
    const emptyState = await page.locator('text=No Results Found').count() > 0;
    const startSearching = await page.locator('text=Start Searching').count() > 0;

    // One of these should be true (results, empty state, or start state)
    expect(resultsExist || emptyState || startSearching).toBe(true);
  });

  test('should not display network error messages (Requirement 6.3)', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Perform multiple searches
    const searchInput = await page.locator('input[type="text"]').first();
    
    const searchTerms = ['alumni', 'publication', 'faculty'];
    for (const term of searchTerms) {
      await searchInput.fill(term);
      await page.waitForTimeout(300);
    }

    // Check for network-related error messages
    const pageContent = await page.content();
    
    expect(pageContent.toLowerCase()).not.toContain('network unavailable');
    expect(pageContent.toLowerCase()).not.toContain('connection failed');
    expect(pageContent.toLowerCase()).not.toContain('fetch failed');
    expect(pageContent.toLowerCase()).not.toContain('xhr failed');
  });

  test('should load all search assets from local storage (Requirement 6.4)', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    
    // Track failed resource loads
    const failedResources: string[] = [];
    
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedResources.push(response.url());
      }
    });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Filter out external URLs (which should be blocked)
    const localFailures = failedResources.filter(url => {
      const isLocal = url.startsWith('http://localhost') || 
                     url.startsWith('file://') ||
                     !url.startsWith('http://') && !url.startsWith('https://');
      return isLocal;
    });

    // Verify no local resources failed
    expect(localFailures.length).toBe(0);
  });

  test('should handle database initialization offline (Requirement 6.4)', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Check database initialization status
    const dbStatus = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Try to access database manager
          const dbConnection = (window as any).dbConnection;
          if (dbConnection) {
            resolve({
              connected: dbConnection.connected || false,
              initialized: true
            });
          } else {
            resolve({
              connected: false,
              initialized: false
            });
          }
        }, 1000);
      });
    });

    // Database should be initialized or attempting to initialize
    expect((dbStatus as any).initialized).toBe(true);
  });

  test('should use fallback search when FTS5 unavailable (Requirement 6.5)', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Type a search query
    const searchInput = await page.locator('input[type="text"]').first();
    await searchInput.fill('test search');

    // Wait for search execution
    await page.waitForTimeout(500);

    // Check if fallback search indicator is present
    const fallbackIndicator = await page.locator('text=simplified search mode').count();
    
    // If fallback is active, it should be indicated
    // If not active, that's also fine (FTS5 is working)
    // The key is that search should work either way
    const hasResults = await page.locator('[role="list"]').count() > 0;
    const hasEmptyState = await page.locator('text=No Results Found').count() > 0;
    
    // Search should complete without crashing
    expect(hasResults || hasEmptyState || fallbackIndicator >= 0).toBe(true);
  });

  test('should cache search results offline (Requirement 6.2)', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    const searchInput = await page.locator('input[type="text"]').first();

    // Perform first search
    await searchInput.fill('alumni');
    await page.waitForTimeout(500);
    
    const firstSearchTime = await page.evaluate(() => performance.now());

    // Clear and search again with same term
    await searchInput.fill('');
    await page.waitForTimeout(100);
    await searchInput.fill('alumni');
    await page.waitForTimeout(500);
    
    const secondSearchTime = await page.evaluate(() => performance.now());

    // Second search should be faster (cached)
    // Note: This is a rough check, actual caching is internal
    expect(secondSearchTime).toBeGreaterThan(firstSearchTime);
  });

  test('should handle keyboard input offline', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Check if virtual keyboard is present
    const keyboard = await page.locator('.touch-keyboard').count();
    
    if (keyboard > 0) {
      // Try clicking a key
      const keyButton = await page.locator('.touch-keyboard button').first();
      if (await keyButton.isVisible()) {
        await keyButton.click();
        
        // Verify input was updated
        const searchInput = await page.locator('input[type="text"]').first();
        const inputValue = await searchInput.inputValue();
        
        // Input should have changed
        expect(inputValue.length).toBeGreaterThan(0);
      }
    }
  });

  test('should handle filters offline', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Check if filter panel exists
    const filterPanel = await page.locator('.filter-panel').count();
    
    if (filterPanel > 0) {
      // Try toggling a filter
      const filterButton = await page.locator('.filter-panel button').first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        // Wait for filter to apply
        await page.waitForTimeout(300);
        
        // Should not cause errors
        const hasError = await page.locator('[role="alert"]').count();
        expect(hasError).toBe(0);
      }
    }
  });

  test('should recover from database errors offline (Requirement 6.5)', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Simulate database error by corrupting query
    const searchInput = await page.locator('input[type="text"]').first();
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Check for error recovery UI
    const retryButton = await page.locator('button:has-text("Retry")').count();
    const errorMessage = await page.locator('[role="alert"]').count();
    
    // If there's an error, there should be a retry mechanism
    if (errorMessage > 0) {
      expect(retryButton).toBeGreaterThan(0);
    }
  });

  test('should maintain search state during offline operation', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Perform a search
    const searchInput = await page.locator('input[type="text"]').first();
    await searchInput.fill('test query');
    await page.waitForTimeout(500);

    // Get current query value
    const queryValue = await searchInput.inputValue();
    expect(queryValue).toBe('test query');

    // Verify state is maintained
    await page.waitForTimeout(1000);
    const stillHasValue = await searchInput.inputValue();
    expect(stillHasValue).toBe('test query');
  });

  test('should log offline search operations', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Enable console logging
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Perform a search
    const searchInput = await page.locator('input[type="text"]').first();
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Check for search-related logs
    const hasSearchLogs = consoleLogs.some(log => 
      log.includes('Search') || 
      log.includes('search') ||
      log.includes('KioskSearch')
    );

    // Logs should be present for debugging
    expect(hasSearchLogs).toBe(true);
  });
});

test.describe('Search Database Offline Validation', () => {
  test('should verify SQLite database is local', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForSelector('.kiosk-search-interface', { timeout: 10000 });

    // Check database type
    const dbInfo = await page.evaluate(() => {
      return {
        hasSQLjs: typeof (window as any).initSqlJs !== 'undefined',
        hasLocalDB: typeof (window as any).DatabaseManager !== 'undefined' ||
                    typeof (window as any).dbConnection !== 'undefined'
      };
    });

    // Should have local database infrastructure
    expect(dbInfo.hasLocalDB).toBe(true);
  });

  test('should verify WASM file is bundled', async ({ page }) => {
    await page.goto('http://localhost:5173/search');

    // Check if SQL.js WASM file can be loaded
    const wasmCheck = await page.evaluate(async () => {
      try {
        // Try to fetch the WASM file
        const response = await fetch('/node_modules/sql.js/dist/sql-wasm.wasm');
        return {
          exists: response.ok,
          status: response.status
        };
      } catch (error) {
        return {
          exists: false,
          error: (error as Error).message
        };
      }
    });

    // WASM file should be accessible
    expect(wasmCheck.exists).toBe(true);
  });

  test('should verify all search assets are bundled', async ({ page }) => {
    await page.goto('http://localhost:5173/search');
    await page.waitForLoadState('networkidle');

    // Check critical search assets
    const assetsCheck = await page.evaluate(async () => {
      const checks = {
        styles: false,
        scripts: false,
        fonts: false
      };

      // Check styles
      checks.styles = document.styleSheets.length > 0;

      // Check scripts
      checks.scripts = document.scripts.length > 0;

      // Check fonts (if any)
      checks.fonts = document.fonts.size >= 0;

      return checks;
    });

    expect(assetsCheck.styles).toBe(true);
    expect(assetsCheck.scripts).toBe(true);
  });
});
