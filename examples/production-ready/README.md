# Production-Ready OData Active Record Example

This example demonstrates a production-ready implementation of the OData Active Record pattern with enterprise-grade features including connection pooling, retry mechanisms, health checks, and performance monitoring.

## 🚀 Features Demonstrated

### 🔌 Connection Pooling
- **Automatic connection management** with health checks
- **Connection reuse** to minimize overhead
- **Configurable pool sizes** for different database types
- **Automatic cleanup** of unhealthy connections

### 🔄 Retry Mechanisms
- **Exponential backoff** for failed connections
- **Configurable retry attempts** (default: 3)
- **Smart retry logic** that respects connection types
- **Graceful degradation** when services are unavailable

### 🏥 Health Checks
- **Automatic health monitoring** every 30 seconds
- **Connection validation** for all provider types
- **Unhealthy connection removal** from pool
- **Health check endpoints** for monitoring systems

### 📊 Performance Monitoring
- **Query execution tracking** with response times
- **Error rate monitoring** per entity/namespace
- **Percentile calculations** (P95, P99)
- **Automatic metrics logging** every 5 minutes

### 🛡️ Error Handling & Recovery
- **User-friendly error messages** with actionable suggestions
- **Graceful error recovery** with fallback mechanisms
- **Comprehensive error logging** for debugging
- **Circuit breaker patterns** for external services

### 🔄 Graceful Shutdown
- **Signal handling** (SIGTERM, SIGINT)
- **Connection cleanup** on shutdown
- **Final metrics logging** before exit
- **Resource cleanup** to prevent memory leaks

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ProductionODataService                   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ ConnectionPool  │  │NamespaceManager │  │Performance   │ │
│  │                 │  │                 │  │Monitoring    │ │
│  │ • MongoDB       │  │ • Multi-tenant  │  │ • Metrics    │ │
│  │ • SQLite        │  │ • Isolation     │  │ • Logging    │ │
│  │ • HTTP OData    │  │ • Cross-entity  │  │ • Alerts     │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Installation

```bash
# Install dependencies
npm install

# Build the core packages first
cd ../../packages/odata-active-record-contracts && npm run build
cd ../odata-active-record-core && npm run build
cd ../../examples/production-ready
```

## 🚀 Quick Start

```bash
# Start the production service
npm start

# Or run in development mode with auto-restart
npm run dev
```

## 📋 Configuration

### MongoDB Configuration
```javascript
const mongoConfig = {
  type: 'mongodb',
  connectionString: 'mongodb://localhost:27017',
  databaseName: 'production_db',
  poolSize: 10,           // Maximum connections in pool
  minPoolSize: 2,         // Minimum connections to maintain
  maxIdleTime: 30000,     // Max idle time before cleanup
  timeout: 5000           // Connection timeout
};
```

### SQLite Configuration
```javascript
const sqliteConfig = {
  type: 'sqlite',
  filePath: './production.db',
  timeout: 5000,          // Query timeout
  verbose: false          // Enable SQL logging
};
```

### HTTP OData Configuration
```javascript
const httpConfig = {
  type: 'http-odata',
  baseUrl: 'https://services.odata.org/V4/Northwind/Northwind.svc',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'OData-Active-Record-Production/1.0'
  },
  timeout: 10000          // Request timeout
};
```

## 🔍 Usage Examples

### Basic Query Execution
```javascript
const service = new ProductionODataService();
await service.initialize();

// Query with automatic retry and monitoring
const users = await service.executeProductionQuery('mongodb_prod', 'users', {
  where: { isActive: true },
  limit: 10
});
```

### Cross-Namespace Operations
```javascript
// Query across different data sources
const users = await service.executeProductionQuery('mongodb_prod', 'users');
const logs = await service.executeProductionQuery('sqlite_prod', 'logs');
const products = await service.executeProductionQuery('http_odata_prod', 'products');
```

### Health Monitoring
```javascript
// Check service health
const health = await service.healthCheck();
console.log(health);
// Output: { status: 'healthy', connections: { total: 3, healthy: 3 }, ... }
```

## 📊 Monitoring & Metrics

### Performance Metrics
The service automatically tracks:
- **Query execution times** per entity
- **Error rates** and failure patterns
- **Response time percentiles** (P95, P99)
- **Connection pool statistics**

### Logging
```bash
# Example log output
🚀 Initializing Production OData Service...
📊 Initializing MongoDB connection...
✅ MongoDB connection established (attempt 1)
💾 Initializing SQLite connection...
✅ SQLite connection established (attempt 1)
🌐 Initializing HTTP OData connection...
✅ HTTP OData connection established (attempt 1)

🔌 Connection Pool Statistics:
==============================
Total Connections: 3
Healthy Connections: 3
Total Retries: 0
Max Retries: 3
Retry Delay: 1000ms
Health Check Interval: 30000ms
==============================

📊 Performance Metrics:
========================
mongodb_prod.users:
  Queries: 15
  Avg Time: 45.23ms
  Error Rate: 0.00%

Overall Response Times:
  Average: 42.15ms
  P95: 78.45ms
  P99: 125.67ms
========================
```

## 🛡️ Error Handling

### Automatic Retry
```javascript
// The service automatically retries failed connections
// with exponential backoff
⚠️ Connection mongodb_prod attempt 1 failed: ECONNREFUSED
🔄 Retrying connection mongodb_prod in 1000ms...
⚠️ Connection mongodb_prod attempt 2 failed: ECONNREFUSED
🔄 Retrying connection mongodb_prod in 2000ms...
✅ Connection mongodb_prod established successfully (attempt 3)
```

### Health Check Failures
```javascript
// Unhealthy connections are automatically removed
🚨 Connection mongodb_prod is unhealthy, removing from pool
🚨 Connection mongodb_prod failed health check
```

## 🔧 Production Deployment

### Environment Variables
```bash
# Database configurations
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=production_db
SQLITE_PATH=./production.db
ODATA_BASE_URL=https://services.odata.org/V4/Northwind/Northwind.svc

# Connection pool settings
POOL_SIZE=10
MIN_POOL_SIZE=2
MAX_IDLE_TIME=30000
CONNECTION_TIMEOUT=5000

# Retry settings
MAX_RETRIES=3
RETRY_DELAY=1000
HEALTH_CHECK_INTERVAL=30000
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: odata-active-record
spec:
  replicas: 3
  selector:
    matchLabels:
      app: odata-active-record
  template:
    metadata:
      labels:
        app: odata-active-record
    spec:
      containers:
      - name: odata-active-record
        image: odata-active-record:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          value: "mongodb://mongodb:27017"
        - name: POOL_SIZE
          value: "10"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🧪 Testing

```bash
# Run the test suite
npm test

# Test specific scenarios
node test.js --scenario=connection-failure
node test.js --scenario=performance
node test.js --scenario=graceful-shutdown
```

## 📈 Performance Optimization

### Connection Pool Tuning
- **Monitor connection usage** and adjust pool sizes
- **Set appropriate timeouts** for your network conditions
- **Configure health check intervals** based on service stability

### Query Optimization
- **Use appropriate indexes** in your databases
- **Limit result sets** with pagination
- **Cache frequently accessed data** when possible

### Monitoring Setup
- **Set up alerts** for high error rates
- **Monitor response time percentiles**
- **Track connection pool utilization**

## 🔍 Troubleshooting

### Common Issues

1. **Connection Timeouts**
   ```bash
   # Increase timeout values
   CONNECTION_TIMEOUT=10000
   ```

2. **High Error Rates**
   ```bash
   # Check connection pool health
   curl http://localhost:3000/health
   ```

3. **Memory Leaks**
   ```bash
   # Monitor connection cleanup
   # Check for proper shutdown handling
   ```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=odata-active-record:* npm start
```

## 📚 Next Steps

1. **Add authentication** and authorization
2. **Implement caching** with Redis
3. **Add distributed tracing** with OpenTelemetry
4. **Set up monitoring** with Prometheus/Grafana
5. **Implement rate limiting** and throttling
6. **Add data validation** and sanitization

## 🤝 Contributing

This example demonstrates production-ready patterns. When contributing:

1. **Follow the established patterns** for error handling
2. **Add comprehensive tests** for new features
3. **Update documentation** for any changes
4. **Consider performance implications** of changes

## 📄 License

MIT License - see the main project license for details.
