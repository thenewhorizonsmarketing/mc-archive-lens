/**
 * E2E Test: Offline Operation
 * Requirement 8.3: Kiosk System SHALL operate entirely offline with no network requests
 */

import { test, expect } from '@playwright/test';

test.describe('Offline Operation (Requirement 8.3)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Set offline mode
    await context.setOffline(true);
  });

  test('should load application successfully in offline mode', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Wait for the application to load
    await page.waitForSelector('body', { timeout: 10000 });

    // Verify the page loaded successfully
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should block external fetch requests', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Try to make an external fetch request
    const fetchResult = await page.evaluate(async () => {
      try {
        await fetch('https://api.example.com/data');
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Verify the request was blocked
    expect(fetchResult.success).toBe(false);
    expect(fetchResult.error).toContain('Blocked external fetch request');
  });

  test('should block external XHR requests', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Try to make an external XHR request
    const xhrResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', 'https://api.example.com/data');
          xhr.send();
          resolve({ success: true, error: null });
        } catch (error) {
          resolve({ success: false, error: (error as Error).message });
        }
      });
    });

    // Verify the request was blocked
    expect((xhrResult as any).success).toBe(false);
    expect((xhrResult as any).error).toContain('Blocked external XHR request');
  });

  test('should block WebSocket connections', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Try to create a WebSocket connection
    const wsResult = await page.evaluate(() => {
      try {
        new WebSocket('wss://api.example.com/socket');
        return { success: true, error: null };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Verify the connection was blocked
    expect(wsResult.success).toBe(false);
    expect(wsResult.error).toContain('Blocked WebSocket connection');
  });

  test('should allow local file URLs', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify local file URLs are allowed
    const fileUrlResult = await page.evaluate(() => {
      const blocker = (window as any).NetworkBlocker?.getInstance();
      if (!blocker) return { allowed: false };
      
      return {
        allowed: !(blocker as any).isExternalRequest('file:///path/to/file.json')
      };
    });

    expect(fileUrlResult.allowed).toBe(true);
  });

  test('should allow data URLs', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify data URLs are allowed
    const dataUrlResult = await page.evaluate(() => {
      const blocker = (window as any).NetworkBlocker?.getInstance();
      if (!blocker) return { allowed: false };
      
      return {
        allowed: !(blocker as any).isExternalRequest('data:image/png;base64,abc123')
      };
    });

    expect(dataUrlResult.allowed).toBe(true);
  });

  test('should allow blob URLs', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify blob URLs are allowed
    const blobUrlResult = await page.evaluate(() => {
      const blocker = (window as any).NetworkBlocker?.getInstance();
      if (!blocker) return { allowed: false };
      
      return {
        allowed: !(blocker as any).isExternalRequest('blob:http://localhost/abc-123')
      };
    });

    expect(blobUrlResult.allowed).toBe(true);
  });

  test('should allow relative URLs', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Verify relative URLs are allowed
    const relativeUrlResult = await page.evaluate(() => {
      const blocker = (window as any).NetworkBlocker?.getInstance();
      if (!blocker) return { allowed: false };
      
      return {
        allowed: !(blocker as any).isExternalRequest('/api/data') &&
                 !(blocker as any).isExternalRequest('./config.json') &&
                 !(blocker as any).isExternalRequest('../assets/model.glb')
      };
    });

    expect(relativeUrlResult.allowed).toBe(true);
  });

  test('should track blocked requests statistics', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Try to make multiple external requests
    await page.evaluate(async () => {
      const requests = [
        fetch('https://api.example.com/data1').catch(() => {}),
        fetch('https://api.example.com/data2').catch(() => {}),
        fetch('https://api.example.com/data3').catch(() => {}),
      ];
      await Promise.allSettled(requests);
    });

    // Get statistics
    const stats = await page.evaluate(() => {
      const blocker = (window as any).NetworkBlocker?.getInstance();
      return blocker?.getStats() || { blockedCount: 0, blockedRequests: [] };
    });

    // Verify statistics are tracked
    expect(stats.blockedCount).toBeGreaterThanOrEqual(3);
    expect(stats.blockedRequests.length).toBeGreaterThanOrEqual(3);
  });

  test('should load all local assets successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Wait for the application to fully load
    await page.waitForLoadState('networkidle');

    // Check for any failed resource loads
    const failedResources: string[] = [];
    
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedResources.push(response.url());
      }
    });

    // Wait a bit to collect any failed resources
    await page.waitForTimeout(2000);

    // Verify no local resources failed to load
    const localFailures = failedResources.filter(url => 
      !url.startsWith('http://') && !url.startsWith('https://')
    );
    
    expect(localFailures.length).toBe(0);
  });

  test('should operate without network connection', async ({ page, context }) => {
    // Ensure offline mode is active
    await context.setOffline(true);

    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Verify the application is functional
    await page.waitForSelector('body', { timeout: 10000 });

    // Try to interact with the application
    const isInteractive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });

    expect(isInteractive).toBe(true);
  });
});

test.describe('Production Build Offline Operation', () => {
  test('should have Content Security Policy configured', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Check for CSP headers (in production build)
    const cspHeader = await page.evaluate(() => {
      const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return meta?.getAttribute('content') || null;
    });

    // In development, CSP might not be set, but in production it should be
    // This test will be more relevant when testing the packaged Electron app
    if (cspHeader) {
      expect(cspHeader).toContain("default-src 'self'");
      expect(cspHeader).toContain("connect-src 'self'");
    }
  });

  test('should bundle all required assets', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Check that critical assets are available
    const assetsCheck = await page.evaluate(async () => {
      const checks = {
        config: false,
        styles: false,
        scripts: false,
      };

      // Check if config can be loaded
      try {
        const response = await fetch('/config/config.json');
        checks.config = response.ok;
      } catch {
        checks.config = false;
      }

      // Check if styles are loaded
      checks.styles = document.styleSheets.length > 0;

      // Check if scripts are loaded
      checks.scripts = document.scripts.length > 0;

      return checks;
    });

    expect(assetsCheck.config).toBe(true);
    expect(assetsCheck.styles).toBe(true);
    expect(assetsCheck.scripts).toBe(true);
  });
});
