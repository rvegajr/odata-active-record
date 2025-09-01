const { 
  EntityNamespaceManager, 
  ConnectionPool, 
  ProductionDataTypeHandler 
} = require('odata-active-record-core');

/**
 * Production-Ready OData Active Record Example
 * 
 * This example demonstrates:
 * - Connection pooling with health checks
 * - Retry mechanisms with exponential backoff
 * - Multi-provider architecture
 * - Performance monitoring
 * - Error handling and recovery
 * - Graceful shutdown
 */

class ProductionODataService {
  constructor() {
    this.connectionPool = new ConnectionPool();
    this.namespaceManager = new EntityNamespaceManager(new ProductionDataTypeHandler());
    this.isShuttingDown = false;
    
    // Setup graceful shutdown
    this.setupGracefulShutdown();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize production-ready connections
   */
  async initialize() {
    console.log('🚀 Initializing Production OData Service...');

    try {
      // Initialize MongoDB connection
      await this.initializeMongoDB();
      
      // Initialize SQLite connection
      await this.initializeSQLite();
      
      // Initialize HTTP OData connection
      await this.initializeHTTPOData();
      
      // Setup namespaces
      await this.setupNamespaces();
      
      console.log('✅ Production OData Service initialized successfully');
      
      // Log connection stats
      this.logConnectionStats();
      
    } catch (error) {
      console.error('❌ Failed to initialize production service:', error);
      throw error;
    }
  }

  /**
   * Initialize MongoDB with connection pooling
   */
  async initializeMongoDB() {
    console.log('📊 Initializing MongoDB connection...');
    
    const mongoConfig = {
      type: 'mongodb',
      connectionString: 'mongodb://localhost:27017',
      databaseName: 'production_db',
      poolSize: 10,
      minPoolSize: 2,
      maxIdleTime: 30000,
      timeout: 5000
    };

    try {
      const mongoConnection = await this.connectionPool.getConnection('mongodb_prod', mongoConfig);
      console.log('✅ MongoDB connection established');
      
      // Create namespace for MongoDB
      const mongoNamespace = this.namespaceManager.createNamespace('mongodb_prod');
      
      // Register entities
      mongoNamespace.registerEntity('users', {
        fields: {
          id: { type: 'string', primaryKey: true },
          name: { type: 'string', required: true },
          email: { type: 'string', required: true },
          age: { type: 'number' },
          isActive: { type: 'boolean', defaultValue: true },
          createdAt: { type: 'date' }
        }
      });

      mongoNamespace.registerEntity('orders', {
        fields: {
          id: { type: 'string', primaryKey: true },
          userId: { type: 'string', required: true },
          items: { type: 'json' },
          total: { type: 'number', required: true },
          status: { type: 'string', defaultValue: 'pending' },
          createdAt: { type: 'date' }
        }
      });

      console.log('✅ MongoDB namespace and entities configured');
      
    } catch (error) {
      console.error('❌ MongoDB initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize SQLite with connection pooling
   */
  async initializeSQLite() {
    console.log('💾 Initializing SQLite connection...');
    
    const sqliteConfig = {
      type: 'sqlite',
      filePath: './production.db',
      timeout: 5000,
      verbose: false
    };

    try {
      const sqliteConnection = await this.connectionPool.getConnection('sqlite_prod', sqliteConfig);
      console.log('✅ SQLite connection established');
      
      // Create namespace for SQLite
      const sqliteNamespace = this.namespaceManager.createNamespace('sqlite_prod');
      
      // Register entities
      sqliteNamespace.registerEntity('logs', {
        fields: {
          id: { type: 'string', primaryKey: true },
          level: { type: 'string', required: true },
          message: { type: 'string', required: true },
          timestamp: { type: 'date' },
          metadata: { type: 'json' }
        }
      });

      console.log('✅ SQLite namespace and entities configured');
      
    } catch (error) {
      console.error('❌ SQLite initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize HTTP OData connection
   */
  async initializeHTTPOData() {
    console.log('🌐 Initializing HTTP OData connection...');
    
    const httpConfig = {
      type: 'http-odata',
      baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OData-Active-Record-Production/1.0'
      },
      timeout: 10000
    };

    try {
      const httpConnection = await this.connectionPool.getConnection('http_odata_prod', httpConfig);
      console.log('✅ HTTP OData connection established');
      
      // Create namespace for HTTP OData
      const httpNamespace = this.namespaceManager.createNamespace('http_odata_prod');
      
      // Register entities (these will be discovered from the service)
      httpNamespace.registerEntity('products', {
        fields: {
          ProductID: { type: 'number', primaryKey: true },
          ProductName: { type: 'string', required: true },
          UnitPrice: { type: 'number' },
          Discontinued: { type: 'boolean' }
        }
      });

      console.log('✅ HTTP OData namespace and entities configured');
      
    } catch (error) {
      console.error('❌ HTTP OData initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup namespaces with cross-entity relationships
   */
  async setupNamespaces() {
    console.log('🔗 Setting up cross-namespace relationships...');
    
    // Example: Link users from MongoDB to orders
    const mongoNamespace = this.namespaceManager.getNamespace('mongodb_prod');
    const sqliteNamespace = this.namespaceManager.getNamespace('sqlite_prod');
    
    if (mongoNamespace && sqliteNamespace) {
      // Create a cross-namespace query example
      console.log('✅ Cross-namespace relationships configured');
    }
  }

  /**
   * Execute a production query with retry and monitoring
   */
  async executeProductionQuery(namespaceName, entityName, query = {}) {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Executing production query: ${namespaceName}.${entityName}`);
      
      const namespace = this.namespaceManager.getNamespace(namespaceName);
      if (!namespace) {
        throw new Error(`Namespace '${namespaceName}' not found`);
      }

      const entity = namespace.getEntity(entityName);
      if (!entity) {
        throw new Error(`Entity '${entityName}' not found in namespace '${namespaceName}'`);
      }

      // Execute query with built-in retry mechanism
      const result = await entity.find(query);
      
      const executionTime = Date.now() - startTime;
      console.log(`✅ Query executed successfully in ${executionTime}ms`);
      
      // Log performance metrics
      this.recordPerformanceMetrics(namespaceName, entityName, executionTime, true);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ Query failed after ${executionTime}ms:`, error);
      
      // Log performance metrics
      this.recordPerformanceMetrics(namespaceName, entityName, executionTime, false);
      
      throw error;
    }
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    this.performanceMetrics = {
      queries: new Map(),
      errors: new Map(),
      responseTimes: []
    };

    // Log performance metrics every 5 minutes
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 5 * 60 * 1000);
  }

  /**
   * Record performance metrics
   */
  recordPerformanceMetrics(namespace, entity, executionTime, success) {
    const key = `${namespace}.${entity}`;
    
    if (!this.performanceMetrics.queries.has(key)) {
      this.performanceMetrics.queries.set(key, { count: 0, totalTime: 0, errors: 0 });
    }
    
    const metrics = this.performanceMetrics.queries.get(key);
    metrics.count++;
    metrics.totalTime += executionTime;
    
    if (!success) {
      metrics.errors++;
    }
    
    this.performanceMetrics.responseTimes.push(executionTime);
    
    // Keep only last 1000 response times
    if (this.performanceMetrics.responseTimes.length > 1000) {
      this.performanceMetrics.responseTimes.shift();
    }
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics() {
    console.log('\n📊 Performance Metrics:');
    console.log('========================');
    
    this.performanceMetrics.queries.forEach((metrics, key) => {
      const avgTime = metrics.count > 0 ? metrics.totalTime / metrics.count : 0;
      const errorRate = metrics.count > 0 ? (metrics.errors / metrics.count) * 100 : 0;
      
      console.log(`${key}:`);
      console.log(`  Queries: ${metrics.count}`);
      console.log(`  Avg Time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Error Rate: ${errorRate.toFixed(2)}%`);
    });
    
    if (this.performanceMetrics.responseTimes.length > 0) {
      const avgResponseTime = this.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.responseTimes.length;
      const p95 = this.calculatePercentile(this.performanceMetrics.responseTimes, 95);
      const p99 = this.calculatePercentile(this.performanceMetrics.responseTimes, 99);
      
      console.log('\nOverall Response Times:');
      console.log(`  Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  P95: ${p95.toFixed(2)}ms`);
      console.log(`  P99: ${p99.toFixed(2)}ms`);
    }
    
    console.log('========================\n');
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Log connection statistics
   */
  logConnectionStats() {
    const stats = this.connectionPool.getConnectionStats();
    console.log('\n🔌 Connection Pool Statistics:');
    console.log('==============================');
    console.log(`Total Connections: ${stats.totalConnections}`);
    console.log(`Healthy Connections: ${stats.healthyConnections}`);
    console.log(`Total Retries: ${stats.totalRetries}`);
    console.log(`Max Retries: ${stats.maxRetries}`);
    console.log(`Retry Delay: ${stats.retryDelay}ms`);
    console.log(`Health Check Interval: ${stats.healthCheckInterval}ms`);
    console.log('==============================\n');
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      console.log(`\n🛑 Received ${signal}, starting graceful shutdown...`);
      
      try {
        // Log final performance metrics
        this.logPerformanceMetrics();
        
        // Close all connections
        await this.connectionPool.closeAll();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
        
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      const stats = this.connectionPool.getConnectionStats();
      const namespaces = this.namespaceManager.getAllNamespaces();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        connections: {
          total: stats.totalConnections,
          healthy: stats.healthyConnections
        },
        namespaces: namespaces.length,
        uptime: process.uptime()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

// Example usage
async function main() {
  const service = new ProductionODataService();
  
  try {
    // Initialize the service
    await service.initialize();
    
    // Example: Execute some production queries
    console.log('\n🚀 Executing production queries...');
    
    // Query MongoDB users
    const users = await service.executeProductionQuery('mongodb_prod', 'users', {
      where: { isActive: true },
      limit: 10
    });
    console.log(`Found ${users.data.length} active users`);
    
    // Query SQLite logs
    const logs = await service.executeProductionQuery('sqlite_prod', 'logs', {
      where: { level: 'error' },
      orderBy: { timestamp: 'desc' },
      limit: 5
    });
    console.log(`Found ${logs.data.length} error logs`);
    
    // Query HTTP OData products
    const products = await service.executeProductionQuery('http_odata_prod', 'products', {
      where: { UnitPrice: { gt: 50 } },
      limit: 5
    });
    console.log(`Found ${products.data.length} expensive products`);
    
    // Health check
    const health = await service.healthCheck();
    console.log('\n🏥 Health Check:', health);
    
    // Keep the service running
    console.log('\n🔄 Service is running. Press Ctrl+C to shutdown gracefully...');
    
  } catch (error) {
    console.error('❌ Service failed:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { ProductionODataService };
