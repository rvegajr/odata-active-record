# Astro Integration Example

This example demonstrates how to integrate OData Active Record with Astro for seamless SSR/SSG data fetching and API routes.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 What This Example Demonstrates

### ✅ Astro Integration Features
- **SSR Data Fetching** - Server-side data fetching with automatic type conversion
- **API Routes** - REST API endpoints with OData Active Record
- **Middleware Support** - Custom logging and error handling
- **Type Safety** - Full TypeScript support with IntelliSense
- **Performance** - Optimized data fetching with caching
- **Error Handling** - User-friendly error responses

### 🔍 Key Components

#### 1. SSR Page (`src/pages/index.astro`)
- Fetches posts and authors using `AstroODataIntegration.getData()`
- Automatic date parsing and type conversion
- Complex queries with filtering, sorting, and aggregation
- Beautiful UI with statistics and data display

#### 2. API Routes (`src/pages/api/posts.ts`)
- REST API endpoints for CRUD operations
- Custom middleware for logging and performance monitoring
- Error handling with structured responses
- OData query support through URL parameters

#### 3. Configuration (`astro.config.mjs`)
- Hybrid output mode (SSR + SSG)
- OData Active Record integration
- Performance optimizations

## 🎯 Key Features Demonstrated

### 📊 Data Fetching
```typescript
// Fetch published posts with complex query
const posts = await AstroODataIntegration.getData({
  entity: 'Post',
  namespace: 'blog',
  query: {
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    limit: 10
  }
});
```

### 🔧 API Routes
```typescript
// Automatic REST API with OData support
export const GET: APIRoute = AstroODataIntegration.createApiHandler({
  entity: 'Post',
  namespace: 'blog',
  operations: {
    list: true,
    get: true,
    create: true,
    update: true,
    delete: true
  }
});
```

### 🛡️ Error Handling
```typescript
// Custom error handling with structured responses
errorHandler: async (error, context) => {
  return new Response(JSON.stringify({
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString()
  }), { status: 500 });
}
```

### 📈 Performance Monitoring
```typescript
// Custom middleware for logging and monitoring
middleware: [
  async (context, next) => {
    const start = Date.now();
    const result = await next();
    console.log(`[API] Completed in ${Date.now() - start}ms`);
    return result;
  }
]
```

## 🌐 API Endpoints

Once running, you can access:

- **Homepage**: `http://localhost:4321/` - SSR page with data
- **Posts API**: `http://localhost:4321/api/posts` - REST API for posts
- **Single Post**: `http://localhost:4321/api/posts/1` - Get specific post
- **Filtered Posts**: `http://localhost:4321/api/posts?where[isPublished]=true` - OData filtering

## 📊 Expected Output

The homepage will display:
- Statistics cards showing post and author counts
- Grid of published posts with metadata
- List of authors with their information
- Beautiful, responsive design

## 🔧 Configuration

### Astro Config
```typescript
// astro.config.mjs
export default defineConfig({
  output: 'hybrid', // Enable both SSR and SSG
  integrations: [
    // OData Active Record integration
  ]
});
```

### Environment Variables
Create a `.env` file for your database configuration:
```env
DATABASE_URL=mongodb://localhost:27017/blog
# or
DATABASE_URL=./data.db
# or
DATABASE_URL=https://services.odata.org/V4/Northwind/Northwind.svc
```

## 🎯 Key Takeaways

1. **Seamless Integration** - OData Active Record works perfectly with Astro
2. **SSR Performance** - Server-side data fetching with automatic optimization
3. **API Simplicity** - REST endpoints with minimal boilerplate
4. **Type Safety** - Full TypeScript support throughout
5. **Error Handling** - Graceful error handling with user-friendly messages
6. **Performance** - Built-in caching and monitoring

## 🔗 Next Steps

- Try the [Basic Usage Example](../basic-usage/) for core features
- Explore the [Multi-Provider Example](../multi-provider/) for different data sources
- Check out the [Advanced Features Example](../advanced-features/) for complex use cases

## 🚀 Production Deployment

This example is ready for production deployment on:
- **Vercel** - Automatic deployment with edge functions
- **Netlify** - Serverless functions with OData support
- **Cloudflare Pages** - Edge runtime with global distribution
- **AWS** - Lambda functions with API Gateway

The OData Active Record pattern makes it easy to build scalable, type-safe applications with minimal configuration!
