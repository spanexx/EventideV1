import { NestFactory } from '@nestjs/core';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { KnowledgeBaseService } from './modules/knowledge-base/knowledge-base.service';
import { RAGService } from './modules/knowledge-base/services/rag.service';

async function testKnowledgeBase() {
  console.log('Starting Knowledge Base Test...');
  
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(KnowledgeBaseModule);
  
  const knowledgeBaseService = app.get(KnowledgeBaseService);
  const ragService = app.get(RAGService);
  
  console.log('Testing Knowledge Base System...\n');
  
  // Test 1: Create a sample document
  console.log('1. Creating a sample knowledge document...');
  try {
    const sampleDoc = await knowledgeBaseService.create({
      title: 'Test Document',
      content: 'This is a test document for the EventideV1 knowledge base system. It contains information about how the system works.',
      category: 'general',
      tags: ['test', 'knowledge-base', 'eventide'],
      language: 'en',
      isActive: true,
      isPublic: true,
    });
    console.log('✓ Sample document created successfully:', sampleDoc.title);
  } catch (error) {
    console.error('✗ Error creating sample document:', error.message);
  }
  
  // Test 2: Search for documents
  console.log('\n2. Searching for documents...');
  try {
    const documents = await knowledgeBaseService.findAll({ category: 'general' });
    console.log(`✓ Found ${documents.length} documents in 'general' category`);
  } catch (error) {
    console.error('✗ Error searching for documents:', error.message);
  }
  
  // Test 3: Perform semantic search with RAG
  console.log('\n3. Performing semantic search with RAG...');
  try {
    const searchResults = await ragService.semanticSearch('How does the knowledge base work?', 5);
    console.log(`✓ RAG search completed, found ${searchResults.length} relevant documents`);
  } catch (error) {
    console.error('✗ Error performing RAG search:', error.message);
  }
  
  // Test 4: Generate RAG-enhanced response
  console.log('\n4. Generating RAG-enhanced response...');
  try {
    const response = await ragService.generateResponseWithRAG('What is this system about?');
    console.log('✓ RAG-enhanced response generated');
    console.log('Response preview:', response.response.substring(0, 100) + '...');
  } catch (error) {
    console.error('✗ Error generating RAG response:', error.message);
  }
  
  // Test 5: Get available categories
  console.log('\n5. Getting available categories...');
  try {
    const categories = await knowledgeBaseService.getCategories();
    console.log('✓ Available categories:', categories);
  } catch (error) {
    console.error('✗ Error getting categories:', error.message);
  }
  
  console.log('\n✓ Knowledge Base System Test Completed!');
  
  await app.close();
}

// Run the test
testKnowledgeBase().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});