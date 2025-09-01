/**
 * Base error interface - single responsibility for error structure
 */
export interface IBaseError {
  /** Unique error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Error severity level */
  severity: 'info' | 'warning' | 'error';
  /** Whether the error is actionable */
  actionable: boolean;
}

/**
 * Validation error interface - single responsibility for validation errors
 */
export interface IValidationError extends IBaseError {
  /** Field that failed validation */
  field: string;
  /** Value that failed validation */
  value: unknown;
  /** Expected type or format */
  expectedType?: string;
  /** Suggestion for fixing the error */
  suggestion?: string;
  /** Validation rule that failed */
  rule?: string;
}

/**
 * Schema error interface - single responsibility for schema-related errors
 */
export interface ISchemaError extends IBaseError {
  /** Entity name */
  entity: string;
  /** Field name */
  field?: string;
  /** Schema validation details */
  details?: Record<string, unknown>;
  /** Migration suggestion */
  migrationSuggestion?: string;
}

/**
 * Query error interface - single responsibility for query-related errors
 */
export interface IQueryError extends IBaseError {
  /** Query that caused the error */
  query?: string;
  /** Query parameters */
  parameters?: Record<string, unknown>;
  /** Query optimization suggestion */
  optimizationSuggestion?: string;
}

/**
 * Connection error interface - single responsibility for connection errors
 */
export interface IConnectionError extends IBaseError {
  /** Connection details */
  connection?: string;
  /** Retry suggestion */
  retrySuggestion?: string;
  /** Alternative connection suggestion */
  alternativeConnection?: string;
}

/**
 * User-friendly error interface - combines all error types
 * This follows ISP by allowing consumers to handle specific error types
 */
export interface IUserFriendlyError extends IBaseError {
  /** Additional context information */
  context?: Record<string, unknown>;
  /** Help URL for more information */
  helpUrl?: string;
  /** Timestamp when error occurred */
  timestamp?: Date;
  /** Validation error details */
  field?: string;
  /** Schema error details */
  details?: Record<string, unknown> | string;
  /** Query error details */
  query?: string;
  /** Connection error details */
  connection?: string;
  /** Suggestion for fixing the error */
  suggestion?: string;
}

/**
 * Error collection interface - single responsibility for managing multiple errors
 */
export interface IErrorCollection {
  /** All errors in the collection */
  errors: IUserFriendlyError[];
  /** Whether the collection has any errors */
  hasErrors: boolean;
  /** Whether the collection has any warnings */
  hasWarnings: boolean;
  /** Get errors by severity */
  getErrorsBySeverity(severity: 'info' | 'warning' | 'error'): IUserFriendlyError[];
  /** Get errors by field */
  getErrorsByField(field: string): IUserFriendlyError[];
  /** Get actionable errors */
  getActionableErrors(): IUserFriendlyError[];
  /** Add an error to the collection */
  addError(error: IUserFriendlyError): void;
  /** Clear all errors */
  clear(): void;
}

/**
 * Error handler interface - single responsibility for error processing
 */
export interface IErrorHandler {
  /**
   * Process an error and convert it to a user-friendly format
   * @param error - The raw error to process
   * @param context - Additional context information
   * @returns User-friendly error
   */
  processError(error: unknown, context?: Record<string, unknown>): IUserFriendlyError;

  /**
   * Validate if an error is recoverable
   * @param error - The error to check
   * @returns True if the error is recoverable
   */
  isRecoverable(error: IUserFriendlyError): boolean;

  /**
   * Get recovery suggestion for an error
   * @param error - The error to get suggestion for
   * @returns Recovery suggestion
   */
  getRecoverySuggestion(error: IUserFriendlyError): string | undefined;
}
