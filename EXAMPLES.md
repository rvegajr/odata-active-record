# OData Active Record Examples

This directory contains comprehensive examples demonstrating the OData Active Record pattern in action.

## 📁 Available Examples

### 🚀 [Basic Usage](./examples/basic-usage/)
**Perfect for getting started**

Demonstrates the core features with a simple blog application:
- ✅ ORM-like API with fluent queries
- ✅ Entity definition and schema validation
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Complex query building with filtering, sorting, pagination
- ✅ Automatic date parsing (any format)
- ✅ Namespace isolation
- ✅ User-friendly error handling
- ✅ Type safety with TypeScript

**Quick Start:**
```bash
cd examples/basic-usage
npm install
npm start
```

### ⚡ [Astro Integration](./examples/astro-integration/)
**Web applications with SSR/SSG**

Shows seamless integration with Astro for modern web apps:
- ✅ Server-side data fetching
- ✅ REST API endpoints
- ✅ Middleware and error handling
- ✅ Performance monitoring
- ✅ Type-safe API routes
- ✅ Beautiful UI with data visualization

**Quick Start:**
```bash
cd examples/astro-integration
npm install
npm run dev
```

## 🎯 What Each Example Teaches

### Core Concepts
1. **Entity Definition** - How to define schemas with type safety
2. **Namespace Management** - Isolating different data sources
3. **Query Building** - Fluent API for complex queries
4. **Data Type Handling** - Automatic parsing and conversion
5. **Error Handling** - User-friendly error messages

### Advanced Features
1. **Multi-Provider Support** - MongoDB, SQLite, HTTP OData
2. **Cross-Entity Queries** - Relationships within namespaces
3. **Schema Validation** - Drift detection and warnings
4. **Performance Optimization** - Caching and monitoring
5. **Integration Patterns** - Framework-specific implementations

## 🔗 Example Dependencies

All examples use the local packages:
- `odata-active-record-core` - Core functionality
- `odata-active-record-contracts` - Type definitions
- `odata-active-record-astro` - Astro integration

## 🚀 Running Examples

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) MongoDB, SQLite, or OData service

### Quick Test
```bash
# Test all examples
npm run test:examples

# Test specific example
npm run test:basic-usage
npm run test:astro-integration
```

## 📊 Example Outputs

### Basic Usage
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

🎉 Example completed successfully!
```

### Astro Integration
- Beautiful web interface with statistics
- Real-time data fetching
- REST API endpoints
- Performance monitoring
- Error handling with user feedback

## 🎯 Learning Path

1. **Start with Basic Usage** - Understand core concepts
2. **Try Astro Integration** - See web application patterns
3. **Explore Multi-Provider** - Learn different data sources
4. **Advanced Features** - Master complex scenarios

## 🔧 Customization

Each example can be customized:
- Change entity schemas
- Add new query patterns
- Integrate with different databases
- Extend with custom middleware
- Add authentication and authorization

## 📚 Related Documentation

- [Main README](../README.md) - Complete API reference
- [Architecture Checklist](../ARCHITECTURE_CHECKLIST.md) - Design decisions
- [API Documentation](../docs/api.md) - Detailed API reference
- [Integration Guide](../docs/integrations.md) - Framework integrations

## 🤝 Contributing Examples

Want to add a new example?

1. Create a new directory in `examples/`
2. Include `package.json` with dependencies
3. Add working code with clear comments
4. Include `README.md` explaining the example
5. Test thoroughly with different scenarios

## 🆘 Getting Help

- 📖 [Documentation](https://odata-active-record.dev)
- 🐛 [Issues](https://github.com/your-org/odata-active-record/issues)
- 💬 [Discussions](https://github.com/your-org/odata-active-record/discussions)

---

**Happy coding with OData Active Record! 🚀**
