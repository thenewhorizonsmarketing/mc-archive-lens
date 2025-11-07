// Database Connection Pool for Performance Optimization
import { DatabaseManager } from './manager';
import { DatabaseError } from './types';

export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeout: number;
  idleTimeout: number;
  maxLifetime: number;
  enableMetrics: boolean;
}

export interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalAcquired: number;
  totalReleased: number;
  totalCreated: number;
  totalDestroyed: number;
  averageAcquireTime: number;
}

interface PooledConnection {
  id: string;
  manager: DatabaseManager;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
  useCount: number;
}

export class DatabaseConnectionPool {
  private connections: Map<string, PooledConnection> = new Map();
  private waitingQueue: Array<{
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  
  private config: ConnectionPoolConfig;
  private metrics: PoolMetrics;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    this.config = {
      maxConnections: 10,
      minConnections: 2,
      acquireTimeout: 30000, // 30 seconds
      idleTimeout: 300000, // 5 minutes
      maxLifetime: 3600000, // 1 hour
      enableMetrics: true,
      ...config
    };

    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      totalAcquired: 0,
      totalReleased: 0,
      totalCreated: 0,
      totalDestroyed: 0,
      averageAcquireTime: 0
    };

    this.initialize();
  }

  /**
   * Initialize the connection pool
   */
  private async initialize(): Promise<void> {
    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      try {
        await this.createConnection();
      } catch (error) {
        console.error('Failed to create initial connection:', error);
      }
    }

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Run cleanup every minute
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<DatabaseManager> {
    if (this.isShuttingDown) {
      throw new DatabaseError('Connection pool is shutting down');
    }

    const startTime = performance.now();

    // Try to get an idle connection first
    const idleConnection = this.getIdleConnection();
    if (idleConnection) {
      idleConnection.isActive = true;
      idleConnection.lastUsed = new Date();
      idleConnection.useCount++;
      
      this.updateMetrics();
      this.metrics.totalAcquired++;
      
      const acquireTime = performance.now() - startTime;
      this.updateAverageAcquireTime(acquireTime);
      
      return idleConnection.manager;
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      try {
        const connection = await this.createConnection();
        connection.isActive = true;
        connection.lastUsed = new Date();
        connection.useCount++;
        
        this.updateMetrics();
        this.metrics.totalAcquired++;
        
        const acquireTime = performance.now() - startTime;
        this.updateAverageAcquireTime(acquireTime);
        
        return connection.manager;
      } catch (error) {
        throw new DatabaseError(`Failed to create connection: ${error}`);
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from queue
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index >= 0) {
          this.waitingQueue.splice(index, 1);
          this.updateMetrics();
        }
        reject(new DatabaseError('Connection acquire timeout'));
      }, this.config.acquireTimeout);

      this.waitingQueue.push({
        resolve: (connection) => {
          clearTimeout(timeout);
          connection.isActive = true;
          connection.lastUsed = new Date();
          connection.useCount++;
          
          this.metrics.totalAcquired++;
          const acquireTime = performance.now() - startTime;
          this.updateAverageAcquireTime(acquireTime);
          
          resolve(connection.manager);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now()
      });

      this.updateMetrics();
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(manager: DatabaseManager): void {
    const connection = this.findConnectionByManager(manager);
    if (!connection) {
      console.warn('Attempted to release unknown connection');
      return;
    }

    connection.isActive = false;
    connection.lastUsed = new Date();
    this.metrics.totalReleased++;

    // Check if there are waiting requests
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      waiter.resolve(connection);
    }

    this.updateMetrics();
  }

  /**
   * Execute a function with a pooled connection
   */
  async withConnection<T>(
    fn: (manager: DatabaseManager) => Promise<T>
  ): Promise<T> {
    const manager = await this.acquire();
    try {
      return await fn(manager);
    } finally {
      this.release(manager);
    }
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Shutdown the connection pool
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Reject all waiting requests
    while (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      waiter.reject(new DatabaseError('Connection pool shutting down'));
    }

    // Close all connections
    const closePromises = Array.from(this.connections.values()).map(async (connection) => {
      try {
        await connection.manager.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    });

    await Promise.all(closePromises);
    this.connections.clear();
    this.updateMetrics();
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<PooledConnection> {
    const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const manager = new DatabaseManager();
    
    try {
      await manager.initializeDatabase();
      
      const connection: PooledConnection = {
        id,
        manager,
        createdAt: new Date(),
        lastUsed: new Date(),
        isActive: false,
        useCount: 0
      };

      this.connections.set(id, connection);
      this.metrics.totalCreated++;
      this.updateMetrics();

      return connection;
    } catch (error) {
      throw new DatabaseError(`Failed to initialize connection: ${error}`);
    }
  }

  /**
   * Get an idle connection
   */
  private getIdleConnection(): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.isActive) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Find connection by manager instance
   */
  private findConnectionByManager(manager: DatabaseManager): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (connection.manager === manager) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Cleanup old and unused connections
   */
  private cleanup(): void {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    for (const [id, connection] of this.connections.entries()) {
      // Skip active connections
      if (connection.isActive) continue;

      // Check if connection is too old
      const age = now - connection.createdAt.getTime();
      if (age > this.config.maxLifetime) {
        connectionsToRemove.push(id);
        continue;
      }

      // Check if connection has been idle too long
      const idleTime = now - connection.lastUsed.getTime();
      if (idleTime > this.config.idleTimeout && this.connections.size > this.config.minConnections) {
        connectionsToRemove.push(id);
      }
    }

    // Remove old connections
    for (const id of connectionsToRemove) {
      const connection = this.connections.get(id);
      if (connection) {
        try {
          connection.manager.close();
        } catch (error) {
          console.error('Error closing connection during cleanup:', error);
        }
        this.connections.delete(id);
        this.metrics.totalDestroyed++;
      }
    }

    if (connectionsToRemove.length > 0) {
      this.updateMetrics();
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.totalConnections = this.connections.size;
    this.metrics.activeConnections = Array.from(this.connections.values())
      .filter(c => c.isActive).length;
    this.metrics.idleConnections = this.metrics.totalConnections - this.metrics.activeConnections;
    this.metrics.waitingRequests = this.waitingQueue.length;
  }

  /**
   * Update average acquire time
   */
  private updateAverageAcquireTime(newTime: number): void {
    const totalAcquired = this.metrics.totalAcquired;
    if (totalAcquired === 0) {
      this.metrics.averageAcquireTime = newTime;
    } else {
      this.metrics.averageAcquireTime = 
        (this.metrics.averageAcquireTime * (totalAcquired - 1) + newTime) / totalAcquired;
    }
  }
}

// Global connection pool instance
let globalPool: DatabaseConnectionPool | null = null;

/**
 * Get or create the global connection pool
 */
export function getConnectionPool(config?: Partial<ConnectionPoolConfig>): DatabaseConnectionPool {
  if (!globalPool) {
    globalPool = new DatabaseConnectionPool(config);
  }
  return globalPool;
}

/**
 * Shutdown the global connection pool
 */
export async function shutdownConnectionPool(): Promise<void> {
  if (globalPool) {
    await globalPool.shutdown();
    globalPool = null;
  }
}

export default DatabaseConnectionPool;