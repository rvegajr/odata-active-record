import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MongoDBProvider } from './providers/mongodb-provider';
import { SQLiteProvider } from './providers/sqlite-provider';
import { HTTPODataProvider } from './providers/http-odata-provider';
import type { IDataProvider } from 'odata-active-record-contracts';

// Test entity
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
}

// Test schema
const userSchema = {
  name: 'User',
  fields: {
    name: { name: 'name', type: 'string', nullable: false },
    email: { name: 'email', type: 'string', nullable: false },
    age: { name: 'age', type: 'number', nullable: true },
    isActive: { name: 'isActive', type: 'boolean', nullable: false, defaultValue: true },
    createdAt: { name: 'createdAt', type: 'date', nullable: false }
  }
};

describe('Real Database Providers', () => {
  let mongoProvider: MongoDBProvider;
  let sqliteProvider: SQLiteProvider;
  let httpODataProvider: HTTPODataProvider;

  beforeEach(() => {
    // Initialize providers with test configurations
    mongoProvider = new MongoDBProvider(
      'mongodb://localhost:27017/test',
      'test'
    );
    
    sqliteProvider = new SQLiteProvider('./test.db');
    
    httpODataProvider = new HTTPODataProvider(
      'https://services.odata.org/V4/Northwind/Northwind.svc'
    );
  });

  afterEach(async () => {
    // Cleanup connections
    if (mongoProvider.isConnected()) {
      await mongoProvider.disconnect();
    }
    if (sqliteProvider.isConnected()) {
      await sqliteProvider.disconnect();
    }
    if (httpODataProvider.isConnected()) {
      await httpODataProvider.disconnect();
    }
  });

  describe('MongoDB Provider', () => {
    it('should connect to MongoDB successfully', async () => {
      console.log('🎯 Testing MongoDB connection...');

      const connectionResult = await mongoProvider.connect();
      
      // Note: This test will fail if MongoDB is not running locally
      // In a real CI/CD environment, you'd use a test MongoDB instance
      if (connectionResult.success) {
        expect(mongoProvider.isConnected()).toBe(true);
        expect(connectionResult.details?.databaseName).toBe('test');
        console.log('✅ MongoDB connection successful');
      } else {
        console.log('⚠️ MongoDB not available - skipping connection test');
        console.log('Error:', connectionResult.errors?.[0]?.message);
      }
    });

    it('should perform CRUD operations with MongoDB', async () => {
      console.log('🎯 Testing MongoDB CRUD operations...');

      const connectionResult = await mongoProvider.connect();
      if (!connectionResult.success) {
        console.log('⚠️ MongoDB not available - skipping CRUD test');
        return;
      }

      // CREATE
      const createResult = await mongoProvider.create('test_users', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
        isActive: true,
        createdAt: new Date()
      });

      if (!createResult.success) {
        console.log('❌ MongoDB create failed:', createResult.errors);
      }
      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      expect(createResult.id).toBeDefined();

      // READ
      const readResult = await mongoProvider.read('test_users');
      expect(readResult.success).toBe(true);
      expect(readResult.data).toBeDefined();
      expect(Array.isArray(readResult.data)).toBe(true);

      // UPDATE
      const updateResult = await mongoProvider.update('test_users', createResult.id, {
        age: 30
      });
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.age).toBe(30);

      // DELETE
      const deleteResult = await mongoProvider.delete('test_users', createResult.id);
      expect(deleteResult.success).toBe(true);

      console.log('✅ MongoDB CRUD operations successful');
    });

    it('should execute OData queries with MongoDB', async () => {
      console.log('🎯 Testing MongoDB OData queries...');

      const connectionResult = await mongoProvider.connect();
      if (!connectionResult.success) {
        console.log('⚠️ MongoDB not available - skipping query test');
        return;
      }

      // Create test data
      await mongoProvider.create('test_users', {
        name: 'Alice Smith',
        email: 'alice@example.com',
        age: 28,
        isActive: true,
        createdAt: new Date()
      });

      // Execute OData query
      const queryResult = await mongoProvider.executeQuery('test_users', {
        filter: { field: 'age', operator: 'gt', value: 25 },
        select: { fields: ['name', 'email'], exclude: false },
        orderBy: [{ field: 'name', direction: 'asc' }],
        pagination: { take: 10, skip: 0 }
      });

      expect(queryResult.success).toBe(true);
      expect(queryResult.data).toBeDefined();
      expect(Array.isArray(queryResult.data)).toBe(true);

      console.log('✅ MongoDB OData queries successful');
    });
  });

  describe('SQLite Provider', () => {
    it('should connect to SQLite successfully', async () => {
      console.log('🎯 Testing SQLite connection...');

      const connectionResult = await sqliteProvider.connect();
      
      expect(connectionResult.success).toBe(true);
      expect(sqliteProvider.isConnected()).toBe(true);
      expect(connectionResult.details?.databaseName).toBe('./test.db');

      console.log('✅ SQLite connection successful');
    });

    it('should create tables and perform CRUD operations', async () => {
      console.log('🎯 Testing SQLite table creation and CRUD...');

      await sqliteProvider.connect();

      // Create table
      await sqliteProvider.createTable('test_users', userSchema);

      // CREATE
      const createResult = await sqliteProvider.create('test_users', {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 27,
        isActive: true,
        createdAt: new Date()
      });

      if (!createResult.success) {
        console.log('❌ SQLite create failed:', createResult.errors);
      }
      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      expect(createResult.id).toBeDefined();

      // READ
      const readResult = await sqliteProvider.read('test_users');
      expect(readResult.success).toBe(true);
      expect(readResult.data).toBeDefined();
      expect(Array.isArray(readResult.data)).toBe(true);

      // UPDATE
      const updateResult = await sqliteProvider.update('test_users', createResult.id, {
        age: 29
      });
      expect(updateResult.success).toBe(true);
      expect(Number(updateResult.data?.age)).toBe(29);

      // DELETE
      const deleteResult = await sqliteProvider.delete('test_users', createResult.id);
      expect(deleteResult.success).toBe(true);

      console.log('✅ SQLite CRUD operations successful');
    });

    it('should execute OData queries with SQLite', async () => {
      console.log('🎯 Testing SQLite OData queries...');

      await sqliteProvider.connect();
      await sqliteProvider.createTable('test_users_query', userSchema);

      // Create test data
      await sqliteProvider.create('test_users_query', {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        age: 32,
        isActive: true,
        createdAt: new Date()
      });

      // Execute OData query
      const queryResult = await sqliteProvider.executeQuery('test_users_query', {
        filter: { field: 'age', operator: 'gt', value: 30 },
        select: { fields: ['name', 'email'], exclude: false },
        orderBy: [{ field: 'name', direction: 'asc' }],
        pagination: { take: 10, skip: 0 }
      });

      expect(queryResult.success).toBe(true);
      expect(queryResult.data).toBeDefined();
      expect(Array.isArray(queryResult.data)).toBe(true);

      console.log('✅ SQLite OData queries successful');
    });

    it('should handle transactions', async () => {
      console.log('🎯 Testing SQLite transactions...');

      await sqliteProvider.connect();
      await sqliteProvider.createTable('test_users_transaction', userSchema);

      const transaction = await sqliteProvider.beginTransaction();
      expect(transaction.isActive()).toBe(true);

      try {
        // Create user within transaction
        const createResult = await sqliteProvider.create('test_users_transaction', {
          name: 'Transaction User',
          email: 'transaction@example.com',
          age: 25,
          isActive: true,
          createdAt: new Date()
        });

        expect(createResult.success).toBe(true);

        // Commit transaction
        await transaction.commit();

        // Verify user exists
        const readResult = await sqliteProvider.read('test_users_transaction');
        expect(readResult.success).toBe(true);
        expect(readResult.data?.some((user: any) => user.name === 'Transaction User')).toBe(true);

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

      console.log('✅ SQLite transactions successful');
    });
  });

  describe('HTTP OData Provider', () => {
    it('should connect to OData service successfully', async () => {
      console.log('🎯 Testing HTTP OData connection...');

      const connectionResult = await httpODataProvider.connect();
      
      expect(connectionResult.success).toBe(true);
      expect(httpODataProvider.isConnected()).toBe(true);
      expect(connectionResult.details?.version).toBe('OData v4');

      console.log('✅ HTTP OData connection successful');
    });

    it('should get service document', async () => {
      console.log('🎯 Testing HTTP OData service document...');

      await httpODataProvider.connect();

      const serviceDocResult = await httpODataProvider.getServiceDocument();
      
      expect(serviceDocResult.success).toBe(true);
      expect(serviceDocResult.serviceDocument).toBeDefined();
      expect(serviceDocResult.serviceDocument?.entitySets).toBeDefined();
      expect(Array.isArray(serviceDocResult.serviceDocument?.entitySets)).toBe(true);

      console.log('✅ HTTP OData service document successful');
    });

    it('should execute OData queries', async () => {
      console.log('🎯 Testing HTTP OData queries...');

      await httpODataProvider.connect();

      // Query the Northwind Customers entity
      const queryResult = await httpODataProvider.executeQuery('Customers', {
        filter: { field: 'Country', operator: 'eq', value: 'Germany' },
        select: { fields: ['CustomerID', 'CompanyName', 'ContactName'], exclude: false },
        orderBy: [{ field: 'CompanyName', direction: 'asc' }],
        pagination: { take: 5, skip: 0 }
      });

      expect(queryResult.success).toBe(true);
      expect(queryResult.data).toBeDefined();
      expect(Array.isArray(queryResult.data)).toBe(true);

      console.log('✅ HTTP OData queries successful');
    });

    it('should get metadata document', async () => {
      console.log('🎯 Testing HTTP OData metadata...');

      await httpODataProvider.connect();

      const metadataResult = await httpODataProvider.getMetadataDocument();
      
      expect(metadataResult.success).toBe(true);
      expect(metadataResult.metadataDocument).toBeDefined();
      expect(typeof metadataResult.metadataDocument).toBe('string');
      expect(metadataResult.metadataDocument).toContain('<?xml');

      console.log('✅ HTTP OData metadata successful');
    });

    it('should check service capabilities', async () => {
      console.log('🎯 Testing HTTP OData capabilities...');

      await httpODataProvider.connect();

      const capabilities = await httpODataProvider.getServiceCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(capabilities.supportedVersions).toContain('4.0');
      expect(capabilities.supportedQueryOptions).toContain('$filter');
      expect(capabilities.supportedQueryOptions).toContain('$select');

      // Test feature support
      const supportsFilter = await httpODataProvider.supportsFeature('filter');
      const supportsSelect = await httpODataProvider.supportsFeature('select');
      
      expect(supportsFilter).toBe(true);
      expect(supportsSelect).toBe(true);

      console.log('✅ HTTP OData capabilities successful');
    });
  });

  describe('Provider Integration', () => {
    it('should demonstrate multi-provider usage', async () => {
      console.log('🎯 Testing multi-provider integration...');

      // Test SQLite (always available)
      await sqliteProvider.connect();
      await sqliteProvider.createTable('test_users_multi', userSchema);
      
      const sqliteResult = await sqliteProvider.create('test_users_multi', {
        name: 'Multi Provider User',
        email: 'multi@example.com',
        age: 30,
        isActive: true,
        createdAt: new Date()
      });
      if (!sqliteResult.success) {
        console.log('❌ Multi-provider SQLite create failed:', sqliteResult.errors);
      }
      expect(sqliteResult.success).toBe(true);

      // Test HTTP OData (usually available)
      const httpResult = await httpODataProvider.connect();
      if (httpResult.success) {
        const queryResult = await httpODataProvider.executeQuery('Customers', {
          pagination: { take: 1, skip: 0 }
        });
        expect(queryResult.success).toBe(true);
      }

      // Test MongoDB (may not be available)
      const mongoResult = await mongoProvider.connect();
      if (mongoResult.success) {
        const createResult = await mongoProvider.create('test_users', {
          name: 'MongoDB User',
          email: 'mongo@example.com',
          age: 25,
          isActive: true,
          createdAt: new Date()
        });
        expect(createResult.success).toBe(true);
      }

      console.log('✅ Multi-provider integration successful');
    });

    it('should handle provider-specific features', async () => {
      console.log('🎯 Testing provider-specific features...');

      // SQLite specific features
      await sqliteProvider.connect();
      const sqliteStats = await sqliteProvider.getDatabaseStats();
      expect(sqliteStats.tableCount).toBeGreaterThanOrEqual(0);

      // HTTP OData specific features
      await httpODataProvider.connect();
      const baseUrl = httpODataProvider.getBaseUrl();
      expect(baseUrl).toContain('odata.org');

      // Set auth headers (for demonstration)
      httpODataProvider.setAuthHeaders({
        'Authorization': 'Bearer test-token'
      });
      const authHeaders = httpODataProvider.getAuthHeaders();
      expect(authHeaders['Authorization']).toBe('Bearer test-token');

      console.log('✅ Provider-specific features successful');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      console.log('🎯 Testing error handling...');

      // Test invalid MongoDB connection with shorter timeout
      const invalidMongoProvider = new MongoDBProvider(
        'mongodb://invalid-host:27017/test',
        'test',
        { serverSelectionTimeoutMS: 1000, connectTimeoutMS: 1000 }
      );
      
      const mongoConnectionResult = await invalidMongoProvider.connect();
      expect(mongoConnectionResult.success).toBe(false);
      expect(mongoConnectionResult.errors).toBeDefined();
      expect(mongoConnectionResult.errors?.length).toBeGreaterThan(0);

      // Test invalid HTTP OData connection
      const invalidHttpProvider = new HTTPODataProvider(
        'https://invalid-odata-service.com'
      );
      
      const httpConnectionResult = await invalidHttpProvider.connect();
      expect(httpConnectionResult.success).toBe(false);
      expect(httpConnectionResult.errors).toBeDefined();
      expect(httpConnectionResult.errors?.length).toBeGreaterThan(0);

      console.log('✅ Error handling successful');
    }, 10000); // 10 second timeout

    it('should provide user-friendly error messages', async () => {
      console.log('🎯 Testing user-friendly error messages...');

      const invalidMongoProvider = new MongoDBProvider(
        'mongodb://invalid-host:27017/test',
        'test',
        { serverSelectionTimeoutMS: 1000, connectTimeoutMS: 1000 }
      );
      
      const result = await invalidMongoProvider.connect();
      
      if (!result.success && result.errors) {
        const error = result.errors[0];
        expect(error.message).toBeDefined();
        expect(error.suggestion).toBeDefined();
        expect(typeof error.suggestion).toBe('string');
        expect(error.suggestion.length).toBeGreaterThan(0);
      }

      console.log('✅ User-friendly error messages successful');
    }, 10000); // 10 second timeout
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      console.log('🎯 Testing performance monitoring...');

      // Test SQLite performance tracking
      await sqliteProvider.connect();
      await sqliteProvider.createTable('test_users_perf', userSchema);

      // Perform some operations
      const createResult = await sqliteProvider.create('test_users_perf', {
        name: 'Performance User',
        email: 'perf@example.com',
        age: 25,
        isActive: true,
        createdAt: new Date()
      });
      
      if (createResult.success) {
        await sqliteProvider.read('test_users_perf');
        await sqliteProvider.executeQuery('test_users_perf', {
          filter: { field: 'age', operator: 'gt', value: 20 }
        });
      }

      const stats = sqliteProvider.getConnectionStats();
      expect(stats.totalQueries).toBeGreaterThan(0);
      expect(stats.averageQueryTime).toBeGreaterThanOrEqual(0);
      expect(stats.uptime).toBeGreaterThan(0);

      console.log(`✅ Performance monitoring: ${stats.totalQueries} queries, avg time: ${stats.averageQueryTime.toFixed(2)}ms`);
    });
  });
});
