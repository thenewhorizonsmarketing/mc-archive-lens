// Database connection utilities with error handling and retry logic
import { DatabaseManager } from './manager';
import { DatabaseError } from './types';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private manager: DatabaseManager;
  private isConnected = false;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  private constructor() {
    this.manager = new DatabaseManager();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Initialize database connection with retry logic
   */
  async connect(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await this.manager.initializeDatabase();
        this.isConnected = true;
        console.log(`Database connected successfully on attempt ${attempt}`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Database connection attempt ${attempt} failed:`, error);

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw new DatabaseError(
      `Failed to connect to database after ${this.retryAttempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Disconnect from database
   */
  disconnect(): void {
    try {
      this.manager.close();
      this.isConnected = false;
      console.log('Database disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }

  /**
   * Get database manager instance
   */
  getManager(): DatabaseManager {
    if (!this.isConnected) {
      throw new DatabaseError('Database not connected. Call connect() first.');
    }
    return this.manager;
  }

  /**
   * Check if database is connected and healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.manager.initialized) {
        return false;
      }

      // Try a simple query to verify database is working
      const stats = this.manager.getStats();
      return stats !== null;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Reconnect to database if connection is lost
   */
  async reconnect(): Promise<void> {
    console.log('Attempting to reconnect to database...');
    this.disconnect();
    await this.connect();
  }

  /**
   * Execute operation with automatic retry on connection failure
   */
  async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        // Check connection health before operation
        if (!(await this.healthCheck())) {
          await this.reconnect();
        }

        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Operation attempt ${attempt} failed:`, error);

        // If it's a connection error, try to reconnect
        if (this.isConnectionError(error as Error)) {
          try {
            await this.reconnect();
          } catch (reconnectError) {
            console.error('Reconnection failed:', reconnectError);
          }
        }

        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    throw new DatabaseError(
      `Operation failed after ${this.retryAttempts} attempts: ${lastError?.message}`
    );
  }

  /**
   * Check if error is connection-related
   */
  private isConnectionError(error: Error): boolean {
    const connectionErrorMessages = [
      'database not initialized',
      'database not connected',
      'sql.js not initialized',
      'failed to initialize'
    ];

    return connectionErrorMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }

  /**
   * Delay utility for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get connection status
   */
  get connected(): boolean {
    return this.isConnected && this.manager.initialized;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    return this.withRetry(() => {
      const manager = this.getManager();
      return Promise.resolve(manager.getStats());
    });
  }

  /**
   * Execute search with connection retry
   */
  async search(query: string, table: string, limit?: number): Promise<any[]> {
    return this.withRetry(async () => {
      const manager = this.getManager();
      return manager.executeSearch(query, table, limit);
    });
  }

  /**
   * Execute query with connection retry
   */
  async query(sql: string, params?: any[]): Promise<any[]> {
    return this.withRetry(() => {
      const manager = this.getManager();
      return Promise.resolve(manager.executeQuery(sql, params));
    });
  }

  /**
   * Execute statement with connection retry
   */
  async execute(sql: string, params?: any[]): Promise<void> {
    return this.withRetry(() => {
      const manager = this.getManager();
      manager.executeStatement(sql, params);
      return Promise.resolve();
    });
  }

  /**
   * Rebuild FTS5 indexes with connection retry
   */
  async rebuildIndexes(): Promise<void> {
    return this.withRetry(async () => {
      const manager = this.getManager();
      await manager.rebuildIndexes();
    });
  }

  /**
   * Export database with connection retry
   */
  async exportDatabase(): Promise<Uint8Array> {
    return this.withRetry(() => {
      const manager = this.getManager();
      return Promise.resolve(manager.exportDatabase());
    });
  }

  /**
   * Load database with connection retry
   */
  async loadDatabase(data: Uint8Array): Promise<void> {
    return this.withRetry(() => {
      const manager = this.getManager();
      manager.loadDatabase(data);
      this.isConnected = true;
      return Promise.resolve();
    });
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

// Utility functions for common database operations
export const connectToDatabase = async (): Promise<void> => {
  await dbConnection.connect();
};

export const disconnectFromDatabase = (): void => {
  dbConnection.disconnect();
};

export const getDatabaseManager = (): DatabaseManager => {
  return dbConnection.getManager();
};

export const isDatabaseConnected = (): boolean => {
  return dbConnection.connected;
};