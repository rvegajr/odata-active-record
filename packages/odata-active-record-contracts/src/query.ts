import type { IUserFriendlyError } from './errors';
import type { ISchemaWarning } from './schema';

/**
 * Query filter interface - single responsibility for filtering operations
 */
export interface IQueryFilter {
  /** Field to filter on */
  field: string;
  /** Filter operator */
  operator: 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge' | 'in' | 'contains' | 'startswith' | 'endswith';
  /** Filter value */
  value: unknown;
  /** Logical operator for combining filters */
  logicalOperator?: 'and' | 'or';
  /** Child filters for complex conditions */
  children?: IQueryFilter[];
}

/**
 * Query select interface - single responsibility for field selection
 */
export interface IQuerySelect {
  /** Fields to select */
  fields: string[];
  /** Whether to exclude specified fields */
  exclude?: boolean;
}

/**
 * Query order interface - single responsibility for ordering operations
 */
export interface IQueryOrder {
  /** Field to order by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Query pagination interface - single responsibility for pagination
 */
export interface IQueryPagination {
  /** Number of records to skip */
  skip?: number;
  /** Number of records to take */
  take?: number;
  /** Maximum number of records allowed */
  maxTake?: number;
}

/**
 * Query expand interface - single responsibility for relationship expansion
 */
export interface IQueryExpand {
  /** Relation to expand */
  relation: string;
  /** Nested query for expanded relation */
  nestedQuery?: IQueryBuilder;
  /** Whether to expand as single object or array */
  single?: boolean;
}

/**
 * Query builder interface - single responsibility for building queries
 */
export interface IQueryBuilder<T = Record<string, unknown>> {
  /**
   * Add a filter condition
   * @param field - Field to filter on
   * @param operator - Filter operator
   * @param value - Filter value
   * @returns Query builder for chaining
   */
  where(field: keyof T, operator: string, value: unknown): IQueryBuilder<T>;

  /**
   * Add an AND filter condition
   * @param field - Field to filter on
   * @param operator - Filter operator
   * @param value - Filter value
   * @returns Query builder for chaining
   */
  andWhere(field: keyof T, operator: string, value: unknown): IQueryBuilder<T>;

  /**
   * Add an OR filter condition
   * @param field - Field to filter on
   * @param operator - Filter operator
   * @param value - Filter value
   * @returns Query builder for chaining
   */
  orWhere(field: keyof T, operator: string, value: unknown): IQueryBuilder<T>;

  /**
   * Select specific fields
   * @param fields - Fields to select
   * @returns Query builder for chaining
   */
  select(...fields: (keyof T)[]): IQueryBuilder<T>;

  /**
   * Order by a field
   * @param field - Field to order by
   * @param direction - Sort direction
   * @returns Query builder for chaining
   */
  orderBy(field: keyof T, direction?: 'asc' | 'desc'): IQueryBuilder<T>;

  /**
   * Limit the number of results
   * @param count - Number of records to take
   * @returns Query builder for chaining
   */
  limit(count: number): IQueryBuilder<T>;

  /**
   * Skip a number of results
   * @param count - Number of records to skip
   * @returns Query builder for chaining
   */
  offset(count: number): IQueryBuilder<T>;

  /**
   * Expand a relationship
   * @param relation - Relation to expand
   * @param callback - Optional callback for nested query
   * @returns Query builder for chaining
   */
  expand(relation: string, callback?: (query: IQueryBuilder) => void): IQueryBuilder<T>;

  /**
   * Get the built query
   * @returns The built query object
   */
  build(): IQuery;
}

/**
 * Query interface - single responsibility for query structure
 */
export interface IQuery {
  /** Query filters */
  filter?: IQueryFilter;
  /** Query selection */
  select?: IQuerySelect;
  /** Query ordering */
  orderBy?: IQueryOrder[];
  /** Query pagination */
  pagination?: IQueryPagination;
  /** Query expansions */
  expand?: IQueryExpand[];
  /** Whether to include count */
  count?: boolean;
  /** Search term */
  search?: string;
}

/**
 * Query executor interface - single responsibility for query execution
 */
export interface IQueryExecutor<T = Record<string, unknown>> {
  /**
   * Execute a query and return results
   * @param query - The query to execute
   * @returns Query result
   */
  execute(query: IQuery): Promise<IQueryResult<T>>;

  /**
   * Execute a query and return a single result
   * @param query - The query to execute
   * @returns Single result or null
   */
  executeOne(query: IQuery): Promise<T | null>;

  /**
   * Execute a count query
   * @param query - The query to execute
   * @returns Count result
   */
  executeCount(query: IQuery): Promise<number>;
}

/**
 * Query result interface - single responsibility for query results
 */
export interface IQueryResult<T = Record<string, unknown>> {
  /** Query data */
  data: T[];
  /** Whether the query was successful */
  success: boolean;
  /** Query errors */
  errors?: IUserFriendlyError[];
  /** Query warnings */
  warnings?: ISchemaWarning[];
  /** Query metadata */
  metadata: {
    /** Number of records returned */
    count: number;
    /** Total number of records available */
    totalCount?: number;
    /** Query execution time in milliseconds */
    executionTime: number;
    /** Cache status */
    cacheStatus: 'hit' | 'miss' | 'stale';
    /** Whether there are more results */
    hasMore?: boolean;
    /** Next page token */
    nextPageToken?: string;
  };
}

/**
 * Query optimizer interface - single responsibility for query optimization
 */
export interface IQueryOptimizer {
  /**
   * Optimize a query for better performance
   * @param query - The query to optimize
   * @returns Optimized query
   */
  optimize(query: IQuery): IQuery;

  /**
   * Validate if a query is optimized
   * @param query - The query to validate
   * @returns Optimization suggestions
   */
  getOptimizationSuggestions(query: IQuery): string[];
}

/**
 * Query cache interface - single responsibility for query caching
 */
export interface IQueryCache {
  /**
   * Get cached query result
   * @param query - The query to get from cache
   * @returns Cached result or null
   */
  get(query: IQuery): IQueryResult | null;

  /**
   * Set query result in cache
   * @param query - The query to cache
   * @param result - The result to cache
   * @param ttl - Time to live in seconds
   */
  set(query: IQuery, result: IQueryResult, ttl?: number): void;

  /**
   * Invalidate cache for a query
   * @param query - The query to invalidate
   */
  invalidate(query: IQuery): void;

  /**
   * Clear all cache
   */
  clear(): void;
}
