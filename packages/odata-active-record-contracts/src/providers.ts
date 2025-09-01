import type { IEntitySchema, IIndexDefinition } from './schema';
import type { IQuery, IQueryResult } from './query';
import type { IUserFriendlyError } from './errors';

/**
 * Base interface for all data providers
 */
export interface IDataProvider {
  /**
   * Get the name of this provider
   */
  getName(): string;

  /**
   * Check if the provider is connected
   */
  isConnected(): boolean;

  /**
   * Connect to the data source
   */
  connect(): Promise<IConnectionResult>;

  /**
   * Disconnect from the data source
   */
  disconnect(): Promise<void>;

  /**
   * Test the connection
   */
  testConnection(): Promise<IConnectionResult>;

  /**
   * Get connection statistics
   */
  getConnectionStats(): IConnectionStats;
}

/**
 * Interface for providers that support OData queries
 */
export interface IODataProvider extends IDataProvider {
  /**
   * Execute an OData query
   */
  executeQuery<T = Record<string, unknown>>(
    entityName: string,
    query: IQuery
  ): Promise<IQueryResult<T>>;

  /**
   * Get metadata for an entity
   */
  getEntityMetadata(entityName: string): Promise<IEntityMetadataResult>;

  /**
   * Get service document (list of available entities)
   */
  getServiceDocument(): Promise<IServiceDocumentResult>;

  /**
   * Get OData metadata document
   */
  getMetadataDocument(): Promise<IMetadataDocumentResult>;
}

/**
 * Interface for providers that support CRUD operations
 */
export interface ICrudProvider extends IDataProvider {
  /**
   * Create a new entity
   */
  create<T = Record<string, unknown>>(
    entityName: string,
    data: Partial<T>
  ): Promise<ICreateResult<T>>;

  /**
   * Read entities
   */
  read<T = Record<string, unknown>>(
    entityName: string,
    query?: IQuery
  ): Promise<IReadResult<T>>;

  /**
   * Update an entity
   */
  update<T = Record<string, unknown>>(
    entityName: string,
    id: any,
    data: Partial<T>
  ): Promise<IUpdateResult<T>>;

  /**
   * Delete an entity
   */
  delete(entityName: string, id: any): Promise<IDeleteResult>;

  /**
   * Check if an entity exists
   */
  exists(entityName: string, id: any): Promise<boolean>;
}

/**
 * Interface for MongoDB-specific operations
 */
export interface IMongoDBProvider extends IODataProvider, ICrudProvider {
  /**
   * Get the MongoDB database instance
   */
  getDatabase(): any;

  /**
   * Get a MongoDB collection
   */
  getCollection(collectionName: string): any;

  /**
   * Execute a MongoDB aggregation pipeline
   */
  aggregate<T = Record<string, unknown>>(
    collectionName: string,
    pipeline: any[]
  ): Promise<IAggregationResult<T>>;

  /**
   * Create indexes for a collection
   */
  createIndexes(collectionName: string, indexes: any[]): Promise<void>;

  /**
   * Get collection statistics
   */
  getCollectionStats(collectionName: string): Promise<IMongoCollectionStats>;
}

/**
 * Interface for SQLite-specific operations
 */
export interface ISQLiteProvider extends IODataProvider, ICrudProvider {
  /**
   * Get the SQLite database instance
   */
  getDatabase(): any;

  /**
   * Execute a raw SQL query
   */
  executeSQL(sql: string, params?: any[]): Promise<ISQLResult>;

  /**
   * Create a table
   */
  createTable(tableName: string, schema: IEntitySchema): Promise<void>;

  /**
   * Drop a table
   */
  dropTable(tableName: string): Promise<void>;

  /**
   * Get table schema
   */
  getTableSchema(tableName: string): Promise<ITableSchemaResult>;

  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<ITransactionHandle>;

  /**
   * Get database statistics
   */
  getDatabaseStats(): Promise<ISQLiteDatabaseStats>;
}

/**
 * Interface for HTTP OData providers
 */
export interface IHTTPODataProvider extends IODataProvider {
  /**
   * Get the base URL for the OData service
   */
  getBaseUrl(): string;

  /**
   * Set authentication headers
   */
  setAuthHeaders(headers: Record<string, string>): void;

  /**
   * Get authentication headers
   */
  getAuthHeaders(): Record<string, string>;

  /**
   * Make a raw HTTP request to the OData service
   */
  makeRequest<T = Record<string, unknown>>(
    path: string,
    options?: IHTTPRequestOptions
  ): Promise<IHTTPResponse<T>>;

  /**
   * Get service capabilities
   */
  getServiceCapabilities(): Promise<IServiceCapabilities>;

  /**
   * Test if the service supports specific OData features
   */
  supportsFeature(feature: string): Promise<boolean>;
}

/**
 * Interface for transaction handles
 */
export interface ITransactionHandle {
  /**
   * Commit the transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the transaction
   */
  rollback(): Promise<void>;

  /**
   * Check if the transaction is active
   */
  isActive(): boolean;
}

/**
 * Interface for connection results
 */
export interface IConnectionResult {
  /**
   * Whether the connection was successful
   */
  success: boolean;

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Connection details
   */
  details?: {
    /**
     * Connection string or URL
     */
    connectionString?: string;

    /**
     * Database name or service name
     */
    databaseName?: string;

    /**
     * Connection time in milliseconds
     */
    connectionTime?: number;

    /**
     * Server version or API version
     */
    version?: string;
  };
}

/**
 * Interface for connection statistics
 */
export interface IConnectionStats {
  /**
   * Whether currently connected
   */
  connected: boolean;

  /**
   * Connection uptime in milliseconds
   */
  uptime: number;

  /**
   * Number of active connections
   */
  activeConnections: number;

  /**
   * Total number of queries executed
   */
  totalQueries: number;

  /**
   * Average query execution time
   */
  averageQueryTime: number;

  /**
   * Last connection attempt
   */
  lastConnectionAttempt?: Date;

  /**
   * Last successful connection
   */
  lastSuccessfulConnection?: Date;
}

/**
 * Interface for connection configuration
 */
export interface IConnectionConfig {
  /**
   * Type of connection
   */
  type: 'mongodb' | 'sqlite' | 'http-odata';

  /**
   * MongoDB connection string
   */
  connectionString?: string;

  /**
   * Database name
   */
  databaseName?: string;

  /**
   * SQLite file path
   */
  filePath?: string;

  /**
   * HTTP OData base URL
   */
  baseUrl?: string;

  /**
   * HTTP headers
   */
  headers?: Record<string, string>;

  /**
   * Connection pool size
   */
  poolSize?: number;

  /**
   * Minimum pool size
   */
  minPoolSize?: number;

  /**
   * Maximum idle time
   */
  maxIdleTime?: number;

  /**
   * Connection timeout
   */
  timeout?: number;

  /**
   * Verbose logging
   */
  verbose?: boolean;

  /**
   * File must exist (SQLite)
   */
  fileMustExist?: boolean;
}

/**
 * Interface for connection pool
 */
export interface IConnectionPool {
  /**
   * Get a connection from the pool
   */
  getConnection(connectionId: string, config: IConnectionConfig): Promise<any>;

  /**
   * Remove a connection from the pool
   */
  removeConnection(connectionId: string): void;

  /**
   * Get connection pool statistics
   */
  getConnectionStats(): IConnectionStats;

  /**
   * Close all connections
   */
  closeAll(): Promise<void>;
}

/**
 * Interface for entity metadata results
 */
export interface IEntityMetadataResult {
  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * The entity metadata
   */
  metadata?: IEntitySchema;

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];
}

/**
 * Interface for service document results
 */
export interface IServiceDocumentResult {
  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * The service document
   */
  serviceDocument?: {
    /**
     * Available entity sets
     */
    entitySets: string[];

    /**
     * Service capabilities
     */
    capabilities?: Record<string, unknown>;

    /**
     * Service metadata
     */
    metadata?: Record<string, unknown>;
  };

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];
}

/**
 * Interface for metadata document results
 */
export interface IMetadataDocumentResult {
  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * The metadata document
   */
  metadataDocument?: string;

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];
}

/**
 * Interface for create results
 */
export interface ICreateResult<T = Record<string, unknown>> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * The created entity
   */
  data?: T;

  /**
   * The ID of the created entity
   */
  id?: any;

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Metadata about the operation
   */
  metadata?: {
    /**
     * Execution time in milliseconds
     */
    executionTime: number;

    /**
     * Whether the entity was created
     */
    created: boolean;
  };
}

/**
 * Interface for read results
 */
export interface IReadResult<T = Record<string, unknown>> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * The read entities
   */
  data?: T[];

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Metadata about the operation
   */
  metadata?: {
    /**
     * Total count of entities
     */
    totalCount: number;

    /**
     * Execution time in milliseconds
     */
    executionTime: number;

    /**
     * Whether the result was cached
     */
    cached: boolean;
  };
}

/**
 * Interface for update results
 */
export interface IUpdateResult<T = Record<string, unknown>> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * The updated entity
   */
  data?: T;

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Metadata about the operation
   */
  metadata?: {
    /**
     * Execution time in milliseconds
     */
    executionTime: number;

    /**
     * Whether the entity was updated
     */
    updated: boolean;

    /**
     * Number of affected rows/entities
     */
    affectedCount: number;
  };
}

/**
 * Interface for delete results
 */
export interface IDeleteResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Metadata about the operation
   */
  metadata?: {
    /**
     * Execution time in milliseconds
     */
    executionTime: number;

    /**
     * Whether the entity was deleted
     */
    deleted: boolean;

    /**
     * Number of affected rows/entities
     */
    affectedCount: number;
  };
}

/**
 * Interface for aggregation results
 */
export interface IAggregationResult<T = Record<string, unknown>> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * The aggregation results
   */
  data?: T[];

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Metadata about the operation
   */
  metadata?: {
    /**
     * Execution time in milliseconds
     */
    executionTime: number;

    /**
     * Number of documents processed
     */
    documentsProcessed: number;
  };
}

/**
 * Interface for SQL results
 */
export interface ISQLResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * The query results
   */
  data?: any[];

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Metadata about the operation
   */
  metadata?: {
    /**
     * Execution time in milliseconds
     */
    executionTime: number;

    /**
     * Number of rows affected
     */
    rowsAffected: number;

    /**
     * Last insert ID (if applicable)
     */
    lastInsertId?: any;
  };
}

/**
 * Interface for table schema results
 */
export interface ITableSchemaResult {
  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * The table schema
   */
  schema?: {
    /**
     * Column definitions
     */
    columns: IColumnDefinition[];

    /**
     * Primary key columns
     */
    primaryKeys: string[];

    /**
     * Foreign key relationships
     */
    foreignKeys: IForeignKeyDefinition[];

    /**
     * Indexes
     */
    indexes: IIndexDefinition[];
  };

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];
}

/**
 * Interface for column definitions
 */
export interface IColumnDefinition {
  /**
   * Column name
   */
  name: string;

  /**
   * Column type
   */
  type: string;

  /**
   * Whether the column is nullable
   */
  nullable: boolean;

  /**
   * Default value
   */
  defaultValue?: any;

  /**
   * Whether the column is a primary key
   */
  primaryKey: boolean;

  /**
   * Whether the column auto-increments
   */
  autoIncrement: boolean;
}

/**
 * Interface for foreign key definitions
 */
export interface IForeignKeyDefinition {
  /**
   * Foreign key name
   */
  name: string;

  /**
   * Column name
   */
  column: string;

  /**
   * Referenced table
   */
  referencedTable: string;

  /**
   * Referenced column
   */
  referencedColumn: string;

  /**
   * Update action
   */
  onUpdate?: string;

  /**
   * Delete action
   */
  onDelete?: string;
}

// IIndexDefinition is imported from schema.ts

/**
 * Interface for HTTP request options
 */
export interface IHTTPRequestOptions {
  /**
   * HTTP method
   */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * Request body
   */
  body?: any;

  /**
   * Query parameters
   */
  query?: Record<string, string>;

  /**
   * Timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Interface for HTTP responses
 */
export interface IHTTPResponse<T = Record<string, unknown>> {
  /**
   * Whether the request was successful
   */
  success: boolean;

  /**
   * Response data
   */
  data?: T;

  /**
   * HTTP status code
   */
  statusCode?: number;

  /**
   * Response headers
   */
  headers?: Record<string, string>;

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Metadata about the request
   */
  metadata?: {
    /**
     * Request time in milliseconds
     */
    requestTime: number;

    /**
     * Response size in bytes
     */
    responseSize: number;
  };
}

/**
 * Interface for service capabilities
 */
export interface IServiceCapabilities {
  /**
   * Supported OData versions
   */
  supportedVersions: string[];

  /**
   * Supported query options
   */
  supportedQueryOptions: string[];

  /**
   * Supported functions
   */
  supportedFunctions: string[];

  /**
   * Maximum page size
   */
  maxPageSize?: number;

  /**
   * Whether batch operations are supported
   */
  supportsBatch: boolean;

  /**
   * Whether change tracking is supported
   */
  supportsChangeTracking: boolean;
}

/**
 * Interface for MongoDB collection statistics
 */
export interface IMongoCollectionStats {
  /**
   * Collection name
   */
  name: string;

  /**
   * Number of documents
   */
  count: number;

  /**
   * Collection size in bytes
   */
  size: number;

  /**
   * Average document size
   */
  avgObjSize: number;

  /**
   * Storage size in bytes
   */
  storageSize: number;

  /**
   * Number of indexes
   */
  nindexes: number;

  /**
   * Total index size in bytes
   */
  totalIndexSize: number;
}

/**
 * Interface for SQLite database statistics
 */
export interface ISQLiteDatabaseStats {
  /**
   * Database file size in bytes
   */
  fileSize: number;

  /**
   * Number of tables
   */
  tableCount: number;

  /**
   * Total number of rows across all tables
   */
  totalRows: number;

  /**
   * Database page count
   */
  pageCount: number;

  /**
   * Database page size
   */
  pageSize: number;

  /**
   * Whether the database is read-only
   */
  readOnly: boolean;
}
