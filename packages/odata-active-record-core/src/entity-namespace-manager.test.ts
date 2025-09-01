import { describe, it, expect, beforeEach } from 'vitest';
import { EntityNamespaceManager } from './entity-namespace-manager';
import { ActiveRecord } from './active-record';
import type { 
  IEntitySchema, 
  IDataTypeHandler, 
  IEntityNamespaceManager,
  IEntityNamespace 
} from 'odata-active-record-contracts';

// Test entities
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface Order {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  total: number;
}

// Test schemas
const userSchema: IEntitySchema<User> = {
  name: 'User',
  fields: {
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    name: { name: 'name', type: 'string', nullable: false },
    email: { name: 'email', type: 'string', nullable: false },
    age: { name: 'age', type: 'number', nullable: true }
  }
};

const productSchema: IEntitySchema<Product> = {
  name: 'Product',
  fields: {
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    name: { name: 'name', type: 'string', nullable: false },
    price: { name: 'price', type: 'number', nullable: false },
    category: { name: 'category', type: 'string', nullable: false }
  }
};

const orderSchema: IEntitySchema<Order> = {
  name: 'Order',
  fields: {
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    userId: { name: 'userId', type: 'number', nullable: false },
    productId: { name: 'productId', type: 'number', nullable: false },
    quantity: { name: 'quantity', type: 'number', nullable: false },
    total: { name: 'total', type: 'number', nullable: false }
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

describe('EntityNamespaceManager', () => {
  let manager: EntityNamespaceManager;
  let dataTypeHandler: IDataTypeHandler;

  beforeEach(() => {
    dataTypeHandler = new MockDataTypeHandler();
    manager = new EntityNamespaceManager(dataTypeHandler);
  });

  describe('Namespace Creation and Management', () => {
    it('should create a new entity namespace', () => {
      const namespace = manager.createNamespace('ecommerce');
      
      expect(namespace).toBeDefined();
      expect(namespace.getName()).toBe('ecommerce');
      expect(namespace.getActiveRecordCount()).toBe(0);
    });

    it('should create multiple independent namespaces', () => {
      const ecommerceNamespace = manager.createNamespace('ecommerce');
      const analyticsNamespace = manager.createNamespace('analytics');
      
      expect(ecommerceNamespace.getName()).toBe('ecommerce');
      expect(analyticsNamespace.getName()).toBe('analytics');
      expect(ecommerceNamespace).not.toBe(analyticsNamespace);
    });

    it('should register entities within a namespace', () => {
      const namespace = manager.createNamespace('ecommerce');
      
      namespace.registerEntity('User', userSchema);
      namespace.registerEntity('Product', productSchema);
      
      expect(namespace.getActiveRecordCount()).toBe(2);
      expect(namespace.hasEntity('User')).toBe(true);
      expect(namespace.hasEntity('Product')).toBe(true);
      expect(namespace.hasEntity('Order')).toBe(false);
    });

    it('should get entity by name from namespace', () => {
      const namespace = manager.createNamespace('ecommerce');
      namespace.registerEntity('User', userSchema);
      
      const userActiveRecord = namespace.getEntity('User');
      expect(userActiveRecord).toBeDefined();
      expect(userActiveRecord).toBeInstanceOf(ActiveRecord);
    });

    it('should return null for non-existent entities', () => {
      const namespace = manager.createNamespace('ecommerce');
      
      const nonExistentEntity = namespace.getEntity('NonExistent');
      expect(nonExistentEntity).toBeNull();
    });
  });

  describe('Namespace Isolation', () => {
    it('should maintain complete isolation between namespaces', () => {
      const ecommerceNamespace = manager.createNamespace('ecommerce');
      const analyticsNamespace = manager.createNamespace('analytics');
      
      // Register same entity name in different namespaces
      ecommerceNamespace.registerEntity('User', userSchema);
      analyticsNamespace.registerEntity('User', productSchema); // Different schema!
      
      const ecommerceUser = ecommerceNamespace.getEntity('User');
      const analyticsUser = analyticsNamespace.getEntity('User');
      
      expect(ecommerceUser).not.toBe(analyticsUser);
      expect(ecommerceUser?.getSchema().name).toBe('User');
      expect(analyticsUser?.getSchema().name).toBe('Product'); // Different schema!
    });

    it('should not share entities between namespaces', () => {
      const namespace1 = manager.createNamespace('namespace1');
      const namespace2 = manager.createNamespace('namespace2');
      
      namespace1.registerEntity('User', userSchema);
      
      expect(namespace1.hasEntity('User')).toBe(true);
      expect(namespace2.hasEntity('User')).toBe(false);
    });
  });

  describe('Cross-Entity Queries', () => {
    it('should support cross-entity queries within the same namespace', () => {
      const namespace = manager.createNamespace('ecommerce');
      
      namespace.registerEntity('User', userSchema);
      namespace.registerEntity('Order', orderSchema);
      
      const userActiveRecord = namespace.getEntity('User');
      const orderActiveRecord = namespace.getEntity('Order');
      
      expect(userActiveRecord).toBeDefined();
      expect(orderActiveRecord).toBeDefined();
      
      // Both should be able to query independently
      const userQuery = userActiveRecord?.where('age', 'gt', 18);
      const orderQuery = orderActiveRecord?.where('total', 'gt', 100);
      
      expect(userQuery).toBe(userActiveRecord);
      expect(orderQuery).toBe(orderActiveRecord);
    });

    it('should support complex cross-entity scenarios', () => {
      const namespace = manager.createNamespace('ecommerce');
      
      namespace.registerEntity('User', userSchema);
      namespace.registerEntity('Product', productSchema);
      namespace.registerEntity('Order', orderSchema);
      
      const user = namespace.getEntity('User');
      const product = namespace.getEntity('Product');
      const order = namespace.getEntity('Order');
      
      // Simulate a complex business scenario
      const activeUsers = user?.where('age', 'gt', 18);
      const expensiveProducts = product?.where('price', 'gt', 100);
      const largeOrders = order?.where('total', 'gt', 500);
      
      expect(activeUsers).toBe(user);
      expect(expensiveProducts).toBe(product);
      expect(largeOrders).toBe(order);
    });
  });

  describe('Namespace Management', () => {
    it('should list all namespaces', () => {
      manager.createNamespace('ecommerce');
      manager.createNamespace('analytics');
      manager.createNamespace('inventory');
      
      const namespaces = manager.listNamespaces();
      expect(namespaces).toContain('ecommerce');
      expect(namespaces).toContain('analytics');
      expect(namespaces).toContain('inventory');
      expect(namespaces.length).toBe(3);
    });

    it('should check if namespace exists', () => {
      manager.createNamespace('ecommerce');
      
      expect(manager.hasNamespace('ecommerce')).toBe(true);
      expect(manager.hasNamespace('analytics')).toBe(false);
    });

    it('should get namespace by name', () => {
      const createdNamespace = manager.createNamespace('ecommerce');
      const retrievedNamespace = manager.getNamespace('ecommerce');
      
      expect(retrievedNamespace).toBe(createdNamespace);
    });

    it('should return null for non-existent namespace', () => {
      const namespace = manager.getNamespace('non-existent');
      expect(namespace).toBeNull();
    });

    it('should remove namespace', () => {
      manager.createNamespace('ecommerce');
      expect(manager.hasNamespace('ecommerce')).toBe(true);
      
      manager.removeNamespace('ecommerce');
      expect(manager.hasNamespace('ecommerce')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle duplicate namespace creation gracefully', () => {
      const namespace1 = manager.createNamespace('ecommerce');
      const namespace2 = manager.createNamespace('ecommerce');
      
      // Should return the same namespace instance
      expect(namespace1).toBe(namespace2);
    });

    it('should handle duplicate entity registration gracefully', () => {
      const namespace = manager.createNamespace('ecommerce');
      
      namespace.registerEntity('User', userSchema);
      namespace.registerEntity('User', userSchema); // Duplicate registration
      
      expect(namespace.getActiveRecordCount()).toBe(1); // Should still be 1
    });

    it('should provide helpful error messages for invalid operations', () => {
      const namespace = manager.createNamespace('ecommerce');
      
      // Try to get non-existent entity
      const entity = namespace.getEntity('NonExistent');
      expect(entity).toBeNull();
      
      // Try to get non-existent namespace
      const nonExistentNamespace = manager.getNamespace('NonExistent');
      expect(nonExistentNamespace).toBeNull();
    });
  });

  describe('Data Type Handling Across Namespaces', () => {
    it('should maintain consistent data type handling across namespaces', () => {
      const namespace1 = manager.createNamespace('namespace1');
      const namespace2 = manager.createNamespace('namespace2');
      
      namespace1.registerEntity('User', userSchema);
      namespace2.registerEntity('User', userSchema);
      
      const user1 = namespace1.getEntity('User');
      const user2 = namespace2.getEntity('User');
      
      // Both should handle data types the same way
      const result1 = user1?.create({ name: 'John', age: '25' });
      const result2 = user2?.create({ name: 'Jane', age: '30' });
      
      expect(result1?.success).toBe(true);
      expect(result2?.success).toBe(true);
      
      if (result1?.data && result2?.data) {
        expect(typeof result1.data.age).toBe('number');
        expect(typeof result2.data.age).toBe('number');
      }
    });
  });
});
