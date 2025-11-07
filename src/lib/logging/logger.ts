// Comprehensive Logging System with Structured Data and Error Correlation
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  category: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  performance?: {
    duration?: number;
    memory?: number;
    cpu?: number;
  };
  metadata?: Record<string, any>;
}

export interface LoggerOptions {
  level?: LogLevel;
  enableConsole?: boolean;
  enableStorage?: boolean;
  enableRemote?: boolean;
  maxStorageEntries?: number;
  rotationSize?: number;
  enablePerformanceTracking?: boolean;
  enableErrorCorrelation?: boolean;
  remoteEndpoint?: string;
  batchSize?: number;
  flushInterval?: number;
}

export interface LogFilter {
  level?: LogLevel;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  correlationId?: string;
  sessionId?: string;
  searchText?: string;
}

export interface LogStatistics {
  totalEntries: number;
  entriesByLevel: Record<LogLevel, number>;
  entriesByCategory: Record<string, number>;
  errorRate: number;
  averageResponseTime: number;
  topErrors: Array<{ error: string; count: number }>;
  recentErrors: LogEntry[];
  performanceMetrics: {
    averageMemory: number;
    peakMemory: number;
    averageDuration: number;
    slowestOperations: Array<{ operation: string; duration: number }>;
  };
}

export class Logger {
  private options: LoggerOptions;
  private entries: LogEntry[] = [];
  private correlationMap: Map<string, string[]> = new Map();
  private errorPatterns: Map<string, number> = new Map();
  private performanceData: Array<{ operation: string; duration: number; timestamp: Date }> = [];
  private batchQueue: LogEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      level: 'INFO',
      enableConsole: true,
      enableStorage: true,
      enableRemote: false,
      maxStorageEntries: 10000,
      rotationSize: 1000,
      enablePerformanceTracking: true,
      enableErrorCorrelation: true,
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      ...options
    };

    this.initialize();
  }

  /**
   * Initialize logger
   */
  private initialize(): void {
    this.loadStoredLogs();
    this.setupFlushTimer();
    this.setupErrorHandlers();
  }

  /**
   * Log debug message
   */
  debug(message: string, category: string = 'general', context?: Record<string, any>): void {
    this.log('DEBUG', message, category, context);
  }

  /**
   * Log info message
   */
  info(message: string, category: string = 'general', context?: Record<string, any>): void {
    this.log('INFO', message, category, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, category: string = 'general', context?: Record<string, any>): void {
    this.log('WARN', message, category, context);
  }

  /**
   * Log error message
   */
  error(message: string, category: string = 'general', error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry('ERROR', message, category, context);
    
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };

      // Track error patterns
      if (this.options.enableErrorCorrelation) {
        this.trackErrorPattern(error);
      }
    }

    this.writeLog(entry);
  }

  /**
   * Log critical message
   */
  critical(message: string, category: string = 'general', error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry('CRITICAL', message, category, context);
    
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }

    this.writeLog(entry);
    
    // Immediately flush critical logs
    this.flushLogs();
  }

  /**
   * Log with performance tracking
   */
  logPerformance(
    operation: string,
    duration: number,
    category: string = 'performance',
    context?: Record<string, any>
  ): void {
    const entry = this.createLogEntry('INFO', `Operation: ${operation}`, category, context);
    
    entry.performance = {
      duration,
      memory: this.getMemoryUsage(),
    };

    if (this.options.enablePerformanceTracking) {
      this.performanceData.push({
        operation,
        duration,
        timestamp: new Date()
      });

      // Keep only last 1000 performance entries
      if (this.performanceData.length > 1000) {
        this.performanceData.shift();
      }
    }

    this.writeLog(entry);
  }

  /**
   * Start performance timer
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    const startMemory = this.getMemoryUsage();

    return () => {
      const duration = Date.now() - startTime;
      const endMemory = this.getMemoryUsage();
      
      this.logPerformance(operation, duration, 'performance', {
        memoryDelta: endMemory - startMemory
      });
    };
  }

  /**
   * Log with correlation ID
   */
  logWithCorrelation(
    level: LogLevel,
    message: string,
    correlationId: string,
    category: string = 'general',
    context?: Record<string, any>
  ): void {
    const entry = this.createLogEntry(level, message, category, context);
    entry.correlationId = correlationId;

    // Track correlation
    if (this.options.enableErrorCorrelation) {
      if (!this.correlationMap.has(correlationId)) {
        this.correlationMap.set(correlationId, []);
      }
      this.correlationMap.get(correlationId)!.push(entry.id);
    }

    this.writeLog(entry);
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    category: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      category,
      context,
      sessionId: this.getCurrentSessionId(),
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Write log entry
   */
  private writeLog(entry: LogEntry): void {
    // Check log level
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // Add to entries
    this.entries.push(entry);

    // Console output
    if (this.options.enableConsole) {
      this.writeToConsole(entry);
    }

    // Storage
    if (this.options.enableStorage) {
      this.writeToStorage(entry);
    }

    // Remote logging
    if (this.options.enableRemote) {
      this.queueForRemote(entry);
    }

    // Rotation
    this.rotateLogsIfNeeded();
  }

  /**
   * Generic log method
   */
  private log(level: LogLevel, message: string, category: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(level, message, category, context);
    this.writeLog(entry);
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const currentLevelIndex = levels.indexOf(this.options.level!);
    const entryLevelIndex = levels.indexOf(level);
    return entryLevelIndex >= currentLevelIndex;
  }

  /**
   * Write to console with formatting
   */
  private writeToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case 'DEBUG':
        console.debug(message, entry.context);
        break;
      case 'INFO':
        console.info(message, entry.context);
        break;
      case 'WARN':
        console.warn(message, entry.context);
        break;
      case 'ERROR':
      case 'CRITICAL':
        console.error(message, entry.error || entry.context);
        break;
    }
  }

  /**
   * Write to local storage
   */
  private writeToStorage(entry: LogEntry): void {
    try {
      const storageKey = `logs-${new Date().toISOString().split('T')[0]}`;
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      existingLogs.push(entry);
      
      localStorage.setItem(storageKey, JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Failed to write log to storage:', error);
    }
  }

  /**
   * Queue for remote logging
   */
  private queueForRemote(entry: LogEntry): void {
    this.batchQueue.push(entry);

    if (this.batchQueue.length >= this.options.batchSize!) {
      this.flushLogs();
    }
  }

  /**
   * Flush logs to remote endpoint
   */
  private flushLogs(): void {
    if (this.batchQueue.length === 0 || !this.options.remoteEndpoint) {
      return;
    }

    const logsToSend = [...this.batchQueue];
    this.batchQueue = [];

    // Send to remote endpoint
    fetch(this.options.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs: logsToSend })
    }).catch(error => {
      console.warn('Failed to send logs to remote endpoint:', error);
      // Re-queue failed logs
      this.batchQueue.unshift(...logsToSend);
    });
  }

  /**
   * Setup flush timer
   */
  private setupFlushTimer(): void {
    if (this.options.enableRemote) {
      this.flushTimer = setInterval(() => {
        this.flushLogs();
      }, this.options.flushInterval);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      this.error(
        'Unhandled error',
        'global',
        new Error(event.message),
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(
        'Unhandled promise rejection',
        'global',
        event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      );
    });
  }

  /**
   * Track error patterns for correlation
   */
  private trackErrorPattern(error: Error): void {
    const pattern = `${error.name}: ${error.message}`;
    const count = this.errorPatterns.get(pattern) || 0;
    this.errorPatterns.set(pattern, count + 1);
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  private getCurrentSessionId(): string {
    // This would integrate with session management
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  /**
   * Rotate logs if needed
   */
  private rotateLogsIfNeeded(): void {
    if (this.entries.length > this.options.maxStorageEntries!) {
      const toRemove = this.entries.length - this.options.maxStorageEntries!;
      this.entries.splice(0, toRemove);
    }
  }

  /**
   * Load stored logs from localStorage
   */
  private loadStoredLogs(): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const storageKey = `logs-${today}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const logs = JSON.parse(stored);
        this.entries.push(...logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        })));
      }
    } catch (error) {
      console.warn('Failed to load stored logs:', error);
    }
  }

  /**
   * Search logs
   */
  searchLogs(filter: LogFilter): LogEntry[] {
    let filtered = this.entries;

    if (filter.level) {
      filtered = filtered.filter(entry => entry.level === filter.level);
    }

    if (filter.category) {
      filtered = filtered.filter(entry => entry.category === filter.category);
    }

    if (filter.startDate) {
      filtered = filtered.filter(entry => entry.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filtered = filtered.filter(entry => entry.timestamp <= filter.endDate!);
    }

    if (filter.correlationId) {
      filtered = filtered.filter(entry => entry.correlationId === filter.correlationId);
    }

    if (filter.sessionId) {
      filtered = filtered.filter(entry => entry.sessionId === filter.sessionId);
    }

    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.message.toLowerCase().includes(searchLower) ||
        (entry.error?.message.toLowerCase().includes(searchLower)) ||
        JSON.stringify(entry.context || {}).toLowerCase().includes(searchLower)
      );
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get correlated logs
   */
  getCorrelatedLogs(correlationId: string): LogEntry[] {
    const logIds = this.correlationMap.get(correlationId) || [];
    return this.entries.filter(entry => logIds.includes(entry.id));
  }

  /**
   * Get log statistics
   */
  getStatistics(): LogStatistics {
    const entriesByLevel: Record<LogLevel, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      CRITICAL: 0
    };

    const entriesByCategory: Record<string, number> = {};
    let totalDuration = 0;
    let durationCount = 0;
    let totalMemory = 0;
    let memoryCount = 0;
    let peakMemory = 0;

    this.entries.forEach(entry => {
      entriesByLevel[entry.level]++;
      entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;

      if (entry.performance?.duration) {
        totalDuration += entry.performance.duration;
        durationCount++;
      }

      if (entry.performance?.memory) {
        totalMemory += entry.performance.memory;
        memoryCount++;
        peakMemory = Math.max(peakMemory, entry.performance.memory);
      }
    });

    const errorEntries = this.entries.filter(e => e.level === 'ERROR' || e.level === 'CRITICAL');
    const errorRate = this.entries.length > 0 ? (errorEntries.length / this.entries.length) * 100 : 0;

    const topErrors = Array.from(this.errorPatterns.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentErrors = errorEntries
      .filter(e => Date.now() - e.timestamp.getTime() < 24 * 60 * 60 * 1000)
      .slice(0, 10);

    const slowestOperations = this.performanceData
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      totalEntries: this.entries.length,
      entriesByLevel,
      entriesByCategory,
      errorRate,
      averageResponseTime: durationCount > 0 ? totalDuration / durationCount : 0,
      topErrors,
      recentErrors,
      performanceMetrics: {
        averageMemory: memoryCount > 0 ? totalMemory / memoryCount : 0,
        peakMemory,
        averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
        slowestOperations
      }
    };
  }

  /**
   * Export logs
   */
  exportLogs(format: 'json' | 'csv' = 'json', filter?: LogFilter): string {
    const logs = filter ? this.searchLogs(filter) : this.entries;

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Convert logs to CSV
   */
  private convertToCSV(logs: LogEntry[]): string {
    if (logs.length === 0) return '';

    const headers = ['timestamp', 'level', 'category', 'message', 'correlationId', 'sessionId'];
    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const values = [
        log.timestamp.toISOString(),
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        log.correlationId || '',
        log.sessionId || ''
      ];
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.entries = [];
    this.correlationMap.clear();
    this.errorPatterns.clear();
    this.performanceData = [];
    
    // Clear localStorage
    const keys = Object.keys(localStorage).filter(key => key.startsWith('logs-'));
    keys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.options.level = level;
  }

  /**
   * Cleanup logger
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    this.flushLogs();
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function getLogger(options?: LoggerOptions): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(options);
  }
  return globalLogger;
}

export default Logger;