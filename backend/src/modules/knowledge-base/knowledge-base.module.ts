import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { 
  KnowledgeDocument, 
  KnowledgeDocumentSchema 
} from './schemas/knowledge-document.schema';
import { RAGService } from './services/rag.service';
import { EmbeddingService } from './services/embedding.service';
import { DocumentIngestionService } from './services/document-ingestion.service';
import { RAGCacheService } from './services/rag-cache.service';
import { RAGMonitoringService } from './services/rag-monitoring.service';
import { VectorStore } from './services/vector-store';
import { KnowledgeDocumentImportService } from './services/knowledge-document-import.service';
import { RouteRecommendationService } from './services/route-recommendation.service';

@Module({
  imports: [
    ConfigModule,
    CacheModule.register(),
    MongooseModule.forFeature([
      { name: KnowledgeDocument.name, schema: KnowledgeDocumentSchema }
    ]),
  ],
  controllers: [KnowledgeBaseController],
  providers: [
    KnowledgeBaseService,
    RAGService,
    EmbeddingService,
    DocumentIngestionService,
    RAGCacheService,
    RAGMonitoringService,
    VectorStore,
    KnowledgeDocumentImportService,
    RouteRecommendationService,
  ],
  exports: [
    KnowledgeBaseService,
    RAGService,
    VectorStore,
    KnowledgeDocumentImportService,
    RouteRecommendationService,
  ],
})
export class KnowledgeBaseModule {}