# EventideV1 Page-Specific Knowledge Document Implementation

## Overview
This document details the implementation of page-specific knowledge documents for the EventideV1 application, enabling the AI assistant to provide contextually relevant help based on the user's current page.

## Architecture

### Frontend Components
1. **PageContextService** - Determines the current page and provides an observable
2. **AgentChatComponent** - Sends current page context to the backend
3. **AssistantAgentService** - Passes page context in RAG requests

### Backend Components
1. **AssistantAgentService** - Uses page context in system prompts and RAG queries
2. **RAGService** - Filters knowledge retrieval by page category
3. **KnowledgeBaseService** - Stores and retrieves page-specific documents

## Implementation Details

### 1. Knowledge Document Organization
- Knowledge documents are stored in `/docs/knowledge_documents/`
- Organized by feature module (auth, dashboard, booking, etc.)
- Each page has its own markdown file
- Categories are derived from directory structure

### 2. Frontend Page Context Detection
The `PageContextService` listens to router events and extracts the current page:
- Auth pages: `auth-login`, `auth-signup`, etc.
- Dashboard pages: `dashboard-overview`, `dashboard-availability`, etc.
- Booking pages: `booking-duration`, `booking-availability`, etc.
- Other pages: `home`, `providers`, `notifications`, etc.

### 3. Communication Flow
1. User interacts with the AgentChat component
2. PageContextService provides current page context
3. AgentChat sends request with `ragCategory` set to current page
4. Backend uses page context in system prompt and RAG filtering
5. Assistant provides page-specific responses based on knowledge documents

## API Integration

### Frontend to Backend
- The `chat-rag` endpoint now accepts a `ragCategory` parameter
- Category is set to the current page context from PageContextService
- Request structure: `{ message, conversationHistory, ragOptions: { enableRAG, ragCategory, minSimilarity } }`

### Backend Processing
- System prompt is enhanced with page context information
- RAG queries are filtered by the provided category
- Response is generated using page-specific knowledge

## Knowledge Document Import Process

To import knowledge documents into the database:

1. Send POST request to `/knowledge-base/import-from-directory`
2. Request body: `{ "directoryPath": "/path/to/knowledge/documents" }`
3. System will:
   - Read all markdown files recursively
   - Extract title from first heading
   - Derive category from directory structure
   - Generate embeddings for semantic search
   - Store in knowledge database

## Testing

### Manual Testing Approach
1. Navigate to different pages in the application
2. Open the AI assistant chat
3. Ask questions related to the current page
4. Verify that responses are contextually relevant to the current page
5. Check that the assistant uses knowledge from the appropriate knowledge document

### Verification Points
- Page context is correctly detected when navigating
- Knowledge documents are properly categorized
- RAG responses include relevant sources
- Page-specific responses are more helpful than generic ones

## Maintenance

### Adding New Pages
1. Create corresponding knowledge document in `/docs/knowledge_documents/`
2. Update PageContextService if new URL patterns are needed
3. Import new documents using the import endpoint

### Updating Knowledge Documents
1. Modify the appropriate markdown file
2. Re-import using the import endpoint to update embeddings
3. The system will automatically use the updated content

### Performance Considerations
- Knowledge documents are indexed with embeddings for semantic search
- Category-based filtering improves retrieval precision
- Caching can be implemented for frequently accessed documents