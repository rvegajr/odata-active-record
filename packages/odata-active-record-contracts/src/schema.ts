import type { IUserFriendlyError } from './errors';

/**
 * Field definition interface - single responsibility for field metadata
 */
export interface IFieldDefinition {
  /** Field name */
  name: string;
  /** Field type */
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'json';
  /** Whether the field is nullable */
  nullable?: boolean;
  /** Whether the field is the primary key */
  primary?: boolean;
  /** Whether the field auto-increments */
  autoIncrement?: boolean;
  /** Default value */
  defaultValue?: unknown;
  /** Database field name (for mapping) */
  dbField?: string;
  /** Validation rules */
  validation?: IValidationRule[];
  /** Astro-specific options */
  astro?: {
    searchable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    computed?: boolean;
  };
}

/**
 * Validation rule interface - single responsibility for validation logic
 */
export interface IValidationRule {
  /** Rule name */
  name: string;
  /** Rule type */
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  /** Rule value */
  value?: unknown;
  /** Custom validation function */
  validator?: (value: unknown) => boolean;
  /** Error message */
  message: string;
}

/**
 * Entity schema interface - single responsibility for entity structure
 */
export interface IEntitySchema<T = Record<string, unknown>> {
  /** Entity name */
  name: string;
  /** Entity fields */
  fields: Record<keyof T, IFieldDefinition>;
  /** Entity relations */
  relations?: IRelationDefinition[];
  /** Entity indexes */
  indexes?: IIndexDefinition[];
  /** Computed fields */
  computed?: IComputedFieldDefinition[];
  /** Astro-specific options */
  astro?: {
    ssr?: boolean;
    ssg?: boolean;
    edge?: boolean;
    cache?: 'public' | 'private' | 'no-cache';
    revalidate?: number;
  };
}

/**
 * Relation definition interface - single responsibility for entity relationships
 */
export interface IRelationDefinition {
  /** Relation name */
  name: string;
  /** Source entity */
  sourceEntity: string;
  /** Target entity */
  targetEntity: string;
  /** Source field */
  sourceField: string;
  /** Target field */
  targetField: string;
  /** Relation type */
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  /** Whether the relation is required */
  required?: boolean;
  /** Cascade options */
  cascade?: {
    delete?: boolean;
    update?: boolean;
  };
}

/**
 * Index definition interface - single responsibility for database indexes
 */
export interface IIndexDefinition {
  /** Index name */
  name: string;
  /** Indexed fields/columns */
  fields?: string[];
  columns?: string[];
  /** Index type */
  type?: 'unique' | 'index' | 'fulltext';
  /** Whether the index is unique */
  unique?: boolean;
  /** Index options */
  options?: Record<string, unknown>;
}

/**
 * Computed field definition interface - single responsibility for computed fields
 */
export interface IComputedFieldDefinition {
  /** Computed field name */
  name: string;
  /** Computation expression */
  expression: string;
  /** Result type */
  resultType: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  /** Whether the field is cached */
  cached?: boolean;
  /** Cache TTL in seconds */
  cacheTtl?: number;
}

/**
 * Schema validator interface - single responsibility for schema validation
 */
export interface ISchemaValidator {
  /**
   * Validate an entity schema
   * @param schema - The schema to validate
   * @returns Validation result
   */
  validateSchema<T>(schema: IEntitySchema<T>): IValidationResult;

  /**
   * Validate field definitions
   * @param fields - The fields to validate
   * @returns Validation result
   */
  validateFields(fields: Record<string, IFieldDefinition>): IValidationResult;

  /**
   * Validate relation definitions
   * @param relations - The relations to validate
   * @returns Validation result
   */
  validateRelations(relations: IRelationDefinition[]): IValidationResult;
}

/**
 * Schema manager interface - single responsibility for schema management
 */
export interface ISchemaManager {
  /**
   * Register an entity schema
   * @param namespace - The namespace
   * @param entityName - The entity name
   * @param schema - The schema to register
   */
  registerSchema<T>(namespace: string, entityName: string, schema: IEntitySchema<T>): void;

  /**
   * Get an entity schema
   * @param namespace - The namespace
   * @param entityName - The entity name
   * @returns The entity schema
   */
  getSchema<T>(namespace: string, entityName: string): IEntitySchema<T> | undefined;

  /**
   * List all schemas in a namespace
   * @param namespace - The namespace
   * @returns List of entity names
   */
  listSchemas(namespace: string): string[];

  /**
   * Validate schema drift
   * @param namespace - The namespace
   * @param entityName - The entity name
   * @param actualSchema - The actual database schema
   * @returns Schema drift warnings
   */
  validateSchemaDrift<T>(
    namespace: string, 
    entityName: string, 
    actualSchema: IEntitySchema<T>
  ): ISchemaWarning[];
}

/**
 * Validation result interface - single responsibility for validation results
 */
export interface IValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Validation errors */
  errors: IUserFriendlyError[];
  /** Validation warnings */
  warnings: ISchemaWarning[];
  /** Suggestions for fixing issues */
  suggestions: string[];
}

/**
 * Schema warning interface - single responsibility for schema warnings
 */
export interface ISchemaWarning {
  /** Warning type */
  type: 'field_missing' | 'type_mismatch' | 'deprecated_field' | 'astro_compatibility';
  /** Field name */
  field: string;
  /** Warning message */
  message: string;
  /** Suggestion for fixing the warning */
  suggestion?: string;
  /** Warning severity */
  severity: 'info' | 'warning' | 'error';
  /** Astro-specific warning details */
  astro?: {
    environment?: 'ssr' | 'ssg' | 'edge' | 'client';
    compatibility?: 'full' | 'partial' | 'none';
    workaround?: string;
  };
}
