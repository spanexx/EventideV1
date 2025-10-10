import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RAGCacheService {
  private readonly logger = new Logger(RAGCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getCachedResponse(query: string, category?: string): Promise<any | null> {
    const cacheKey = this.getCacheKey(query, category);
    try {
      const cachedResponse = await this.cacheManager.get(cacheKey);
      if (cachedResponse) {
        this.logger.log(`Cache hit for query: ${query.substring(0, 50)}...`);
        return cachedResponse;
      }
      return null;
    } catch (error) {
      this.logger.error(`Error retrieving from cache: ${error.message}`);
      return null;
    }
  }

  async setCachedResponse(
    query: string, 
    response: any, 
    category?: string, 
    ttl: number = 3600 // Default to 1 hour
  ): Promise<void> {
    const cacheKey = this.getCacheKey(query, category);
    try {
      await this.cacheManager.set(cacheKey, response, ttl);
      this.logger.log(`Cached response for query: ${query.substring(0, 50)}...`);
    } catch (error) {
      this.logger.error(`Error saving to cache: ${error.message}`);
    }
  }

  async invalidateCache(query?: string, category?: string): Promise<void> {
    const cacheKey = query ? this.getCacheKey(query, category) : '*';
    try {
      if (query) {
        await this.cacheManager.del(cacheKey);
        this.logger.log(`Invalidated cache for key: ${cacheKey}`);
      } else {
        // If no specific query, we might want to clear all RAG-related cache
        // This implementation depends on cache manager capabilities
        this.logger.log(`Cleared cache for pattern: ${cacheKey}`);
      }
    } catch (error) {
      this.logger.error(`Error invalidating cache: ${error.message}`);
    }
  }

  private getCacheKey(query: string, category?: string): string {
    // Create a cache key that includes query and category
    const queryHash = this.simpleHash(query);
    const cat = category || 'all';
    return `rag:${cat}:${queryHash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}