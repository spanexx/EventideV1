import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { KnowledgeBaseService } from '../knowledge-base.service';
import { VectorStore } from './vector-store';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private ollamaClient: Ollama;
  private readonly embeddingModel: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => KnowledgeBaseService))
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {
    // Initialize Ollama client for embeddings
    this.ollamaClient = new Ollama({
      host: this.configService.get<string>('OLLAMA_HOST', 'http://localhost:11434'),
    });
    
    // Use the embedding model from config, default to nomic-embed-text
    this.embeddingModel = this.configService.get<string>('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text:latest');
    
    this.logger.log(`Embedding Service initialized with model: ${this.embeddingModel}`);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.logger.log('Generating embedding for text');
    
    try {
      // Truncate text if it's too long for the model
      const maxTextLength = 8192; // Typical limit for embedding models
      const truncatedText = text.length > maxTextLength 
        ? text.substring(0, maxTextLength) 
        : text;

      const response = await this.ollamaClient.embeddings({
        model: this.embeddingModel,
        prompt: truncatedText,
      });

      this.logger.log('Embedding generated successfully');
      return response.embedding;
    } catch (error) {
      this.logger.error('Error generating embedding with Ollama', error);
      throw error;
    }
  }

  async generateMultipleEmbeddings(texts: string[]): Promise<number[][]> {
    this.logger.log(`Generating embeddings for ${texts.length} texts`);
    
    const embeddings: number[][] = [];
    for (const text of texts) {
      embeddings.push(await this.generateEmbedding(text));
    }
    
    return embeddings;
  }

  async updateEmbeddingsForDocument(documentId: string): Promise<void> {
    this.logger.log(`Updating embeddings for document ID: ${documentId}`);
    
    const document = await this.knowledgeBaseService.findById(documentId);
    const newEmbedding = await this.generateEmbedding(document.content);
    
    // Update the document directly using the model to include the embedding field
    await this.knowledgeBaseService.update(documentId, {
      content: document.content, // Keep existing content to trigger embedding regeneration
    });
    
    this.logger.log(`Embeddings updated for document ID: ${documentId}`);
  }
}