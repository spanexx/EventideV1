# Adding New Knowledge Documents

## Overview
This document provides instructions for adding new knowledge documents for new pages or updating existing ones in the EventideV1 application.

## Knowledge Document Structure

Each knowledge document follows this standard structure:

```markdown
# [Page Name] Knowledge Document

## Overview
Brief description of the page and its purpose in the EventideV1 application.

## Key Features
- List of main functionality available on this page
- User interactions and capabilities

## How-to Guides
- Step-by-step instructions for key tasks on this page
- Common workflows and procedures

## Troubleshooting
- Common issues users face on this page
- Solutions and workarounds

## Technical Details
- API endpoints and services used by this page
- Component dependencies
- Integration points with other system features
- Access requirements and permissions

## FAQ
- Frequently asked questions about this page
- Best practices for using the page effectively
```

## Adding Knowledge for New Pages

### Step 1: Create the Knowledge Document
Create a new markdown file in the appropriate directory under `/docs/knowledge_documents/`:
- Auth pages: `/docs/knowledge_documents/auth/[page-name].md`
- Dashboard pages: `/docs/knowledge_documents/dashboard/[page-name].md`
- Booking pages: `/docs/knowledge_documents/booking/[page-name].md`
- Other pages: `/docs/knowledge_documents/core/[page-name].md`

### Step 2: Determine Page Context
Ensure the PageContextService can detect your new page by checking the URL pattern. If the new page doesn't follow standard patterns, update the service's `extractPageFromUrl` method.

### Step 3: Import Knowledge Documents
After creating the knowledge document:
1. Start the backend server
2. Make a POST request to `/knowledge-base/import-from-directory`
3. Request body: `{ "directoryPath": "/path/to/knowledge/documents" }`

### Step 4: Test Integration
1. Navigate to the new page
2. Use the AI assistant to ask questions about the page
3. Verify that responses are relevant to the page context

## Updating Existing Knowledge Documents

### For Content Updates
1. Modify the appropriate markdown file in `/docs/knowledge_documents/`
2. Re-import the documents using the import endpoint
3. The system will regenerate embeddings for the updated content

### For Category Changes
1. Update the file location if changing categories
2. Re-import the documents
3. Verify that the new category is being used correctly

## Page Context Service Extensions

If you have a new page that doesn't follow existing URL patterns, update the `PageContextService.extractPageFromUrl` method to properly identify the page:

```typescript
// In page-context.service.ts
private extractPageFromUrl(url: string): string {
  // ... existing logic ...
  
  // Add specific handling for new page patterns
  if (primaryPage === 'new-feature') {
    return primaryPage;
  }
  
  // ... rest of logic ...
}
```

## Best Practices

### Writing Knowledge Documents
- Use clear, concise language
- Focus on user tasks and workflows
- Include specific examples where helpful
- Keep information up-to-date with code changes
- Structure content for easy scanning

### Testing
- Test the AI assistant after adding or updating knowledge documents
- Verify that the correct category is being used for the page
- Ensure responses are contextually relevant
- Check that no irrelevant information is provided

### Maintenance
- Regularly review knowledge documents for accuracy
- Update docs when page functionality changes
- Monitor AI assistant usage for gaps in knowledge
- Gather user feedback on the helpfulness of responses