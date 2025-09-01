import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AstroODataIntegration } from './astro-integration';
import { EntityNamespaceManager } from 'odata-active-record-core';
import type { IAstroConfig, IAstroContext } from 'odata-active-record-contracts';

describe('Real Astro Integration', () => {
  let astroIntegration: AstroODataIntegration;
  let testConfig: IAstroConfig;

  beforeEach(() => {
    // Create test configuration
    testConfig = {
      output: 'hybrid',
      baseUrl: 'https://test.example.com',
      cache: {
        ttl: 300,
        enabled: true
      }
    };

    astroIntegration = new AstroODataIntegration(testConfig);

    // Set up test namespace and entities
    const namespaceManager = new EntityNamespaceManager();
    const namespace = namespaceManager.createNamespace('test-blog');
    
    namespace.registerEntity('Post', {
      title: { type: 'string', nullable: false },
      content: { type: 'string', nullable: false },
      publishedAt: { type: 'date', nullable: true },
      isPublished: { type: 'boolean', nullable: false, defaultValue: false },
      viewCount: { type: 'number', nullable: false, defaultValue: 0 }
    });

    namespace.registerEntity('Author', {
      name: { type: 'string', nullable: false },
      email: { type: 'string', nullable: false },
      bio: { type: 'string', nullable: true }
    });
  });

  afterEach(() => {
    // Clean up
    const namespaceManager = new EntityNamespaceManager();
    namespaceManager.removeNamespace('test-blog');
    astroIntegration.clearCache();
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const validConfig: IAstroConfig = {
        output: 'hybrid',
        baseUrl: 'https://example.com',
        cache: { ttl: 300 }
      };

      expect(() => new AstroODataIntegration(validConfig)).not.toThrow();
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        output: 'hybrid'
        // Missing site
      } as IAstroConfig;

      expect(() => new AstroODataIntegration(invalidConfig)).toThrow('Base URL is required');
    });

    it('should reject negative cache TTL', () => {
      const invalidConfig: IAstroConfig = {
        output: 'hybrid',
        baseUrl: 'https://example.com',
        cache: { ttl: -1 }
      };

      expect(() => new AstroODataIntegration(invalidConfig)).toThrow('Cache TTL must be positive');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch data from entities', async () => {
      const result = await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog'
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle queries with filters', async () => {
      const result = await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog',
        query: {
          where: { isPublished: false }
        }
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should handle entity not found', async () => {
      const result = await astroIntegration.getData({
        entity: 'NonExistentEntity',
        namespace: 'test-blog'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].code).toBe('DATA_FETCH_ERROR');
    });

    it('should handle namespace not found', async () => {
      const result = await astroIntegration.getData({
        entity: 'Post',
        namespace: 'non-existent-namespace'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].code).toBe('DATA_FETCH_ERROR');
    });
  });

  describe('Caching', () => {
    it('should cache data correctly', async () => {
      // First request
      const result1 = await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog',
        cache: true,
        ttl: 60
      });

      expect(result1.success).toBe(true);

      // Check cache stats
      const cacheStats = astroIntegration.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);

      // Second request should hit cache
      const result2 = await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog',
        cache: true
      });

      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(result1.data);
    });

    it('should respect cache TTL', async () => {
      // Set cache with short TTL
      await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog',
        cache: true,
        ttl: 0.001 // 1ms
      });

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not hit cache
      const cacheStats = astroIntegration.getCacheStats();
      expect(cacheStats.size).toBe(0);
    });

    it('should clear cache', async () => {
      await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog',
        cache: true
      });

      expect(astroIntegration.getCacheStats().size).toBeGreaterThan(0);

      astroIntegration.clearCache();

      expect(astroIntegration.getCacheStats().size).toBe(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog'
      });

      const stats = astroIntegration.getPerformanceStats();
      expect(stats.data_fetch).toBeDefined();
      expect(stats.data_fetch.count).toBeGreaterThan(0);
      expect(stats.data_fetch.average).toBeGreaterThan(0);
    });

    it('should track different operation types', async () => {
      // Data fetch
      await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog'
      });

      // Cache hit
      await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog',
        cache: true
      });

      const stats = astroIntegration.getPerformanceStats();
      expect(stats.data_fetch).toBeDefined();
      expect(stats.cache_hit).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      const result = await astroIntegration.getData({
        entity: 'ErrorEntity',
        namespace: 'test-blog'
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].suggestion).toBeDefined();
      expect(typeof result.errors?.[0].suggestion).toBe('string');
    });

    it('should provide user-friendly error messages', async () => {
      const result = await astroIntegration.getData({
        entity: 'NonExistentEntity',
        namespace: 'test-blog'
      });

      expect(result.success).toBe(false);
      const error = result.errors?.[0];
      expect(error?.message).toBeDefined();
      expect(error?.suggestion).toBeDefined();
      expect(error?.suggestion?.length).toBeGreaterThan(0);
    });
  });

  describe('Query Parameter Parsing', () => {
    it('should parse where conditions', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('where[isPublished]', 'true');
      searchParams.set('where[viewCount]', '100');

      const query = astroIntegration['parseQueryParams'](searchParams);

      expect(query.where).toBeDefined();
      expect(query.where.isPublished).toBe('true');
      expect(query.where.viewCount).toBe('100');
    });

    it('should parse select fields', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('select', 'title,content,publishedAt');

      const query = astroIntegration['parseQueryParams'](searchParams);

      expect(query.select).toEqual(['title', 'content', 'publishedAt']);
    });

    it('should parse orderBy', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('orderBy', 'publishedAt desc, title asc');

      const query = astroIntegration['parseQueryParams'](searchParams);

      expect(query.orderBy).toEqual({
        publishedAt: 'desc',
        title: 'asc'
      });
    });

    it('should parse pagination', () => {
      const searchParams = new URLSearchParams();
      searchParams.set('limit', '10');
      searchParams.set('offset', '20');

      const query = astroIntegration['parseQueryParams'](searchParams);

      expect(query.limit).toBe(10);
      expect(query.offset).toBe(20);
    });
  });

  describe('API Route Handler', () => {
    it('should create API handler for GET requests', async () => {
      const handler = astroIntegration.createApiHandler({
        entity: 'Post',
        namespace: 'test-blog',
        operations: { list: true }
      });

      const mockContext: IAstroContext = {
        request: new Request('http://localhost:3000/api/posts', {
          method: 'GET'
        })
      };

      const response = await handler(mockContext);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should handle POST requests for creation', async () => {
      const handler = astroIntegration.createApiHandler({
        entity: 'Post',
        namespace: 'test-blog',
        operations: { create: true }
      });

      const mockContext: IAstroContext = {
        request: new Request('http://localhost:3000/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Test Post',
            content: 'Test content'
          })
        })
      };

      const response = await handler(mockContext);
      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should handle method not allowed', async () => {
      const handler = astroIntegration.createApiHandler({
        entity: 'Post',
        namespace: 'test-blog',
        operations: { list: true } // Only list allowed
      });

      const mockContext: IAstroContext = {
        request: new Request('http://localhost:3000/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Test' })
        })
      };

      const response = await handler(mockContext);
      expect(response.status).toBe(405);
    });
  });

  describe('Edge Runtime Handler', () => {
    it('should create edge handler with caching', async () => {
      const handler = astroIntegration.createEdgeHandler({
        entity: 'Post',
        namespace: 'test-blog',
        cache: {
          ttl: 300,
          strategy: 'cache-first'
        }
      });

      const mockContext: IAstroContext = {
        request: new Request('http://localhost:3000/api/edge/posts')
      };

      const response = await handler(mockContext);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('SSR/SSG Integration', () => {
    it('should provide SSR data', async () => {
      const result = await astroIntegration.getSSRData({
        entity: 'Post',
        namespace: 'test-blog'
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should provide SSG data with caching', async () => {
      const result = await astroIntegration.getSSGData({
        entity: 'Post',
        namespace: 'test-blog'
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);

      // Check that data was cached
      const cacheStats = astroIntegration.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });
  });

  describe('Integration with Real Data', () => {
    it('should handle complete workflow', async () => {
      // 1. Create a post
      const createResult = await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog',
        query: {
          create: {
            title: 'Integration Test Post',
            content: 'This is a test post for integration testing',
            isPublished: true,
            viewCount: 42
          }
        }
      });

      expect(createResult.success).toBe(true);
      expect(createResult.data).toBeDefined();

      // 2. Fetch posts with filter
      const fetchResult = await astroIntegration.getData({
        entity: 'Post',
        namespace: 'test-blog',
        query: {
          where: { isPublished: true },
          select: ['title', 'viewCount'],
          orderBy: { viewCount: 'desc' },
          limit: 5
        }
      });

      expect(fetchResult.success).toBe(true);
      expect(Array.isArray(fetchResult.data)).toBe(true);

      // 3. Check performance stats
      const stats = astroIntegration.getPerformanceStats();
      expect(stats.data_fetch).toBeDefined();
      expect(stats.data_fetch.count).toBeGreaterThan(0);

      // 4. Check cache stats
      const cacheStats = astroIntegration.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });
  });
});
