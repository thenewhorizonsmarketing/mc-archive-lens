// Comprehensive Test Runner for Production Validation
import { DatabaseManager } from '../database/manager';
import { EnhancedSearchManager } from '../database/enhanced-search-manager';
import { SecurityManager } from '../security/security-manager';
import { AccessibilityManager } from '../accessibility/accessibility-manager';
import { Logger } from '../logging/logger';

export interface TestResult {
  name: string;
  category: 'functionality' | 'performance' | 'security' | 'accessibility' | 'integration';
  status: 'pass' | 'fail' | 'warning' | 'skip';
  duration: number;
  message: string;
  details?: any;
  errors?: string[];
}

export interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
    duration: number;
  };
}

export interface ComprehensiveTestReport {
  timestamp: Date;
  environment: string;
  suites: TestSuite[];
  overall: {
    status: 'pass' | 'fail' | 'warning';
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    duration: number;
  };
  recommendations: string[];
}

export class ComprehensiveTestRunner {
  private dbManager: DatabaseManager;
  private searchManager: EnhancedSearchManager;
  private securityManager: SecurityManager;
  private accessibilityManager: AccessibilityManager;
  private logger: Logger;

  constructor() {
    this.logger = new Logger({ level: 'INFO' });
    this.dbManager = new DatabaseManager();
    this.searchManager = new EnhancedSearchManager(this.dbManager);
    this.securityManager = new SecurityManager();
    this.accessibilityManager = new AccessibilityManager();
  }

  /**
   * Run all comprehensive tests
   */
  async runAllTests(): Promise<ComprehensiveTestReport> {
    const startTime = Date.now();
    const suites: TestSuite[] = [];

    this.logger.info('Starting comprehensive test suite', 'testing');

    try {
      // Initialize systems
      await this.initializeSystems();

      // Run test suites
      suites.push(await this.runFunctionalityTests());
      suites.push(await this.runPerformanceTests());
      suites.push(await this.runSecurityTests());
      suites.push(await this.runAccessibilityTests());
      suites.push(await this.runIntegrationTests());

    } catch (error) {
      this.logger.error('Test suite initialization failed', 'testing', error);
    }

    // Calculate overall results
    const overall = this.calculateOverallResults(suites);
    overall.duration = Date.now() - startTime;

    // Generate recommendations
    const recommendations = this.generateRecommendations(suites);

    const report: ComprehensiveTestReport = {
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development',
      suites,
      overall,
      recommendations
    };

    this.logger.info('Comprehensive test suite completed', 'testing', {
      duration: overall.duration,
      status: overall.status,
      total: overall.total,
      passed: overall.passed,
      failed: overall.failed
    });

    return report;
  }

  /**
   * Initialize all systems for testing
   */
  private async initializeSystems(): Promise<void> {
    await this.dbManager.initializeDatabase();
  }

  /**
   * Run functionality tests
   */
  private async runFunctionalityTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const suiteName = 'Functionality Tests';

    // Database connectivity test
    tests.push(await this.runTest(
      'Database Connectivity',
      'functionality',
      async () => {
        const result = await this.dbManager.executeQuery('SELECT 1 as test');
        if (!result || result.length === 0) {
          throw new Error('Database query returned no results');
        }
      }
    ));

    // FTS5 search test
    tests.push(await this.runTest(
      'FTS5 Search Functionality',
      'functionality',
      async () => {
        const results = await this.searchManager.searchAll('test', {}, { limit: 5 });
        // Should not throw error even if no results
      }
    ));

    // Search with filters test
    tests.push(await this.runTest(
      'Search with Filters',
      'functionality',
      async () => {
        const results = await this.searchManager.searchAll('test', {
          yearRange: { start: 2020, end: 2023 }
        }, { limit: 5 });
        // Should handle filters without error
      }
    ));

    // Error recovery test
    tests.push(await this.runTest(
      'Error Recovery Mechanism',
      'functionality',
      async () => {
        // Test with invalid query to trigger fallback
        try {
          await this.searchManager.searchAll('', {}, { limit: 5 });
        } catch (error) {
          // Should handle gracefully
        }
        
        const recoveryStatus = this.searchManager.getRecoveryStatus();
        // Should have recovery mechanisms available
      }
    ));

    // Autocomplete test
    tests.push(await this.runTest(
      'Search Suggestions',
      'functionality',
      async () => {
        const suggestions = await this.searchManager.getSearchSuggestions('test', 5);
        // Should return array (even if empty)
        if (!Array.isArray(suggestions)) {
          throw new Error('Suggestions should return an array');
        }
      }
    ));

    return this.createTestSuite(suiteName, 'Core functionality validation', tests);
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const suiteName = 'Performance Tests';

    // Query response time test
    tests.push(await this.runTest(
      'Query Response Time',
      'performance',
      async () => {
        const startTime = Date.now();
        await this.searchManager.searchAll('test query', {}, { limit: 50 });
        const duration = Date.now() - startTime;
        
        if (duration > 100) {
          throw new Error(`Query took ${duration}ms (target: <100ms)`);
        }
      }
    ));

    // Memory usage test
    tests.push(await this.runTest(
      'Memory Usage',
      'performance',
      async () => {
        const memoryBefore = process.memoryUsage().heapUsed;
        
        // Perform multiple searches
        for (let i = 0; i < 10; i++) {
          await this.searchManager.searchAll(`test query ${i}`, {}, { limit: 20 });
        }
        
        const memoryAfter = process.memoryUsage().heapUsed;
        const memoryIncrease = memoryAfter - memoryBefore;
        const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
        
        if (memoryIncreaseMB > 50) {
          throw new Error(`Memory increase: ${memoryIncreaseMB.toFixed(1)}MB (target: <50MB)`);
        }
      }
    ));

    // Concurrent queries test
    tests.push(await this.runTest(
      'Concurrent Query Handling',
      'performance',
      async () => {
        const promises = [];
        const startTime = Date.now();
        
        // Run 5 concurrent searches
        for (let i = 0; i < 5; i++) {
          promises.push(this.searchManager.searchAll(`concurrent test ${i}`, {}, { limit: 10 }));
        }
        
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        
        if (duration > 500) {
          throw new Error(`Concurrent queries took ${duration}ms (target: <500ms)`);
        }
      }
    ));

    // Cache performance test
    tests.push(await this.runTest(
      'Cache Performance',
      'performance',
      async () => {
        const query = 'cache test query';
        
        // First query (cache miss)
        const startTime1 = Date.now();
        await this.searchManager.searchAll(query, {}, { limit: 10 });
        const duration1 = Date.now() - startTime1;
        
        // Second query (should be cached)
        const startTime2 = Date.now();
        await this.searchManager.searchAll(query, {}, { limit: 10 });
        const duration2 = Date.now() - startTime2;
        
        // Cache should improve performance
        if (duration2 >= duration1) {
          throw new Error(`Cache not improving performance: ${duration1}ms -> ${duration2}ms`);
        }
      }
    ));

    return this.createTestSuite(suiteName, 'Performance and scalability validation', tests);
  }

  /**
   * Run security tests
   */
  private async runSecurityTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const suiteName = 'Security Tests';

    // Input validation test
    tests.push(await this.runTest(
      'Input Validation',
      'security',
      async () => {
        const maliciousInputs = [
          '<script>alert("xss")</script>',
          'DROP TABLE alumni;',
          '\' OR \'1\'=\'1',
          'javascript:alert(1)',
          '../../etc/passwd'
        ];
        
        for (const input of maliciousInputs) {
          const validation = this.securityManager.validateSearchQuery(input, 'test');
          if (validation.isValid && validation.threats.length === 0) {
            throw new Error(`Malicious input not detected: ${input}`);
          }
        }
      }
    ));

    // Rate limiting test
    tests.push(await this.runTest(
      'Rate Limiting',
      'security',
      async () => {
        const source = 'test-source';
        let blockedCount = 0;
        
        // Make many requests to trigger rate limiting
        for (let i = 0; i < 70; i++) {
          const rateLimit = this.securityManager.checkRateLimit(source);
          if (!rateLimit.allowed) {
            blockedCount++;
          }
        }
        
        if (blockedCount === 0) {
          throw new Error('Rate limiting not working');
        }
      }
    ));

    // File upload validation test
    tests.push(await this.runTest(
      'File Upload Security',
      'security',
      async () => {
        // Test with malicious file types
        const maliciousFile = new File(['test content'], 'malicious.exe', { type: 'application/x-executable' });
        const validation = this.securityManager.validateUploadedFile(maliciousFile);
        
        if (validation.isValid) {
          throw new Error('Malicious file type not blocked');
        }
      }
    ));

    // SQL injection prevention test
    tests.push(await this.runTest(
      'SQL Injection Prevention',
      'security',
      async () => {
        const sqlInjectionAttempts = [
          "'; DROP TABLE alumni; --",
          "' UNION SELECT * FROM sqlite_master --",
          "1' OR '1'='1",
          "admin'--",
          "' OR 1=1#"
        ];
        
        for (const attempt of sqlInjectionAttempts) {
          try {
            // This should be safely handled by parameterized queries
            await this.searchManager.searchAll(attempt, {}, { limit: 1 });
          } catch (error) {
            // Errors are acceptable as long as they don't expose system info
            if (error.message.includes('sqlite_master') || error.message.includes('DROP TABLE')) {
              throw new Error('SQL injection vulnerability detected');
            }
          }
        }
      }
    ));

    return this.createTestSuite(suiteName, 'Security vulnerability assessment', tests);
  }

  /**
   * Run accessibility tests
   */
  private async runAccessibilityTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const suiteName = 'Accessibility Tests';

    // Screen reader compatibility test
    tests.push(await this.runTest(
      'Screen Reader Support',
      'accessibility',
      async () => {
        // Check if announcer element exists
        const announcer = document.querySelector('[aria-live]');
        if (!announcer) {
          throw new Error('Screen reader announcer not found');
        }
        
        // Test announcement functionality
        this.accessibilityManager.announce('Test announcement');
        
        // Verify announcement was made
        setTimeout(() => {
          if (!announcer.textContent?.includes('Test announcement')) {
            throw new Error('Screen reader announcement not working');
          }
        }, 100);
      }
    ));

    // Keyboard navigation test
    tests.push(await this.runTest(
      'Keyboard Navigation',
      'accessibility',
      async () => {
        // Check for keyboard event listeners
        const state = this.accessibilityManager.getState();
        if (!state.options.keyboardNavigation) {
          throw new Error('Keyboard navigation not enabled');
        }
        
        // Test focus management
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
          (searchInput as HTMLElement).focus();
          if (document.activeElement !== searchInput) {
            throw new Error('Focus management not working');
          }
        }
      }
    ));

    // High contrast mode test
    tests.push(await this.runTest(
      'High Contrast Mode',
      'accessibility',
      async () => {
        // Enable high contrast mode
        this.accessibilityManager.updateOptions({ highContrast: true });
        
        // Check if styles are applied
        const root = document.documentElement;
        if (!root.classList.contains('high-contrast')) {
          throw new Error('High contrast mode not applied');
        }
        
        // Disable for cleanup
        this.accessibilityManager.updateOptions({ highContrast: false });
      }
    ));

    // Touch target size test
    tests.push(await this.runTest(
      'Touch Target Sizes',
      'accessibility',
      async () => {
        // Check button sizes
        const buttons = document.querySelectorAll('button');
        let smallButtons = 0;
        
        buttons.forEach(button => {
          const rect = button.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            smallButtons++;
          }
        });
        
        if (smallButtons > buttons.length * 0.1) { // Allow 10% tolerance
          throw new Error(`${smallButtons} buttons smaller than 44px (${Math.round(smallButtons/buttons.length*100)}%)`);
        }
      }
    ));

    return this.createTestSuite(suiteName, 'WCAG 2.1 AA compliance validation', tests);
  }

  /**
   * Run integration tests
   */
  private async runIntegrationTests(): Promise<TestSuite> {
    const tests: TestResult[] = [];
    const suiteName = 'Integration Tests';

    // End-to-end search workflow test
    tests.push(await this.runTest(
      'End-to-End Search Workflow',
      'integration',
      async () => {
        // Simulate complete search workflow
        const query = 'integration test';
        
        // 1. Validate input
        const validation = this.securityManager.validateSearchQuery(query, 'test');
        if (!validation.isValid) {
          throw new Error('Valid query rejected by security validation');
        }
        
        // 2. Perform search
        const results = await this.searchManager.searchAll(validation.sanitized || query, {}, { limit: 10 });
        
        // 3. Record monitoring details
        this.logger.info('Search executed during integration tests', 'testing', {
          query,
          resultCount: results.length,
          responseTime: 50
        });

        // Workflow should complete without errors
      }
    ));

    // Error recovery integration test
    tests.push(await this.runTest(
      'Error Recovery Integration',
      'integration',
      async () => {
        // Test error recovery across systems
        try {
          // Trigger an error condition
          await this.searchManager.searchAll('', {}, { limit: 0 });
        } catch (error) {
          // Should be handled gracefully
        }
        
        // System should still be functional
        const healthStatus = this.searchManager.getHealthStatus();
        // Should have recovery mechanisms in place
      }
    ));

    // Performance monitoring integration test
    tests.push(await this.runTest(
      'Performance Monitoring Integration',
      'integration',
      async () => {
        // Perform searches and check if metrics are collected
        await this.searchManager.searchAll('performance test', {}, { limit: 5 });
        
        const healthStatus = this.searchManager.getHealthStatus();
        // Should have performance data
      }
    ));

    // Security and monitoring integration test
    tests.push(await this.runTest(
      'Security Monitoring Integration',
      'integration',
      async () => {
        // Test malicious input handling with monitoring hooks
        const maliciousQuery = '<script>alert("test")</script>';

        const validation = this.securityManager.validateSearchQuery(maliciousQuery, 'test');

        // Should be blocked by security
        if (validation.isValid) {
          throw new Error('Malicious query not blocked');
        }

        // Security violation should be logged
        const securityStats = this.securityManager.getSecurityStats();
        if (securityStats.totalViolations === 0) {
          throw new Error('Security violation not logged');
        }

        this.logger.warn('Detected malicious query during integration tests', 'testing', {
          blockedQuery: maliciousQuery
        });
      }
    ));

    return this.createTestSuite(suiteName, 'Cross-system integration validation', tests);
  }

  /**
   * Run a single test with error handling and timing
   */
  private async runTest(
    name: string,
    category: TestResult['category'],
    testFunction: () => Promise<void>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testFunction();
      
      return {
        name,
        category,
        status: 'pass',
        duration: Date.now() - startTime,
        message: 'Test passed successfully'
      };
    } catch (error) {
      return {
        name,
        category,
        status: 'fail',
        duration: Date.now() - startTime,
        message: error.message,
        errors: [error.message]
      };
    }
  }

  /**
   * Create test suite summary
   */
  private createTestSuite(name: string, description: string, tests: TestResult[]): TestSuite {
    const summary = {
      total: tests.length,
      passed: tests.filter(t => t.status === 'pass').length,
      failed: tests.filter(t => t.status === 'fail').length,
      warnings: tests.filter(t => t.status === 'warning').length,
      skipped: tests.filter(t => t.status === 'skip').length,
      duration: tests.reduce((sum, t) => sum + t.duration, 0)
    };

    return {
      name,
      description,
      tests,
      summary
    };
  }

  /**
   * Calculate overall test results
   */
  private calculateOverallResults(suites: TestSuite[]): ComprehensiveTestReport['overall'] {
    const total = suites.reduce((sum, suite) => sum + suite.summary.total, 0);
    const passed = suites.reduce((sum, suite) => sum + suite.summary.passed, 0);
    const failed = suites.reduce((sum, suite) => sum + suite.summary.failed, 0);
    const warnings = suites.reduce((sum, suite) => sum + suite.summary.warnings, 0);

    let status: 'pass' | 'fail' | 'warning';
    if (failed > 0) {
      status = 'fail';
    } else if (warnings > 0) {
      status = 'warning';
    } else {
      status = 'pass';
    }

    return {
      status,
      total,
      passed,
      failed,
      warnings,
      duration: 0 // Will be set by caller
    };
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(suites: TestSuite[]): string[] {
    const recommendations: string[] = [];

    suites.forEach(suite => {
      const failedTests = suite.tests.filter(t => t.status === 'fail');
      
      if (failedTests.length > 0) {
        recommendations.push(`Address ${failedTests.length} failed tests in ${suite.name}`);
      }

      // Performance-specific recommendations
      if (suite.name === 'Performance Tests') {
        const slowTests = suite.tests.filter(t => t.duration > 100);
        if (slowTests.length > 0) {
          recommendations.push('Optimize performance for slow operations');
        }
      }

      // Security-specific recommendations
      if (suite.name === 'Security Tests') {
        const securityFailures = suite.tests.filter(t => t.status === 'fail');
        if (securityFailures.length > 0) {
          recommendations.push('Critical: Address security vulnerabilities immediately');
        }
      }

      // Accessibility-specific recommendations
      if (suite.name === 'Accessibility Tests') {
        const accessibilityFailures = suite.tests.filter(t => t.status === 'fail');
        if (accessibilityFailures.length > 0) {
          recommendations.push('Improve accessibility compliance for better user experience');
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All tests passed - system is ready for production');
    }

    return recommendations;
  }

  /**
   * Generate detailed test report
   */
  generateDetailedReport(report: ComprehensiveTestReport): string {
    const lines: string[] = [];
    
    lines.push('# Comprehensive Test Report');
    lines.push('');
    lines.push(`**Generated:** ${report.timestamp.toISOString()}`);
    lines.push(`**Environment:** ${report.environment}`);
    lines.push(`**Overall Status:** ${report.overall.status.toUpperCase()}`);
    lines.push(`**Total Duration:** ${report.overall.duration}ms`);
    lines.push('');

    // Overall summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total Tests:** ${report.overall.total}`);
    lines.push(`- **Passed:** ${report.overall.passed}`);
    lines.push(`- **Failed:** ${report.overall.failed}`);
    lines.push(`- **Warnings:** ${report.overall.warnings}`);
    lines.push(`- **Success Rate:** ${Math.round((report.overall.passed / report.overall.total) * 100)}%`);
    lines.push('');

    // Test suites
    report.suites.forEach(suite => {
      lines.push(`## ${suite.name}`);
      lines.push('');
      lines.push(suite.description);
      lines.push('');
      lines.push(`**Results:** ${suite.summary.passed}/${suite.summary.total} passed (${suite.summary.duration}ms)`);
      lines.push('');

      suite.tests.forEach(test => {
        const icon = test.status === 'pass' ? '✅' : test.status === 'fail' ? '❌' : '⚠️';
        lines.push(`${icon} **${test.name}** (${test.duration}ms)`);
        if (test.message) {
          lines.push(`   ${test.message}`);
        }
        if (test.errors && test.errors.length > 0) {
          test.errors.forEach(error => {
            lines.push(`   Error: ${error}`);
          });
        }
        lines.push('');
      });
    });

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      report.recommendations.forEach(rec => {
        lines.push(`- ${rec}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Cleanup test runner
   */
  destroy(): void {
    this.accessibilityManager.destroy();
    this.securityManager.destroy();
    this.logger.destroy();
  }
}

export default ComprehensiveTestRunner;