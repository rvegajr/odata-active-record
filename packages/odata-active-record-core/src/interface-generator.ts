import type { IEntitySchema, IFieldDefinition } from 'odata-active-record-contracts';

/**
 * Interface Generator for OData Active Record
 * Automatically generates TypeScript interfaces from entity schemas
 */
export class InterfaceGenerator {
  private generatedInterfaces: Map<string, string> = new Map();

  /**
   * Generate an interface from an entity schema
   */
  generateInterface(
    entityName: string, 
    schema: IEntitySchema<any>, 
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const {
      format = 'typescript',
      useTypes = format === 'typescript',
      useJSDoc = true
    } = options;

    const interfaceName = this.formatInterfaceName(entityName);
    let interfaceCode = '';

    // Add JSDoc comment
    if (useJSDoc) {
      interfaceCode += `/**\n * Auto-generated interface for ${entityName} entity\n */\n`;
    }

    // Generate interface based on format
    if (format === 'typescript') {
      interfaceCode += `export interface ${interfaceName} {\n`;
    } else if (format === 'javascript') {
      interfaceCode += `/** @typedef {Object} ${interfaceName} */\n`;
      interfaceCode += `/** @type {${interfaceName}} */\n`;
      interfaceCode += `const ${interfaceName} = {};\n\n`;
      interfaceCode += `export { ${interfaceName} };\n\n`;
      interfaceCode += `/**\n * ${interfaceName} type definition\n */\n`;
      interfaceCode += `/**\n`;
    } else if (format === 'jsx') {
      interfaceCode += `export interface ${interfaceName} {\n`;
    }

    // Add ID field if not present in schema
    if (!schema.fields.id) {
      if (useJSDoc) {
        interfaceCode += '  /** Auto-generated primary key */\n';
      }
      if (format === 'typescript' || format === 'jsx') {
        interfaceCode += '  id?: number;\n\n';
      } else if (format === 'javascript') {
        interfaceCode += ' * @property {number} [id] - Auto-generated primary key\n';
      }
    }

    // Generate fields from schema
    Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
      const fieldComment = this.generateFieldComment(fieldDef, format, useJSDoc);
      const fieldType = this.getTypeScriptType(fieldDef);
      const isOptional = fieldDef.nullable || fieldName === 'id';
      const optionalMarker = isOptional ? '?' : '';

      if (format === 'typescript' || format === 'jsx') {
        if (fieldComment) {
          interfaceCode += `  ${fieldComment}\n`;
        }
        interfaceCode += `  ${fieldName}${optionalMarker}: ${fieldType};\n\n`;
      } else if (format === 'javascript') {
        interfaceCode += ` * @property {${fieldType}} ${isOptional ? '[' : ''}${fieldName}${isOptional ? ']' : ''} - ${this.getFieldDescription(fieldDef)}\n`;
      }
    });

    if (format === 'typescript' || format === 'jsx') {
      interfaceCode += '}\n';
    } else if (format === 'javascript') {
      interfaceCode += ' */\n';
    }
    
    // Store the generated interface
    this.generatedInterfaces.set(interfaceName, interfaceCode);
    
    return interfaceCode;
  }

  /**
   * Generate interfaces for multiple entities
   */
  generateInterfaces(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const { format = 'typescript' } = options;
    
    let allInterfaces = `/**\n * Auto-generated interfaces for OData Active Record entities\n * Generated on: ${new Date().toISOString()}\n * Format: ${format}\n */\n\n`;

    Object.entries(entities).forEach(([entityName, schema]) => {
      allInterfaces += this.generateInterface(entityName, schema, options);
      allInterfaces += '\n';
    });

    return allInterfaces;
  }

  /**
   * Generate interfaces from namespace entities
   */
  generateFromNamespace(namespace: any): string {
    const entities: Record<string, IEntitySchema<any>> = {};
    
    // Extract entities from namespace (this would depend on the actual namespace structure)
    if (namespace.entities) {
      Object.entries(namespace.entities).forEach(([name, entity]: [string, any]) => {
        if (entity.schema) {
          entities[name] = entity.schema;
        }
      });
    }

    return this.generateInterfaces(entities);
  }

  /**
   * Generate a complete file with all interfaces
   */
  generateFile(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      fileName?: string;
      format?: 'typescript' | 'javascript' | 'jsx';
      addImports?: boolean;
      addExports?: boolean;
      addComments?: boolean;
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const {
      fileName = 'generated-interfaces.ts',
      format = 'typescript',
      addImports = true,
      addExports = true,
      addComments = true,
      useTypes = format === 'typescript',
      useJSDoc = true
    } = options;

    const fileExtension = format === 'typescript' ? '.ts' : format === 'javascript' ? '.js' : '.tsx';
    const actualFileName = fileName.endsWith(fileExtension) ? fileName : `${fileName}${fileExtension}`;

    let fileContent = '';

    if (addComments) {
      fileContent += `/**\n`;
      fileContent += ` * Auto-generated ${format} interfaces\n`;
      fileContent += ` * File: ${actualFileName}\n`;
      fileContent += ` * Generated on: ${new Date().toISOString()}\n`;
      fileContent += ` * Source: OData Active Record schemas\n`;
      fileContent += ` */\n\n`;
    }

    if (addImports && format === 'typescript') {
      fileContent += `// Import types if needed\n`;
      fileContent += `import type { IEntitySchema } from 'odata-active-record-contracts';\n\n`;
    }

    fileContent += this.generateInterfaces(entities, { format, useTypes, useJSDoc });

    if (addExports && format === 'typescript') {
      fileContent += `\n// Export all interfaces\n`;
      fileContent += `export type {\n`;
      Object.keys(entities).forEach(entityName => {
        const interfaceName = this.formatInterfaceName(entityName);
        fileContent += `  ${interfaceName},\n`;
      });
      fileContent += `};\n`;
    }

    return fileContent;
  }

  /**
   * Generate interfaces with additional utility types
   */
  generateWithUtilities(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      includeInputTypes?: boolean;
      includeUpdateTypes?: boolean;
      includePartialTypes?: boolean;
      includeQueryTypes?: boolean;
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const {
      includeInputTypes = true,
      includeUpdateTypes = true,
      includePartialTypes = true,
      includeQueryTypes = true,
      format = 'typescript',
      useTypes = format === 'typescript',
      useJSDoc = true
    } = options;

    let content = this.generateInterfaces(entities, { format, useTypes, useJSDoc });

    if (includeInputTypes) {
      content += this.generateInputTypes(entities, { format, useTypes, useJSDoc });
    }

    if (includeUpdateTypes) {
      content += this.generateUpdateTypes(entities, { format, useTypes, useJSDoc });
    }

    if (includePartialTypes) {
      content += this.generatePartialTypes(entities, { format, useTypes, useJSDoc });
    }

    if (includeQueryTypes) {
      content += this.generateQueryTypes(entities, { format, useTypes, useJSDoc });
    }

    return content;
  }

  /**
   * Generate input types (for create operations)
   */
  private generateInputTypes(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const { format = 'typescript', useJSDoc = true } = options;
    
    if (format !== 'typescript') {
      return ''; // Only TypeScript supports utility types
    }
    
    let content = '\n/** Input types for create operations */\n';
    
    Object.entries(entities).forEach(([entityName, schema]) => {
      const interfaceName = this.formatInterfaceName(entityName);
      const inputTypeName = `${interfaceName}Input`;
      
      content += `export type ${inputTypeName} = Omit<${interfaceName}, 'id'>;\n`;
    });

    return content;
  }

  /**
   * Generate update types (for update operations)
   */
  private generateUpdateTypes(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const { format = 'typescript' } = options;
    
    if (format !== 'typescript') {
      return ''; // Only TypeScript supports utility types
    }
    
    let content = '\n/** Update types for update operations */\n';
    
    Object.entries(entities).forEach(([entityName, schema]) => {
      const interfaceName = this.formatInterfaceName(entityName);
      const updateTypeName = `${interfaceName}Update`;
      
      content += `export type ${updateTypeName} = Partial<Omit<${interfaceName}, 'id'>> & { id: number };\n`;
    });

    return content;
  }

  /**
   * Generate partial types (for partial updates)
   */
  private generatePartialTypes(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const { format = 'typescript' } = options;
    
    if (format !== 'typescript') {
      return ''; // Only TypeScript supports utility types
    }
    
    let content = '\n/** Partial types for flexible operations */\n';
    
    Object.entries(entities).forEach(([entityName, schema]) => {
      const interfaceName = this.formatInterfaceName(entityName);
      const partialTypeName = `${interfaceName}Partial`;
      
      content += `export type ${partialTypeName} = Partial<${interfaceName}>;\n`;
    });

    return content;
  }

  /**
   * Generate query types (for where clauses)
   */
  private generateQueryTypes(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const { format = 'typescript' } = options;
    
    if (format !== 'typescript') {
      return ''; // Only TypeScript supports utility types
    }
    
    let content = '\n/** Query types for where clauses */\n';
    
    Object.entries(entities).forEach(([entityName, schema]) => {
      const interfaceName = this.formatInterfaceName(entityName);
      const queryTypeName = `${interfaceName}Query`;
      
      content += `export type ${queryTypeName} = {\n`;
      Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
        const fieldType = this.getTypeScriptType(fieldDef);
        content += `  ${fieldName}?: ${fieldType};\n`;
      });
      content += `};\n`;
    });

    return content;
  }

  /**
   * Get TypeScript type from field definition
   */
  private getTypeScriptType(fieldDef: IFieldDefinition): string {
    switch (fieldDef.type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'Date';
      case 'json':
        return 'any';
      case 'array':
        return 'any[]';
      default:
        return 'unknown';
    }
  }

  /**
   * Generate field comment from field definition
   */
  private generateFieldComment(
    fieldDef: IFieldDefinition, 
    format: 'typescript' | 'javascript' | 'jsx' = 'typescript',
    useJSDoc: boolean = true
  ): string {
    if (!useJSDoc) return '';
    
    const comments: string[] = [];

    if (fieldDef.primary) {
      comments.push('Primary key');
    }

    if (fieldDef.autoIncrement) {
      comments.push('Auto-increment');
    }

    if (fieldDef.nullable === false) {
      comments.push('Required');
    }

    if (fieldDef.defaultValue !== undefined) {
      comments.push(`Default: ${JSON.stringify(fieldDef.defaultValue)}`);
    }

    if (fieldDef.validation) {
      comments.push(`Validation: ${fieldDef.validation}`);
    }

    if (comments.length === 0) {
      return '';
    }

    return `  /** ${comments.join(', ')} */`;
  }

  /**
   * Get field description for JSDoc
   */
  private getFieldDescription(fieldDef: IFieldDefinition): string {
    const descriptions: string[] = [];

    if (fieldDef.primary) {
      descriptions.push('Primary key');
    }

    if (fieldDef.autoIncrement) {
      descriptions.push('Auto-increment');
    }

    if (fieldDef.nullable === false) {
      descriptions.push('Required');
    }

    if (fieldDef.defaultValue !== undefined) {
      descriptions.push(`Default: ${JSON.stringify(fieldDef.defaultValue)}`);
    }

    if (fieldDef.validation) {
      descriptions.push(`Validation: ${fieldDef.validation}`);
    }

    return descriptions.length > 0 ? descriptions.join(', ') : 'Field';
  }

  /**
   * Format entity name to interface name
   */
  private formatInterfaceName(entityName: string): string {
    // Convert to PascalCase
    return entityName.charAt(0).toUpperCase() + entityName.slice(1);
  }

  /**
   * Get all generated interfaces
   */
  getAllGeneratedInterfaces(): Map<string, string> {
    return new Map(this.generatedInterfaces);
  }

  /**
   * Clear generated interfaces
   */
  clearGeneratedInterfaces(): void {
    this.generatedInterfaces.clear();
  }
}

/**
 * CLI-friendly interface generator
 */
export class CLIInterfaceGenerator extends InterfaceGenerator {
  /**
   * Generate interfaces from command line arguments
   */
  generateFromCLI(args: {
    input?: string;
    output?: string;
    entities?: Record<string, IEntitySchema<any>>;
    options?: any;
  }): string {
    const { entities = {}, options = {} } = args;
    
    if (Object.keys(entities).length === 0) {
      throw new Error('No entities provided for interface generation');
    }

    return this.generateWithUtilities(entities, options);
  }

  /**
   * Generate and save to file
   */
  generateAndSave(
    entities: Record<string, IEntitySchema<any>>,
    outputPath: string,
    options: any = {}
  ): void {
    const content = this.generateWithUtilities(entities, options);
    
    // In a real implementation, this would write to file
    console.log(`Generated interfaces for ${Object.keys(entities).length} entities`);
    console.log(`Output would be saved to: ${outputPath}`);
    console.log(`Content length: ${content.length} characters`);
  }
}

/**
 * Utility functions for easy interface generation
 */
export const InterfaceUtils = {
  /**
   * Quick interface generation from a single entity
   */
  quickGenerate(
    entityName: string, 
    schema: IEntitySchema<any>,
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const generator = new InterfaceGenerator();
    return generator.generateInterface(entityName, schema, options);
  },

  /**
   * Generate interfaces from namespace
   */
  fromNamespace(
    namespace: any,
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const generator = new InterfaceGenerator();
    return generator.generateFromNamespace(namespace);
  },

  /**
   * Generate complete file
   */
  generateFile(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      fileName?: string;
      format?: 'typescript' | 'javascript' | 'jsx';
      addImports?: boolean;
      addExports?: boolean;
      addComments?: boolean;
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const generator = new InterfaceGenerator();
    return generator.generateFile(entities, options);
  },

  /**
   * Generate with all utilities
   */
  generateWithAll(
    entities: Record<string, IEntitySchema<any>>,
    options: {
      format?: 'typescript' | 'javascript' | 'jsx';
      useTypes?: boolean;
      useJSDoc?: boolean;
    } = {}
  ): string {
    const generator = new InterfaceGenerator();
    return generator.generateWithUtilities(entities, {
      includeInputTypes: true,
      includeUpdateTypes: true,
      includePartialTypes: true,
      includeQueryTypes: true,
      ...options
    });
  }
};
