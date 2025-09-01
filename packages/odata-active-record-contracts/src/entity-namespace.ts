import type { IEntitySchema, ISchemaWarning } from './schema';
import type { IQueryResult } from './query';
import type { IUserFriendlyError } from './errors';
import type { IDataTypeHandler } from './data-types';

/**
 * Interface for managing a single entity namespace
 * Each namespace contains multiple entities and provides complete isolation
 */
export interface IEntityNamespace {
  /**
   * Get the name of this namespace
   */
  getName(): string;

  /**
   * Register an entity within this namespace
   */
  registerEntity<T = Record<string, unknown>>(
    entityName: string, 
    schema: IEntitySchema<T>
  ): void;

  /**
   * Get an entity by name from this namespace
   */
  getEntity<T = Record<string, unknown>>(entityName: string): any | null;

  /**
   * Check if an entity exists in this namespace
   */
  hasEntity(entityName: string): boolean;

  /**
   * Get the number of entities registered in this namespace
   */
  getActiveRecordCount(): number;

  /**
   * List all entity names in this namespace
   */
  listEntities(): string[];

  /**
   * Remove an entity from this namespace
   */
  removeEntity(entityName: string): boolean;

  /**
   * Get all schemas in this namespace
   */
  getSchemas(): Record<string, IEntitySchema>;

  /**
   * Validate that all entities in this namespace are compatible
   */
  validateNamespace(): IValidationResult;
}

/**
 * Interface for managing multiple entity namespaces
 * Provides complete isolation between different OData endpoints
 */
export interface IEntityNamespaceManager {
  /**
   * Create a new entity namespace
   */
  createNamespace(name: string): IEntityNamespace;

  /**
   * Get an existing namespace by name
   */
  getNamespace(name: string): IEntityNamespace | null;

  /**
   * Check if a namespace exists
   */
  hasNamespace(name: string): boolean;

  /**
   * List all namespace names
   */
  listNamespaces(): string[];

  /**
   * Remove a namespace and all its entities
   */
  removeNamespace(name: string): boolean;

  /**
   * Get the data type handler used by this manager
   */
  getDataTypeHandler(): IDataTypeHandler;

  /**
   * Validate all namespaces for consistency
   */
  validateAllNamespaces(): IValidationResult;

  /**
   * Get statistics about all namespaces
   */
  getNamespaceStats(): INamespaceStats;
}

/**
 * Interface for cross-entity operations within a namespace
 */
export interface ICrossEntityOperations {
  /**
   * Execute a query that spans multiple entities in the same namespace
   */
  executeCrossEntityQuery<T = Record<string, unknown>>(
    query: ICrossEntityQuery
  ): Promise<ICrossEntityResult<T>>;

  /**
   * Get related entities based on foreign key relationships
   */
  getRelatedEntities<T = Record<string, unknown>>(
    sourceEntity: string,
    sourceId: any,
    targetEntity: string,
    relationship: IEntityRelationship
  ): Promise<IQueryResult<T>>;

  /**
   * Execute a transaction across multiple entities
   */
  executeTransaction<T = Record<string, unknown>>(
    operations: ITransactionOperation[]
  ): Promise<ITransactionResult<T>>;
}

/**
 * Interface for cross-entity queries
 */
export interface ICrossEntityQuery {
  /**
   * The entities involved in this query
   */
  entities: string[];

  /**
   * The relationships between entities
   */
  relationships: IEntityRelationship[];

  /**
   * The filters to apply
   */
  filters?: ICrossEntityFilter[];

  /**
   * The fields to select from each entity
   */
  selects?: Record<string, string[]>;

  /**
   * The ordering for the results
   */
  orderBy?: ICrossEntityOrder[];

  /**
   * Pagination settings
   */
  pagination?: ICrossEntityPagination;
}

/**
 * Interface for entity relationships
 */
export interface IEntityRelationship {
  /**
   * The source entity name
   */
  sourceEntity: string;

  /**
   * The target entity name
   */
  targetEntity: string;

  /**
   * The foreign key field in the source entity
   */
  foreignKey: string;

  /**
   * The primary key field in the target entity
   */
  primaryKey: string;

  /**
   * The type of relationship
   */
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';

  /**
   * Whether this relationship is required
   */
  required: boolean;
}

/**
 * Interface for cross-entity filters
 */
export interface ICrossEntityFilter {
  /**
   * The entity this filter applies to
   */
  entity: string;

  /**
   * The field to filter on
   */
  field: string;

  /**
   * The operator to use
   */
  operator: string;

  /**
   * The value to filter by
   */
  value: unknown;
}

/**
 * Interface for cross-entity ordering
 */
export interface ICrossEntityOrder {
  /**
   * The entity this order applies to
   */
  entity: string;

  /**
   * The field to order by
   */
  field: string;

  /**
   * The direction to order in
   */
  direction: 'asc' | 'desc';
}

/**
 * Interface for cross-entity pagination
 */
export interface ICrossEntityPagination {
  /**
   * The number of results to take
   */
  take: number;

  /**
   * The number of results to skip
   */
  skip: number;
}

/**
 * Interface for cross-entity query results
 */
export interface ICrossEntityResult<T = Record<string, unknown>> {
  /**
   * The query results organized by entity
   */
  data: Record<string, T[]>;

  /**
   * Whether the query was successful
   */
  success: boolean;

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Any warnings that occurred
   */
  warnings?: string[];

  /**
   * Metadata about the query execution
   */
  metadata: {
    /**
     * The total count of results
     */
    totalCount: number;

    /**
     * The execution time in milliseconds
     */
    executionTime: number;

    /**
     * The entities involved in the query
     */
    entities: string[];
  };
}

/**
 * Interface for transaction operations
 */
export interface ITransactionOperation {
  /**
   * The type of operation
   */
  type: 'create' | 'update' | 'delete';

  /**
   * The entity to operate on
   */
  entity: string;

  /**
   * The data for the operation
   */
  data?: Record<string, unknown>;

  /**
   * The ID for update/delete operations
   */
  id?: any;
}

/**
 * Interface for transaction results
 */
export interface ITransactionResult<T = Record<string, unknown>> {
  /**
   * Whether the transaction was successful
   */
  success: boolean;

  /**
   * The results of each operation
   */
  results: ITransactionOperationResult<T>[];

  /**
   * Any errors that occurred
   */
  errors?: IUserFriendlyError[];

  /**
   * Metadata about the transaction
   */
  metadata: {
    /**
     * The number of operations performed
     */
    operationCount: number;

    /**
     * The execution time in milliseconds
     */
    executionTime: number;

    /**
     * Whether the transaction was rolled back
     */
    rolledBack: boolean;
  };
}

/**
 * Interface for individual transaction operation results
 */
export interface ITransactionOperationResult<T = Record<string, unknown>> {
  /**
   * The operation that was performed
   */
  operation: ITransactionOperation;

  /**
   * Whether this operation was successful
   */
  success: boolean;

  /**
   * The result data
   */
  data?: T;

  /**
   * Any errors that occurred for this operation
   */
  errors?: IUserFriendlyError[];
}

/**
 * Interface for validation results
 */
export interface IValidationResult {
  /**
   * Whether the validation passed
   */
  isValid: boolean;

  /**
   * Any errors found during validation
   */
  errors: IUserFriendlyError[];

  /**
   * Any warnings found during validation
   */
  warnings: (ISchemaWarning | string)[];

  /**
   * Suggestions for fixing validation issues
   */
  suggestions: string[];
}

/**
 * Interface for namespace statistics
 */
export interface INamespaceStats {
  /**
   * The total number of namespaces
   */
  totalNamespaces: number;

  /**
   * The total number of entities across all namespaces
   */
  totalEntities: number;

  /**
   * Statistics for each namespace
   */
  namespaces: Record<string, {
    /**
     * The number of entities in this namespace
     */
    entityCount: number;

    /**
     * The names of entities in this namespace
     */
    entities: string[];

    /**
     * Whether this namespace is valid
     */
    isValid: boolean;
  }>;
}
