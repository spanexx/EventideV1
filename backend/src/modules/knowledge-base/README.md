# Knowledge Base Module

The Knowledge Base module provides a comprehensive RAG (Retrieval Augmented Generation) system for the EventideV1 application. It consists of several integrated services that work together to store, retrieve, and enhance AI responses with domain-specific knowledge.

## Components

### 1. Knowledge Document Schema
- Defines the structure for knowledge documents stored in MongoDB
- Includes fields for content, category, language, tags, and vector embeddings
- Supports full-text search via MongoDB text indexes

### 2. KnowledgeBaseService
- Provides full CRUD operations for knowledge documents
- Implements methods for searching, categorizing, and managing documents
- Handles document creation with automatic embedding generation

### 3. EmbeddingService
- Generates vector embeddings using Ollama
- Uses the `nomic-embed-text` model by default
- Provides batch embedding generation capabilities

### 4. RAGService
- Implements semantic search using vector similarity
- Combines retrieved context with user queries for enhanced AI responses
- Includes caching for performance optimization

### 5. DocumentIngestionService
- Automated ingestion of documentation from various sources
- Pre-populates the knowledge base with EventideV1 documentation
- Includes API endpoints, booking system, user roles, and FAQ content

### 6. RAGCacheService
- Caches RAG search results for improved response times
- Uses NestJS cache manager with configurable TTL
- Implements cache key strategies for efficient retrieval

### 7. RAGMonitoringService
- Tracks metrics for RAG system performance
- Provides Prometheus metrics for monitoring
- Records search duration, cache hits/misses, and error rates

### 8. VectorStore
- Implements vector similarity search using cosine similarity
- Provides efficient nearest neighbor search capabilities
- Designed for integration with vector databases in production

## Environment Variables

The knowledge base module requires the following environment variables:

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

## API Endpoints

The module exposes the following API endpoints:

### Knowledge Document Management
- `POST /knowledge-base` - Create a new knowledge document
- `GET /knowledge-base` - Retrieve all knowledge documents with filters
- `GET /knowledge-base/categories` - Get all available categories
- `GET /knowledge-base/:id` - Get a specific document by ID
- `PUT /knowledge-base/:id` - Update a document by ID
- `DELETE /knowledge-base/:id` - Delete a document by ID

### Search and RAG Operations
- `POST /knowledge-base/search` - Text-based search
- `POST /knowledge-base/rag-search` - Semantic search with RAG
- `POST /knowledge-base/rag-generate` - Generate response using RAG

## Integration with Assistant Agent

The Knowledge Base module is integrated with the Assistant Agent service to provide RAG capabilities. When generating responses, the assistant can retrieve relevant context from the knowledge base to provide accurate, domain-specific answers.

## Configuration

To configure the knowledge base module, ensure you have:

1. Ollama running with the required models installed (`gemma2:2b` and `nomic-embed-text`)
2. Proper environment variables set in your `.env` file
3. MongoDB configured in your main application

## Usage Examples

### Semantic Search
```typescript
const results = await ragService.semanticSearch('How do I book an appointment?', 5, 'booking', 0.6);
```

### RAG-Enhanced Response Generation
```typescript
const response = await ragService.generateResponseWithRAG(
  'What are the cancellation policies?',
  'You are an EventideV1 assistant',
  'faq'
);
```

### Document Creation with Auto-Embedding
```typescript
const document = await knowledgeBaseService.create({
  title: 'Booking Cancellation Policy',
  content: 'Users can cancel bookings up to 24 hours before the scheduled time...',
  category: 'faq',
  tags: ['booking', 'cancellation', 'policy']
});
```