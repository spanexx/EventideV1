import { Injectable, Logger } from '@nestjs/common';
import { Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class RAGMonitoringService {
  private readonly logger = new Logger(RAGMonitoringService.name);
  private readonly registry: Registry;
  
  // Metrics
  private readonly searchCounter: Counter;
  private readonly searchDuration: Histogram;
  private readonly cacheHitCounter: Counter;
  private readonly cacheMissCounter: Counter;
  private readonly embeddingGenerationCounter: Counter;
  private readonly errorCounter: Counter;

  constructor() {
    // Create a new registry for RAG metrics
    this.registry = new Registry();
    
    // Initialize metrics
    this.searchCounter = new Counter({
      name: 'rag_search_total',
      help: 'Total number of RAG searches performed',
      registers: [this.registry],
    });
    
    this.searchDuration = new Histogram({
      name: 'rag_search_duration_seconds',
      help: 'Duration of RAG searches in seconds',
      registers: [this.registry],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });
    
    this.cacheHitCounter = new Counter({
      name: 'rag_cache_hits_total',
      help: 'Total number of RAG cache hits',
      registers: [this.registry],
    });
    
    this.cacheMissCounter = new Counter({
      name: 'rag_cache_misses_total',
      help: 'Total number of RAG cache misses',
      registers: [this.registry],
    });
    
    this.embeddingGenerationCounter = new Counter({
      name: 'rag_embedding_generation_total',
      help: 'Total number of embedding generations',
      registers: [this.registry],
    });
    
    this.errorCounter = new Counter({
      name: 'rag_errors_total',
      help: 'Total number of RAG errors',
      labelNames: ['error_type'],
      registers: [this.registry],
    });
  }

  incrementSearchCounter(): void {
    this.searchCounter.inc();
  }

  observeSearchDuration(duration: number): void {
    this.searchDuration.observe(duration);
  }

  incrementCacheHit(): void {
    this.cacheHitCounter.inc();
  }

  incrementCacheMiss(): void {
    this.cacheMissCounter.inc();
  }

  incrementEmbeddingGeneration(): void {
    this.embeddingGenerationCounter.inc();
  }

  incrementError(errorType: string): void {
    this.errorCounter.inc({ error_type: errorType });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  async getMetricsAsJSON(): Promise<any> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }

  async resetMetrics(): Promise<void> {
    this.registry.resetMetrics();
  }
}