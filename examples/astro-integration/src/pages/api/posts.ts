import type { APIRoute } from 'astro';
import { AstroODataIntegration } from 'odata-active-record-astro';

// Create a REST API handler for posts
export const GET: APIRoute = AstroODataIntegration.createApiHandler({
  entity: 'Post',
  namespace: 'blog',
  operations: {
    list: true,
    get: true,
    create: true,
    update: true,
    delete: true
  },
  // Custom middleware for logging
  middleware: [
    async (context, next) => {
      console.log(`[API] ${context.request.method} ${context.request.url}`);
      const start = Date.now();
      const result = await next();
      console.log(`[API] Completed in ${Date.now() - start}ms`);
      return result;
    }
  ],
  // Custom error handling
  errorHandler: async (error, context) => {
    console.error(`[API Error] ${error.message}`, error);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// Example of custom endpoint
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Use OData Active Record for data operations
    const result = await AstroODataIntegration.getData({
      entity: 'Post',
      namespace: 'blog',
      query: {
        create: body
      }
    });

    if (!result.success) {
      return new Response(JSON.stringify({
        error: 'Validation Error',
        details: result.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
