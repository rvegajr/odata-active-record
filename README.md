# OData Active Record - The Easiest Way to Interact with OData APIs

> **The easiest way to interact with OData APIs ever** - ORM-like simplicity with OData v4 power

[![Tests](https://github.com/your-org/odata-active-record/actions/workflows/test.yml/badge.svg)](https://github.com/your-org/odata-active-record/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

```bash
npm install odata-active-record-core
```

```typescript
import { ActiveRecord, EntityNamespaceManager } from 'odata-active-record-core';

// Create a namespace for your entities
const namespace = EntityNamespaceManager.createNamespace('my-app');

// Define your entity
const User = namespace.registerEntity('User', {
  name: { type: 'string', nullable: false },
  email: { type: 'string', nullable: false },
  age: { type: 'number', nullable: true },
  isActive: { type: 'boolean', nullable: false, defaultValue: true },
  createdAt: { type: 'date', nullable: false }
});

// Use it like an ORM!
const users = await User
  .where('age', 'gt', 25)
  .where('isActive', 'eq', true)
  .select(['name', 'email'])
  .orderBy('name', 'asc')
  .limit(10)
  .find();

console.log(users.data); // Array of users
```

## ✨ Features

- **🔄 ORM-like API** - Familiar Active Record pattern
- **📅 Automatic Date Handling** - Any date format, automatically parsed
- **🛡️ Fault Tolerant** - Graceful error handling with actionable feedback
- **🏗️ Multi-Provider Support** - MongoDB, SQLite, HTTP OData
- **🔒 Namespace Isolation** - Complete separation between different data sources
- **⚡ Astro Integration** - Seamless SSR/SSG and API routes
- **📊 Schema Validation** - Automatic drift detection and warnings
- **🎯 TypeScript First** - Full type safety and IntelliSense

## 📦 Installation

```bash
# Core package
npm install odata-active-record-core

# With Astro integration
npm install odata-active-record-astro

# With specific providers
npm install mongodb better-sqlite3
```

## 🎯 Basic Usage

### 1. Simple Entity Definition

```typescript
import { ActiveRecord, EntityNamespaceManager } from 'odata-active-record-core';

// Create a namespace
const namespace = EntityNamespaceManager.createNamespace('blog');

// Define entities
const Post = namespace.registerEntity('Post', {
  title: { type: 'string', nullable: false },
  content: { type: 'string', nullable: false },
  publishedAt: { type: 'date', nullable: true },
  isPublished: { type: 'boolean', nullable: false, defaultValue: false },
  viewCount: { type: 'number', nullable: false, defaultValue: 0 }
});

const Author = namespace.registerEntity('Author', {
  name: { type: 'string', nullable: false },
  email: { type: 'string', nullable: false },
  bio: { type: 'string', nullable: true }
});
```

### 2. CRUD Operations

```typescript
// Create
const newPost = await Post.create({
  title: 'My First Post',
  content: 'Hello, world!',
  publishedAt: '2024-01-15', // Any date format works!
  isPublished: true
});

console.log(newPost.data); // { id: 1, title: 'My First Post', ... }

// Read
const posts = await Post
  .where('isPublished', 'eq', true)
  .where('publishedAt', 'gt', '2024-01-01')
  .orderBy('publishedAt', 'desc')
  .limit(5)
  .find();

// Update
const updatedPost = await Post
  .where('id', 'eq', 1)
  .update({ viewCount: 42 });

// Delete
await Post.where('id', 'eq', 1).delete();
```

### 3. Advanced Queries

```typescript
// Complex filtering
const popularPosts = await Post
  .where('viewCount', 'gt', 1000)
  .where('isPublished', 'eq', true)
  .where('title', 'contains', 'tutorial')
  .select(['title', 'viewCount', 'publishedAt'])
  .orderBy('viewCount', 'desc')
  .limit(10)
  .find();

// Cross-entity queries (within namespace)
const postsWithAuthors = await Post
  .expand('author')
  .where('author.name', 'contains', 'John')
  .find();

// Aggregations
const stats = await Post
  .aggregate([
    { $group: { _id: '$isPublished', count: { $sum: 1 } } }
  ])
  .execute();
```

## 🗄️ Multi-Provider Support

### MongoDB

```typescript
import { MongoDBProvider } from 'odata-active-record-core';

const mongoProvider = new MongoDBProvider(
  'mongodb://localhost:27017',
  'my-database'
);

await mongoProvider.connect();

// Use with namespace
const namespace = EntityNamespaceManager.createNamespace('mongo-app');
namespace.setProvider(mongoProvider);

const User = namespace.registerEntity('users', {
  username: { type: 'string', nullable: false },
  email: { type: 'string', nullable: false },
  profile: { type: 'json', nullable: true }
});
```

### SQLite

```typescript
import { SQLiteProvider } from 'odata-active-record-core';

const sqliteProvider = new SQLiteProvider('./data.db');

await sqliteProvider.connect();

// Auto-create tables
await sqliteProvider.createTable('users', {
  fields: {
    username: { type: 'string', nullable: false },
    email: { type: 'string', nullable: false },
    created_at: { type: 'date', nullable: false }
  }
});
```

### HTTP OData Service

```typescript
import { HTTPODataProvider } from 'odata-active-record-core';

const odataProvider = new HTTPODataProvider('https://services.odata.org/V4/Northwind/Northwind.svc');

// Set authentication if needed
odataProvider.setAuthHeaders({
  'Authorization': 'Bearer your-token'
});

await odataProvider.connect();

// Use existing OData service
const Products = namespace.registerEntity('Products');
const products = await Products
  .where('UnitPrice', 'gt', 50)
  .select(['ProductName', 'UnitPrice'])
  .find();
```

## 🚀 Astro Integration

### API Routes

```typescript
// src/pages/api/users.ts
import { AstroODataIntegration } from 'odata-active-record-astro';

export const GET = AstroODataIntegration.createApiHandler({
  entity: 'User',
  namespace: 'my-app',
  operations: {
    list: true,
    get: true,
    create: true,
    update: true,
    delete: true
  }
});
```

### SSR/SSG Data

```astro
---
// src/pages/blog.astro
import { AstroODataIntegration } from 'odata-active-record-astro';

const posts = await AstroODataIntegration.getData({
  entity: 'Post',
  namespace: 'blog',
  query: {
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    limit: 10
  }
});
---

<html>
  <head><title>Blog</title></head>
  <body>
    {posts.data.map(post => (
      <article>
        <h2>{post.title}</h2>
        <p>{post.content}</p>
      </article>
    ))}
  </body>
</html>
```

### Edge Runtime

```typescript
// src/pages/api/edge/users.ts
export const GET = AstroODataIntegration.createEdgeHandler({
  entity: 'User',
  namespace: 'my-app',
  cache: {
    ttl: 300, // 5 minutes
    strategy: 'stale-while-revalidate'
  }
});
```

## 📅 Automatic Date Handling

Any date format is automatically parsed:

```typescript
// All of these work automatically:
await Post.create({
  title: 'Post with dates',
  publishedAt: '2024-01-15',           // YYYY-MM-DD
  updatedAt: '01/15/2024',             // MM/DD/YYYY
  created: '15-01-2024',               // DD-MM-YYYY
  scheduled: '2024-01-15T10:30:00Z',   // ISO string
  relative: 'yesterday',               // Relative dates
  natural: '2 days ago',               // Natural language
  timestamp: 1705312800000             // Unix timestamp
});
```

## 🛡️ Error Handling

User-friendly error messages with actionable feedback:

```typescript
const result = await User.create({
  email: 'invalid-email', // Invalid email
  age: 'not-a-number'     // Invalid age
});

if (!result.success) {
  console.log(result.errors);
  // [
  //   {
  //     code: 'VALIDATION_ERROR',
  //     message: 'Invalid email format',
  //     field: 'email',
  //     suggestions: ['Use a valid email format like user@example.com']
  //   },
  //   {
  //     code: 'TYPE_MISMATCH',
  //     message: 'Expected number, got string',
  //     field: 'age',
  //     suggestions: ['Provide a numeric value for age']
  //   }
  // ]
}
```

## 🔒 Namespace Isolation

Complete separation between different data sources:

```typescript
// E-commerce namespace
const ecommerce = EntityNamespaceManager.createNamespace('ecommerce');
const Product = ecommerce.registerEntity('Product', { /* ... */ });
const Order = ecommerce.registerEntity('Order', { /* ... */ });

// Analytics namespace (completely separate)
const analytics = EntityNamespaceManager.createNamespace('analytics');
const PageView = analytics.registerEntity('PageView', { /* ... */ });
const UserEvent = analytics.registerEntity('UserEvent', { /* ... */ });

// Cross-entity queries within namespace
const ordersWithProducts = await Order
  .expand('product')
  .where('product.category', 'eq', 'electronics')
  .find();

// No cross-namespace queries (maintains isolation)
// This won't work: Order.expand('pageView') - different namespaces!
```

## 📊 Schema Validation

Automatic drift detection and warnings:

```typescript
// Schema drift detection
const result = await User.create({
  name: 'John',
  email: 'john@example.com',
  newField: 'value' // Field not in schema
});

if (result.warnings) {
  console.log(result.warnings);
  // [
  //   {
  //     code: 'SCHEMA_DRIFT',
  //     message: 'Unknown field "newField" detected',
  //     field: 'newField',
  //     suggestions: ['Add this field to the schema or remove it from the data']
  //   }
  // ]
}
```

## 🧪 Testing

```typescript
import { describe, it, expect } from 'vitest';
import { ActiveRecord, EntityNamespaceManager } from 'odata-active-record-core';

describe('User Entity', () => {
  it('should create a user', async () => {
    const namespace = EntityNamespaceManager.createNamespace('test');
    const User = namespace.registerEntity('User', {
      name: { type: 'string', nullable: false },
      email: { type: 'string', nullable: false }
    });

    const result = await User.create({
      name: 'John Doe',
      email: 'john@example.com'
    });

    expect(result.success).toBe(true);
    expect(result.data.name).toBe('John Doe');
  });
});
```

## 📚 API Reference

### ActiveRecord Methods

- `where(field, operator, value)` - Add filter condition
- `select(fields)` - Select specific fields
- `orderBy(field, direction)` - Sort results
- `limit(count)` - Limit number of results
- `offset(count)` - Skip results
- `expand(relation)` - Include related entities
- `find()` - Execute query and return results
- `findOne()` - Execute query and return single result
- `count()` - Get count of matching records
- `create(data)` - Create new record
- `update(data)` - Update existing record
- `delete()` - Delete matching records

### Supported Operators

- `eq` - Equal
- `ne` - Not equal
- `gt` - Greater than
- `ge` - Greater than or equal
- `lt` - Less than
- `le` - Less than or equal
- `contains` - Contains substring
- `startswith` - Starts with
- `endswith` - Ends with
- `in` - In array
- `notin` - Not in array

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests first (TDD)
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 Support

- 📖 [Documentation](https://odata-active-record.dev)
- 🐛 [Issues](https://github.com/your-org/odata-active-record/issues)
- 💬 [Discussions](https://github.com/your-org/odata-active-record/discussions)

---

**Made with ❤️ for the OData community**
