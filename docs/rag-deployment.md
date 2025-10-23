# EventideV1 RAG System - Deployment Configuration

## Environment Variables

### Required Environment Variables

```bash
# Database Configuration
MONGO_URI=mongodb://localhost:27017/eventidev1

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Application Configuration
PORT=3000
NODE_ENV=production

# Cache Configuration
CACHE_TTL=3600
CACHE_MAX=1000

# Security
JWT_SECRET=your-jwt-secret-here
```

## Docker Configuration

### Dockerfile for Backend with RAG

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app

# Install git since it might be needed for some dependencies
RUN apk add --no-cache git

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: eventidev1-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  ollama:
    image: ollama/ollama:latest
    container_name: eventidev1-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eventidev1-backend
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
      - ollama
    environment:
      - MONGO_URI=mongodb://mongodb:27017/eventidev1
      - OLLAMA_HOST=http://ollama:11434
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs

volumes:
  mongodb_data:
  ollama_data:
```

## Kubernetes Configuration (Optional)

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: eventidev1-rag
spec:
  replicas: 2
  selector:
    matchLabels:
      app: eventidev1-rag
  template:
    metadata:
      labels:
        app: eventidev1-rag
    spec:
      containers:
      - name: eventidev1-backend
        image: your-registry/eventidev1-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGO_URI
          valueFrom:
            secretKeyRef:
              name: eventidev1-secrets
              key: mongo-uri
        - name: OLLAMA_HOST
          value: "http://ollama-service:11434"
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
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
---
apiVersion: v1
kind: Service
metadata:
  name: eventidev1-rag-service
spec:
  selector:
    app: eventidev1-rag
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

## Initialization Script

Create a script to initialize the RAG system after deployment:

```bash
#!/bin/bash

echo "Initializing EventideV1 RAG System..."

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
until curl -s http://localhost:27017/; do
  sleep 2
done
echo "MongoDB is ready!"

# Wait for Ollama to be ready
echo "Waiting for Ollama..."
until curl -s http://localhost:11434/api/tags; do
  sleep 2
done
echo "Ollama is ready!"

# Pull required models
echo "Pulling required models..."
curl http://localhost:11434/api/pull -d '{
  "name": "gemma2:2b"
}'

curl http://localhost:11434/api/pull -d '{
  "name": "nomic-embed-text"
}'

echo "Models pulled successfully!"

# Start the application
echo "Starting EventideV1 application..."
npm run start:prod
```

## Health Check Endpoints

The system provides health check endpoints:

- `GET /health` - Overall system health
- `GET /knowledge-base/health` - Knowledge base health
- `GET /rag/health` - RAG system health

## Performance Tuning

### For Production Deployments

1. **Ollama Configuration**:
   - Use GPU acceleration if available for faster embeddings
   - Pre-load models during deployment
   - Configure appropriate memory limits

2. **Database Optimization**:
   - Create appropriate indexes for knowledge documents
   - Optimize for read-heavy workloads
   - Implement connection pooling

3. **Caching Strategy**:
   - Monitor cache hit rates
   - Adjust TTL values based on query patterns
   - Consider Redis for distributed caching in scaled deployments

### Monitoring Production Systems

1. **Key Metrics to Monitor**:
   - Average search time
   - Cache hit ratio
   - Embedding generation time
   - API response times
   - Error rates

2. **Logging**:
   - Log all queries for analysis
   - Monitor for unusual query patterns
   - Track which documents are most frequently retrieved

## Upgrades and Maintenance

### Model Updates

To update the embedding model:

1. Pull the new model with Ollama
2. Update the `OLLAMA_EMBEDDING_MODEL` environment variable
3. Restart the application
4. Trigger re-indexing of all documents if needed

### Schema Changes

The system uses Mongoose for schema management. For breaking schema changes:

1. Create migration scripts
2. Update the schema definition
3. Test migration thoroughly
4. Apply to production during maintenance window

## Security Considerations

1. **API Security**:
   - Use authentication for sensitive endpoints
   - Implement rate limiting
   - Validate all input data

2. **Data Security**:
   - Encrypt sensitive knowledge base content
   - Control access based on user roles
   - Regular security audits

3. **Infrastructure Security**:
   - Secure Ollama endpoints
   - Use private networks for internal communication
   - Regular updates and patching
```