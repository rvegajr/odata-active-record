import type { 
  ISQLiteProvider, 
  IConnectionResult, 
  IConnectionStats, 
  IQueryResult, 
  ICreateResult, 
  IReadResult, 
  IUpdateResult, 
  IDeleteResult, 
  ISQLResult, 
  ITableSchemaResult,
  IEntityMetadataResult,
  IServiceDocumentResult,
  IMetadataDocumentResult,
  ISQLiteDatabaseStats,
  ITransactionHandle,
  IUserFriendlyError
} from 'odata-active-record-contracts';

/**
 * Real SQLite Provider Implementation
 */
export class SQLiteProvider implements ISQLiteProvider {
  private database: any;
  private connected = false;
  private connectionStartTime = Date.now();
  private totalQueries = 0;
  private queryTimes: number[] = [];
  private filePath: string;
  private options: any;

  constructor(filePath: string, options: any = {}) {
    this.filePath = filePath;
    this.options = options;
  }

  getName(): string {
    return 'SQLite';
  }

  isConnected(): boolean {
    return this.connected && this.database && this.database.open;
  }

  async connect(): Promise<IConnectionResult> {
    try {
      const startTime = Date.now();
      
      // Dynamic import to avoid bundling issues
      const Database = (await import('better-sqlite3')).default;
      
      this.database = new Database(this.filePath, {
        ...this.options,
        verbose: console.log,
        fileMustExist: false
      });

      // Enable WAL mode for better concurrency
      this.database.pragma('journal_mode = WAL');
      
      // Enable foreign keys
      this.database.pragma('foreign_keys = ON');
      
      this.connected = true;

      const connectionTime = Date.now() - startTime;

      // Test the connection
      const result = this.database.prepare('SELECT sqlite_version() as version').get();

      return {
        success: true,
        details: {
          connectionString: this.filePath,
          databaseName: this.filePath,
          connectionTime,
          version: result.version
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'CONNECTION_FAILED',
          message: `Failed to connect to SQLite: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          suggestion: 'Check if the file path is valid, ensure write permissions to the directory, verify SQLite is properly installed, and check if the database file is corrupted',
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.database) {
      this.database.close();
      this.connected = false;
    }
  }

  async testConnection(): Promise<IConnectionResult> {
    try {
      const startTime = Date.now();
      
      if (!this.isConnected()) {
        return {
          success: false,
                  errors: [{
          code: 'NOT_CONNECTED',
          message: 'SQLite provider is not connected',
          suggestion: 'Call connect() method first',
          severity: 'error',
          actionable: true
        }]
        };
      }

      const result = this.database.prepare('SELECT 1 as test').get();
      const connectionTime = Date.now() - startTime;

      return {
        success: true,
        details: {
          connectionString: this.filePath,
          databaseName: this.filePath,
          connectionTime,
          version: this.database.prepare('SELECT sqlite_version() as version').get().version
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'CONNECTION_TEST_FAILED',
          message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  getConnectionStats(): IConnectionStats {
    const uptime = this.connected ? Date.now() - this.connectionStartTime : 0;
    const averageQueryTime = this.queryTimes.length > 0 
      ? this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length 
      : 0;

    return {
      connected: this.isConnected(),
      uptime,
      activeConnections: this.isConnected() ? 1 : 0,
      totalQueries: this.totalQueries,
      averageQueryTime,
      lastConnectionAttempt: new Date(),
      lastSuccessfulConnection: this.connected ? new Date() : new Date(0)
    };
  }

  async executeQuery<T = Record<string, unknown>>(
    entityName: string,
    query: any
  ): Promise<IQueryResult<T>> {
    try {
      this.totalQueries++;
      const startTime = Date.now();

      let sql = `SELECT * FROM ${entityName}`;
      const params: any[] = [];

      // Handle filtering
      if (query.filter) {
        const whereClause = this.convertODataFilterToSQL(query.filter, params);
        sql += ` WHERE ${whereClause}`;
      }

      // Handle field selection
      if (query.select?.fields) {
        const fields = query.select.fields.join(', ');
        sql = sql.replace('*', fields);
      }

      // Handle sorting
      if (query.orderBy) {
        const orderClause = query.orderBy
          .map((order: any) => `${order.field} ${order.direction.toUpperCase()}`)
          .join(', ');
        sql += ` ORDER BY ${orderClause}`;
      }

      // Handle pagination
      if (query.pagination) {
        sql += ` LIMIT ${query.pagination.take || 50}`;
        if (query.pagination.skip) {
          sql += ` OFFSET ${query.pagination.skip}`;
        }
      }

      const stmt = this.database.prepare(sql);
      const data = stmt.all(...params);
      const count = this.database.prepare(`SELECT COUNT(*) as count FROM ${entityName}`).get().count;

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        data: data as T[],
        success: true,
        metadata: {
          count,
          executionTime,
          cacheStatus: 'miss'
        }
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        errors: [{
          code: 'QUERY_EXECUTION_FAILED',
          message: `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }],
        metadata: {
          count: 0,
          executionTime: 0,
          cacheStatus: 'miss'
        }
      };
    }
  }

  async getEntityMetadata(entityName: string): Promise<IEntityMetadataResult> {
    try {
      const tableInfo = this.database.prepare(`
        PRAGMA table_info(${entityName})
      `).all();

      const schema = {
        name: entityName,
        fields: tableInfo.reduce((acc: any, column: any) => {
          acc[column.name] = {
            name: column.name,
            type: this.mapSQLiteTypeToOData(column.type),
            nullable: !column.notnull,
            primaryKey: column.pk === 1,
            autoIncrement: column.pk === 1 && column.type.toLowerCase().includes('integer')
          };
          return acc;
        }, {})
      };

      return {
        success: true,
        metadata: schema
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'METADATA_RETRIEVAL_FAILED',
          message: `Failed to retrieve metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async getServiceDocument(): Promise<IServiceDocumentResult> {
    try {
      const tables = this.database.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();

      const entitySets = tables.map((table: any) => table.name);

      return {
        success: true,
        serviceDocument: {
          entitySets,
          capabilities: {
            supportsFilter: true,
            supportsOrderBy: true,
            supportsSelect: true,
            supportsPagination: true
          },
          metadata: {
            databaseName: this.filePath,
            tableCount: entitySets.length
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'SERVICE_DOCUMENT_FAILED',
          message: `Failed to get service document: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async getMetadataDocument(): Promise<IMetadataDocumentResult> {
    try {
      const tables = this.database.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();

      let metadataXml = '<?xml version="1.0" encoding="utf-8"?>\n';
      metadataXml += '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">\n';
      metadataXml += '  <edmx:DataServices>\n';
      metadataXml += '    <Schema Namespace="Default" xmlns="http://docs.oasis-open.org/odata/ns/edm">\n';
      
      for (const table of tables) {
        const tableInfo = this.database.prepare(`PRAGMA table_info(${table.name})`).all();
        
        metadataXml += `      <EntityType Name="${table.name}">\n`;
        metadataXml += '        <Key>\n';
        
        // Find primary key
        const primaryKey = tableInfo.find((col: any) => col.pk === 1);
        if (primaryKey) {
          metadataXml += `          <PropertyRef Name="${primaryKey.name}" />\n`;
        }
        
        metadataXml += '        </Key>\n';
        
        // Add properties
        for (const column of tableInfo) {
          const odataType = this.mapSQLiteTypeToOData(column.type);
          metadataXml += `        <Property Name="${column.name}" Type="Edm.${odataType}" Nullable="${column.notnull ? 'false' : 'true'}" />\n`;
        }
        
        metadataXml += '      </EntityType>\n';
      }
      
      metadataXml += '    </Schema>\n';
      metadataXml += '  </edmx:DataServices>\n';
      metadataXml += '</edmx:Edmx>';

      return {
        success: true,
        metadataDocument: metadataXml
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'METADATA_DOCUMENT_FAILED',
          message: `Failed to get metadata document: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async create<T = Record<string, unknown>>(
    entityName: string,
    data: Partial<T>
  ): Promise<ICreateResult<T>> {
    try {
      this.totalQueries++;
      const startTime = Date.now();

      const columns = Object.keys(data);
      const placeholders = columns.map(() => '?').join(', ');
      const values = Object.values(data).map(value => {
        // Convert Date objects to ISO strings
        if (value instanceof Date) {
          return value.toISOString();
        }
        // Convert booleans to integers
        if (typeof value === 'boolean') {
          return value ? 1 : 0;
        }
        return value;
      });

      const sql = `INSERT INTO ${entityName} (${columns.join(', ')}) VALUES (${placeholders})`;
      const stmt = this.database.prepare(sql);
      const result = stmt.run(...values);

      // Get the inserted record
      const insertedRecord = this.database.prepare(`SELECT * FROM ${entityName} WHERE rowid = ?`).get(result.lastInsertRowid);

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        data: insertedRecord as T,
        success: true,
        id: result.lastInsertRowid,
        metadata: {
          executionTime,
          created: true
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'CREATE_FAILED',
          message: `Failed to create record: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async read<T = Record<string, unknown>>(
    entityName: string,
    query?: any
  ): Promise<IReadResult<T>> {
    try {
      this.totalQueries++;
      const startTime = Date.now();

      let sql = `SELECT * FROM ${entityName}`;
      const params: any[] = [];

      if (query?.filter) {
        const whereClause = this.convertODataFilterToSQL(query.filter, params);
        sql += ` WHERE ${whereClause}`;
      }

      const stmt = this.database.prepare(sql);
      const data = stmt.all(...params);
      const totalCount = this.database.prepare(`SELECT COUNT(*) as count FROM ${entityName}`).get().count;

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        data: data as T[],
        success: true,
        metadata: {
          totalCount,
          executionTime,
          cached: false
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'READ_FAILED',
          message: `Failed to read records: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async update<T = Record<string, unknown>>(
    entityName: string,
    id: any,
    data: Partial<T>
  ): Promise<IUpdateResult<T>> {
    try {
      this.totalQueries++;
      const startTime = Date.now();

      const columns = Object.keys(data);
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const values = [
        ...Object.values(data).map(value => {
          // Convert Date objects to ISO strings
          if (value instanceof Date) {
            return value.toISOString();
          }
          // Convert booleans to integers
          if (typeof value === 'boolean') {
            return value ? 1 : 0;
          }
          return value;
        }), 
        id
      ];

      const sql = `UPDATE ${entityName} SET ${setClause} WHERE rowid = ?`;
      const stmt = this.database.prepare(sql);
      const result = stmt.run(...values);

      // Get the updated record
      const updatedRecord = this.database.prepare(`SELECT * FROM ${entityName} WHERE rowid = ?`).get(id);

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        data: updatedRecord as T,
        success: true,
        metadata: {
          executionTime,
          updated: true,
          affectedCount: result.changes
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'UPDATE_FAILED',
          message: `Failed to update record: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async delete(entityName: string, id: any): Promise<IDeleteResult> {
    try {
      this.totalQueries++;
      const startTime = Date.now();

      const sql = `DELETE FROM ${entityName} WHERE rowid = ?`;
      const stmt = this.database.prepare(sql);
      const result = stmt.run(id);

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        success: true,
        metadata: {
          executionTime,
          deleted: true,
          affectedCount: result.changes
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'DELETE_FAILED',
          message: `Failed to delete record: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async exists(entityName: string, id: any): Promise<boolean> {
    try {
      const result = this.database.prepare(`SELECT 1 FROM ${entityName} WHERE rowid = ?`).get(id);
      return result !== undefined;
    } catch (error) {
      return false;
    }
  }

  getDatabase(): any {
    return this.database;
  }

  async executeSQL(sql: string, params?: any[]): Promise<ISQLResult> {
    try {
      this.totalQueries++;
      const startTime = Date.now();

      const stmt = this.database.prepare(sql);
      const result = stmt.run(...(params || []));

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        success: true,
        data: [],
        metadata: {
          executionTime,
          rowsAffected: result.changes,
          lastInsertId: result.lastInsertRowid
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'SQL_EXECUTION_FAILED',
          message: `SQL execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async createTable(tableName: string, schema: any): Promise<void> {
    try {
      const columns = Object.entries(schema.fields).map(([name, field]: [string, any]) => {
        const sqliteType = this.mapODataTypeToSQLite(field.type);
        let columnDef = `${name} ${sqliteType}`;
        
        if (field.primaryKey) {
          columnDef += ' PRIMARY KEY';
          if (field.autoIncrement) {
            columnDef += ' AUTOINCREMENT';
          }
        } else if (field.autoIncrement) {
          // For non-primary auto-increment fields, use INTEGER PRIMARY KEY
          columnDef = `${name} INTEGER PRIMARY KEY AUTOINCREMENT`;
        }
        
        if (!field.nullable) {
          columnDef += ' NOT NULL';
        }
        
        if (field.defaultValue !== undefined) {
          if (typeof field.defaultValue === 'function') {
            // Skip function defaults for now
          } else if (typeof field.defaultValue === 'string') {
            columnDef += ` DEFAULT '${field.defaultValue}'`;
          } else {
            columnDef += ` DEFAULT ${field.defaultValue}`;
          }
        }
        
        return columnDef;
      });

      const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')})`;
      this.database.prepare(sql).run();
    } catch (error) {
      throw new Error(`Failed to create table: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async dropTable(tableName: string): Promise<void> {
    try {
      const sql = `DROP TABLE IF EXISTS ${tableName}`;
      this.database.prepare(sql).run();
    } catch (error) {
      throw new Error(`Failed to drop table: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTableSchema(tableName: string): Promise<ITableSchemaResult> {
    try {
      const tableInfo = this.database.prepare(`PRAGMA table_info(${tableName})`).all();
      const indexes = this.database.prepare(`PRAGMA index_list(${tableName})`).all();

      const columns = tableInfo.map((col: any) => ({
        name: col.name,
        type: col.type,
        nullable: !col.notnull,
        defaultValue: col.dflt_value,
        primaryKey: col.pk === 1,
        autoIncrement: col.pk === 1 && col.type.toLowerCase().includes('integer')
      }));

      const primaryKeys = tableInfo.filter((col: any) => col.pk === 1).map((col: any) => col.name);

      return {
        success: true,
        schema: {
          columns,
          primaryKeys,
          foreignKeys: [], // SQLite doesn't expose foreign key info easily
          indexes: indexes.map((idx: any) => ({
            name: idx.name,
            columns: [idx.name], // Simplified
            unique: idx.unique === 1
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'SCHEMA_RETRIEVAL_FAILED',
          message: `Failed to retrieve table schema: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async beginTransaction(): Promise<ITransactionHandle> {
    try {
      this.database.prepare('BEGIN TRANSACTION').run();
      
      return {
        commit: async () => {
          this.database.prepare('COMMIT').run();
        },
        rollback: async () => {
          this.database.prepare('ROLLBACK').run();
        },
        isActive: () => {
          // SQLite doesn't provide a direct way to check transaction status
          // This is a simplified implementation
          return true;
        }
      };
    } catch (error) {
      throw new Error(`Failed to begin transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDatabaseStats(): Promise<ISQLiteDatabaseStats> {
    try {
      const tables = this.database.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all();

      let totalRows = 0;
      for (const table of tables) {
        const count = this.database.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get().count;
        totalRows += count;
      }

      const pageCount = this.database.prepare('PRAGMA page_count').get().page_count;
      const pageSize = this.database.prepare('PRAGMA page_size').get().page_size;

      return {
        fileSize: pageCount * pageSize,
        tableCount: tables.length,
        totalRows,
        pageCount,
        pageSize,
        readOnly: false // SQLite doesn't provide this info easily
      };
    } catch (error) {
      throw new Error(`Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private convertODataFilterToSQL(filter: any, params: any[]): string {
    if (!filter) return '1=1';

    const { field, operator, value } = filter;
    const paramIndex = params.length;

    switch (operator) {
      case 'eq':
        params.push(value);
        return `${field} = ?`;
      case 'ne':
        params.push(value);
        return `${field} != ?`;
      case 'gt':
        params.push(value);
        return `${field} > ?`;
      case 'ge':
        params.push(value);
        return `${field} >= ?`;
      case 'lt':
        params.push(value);
        return `${field} < ?`;
      case 'le':
        params.push(value);
        return `${field} <= ?`;
      case 'contains':
        params.push(`%${value}%`);
        return `${field} LIKE ?`;
      case 'startswith':
        params.push(`${value}%`);
        return `${field} LIKE ?`;
      case 'endswith':
        params.push(`%${value}`);
        return `${field} LIKE ?`;
      case 'in':
        const placeholders = Array.isArray(value) ? value.map(() => '?') : ['?'];
        params.push(...(Array.isArray(value) ? value : [value]));
        return `${field} IN (${placeholders.join(', ')})`;
      case 'notin':
        const notInPlaceholders = Array.isArray(value) ? value.map(() => '?') : ['?'];
        params.push(...(Array.isArray(value) ? value : [value]));
        return `${field} NOT IN (${notInPlaceholders.join(', ')})`;
      default:
        params.push(value);
        return `${field} = ?`;
    }
  }

  private mapSQLiteTypeToOData(sqliteType: string): string {
    const type = sqliteType.toLowerCase();
    if (type.includes('int') || type.includes('integer')) return 'Int32';
    if (type.includes('real') || type.includes('float') || type.includes('double')) return 'Double';
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'String';
    if (type.includes('blob')) return 'Binary';
    if (type.includes('bool')) return 'Boolean';
    return 'String';
  }

  private mapODataTypeToSQLite(odataType: string): string {
    switch (odataType.toLowerCase()) {
      case 'int32':
      case 'int64':
        return 'INTEGER';
      case 'double':
      case 'decimal':
        return 'REAL';
      case 'string':
        return 'TEXT';
      case 'boolean':
        return 'BOOLEAN';
      case 'date':
      case 'datetime':
        return 'TEXT';
      case 'binary':
        return 'BLOB';
      default:
        return 'TEXT';
    }
  }
}
