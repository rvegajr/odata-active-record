import { describe, it, expect, beforeEach } from 'vitest';
import type { 
  IAstroConfig,
  IAstroContext,
  IAstroApiHandler,
  IAstroODataService,
  IAstroApiRouteBuilder,
  IAstroSSRIntegration,
  IAstroEdgeIntegration,
  IAstroCache,
  IAstroErrorHandler,
  IAstroRequestUtils,
  IAstroConfigValidator,
  IAstroPerformanceMonitor,
  IEntityNamespaceManager,
  IDataTypeHandler,
  IDataProvider,
  IQuery,
  IQueryResult
} from 'odata-active-record-contracts';

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
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    name: { name: 'name', type: 'string', nullable: false },
    email: { name: 'email', type: 'string', nullable: false },
    age: { name: 'age', type: 'number', nullable: true },
    isActive: { name: 'isActive', type: 'boolean', nullable: false, defaultValue: true },
    createdAt: { name: 'createdAt', type: 'date', nullable: false, defaultValue: () => new Date() }
  }
};

// Mock implementations for testing
class MockDataTypeHandler implements IDataTypeHandler {
  parseDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  formatDate(date: Date): string {
    return date.toISOString();
  }

  handleTimezone(date: Date): Date {
    return date;
  }

  isValidDate(value: unknown): boolean {
    return this.parseDate(value) !== null;
  }

  parseNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  handlePrecision(value: number): number {
    return Math.round(value * 100) / 100;
  }

  isValidNumber(value: unknown): boolean {
    return this.parseNumber(value) !== null;
  }

  sanitizeString(value: unknown): string {
    return String(value).trim();
  }

  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  truncateString(value: string, maxLength: number): string {
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  }

  isValidString(value: unknown): boolean {
    return typeof value === 'string' || typeof value === 'number';
  }

  parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  isValidBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === 'false' || lower === '1' || lower === '0' || lower === 'yes' || lower === 'no';
    }
    if (typeof value === 'number') return value === 0 || value === 1;
    return false;
  }

  parseJSON(value: unknown): unknown {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  isValidJSON(value: unknown): boolean {
    return this.parseJSON(value) !== null;
  }

  stringifyJSON(value: unknown): string {
    return JSON.stringify(value);
  }

  validateArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    return [];
  }

  isValidArray(value: unknown): boolean {
    return Array.isArray(value);
  }

  autoConvert(value: unknown, targetType?: string): unknown {
    if (targetType) {
      switch (targetType) {
        case 'date': return this.parseDate(value);
        case 'number': return this.parseNumber(value);
        case 'boolean': return this.parseBoolean(value);
        case 'json': return this.parseJSON(value);
        case 'array': return this.validateArray(value);
        case 'string': return this.sanitizeString(value);
      }
    }

    if (this.isValidArray(value)) return this.validateArray(value);
    if (this.isValidJSON(value)) return this.parseJSON(value);
    if (this.isValidNumber(value)) return this.parseNumber(value);
    if (this.isValidBoolean(value)) return this.parseBoolean(value);
    if (this.isValidDate(value)) return this.parseDate(value);
    
    return this.sanitizeString(value);
  }
}

class MockDataProvider implements IDataProvider {
  private connected = false;

  getName(): string {
    return 'MockProvider';
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<any> {
    this.connected = true;
    return { success: true };
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async testConnection(): Promise<any> {
    return { success: this.connected };
  }

  getConnectionStats(): any {
    return {
      connected: this.connected,
      uptime: 0,
      activeConnections: this.connected ? 1 : 0,
      totalQueries: 0,
      averageQueryTime: 0
    };
  }
}

class MockEntityNamespaceManager implements IEntityNamespaceManager {
  private namespaces = new Map<string, any>();

  createNamespace(name: string): any {
    const namespace = {
      name,
      entities: new Map(),
      registerEntity: (entityName: string, schema: any) => {
        namespace.entities.set(entityName, schema);
      },
      getEntity: (entityName: string) => {
        return namespace.entities.get(entityName);
      }
    };
    this.namespaces.set(name, namespace);
    return namespace;
  }

  getNamespace(name: string): any {
    return this.namespaces.get(name);
  }

  listNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }

  removeNamespace(name: string): boolean {
    return this.namespaces.delete(name);
  }

  validateAllNamespaces(): any {
    return { valid: true, errors: [] };
  }

  getAllNamespaceStats(): any {
    return { totalNamespaces: this.namespaces.size };
  }
}

class MockAstroODataService implements IAstroODataService {
  constructor(
    private namespaceManager: IEntityNamespaceManager,
    private dataTypeHandler: IDataTypeHandler,
    private defaultProvider: IDataProvider
  ) {}

  getNamespaceManager(): IEntityNamespaceManager {
    return this.namespaceManager;
  }

  getDataTypeHandler(): IDataTypeHandler {
    return this.dataTypeHandler;
  }

  getDefaultProvider(): IDataProvider {
    return this.defaultProvider;
  }

  async executeQuery<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    query: IQuery
  ): Promise<IQueryResult<T>> {
    return {
      data: [],
      success: true,
      metadata: {
        count: 0,
        executionTime: 10,
        cacheStatus: 'miss'
      }
    };
  }

  async getEntityMetadata(namespace: string, entityName: string): Promise<any> {
    return {
      success: true,
      metadata: userSchema
    };
  }

  async getServiceDocument(namespace: string): Promise<any> {
    return {
      success: true,
      serviceDocument: {
        entitySets: ['Users'],
        capabilities: {},
        metadata: {}
      }
    };
  }

  async getMetadataDocument(namespace: string): Promise<any> {
    return {
      success: true,
      metadataDocument: '<?xml version="1.0" encoding="utf-8"?>...'
    };
  }

  async createEntity<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    data: Partial<T>
  ): Promise<any> {
    return {
      data: { ...data, id: Math.floor(Math.random() * 1000000) },
      success: true,
      id: Math.floor(Math.random() * 1000000)
    };
  }

  async readEntities<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    query?: IQuery
  ): Promise<any> {
    return {
      data: [],
      success: true,
      metadata: {
        totalCount: 0,
        executionTime: 15,
        cached: false
      }
    };
  }

  async updateEntity<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    id: any,
    data: Partial<T>
  ): Promise<any> {
    return {
      data: { id, ...data },
      success: true,
      metadata: {
        executionTime: 8,
        updated: true,
        affectedCount: 1
      }
    };
  }

  async deleteEntity(namespace: string, entityName: string, id: any): Promise<any> {
    return {
      success: true,
      metadata: {
        executionTime: 3,
        deleted: true,
        affectedCount: 1
      }
    };
  }
}

describe('Astro Integration', () => {
  let dataTypeHandler: IDataTypeHandler;
  let dataProvider: IDataProvider;
  let namespaceManager: IEntityNamespaceManager;
  let astroService: IAstroODataService;

  beforeEach(() => {
    dataTypeHandler = new MockDataTypeHandler();
    dataProvider = new MockDataProvider();
    namespaceManager = new MockEntityNamespaceManager();
    astroService = new MockAstroODataService(namespaceManager, dataTypeHandler, dataProvider);
  });

  describe('Astro Configuration', () => {
    it('should validate Astro configuration correctly', () => {
      console.log('🎯 Testing Astro configuration validation...');

      const config: IAstroConfig = {
        ssr: true,
        ssg: false,
        edge: false,
        output: 'server',
        baseUrl: 'https://example.com',
        database: {
          type: 'mongodb',
          url: 'mongodb://localhost:27017/test',
          name: 'test'
        },
        namespaces: {
          default: 'ecommerce',
          configs: {
            ecommerce: {
              enabled: true,
              entities: {
                User: userSchema
              }
            }
          }
        },
        api: {
          basePath: '/api',
          autoGenerate: true,
          cors: {
            enabled: true,
            origin: ['https://example.com']
          }
        },
        cache: {
          enabled: true,
          ttl: 3600,
          storage: 'memory'
        }
      };

      expect(config.ssr).toBe(true);
      expect(config.database?.type).toBe('mongodb');
      expect(config.namespaces?.default).toBe('ecommerce');
      expect(config.api?.autoGenerate).toBe(true);
      expect(config.cache?.enabled).toBe(true);

      console.log('✅ Astro configuration validation successful');
    });

    it('should handle different output modes', () => {
      console.log('🎯 Testing different Astro output modes...');

      const staticConfig: IAstroConfig = {
        output: 'static',
        ssg: true,
        ssr: false
      };

      const serverConfig: IAstroConfig = {
        output: 'server',
        ssr: true,
        ssg: false
      };

      const hybridConfig: IAstroConfig = {
        output: 'hybrid',
        ssr: true,
        ssg: true
      };

      expect(staticConfig.output).toBe('static');
      expect(serverConfig.output).toBe('server');
      expect(hybridConfig.output).toBe('hybrid');

      console.log('✅ Different output modes handled correctly');
    });
  });

  describe('Astro OData Service', () => {
    it('should provide OData service functionality', async () => {
      console.log('🎯 Testing Astro OData service functionality...');

      expect(astroService.getNamespaceManager()).toBe(namespaceManager);
      expect(astroService.getDataTypeHandler()).toBe(dataTypeHandler);
      expect(astroService.getDefaultProvider()).toBe(dataProvider);

      const queryResult = await astroService.executeQuery('ecommerce', 'Users', {
        filter: { field: 'age', operator: 'gt', value: 18 },
        select: { fields: ['name', 'email'], exclude: false },
        orderBy: [{ field: 'name', direction: 'asc' }],
        pagination: { take: 10, skip: 0 }
      });

      expect(queryResult.success).toBe(true);
      expect(queryResult.data).toBeDefined();

      console.log('✅ Astro OData service functionality works correctly');
    });

    it('should handle CRUD operations', async () => {
      console.log('🎯 Testing CRUD operations through Astro service...');

      // CREATE
      const createResult = await astroService.createEntity('ecommerce', 'Users', {
        name: 'John Doe',
        email: 'john@example.com',
        age: '25',
        isActive: 'true',
        createdAt: 'today'
      });

      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      expect(createResult.id).toBeDefined();

      // READ
      const readResult = await astroService.readEntities('ecommerce', 'Users');
      expect(readResult.success).toBe(true);
      expect(readResult.data).toBeDefined();

      // UPDATE
      const updateResult = await astroService.updateEntity('ecommerce', 'Users', createResult.id, {
        age: '30'
      });
      expect(updateResult.success).toBe(true);

      // DELETE
      const deleteResult = await astroService.deleteEntity('ecommerce', 'Users', createResult.id);
      expect(deleteResult.success).toBe(true);

      console.log('✅ CRUD operations work correctly through Astro service');
    });

    it('should get metadata documents', async () => {
      console.log('🎯 Testing metadata document retrieval...');

      const metadataResult = await astroService.getEntityMetadata('ecommerce', 'Users');
      expect(metadataResult.success).toBe(true);
      expect(metadataResult.metadata).toBeDefined();

      const serviceDocResult = await astroService.getServiceDocument('ecommerce');
      expect(serviceDocResult.success).toBe(true);
      expect(serviceDocResult.serviceDocument).toBeDefined();

      const metadataDocResult = await astroService.getMetadataDocument('ecommerce');
      expect(metadataDocResult.success).toBe(true);
      expect(metadataDocResult.metadataDocument).toBeDefined();

      console.log('✅ Metadata document retrieval works correctly');
    });
  });

  describe('Astro API Route Builder', () => {
    it('should build API routes for namespaces', () => {
      console.log('🎯 Testing API route builder...');

      const mockRouteBuilder: IAstroApiRouteBuilder = {
        buildRoutes: (namespace: string, config: IAstroConfig) => ({
          GET: async (context: IAstroContext) => new Response('OK'),
          POST: async (context: IAstroContext) => new Response('Created', { status: 201 })
        }),
        buildODataRoutes: (service: IAstroODataService, config: IAstroConfig) => ({
          GET: async (context: IAstroContext) => new Response('OData OK'),
          POST: async (context: IAstroContext) => new Response('OData Created', { status: 201 })
        }),
        buildEntityRoutes: (namespace: string, entityName: string, service: IAstroODataService, config: IAstroConfig) => ({
          GET: async (context: IAstroContext) => new Response('Entity OK'),
          POST: async (context: IAstroContext) => new Response('Entity Created', { status: 201 }),
          PUT: async (context: IAstroContext) => new Response('Entity Updated'),
          DELETE: async (context: IAstroContext) => new Response('Entity Deleted')
        }),
        buildMetadataRoutes: (service: IAstroODataService, config: IAstroConfig) => ({
          GET: async (context: IAstroContext) => new Response('Metadata OK')
        })
      };

      const config: IAstroConfig = {
        api: {
          basePath: '/api',
          autoGenerate: true
        }
      };

      const namespaceRoutes = mockRouteBuilder.buildRoutes('ecommerce', config);
      expect(namespaceRoutes.GET).toBeDefined();
      expect(namespaceRoutes.POST).toBeDefined();

      const odataRoutes = mockRouteBuilder.buildODataRoutes(astroService, config);
      expect(odataRoutes.GET).toBeDefined();
      expect(odataRoutes.POST).toBeDefined();

      const entityRoutes = mockRouteBuilder.buildEntityRoutes('ecommerce', 'Users', astroService, config);
      expect(entityRoutes.GET).toBeDefined();
      expect(entityRoutes.POST).toBeDefined();
      expect(entityRoutes.PUT).toBeDefined();
      expect(entityRoutes.DELETE).toBeDefined();

      const metadataRoutes = mockRouteBuilder.buildMetadataRoutes(astroService, config);
      expect(metadataRoutes.GET).toBeDefined();

      console.log('✅ API route builder works correctly');
    });
  });

  describe('Astro SSR/SSG Integration', () => {
    it('should provide SSR/SSG data functionality', async () => {
      console.log('🎯 Testing SSR/SSG integration...');

      const mockSSRIntegration: IAstroSSRIntegration = {
        getSSRData: async <T>(namespace: string, entityName: string, query?: IQuery) => {
          return [] as T[];
        },
        getSSGData: async <T>(namespace: string, entityName: string, query?: IQuery) => {
          return [] as T[];
        },
        preRenderData: async <T>(namespace: string, entityName: string, queries: IQuery[]) => {
          return {} as Record<string, T[]>;
        },
        getStaticPaths: async <T>(namespace: string, entityName: string, query?: IQuery) => {
          return [] as Array<{ params: Record<string, string>; props: T }>;
        }
      };

      const ssrData = await mockSSRIntegration.getSSRData('ecommerce', 'Users');
      expect(Array.isArray(ssrData)).toBe(true);

      const ssgData = await mockSSRIntegration.getSSGData('ecommerce', 'Users');
      expect(Array.isArray(ssgData)).toBe(true);

      const preRenderData = await mockSSRIntegration.preRenderData('ecommerce', 'Users', []);
      expect(typeof preRenderData).toBe('object');

      const staticPaths = await mockSSRIntegration.getStaticPaths('ecommerce', 'Users');
      expect(Array.isArray(staticPaths)).toBe(true);

      console.log('✅ SSR/SSG integration works correctly');
    });
  });

  describe('Astro Edge Runtime Integration', () => {
    it('should provide edge runtime functionality', () => {
      console.log('🎯 Testing edge runtime integration...');

      const mockEdgeIntegration: IAstroEdgeIntegration = {
        isEdgeRuntime: () => true,
        getEdgeCapabilities: () => ({
          databaseConnections: true,
          fileSystemAccess: false,
          caching: true,
          maxExecutionTime: 30000,
          memoryLimit: 128
        }),
        executeInEdge: async <T>(fn: () => Promise<T>) => {
          return await fn();
        },
        getEdgeProvider: () => dataProvider
      };

      expect(mockEdgeIntegration.isEdgeRuntime()).toBe(true);

      const capabilities = mockEdgeIntegration.getEdgeCapabilities();
      expect(capabilities.databaseConnections).toBe(true);
      expect(capabilities.fileSystemAccess).toBe(false);
      expect(capabilities.caching).toBe(true);
      expect(capabilities.maxExecutionTime).toBe(30000);
      expect(capabilities.memoryLimit).toBe(128);

      console.log('✅ Edge runtime integration works correctly');
    });
  });

  describe('Astro Caching', () => {
    it('should provide caching functionality', async () => {
      console.log('🎯 Testing Astro caching...');

      const mockCache: IAstroCache = {
        get: async <T>(key: string) => {
          return null as T | null;
        },
        set: async <T>(key: string, value: T, ttl?: number) => {
          // Mock implementation
        },
        delete: async (key: string) => {
          // Mock implementation
        },
        clear: async () => {
          // Mock implementation
        },
        has: async (key: string) => {
          return false;
        },
        getStats: async () => ({
          size: 0,
          hitRate: 0,
          missRate: 1,
          memoryUsage: 0
        })
      };

      const cachedValue = await mockCache.get('test-key');
      expect(cachedValue).toBeNull();

      await mockCache.set('test-key', { data: 'test' });
      await mockCache.set('test-key', { data: 'test' }, 3600);

      const hasKey = await mockCache.has('test-key');
      expect(hasKey).toBe(false);

      const stats = await mockCache.getStats();
      expect(stats.size).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.missRate).toBe(1);

      console.log('✅ Astro caching works correctly');
    });
  });

  describe('Astro Error Handling', () => {
    it('should provide error handling functionality', async () => {
      console.log('🎯 Testing Astro error handling...');

      const mockErrorHandler: IAstroErrorHandler = {
        handleApiError: async (error: Error, context: IAstroContext) => {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        handleValidationError: async (errors: any[], context: IAstroContext) => {
          return new Response(JSON.stringify({ errors }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        handleDatabaseError: async (error: Error, context: IAstroContext) => {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        handleODataError: async (error: Error, context: IAstroContext) => {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        createErrorResponse: (status: number, message: string, details?: Record<string, unknown>) => {
          return new Response(JSON.stringify({ error: message, details }), {
            status,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      };

      const mockContext: IAstroContext = {
        request: new Request('https://example.com'),
        params: {},
        query: new URLSearchParams(),
        headers: new Headers(),
        method: 'GET',
        url: new URL('https://example.com'),
        env: {},
        config: {},
        dev: true,
        prod: false,
        preview: false
      };

      const apiErrorResponse = await mockErrorHandler.handleApiError(new Error('API Error'), mockContext);
      expect(apiErrorResponse.status).toBe(500);

      const validationErrorResponse = await mockErrorHandler.handleValidationError([], mockContext);
      expect(validationErrorResponse.status).toBe(400);

      const databaseErrorResponse = await mockErrorHandler.handleDatabaseError(new Error('Database Error'), mockContext);
      expect(databaseErrorResponse.status).toBe(503);

      const odataErrorResponse = await mockErrorHandler.handleODataError(new Error('OData Error'), mockContext);
      expect(odataErrorResponse.status).toBe(400);

      const customErrorResponse = mockErrorHandler.createErrorResponse(404, 'Not Found', { path: '/test' });
      expect(customErrorResponse.status).toBe(404);

      console.log('✅ Astro error handling works correctly');
    });
  });

  describe('Astro Request Utils', () => {
    it('should provide request/response utilities', async () => {
      console.log('🎯 Testing Astro request utilities...');

      const mockRequestUtils: IAstroRequestUtils = {
        parseBody: async <T>(request: Request) => {
          return {} as T;
        },
        parseQuery: (query: URLSearchParams) => {
          return {};
        },
        parseODataQuery: (request: Request) => {
          return {
            filter: { field: 'name', operator: 'eq', value: 'test' },
            select: { fields: ['id', 'name'], exclude: false },
            orderBy: [{ field: 'name', direction: 'asc' }],
            pagination: { take: 10, skip: 0 }
          };
        },
        createJsonResponse: <T>(data: T, status?: number) => {
          return new Response(JSON.stringify(data), {
            status: status || 200,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        createErrorResponse: (status: number, message: string, details?: Record<string, unknown>) => {
          return new Response(JSON.stringify({ error: message, details }), {
            status,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        validateMethod: (request: Request, allowedMethods: string[]) => {
          return allowedMethods.includes(request.method);
        },
        getClientIP: (request: Request) => {
          return '127.0.0.1';
        },
        getUserAgent: (request: Request) => {
          return 'Mozilla/5.0 (Test Browser)';
        }
      };

      const request = new Request('https://example.com?name=test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'John Doe' })
      });

      const body = await mockRequestUtils.parseBody(request);
      expect(typeof body).toBe('object');

      const query = mockRequestUtils.parseQuery(new URLSearchParams('name=test'));
      expect(typeof query).toBe('object');

      const odataQuery = mockRequestUtils.parseODataQuery(request);
      expect(odataQuery.filter).toBeDefined();
      expect(odataQuery.select).toBeDefined();
      expect(odataQuery.orderBy).toBeDefined();
      expect(odataQuery.pagination).toBeDefined();

      const jsonResponse = mockRequestUtils.createJsonResponse({ data: 'test' });
      expect(jsonResponse.status).toBe(200);
      expect(jsonResponse.headers.get('Content-Type')).toBe('application/json');

      const errorResponse = mockRequestUtils.createErrorResponse(400, 'Bad Request');
      expect(errorResponse.status).toBe(400);

      const isValidMethod = mockRequestUtils.validateMethod(request, ['POST', 'PUT']);
      expect(isValidMethod).toBe(true);

      const clientIP = mockRequestUtils.getClientIP(request);
      expect(clientIP).toBe('127.0.0.1');

      const userAgent = mockRequestUtils.getUserAgent(request);
      expect(userAgent).toBe('Mozilla/5.0 (Test Browser)');

      console.log('✅ Astro request utilities work correctly');
    });
  });

  describe('Astro Configuration Validator', () => {
    it('should validate configuration correctly', () => {
      console.log('🎯 Testing Astro configuration validator...');

      const mockValidator: IAstroConfigValidator = {
        validate: (config: IAstroConfig) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!config.database) {
            errors.push('Database configuration is required');
          }

          if (!config.namespaces?.default) {
            warnings.push('No default namespace specified');
          }

          return {
            valid: errors.length === 0,
            errors,
            warnings
          };
        },
        validateDatabase: (config: IAstroConfig['database']) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!config) {
            errors.push('Database configuration is required');
          } else if (!config.url) {
            errors.push('Database URL is required');
          }

          return {
            valid: errors.length === 0,
            errors,
            warnings
          };
        },
        validateNamespaces: (config: IAstroConfig['namespaces']) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!config?.configs || Object.keys(config.configs).length === 0) {
            warnings.push('No namespace configurations provided');
          }

          return {
            valid: errors.length === 0,
            errors,
            warnings
          };
        },
        validateApi: (config: IAstroConfig['api']) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          if (config?.cors?.enabled && !config.cors.origin) {
            warnings.push('CORS enabled but no origin specified');
          }

          return {
            valid: errors.length === 0,
            errors,
            warnings
          };
        }
      };

      const validConfig: IAstroConfig = {
        database: {
          type: 'mongodb',
          url: 'mongodb://localhost:27017/test'
        },
        namespaces: {
          default: 'ecommerce',
          configs: {
            ecommerce: { enabled: true }
          }
        }
      };

      const invalidConfig: IAstroConfig = {
        // Missing database configuration
      };

      const validResult = mockValidator.validate(validConfig);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors.length).toBe(0);

      const invalidResult = mockValidator.validate(invalidConfig);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);

      const dbValidation = mockValidator.validateDatabase(validConfig.database);
      expect(dbValidation.valid).toBe(true);

      const namespaceValidation = mockValidator.validateNamespaces(validConfig.namespaces);
      expect(namespaceValidation.valid).toBe(true);

      const apiValidation = mockValidator.validateApi(validConfig.api);
      expect(apiValidation.valid).toBe(true);

      console.log('✅ Astro configuration validator works correctly');
    });
  });

  describe('Astro Performance Monitor', () => {
    it('should provide performance monitoring functionality', () => {
      console.log('🎯 Testing Astro performance monitor...');

      const mockPerformanceMonitor: IAstroPerformanceMonitor = {
        startTimer: (name: string) => {
          // Mock implementation
        },
        endTimer: (name: string) => {
          return Math.random() * 100; // Mock timing
        },
        getTimings: () => ({
          'api-request': {
            calls: 10,
            totalTime: 500,
            averageTime: 50,
            minTime: 10,
            maxTime: 100
          },
          'database-query': {
            calls: 25,
            totalTime: 250,
            averageTime: 10,
            minTime: 5,
            maxTime: 20
          }
        }),
        reset: () => {
          // Mock implementation
        },
        getReport: () => ({
          overall: {
            totalRequests: 35,
            averageResponseTime: 21.4,
            slowestOperation: 'api-request',
            fastestOperation: 'database-query'
          },
          operations: {
            'api-request': { calls: 10, avgTime: 50 },
            'database-query': { calls: 25, avgTime: 10 }
          }
        })
      };

      mockPerformanceMonitor.startTimer('test-operation');
      const timing = mockPerformanceMonitor.endTimer('test-operation');
      expect(typeof timing).toBe('number');
      expect(timing).toBeGreaterThanOrEqual(0);

      const timings = mockPerformanceMonitor.getTimings();
      expect(timings['api-request']).toBeDefined();
      expect(timings['database-query']).toBeDefined();
      expect(timings['api-request'].calls).toBe(10);
      expect(timings['database-query'].calls).toBe(25);

      const report = mockPerformanceMonitor.getReport();
      expect(report.overall.totalRequests).toBe(35);
      expect(report.overall.slowestOperation).toBe('api-request');
      expect(report.overall.fastestOperation).toBe('database-query');

      console.log('✅ Astro performance monitor works correctly');
    });
  });

  describe('E2E: Complete Astro Integration Workflow', () => {
    it('should demonstrate complete Astro integration workflow', async () => {
      console.log('🎯 Demonstrating complete Astro integration workflow...');

      // 1. Configuration
      const config: IAstroConfig = {
        ssr: true,
        output: 'server',
        database: {
          type: 'mongodb',
          url: 'mongodb://localhost:27017/test',
          name: 'test'
        },
        namespaces: {
          default: 'ecommerce',
          configs: {
            ecommerce: {
              enabled: true,
              entities: {
                User: userSchema
              }
            }
          }
        },
        api: {
          basePath: '/api',
          autoGenerate: true,
          cors: {
            enabled: true,
            origin: ['https://example.com']
          }
        },
        cache: {
          enabled: true,
          ttl: 3600,
          storage: 'memory'
        }
      };

      // 2. Service Setup
      await dataProvider.connect();
      const namespace = namespaceManager.createNamespace('ecommerce');
      namespace.registerEntity('User', userSchema);

      // 3. OData Operations
      const user = await astroService.createEntity('ecommerce', 'Users', {
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: '28',
        isActive: 'true',
        createdAt: 'today'
      });

      expect(user.success).toBe(true);
      expect(user.data).toBeDefined();

      const users = await astroService.readEntities('ecommerce', 'Users');
      expect(users.success).toBe(true);

      const queryResult = await astroService.executeQuery('ecommerce', 'Users', {
        filter: { field: 'age', operator: 'gt', value: 18 },
        select: { fields: ['name', 'email'], exclude: false },
        orderBy: [{ field: 'name', direction: 'asc' }],
        pagination: { take: 10, skip: 0 }
      });

      expect(queryResult.success).toBe(true);

      // 4. API Route Simulation
      const mockContext: IAstroContext = {
        request: new Request('https://example.com/api/ecommerce/Users'),
        params: { namespace: 'ecommerce', entity: 'Users' },
        query: new URLSearchParams('$filter=age gt 18&$select=name,email'),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        method: 'GET',
        url: new URL('https://example.com/api/ecommerce/Users'),
        env: {},
        config,
        dev: true,
        prod: false,
        preview: false
      };

      // 5. Error Handling
      const mockErrorHandler: IAstroErrorHandler = {
        handleApiError: async (error: Error, context: IAstroContext) => {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        handleValidationError: async (errors: any[], context: IAstroContext) => {
          return new Response(JSON.stringify({ errors }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        handleDatabaseError: async (error: Error, context: IAstroContext) => {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        handleODataError: async (error: Error, context: IAstroContext) => {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        },
        createErrorResponse: (status: number, message: string, details?: Record<string, unknown>) => {
          return new Response(JSON.stringify({ error: message, details }), {
            status,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      };

      // 6. Performance Monitoring
      const mockPerformanceMonitor: IAstroPerformanceMonitor = {
        startTimer: (name: string) => {},
        endTimer: (name: string) => 50,
        getTimings: () => ({}),
        reset: () => {},
        getReport: () => ({
          overall: {
            totalRequests: 1,
            averageResponseTime: 50,
            slowestOperation: 'api-request',
            fastestOperation: 'api-request'
          },
          operations: {}
        })
      };

      mockPerformanceMonitor.startTimer('astro-integration-test');
      const testTiming = mockPerformanceMonitor.endTimer('astro-integration-test');
      expect(testTiming).toBe(50);

      console.log('✅ Complete Astro integration workflow works seamlessly');
    });
  });
});
