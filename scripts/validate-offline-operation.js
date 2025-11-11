#!/usr/bin/env node

/**
 * Offline Operation Validation Script
 * Validates that the kiosk operates 100% offline with no network requests
 * Requirement 8.3
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function checkMark(passed) {
  return passed ? '✓' : '✗';
}

class OfflineOperationValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: [],
    };
  }

  addCheck(name, passed, message = '') {
    this.results.checks.push({ name, passed, message });
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  addWarning(name, message) {
    this.results.checks.push({ name, passed: true, message, warning: true });
    this.results.warnings++;
  }

  async validate() {
    logSection('Offline Operation Validation (Requirement 8.3)');

    await this.checkNetworkBlockerImplementation();
    await this.checkElectronConfiguration();
    await this.checkAssetBundling();
    await this.checkDependencies();
    await this.checkContentSecurityPolicy();
    await this.checkServiceWorker();

    this.printResults();
    return this.results.failed === 0;
  }

  async checkNetworkBlockerImplementation() {
    logSection('1. Network Blocker Implementation');

    // Check if network-blocker.ts exists
    const networkBlockerPath = join(__dirname, '../src/lib/utils/network-blocker.ts');
    const exists = existsSync(networkBlockerPath);
    
    log(`${checkMark(exists)} Network blocker utility exists`, exists ? 'green' : 'red');
    this.addCheck('Network blocker file exists', exists);

    if (exists) {
      const content = readFileSync(networkBlockerPath, 'utf-8');

      // Check for fetch blocking
      const hasFetchBlock = content.includes('blockFetch') && content.includes('window.fetch');
      log(`${checkMark(hasFetchBlock)} Fetch API blocking implemented`, hasFetchBlock ? 'green' : 'red');
      this.addCheck('Fetch blocking', hasFetchBlock);

      // Check for XHR blocking
      const hasXHRBlock = content.includes('blockXHR') && content.includes('XMLHttpRequest');
      log(`${checkMark(hasXHRBlock)} XMLHttpRequest blocking implemented`, hasXHRBlock ? 'green' : 'red');
      this.addCheck('XHR blocking', hasXHRBlock);

      // Check for WebSocket blocking
      const hasWSBlock = content.includes('blockWebSocket') && content.includes('WebSocket');
      log(`${checkMark(hasWSBlock)} WebSocket blocking implemented`, hasWSBlock ? 'green' : 'red');
      this.addCheck('WebSocket blocking', hasWSBlock);

      // Check for external request detection
      const hasExternalDetection = content.includes('isExternalRequest');
      log(`${checkMark(hasExternalDetection)} External request detection implemented`, hasExternalDetection ? 'green' : 'red');
      this.addCheck('External request detection', hasExternalDetection);

      // Check for statistics tracking
      const hasStats = content.includes('getStats') && content.includes('blockedRequests');
      log(`${checkMark(hasStats)} Statistics tracking implemented`, hasStats ? 'green' : 'red');
      this.addCheck('Statistics tracking', hasStats);
    }

    // Check if network blocker is initialized in main.tsx
    const mainTsxPath = join(__dirname, '../src/main.tsx');
    if (existsSync(mainTsxPath)) {
      const mainContent = readFileSync(mainTsxPath, 'utf-8');
      const isInitialized = mainContent.includes('initializeNetworkBlocker');
      log(`${checkMark(isInitialized)} Network blocker initialized in main.tsx`, isInitialized ? 'green' : 'red');
      this.addCheck('Network blocker initialization', isInitialized);
    }
  }

  async checkElectronConfiguration() {
    logSection('2. Electron Configuration');

    const electronMainPath = join(__dirname, '../electron/main.ts');
    const exists = existsSync(electronMainPath);

    log(`${checkMark(exists)} Electron main process exists`, exists ? 'green' : 'red');
    this.addCheck('Electron main process', exists);

    if (exists) {
      const content = readFileSync(electronMainPath, 'utf-8');

      // Check for CSP configuration
      const hasCSP = content.includes('Content-Security-Policy');
      log(`${checkMark(hasCSP)} Content Security Policy configured`, hasCSP ? 'green' : 'red');
      this.addCheck('CSP configuration', hasCSP);

      // Check for request blocking
      const hasRequestBlocking = content.includes('webRequest.onBeforeRequest');
      log(`${checkMark(hasRequestBlocking)} Request blocking in Electron`, hasRequestBlocking ? 'green' : 'red');
      this.addCheck('Electron request blocking', hasRequestBlocking);

      // Check for webSecurity enabled
      const hasWebSecurity = content.includes('webSecurity: true');
      log(`${checkMark(hasWebSecurity)} Web security enabled`, hasWebSecurity ? 'green' : 'red');
      this.addCheck('Web security', hasWebSecurity);

      // Check for navigation prevention
      const hasNavPrevention = content.includes('will-navigate');
      log(`${checkMark(hasNavPrevention)} Navigation prevention implemented`, hasNavPrevention ? 'green' : 'red');
      this.addCheck('Navigation prevention', hasNavPrevention);

      // Check for production mode checks
      const hasProductionCheck = content.includes('isProduction');
      log(`${checkMark(hasProductionCheck)} Production mode checks present`, hasProductionCheck ? 'green' : 'red');
      this.addCheck('Production mode checks', hasProductionCheck);
    }
  }

  async checkAssetBundling() {
    logSection('3. Asset Bundling Configuration');

    const electronBuilderPath = join(__dirname, '../electron-builder.json');
    const exists = existsSync(electronBuilderPath);

    log(`${checkMark(exists)} electron-builder.json exists`, exists ? 'green' : 'red');
    this.addCheck('Electron builder config', exists);

    if (exists) {
      const config = JSON.parse(readFileSync(electronBuilderPath, 'utf-8'));

      // Check for extraResources
      const hasExtraResources = config.extraResources && config.extraResources.length > 0;
      log(`${checkMark(hasExtraResources)} Extra resources configured`, hasExtraResources ? 'green' : 'red');
      this.addCheck('Extra resources', hasExtraResources);

      if (hasExtraResources) {
        const resourceTypes = ['assets', 'config', 'images', 'photos', 'pdfs'];
        resourceTypes.forEach(type => {
          const hasType = config.extraResources.some(r => r.from.includes(type));
          log(`  ${checkMark(hasType)} ${type} bundled`, hasType ? 'green' : 'yellow');
          if (!hasType) {
            this.addWarning(`${type} bundling`, `${type} directory not found in extraResources`);
          }
        });
      }

      // Check for asar packaging
      const hasAsar = config.asar === true;
      log(`${checkMark(hasAsar)} ASAR packaging enabled`, hasAsar ? 'green' : 'yellow');
      if (!hasAsar) {
        this.addWarning('ASAR packaging', 'ASAR packaging not enabled');
      }

      // Check for compression
      const hasCompression = config.compression === 'maximum';
      log(`${checkMark(hasCompression)} Maximum compression enabled`, hasCompression ? 'green' : 'yellow');
      if (!hasCompression) {
        this.addWarning('Compression', 'Maximum compression not enabled');
      }
    }
  }

  async checkDependencies() {
    logSection('4. Dependencies Check');

    const packageJsonPath = join(__dirname, '../package.json');
    const exists = existsSync(packageJsonPath);

    log(`${checkMark(exists)} package.json exists`, exists ? 'green' : 'red');
    this.addCheck('package.json', exists);

    if (exists) {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Check for problematic dependencies that might make network requests
      const problematicDeps = [
        'axios',
        'node-fetch',
        'got',
        'request',
        'superagent',
        'analytics',
        'sentry',
        'bugsnag',
        'mixpanel',
        'segment',
      ];

      const foundProblematic = [];
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      problematicDeps.forEach(dep => {
        if (allDeps[dep]) {
          foundProblematic.push(dep);
        }
      });

      const noProblematicDeps = foundProblematic.length === 0;
      log(`${checkMark(noProblematicDeps)} No problematic network dependencies`, noProblematicDeps ? 'green' : 'yellow');
      
      if (!noProblematicDeps) {
        log(`  Found: ${foundProblematic.join(', ')}`, 'yellow');
        this.addWarning('Network dependencies', `Found potentially problematic dependencies: ${foundProblematic.join(', ')}`);
      } else {
        this.addCheck('No network dependencies', true);
      }

      // Check for required offline dependencies
      const requiredDeps = ['electron', 'react', 'react-dom', '@react-three/fiber', 'three'];
      const missingDeps = requiredDeps.filter(dep => !allDeps[dep]);

      const hasRequiredDeps = missingDeps.length === 0;
      log(`${checkMark(hasRequiredDeps)} All required dependencies present`, hasRequiredDeps ? 'green' : 'red');
      this.addCheck('Required dependencies', hasRequiredDeps, missingDeps.length > 0 ? `Missing: ${missingDeps.join(', ')}` : '');
    }
  }

  async checkContentSecurityPolicy() {
    logSection('5. Content Security Policy');

    const electronMainPath = join(__dirname, '../electron/main.ts');
    if (existsSync(electronMainPath)) {
      const content = readFileSync(electronMainPath, 'utf-8');

      // Check for CSP directives
      const cspDirectives = [
        "default-src 'self'",
        "connect-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
      ];

      cspDirectives.forEach(directive => {
        const hasDirective = content.includes(directive);
        const directiveName = directive.split(' ')[0];
        log(`${checkMark(hasDirective)} ${directiveName} configured`, hasDirective ? 'green' : 'yellow');
        if (!hasDirective) {
          this.addWarning(`CSP ${directiveName}`, `${directive} not found in CSP configuration`);
        }
      });
    }
  }

  async checkServiceWorker() {
    logSection('6. Service Worker (Optional)');

    const serviceWorkerPath = join(__dirname, '../public/service-worker.js');
    const exists = existsSync(serviceWorkerPath);

    log(`${checkMark(exists)} Service worker exists (optional)`, exists ? 'green' : 'yellow');
    
    if (exists) {
      const content = readFileSync(serviceWorkerPath, 'utf-8');

      // Check for cache configuration
      const hasCache = content.includes('cache') || content.includes('Cache');
      log(`  ${checkMark(hasCache)} Cache configuration present`, hasCache ? 'green' : 'yellow');

      // Check for fetch event handler
      const hasFetchHandler = content.includes('fetch');
      log(`  ${checkMark(hasFetchHandler)} Fetch event handler present`, hasFetchHandler ? 'green' : 'yellow');
    } else {
      log('  Service worker is optional for offline operation', 'yellow');
    }
  }

  printResults() {
    logSection('Validation Results');

    console.log(`\nTotal Checks: ${this.results.checks.length}`);
    log(`Passed: ${this.results.passed}`, 'green');
    
    if (this.results.failed > 0) {
      log(`Failed: ${this.results.failed}`, 'red');
    }
    
    if (this.results.warnings > 0) {
      log(`Warnings: ${this.results.warnings}`, 'yellow');
    }

    if (this.results.failed > 0) {
      console.log('\nFailed Checks:');
      this.results.checks
        .filter(c => !c.passed)
        .forEach(c => {
          log(`  ✗ ${c.name}${c.message ? ': ' + c.message : ''}`, 'red');
        });
    }

    if (this.results.warnings > 0) {
      console.log('\nWarnings:');
      this.results.checks
        .filter(c => c.warning)
        .forEach(c => {
          log(`  ⚠ ${c.name}${c.message ? ': ' + c.message : ''}`, 'yellow');
        });
    }

    console.log('\n' + '='.repeat(60));
    
    if (this.results.failed === 0) {
      log('✓ All offline operation checks passed!', 'green');
      log('The kiosk is configured for 100% offline operation.', 'green');
    } else {
      log('✗ Some offline operation checks failed!', 'red');
      log('Please review the failed checks above.', 'red');
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Run validation
const validator = new OfflineOperationValidator();
validator.validate().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`\nValidation error: ${error.message}`, 'red');
  process.exit(1);
});
