// Main exports
export { ActiveRecord } from './active-record';
export { EntityNamespace } from './entity-namespace';
export { EntityNamespaceManager } from './entity-namespace-manager';

// Export providers
export { ConnectionPool } from './providers/connection-pool';
export { MongoDBProvider } from './providers/mongodb-provider';
export { SQLiteProvider } from './providers/sqlite-provider';
export { HTTPODataProvider } from './providers/http-odata-provider';

// Export interface generation tools
export { InterfaceGenerator, InterfaceUtils, CLIInterfaceGenerator } from './interface-generator';
export { generateInterfacesFromSchemas, quickGen } from './generate-interfaces';

// Re-export types from contracts for convenience
export type {
  IEntitySchema,
  IDataTypeHandler,
  IUserFriendlyError,
  IQueryResult,
  IQuery,
  IQueryFilter,
  IQuerySelect,
  IQueryOrder,
  IQueryPagination,
  ISchemaWarning,
  IValidationResult,
  ICreateResult,
  IUpdateResult,
  IDeleteResult,
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
} from 'odata-active-record-contracts';
