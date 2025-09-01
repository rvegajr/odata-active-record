# 🚀 Automated Interface Generation Guide

## **The Easiest Way to Generate TypeScript Interfaces from OData Active Record Schemas**

> **One-liner interface generation with full automation support**

## **📋 Quick Start**

### **1. One-Liner Generation**

```typescript
import { quickGen } from 'odata-active-record-core';

// Generate TypeScript interface from schema
const userInterface = quickGen('User', userSchema);

// Generate JavaScript format
const jsInterface = quickGen('User', userSchema, { format: 'javascript' });

// Generate JSX format
const jsxInterface = quickGen('User', userSchema, { format: 'jsx' });
```

### **2. CLI Generation**

```bash
# Generate TypeScript interfaces (default)
npx tsx generate-interfaces.ts generate

# Generate JavaScript format
npx tsx generate-interfaces.ts generate --format javascript

# Generate JSX format
npx tsx generate-interfaces.ts generate --format jsx

# Generate with all utilities
npx tsx generate-interfaces.ts generate --output types.ts

# Run demonstration
npx tsx generate-interfaces.ts demo
```

### **3. Programmatic Generation**

```typescript
import { InterfaceUtils } from 'odata-active-record-core';

// Generate all interfaces with utilities (TypeScript)
const allInterfaces = InterfaceUtils.generateWithAll(mySchemas);

// Generate JavaScript format
const jsInterfaces = InterfaceUtils.generateWithAll(mySchemas, { format: 'javascript' });

// Generate complete file with custom format
const file = InterfaceUtils.generateFile(mySchemas, {
  fileName: 'my-types',
  format: 'jsx',
  addImports: true,
  addExports: true,
  addComments: true
});
```

## **🎯 Features**

### **✅ Multi-Format Interface Generation**
- **TypeScript interfaces** - Full TypeScript support with interfaces and types
- **JavaScript JSDoc** - JSDoc comments for JavaScript projects
- **JSX interfaces** - TypeScript interfaces for React/JSX projects
- **Automatic format detection** - Smart file extension handling
- **Schema-to-Interface conversion** - Automatically converts schemas to any format

### **✅ Utility Type Generation**
- **Input types** - For create operations (`UserInput`)
- **Update types** - For update operations (`UserUpdate`)
- **Partial types** - For flexible operations (`UserPartial`)
- **Query types** - For where clauses (`UserQuery`)
- **TypeScript-only utilities** - Utility types only available in TypeScript format

### **✅ CLI Tools**
- **Command-line interface** - Easy CLI for automation
- **Build script integration** - Perfect for CI/CD pipelines
- **Multiple output formats** - Console, file, or custom output
- **Configurable options** - Control what gets generated
- **Format-specific options** - Tailored options for each format

### **✅ File Generation**
- **Complete files** - Ready-to-use files with proper extensions
- **Import/export statements** - Proper module structure
- **JSDoc comments** - Comprehensive documentation
- **Type safety** - Full TypeScript support
- **JavaScript compatibility** - Works with any JavaScript environment

## **🛠️ Usage Examples**

### **1. Basic Interface Generation**

```typescript
import { quickGen } from 'odata-active-record-core';

const userSchema = {
  name: 'User',
  fields: {
    firstName: { type: 'string', nullable: false },
    lastName: { type: 'string', nullable: false },
    email: { type: 'string', nullable: false },
    age: { type: 'number', nullable: true },
    isActive: { type: 'boolean', nullable: false, defaultValue: true }
  }
};

const interface = quickGen('User', userSchema);
```

**Output:**
```typescript
/**
 * Auto-generated interface for User entity
 */
export interface User {
  /** Auto-generated primary key */
  id?: number;

  /** Required */
  firstName: string;

  /** Required */
  lastName: string;

  /** Required */
  email: string;

  age?: number;

  /** Required, Default: true */
  isActive: boolean;
}
```

### **2. Generate with Utilities**

```typescript
import { InterfaceUtils } from 'odata-active-record-core';

const schemas = {
  User: userSchema,
  Post: postSchema,
  Comment: commentSchema
};

const allInterfaces = InterfaceUtils.generateWithAll(schemas);
```

**Output includes:**
- Basic interfaces (`User`, `Post`, `Comment`)
- Input types (`UserInput`, `PostInput`, `CommentInput`)
- Update types (`UserUpdate`, `PostUpdate`, `CommentUpdate`)
- Partial types (`UserPartial`, `PostPartial`, `CommentPartial`)
- Query types (`UserQuery`, `PostQuery`, `CommentQuery`)

### **3. Generate Complete TypeScript File**

```typescript
import { InterfaceUtils } from 'odata-active-record-core';

const file = InterfaceUtils.generateFile(schemas, {
  fileName: 'my-types.ts',
  addImports: true,
  addExports: true,
  addComments: true
});
```

**Output:**
```typescript
/**
 * Auto-generated TypeScript interfaces
 * File: my-types.ts
 * Generated on: 2024-01-15T10:30:00.000Z
 * Source: OData Active Record schemas
 */

// Import types if needed
import type { IEntitySchema } from 'odata-active-record-contracts';

// ... all interfaces ...

// Export all interfaces
export type {
  User,
  Post,
  Comment,
};
```

### **4. CLI Usage**

```bash
# Basic generation (TypeScript)
npx tsx generate-interfaces.ts generate

# Generate JavaScript format
npx tsx generate-interfaces.ts generate --format javascript

# Generate JSX format
npx tsx generate-interfaces.ts generate --format jsx

# Generate to file with specific format
npx tsx generate-interfaces.ts generate --output src/types.js --format javascript

# Generate without comments
npx tsx generate-interfaces.ts generate --no-comments

# Generate without JSDoc
npx tsx generate-interfaces.ts generate --no-jsdoc

# Generate without utilities
npx tsx generate-interfaces.ts generate --no-input --no-update --no-partial --no-query

# Run demonstration
npx tsx generate-interfaces.ts demo
```

### **5. Build Script Integration**

**package.json:**
```json
{
  "scripts": {
    "generate-types": "npx tsx generate-interfaces.ts generate --output src/types.ts",
    "generate-js": "npx tsx generate-interfaces.ts generate --output src/types.js --format javascript",
    "generate-jsx": "npx tsx generate-interfaces.ts generate --output src/types.tsx --format jsx",
    "build": "npm run generate-types && tsc",
    "dev": "npm run generate-types && nodemon"
  }
}
```

**Build script:**
```typescript
import { generateInterfacesFromSchemas } from './generate-interfaces';

// Generate TypeScript
const types = generateInterfacesFromSchemas(mySchemas, {
  outputFile: 'src/types.ts',
  includeUtilities: true,
  format: 'typescript'
});

// Generate JavaScript
const jsTypes = generateInterfacesFromSchemas(mySchemas, {
  outputFile: 'src/types.js',
  includeUtilities: false, // No utilities in JS
  format: 'javascript'
});

// Generate JSX
const jsxTypes = generateInterfacesFromSchemas(mySchemas, {
  outputFile: 'src/types.tsx',
  includeUtilities: true,
  format: 'jsx'
});
```

## **🔧 Advanced Configuration**

### **Interface Generator Options**

```typescript
import { InterfaceGenerator } from 'odata-active-record-core';

const generator = new InterfaceGenerator();

// Generate with specific utilities and format
const result = generator.generateWithUtilities(schemas, {
  includeInputTypes: true,    // Generate input types
  includeUpdateTypes: true,   // Generate update types
  includePartialTypes: true,  // Generate partial types
  includeQueryTypes: true,    // Generate query types
  format: 'typescript',       // Output format
  useTypes: true,            // Use TypeScript types
  useJSDoc: true             // Include JSDoc comments
});
```

### **File Generation Options**

```typescript
const file = generator.generateFile(schemas, {
  fileName: 'my-types',        // Output filename (extension auto-added)
  format: 'typescript',        // Output format: typescript, javascript, jsx
  addImports: true,           // Add import statements
  addExports: true,           // Add export statements
  addComments: true,          // Add file comments
  useTypes: true,            // Use TypeScript types
  useJSDoc: true             // Include JSDoc comments
});
```

### **CLI Options**

```bash
# Output options
--output <file>              # Output file path
--format <type>              # Output format: typescript, javascript, jsx

# Utility type options (TypeScript only)
--no-input                   # Exclude input types
--no-update                  # Exclude update types
--no-partial                 # Exclude partial types
--no-query                   # Exclude query types

# File options
--no-comments                # Exclude file comments
--no-exports                 # Exclude export statements
--no-jsdoc                   # Exclude JSDoc comments
```

## **🎨 Generated Types**

### **TypeScript Interface**
```typescript
export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  isActive: boolean;
}
```

### **JavaScript JSDoc**
```javascript
/** @typedef {Object} User */
/** @type {User} */
const User = {};

export { User };

/**
 * User type definition
 */
/**
 * @property {number} [id] - Primary key, Auto-increment
 * @property {string} firstName - Required
 * @property {string} lastName - Required
 * @property {string} email - Required, Validation: email
 * @property {number} [age] - Validation: min:18
 * @property {boolean} isActive - Required, Default: true
 */
```

### **JSX Interface**
```tsx
export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  isActive: boolean;
}
```

### **TypeScript Utility Types**
```typescript
// Input Type (for create operations)
export type UserInput = Omit<User, 'id'>;

// Update Type (for update operations)
export type UserUpdate = Partial<Omit<User, 'id'>> & { id: number };

// Partial Type (for flexible operations)
export type UserPartial = Partial<User>;

// Query Type (for where clauses)
export type UserQuery = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  age?: number;
  isActive?: boolean;
};
```

## **🚀 Automation Workflows**

### **1. Development Workflow**

```bash
# 1. Define schemas (no interfaces needed)
# 2. Use Active Record with full type safety
# 3. Generate interfaces when needed
npm run generate-types

# 4. Use generated interfaces for external APIs
import { User, UserInput } from './types';
```

### **2. CI/CD Pipeline**

```yaml
# .github/workflows/build.yml
steps:
  - name: Generate Types
    run: npm run generate-types
  
  - name: Build
    run: npm run build
  
  - name: Test
    run: npm test
```

### **3. Pre-commit Hook**

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run generate-types && git add src/types.ts"
    }
  }
}
```

### **4. Watch Mode**

```json
{
  "scripts": {
    "watch-types": "nodemon --watch src/schemas --exec 'npm run generate-types'"
  }
}
```

## **📊 Type Mapping**

| Schema Type | TypeScript/JSX | JavaScript JSDoc | Example |
|-------------|----------------|------------------|---------|
| `string` | `string` | `{string}` | `firstName: string` |
| `number` | `number` | `{number}` | `age: number` |
| `boolean` | `boolean` | `{boolean}` | `isActive: boolean` |
| `date` | `Date` | `{Date}` | `createdAt: Date` |
| `json` | `any` | `{any}` | `preferences: any` |
| `array` | `any[]` | `{Array}` | `tags: any[]` |

## **🔍 Field Comments**

The generator automatically adds helpful comments:

```typescript
export interface User {
  /** Primary key, Auto-increment */
  id?: number;

  /** Required */
  firstName: string;

  /** Required, Validation: email */
  email: string;

  /** Validation: min:18 */
  age?: number;

  /** Required, Default: true */
  isActive: boolean;

  /** Default: {} */
  preferences?: any;
}
```

## **🎯 Best Practices**

### **✅ Recommended Approach**
1. **Start without interfaces** - Active Record works perfectly without them
2. **Generate when needed** - Use for external APIs, documentation, or team contracts
3. **Automate generation** - Include in build scripts for consistency
4. **Keep schemas as source of truth** - Don't maintain interfaces manually
5. **Use utility types** - Leverage generated input/update/partial types

### **✅ When to Generate Interfaces**
- **External API contracts** - Share with other teams
- **Documentation** - Generate API documentation
- **Integration** - Use with other libraries
- **Type safety** - For complex business logic
- **Team communication** - Clear contracts between teams

### **✅ Automation Tips**
- **Generate in build process** - Ensure consistency
- **Version control generated files** - Track changes
- **Use pre-commit hooks** - Prevent manual edits
- **Include in CI/CD** - Validate generated types
- **Watch for schema changes** - Auto-regenerate when needed

## **🏆 Conclusion**

The OData Active Record interface generation system makes it **as easy as possible** to generate interfaces in multiple formats:

- ✅ **Multi-format support** - TypeScript, JavaScript, JSX
- ✅ **One-liner generation** - `quickGen('User', schema, { format: 'javascript' })`
- ✅ **CLI automation** - Perfect for build scripts
- ✅ **Complete files** - Ready to use with proper extensions
- ✅ **Utility types included** - Input, update, partial, query types (TypeScript)
- ✅ **Full automation support** - CI/CD, pre-commit, watch mode
- ✅ **Schema-first approach** - Keep schemas as source of truth
- ✅ **No icons in CLI** - Clean, professional output

**Start without interfaces, generate when needed, automate for consistency!** 🚀
