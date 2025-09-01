import { describe, it, expect, beforeEach } from 'vitest';
import { EntityNamespaceManager } from './entity-namespace-manager';
import type { IEntitySchema, IDataTypeHandler } from 'odata-active-record-contracts';

// Real-world entities for different domains
interface EcommerceUser {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

interface EcommerceProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface EcommerceOrder {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  total: number;
  status: string;
}

interface AnalyticsEvent {
  id: number;
  userId: number;
  eventType: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

interface AnalyticsMetric {
  id: number;
  name: string;
  value: number;
  unit: string;
  recordedAt: Date;
}

// Schemas for different domains
const ecommerceUserSchema: IEntitySchema<EcommerceUser> = {
  name: 'EcommerceUser',
  fields: {
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    name: { name: 'name', type: 'string', nullable: false },
    email: { name: 'email', type: 'string', nullable: false },
    age: { name: 'age', type: 'number', nullable: true },
    isActive: { name: 'isActive', type: 'boolean', nullable: false, defaultValue: true }
  }
};

const ecommerceProductSchema: IEntitySchema<EcommerceProduct> = {
  name: 'EcommerceProduct',
  fields: {
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    name: { name: 'name', type: 'string', nullable: false },
    price: { name: 'price', type: 'number', nullable: false },
    category: { name: 'category', type: 'string', nullable: false },
    inStock: { name: 'inStock', type: 'boolean', nullable: false, defaultValue: true }
  }
};

const ecommerceOrderSchema: IEntitySchema<EcommerceOrder> = {
  name: 'EcommerceOrder',
  fields: {
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    userId: { name: 'userId', type: 'number', nullable: false },
    productId: { name: 'productId', type: 'number', nullable: false },
    quantity: { name: 'quantity', type: 'number', nullable: false },
    total: { name: 'total', type: 'number', nullable: false },
    status: { name: 'status', type: 'string', nullable: false, defaultValue: 'pending' }
  }
};

const analyticsEventSchema: IEntitySchema<AnalyticsEvent> = {
  name: 'AnalyticsEvent',
  fields: {
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    userId: { name: 'userId', type: 'number', nullable: false },
    eventType: { name: 'eventType', type: 'string', nullable: false },
    timestamp: { name: 'timestamp', type: 'date', nullable: false, defaultValue: () => new Date() },
    metadata: { name: 'metadata', type: 'json', nullable: true, defaultValue: {} }
  }
};

const analyticsMetricSchema: IEntitySchema<AnalyticsMetric> = {
  name: 'AnalyticsMetric',
  fields: {
    id: { name: 'id', type: 'number', primary: true, autoIncrement: true },
    name: { name: 'name', type: 'string', nullable: false },
    value: { name: 'value', type: 'number', nullable: false },
    unit: { name: 'unit', type: 'string', nullable: false },
    recordedAt: { name: 'recordedAt', type: 'date', nullable: false, defaultValue: () => new Date() }
  }
};

// Production-ready data type handler
class ProductionDataTypeHandler implements IDataTypeHandler {
  parseDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
      // Unix timestamp (seconds or milliseconds)
      const date = new Date(value > 1000000000000 ? value : value * 1000);
      return isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      // Try various date formats
      const formats = [
        // ISO formats
        () => new Date(trimmed),
        // Common formats
        () => new Date(trimmed.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$1-$2')),
        () => new Date(trimmed.replace(/(\d{1,2})-(\d{1,2})-(\d{4})/, '$3-$2-$1')),
        // Relative dates
        () => {
          const now = new Date();
          const lower = trimmed.toLowerCase();
          if (lower === 'today') return now;
          if (lower === 'yesterday') return new Date(now.getTime() - 24 * 60 * 60 * 1000);
          if (lower === 'tomorrow') return new Date(now.getTime() + 24 * 60 * 60 * 1000);
          if (lower === 'now') return now;
          return null;
        },
        // Natural language
        () => {
          const lower = trimmed.toLowerCase();
          if (lower.includes('ago')) {
            const match = lower.match(/(\d+)\s*(day|days|hour|hours|minute|minutes|second|seconds)\s*ago/);
            if (match) {
              const amount = parseInt(match[1]);
              const unit = match[2];
              const now = new Date();
              const multipliers = {
                day: 24 * 60 * 60 * 1000,
                days: 24 * 60 * 60 * 1000,
                hour: 60 * 60 * 1000,
                hours: 60 * 60 * 1000,
                minute: 60 * 1000,
                minutes: 60 * 1000,
                second: 1000,
                seconds: 1000
              };
              return new Date(now.getTime() - amount * multipliers[unit]);
            }
          }
          return null;
        }
      ];

      for (const format of formats) {
        try {
          const date = format();
          if (date && !isNaN(date.getTime())) {
            return date;
          }
        } catch {
          // Continue to next format
        }
      }
    }
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

describe('E2E: Entity Namespace Management', () => {
  let manager: EntityNamespaceManager;
  let dataTypeHandler: IDataTypeHandler;

  beforeEach(() => {
    dataTypeHandler = new ProductionDataTypeHandler();
    manager = new EntityNamespaceManager(dataTypeHandler);
  });

  describe('Multi-Domain Architecture', () => {
    it('should manage multiple independent OData endpoints with complete isolation', () => {
      console.log('🎯 Setting up multi-domain architecture...');

      // 1. Create E-commerce namespace
      const ecommerceNamespace = manager.createNamespace('ecommerce');
      ecommerceNamespace.registerEntity('User', ecommerceUserSchema);
      ecommerceNamespace.registerEntity('Product', ecommerceProductSchema);
      ecommerceNamespace.registerEntity('Order', ecommerceOrderSchema);

      // 2. Create Analytics namespace
      const analyticsNamespace = manager.createNamespace('analytics');
      analyticsNamespace.registerEntity('Event', analyticsEventSchema);
      analyticsNamespace.registerEntity('Metric', analyticsMetricSchema);

      console.log('✅ Created independent namespaces for ecommerce and analytics');

      // 3. Verify complete isolation
      expect(ecommerceNamespace.getName()).toBe('ecommerce');
      expect(analyticsNamespace.getName()).toBe('analytics');
      expect(ecommerceNamespace).not.toBe(analyticsNamespace);

      expect(ecommerceNamespace.getActiveRecordCount()).toBe(3);
      expect(analyticsNamespace.getActiveRecordCount()).toBe(2);

      expect(ecommerceNamespace.hasEntity('User')).toBe(true);
      expect(analyticsNamespace.hasEntity('User')).toBe(false);

      console.log('✅ Verified complete namespace isolation');
    });

    it('should handle cross-entity operations within the same namespace', async () => {
      console.log('🎯 Testing cross-entity operations within ecommerce namespace...');

      const ecommerceNamespace = manager.createNamespace('ecommerce');
      ecommerceNamespace.registerEntity('User', ecommerceUserSchema);
      ecommerceNamespace.registerEntity('Product', ecommerceProductSchema);
      ecommerceNamespace.registerEntity('Order', ecommerceOrderSchema);

      // Get entities from the same namespace
      const userEntity = ecommerceNamespace.getEntity('User');
      const productEntity = ecommerceNamespace.getEntity('Product');
      const orderEntity = ecommerceNamespace.getEntity('Order');

      expect(userEntity).toBeDefined();
      expect(productEntity).toBeDefined();
      expect(orderEntity).toBeDefined();

      // Create data across entities
      const userResult = userEntity?.create({
        name: 'John Doe',
        email: 'john@example.com',
        age: '25',
        isActive: 'true'
      });

      const productResult = productEntity?.create({
        name: 'Laptop',
        price: '999.99',
        category: 'Electronics',
        inStock: 'true'
      });

      expect(userResult?.success).toBe(true);
      expect(productResult?.success).toBe(true);

      if (userResult?.data && productResult?.data) {
        // Create an order linking the user and product
        const orderResult = orderEntity?.create({
          userId: userResult.data.id,
          productId: productResult.data.id,
          quantity: '2',
          total: '1999.98',
          status: 'pending'
        });

        expect(orderResult?.success).toBe(true);
      }

      console.log('✅ Cross-entity operations work correctly within namespace');
    });

    it('should demonstrate the easiest possible multi-namespace usage', () => {
      console.log('🎯 Demonstrating the easiest possible multi-namespace usage...');

      // Set up ecommerce domain
      const ecommerce = manager.createNamespace('ecommerce');
      ecommerce.registerEntity('User', ecommerceUserSchema);
      ecommerce.registerEntity('Product', ecommerceProductSchema);

      // Set up analytics domain
      const analytics = manager.createNamespace('analytics');
      analytics.registerEntity('Event', analyticsEventSchema);
      analytics.registerEntity('Metric', analyticsMetricSchema);

      // Use entities from different namespaces
      const ecommerceUser = ecommerce.getEntity('User');
      const analyticsEvent = analytics.getEntity('Event');

      // Create data in different domains
      const user = ecommerceUser?.create({
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: '30',
        isActive: 'true'
      });

      const event = analyticsEvent?.create({
        userId: '123',
        eventType: 'page_view',
        timestamp: '2024-01-15T10:30:00.000Z',
        metadata: '{"page": "/products", "referrer": "google.com"}'
      });

      expect(user?.success).toBe(true);
      expect(event?.success).toBe(true);

      if (user?.data && event?.data) {
        expect(typeof user.data.age).toBe('number');
        expect(typeof user.data.isActive).toBe('boolean');
        expect(event.data.timestamp).toBeInstanceOf(Date);
        expect(typeof event.data.metadata).toBe('object');
      }

             console.log('✅ Multi-namespace usage works seamlessly with automatic type conversion');
     });

     it('should handle any date format automatically', () => {
       console.log('🎯 Testing enhanced date format handling...');

       const analytics = manager.createNamespace('analytics');
       analytics.registerEntity('Event', analyticsEventSchema);
       const eventEntity = analytics.getEntity('Event');

       // Test various date formats
       const dateFormats = [
         '2024-01-15T10:30:00.000Z',  // ISO string
         '2024-01-15',                // YYYY-MM-DD
         '01/15/2024',                // MM/DD/YYYY
         '15-01-2024',                // DD-MM-YYYY
         'today',                     // Relative
         'yesterday',                 // Relative
         '2 days ago',                // Natural language
         '1 hour ago',                // Natural language
         1705312200000,               // Unix timestamp (milliseconds)
         1705312200                   // Unix timestamp (seconds)
       ];

       for (const dateFormat of dateFormats) {
         const result = eventEntity?.create({
           userId: '123',
           eventType: 'test',
           timestamp: dateFormat,
           metadata: '{"test": "date_format"}'
         });

         expect(result?.success).toBe(true);
         if (result?.data) {
           expect(result.data.timestamp).toBeInstanceOf(Date);
           expect(isNaN(result.data.timestamp.getTime())).toBe(false);
         }
       }

       console.log('✅ Enhanced date format handling works with any common format');
     });
   });

  describe('Namespace Management Features', () => {
    it('should provide comprehensive namespace management', () => {
      console.log('🎯 Testing comprehensive namespace management...');

      // Create multiple namespaces
      manager.createNamespace('ecommerce');
      manager.createNamespace('analytics');
      manager.createNamespace('inventory');

      // List all namespaces
      const namespaces = manager.listNamespaces();
      expect(namespaces).toContain('ecommerce');
      expect(namespaces).toContain('analytics');
      expect(namespaces).toContain('inventory');
      expect(namespaces.length).toBe(3);

      // Check namespace existence
      expect(manager.hasNamespace('ecommerce')).toBe(true);
      expect(manager.hasNamespace('nonexistent')).toBe(false);

      // Get namespace statistics
      const stats = manager.getNamespaceStats();
      expect(stats.totalNamespaces).toBe(3);
      expect(stats.totalEntities).toBe(0); // No entities registered yet

      console.log('✅ Namespace management features work correctly');
    });

    it('should handle namespace validation and error reporting', () => {
      console.log('🎯 Testing namespace validation...');

      const ecommerce = manager.createNamespace('ecommerce');
      ecommerce.registerEntity('User', ecommerceUserSchema);
      ecommerce.registerEntity('Product', ecommerceProductSchema);

      // Validate individual namespace
      const namespaceValidation = ecommerce.validateNamespace();
      expect(namespaceValidation.isValid).toBe(true);

      // Validate all namespaces
      const allValidation = manager.validateAllNamespaces();
      expect(allValidation.isValid).toBe(true);

      console.log('✅ Namespace validation works correctly');
    });

    it('should handle entity name conflicts gracefully', () => {
      console.log('🎯 Testing entity name conflict handling...');

      // Create two namespaces with the same entity name
      const namespace1 = manager.createNamespace('namespace1');
      const namespace2 = manager.createNamespace('namespace2');

      namespace1.registerEntity('User', ecommerceUserSchema);
      namespace2.registerEntity('User', analyticsEventSchema); // Same name, different schema!

      // Both should work independently
      const user1 = namespace1.getEntity('User');
      const user2 = namespace2.getEntity('User');

      expect(user1).toBeDefined();
      expect(user2).toBeDefined();
      expect(user1).not.toBe(user2);

      // The schemas should be different
      expect(user1?.getSchema().name).toBe('EcommerceUser');
      expect(user2?.getSchema().name).toBe('AnalyticsEvent');

      console.log('✅ Entity name conflicts handled gracefully with namespace isolation');
    });
  });

  describe('Real-World Multi-Tenant Scenario', () => {
    it('should demonstrate multi-tenant architecture with complete isolation', () => {
      console.log('🎯 Demonstrating multi-tenant architecture...');

      // Tenant 1: E-commerce platform
      const tenant1 = manager.createNamespace('tenant1-ecommerce');
      tenant1.registerEntity('User', ecommerceUserSchema);
      tenant1.registerEntity('Product', ecommerceProductSchema);
      tenant1.registerEntity('Order', ecommerceOrderSchema);

      // Tenant 2: Analytics platform
      const tenant2 = manager.createNamespace('tenant2-analytics');
      tenant2.registerEntity('Event', analyticsEventSchema);
      tenant2.registerEntity('Metric', analyticsMetricSchema);

      // Tenant 3: Hybrid platform
      const tenant3 = manager.createNamespace('tenant3-hybrid');
      tenant3.registerEntity('User', ecommerceUserSchema);
      tenant3.registerEntity('Event', analyticsEventSchema);

      // Each tenant operates completely independently
      const tenant1User = tenant1.getEntity('User');
      const tenant2Event = tenant2.getEntity('Event');
      const tenant3User = tenant3.getEntity('User');

      // Create data in each tenant
      const user1 = tenant1User?.create({
        name: 'Tenant1 User',
        email: 'user1@tenant1.com',
        age: '25',
        isActive: 'true'
      });

      const event2 = tenant2Event?.create({
        userId: '456',
        eventType: 'click',
        timestamp: '2024-01-15T12:00:00.000Z',
        metadata: '{"button": "buy_now"}'
      });

      const user3 = tenant3User?.create({
        name: 'Tenant3 User',
        email: 'user3@tenant3.com',
        age: '35',
        isActive: 'false'
      });

      expect(user1?.success).toBe(true);
      expect(event2?.success).toBe(true);
      expect(user3?.success).toBe(true);

      // Verify complete isolation
      expect(tenant1.getActiveRecordCount()).toBe(3);
      expect(tenant2.getActiveRecordCount()).toBe(2);
      expect(tenant3.getActiveRecordCount()).toBe(2);

      console.log('✅ Multi-tenant architecture with complete isolation works perfectly');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large numbers of namespaces efficiently', () => {
      console.log('🎯 Testing performance with many namespaces...');

      // Create many namespaces
      const namespaceCount = 100;
      for (let i = 0; i < namespaceCount; i++) {
        const namespace = manager.createNamespace(`namespace-${i}`);
        namespace.registerEntity('User', ecommerceUserSchema);
      }

      expect(manager.listNamespaces().length).toBe(namespaceCount);
      expect(manager.getNamespaceStats().totalNamespaces).toBe(namespaceCount);
      expect(manager.getNamespaceStats().totalEntities).toBe(namespaceCount);

      // Test namespace lookup performance
      const startTime = Date.now();
      for (let i = 0; i < namespaceCount; i++) {
        const namespace = manager.getNamespace(`namespace-${i}`);
        expect(namespace).toBeDefined();
      }
      const endTime = Date.now();
      const lookupTime = endTime - startTime;

      console.log(`✅ Created and accessed ${namespaceCount} namespaces in ${lookupTime}ms`);
      expect(lookupTime).toBeLessThan(1000); // Should be very fast
    });
  });
});
