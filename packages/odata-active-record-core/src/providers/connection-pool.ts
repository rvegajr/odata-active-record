import type { IConnectionPool, IConnectionConfig, IConnectionStats } from 'odata-active-record-contracts';

/**
 * Production-ready connection pool implementation
 */
export class ConnectionPool implements IConnectionPool {
  private connections: Map<string, any> = new Map();
  private connectionConfigs: Map<string, IConnectionConfig> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1 second
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.startHealthChecks();
  }

  async getConnection(connectionId: string, config: IConnectionConfig): Promise<any> {
    // Check if connection exists and is healthy
    if (this.connections.has(connectionId)) {
      const connection = this.connections.get(connectionId);
      if (await this.isConnectionHealthy(connection, config)) {
        return connection;
      }
    }

    // Create new connection with retry mechanism
    return this.createConnectionWithRetry(connectionId, config);
  }

  private async createConnectionWithRetry(connectionId: string, config: IConnectionConfig): Promise<any> {
    let lastError: Error | null = null;
    const maxAttempts = this.maxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const connection = await this.createConnection(config);
        
        // Store connection and config
        this.connections.set(connectionId, connection);
        this.connectionConfigs.set(connectionId, config);
        this.retryAttempts.set(connectionId, 0);

        // Start health check for this connection
        this.startConnectionHealthCheck(connectionId, config);

        console.log(`✅ Connection ${connectionId} established successfully (attempt ${attempt})`);
        return connection;

      } catch (error) {
        lastError = error as Error;
        const currentRetries = this.retryAttempts.get(connectionId) || 0;
        this.retryAttempts.set(connectionId, currentRetries + 1);

        console.warn(`⚠️ Connection ${connectionId} attempt ${attempt} failed: ${error}`);
        
        if (attempt < maxAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`🔄 Retrying connection ${connectionId} in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed to establish connection ${connectionId} after ${maxAttempts} attempts: ${lastError?.message}`);
  }

  private async createConnection(config: IConnectionConfig): Promise<any> {
    switch (config.type) {
      case 'mongodb':
        return this.createMongoDBConnection(config);
      case 'sqlite':
        return this.createSQLiteConnection(config);
      case 'http-odata':
        return this.createHTTPODataConnection(config);
      default:
        throw new Error(`Unsupported connection type: ${config.type}`);
    }
  }

  private async createMongoDBConnection(config: IConnectionConfig): Promise<any> {
    const { MongoClient } = await import('mongodb');
    
    if (!config.connectionString) {
      throw new Error('MongoDB connection string is required');
    }
    
    const client = new MongoClient(config.connectionString, {
      maxPoolSize: config.poolSize || 10,
      minPoolSize: config.minPoolSize || 1,
      maxIdleTimeMS: config.maxIdleTime || 30000,
      serverSelectionTimeoutMS: config.timeout || 5000,
      connectTimeoutMS: config.timeout || 5000,
      socketTimeoutMS: config.timeout || 5000,
    });

    await client.connect();
    return client.db(config.databaseName);
  }

  private async createSQLiteConnection(config: IConnectionConfig): Promise<any> {
    const Database = (await import('better-sqlite3')).default;
    
    if (!config.filePath) {
      throw new Error('SQLite file path is required');
    }
    
    const db = new Database(config.filePath, {
      verbose: config.verbose ? console.log : undefined,
      fileMustExist: config.fileMustExist || false,
      timeout: config.timeout || 5000,
    });

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    return db;
  }

  private async createHTTPODataConnection(config: IConnectionConfig): Promise<any> {
    // For HTTP OData, we return a connection object with the base URL and headers
    if (!config.baseUrl) {
      throw new Error('HTTP OData base URL is required');
    }
    
    return {
      baseUrl: config.baseUrl,
      headers: config.headers || {},
      timeout: config.timeout || 5000,
    };
  }

  private async isConnectionHealthy(connection: any, config: IConnectionConfig): Promise<boolean> {
    try {
      switch (config.type) {
        case 'mongodb':
          await connection.admin().ping();
          return true;
        case 'sqlite':
          return connection.open;
        case 'http-odata':
          // For HTTP OData, we'll do a simple health check
          const response = await fetch(`${connection.baseUrl}/`, {
            method: 'HEAD',
            headers: connection.headers,
            signal: AbortSignal.timeout(connection.timeout),
          });
          return response.ok;
        default:
          return false;
      }
    } catch (error) {
      console.warn(`Health check failed for connection: ${error}`);
      return false;
    }
  }

  private startConnectionHealthCheck(connectionId: string, config: IConnectionConfig): void {
    // Clear existing health check
    if (this.healthChecks.has(connectionId)) {
      clearInterval(this.healthChecks.get(connectionId)!);
    }

    // Start new health check
    const interval = setInterval(async () => {
      const connection = this.connections.get(connectionId);
      if (connection) {
        const isHealthy = await this.isConnectionHealthy(connection, config);
        if (!isHealthy) {
          console.warn(`🚨 Connection ${connectionId} is unhealthy, removing from pool`);
          this.removeConnection(connectionId);
        }
      }
    }, this.healthCheckInterval);

    this.healthChecks.set(connectionId, interval);
  }

  private startHealthChecks(): void {
    // Global health check for all connections
    setInterval(() => {
      this.connections.forEach((connection, connectionId) => {
        const config = this.connectionConfigs.get(connectionId);
        if (config) {
          this.isConnectionHealthy(connection, config).then(isHealthy => {
            if (!isHealthy) {
              console.warn(`🚨 Connection ${connectionId} failed health check`);
            }
          });
        }
      });
    }, this.healthCheckInterval);
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Close connection based on type
      const config = this.connectionConfigs.get(connectionId);
      if (config?.type === 'mongodb') {
        connection.client?.close();
      } else if (config?.type === 'sqlite') {
        connection.close();
      }
    }

    this.connections.delete(connectionId);
    this.connectionConfigs.delete(connectionId);
    this.retryAttempts.delete(connectionId);

    // Clear health check
    if (this.healthChecks.has(connectionId)) {
      clearInterval(this.healthChecks.get(connectionId)!);
      this.healthChecks.delete(connectionId);
    }
  }

  getConnectionStats(): IConnectionStats {
    const totalConnections = this.connections.size;
    let healthyConnections = 0;
    let totalRetries = 0;

    this.connections.forEach((connection, connectionId) => {
      const config = this.connectionConfigs.get(connectionId);
      if (config) {
        this.isConnectionHealthy(connection, config).then(isHealthy => {
          if (isHealthy) healthyConnections++;
        });
      }
      totalRetries += this.retryAttempts.get(connectionId) || 0;
    });

    return {
      connected: totalConnections > 0,
      uptime: Date.now(),
      activeConnections: healthyConnections,
      totalQueries: 0,
      averageQueryTime: 0,
      lastConnectionAttempt: new Date(),
      lastSuccessfulConnection: new Date(),
    };
  }

  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.connections.keys()).map(connectionId => {
      return this.removeConnection(connectionId);
    });

    await Promise.all(closePromises);
    
    // Clear all health checks
    this.healthChecks.forEach(interval => clearInterval(interval));
    this.healthChecks.clear();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
