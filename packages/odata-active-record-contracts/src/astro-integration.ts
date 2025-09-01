import type { 
  IEntityNamespaceManager, 
  IDataTypeHandler, 
  IDataProvider,
  IQuery,
  IQueryResult,
  IUserFriendlyError 
} from './index';

/**
 * Interface for Astro-specific configuration
 */
export interface IAstroConfig {
  /**
   * Whether to enable SSR (Server-Side Rendering)
   */
  ssr?: boolean;

  /**
   * Whether to enable SSG (Static Site Generation)
   */
  ssg?: boolean;

  /**
   * Whether to use edge runtime
   */
  edge?: boolean;

  /**
   * Output mode: 'static', 'server', or 'hybrid'
   */
  output?: 'static' | 'server' | 'hybrid';

  /**
   * Base URL for the Astro application
   */
  baseUrl?: string;

  /**
   * Environment variables to inject
   */
  env?: Record<string, string>;

  /**
   * Database connection configuration
   */
  database?: {
    /**
     * Database type: 'mongodb', 'sqlite', 'http-odata'
     */
    type: 'mongodb' | 'sqlite' | 'http-odata';

    /**
     * Connection string or URL
     */
    url: string;

    /**
     * Database name or service name
     */
    name?: string;

    /**
     * Authentication credentials
     */
    auth?: {
      username?: string;
      password?: string;
      token?: string;
    };

    /**
     * Connection options
     */
    options?: Record<string, unknown>;
  };

  /**
   * Namespace configuration
   */
  namespaces?: {
    /**
     * Default namespace name
     */
    default?: string;

    /**
     * Namespace-specific configurations
     */
    configs?: Record<string, {
      /**
         * Database connection for this namespace
         */
      database?: {
        type: 'mongodb' | 'sqlite' | 'http-odata';
        url: string;
        name?: string;
        auth?: {
          username?: string;
          password?: string;
          token?: string;
        };
        options?: Record<string, unknown>;
      };

      /**
       * Entity schemas for this namespace
       */
      entities?: Record<string, any>;

      /**
       * Whether this namespace is enabled
       */
      enabled?: boolean;
    }>;
  };

  /**
   * API route configuration
   */
  api?: {
    /**
     * Base path for API routes
     */
    basePath?: string;

    /**
     * Whether to enable automatic API route generation
     */
    autoGenerate?: boolean;

    /**
     * Custom API route handlers
     */
    handlers?: Record<string, any>;

    /**
     * CORS configuration
     */
    cors?: {
      enabled?: boolean;
      origin?: string | string[];
      methods?: string[];
      headers?: string[];
    };

    /**
     * Rate limiting configuration
     */
    rateLimit?: {
      enabled?: boolean;
      windowMs?: number;
      maxRequests?: number;
    };
  };

  /**
   * Caching configuration
   */
  cache?: {
    /**
     * Whether to enable caching
     */
    enabled?: boolean;

    /**
     * Cache TTL in seconds
     */
    ttl?: number;

    /**
     * Cache storage type: 'memory', 'redis', 'file'
     */
    storage?: 'memory' | 'redis' | 'file';

    /**
     * Cache storage options
     */
    options?: Record<string, unknown>;
  };
}

/**
 * Interface for Astro context
 */
export interface IAstroContext {
  /**
   * Astro request object
   */
  request: Request;

  /**
   * Astro response object
   */
  response?: Response;

  /**
   * URL parameters
   */
  params: Record<string, string>;

  /**
   * Query parameters
   */
  query: URLSearchParams;

  /**
   * Request headers
   */
  headers: Headers;

  /**
   * Request method
   */
  method: string;

  /**
   * Request URL
   */
  url: URL;

  /**
   * Environment variables
   */
  env: Record<string, string>;

  /**
   * Astro configuration
   */
  config: IAstroConfig;

  /**
   * Whether running in development mode
   */
  dev: boolean;

  /**
   * Whether running in production mode
   */
  prod: boolean;

  /**
   * Whether running in preview mode
   */
  preview: boolean;
}

/**
 * Interface for Astro API route handler
 */
export interface IAstroApiHandler {
  /**
   * Handle GET requests
   */
  GET?(context: IAstroContext): Promise<Response>;

  /**
   * Handle POST requests
   */
  POST?(context: IAstroContext): Promise<Response>;

  /**
   * Handle PUT requests
   */
  PUT?(context: IAstroContext): Promise<Response>;

  /**
   * Handle PATCH requests
   */
  PATCH?(context: IAstroContext): Promise<Response>;

  /**
   * Handle DELETE requests
   */
  DELETE?(context: IAstroContext): Promise<Response>;

  /**
   * Handle any HTTP method
   */
  ALL?(context: IAstroContext): Promise<Response>;
}

/**
 * Interface for Astro middleware
 */
export interface IAstroMiddleware {
  /**
   * Execute middleware
   */
  execute(context: IAstroContext, next: () => Promise<Response>): Promise<Response>;

  /**
   * Get middleware priority (lower numbers execute first)
   */
  getPriority(): number;

  /**
   * Check if middleware should run for this request
   */
  shouldRun(context: IAstroContext): boolean;
}

/**
 * Interface for Astro OData service
 */
export interface IAstroODataService {
  /**
   * Get the namespace manager
   */
  getNamespaceManager(): IEntityNamespaceManager;

  /**
   * Get the data type handler
   */
  getDataTypeHandler(): IDataTypeHandler;

  /**
   * Get the default provider
   */
  getDefaultProvider(): IDataProvider;

  /**
   * Execute an OData query
   */
  executeQuery<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    query: IQuery
  ): Promise<IQueryResult<T>>;

  /**
   * Get entity metadata
   */
  getEntityMetadata(namespace: string, entityName: string): Promise<any>;

  /**
   * Get service document
   */
  getServiceDocument(namespace: string): Promise<any>;

  /**
   * Get metadata document
   */
  getMetadataDocument(namespace: string): Promise<any>;

  /**
   * Create an entity
   */
  createEntity<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    data: Partial<T>
  ): Promise<any>;

  /**
   * Read entities
   */
  readEntities<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    query?: IQuery
  ): Promise<any>;

  /**
   * Update an entity
   */
  updateEntity<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    id: any,
    data: Partial<T>
  ): Promise<any>;

  /**
   * Delete an entity
   */
  deleteEntity(namespace: string, entityName: string, id: any): Promise<any>;
}

/**
 * Interface for Astro API route builder
 */
export interface IAstroApiRouteBuilder {
  /**
   * Build API routes for a namespace
   */
  buildRoutes(namespace: string, config: IAstroConfig): IAstroApiHandler;

  /**
   * Build OData service routes
   */
  buildODataRoutes(service: IAstroODataService, config: IAstroConfig): IAstroApiHandler;

  /**
   * Build CRUD routes for an entity
   */
  buildEntityRoutes(
    namespace: string,
    entityName: string,
    service: IAstroODataService,
    config: IAstroConfig
  ): IAstroApiHandler;

  /**
   * Build metadata routes
   */
  buildMetadataRoutes(service: IAstroODataService, config: IAstroConfig): IAstroApiHandler;
}

/**
 * Interface for Astro SSR/SSG integration
 */
export interface IAstroSSRIntegration {
  /**
   * Get data for SSR
   */
  getSSRData<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    query?: IQuery
  ): Promise<T[]>;

  /**
   * Get data for SSG
   */
  getSSGData<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    query?: IQuery
  ): Promise<T[]>;

  /**
   * Pre-render data for static generation
   */
  preRenderData<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    queries: IQuery[]
  ): Promise<Record<string, T[]>>;

  /**
   * Get static paths for SSG
   */
  getStaticPaths<T = Record<string, unknown>>(
    namespace: string,
    entityName: string,
    query?: IQuery
  ): Promise<Array<{ params: Record<string, string>; props: T }>>;
}

/**
 * Interface for Astro edge runtime integration
 */
export interface IAstroEdgeIntegration {
  /**
   * Check if running in edge runtime
   */
  isEdgeRuntime(): boolean;

  /**
   * Get edge runtime capabilities
   */
  getEdgeCapabilities(): {
    /**
     * Whether database connections are supported
     */
    databaseConnections: boolean;

    /**
     * Whether file system access is supported
     */
    fileSystemAccess: boolean;

    /**
     * Whether caching is supported
     */
    caching: boolean;

    /**
     * Maximum execution time in milliseconds
     */
    maxExecutionTime: number;

    /**
     * Memory limit in MB
     */
    memoryLimit: number;
  };

  /**
   * Execute in edge runtime context
   */
  executeInEdge<T>(fn: () => Promise<T>): Promise<T>;

  /**
   * Get edge-specific provider
   */
  getEdgeProvider(): IDataProvider;
}

/**
 * Interface for Astro caching
 */
export interface IAstroCache {
  /**
   * Get cached value
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set cached value
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete cached value
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cached values
   */
  clear(): Promise<void>;

  /**
   * Check if key exists in cache
   */
  has(key: string): Promise<boolean>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<{
    /**
     * Number of cached items
     */
    size: number;

    /**
     * Cache hit rate
     */
    hitRate: number;

    /**
     * Cache miss rate
     */
    missRate: number;

    /**
     * Total memory usage in bytes
     */
    memoryUsage: number;
  }>;
}

/**
 * Interface for Astro error handling
 */
export interface IAstroErrorHandler {
  /**
   * Handle API errors
   */
  handleApiError(error: Error, context: IAstroContext): Promise<Response>;

  /**
   * Handle validation errors
   */
  handleValidationError(errors: IUserFriendlyError[], context: IAstroContext): Promise<Response>;

  /**
   * Handle database errors
   */
  handleDatabaseError(error: Error, context: IAstroContext): Promise<Response>;

  /**
   * Handle OData errors
   */
  handleODataError(error: Error, context: IAstroContext): Promise<Response>;

  /**
   * Create error response
   */
  createErrorResponse(
    status: number,
    message: string,
    details?: Record<string, unknown>
  ): Response;
}

/**
 * Interface for Astro request/response utilities
 */
export interface IAstroRequestUtils {
  /**
   * Parse request body
   */
  parseBody<T = Record<string, unknown>>(request: Request): Promise<T>;

  /**
   * Parse query parameters
   */
  parseQuery(query: URLSearchParams): Record<string, string>;

  /**
   * Parse OData query from request
   */
  parseODataQuery(request: Request): IQuery;

  /**
   * Create JSON response
   */
  createJsonResponse<T>(data: T, status?: number): Response;

  /**
   * Create error response
   */
  createErrorResponse(
    status: number,
    message: string,
    details?: Record<string, unknown>
  ): Response;

  /**
   * Validate request method
   */
  validateMethod(request: Request, allowedMethods: string[]): boolean;

  /**
   * Get request IP address
   */
  getClientIP(request: Request): string;

  /**
   * Get user agent
   */
  getUserAgent(request: Request): string;
}

/**
 * Interface for Astro configuration validation
 */
export interface IAstroConfigValidator {
  /**
   * Validate Astro configuration
   */
  validate(config: IAstroConfig): {
    /**
     * Whether configuration is valid
     */
    valid: boolean;

    /**
     * Validation errors
     */
    errors: string[];

    /**
     * Validation warnings
     */
    warnings: string[];
  };

  /**
   * Validate database configuration
   */
  validateDatabase(config: IAstroConfig['database']): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };

  /**
   * Validate namespace configuration
   */
  validateNamespaces(config: IAstroConfig['namespaces']): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };

  /**
   * Validate API configuration
   */
  validateApi(config: IAstroConfig['api']): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Interface for Astro performance monitoring
 */
export interface IAstroPerformanceMonitor {
  /**
   * Start timing an operation
   */
  startTimer(name: string): void;

  /**
   * End timing an operation
   */
  endTimer(name: string): number;

  /**
   * Get timing statistics
   */
  getTimings(): Record<string, {
    /**
     * Number of calls
     */
    calls: number;

    /**
     * Total time in milliseconds
     */
    totalTime: number;

    /**
     * Average time in milliseconds
     */
    averageTime: number;

    /**
     * Minimum time in milliseconds
     */
    minTime: number;

    /**
     * Maximum time in milliseconds
     */
    maxTime: number;
  }>;

  /**
   * Reset timing statistics
   */
  reset(): void;

  /**
   * Get performance report
   */
  getReport(): {
    /**
     * Overall performance metrics
     */
    overall: {
      totalRequests: number;
      averageResponseTime: number;
      slowestOperation: string;
      fastestOperation: string;
    };

    /**
     * Operation-specific metrics
     */
    operations: Record<string, any>;
  };
}
