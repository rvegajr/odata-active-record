import { describe, it, expect, beforeEach } from 'vitest';
import { ActiveRecord } from './active-record';
import type { IEntitySchema, IDataTypeHandler } from 'odata-active-record-contracts';

// Real-world entity example
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  preferences: Record<string, unknown>;
}

// Real-world schema
const userSchema: IEntitySchema<User> = {
  name: 'User',
  fields: {
    id: {
      name: 'id',
      type: 'number',
      primary: true,
      autoIncrement: true
    },
    firstName: {
      name: 'firstName',
      type: 'string',
      nullable: false
    },
    lastName: {
      name: 'lastName',
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
    },
    preferences: {
      name: 'preferences',
      type: 'json',
      nullable: true,
      defaultValue: {}
    }
  }
};

// Production-ready data type handler
class ProductionDataTypeHandler implements IDataTypeHandler {
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

describe('E2E: Complete Active Record Workflow', () => {
  let userModel: ActiveRecord<User>;
  let dataTypeHandler: IDataTypeHandler;

  beforeEach(() => {
    dataTypeHandler = new ProductionDataTypeHandler();
    userModel = new ActiveRecord<User>(userSchema, dataTypeHandler);
  });

  describe('Complete User Management Workflow', () => {
    it('should handle the complete CRUD workflow with data type conversion', async () => {
      // 1. CREATE - Create a new user with mixed data types
      console.log('🎯 Step 1: Creating user with mixed data types...');
      
      const createResult = userModel.create({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        age: '25', // String that should be converted to number
        isActive: 'true', // String that should be converted to boolean
        createdAt: '2024-01-01T00:00:00.000Z', // String that should be converted to Date
        preferences: '{"theme": "dark", "notifications": true}' // String that should be converted to JSON
      });

      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();
      
      if (createResult.data) {
        expect(typeof createResult.data.age).toBe('number');
        expect(typeof createResult.data.isActive).toBe('boolean');
        expect(createResult.data.createdAt).toBeInstanceOf(Date);
        expect(typeof createResult.data.preferences).toBe('object');
        expect(createResult.data.preferences.theme).toBe('dark');
      }

      console.log('✅ User created successfully with automatic type conversion');

      // 2. QUERY - Build complex queries
      console.log('🎯 Step 2: Building complex queries...');
      
      const query = userModel
        .where('isActive', 'eq', true)
        .where('age', 'gt', 18)
        .select('firstName', 'lastName', 'email')
        .orderBy('lastName', 'asc')
        .limit(10)
        .offset(0);

      expect(query).toBe(userModel); // Should return self for chaining
      console.log('✅ Complex query built successfully');

      // 3. EXECUTE - Execute queries
      console.log('🎯 Step 3: Executing queries...');
      
      const findResult = await userModel.find();
      expect(findResult).toHaveProperty('success');
      expect(findResult).toHaveProperty('data');
      expect(findResult).toHaveProperty('metadata');
      console.log('✅ Query executed successfully');

      // 4. UPDATE - Update user data
      console.log('🎯 Step 4: Updating user data...');
      
      const userId = createResult.data?.id;
      const updateResult = userModel.update(userId, {
        age: '30', // String that should be converted to number
        preferences: '{"theme": "light", "notifications": false}' // String that should be converted to JSON
      });

      expect(updateResult.success).toBe(true);
      if (updateResult.data) {
        expect(typeof updateResult.data.age).toBe('number');
        expect(updateResult.data.preferences.theme).toBe('light');
      }
      console.log('✅ User updated successfully with automatic type conversion');

      // 5. DELETE - Delete user
      console.log('🎯 Step 5: Deleting user...');
      
      const deleteResult = userModel.delete(userId);
      expect(deleteResult.success).toBe(true);
      console.log('✅ User deleted successfully');
    });

    it('should handle validation errors gracefully with helpful messages', () => {
      console.log('🎯 Testing error handling with invalid data...');
      
      // Try to create user with invalid data
      const result = userModel.create({
        firstName: '', // Empty string should fail validation
        lastName: 'Doe',
        email: 'invalid-email', // Invalid email should fail validation
        age: 'not-a-number', // Invalid number should fail validation
        isActive: 'maybe' // Invalid boolean should fail validation
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);

      // Check that errors are user-friendly
      if (result.errors) {
        for (const error of result.errors) {
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('suggestion');
          expect(error.actionable).toBe(true);
          console.log(`❌ Error: ${error.message} - ${error.suggestion}`);
        }
      }

      console.log('✅ Error handling works correctly with helpful messages');
    });

    it('should demonstrate fluent query building with validation', () => {
      console.log('🎯 Testing fluent query building...');
      
      // Build a complex query with validation
      const query = userModel
        .where('firstName', 'eq', 'John')
        .where('age', 'gt', 18)
        .where('isActive', 'eq', true)
        .select('firstName', 'lastName', 'email', 'age')
        .orderBy('lastName', 'asc')
        .orderBy('firstName', 'desc')
        .limit(20)
        .offset(10);

      expect(query).toBe(userModel);
      
      // Test field validation
      expect(userModel.validateField('firstName')).toBe(true);
      expect(userModel.validateField('lastName')).toBe(true);
      expect(userModel.validateField('email')).toBe(true);
      expect(userModel.validateField('nonExistent' as keyof User)).toBe(false);

      console.log('✅ Fluent query building works correctly');
    });

    it('should demonstrate the easiest possible usage', () => {
      console.log('🎯 Demonstrating the easiest possible usage...');
      
      // This is how easy it should be to use OData Active Record
      const users = userModel
        .where('isActive', 'eq', true)
        .select('firstName', 'lastName', 'email')
        .orderBy('lastName', 'asc')
        .limit(10);

      // The query should be built and ready to execute
      expect(users).toBe(userModel);
      
      // Data types should be handled automatically
      const user = userModel.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        age: '28', // Automatically converted to number
        isActive: 'true', // Automatically converted to boolean
        createdAt: '2024-01-15T10:30:00.000Z' // Automatically converted to Date
      });

      expect(user.success).toBe(true);
      if (user.data) {
        expect(typeof user.data.age).toBe('number');
        expect(typeof user.data.isActive).toBe('boolean');
        expect(user.data.createdAt).toBeInstanceOf(Date);
      }

      console.log('✅ The easiest possible usage works perfectly!');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle bulk operations', async () => {
      console.log('🎯 Testing bulk operations...');
      
      // Create multiple users
      const users = [
        { firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', age: '25' },
        { firstName: 'Bob', lastName: 'Smith', email: 'bob@example.com', age: '30' },
        { firstName: 'Carol', lastName: 'Davis', email: 'carol@example.com', age: '35' }
      ];

      const results = users.map(user => userModel.create(user));
      
      expect(results.length).toBe(3);
      expect(results.every(r => r.success)).toBe(true);
      
      console.log('✅ Bulk operations work correctly');
    });

    it('should handle complex filtering scenarios', () => {
      console.log('🎯 Testing complex filtering...');
      
      // Build a complex filter query
      const query = userModel
        .where('isActive', 'eq', true)
        .where('age', 'gt', 18)
        .where('age', 'lt', 65)
        .select('firstName', 'lastName', 'email', 'age')
        .orderBy('age', 'desc')
        .limit(50);

      expect(query).toBe(userModel);
      
      console.log('✅ Complex filtering works correctly');
    });
  });
});
