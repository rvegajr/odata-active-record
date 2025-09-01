import { EntityNamespace } from './entity-namespace';
import type {
  IDataTypeHandler,
  IEntityNamespaceManager,
  IEntityNamespace,
  IValidationResult,
  INamespaceStats,
  IUserFriendlyError,
  ISchemaWarning
} from 'odata-active-record-contracts';

/**
 * EntityNamespaceManager class - Manages multiple independent entity namespaces
 * Provides complete isolation between different OData endpoints
 */
export class EntityNamespaceManager implements IEntityNamespaceManager {
  private namespaces: Map<string, EntityNamespace> = new Map();

  constructor(private dataTypeHandler: IDataTypeHandler) {}

  /**
   * Create a new entity namespace
   */
  createNamespace(name: string): IEntityNamespace {
    // Check if namespace already exists
    if (this.namespaces.has(name)) {
      return this.namespaces.get(name)!;
    }

    // Create new namespace
    const namespace = new EntityNamespace(name, this.dataTypeHandler);
    this.namespaces.set(name, namespace);
    
    return namespace;
  }

  /**
   * Get an existing namespace by name
   */
  getNamespace(name: string): IEntityNamespace | null {
    return this.namespaces.get(name) || null;
  }

  /**
   * Check if a namespace exists
   */
  hasNamespace(name: string): boolean {
    return this.namespaces.has(name);
  }

  /**
   * List all namespace names
   */
  listNamespaces(): string[] {
    return Array.from(this.namespaces.keys());
  }

  /**
   * Remove a namespace and all its entities
   */
  removeNamespace(name: string): boolean {
    return this.namespaces.delete(name);
  }

  /**
   * Get the data type handler used by this manager
   */
  getDataTypeHandler(): IDataTypeHandler {
    return this.dataTypeHandler;
  }

  /**
   * Validate all namespaces for consistency
   */
  validateAllNamespaces(): IValidationResult {
    const errors: IUserFriendlyError[] = [];
    const warnings: ISchemaWarning[] = [];
    const suggestions: string[] = [];

    // Check for duplicate namespace names (shouldn't happen with our implementation)
    const namespaceNames = this.listNamespaces();
    const uniqueNames = new Set(namespaceNames);
    if (uniqueNames.size !== namespaceNames.length) {
      errors.push({
        code: 'DUPLICATE_NAMESPACES',
        message: 'Duplicate namespace names found',
        suggestion: 'Ensure each namespace has a unique name',
        severity: 'error',
        actionable: true
      });
    }

    // Validate each namespace individually
    for (const [namespaceName, namespace] of this.namespaces.entries()) {
      const namespaceValidation = namespace.validateNamespace();
      
      // Add namespace-specific errors
      for (const error of namespaceValidation.errors) {
        errors.push({
          ...error,
          context: {
            ...error.context,
            namespace: namespaceName
          }
        });
      }

      // Add namespace-specific warnings
      for (const warning of namespaceValidation.warnings) {
        warnings.push({
          type: 'field_missing',
          field: '',
          message: `[${namespaceName}] ${warning.message || warning}`,
          suggestion: warning.suggestion || '',
          severity: warning.severity || 'warning'
        });
      }

      // Add namespace-specific suggestions
      for (const suggestion of namespaceValidation.suggestions) {
        suggestions.push(`[${namespaceName}] ${suggestion}`);
      }
    }

    // Check for potential cross-namespace conflicts
    const allEntityNames = new Set<string>();
    const entityNamespaceMap = new Map<string, string>();

    for (const [namespaceName, namespace] of this.namespaces.entries()) {
      for (const entityName of namespace.listEntities()) {
        if (allEntityNames.has(entityName)) {
          const conflictingNamespace = entityNamespaceMap.get(entityName);
          warnings.push({
            type: 'field_missing',
            field: entityName,
            message: `Entity '${entityName}' exists in both '${namespaceName}' and '${conflictingNamespace}' namespaces`,
            suggestion: `Consider using fully qualified names (e.g., '${namespaceName}.${entityName}') to avoid conflicts`,
            severity: 'warning'
          });
          suggestions.push(
            `Consider using fully qualified names (e.g., '${namespaceName}.${entityName}') to avoid conflicts`
          );
        } else {
          allEntityNames.add(entityName);
          entityNamespaceMap.set(entityName, namespaceName);
        }
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
   * Get statistics about all namespaces
   */
  getNamespaceStats(): INamespaceStats {
    const namespaces: Record<string, {
      entityCount: number;
      entities: string[];
      isValid: boolean;
    }> = {};

    let totalEntities = 0;

    for (const [namespaceName, namespace] of this.namespaces.entries()) {
      const stats = namespace.getNamespaceStats();
      totalEntities += stats.entityCount;

      namespaces[namespaceName] = {
        entityCount: stats.entityCount,
        entities: stats.entities,
        isValid: stats.isValid
      };
    }

    return {
      totalNamespaces: this.namespaces.size,
      totalEntities,
      namespaces
    };
  }

  /**
   * Get all namespaces as a Map
   */
  getAllNamespaces(): Map<string, EntityNamespace> {
    return new Map(this.namespaces);
  }

  /**
   * Check if this manager has any namespaces
   */
  isEmpty(): boolean {
    return this.namespaces.size === 0;
  }

  /**
   * Clear all namespaces
   */
  clear(): void {
    this.namespaces.clear();
  }

  /**
   * Get a namespace by name, creating it if it doesn't exist
   */
  getOrCreateNamespace(name: string): IEntityNamespace {
    return this.getNamespace(name) || this.createNamespace(name);
  }

  /**
   * Check if any namespace has validation issues
   */
  hasValidationIssues(): boolean {
    const validation = this.validateAllNamespaces();
    return !validation.isValid || validation.warnings.length > 0;
  }

  /**
   * Get all entities across all namespaces
   */
  getAllEntities(): Map<string, Map<string, any>> {
    const allEntities = new Map<string, Map<string, any>>();
    
    for (const [namespaceName, namespace] of this.namespaces.entries()) {
      allEntities.set(namespaceName, namespace.getAllEntities());
    }
    
    return allEntities;
  }

  /**
   * Find which namespace contains a specific entity
   */
  findEntityNamespace(entityName: string): string | null {
    for (const [namespaceName, namespace] of this.namespaces.entries()) {
      if (namespace.hasEntity(entityName)) {
        return namespaceName;
      }
    }
    return null;
  }

  /**
   * Get all entity names across all namespaces
   */
  getAllEntityNames(): string[] {
    const allEntityNames: string[] = [];
    
    for (const namespace of this.namespaces.values()) {
      allEntityNames.push(...namespace.listEntities());
    }
    
    return allEntityNames;
  }

  /**
   * Check if an entity exists in any namespace
   */
  hasEntity(entityName: string): boolean {
    return this.findEntityNamespace(entityName) !== null;
  }

  /**
   * Get an entity from any namespace by name
   */
  getEntity(entityName: string): any | null {
    const namespaceName = this.findEntityNamespace(entityName);
    if (namespaceName) {
      const namespace = this.namespaces.get(namespaceName);
      return namespace?.getEntity(entityName) || null;
    }
    return null;
  }
}
