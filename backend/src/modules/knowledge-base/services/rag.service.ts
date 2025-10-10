import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KnowledgeDocument, KnowledgeDocumentDocument } from '../schemas/knowledge-document.schema';
import { EmbeddingService } from './embedding.service';
import { KnowledgeBaseService } from '../knowledge-base.service';
import { RAGCacheService } from './rag-cache.service';
import { RAGMonitoringService } from './rag-monitoring.service';
import { VectorStore } from './vector-store';

export interface RAGSearchResult {
  document: KnowledgeDocument;
  similarity: number;
}

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);

  constructor(
    @InjectModel(KnowledgeDocument.name) 
    private readonly knowledgeDocumentModel: Model<KnowledgeDocumentDocument>,
    private readonly embeddingService: EmbeddingService,
    private readonly ragCacheService: RAGCacheService,
    private readonly monitoringService: RAGMonitoringService,
    private readonly vectorStore: VectorStore,
    @Inject(forwardRef(() => KnowledgeBaseService))
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  async generateEmbedding(text: string): Promise<number[]> {
    return await this.embeddingService.generateEmbedding(text);
  }

  async semanticSearch(
    query: string, 
    limit = 5,
    category?: string,
    minSimilarity = 0.5
  ): Promise<RAGSearchResult[]> {
    const startTime = Date.now();
    this.logger.log(`Performing semantic search for query: ${query}`);
    
    // Try to get cached results first
    const cachedResults = await this.ragCacheService.getCachedResponse(query, category);
    if (cachedResults) {
      this.logger.log(`Returning cached results for query: ${query.substring(0, 50)}...`);
      this.monitoringService.incrementCacheHit();
      this.monitoringService.incrementSearchCounter();
      this.monitoringService.observeSearchDuration((Date.now() - startTime) / 1000);
      return cachedResults;
    }
    
    this.monitoringService.incrementCacheMiss();
    
    // Use the vector store to find similar documents
    const searchResults = await this.vectorStore.findSimilarByContent(
      query,
      this.embeddingService,
      limit,
      category,
      minSimilarity
    );
    
    // Cache the results
    await this.ragCacheService.setCachedResponse(query, searchResults, category);
    
    this.logger.log(`Found ${searchResults.length} similar documents`);
    
    // Record metrics
    this.monitoringService.incrementSearchCounter();
    this.monitoringService.observeSearchDuration((Date.now() - startTime) / 1000);
    
    return searchResults;
  }

  async getRelevantContext(
    query: string, 
    limit = 5,
    category?: string,
    minSimilarity = 0.5
  ): Promise<{ context: string; sources: KnowledgeDocument[] }> {
    this.logger.log(`Getting relevant context for query: ${query}`);
    
    const searchResults = await this.semanticSearch(query, limit, category, minSimilarity);
    
    // Combine all relevant content
    const context = searchResults.map(result => result.document.content).join('\n\n---\n\n');
    const sources = searchResults.map(result => result.document);
    
    return { context, sources };
  }

  async generateResponseWithRAG(
    query: string,
    systemPrompt?: string,
    category?: string
  ): Promise<{ response: string; sources: KnowledgeDocument[] }> {
    this.logger.log(`Generating RAG-enhanced response for query: ${query.substring(0, 100)}...`);
    
    // Get relevant context
    const { context, sources } = await this.getRelevantContext(query, 5, category);
    
    // Construct enhanced prompt with retrieved context
    const enhancedPrompt = `
You are an assistant for the EventideV1 application. Use the following context to answer the user's question:

CONTEXT:
${context}

USER QUESTION:
${query}

Please provide an accurate and helpful response based on the context provided. If the context doesn't contain the needed information, acknowledge the limitation and suggest possible next steps.
    `.trim();
    
    // If a system prompt was provided, include it as well
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\n${enhancedPrompt}`
      : enhancedPrompt;
    
    // In a complete implementation, we'd call the actual assistant agent with the enhanced prompt
    // For now, returning the enhanced prompt as a response placeholder
    const response = `Enhanced prompt created with RAG context. In production, this would be sent to the LLM: ${enhancedPrompt.substring(0, 200)}...`;
    
    return {
      response,
      sources,
    };
  }


}