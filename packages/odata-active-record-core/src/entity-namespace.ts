import { ActiveRecord } from './active-record';
import type {
  IEntitySchema,
  IDataTypeHandler,
  IEntityNamespace,
  IValidationResult,
  IUserFriendlyError,
  ISchemaWarning
} from 'odata-active-record-contracts';

/**
 * EntityNamespace class - Manages a single namespace with multiple entities
 * Provides complete isolation for entities within this namespace
 */
export class EntityNamespace implements IEntityNamespace {
  private entities: Map<string, ActiveRecord<any>> = new Map();
  private schemas: Map<string, IEntitySchema> = new Map();

  constructor(
    private name: string,
    private dataTypeHandler: IDataTypeHandler
  ) {}

  /**
   * Get the name of this namespace
   */
  getName(): string {
    return this.name;
  }

  /**
   * Register an entity within this namespace
   */
  registerEntity<T = Record<string, unknown>>(
    entityName: string,
    schema: IEntitySchema<T>
  ): void {
    // Check if entity already exists
    if (this.entities.has(entityName)) {
      // Entity already exists, don't overwrite
      return;
    }

    // Create new ActiveRecord instance for this entity
    const activeRecord = new ActiveRecord<T>(schema, this.dataTypeHandler);
    
    // Store both the ActiveRecord instance and the schema
    this.entities.set(entityName, activeRecord);
    this.schemas.set(entityName, schema);
  }

  /**
   * Get an entity by name from this namespace
   */
  getEntity<T = Record<string, unknown>>(entityName: string): ActiveRecord<T> | null {
    const entity = this.entities.get(entityName);
    return entity ? (entity as ActiveRecord<T>) : null;
  }

  /**
   * Check if an entity exists in this namespace
   */
  hasEntity(entityName: string): boolean {
    return this.entities.has(entityName);
  }

  /**
   * Get the number of entities registered in this namespace
   */
  getActiveRecordCount(): number {
    return this.entities.size;
  }

  /**
   * List all entity names in this namespace
   */
  listEntities(): string[] {
    return Array.from(this.entities.keys());
  }

  /**
   * Remove an entity from this namespace
   */
  removeEntity(entityName: string): boolean {
    const entityRemoved = this.entities.delete(entityName);
    const schemaRemoved = this.schemas.delete(entityName);
    return entityRemoved || schemaRemoved;
  }

  /**
   * Get all schemas in this namespace
   */
  getSchemas(): Record<string, IEntitySchema> {
    const schemas: Record<string, IEntitySchema> = {};
    for (const [name, schema] of this.schemas.entries()) {
      schemas[name] = schema;
    }
    return schemas;
  }

  /**
   * Validate that all entities in this namespace are compatible
   */
  validateNamespace(): IValidationResult {
    const errors: IUserFriendlyError[] = [];
    const warnings: ISchemaWarning[] = [];
    const suggestions: string[] = [];

    // Check for duplicate entity names (shouldn't happen with our implementation)
    const entityNames = this.listEntities();
    const uniqueNames = new Set(entityNames);
    if (uniqueNames.size !== entityNames.length) {
      errors.push({
        code: 'DUPLICATE_ENTITIES',
        message: 'Duplicate entity names found in namespace',
        suggestion: 'Ensure each entity has a unique name',
        severity: 'error',
        actionable: true
      });
    }

    // Check for schema compatibility
    for (const [entityName, schema] of this.schemas.entries()) {
      if (!schema.name) {
        errors.push({
          code: 'INVALID_SCHEMA',
          message: `Entity '${entityName}' has invalid schema: missing name`,
          suggestion: 'Ensure all schemas have a valid name property',
          severity: 'error',
          actionable: true,
          field: entityName
        });
      }

      if (!schema.fields || Object.keys(schema.fields).length === 0) {
        warnings.push({
          type: 'field_missing',
          field: entityName,
          message: `Entity '${entityName}' has no fields defined`,
          suggestion: 'Consider adding fields to the schema',
          severity: 'warning'
        });
        suggestions.push('Consider adding fields to the schema');
      }
    }

    // Check for potential naming conflicts
    const fieldNames = new Set<string>();
    for (const [entityName, schema] of this.schemas.entries()) {
      for (const fieldName of Object.keys(schema.fields)) {
        if (fieldNames.has(fieldName)) {
          warnings.push({
            type: 'field_missing',
            field: fieldName,
            message: `Field name '${fieldName}' is used in multiple entities`,
            suggestion: 'Consider using unique field names across entities',
            severity: 'warning'
          });
        }
        fieldNames.add(fieldName);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Get statistics about this namespace
   */
  getNamespaceStats(): {
    entityCount: number;
    entities: string[];
    isValid: boolean;
    totalFields: number;
  } {
    const validation = this.validateNamespace();
    let totalFields = 0;

    for (const schema of this.schemas.values()) {
      totalFields += Object.keys(schema.fields).length;
    }

    return {
      entityCount: this.entities.size,
      entities: this.listEntities(),
      isValid: validation.isValid,
      totalFields
    };
  }

  /**
   * Get the data type handler used by this namespace
   */
  getDataTypeHandler(): IDataTypeHandler {
    return this.dataTypeHandler;
  }

  /**
   * Check if this namespace is empty
   */
  isEmpty(): boolean {
    return this.entities.size === 0;
  }

  /**
   * Clear all entities from this namespace
   */
  clear(): void {
    this.entities.clear();
    this.schemas.clear();
  }

  /**
   * Get a copy of all entities in this namespace
   */
  getAllEntities(): Map<string, ActiveRecord> {
    return new Map(this.entities);
  }

  /**
   * Check if this namespace has any validation issues
   */
  hasValidationIssues(): boolean {
    const validation = this.validateNamespace();
    return !validation.isValid || validation.warnings.length > 0;
  }
}
