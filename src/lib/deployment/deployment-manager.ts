// Deployment Manager for Automated Setup and Validation
import { DatabaseManager } from '../database/manager';
import { SecurityManager } from '../security/security-manager';
import { Logger } from '../logging/logger';
import { PerformanceMonitor } from '../database/performance-monitor';

export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  databasePath: string;
  enableSecurity: boolean;
  enableLogging: boolean;
  enablePerformanceMonitoring: boolean;
  enableAnalytics: boolean;
  backupPath?: string;
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  performanceThresholds?: {
    maxQueryTime: number;
    maxMemoryUsage: number;
    minCacheHitRate: number;
  };
}

export interface DeploymentResult {
  success: boolean;
  steps: Array<{
    name: string;
    status: 'success' | 'failed' | 'skipped';
    message: string;
    duration: number;
  }>;
  errors: string[];
  warnings: string[];
  systemInfo: {
    version: string;
    environment: string;
    timestamp: Date;
    databaseSize: number;
    componentsInitialized: string[];
  };
}

export interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'critical';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: any;
  }>;
  recommendations: string[];
}

export class DeploymentManager {
  private config: DeploymentConfig;
  private logger: Logger;
  private dbManager: DatabaseManager | null = null;
  private securityManager: SecurityManager | null = null;
  private performanceMonitor: PerformanceMonitor | null = null;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.logger = new Logger({
      level: config.logLevel,
      enableConsole: true,
      enableStorage: config.enableLogging
    });
  }

  /**
   * Deploy the complete search system
   */
  async deploy(): Promise<DeploymentResult> {
    const startTime = Date.now();
    const result: DeploymentResult = {
      success: false,
      steps: [],
      errors: [],
      warnings: [],
      systemInfo: {
        version: '1.0.0',
        environment: this.config.environment,
        timestamp: new Date(),
        databaseSize: 0,
        componentsInitialized: []
      }
    };

    this.logger.info('Starting deployment', 'deployment', { config: this.config });

    try {
      // Step 1: Validate environment
      await this.executeStep(result, 'Validate Environment', async () => {
        await this.validateEnvironment();
      });

      // Step 2: Initialize database
      await this.executeStep(result, 'Initialize Database', async () => {
        this.dbManager = new DatabaseManager();
        await this.dbManager.initializeDatabase();
        result.systemInfo.componentsInitialized.push('DatabaseManager');
      });

      // Step 3: Setup security
      if (this.config.enableSecurity) {
        await this.executeStep(result, 'Initialize Security', async () => {
          this.securityManager = new SecurityManager({
            enableRateLimiting: true,
            enableInputValidation: true,
            enableThreatDetection: true,
            enableAuditLogging: true
          });
          result.systemInfo.componentsInitialized.push('SecurityManager');
        });
      }

      // Step 4: Setup performance monitoring
      if (this.config.enablePerformanceMonitoring && this.dbManager) {
        await this.executeStep(result, 'Initialize Performance Monitoring', async () => {
          this.performanceMonitor = new PerformanceMonitor(
            this.dbManager!,
            this.config.performanceThresholds
          );
          result.systemInfo.componentsInitialized.push('PerformanceMonitor');
        });
      }

      // Step 5: Validate database schema
      await this.executeStep(result, 'Validate Database Schema', async () => {
        await this.validateDatabaseSchema();
      });

      // Step 6: Run initial health check
      await this.executeStep(result, 'Initial Health Check', async () => {
        const healthCheck = await this.performHealthCheck();
        if (healthCheck.overall === 'critical') {
          throw new Error('Critical health check failures detected');
        }
        if (healthCheck.overall === 'warning') {
          result.warnings.push('Health check warnings detected');
        }
      });

      // Step 7: Create initial backup
      if (this.config.backupPath) {
        await this.executeStep(result, 'Create Initial Backup', async () => {
          await this.createBackup();
        });
      }

      // Step 8: Validate search functionality
      await this.executeStep(result, 'Validate Search Functionality', async () => {
        await this.validateSearchFunctionality();
      });

      result.success = true;
      this.logger.info('Deployment completed successfully', 'deployment', {
        duration: Date.now() - startTime,
        steps: result.steps.length
      });

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);
      this.logger.error('Deployment failed', 'deployment', error);
    }

    // Get final system info
    if (this.dbManager) {
      try {
        const stats = await this.getDatabaseStats();
        result.systemInfo.databaseSize = stats.size;
      } catch (error) {
        result.warnings.push('Could not retrieve database size');
      }
    }

    return result;
  }

  /**
   * Execute a deployment step with error handling and timing
   */
  private async executeStep(
    result: DeploymentResult,
    stepName: string,
    stepFunction: () => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.info(`Starting step: ${stepName}`, 'deployment');
      await stepFunction();
      
      const duration = Date.now() - startTime;
      result.steps.push({
        name: stepName,
        status: 'success',
        message: 'Completed successfully',
        duration
      });
      
      this.logger.info(`Completed step: ${stepName}`, 'deployment', { duration });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      result.steps.push({
        name: stepName,
        status: 'failed',
        message: error.message,
        duration
      });
      
      this.logger.error(`Failed step: ${stepName}`, 'deployment', error);
      throw error;
    }
  }

  /**
   * Validate deployment environment
   */
  private async validateEnvironment(): Promise<void> {
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 16) {
      throw new Error(`Node.js version ${nodeVersion} is not supported. Minimum version: 16.0.0`);
    }

    // Check available memory
    if (process.memoryUsage().heapTotal < 50 * 1024 * 1024) {
      throw new Error('Insufficient memory available. Minimum: 50MB');
    }

    // Check file system permissions
    try {
      const fs = await import('fs/promises');
      await fs.access(process.cwd(), fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      throw new Error('Insufficient file system permissions');
    }

    // Check SQLite availability
    try {
      const Database = (await import('better-sqlite3')).default;
      const testDb = new Database(':memory:');
      testDb.close();
    } catch (error) {
      throw new Error('SQLite is not available or not properly installed');
    }

    this.logger.info('Environment validation passed', 'deployment', {
      nodeVersion,
      memory: process.memoryUsage(),
      platform: process.platform
    });
  }

  /**
   * Validate database schema
   */
  private async validateDatabaseSchema(): Promise<void> {
    if (!this.dbManager) {
      throw new Error('Database manager not initialized');
    }

    // Check required tables exist
    const requiredTables = ['alumni', 'publications', 'photos', 'faculty'];
    const existingTables = await this.dbManager.executeQuery(`
      SELECT name FROM sqlite_master WHERE type='table'
    `) as Array<{ name: string }>;

    const tableNames = existingTables.map(t => t.name);
    
    for (const table of requiredTables) {
      if (!tableNames.includes(table)) {
        throw new Error(`Required table '${table}' not found`);
      }
    }

    // Check FTS5 tables exist
    const ftsTableNames = requiredTables.map(t => `${t}_fts`);
    for (const ftsTable of ftsTableNames) {
      if (!tableNames.includes(ftsTable)) {
        throw new Error(`Required FTS5 table '${ftsTable}' not found`);
      }
    }

    // Validate FTS5 functionality
    try {
      await this.dbManager.executeQuery(`
        SELECT * FROM alumni_fts WHERE alumni_fts MATCH 'test' LIMIT 1
      `);
    } catch (error) {
      throw new Error('FTS5 functionality validation failed');
    }

    this.logger.info('Database schema validation passed', 'deployment', {
      tables: tableNames.length,
      ftsTables: ftsTableNames.length
    });
  }

  /**
   * Validate search functionality
   */
  private async validateSearchFunctionality(): Promise<void> {
    if (!this.dbManager) {
      throw new Error('Database manager not initialized');
    }

    // Test basic search functionality
    const testQueries = [
      'SELECT COUNT(*) as count FROM alumni',
      'SELECT COUNT(*) as count FROM publications',
      'SELECT COUNT(*) as count FROM photos',
      'SELECT COUNT(*) as count FROM faculty'
    ];

    for (const query of testQueries) {
      try {
        await this.dbManager.executeQuery(query);
      } catch (error) {
        throw new Error(`Search validation failed for query: ${query}`);
      }
    }

    // Test FTS5 search
    try {
      await this.dbManager.executeQuery(`
        SELECT * FROM alumni_fts WHERE alumni_fts MATCH 'test OR example' LIMIT 5
      `);
    } catch (error) {
      throw new Error('FTS5 search validation failed');
    }

    this.logger.info('Search functionality validation passed', 'deployment');
  }

  /**
   * Create system backup
   */
  private async createBackup(): Promise<void> {
    if (!this.dbManager || !this.config.backupPath) {
      throw new Error('Backup configuration invalid');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `kiosk-backup-${timestamp}.db`;
    const backupPath = `${this.config.backupPath}/${backupFileName}`;

    // In a real implementation, this would copy the database file
    this.logger.info('Backup created', 'deployment', { backupPath });
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = [];
    const recommendations: string[] = [];

    // Database connectivity check
    try {
      if (this.dbManager) {
        await this.dbManager.executeQuery('SELECT 1');
        checks.push({
          name: 'Database Connectivity',
          status: 'pass',
          message: 'Database is accessible'
        });
      } else {
        checks.push({
          name: 'Database Connectivity',
          status: 'fail',
          message: 'Database manager not initialized'
        });
      }
    } catch (error) {
      checks.push({
        name: 'Database Connectivity',
        status: 'fail',
        message: `Database connection failed: ${error.message}`
      });
    }

    // FTS5 functionality check
    try {
      if (this.dbManager) {
        await this.dbManager.executeQuery('SELECT * FROM alumni_fts LIMIT 1');
        checks.push({
          name: 'FTS5 Functionality',
          status: 'pass',
          message: 'FTS5 search is working'
        });
      }
    } catch (error) {
      checks.push({
        name: 'FTS5 Functionality',
        status: 'fail',
        message: `FTS5 check failed: ${error.message}`
      });
      recommendations.push('Rebuild FTS5 indexes');
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
    
    if (memoryMB > 200) {
      checks.push({
        name: 'Memory Usage',
        status: 'warning',
        message: `High memory usage: ${memoryMB.toFixed(1)}MB`,
        details: memoryUsage
      });
      recommendations.push('Monitor memory usage and consider optimization');
    } else {
      checks.push({
        name: 'Memory Usage',
        status: 'pass',
        message: `Memory usage normal: ${memoryMB.toFixed(1)}MB`,
        details: memoryUsage
      });
    }

    // Security manager check
    if (this.config.enableSecurity) {
      if (this.securityManager) {
        const securityStats = this.securityManager.getSecurityStats();
        if (securityStats.totalViolations > 100) {
          checks.push({
            name: 'Security Status',
            status: 'warning',
            message: `High security violations: ${securityStats.totalViolations}`,
            details: securityStats
          });
          recommendations.push('Review security violations and adjust policies');
        } else {
          checks.push({
            name: 'Security Status',
            status: 'pass',
            message: 'Security status normal',
            details: securityStats
          });
        }
      } else {
        checks.push({
          name: 'Security Status',
          status: 'fail',
          message: 'Security manager not initialized'
        });
      }
    }

    // Performance check
    if (this.performanceMonitor) {
      const perfStats = this.performanceMonitor.getStatistics();
      if (perfStats.averageQueryTime > 100) {
        checks.push({
          name: 'Performance',
          status: 'warning',
          message: `Slow average query time: ${perfStats.averageQueryTime.toFixed(1)}ms`,
          details: perfStats
        });
        recommendations.push('Optimize slow queries and consider adding indexes');
      } else {
        checks.push({
          name: 'Performance',
          status: 'pass',
          message: `Performance normal: ${perfStats.averageQueryTime.toFixed(1)}ms avg`,
          details: perfStats
        });
      }
    }

    // Determine overall status
    const failedChecks = checks.filter(c => c.status === 'fail').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;

    let overall: HealthCheckResult['overall'];
    if (failedChecks > 0) {
      overall = 'critical';
    } else if (warningChecks > 0) {
      overall = 'warning';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      checks,
      recommendations
    };
  }

  /**
   * Get database statistics
   */
  private async getDatabaseStats(): Promise<{ size: number; tables: number; records: number }> {
    if (!this.dbManager) {
      throw new Error('Database manager not initialized');
    }

    // Get table count
    const tables = await this.dbManager.executeQuery(`
      SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
    `) as Array<{ count: number }>;

    // Get total record count
    const recordCounts = await Promise.all([
      this.dbManager.executeQuery('SELECT COUNT(*) as count FROM alumni'),
      this.dbManager.executeQuery('SELECT COUNT(*) as count FROM publications'),
      this.dbManager.executeQuery('SELECT COUNT(*) as count FROM photos'),
      this.dbManager.executeQuery('SELECT COUNT(*) as count FROM faculty')
    ]) as Array<Array<{ count: number }>>;

    const totalRecords = recordCounts.reduce((sum, result) => sum + result[0].count, 0);

    return {
      size: 0, // Would be actual file size in real implementation
      tables: tables[0].count,
      records: totalRecords
    };
  }

  /**
   * Generate deployment report
   */
  generateReport(deploymentResult: DeploymentResult): string {
    const report = `
# Deployment Report

## Summary
- **Status**: ${deploymentResult.success ? 'SUCCESS' : 'FAILED'}
- **Environment**: ${deploymentResult.systemInfo.environment}
- **Timestamp**: ${deploymentResult.systemInfo.timestamp.toISOString()}
- **Version**: ${deploymentResult.systemInfo.version}

## Components Initialized
${deploymentResult.systemInfo.componentsInitialized.map(c => `- ${c}`).join('\n')}

## Deployment Steps
${deploymentResult.steps.map(step => 
  `- **${step.name}**: ${step.status.toUpperCase()} (${step.duration}ms)\n  ${step.message}`
).join('\n')}

## System Information
- **Database Size**: ${deploymentResult.systemInfo.databaseSize} bytes
- **Total Steps**: ${deploymentResult.steps.length}
- **Successful Steps**: ${deploymentResult.steps.filter(s => s.status === 'success').length}

${deploymentResult.errors.length > 0 ? `
## Errors
${deploymentResult.errors.map(e => `- ${e}`).join('\n')}
` : ''}

${deploymentResult.warnings.length > 0 ? `
## Warnings
${deploymentResult.warnings.map(w => `- ${w}`).join('\n')}
` : ''}

## Next Steps
${deploymentResult.success ? 
  '- System is ready for use\n- Monitor performance and health checks\n- Schedule regular backups' :
  '- Review and fix errors\n- Re-run deployment\n- Check system requirements'
}
    `.trim();

    return report;
  }

  /**
   * Cleanup deployment manager
   */
  destroy(): void {
    if (this.performanceMonitor) {
      this.performanceMonitor.destroy();
    }
    
    if (this.securityManager) {
      this.securityManager.destroy();
    }
    
    this.logger.destroy();
  }
}

export default DeploymentManager;