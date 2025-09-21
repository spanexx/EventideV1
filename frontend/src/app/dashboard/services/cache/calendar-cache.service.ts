import { Injectable } from '@angular/core';
import { Availability } from '../../models/availability.models';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarCacheService {
  private analysisCache = new Map<string, CacheEntry<any>>();
  private searchCache = new Map<string, CacheEntry<any>>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout

  /**
   * Generates a cache key based on calendar data
   */
  generateCacheKey(calendarData: Availability[], prefix: string = 'data'): string {
    if (!Array.isArray(calendarData) || calendarData.length === 0) {
      return `${prefix}-empty`;
    }
    
    // Create a hash based on the data
    const dataHash = calendarData.map(slot => 
      `${slot.id}-${slot.startTime.getTime()}-${slot.endTime.getTime()}-${slot.isBooked}`
    ).join('|');
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dataHash.length; i++) {
      const char = dataHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `${prefix}-${hash}`;
  }

  /**
   * Generates a search-specific cache key
   */
  generateSearchCacheKey(query: string, calendarData: Availability[]): string {
    const dataKey = this.generateCacheKey(calendarData, 'search');
    const queryHash = this.simpleStringHash(query.toLowerCase().trim());
    return `${dataKey}-q${queryHash}`;
  }

  /**
   * Checks if a cached entry is still valid
   */
  isCacheValid(cacheKey: string, cacheMap: Map<string, CacheEntry<any>>): boolean {
    const entry = cacheMap.get(cacheKey);
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    return (now - entry.timestamp) < this.cacheTimeout;
  }

  /**
   * Gets cached analysis result
   */
  getCachedAnalysis<T>(cacheKey: string): T | null {
    if (this.isCacheValid(cacheKey, this.analysisCache)) {
      return this.analysisCache.get(cacheKey)!.data;
    }
    return null;
  }

  /**
   * Caches an analysis result
   */
  cacheAnalysisResult<T>(cacheKey: string, result: T): void {
    this.analysisCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanupCache(this.analysisCache);
  }

  /**
   * Gets cached search result
   */
  getCachedSearchResult<T>(cacheKey: string): T | null {
    if (this.isCacheValid(cacheKey, this.searchCache)) {
      return this.searchCache.get(cacheKey)!.data;
    }
    return null;
  }

  /**
   * Caches a search result
   */
  cacheSearchResult<T>(cacheKey: string, result: T): void {
    this.searchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries
    this.cleanupCache(this.searchCache);
  }

  /**
   * Clears all caches
   */
  clearAllCaches(): void {
    this.analysisCache.clear();
    this.searchCache.clear();
  }

  /**
   * Clears analysis cache
   */
  clearAnalysisCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Clears search cache
   */
  clearSearchCache(): void {
    this.searchCache.clear();
  }

  /**
   * Gets cache statistics
   */
  getCacheStats() {
    return {
      analysis: {
        size: this.analysisCache.size,
        entries: Array.from(this.analysisCache.keys())
      },
      search: {
        size: this.searchCache.size,
        entries: Array.from(this.searchCache.keys())
      }
    };
  }

  /**
   * Cleans up expired cache entries
   */
  private cleanupCache(cacheMap: Map<string, CacheEntry<any>>): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of cacheMap.entries()) {
      if ((now - entry.timestamp) >= this.cacheTimeout) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => cacheMap.delete(key));
  }

  /**
   * Simple string hash function
   */
  private simpleStringHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}