#!/usr/bin/env node

import { InterfaceGenerator, InterfaceUtils, CLIInterfaceGenerator } from './interface-generator';
import type { IEntitySchema } from 'odata-active-record-contracts';

/**
 * CLI Interface Generator Tool
 * Usage: npx tsx generate-interfaces.ts [options]
 */

// Example schemas for demonstration
const exampleSchemas: Record<string, IEntitySchema<any>> = {
  User: {
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
        nullable: false,
        validation: [{ 
          name: 'email',
          type: 'pattern',
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Must be a valid email address'
        }]
      },
      age: {
        name: 'age',
        type: 'number',
        nullable: true,
        validation: [{ 
          name: 'minAge',
          type: 'min',
          value: 18,
          message: 'Age must be at least 18'
        }]
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
  },
  Post: {
    name: 'Post',
    fields: {
      title: {
        name: 'title',
        type: 'string',
        nullable: false
      },
      content: {
        name: 'content',
        type: 'string',
        nullable: false
      },
      publishedAt: {
        name: 'publishedAt',
        type: 'date',
        nullable: true
      },
      isPublished: {
        name: 'isPublished',
        type: 'boolean',
        nullable: false,
        defaultValue: false
      },
      viewCount: {
        name: 'viewCount',
        type: 'number',
        nullable: false,
        defaultValue: 0
      },
      tags: {
        name: 'tags',
        type: 'json',
        nullable: true,
        defaultValue: []
      },
      authorId: {
        name: 'authorId',
        type: 'number',
        nullable: false
      }
    }
  },
  Comment: {
    name: 'Comment',
    fields: {
      content: {
        name: 'content',
        type: 'string',
        nullable: false
      },
      authorName: {
        name: 'authorName',
        type: 'string',
        nullable: false
      },
      authorEmail: {
        name: 'authorEmail',
        type: 'string',
        nullable: false,
        validation: [{ 
          name: 'email',
          type: 'pattern',
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Must be a valid email address'
        }]
      },
      isApproved: {
        name: 'isApproved',
        type: 'boolean',
        nullable: false,
        defaultValue: false
      },
      createdAt: {
        name: 'createdAt',
        type: 'date',
        nullable: false,
        defaultValue: () => new Date()
      },
      postId: {
        name: 'postId',
        type: 'number',
        nullable: false
      }
    }
  }
};

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('OData Active Record Interface Generator\n');

  switch (command) {
    case 'generate':
    case 'gen':
      generateInterfaces(args.slice(1));
      break;
    case 'demo':
      runDemo();
      break;
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
    default:
      console.log('Unknown command. Use "help" to see available commands.');
      process.exit(1);
  }
}

/**
 * Generate interfaces based on CLI arguments
 */
function generateInterfaces(args: string[]) {
  const options = parseArgs(args);
  
  try {
    const generator = new CLIInterfaceGenerator();
    const content = generator.generateWithUtilities(exampleSchemas, options);
    
    if (options.output) {
      generator.generateAndSave(exampleSchemas, options.output, options);
    } else {
      console.log(content);
    }
  } catch (error) {
    console.error('❌ Error generating interfaces:', error);
    process.exit(1);
  }
}

/**
 * Run demonstration
 */
function runDemo() {
  console.log('INTERFACE GENERATION DEMONSTRATION\n');

  // 1. Quick generation
  console.log('1. QUICK INTERFACE GENERATION:');
  console.log('=' .repeat(50));
  const quickInterface = InterfaceUtils.quickGenerate('User', exampleSchemas.User!);
  console.log(quickInterface);

  // 2. Generate with utilities
  console.log('\n2. GENERATE WITH UTILITIES:');
  console.log('=' .repeat(50));
  const withUtilities = InterfaceUtils.generateWithAll(exampleSchemas);
  console.log(withUtilities);

  // 3. Generate complete file
  console.log('\n3. GENERATE COMPLETE TYPESCRIPT FILE:');
  console.log('=' .repeat(50));
  const completeFile = InterfaceUtils.generateFile(exampleSchemas, {
    fileName: 'my-interfaces.ts',
    addImports: true,
    addExports: true,
    addComments: true
  });
  console.log(completeFile);

  // 4. Show different formats
  console.log('\n4. DIFFERENT FORMATS:');
  console.log('=' .repeat(50));
  
  const generator = new InterfaceGenerator();
  
  console.log('TypeScript format:');
  console.log(generator.generateInterface('User', exampleSchemas.User!, { format: 'typescript' }));
  
  console.log('\nJavaScript format:');
  console.log(generator.generateInterface('User', exampleSchemas.User!, { format: 'javascript' }));
  
  console.log('\nJSX format:');
  console.log(generator.generateInterface('User', exampleSchemas.User!, { format: 'jsx' }));

  // 5. Show different generation options
  console.log('\n5. GENERATION OPTIONS:');
  console.log('=' .repeat(50));
  
  console.log('Basic interfaces only:');
  console.log(generator.generateInterfaces(exampleSchemas));
  
  console.log('\nWith input types:');
  console.log(generator.generateWithUtilities(exampleSchemas, { includeInputTypes: true }));
  
  console.log('\nWith all utility types:');
  console.log(generator.generateWithUtilities(exampleSchemas, {
    includeInputTypes: true,
    includeUpdateTypes: true,
    includePartialTypes: true,
    includeQueryTypes: true
  }));
}

/**
 * Show help information
 */
function showHelp() {
  console.log('OData Active Record Interface Generator Help\n');
  
  console.log('USAGE:');
  console.log('  npx tsx generate-interfaces.ts <command> [options]\n');
  
  console.log('COMMANDS:');
  console.log('  generate, gen    Generate interfaces from schemas');
  console.log('  demo             Run demonstration with example schemas');
  console.log('  help             Show this help message\n');
  
  console.log('OPTIONS:');
  console.log('  --output <file>  Output file path');
  console.log('  --format <type>  Output format: typescript, javascript, jsx');
  console.log('  --no-input       Exclude input types');
  console.log('  --no-update      Exclude update types');
  console.log('  --no-partial     Exclude partial types');
  console.log('  --no-query       Exclude query types');
  console.log('  --no-comments    Exclude comments');
  console.log('  --no-exports     Exclude export statements');
  console.log('  --no-jsdoc       Exclude JSDoc comments\n');
  
  console.log('EXAMPLES:');
  console.log('  # Generate basic interfaces');
  console.log('  npx tsx generate-interfaces.ts generate');
  console.log('');
  console.log('  # Generate JavaScript format');
  console.log('  npx tsx generate-interfaces.ts generate --format javascript');
  console.log('');
  console.log('  # Generate JSX format');
  console.log('  npx tsx generate-interfaces.ts generate --format jsx');
  console.log('');
  console.log('  # Generate with all utilities');
  console.log('  npx tsx generate-interfaces.ts generate --output types.ts');
  console.log('');
  console.log('  # Generate without comments');
  console.log('  npx tsx generate-interfaces.ts generate --no-comments');
  console.log('');
  console.log('  # Run demonstration');
  console.log('  npx tsx generate-interfaces.ts demo\n');
  
  console.log('FEATURES:');
  console.log('  - Automatic interface generation from schemas');
  console.log('  - Multiple output formats: TypeScript, JavaScript, JSX');
  console.log('  - Input, update, partial, and query types');
  console.log('  - File generation with proper extensions');
  console.log('  - CLI-friendly interface');
  console.log('  - Comprehensive documentation');
  console.log('  - Field validation and constraints');
  console.log('  - Auto-generated comments');
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): any {
  const options: any = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
        options.output = args[++i];
        break;
      case '--format':
        const format = args[++i];
        if (format && ['typescript', 'javascript', 'jsx'].includes(format)) {
          options.format = format;
        } else {
          console.error('Invalid format. Use: typescript, javascript, or jsx');
          process.exit(1);
        }
        break;
      case '--no-input':
        options.includeInputTypes = false;
        break;
      case '--no-update':
        options.includeUpdateTypes = false;
        break;
      case '--no-partial':
        options.includePartialTypes = false;
        break;
      case '--no-query':
        options.includeQueryTypes = false;
        break;
      case '--no-comments':
        options.addComments = false;
        break;
      case '--no-exports':
        options.addExports = false;
        break;
      case '--no-jsdoc':
        options.useJSDoc = false;
        break;
    }
  }
  
  return options;
}

/**
 * Easy-to-use function for programmatic interface generation
 */
export function generateInterfacesFromSchemas(
  schemas: Record<string, IEntitySchema<any>>,
  options: {
    outputFile?: string;
    includeUtilities?: boolean;
    addComments?: boolean;
    addExports?: boolean;
    format?: 'typescript' | 'javascript' | 'jsx';
    useTypes?: boolean;
    useJSDoc?: boolean;
  } = {}
): string {
  const {
    includeUtilities = true,
    addComments = true,
    addExports = true,
    format = 'typescript',
    useTypes = format === 'typescript',
    useJSDoc = true
  } = options;

  const generator = new InterfaceGenerator();
  
  if (includeUtilities) {
    return generator.generateWithUtilities(schemas, {
      includeInputTypes: true,
      includeUpdateTypes: true,
      includePartialTypes: true,
      includeQueryTypes: true,
      format,
      useTypes,
      useJSDoc
    });
  } else {
    return generator.generateFile(schemas, {
      addComments,
      addExports,
      format,
      useTypes,
      useJSDoc
    });
  }
}

/**
 * One-liner for quick interface generation
 */
export function quickGen(
  entityName: string, 
  schema: IEntitySchema<any>,
  options: {
    format?: 'typescript' | 'javascript' | 'jsx';
    useTypes?: boolean;
    useJSDoc?: boolean;
  } = {}
): string {
  return InterfaceUtils.quickGenerate(entityName, schema, options);
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}
