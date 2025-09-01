// Data Type Interfaces
export type {
  IDateHandler,
  INumberHandler,
  IStringHandler,
  IBooleanHandler,
  IJsonHandler,
  IArrayHandler,
  IDataTypeHandler
} from './data-types';

// Error Handling Interfaces
export type {
  IBaseError,
  IValidationError,
  ISchemaError,
  IQueryError,
  IConnectionError,
  IUserFriendlyError,
  IErrorCollection,
  IErrorHandler
} from './errors';

// Schema Interfaces
export type {
  IFieldDefinition,
  IValidationRule,
  IEntitySchema,
  IRelationDefinition,
  IIndexDefinition,
  IComputedFieldDefinition,
  ISchemaValidator,
  ISchemaManager,
  IValidationResult,
  ISchemaWarning
} from './schema';

// Query Interfaces
export type {
  IQueryFilter,
  IQuerySelect,
  IQueryOrder,
  IQueryPagination,
  IQueryExpand,
  IQueryBuilder,
  IQuery,
  IQueryExecutor,
  IQueryResult,
  IQueryOptimizer,
  IQueryCache
} from './query';

// Entity Namespace Interfaces
export type {
  IEntityNamespace,
  IEntityNamespaceManager,
  ICrossEntityOperations,
  ICrossEntityQuery,
  IEntityRelationship,
  ICrossEntityFilter,
  ICrossEntityOrder,
  ICrossEntityPagination,
  ICrossEntityResult,
  ITransactionOperation,
  ITransactionResult,
  ITransactionOperationResult,
  INamespaceStats
} from './entity-namespace';

// Provider Interfaces
export type {
  IDataProvider,
  IODataProvider,
  ICrudProvider,
  IMongoDBProvider,
  ISQLiteProvider,
  IHTTPODataProvider,
  ITransactionHandle,
  IConnectionResult,
  IConnectionStats,
  IConnectionConfig,
  IConnectionPool,
  IEntityMetadataResult,
  IServiceDocumentResult,
  IMetadataDocumentResult,
  ICreateResult,
  IReadResult,
  IUpdateResult,
  IDeleteResult,
  IAggregationResult,
  ISQLResult,
  ITableSchemaResult,
  IColumnDefinition,
  IForeignKeyDefinition,
  IHTTPRequestOptions,
  IHTTPResponse,
  IServiceCapabilities,
  IMongoCollectionStats,
  ISQLiteDatabaseStats
} from './providers';

// Astro Integration Interfaces
export type {
  IAstroConfig,
  IAstroContext,
  IAstroApiHandler,
  IAstroMiddleware,
  IAstroODataService,
  IAstroApiRouteBuilder,
  IAstroSSRIntegration,
  IAstroEdgeIntegration,
  IAstroCache,
  IAstroErrorHandler,
  IAstroRequestUtils,
  IAstroConfigValidator,
  IAstroPerformanceMonitor
} from './astro-integration';

// Re-export commonly used types for convenience
export type { IUserFriendlyError as UserFriendlyError } from './errors';
export type { IEntitySchema as EntitySchema } from './schema';
export type { IQueryResult as QueryResult } from './query';
