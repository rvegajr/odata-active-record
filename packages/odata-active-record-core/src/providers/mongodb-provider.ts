import type { 
  IMongoDBProvider, 
  IConnectionResult, 
  IConnectionStats, 
  IQueryResult, 
  ICreateResult, 
  IReadResult, 
  IUpdateResult, 
  IDeleteResult, 
  IAggregationResult, 
  IMongoCollectionStats,
  IEntityMetadataResult,
  IServiceDocumentResult,
  IMetadataDocumentResult,
  IUserFriendlyError
} from 'odata-active-record-contracts';

/**
 * Real MongoDB Provider Implementation
 */
export class MongoDBProvider implements IMongoDBProvider {
  private client: any;
  private database: any;
  private connected = false;
  private connectionStartTime = Date.now();
  private totalQueries = 0;
  private queryTimes: number[] = [];
  private connectionString: string;
  private databaseName: string;
  private options: any;

  constructor(connectionString: string, databaseName: string, options: any = {}) {
    this.connectionString = connectionString;
    this.databaseName = databaseName;
    this.options = options;
  }

  getName(): string {
    return 'MongoDB';
  }

  isConnected(): boolean {
    return this.connected && this.client?.topology?.isConnected();
  }

  async connect(): Promise<IConnectionResult> {
    try {
      const startTime = Date.now();
      
      // Dynamic import to avoid bundling issues
      const { MongoClient } = await import('mongodb');
      
      this.client = new MongoClient(this.connectionString, {
        ...this.options,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.database = this.client.db(this.databaseName);
      this.connected = true;

      const connectionTime = Date.now() - startTime;

      // Test the connection
      await this.database.admin().ping();

      return {
        success: true,
        details: {
          connectionString: this.connectionString,
          databaseName: this.databaseName,
          connectionTime,
          version: await this.getServerVersion()
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'CONNECTION_FAILED',
          message: `Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          suggestion: 'Check if MongoDB server is running, verify connection string format, ensure network connectivity, and check authentication credentials',
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
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
            message: 'MongoDB provider is not connected',
            suggestion: 'Call connect() method first',
            severity: 'error',
            actionable: true
          }]
        };
      }

      await this.database.admin().ping();
      const connectionTime = Date.now() - startTime;

      return {
        success: true,
        details: {
          connectionString: this.connectionString,
          databaseName: this.databaseName,
          connectionTime,
          version: await this.getServerVersion()
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

      const collection = this.database.collection(entityName);
      let mongoQuery: any = {};

      // Convert OData query to MongoDB query
      if (query.filter) {
        mongoQuery = this.convertODataFilterToMongo(query.filter);
      }

      // Handle select fields
      let projection: any = {};
      if (query.select?.fields) {
        query.select.fields.forEach((field: string) => {
          projection[field] = 1;
        });
        if (!query.select.exclude) {
          projection._id = 0; // Exclude _id by default unless explicitly included
        }
      }

      // Handle sorting
      let sort: any = {};
      if (query.orderBy) {
        query.orderBy.forEach((order: any) => {
          sort[order.field] = order.direction === 'asc' ? 1 : -1;
        });
      }

      // Handle pagination
      const limit = query.pagination?.take || 50;
      const skip = query.pagination?.skip || 0;

      // Execute query
      const cursor = collection.find(mongoQuery, { projection });
      
      if (Object.keys(sort).length > 0) {
        cursor.sort(sort);
      }
      
      if (skip > 0) {
        cursor.skip(skip);
      }
      
      if (limit > 0) {
        cursor.limit(limit);
      }

      const data = await cursor.toArray();
      const count = await collection.countDocuments(mongoQuery);

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
      const collection = this.database.collection(entityName);
      
      // Get collection stats
      const stats = await collection.stats();
      
      // Get sample document to infer schema
      const sample = await collection.findOne({}, { projection: { _id: 0 } });
      
      // Create basic schema from sample
      const schema = {
        name: entityName,
        fields: sample ? this.inferSchemaFromDocument(sample) : {}
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
      const collections = await this.database.listCollections().toArray();
      const entitySets = collections.map((col: any) => col.name);

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
            databaseName: this.databaseName,
            collectionCount: entitySets.length
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
      // Generate basic OData metadata document
      const collections = await this.database.listCollections().toArray();
      
      let metadataXml = '<?xml version="1.0" encoding="utf-8"?>\n';
      metadataXml += '<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">\n';
      metadataXml += '  <edmx:DataServices>\n';
      metadataXml += '    <Schema Namespace="Default" xmlns="http://docs.oasis-open.org/odata/ns/edm">\n';
      
      for (const collection of collections) {
        metadataXml += `      <EntityType Name="${collection.name}">\n`;
        metadataXml += '        <Key>\n';
        metadataXml += '          <PropertyRef Name="_id" />\n';
        metadataXml += '        </Key>\n';
        metadataXml += '        <Property Name="_id" Type="Edm.String" Nullable="false" />\n';
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

      const collection = this.database.collection(entityName);
      
      // Add timestamps
      const documentToInsert = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(documentToInsert);
      const insertedDocument = await collection.findOne({ _id: result.insertedId });

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        data: insertedDocument as T,
        success: true,
        id: result.insertedId,
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
          message: `Failed to create document: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

      const collection = this.database.collection(entityName);
      
      let mongoQuery: any = {};
      let projection: any = {};

      if (query) {
        if (query.filter) {
          mongoQuery = this.convertODataFilterToMongo(query.filter);
        }
        
        if (query.select?.fields) {
          query.select.fields.forEach((field: string) => {
            projection[field] = 1;
          });
        }
      }

      const data = await collection.find(mongoQuery, { projection }).toArray();
      const totalCount = await collection.countDocuments(mongoQuery);

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
          message: `Failed to read documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

      const collection = this.database.collection(entityName);
      
      // Convert string ID to ObjectId if needed
      const objectId = this.convertToObjectId(id);
      
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const result = await collection.findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      // If result.value is undefined, fetch the updated document
      let updatedData = result.value as T;
      if (!updatedData) {
        updatedData = await collection.findOne({ _id: objectId }) as T;
      }

      return {
        data: updatedData,
        success: true,
        metadata: {
          executionTime,
          updated: true,
          affectedCount: result.ok ? 1 : 0
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'UPDATE_FAILED',
          message: `Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

      const collection = this.database.collection(entityName);
      
      // Convert string ID to ObjectId if needed
      const objectId = this.convertToObjectId(id);

      const result = await collection.deleteOne({ _id: objectId });

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        success: true,
        metadata: {
          executionTime,
          deleted: true,
          affectedCount: result.deletedCount
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'DELETE_FAILED',
          message: `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async exists(entityName: string, id: any): Promise<boolean> {
    try {
      const collection = this.database.collection(entityName);
      const objectId = this.convertToObjectId(id);
      const result = await collection.findOne({ _id: objectId }, { projection: { _id: 1 } });
      return result !== null;
    } catch (error) {
      return false;
    }
  }

  getDatabase(): any {
    return this.database;
  }

  getCollection(collectionName: string): any {
    return this.database.collection(collectionName);
  }

  async aggregate<T = Record<string, unknown>>(
    collectionName: string,
    pipeline: any[]
  ): Promise<IAggregationResult<T>> {
    try {
      this.totalQueries++;
      const startTime = Date.now();

      const collection = this.database.collection(collectionName);
      const data = await collection.aggregate(pipeline).toArray();

      const executionTime = Date.now() - startTime;
      this.queryTimes.push(executionTime);

      return {
        data: data as T[],
        success: true,
        metadata: {
          executionTime,
          documentsProcessed: data.length
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'AGGREGATION_FAILED',
          message: `Aggregation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error instanceof Error ? { stack: error.stack } : {},
          severity: 'error',
          actionable: true
        }]
      };
    }
  }

  async createIndexes(collectionName: string, indexes: any[]): Promise<void> {
    try {
      const collection = this.database.collection(collectionName);
      await collection.createIndexes(indexes);
    } catch (error) {
      throw new Error(`Failed to create indexes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCollectionStats(collectionName: string): Promise<IMongoCollectionStats> {
    try {
      const collection = this.database.collection(collectionName);
      const stats = await collection.stats();
      
      return {
        name: collectionName,
        count: stats.count,
        size: stats.size,
        avgObjSize: stats.avgObjSize,
        storageSize: stats.storageSize,
        nindexes: stats.nindexes,
        totalIndexSize: stats.totalIndexSize
      };
    } catch (error) {
      throw new Error(`Failed to get collection stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private helper methods
  private async getServerVersion(): Promise<string> {
    try {
      const buildInfo = await this.database.admin().buildInfo();
      return buildInfo.version;
    } catch {
      return 'Unknown';
    }
  }

  private convertODataFilterToMongo(filter: any): any {
    if (!filter) return {};

    const { field, operator, value } = filter;

    switch (operator) {
      case 'eq':
        return { [field]: value };
      case 'ne':
        return { [field]: { $ne: value } };
      case 'gt':
        return { [field]: { $gt: value } };
      case 'ge':
        return { [field]: { $gte: value } };
      case 'lt':
        return { [field]: { $lt: value } };
      case 'le':
        return { [field]: { $lte: value } };
      case 'contains':
        return { [field]: { $regex: value, $options: 'i' } };
      case 'startswith':
        return { [field]: { $regex: `^${value}`, $options: 'i' } };
      case 'endswith':
        return { [field]: { $regex: `${value}$`, $options: 'i' } };
      case 'in':
        return { [field]: { $in: Array.isArray(value) ? value : [value] } };
      case 'notin':
        return { [field]: { $nin: Array.isArray(value) ? value : [value] } };
      default:
        return { [field]: value };
    }
  }

  private inferSchemaFromDocument(doc: any): Record<string, any> {
    const fields: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(doc)) {
      if (key === '_id') {
        fields[key] = { name: key, type: 'string', primary: true };
      } else {
        fields[key] = {
          name: key,
          type: this.getTypeFromValue(value),
          nullable: value === null || value === undefined
        };
      }
    }
    
    return fields;
  }

  private getTypeFromValue(value: any): string {
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'json';
    return 'string';
  }

  private convertToObjectId(id: any): any {
    if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
      // Dynamic import to avoid bundling issues
      const { ObjectId } = require('mongodb');
      return new ObjectId(id);
    }
    return id;
  }
}
