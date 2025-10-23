# EventideV1 RAG (Retrieval-Augmented Generation) System

## Overview

The RAG system enhances the EventideV1 assistant by providing relevant context from a knowledge base before generating responses. This improves the accuracy and helpfulness of the assistant's responses by incorporating domain-specific information.

## Architecture

### Components

1. **Knowledge Base Module**: Core module managing documentation storage and retrieval
2. **Knowledge Document Schema**: MongoDB schema for storing knowledge base content
3. **Embedding Service**: Generates vector embeddings for semantic search
4. **RAG Service**: Orchestrates semantic search and response generation
5. **Document Ingestion Service**: Imports documentation from various sources
6. **RAG Cache Service**: Caches search results for performance
7. **RAG Monitoring Service**: Tracks system performance metrics

### Data Flow

1. Documentation is ingested into the knowledge base
2. Each document is processed to generate vector embeddings
3. When a query is received, vector embeddings are generated for the query
4. Semantic search finds relevant documents based on embedding similarity
5. Retrieved context is used to enhance the prompt for the LLM
6. Enhanced response is generated and returned to the user

## Configuration

### Environment Variables

```bash
# Ollama configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Additional configuration can be added as needed
```

### Module Integration

The KnowledgeBaseModule is integrated into the main AppModule:

```typescript
// In app.module.ts
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';

@Module({
  // ... other imports
  imports: [
    // ... other modules
    KnowledgeBaseModule,
  ],
  // ...
})
export class AppModule {}
```

## API Endpoints

### Knowledge Base Management

#### POST /knowledge-base
Create a new knowledge document

```json
{
  "title": "Example Document",
  "content": "Document content goes here...",
  "category": "api",
  "tags": ["example", "documentation"],
  "isActive": true,
  "isPublic": true
}
```

#### GET /knowledge-base
Retrieve knowledge documents with optional filters

Query parameters:
- `category`: Filter by category
- `tags`: Filter by tags (comma-separated)
- `query`: Text search query
- `limit`: Maximum number of results
- `skip`: Number of results to skip
- `sortBy`: Field to sort by
- `sortOrder`: asc or desc

#### GET /knowledge-base/categories
Get all available categories

#### GET /knowledge-base/:id
Get specific knowledge document by ID

#### PUT /knowledge-base/:id
Update knowledge document

#### DELETE /knowledge-base/:id
Delete knowledge document

### RAG-Specific Endpoints

#### POST /knowledge-base/rag-search
Perform semantic search using vector embeddings

```json
{
  "query": "User authentication process",
  "limit": 5,
  "category": "api",
  "minSimilarity": 0.5
}
```

#### POST /knowledge-base/rag-generate
Generate response using RAG

```json
{
  "query": "How do I authenticate users?",
  "systemPrompt": "You are a helpful assistant for EventideV1...",
  "category": "api"
}
```

## Categories and Content Types

The knowledge base supports the following categories:

- `api`: API endpoints and functionality
- `booking`: Booking system documentation
- `availability`: Availability system documentation
- `user_roles`: User roles and permissions
- `frontend`: Frontend interface and workflows
- `faq`: Common user questions

## Performance and Caching

The RAG system implements caching to improve response times:

- Query results are cached based on query content and category
- Cache uses TTL (Time To Live) to automatically expire old entries
- Cache hits significantly reduce search time for repeated queries

## Monitoring

The system provides metrics for monitoring performance:

- `rag_search_total`: Total number of RAG searches performed
- `rag_search_duration_seconds`: Duration of RAG searches
- `rag_cache_hits_total`: Number of cache hits
- `rag_cache_misses_total`: Number of cache misses
- `rag_embedding_generation_total`: Number of embedding generations
- `rag_errors_total`: Number of errors by type

## Integration with Assistant Agent

The RAG system is integrated with the existing AssistantAgentService:

```typescript
// In AssistantAgentService
async generateContent(prompt: string, systemPrompt?: string, ragOptions?: RAGOptions) {
  // ... existing logic with RAG enhancement
}
```

RAG options include:

```typescript
interface RAGOptions {
  enableRAG?: boolean;        // Enable RAG functionality
  ragCategory?: string;       // Restrict search to specific category
  minSimilarity?: number;     // Minimum similarity threshold
  maxContextLength?: number;  // Maximum context length
}
```

## Best Practices

### Document Ingestion

- Structure documentation with clear titles and categories
- Use appropriate tags for better discovery
- Maintain consistency in terminology
- Regularly update documentation to reflect system changes

### Semantic Search

- Use specific queries for better relevance
- Adjust similarity thresholds based on use case
- Monitor cache hit rates to optimize performance

### System Performance

- Monitor embedding generation times
- Track search duration metrics
- Regularly review cache effectiveness
- Scale Ollama service as needed for load

## Security Considerations

- Knowledge documents can be marked as public or private
- Access controls should be implemented based on document sensitivity
- Embedding models should be configured securely
- API endpoints should be protected as appropriate