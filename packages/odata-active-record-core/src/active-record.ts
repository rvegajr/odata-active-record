import type {
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
  IDeleteResult
} from 'odata-active-record-contracts';

/**
 * ActiveRecord class - The main class for OData Active Record pattern
 * Provides fluent query interface with seamless data type handling
 */
export class ActiveRecord<T = Record<string, unknown>> {
  private query: IQuery = {};
  private warnings: ISchemaWarning[] = [];
  private errors: IUserFriendlyError[] = [];

  constructor(
    private schema: IEntitySchema<T>,
    private dataTypeHandler: IDataTypeHandler
  ) {}

  /**
   * Add a where condition to the query
   */
  where(field: keyof T, operator: string, value: unknown): this {
    if (!this.validateField(field)) {
      this.addError({
        code: 'INVALID_FIELD',
        message: `Field '${String(field)}' does not exist in schema`,
        suggestion: `Available fields: ${Object.keys(this.schema.fields).join(', ')}`,
        severity: 'error',
        actionable: true,
        field: String(field)
      });
      return this;
    }

    // Validate operator
    const validOperators = ['eq', 'ne', 'lt', 'le', 'gt', 'ge', 'in', 'contains', 'startswith', 'endswith'];
    if (!validOperators.includes(operator)) {
      this.addError({
        code: 'INVALID_OPERATOR',
        message: `Invalid operator '${operator}'`,
        suggestion: `Valid operators: ${validOperators.join(', ')}`,
        severity: 'error',
        actionable: true
      });
      return this;
    }

    // Auto-convert value based on field type
    const fieldDef = this.schema.fields[field];
    const convertedValue = this.dataTypeHandler.autoConvert(value, fieldDef.type);

    const filter: IQueryFilter = {
      field: String(field),
      operator: operator as any,
      value: convertedValue
    };

    if (!this.query.filter) {
      this.query.filter = filter;
    } else {
      // Combine with existing filter using AND
      this.query.filter = {
        field: '',
        operator: 'eq',
        value: null,
        logicalOperator: 'and',
        children: [this.query.filter, filter]
      };
    }

    return this;
  }

  /**
   * Select specific fields
   */
  select(...fields: (keyof T)[]): this {
    // Validate all fields exist
    const invalidFields = fields.filter(field => !this.validateField(field));
    if (invalidFields.length > 0) {
      this.addError({
        code: 'INVALID_FIELDS',
        message: `Invalid fields: ${invalidFields.join(', ')}`,
        suggestion: `Available fields: ${Object.keys(this.schema.fields).join(', ')}`,
        severity: 'error',
        actionable: true
      });
      return this;
    }

    this.query.select = {
      fields: fields.map(f => String(f)),
      exclude: false
    };

    return this;
  }

  /**
   * Order by a field
   */
  orderBy(field: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
    if (!this.validateField(field)) {
      this.addError({
        code: 'INVALID_FIELD',
        message: `Field '${String(field)}' does not exist in schema`,
        suggestion: `Available fields: ${Object.keys(this.schema.fields).join(', ')}`,
        severity: 'error',
        actionable: true,
        field: String(field)
      });
      return this;
    }

    const order: IQueryOrder = {
      field: String(field),
      direction
    };

    if (!this.query.orderBy) {
      this.query.orderBy = [];
    }
    this.query.orderBy.push(order);

    return this;
  }

  /**
   * Limit the number of results
   */
  limit(count: number): this {
    if (!this.query.pagination) {
      this.query.pagination = {};
    }
    this.query.pagination.take = count;
    return this;
  }

  /**
   * Skip a number of results
   */
  offset(count: number): this {
    if (!this.query.pagination) {
      this.query.pagination = {};
    }
    this.query.pagination.skip = count;
    return this;
  }

  /**
   * Expand a relationship
   */
  expand(relation: string, callback?: (query: ActiveRecord<any>) => void): this {
    if (!this.query.expand) {
      this.query.expand = [];
    }

    const expandQuery = {
      relation,
      single: false
    };

    if (callback) {
      // Create a new ActiveRecord instance for the nested query
      const nestedActiveRecord = new ActiveRecord({} as any, this.dataTypeHandler);
      callback(nestedActiveRecord);
      // Note: In a real implementation, we would need to return the ActiveRecord instance itself
      // as it implements IQueryBuilder, but for now we'll omit the nestedQuery property
    }

    this.query.expand.push(expandQuery);
    return this;
  }

  /**
   * Execute the query and return results
   */
  async find(): Promise<IQueryResult<T>> {
    try {
      // For now, return a mock result
      // In a real implementation, this would execute against a database
      const mockData: T[] = [];
      const executionTime = Math.random() * 100; // Mock execution time

      return {
        data: mockData,
        success: this.errors.length === 0,
        errors: this.errors.length > 0 ? this.errors : [],
        warnings: this.warnings.length > 0 ? this.warnings : [],
        metadata: {
          count: mockData.length,
          executionTime,
          cacheStatus: 'miss' as const
        }
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        errors: [this.createUserFriendlyError(error as Error)],
        metadata: {
          count: 0,
          executionTime: 0,
          cacheStatus: 'miss' as const
        }
      };
    }
  }

  /**
   * Execute the query and return a single result
   */
  async findOne(): Promise<T | null> {
    const result = await this.find();
    if (result.success && result.data.length > 0) {
      return result.data[0] || null;
    }
    return null;
  }

  /**
   * Execute a count query
   */
  async count(): Promise<number> {
    const result = await this.find();
    return result.metadata.count;
  }

  /**
   * Create a new entity
   */
  create(data: Partial<T>): ICreateResult<T> {
    try {
      const convertedData = this.convertDataTypes(data);
      const validationResult = this.validateData(convertedData);

      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
          metadata: {
            created: false,
            executionTime: 0
          }
        };
      }

      // Mock creation - in real implementation, this would save to database
      const createdEntity = {
        ...convertedData,
        id: Math.floor(Math.random() * 1000000) // Mock ID
      } as T;

      return {
        data: createdEntity,
        id: (createdEntity as any).id,
        success: true,
        metadata: {
          created: true,
          executionTime: Math.random() * 50
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [this.createUserFriendlyError(error as Error)],
        metadata: {
          created: false,
          executionTime: 0
        }
      };
    }
  }

  /**
   * Update an entity
   */
  update(id: any, data: Partial<T>): IUpdateResult<T> {
    try {
      const convertedData = this.convertDataTypes(data);
      const validationResult = this.validateData(convertedData);

      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
          metadata: {
            updated: false,
            affectedCount: 0,
            executionTime: 0
          }
        };
      }

      // Mock update - in real implementation, this would update in database
      const updatedEntity = {
        id,
        ...convertedData
      } as T;

      return {
        data: updatedEntity,
        success: true,

        metadata: {
          updated: true,
          affectedCount: 1,
          executionTime: Math.random() * 50
        }
      };
    } catch (error) {
              return {
          success: false,
          errors: [this.createUserFriendlyError(error as Error)],
                  metadata: {
          updated: false,
          affectedCount: 0,
          executionTime: 0
        }
        };
    }
  }

  /**
   * Delete an entity
   */
  delete(id: any): IDeleteResult {
    try {
      // Mock deletion - in real implementation, this would delete from database
      return {
        success: true,
        metadata: {
          deleted: true,
          affectedCount: 1,
          executionTime: Math.random() * 30
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [this.createUserFriendlyError(error as Error)],
        metadata: {
          deleted: false,
          affectedCount: 0,
          executionTime: 0
        }
      };
    }
  }

  /**
   * Validate if a field exists in the schema
   */
  validateField(field: keyof T): boolean {
    return field in this.schema.fields;
  }

  /**
   * Get the schema
   */
  getSchema(): IEntitySchema<T> {
    return this.schema;
  }

  /**
   * Get warnings
   */
  getWarnings(): ISchemaWarning[] {
    return this.warnings;
  }

  /**
   * Get the built query
   */
  buildQuery(): IQuery {
    return this.query;
  }

  /**
   * Convert data types based on schema
   */
  private convertDataTypes(data: Partial<T>): Partial<T> {
    const converted: Partial<T> = {};

    for (const [key, value] of Object.entries(data)) {
      const fieldDef = this.schema.fields[key as keyof T];
      if (fieldDef) {
        const convertedValue = this.dataTypeHandler.autoConvert(value, fieldDef.type);
        (converted as any)[key] = convertedValue;
      }
    }

    return converted;
  }

  /**
   * Validate data against schema
   */
  private validateData(data: Partial<T>): IValidationResult {
    const errors: IUserFriendlyError[] = [];
    const warnings: ISchemaWarning[] = [];

    for (const [key, value] of Object.entries(data)) {
      const fieldDef = this.schema.fields[key as keyof T];
      if (!fieldDef) {
        errors.push({
          code: 'INVALID_FIELD',
          message: `Field '${key}' does not exist in schema`,
          suggestion: `Available fields: ${Object.keys(this.schema.fields).join(', ')}`,
          severity: 'error',
          actionable: true,
          field: key
        });
        continue;
      }

      // Check required fields
      if (!fieldDef.nullable && (value === null || value === undefined || value === '')) {
        errors.push({
          code: 'REQUIRED_FIELD',
          message: `Field '${key}' is required`,
          suggestion: `Provide a value for the ${key} field`,
          severity: 'error',
          actionable: true,
          field: key
        });
      }

      // Check email validation
      if (fieldDef.type === 'string' && key.toLowerCase().includes('email')) {
        if (typeof value === 'string' && !this.dataTypeHandler.validateEmail(value)) {
          errors.push({
            code: 'INVALID_EMAIL',
            message: `Invalid email format for field '${key}'`,
            suggestion: 'Please provide a valid email address',
            severity: 'error',
            actionable: true,
            field: key
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions: errors.map(e => e.suggestion).filter(Boolean) as string[]
    };
  }

  /**
   * Add an error to the error collection
   */
  private addError(error: IUserFriendlyError): void {
    this.errors.push(error);
  }

  /**
   * Create a user-friendly error from a raw error
   */
  private createUserFriendlyError(error: Error): IUserFriendlyError {
    return {
      code: 'INTERNAL_ERROR',
      message: error.message,
      suggestion: 'Please try again or contact support if the problem persists',
      severity: 'error',
      actionable: false,
      context: {
        errorType: error.constructor.name,
        stack: error.stack
      }
    };
  }
}
