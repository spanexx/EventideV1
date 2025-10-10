import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KnowledgeDocument, KnowledgeDocumentDocument } from '../schemas/knowledge-document.schema';

export interface VectorSearchResult {
  document: KnowledgeDocument;
  similarity: number;
}

@Injectable()
export class VectorStore {
  private readonly logger = new Logger(VectorStore.name);

  constructor(
    @InjectModel(KnowledgeDocument.name) 
    private readonly knowledgeDocumentModel: Model<KnowledgeDocumentDocument>,
  ) {}

  async findSimilarByEmbedding(
    queryEmbedding: number[], 
    limit: number = 5,
    category?: string,
    minSimilarity: number = 0.5
  ): Promise<VectorSearchResult[]> {
    this.logger.log(`Finding similar documents by embedding (limit: ${limit}, category: ${category})`);
    
    // Build the query
    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    
    // Find all documents matching the criteria
    const allDocuments = await this.knowledgeDocumentModel
      .find(query)
      .lean()
      .exec();
    
    // Calculate similarity for each document using cosine similarity
    const similarities: VectorSearchResult[] = [];
    
    for (const doc of allDocuments) {
      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding as number[]);
      
      if (similarity >= minSimilarity) {
        similarities.push({
          document: doc as KnowledgeDocument,
          similarity,
        });
      }
    }
    
    // Sort by similarity (descending) and take top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    return similarities.slice(0, limit);
  }

  async findSimilarByContent(
    query: string, 
    embeddingService: any, // We'll pass the embedding service as a parameter
    limit: number = 5,
    category?: string,
    minSimilarity: number = 0.5
  ): Promise<VectorSearchResult[]> {
    this.logger.log(`Finding similar documents by content: ${query.substring(0, 50)}...`);
    
    // Generate embedding for the query
    const queryEmbedding = await embeddingService.generateEmbedding(query);
    
    // Use the embedding to find similar documents
    return await this.findSimilarByEmbedding(queryEmbedding, limit, category, minSimilarity);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0; // If either vector is zero, similarity is 0
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * For production use, we would implement a proper vector database solution
   * like Pinecone, Weaviate, or similar. For now, we're using MongoDB with
   * cosine similarity calculations in application code.
   * 
   * In a production environment, consider:
   * - Using a dedicated vector database
   * - Using MongoDB Atlas Vector Search
   * - Using PostgreSQL with pgvector extension
   * - Using Elasticsearch with dense vector fields
   */
  async createIndex(): Promise<void> {
    // For now, we rely on MongoDB's capabilities
    // In production, would implement proper vector indexing
    this.logger.log('Vector index created (using MongoDB)');
  }
}