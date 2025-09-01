import { describe, it, expect, beforeEach } from 'vitest';
import { ActiveRecord } from './active-record';
import type { 
  IEntitySchema, 
  IDataTypeHandler, 
  IUserFriendlyError,
  IQueryResult 
} from 'odata-active-record-contracts';

// Mock schema for testing
interface TestEntity {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
}

const testSchema: IEntitySchema<TestEntity> = {
  name: 'TestEntity',
  fields: {
    id: {
      name: 'id',
      type: 'number',
      primary: true,
      autoIncrement: true
    },
    name: {
      name: 'name',
      type: 'string',
      nullable: false
    },
    email: {
      name: 'email',
      type: 'string',
      nullable: false
    },
    age: {
      name: 'age',
      type: 'number',
      nullable: true
    },
    isActive: {
      name: 'isActive',
      type: 'boolean',
      nullable: false,
      defaultValue: true
    },
    createdAt: {
      name: 'createdAt',
      type: 'date',
      nullable: false,
      defaultValue: () => new Date()
    }
  }
};

// Mock data type handler
class MockDataTypeHandler implements IDataTypeHandler {
  parseDate(value: unknown): Date | null {
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    if (value instanceof Date) return value;
    return null;
  }

  formatDate(date: Date): string {
    return date.toISOString();
  }

  handleTimezone(date: Date): Date {
    return date;
  }

  isValidDate(value: unknown): boolean {
    return this.parseDate(value) !== null;
  }

  parseNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      if (value.trim() === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  handlePrecision(value: number): number {
    return Math.round(value * 100) / 100;
  }

  isValidNumber(value: unknown): boolean {
    return this.parseNumber(value) !== null;
  }

  sanitizeString(value: unknown): string {
    return String(value).trim();
  }

  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  truncateString(value: string, maxLength: number): string {
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  }

  isValidString(value: unknown): boolean {
    return typeof value === 'string' || typeof value === 'number';
  }

  parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  isValidBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === 'false' || lower === '1' || lower === '0' || lower === 'yes' || lower === 'no';
    }
    if (typeof value === 'number') return value === 0 || value === 1;
    return false;
  }

  parseJSON(value: unknown): unknown {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  isValidJSON(value: unknown): boolean {
    return this.parseJSON(value) !== null;
  }

  stringifyJSON(value: unknown): string {
    return JSON.stringify(value);
  }

  validateArray(value: unknown): unknown[] {
    if (Array.isArray(value)) return value;
    return [];
  }

  isValidArray(value: unknown): boolean {
    return Array.isArray(value);
  }

  autoConvert(value: unknown, targetType?: string): unknown {
    if (targetType) {
      switch (targetType) {
        case 'date': return this.parseDate(value);
        case 'number': return this.parseNumber(value);
        case 'boolean': return this.parseBoolean(value);
        case 'json': return this.parseJSON(value);
        case 'array': return this.validateArray(value);
        case 'string': return this.sanitizeString(value);
      }
    }

    if (this.isValidArray(value)) return this.validateArray(value);
    if (this.isValidJSON(value)) return this.parseJSON(value);
    if (this.isValidNumber(value)) return this.parseNumber(value);
    if (this.isValidBoolean(value)) return this.parseBoolean(value);
    if (this.isValidDate(value)) return this.parseDate(value);
    
    return this.sanitizeString(value);
  }
}

describe('ActiveRecord', () => {
  let activeRecord: ActiveRecord<TestEntity>;
  let dataTypeHandler: IDataTypeHandler;

  beforeEach(() => {
    dataTypeHandler = new MockDataTypeHandler();
    activeRecord = new ActiveRecord<TestEntity>(testSchema, dataTypeHandler);
  });

  describe('Basic Query Building', () => {
    it('should build a simple where query', () => {
      const query = activeRecord.where('name', 'eq', 'John');
      expect(query).toBe(activeRecord); // Should return self for chaining
    });

    it('should build a select query', () => {
      const query = activeRecord.select('name', 'email');
      expect(query).toBe(activeRecord);
    });

    it('should build an orderBy query', () => {
      const query = activeRecord.orderBy('name', 'asc');
      expect(query).toBe(activeRecord);
    });

    it('should build a limit query', () => {
      const query = activeRecord.limit(10);
      expect(query).toBe(activeRecord);
    });

    it('should build an offset query', () => {
      const query = activeRecord.offset(5);
      expect(query).toBe(activeRecord);
    });
  });

  describe('Field Validation', () => {
    it('should validate existing fields', () => {
      expect(activeRecord.validateField('name')).toBe(true);
      expect(activeRecord.validateField('email')).toBe(true);
      expect(activeRecord.validateField('age')).toBe(true);
    });

    it('should reject non-existent fields', () => {
      expect(activeRecord.validateField('nonExistent' as keyof TestEntity)).toBe(false);
    });

    it('should get schema correctly', () => {
      const schema = activeRecord.getSchema();
      expect(schema).toBe(testSchema);
    });
  });

  describe('Data Type Handling', () => {
    it('should auto-convert data types when creating', () => {
      const result = activeRecord.create({
        name: 'John Doe',
        email: 'john@example.com',
        age: '25', // String that should be converted to number
        isActive: 'true', // String that should be converted to boolean
        createdAt: '2024-01-01T00:00:00.000Z' // String that should be converted to Date
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(typeof result.data.age).toBe('number');
        expect(typeof result.data.isActive).toBe('boolean');
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should handle validation errors gracefully', () => {
      const result = activeRecord.create({
        name: '', // Empty string should fail validation
        email: 'invalid-email', // Invalid email should fail validation
        age: 'not-a-number' // Invalid number should fail validation
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('Query Execution', () => {
    it('should execute find query and return structured result', async () => {
      const result = await activeRecord.find();
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('metadata');
    });

    it('should execute findOne query', async () => {
      const result = await activeRecord.findOne();
      expect(result).toBeDefined();
    });

    it('should execute count query', async () => {
      const result = await activeRecord.count();
      expect(typeof result).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should return user-friendly errors', async () => {
      const result = await activeRecord.where('invalidField' as keyof TestEntity, 'eq', 'value').find();
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      if (result.errors) {
        expect(result.errors[0]).toHaveProperty('message');
        expect(result.errors[0]).toHaveProperty('code');
        expect(result.errors[0]).toHaveProperty('suggestion');
      }
    });

    it('should provide actionable error messages', async () => {
      const result = await activeRecord.where('name', 'invalidOperator', 'value').find();
      
      expect(result.success).toBe(false);
      if (result.errors) {
        const error = result.errors[0];
        expect(error.message).toContain('invalid');
        expect(error.actionable).toBe(true);
      }
    });
  });

  describe('Schema Warnings', () => {
    it('should detect schema drift and provide warnings', () => {
      const warnings = activeRecord.getWarnings();
      expect(Array.isArray(warnings)).toBe(true);
    });
  });
});
