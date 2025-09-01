# Basic Usage Example

This example demonstrates the core features of the OData Active Record pattern with a simple blog application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the example
npm start
```

## 📋 What This Example Demonstrates

### ✅ Core Features
- **ORM-like API** - Familiar Active Record pattern with fluent queries
- **Entity Definition** - Simple schema definition with type safety
- **CRUD Operations** - Create, read, update, delete operations
- **Complex Queries** - Multi-condition filtering, sorting, and pagination
- **Automatic Date Handling** - Any date format automatically parsed
- **Namespace Isolation** - Complete separation between different data sources
- **Error Handling** - User-friendly error messages with actionable feedback
- **Schema Validation** - Automatic drift detection and warnings

### 🔍 Query Examples
- Find all published posts
- Search posts by title content
- Filter by view count and publication status
- Complex multi-condition queries
- Sorting and pagination
- Field selection and aggregation

### 📅 Date Handling
- ISO strings: `'2024-01-15T10:30:00Z'`
- YYYY-MM-DD: `'2024-01-15'`
- MM/DD/YYYY: `'01/15/2024'`
- Relative dates: `'yesterday'`, `'now'`
- Natural language: `'2 days ago'`

### 🔒 Namespace Isolation
- Blog namespace with Post and Author entities
- Analytics namespace with PageView entity
- Complete isolation between namespaces
- Cross-entity queries within the same namespace

## 📊 Expected Output

The example will output something like:

```
🚀 OData Active Record - Basic Usage Example

✅ Entities registered successfully

📝 Creating authors...
✅ Authors created: John Doe and Jane Smith

📝 Creating posts...
✅ Posts created successfully

🔍 Query Examples:
📊 Found 2 published posts
🔥 Popular posts:
  - Getting Started with OData (150 views)
🔍 Found 2 posts containing "OData"
📚 Found 1 tutorial posts

📈 Recent popular posts:
  - Getting Started with OData (150 views, 2024-01-15T10:30:00.000Z)
  - Advanced Query Techniques (89 views, 2024-01-20T00:00:00.000Z)

✏️ Updating a post...
✅ Post updated successfully

📊 Statistics:
  Total posts: 3
  Published: 2
  Drafts: 1

⚠️ Error handling example:
❌ Expected errors occurred:
  - Field 'title' cannot be empty
  - Invalid date format for field 'publishedAt'

📅 Date handling examples:
✅ Post created with MM/DD/YYYY date format

🔒 Namespace isolation example:
✅ Analytics namespace is completely isolated from blog namespace

📋 All namespaces:
  - blog (2 entities)
  - analytics (1 entities)

🎉 Example completed successfully!

💡 Key features demonstrated:
  ✅ ORM-like API with fluent queries
  ✅ Automatic date parsing (any format)
  ✅ Namespace isolation
  ✅ User-friendly error handling
  ✅ Schema validation
  ✅ Complex query building
  ✅ Type safety with TypeScript
```

## 🎯 Key Takeaways

1. **Simplicity** - The API is designed to be as simple as possible while maintaining power
2. **Flexibility** - Any date format works, complex queries are easy to build
3. **Safety** - Type safety, validation, and user-friendly error messages
4. **Isolation** - Namespaces provide complete separation between different data sources
5. **Familiarity** - ORM-like patterns that developers already know

## 🔗 Next Steps

- Try the [Astro Integration Example](../astro-integration/) for web applications
- Explore the [Multi-Provider Example](../multi-provider/) for different data sources
- Check out the [Advanced Features Example](../advanced-features/) for complex use cases
