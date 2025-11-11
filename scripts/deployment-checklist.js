#!/usr/bin/env node

/**
 * Kiosk Search Deployment Checklist
 * 
 * Validates that the application is ready for deployment by checking:
 * - Build configuration
 * - Test results
 * - Performance metrics
 * - Accessibility compliance
 * - Bundle sizes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

function warning() {
  return `${colors.yellow}⚠${colors.reset}`;
}

class DeploymentChecker {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  pass(message) {
    this.results.passed.push(message);
    log(`${checkmark()} ${message}`, 'green');
  }

  fail(message) {
    this.results.failed.push(message);
    log(`${crossmark()} ${message}`, 'red');
  }

  warn(message) {
    this.results.warnings.push(message);
    log(`${warning()} ${message}`, 'yellow');
  }

  async run() {
    log('\n=== Kiosk Search Deployment Checklist ===\n', 'cyan');

    await this.checkCodeQuality();
    await this.checkBuildConfiguration();
    await this.checkTests();
    await this.checkBundleSize();
    await this.checkDocumentation();
    await this.checkAccessibility();
    await this.checkPerformance();

    this.printSummary();
    
    return this.results.failed.length === 0;
  }

  async checkCodeQuality() {
    log('\n📋 Code Quality Checks', 'blue');
    
    // Check for TypeScript errors
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      this.pass('No TypeScript errors');
    } catch (error) {
      this.fail('TypeScript errors found');
    }

    // Check for ESLint warnings
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      this.pass('No ESLint warnings');
    } catch (error) {
      this.warn('ESLint warnings found (non-blocking)');
    }

    // Check for console.log statements
    try {
      const result = execSync('grep -r "console\\.log" src/ --exclude-dir=__tests__', { 
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      if (result) {
        this.warn('console.log statements found in source code');
      }
    } catch (error) {
      // No console.log found (grep returns non-zero when no matches)
      this.pass('No console.log statements in production code');
    }
  }

  async checkBuildConfiguration() {
    log('\n⚙️  Build Configuration', 'blue');

    // Check if vite.config.ts exists
    if (fs.existsSync('vite.config.ts')) {
      this.pass('vite.config.ts exists');
      
      const config = fs.readFileSync('vite.config.ts', 'utf-8');
      
      // Check for production optimizations
      if (config.includes('minify')) {
        this.pass('Minification enabled');
      } else {
        this.warn('Minification not explicitly configured');
      }

      if (config.includes('sourcemap: false') || config.includes('sourcemap:false')) {
        this.pass('Source maps disabled for production');
      } else {
        this.warn('Source maps may be enabled (increases bundle size)');
      }

      if (config.includes('drop_console')) {
        this.pass('Console statements will be removed in production');
      } else {
        this.warn('Console statements may remain in production build');
      }
    } else {
      this.fail('vite.config.ts not found');
    }

    // Check for environment variables
    if (fs.existsSync('.env.production')) {
      this.pass('.env.production exists');
    } else {
      this.warn('.env.production not found (may use defaults)');
    }
  }

  async checkTests() {
    log('\n🧪 Test Results', 'blue');

    try {
      execSync('npm test -- --run --reporter=json > test-results.json', { 
        stdio: 'pipe' 
      });
      
      if (fs.existsSync('test-results.json')) {
        const results = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));
        
        if (results.numFailedTests === 0) {
          this.pass(`All tests passing (${results.numPassedTests} tests)`);
        } else {
          this.fail(`${results.numFailedTests} test(s) failing`);
        }

        // Clean up
        fs.unlinkSync('test-results.json');
      } else {
        this.pass('Tests completed');
      }
    } catch (error) {
      this.fail('Tests failed or not configured');
    }
  }

  async checkBundleSize() {
    log('\n📦 Bundle Size', 'blue');

    // Build the application
    try {
      log('Building application...', 'cyan');
      execSync('npm run build', { stdio: 'pipe' });
      this.pass('Build completed successfully');
    } catch (error) {
      this.fail('Build failed');
      return;
    }

    // Check dist directory
    if (!fs.existsSync('dist')) {
      this.fail('dist directory not found');
      return;
    }

    // Calculate bundle sizes
    const distPath = path.join(process.cwd(), 'dist');
    const assetPath = path.join(distPath, 'assets');

    if (fs.existsSync(assetPath)) {
      const files = fs.readdirSync(assetPath);
      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;

      files.forEach(file => {
        const filePath = path.join(assetPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        if (file.endsWith('.js')) {
          jsSize += stats.size;
        } else if (file.endsWith('.css')) {
          cssSize += stats.size;
        }
      });

      const totalMB = (totalSize / 1024 / 1024).toFixed(2);
      const jsMB = (jsSize / 1024 / 1024).toFixed(2);
      const cssMB = (cssSize / 1024 / 1024).toFixed(2);

      log(`  Total: ${totalMB} MB`, 'cyan');
      log(`  JS: ${jsMB} MB`, 'cyan');
      log(`  CSS: ${cssMB} MB`, 'cyan');

      // Check against thresholds
      if (totalSize < 2 * 1024 * 1024) { // 2MB
        this.pass('Bundle size is optimal (< 2MB)');
      } else if (totalSize < 5 * 1024 * 1024) { // 5MB
        this.warn('Bundle size is acceptable but could be optimized');
      } else {
        this.fail('Bundle size is too large (> 5MB)');
      }
    } else {
      this.warn('Assets directory not found in dist');
    }
  }

  async checkDocumentation() {
    log('\n📚 Documentation', 'blue');

    const requiredDocs = [
      'docs/KIOSK_SEARCH_USER_GUIDE.md',
      'docs/KIOSK_SEARCH_DEVELOPER_GUIDE.md',
      'docs/KIOSK_SEARCH_DEPLOYMENT.md',
      'README.md'
    ];

    requiredDocs.forEach(doc => {
      if (fs.existsSync(doc)) {
        this.pass(`${path.basename(doc)} exists`);
      } else {
        this.warn(`${path.basename(doc)} not found`);
      }
    });
  }

  async checkAccessibility() {
    log('\n♿ Accessibility', 'blue');

    // Check for ARIA labels in components
    const componentsToCheck = [
      'src/components/kiosk/KioskSearchInterface.tsx',
      'src/components/kiosk/TouchKeyboard.tsx',
      'src/components/kiosk/FilterPanel.tsx',
      'src/components/kiosk/ResultsDisplay.tsx'
    ];

    let ariaLabelsFound = 0;
    componentsToCheck.forEach(component => {
      if (fs.existsSync(component)) {
        const content = fs.readFileSync(component, 'utf-8');
        if (content.includes('aria-label') || content.includes('aria-describedby')) {
          ariaLabelsFound++;
        }
      }
    });

    if (ariaLabelsFound >= componentsToCheck.length * 0.75) {
      this.pass('ARIA labels present in components');
    } else {
      this.warn('Some components may be missing ARIA labels');
    }

    // Check for keyboard navigation support
    const hasKeyboardSupport = componentsToCheck.some(component => {
      if (fs.existsSync(component)) {
        const content = fs.readFileSync(component, 'utf-8');
        return content.includes('onKeyDown') || content.includes('onKeyPress');
      }
      return false;
    });

    if (hasKeyboardSupport) {
      this.pass('Keyboard navigation support detected');
    } else {
      this.warn('Keyboard navigation may not be fully implemented');
    }
  }

  async checkPerformance() {
    log('\n⚡ Performance Configuration', 'blue');

    // Check for debouncing
    const searchInterface = 'src/components/kiosk/KioskSearchInterface.tsx';
    if (fs.existsSync(searchInterface)) {
      const content = fs.readFileSync(searchInterface, 'utf-8');
      
      if (content.includes('debounce') || content.includes('setTimeout')) {
        this.pass('Search debouncing implemented');
      } else {
        this.warn('Search debouncing may not be implemented');
      }

      if (content.includes('useMemo') || content.includes('useCallback')) {
        this.pass('React performance optimizations detected');
      } else {
        this.warn('Consider adding React performance optimizations');
      }
    }

    // Check for lazy loading
    const hasLazyLoading = fs.existsSync('src/pages/FullscreenSearchPage.tsx') &&
      fs.readFileSync('src/pages/FullscreenSearchPage.tsx', 'utf-8').includes('lazy');

    if (hasLazyLoading) {
      this.pass('Lazy loading implemented');
    } else {
      this.warn('Consider implementing lazy loading for better performance');
    }
  }

  printSummary() {
    log('\n' + '='.repeat(50), 'cyan');
    log('DEPLOYMENT CHECKLIST SUMMARY', 'cyan');
    log('='.repeat(50) + '\n', 'cyan');

    log(`${checkmark()} Passed: ${this.results.passed.length}`, 'green');
    log(`${warning()} Warnings: ${this.results.warnings.length}`, 'yellow');
    log(`${crossmark()} Failed: ${this.results.failed.length}`, 'red');

    if (this.results.failed.length > 0) {
      log('\n❌ DEPLOYMENT NOT RECOMMENDED', 'red');
      log('Please fix the failed checks before deploying.\n', 'red');
      process.exit(1);
    } else if (this.results.warnings.length > 0) {
      log('\n⚠️  DEPLOYMENT POSSIBLE WITH WARNINGS', 'yellow');
      log('Review warnings and proceed with caution.\n', 'yellow');
      process.exit(0);
    } else {
      log('\n✅ READY FOR DEPLOYMENT', 'green');
      log('All checks passed successfully!\n', 'green');
      process.exit(0);
    }
  }
}

// Run the checker
const checker = new DeploymentChecker();
checker.run().catch(error => {
  log(`\n❌ Error running deployment checklist: ${error.message}`, 'red');
  process.exit(1);
});
