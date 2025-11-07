// Performance Monitor for search operations
export interface PerformanceEntry {
  id: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface PerformanceStats {
  totalOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  operationsByType: Record<string, number>;
  recentOperations: PerformanceEntry[];
}

export interface PerformanceThresholds {
  slowQueryThreshold: number; // ms
  verySlowQueryThreshold: number; // ms
  maxConcurrentOperations: number;
  alertOnSlowQueries: boolean;
}

export type PerformanceAlertCallback = (entry: PerformanceEntry, threshold: keyof PerformanceThresholds) => void;

export class PerformanceMonitor {
  private entries = new Map<string, PerformanceEntry>();
  private completedEntries: PerformanceEntry[] = [];
  private maxHistorySize = 1000;
  private thresholds: PerformanceThresholds;
  private alertCallbacks = new Set<PerformanceAlertCallback>();

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = {
      slowQueryThreshold: 100, // 100ms
      verySlowQueryThreshold: 500, // 500ms
      maxConcurrentOperations: 10,
      alertOnSlowQueries: true,
      ...thresholds
    };
  }

  /**
   * Start monitoring an operation
   */
  startOperation(operation: string, metadata?: Record<string, any>): string {
    const id = this.generateId();
    const entry: PerformanceEntry = {
      id,
      operation,
      startTime: performance.now(),
      status: 'running',
      metadata
    };

    this.entries.set(id, entry);

    // Check concurrent operations limit
    if (this.entries.size > this.thresholds.maxConcurrentOperations) {
      this.triggerAlert(entry, 'maxConcurrentOperations');
    }

    return id;
  }

  /**
   * End monitoring an operation
   */
  endOperation(id: string, error?: string): PerformanceEntry | null {
    const entry = this.entries.get(id);
    if (!entry) {
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - entry.startTime;

    const completedEntry: PerformanceEntry = {
      ...entry,
      endTime,
      duration,
      status: error ? 'failed' : 'completed',
      error
    };

    this.entries.delete(id);
    this.addToHistory(completedEntry);

    // Check performance thresholds
    if (this.thresholds.alertOnSlowQueries && !error) {
      if (duration > this.thresholds.verySlowQueryThreshold) {
        this.triggerAlert(completedEntry, 'verySlowQueryThreshold');
      } else if (duration > this.thresholds.slowQueryThreshold) {
        this.triggerAlert(completedEntry, 'slowQueryThreshold');
      }
    }

    return completedEntry;
  }

  /**
   * Monitor an async operation
   */
  async monitorAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startOperation(operation, metadata);
    
    try {
      const result = await fn();
      this.endOperation(id);
      return result;
    } catch (error) {
      this.endOperation(id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Monitor a synchronous operation
   */
  monitorSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const id = this.startOperation(operation, metadata);
    
    try {
      const result = fn();
      this.endOperation(id);
      return result;
    } catch (error) {
      this.endOperation(id, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const completed = this.completedEntries.filter(e => e.status === 'completed');
    const failed = this.completedEntries.filter(e => e.status === 'failed');
    
    if (completed.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        operationsByType: {},
        recentOperations: []
      };
    }

    const durations = completed.map(e => e.duration!);
    const operationsByType: Record<string, number> = {};

    this.completedEntries.forEach(entry => {
      operationsByType[entry.operation] = (operationsByType[entry.operation] || 0) + 1;
    });

    return {
      totalOperations: this.completedEntries.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      successRate: completed.length / this.completedEntries.length,
      operationsByType,
      recentOperations: this.completedEntries.slice(-10)
    };
  }

  /**
   * Get slow operations
   */
  getSlowOperations(threshold?: number): PerformanceEntry[] {
    const slowThreshold = threshold || this.thresholds.slowQueryThreshold;
    return this.completedEntries.filter(
      entry => entry.duration && entry.duration > slowThreshold
    );
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): PerformanceEntry[] {
    return this.completedEntries.filter(entry => entry.status === 'failed');
  }

  /**
   * Get currently running operations
   */
  getRunningOperations(): PerformanceEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Subscribe to performance alerts
   */
  onAlert(callback: PerformanceAlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Clear performance history
   */
  clearHistory(): void {
    this.completedEntries = [];
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get performance report
   */
  generateReport(): {
    summary: PerformanceStats;
    slowOperations: PerformanceEntry[];
    failedOperations: PerformanceEntry[];
    recommendations: string[];
  } {
    const stats = this.getStats();
    const slowOperations = this.getSlowOperations();
    const failedOperations = this.getFailedOperations();
    const recommendations = this.generateRecommendations(stats, slowOperations);

    return {
      summary: stats,
      slowOperations,
      failedOperations,
      recommendations
    };
  }

  /**
   * Export performance data
   */
  exportData(): {
    entries: PerformanceEntry[];
    stats: PerformanceStats;
    thresholds: PerformanceThresholds;
    timestamp: number;
  } {
    return {
      entries: this.completedEntries,
      stats: this.getStats(),
      thresholds: this.thresholds,
      timestamp: Date.now()
    };
  }

  // Private methods

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToHistory(entry: PerformanceEntry): void {
    this.completedEntries.push(entry);
    
    // Maintain history size limit
    if (this.completedEntries.length > this.maxHistorySize) {
      this.completedEntries = this.completedEntries.slice(-this.maxHistorySize);
    }
  }

  private triggerAlert(entry: PerformanceEntry, threshold: keyof PerformanceThresholds): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(entry, threshold);
      } catch (error) {
        console.error('Error in performance alert callback:', error);
      }
    });
  }

  private generateRecommendations(
    stats: PerformanceStats,
    slowOperations: PerformanceEntry[]
  ): string[] {
    const recommendations: string[] = [];

    if (stats.averageDuration > this.thresholds.slowQueryThreshold) {
      recommendations.push('Average query time is above threshold. Consider optimizing queries or adding indexes.');
    }

    if (stats.successRate < 0.95) {
      recommendations.push('Success rate is below 95%. Investigate failed operations and improve error handling.');
    }

    if (slowOperations.length > stats.totalOperations * 0.1) {
      recommendations.push('More than 10% of operations are slow. Consider query optimization or caching.');
    }

    const searchOperations = slowOperations.filter(op => op.operation.includes('search'));
    if (searchOperations.length > 0) {
      recommendations.push('Slow search operations detected. Consider FTS5 index optimization or query simplification.');
    }

    const importOperations = slowOperations.filter(op => op.operation.includes('import'));
    if (importOperations.length > 0) {
      recommendations.push('Slow import operations detected. Consider batch size optimization or transaction tuning.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! No specific recommendations at this time.');
    }

    return recommendations;
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for monitoring method performance
 */
export function monitored(operation?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      if (originalMethod.constructor.name === 'AsyncFunction') {
        return performanceMonitor.monitorAsync(operationName, () => originalMethod.apply(this, args));
      } else {
        return performanceMonitor.monitorSync(operationName, () => originalMethod.apply(this, args));
      }
    };

    return descriptor;
  };
}

/**
 * Utility function for timing operations
 */
export function timeOperation<T>(operation: string, fn: () => T): T {
  return performanceMonitor.monitorSync(operation, fn);
}

/**
 * Utility function for timing async operations
 */
export function timeAsyncOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  return performanceMonitor.monitorAsync(operation, fn);
}

export default PerformanceMonitor;