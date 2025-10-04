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
  private aiAnalysisCache = new Map<string, CacheEntry<any>>();
  private aiOptimizationCache = new Map<string, CacheEntry<any>>();
  private aiPatternCache = new Map<string, CacheEntry<any>>();
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
    this.clearAICaches();
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

  // ====== AI-Specific Caching Methods ======

  /**
   * Caches AI analysis results
   * @param calendarData Calendar data used for analysis
   * @param analysis AI analysis result
   */
  cacheAIAnalysis(calendarData: Availability[], analysis: any): void {
    const cacheKey = this.generateCacheKey(calendarData, 'ai-analysis');
    this.aiAnalysisCache.set(cacheKey, {
      data: analysis,
      timestamp: Date.now()
    });
    this.cleanupCache(this.aiAnalysisCache);
  }

  /**
   * Gets cached AI analysis results
   * @param calendarData Calendar data to check cache for
   * @returns Cached AI analysis or null
   */
  getCachedAIAnalysis(calendarData: Availability[]): any | null {
    const cacheKey = this.generateCacheKey(calendarData, 'ai-analysis');
    if (this.isCacheValid(cacheKey, this.aiAnalysisCache)) {
      return this.aiAnalysisCache.get(cacheKey)!.data;
    }
    return null;
  }

  /**
   * Caches AI optimization suggestions
   * @param calendarData Calendar data used for optimization
   * @param constraints Optimization constraints
   * @param optimizations AI optimization result
   */
  cacheAIOptimizations(calendarData: Availability[], constraints: any, optimizations: any): void {
    const baseKey = this.generateCacheKey(calendarData, 'ai-optimization');
    const constraintsHash = this.simpleStringHash(JSON.stringify(constraints));
    const cacheKey = `${baseKey}-c${constraintsHash}`;
    
    this.aiOptimizationCache.set(cacheKey, {
      data: optimizations,
      timestamp: Date.now()
    });
    this.cleanupCache(this.aiOptimizationCache);
  }

  /**
   * Gets cached AI optimization suggestions
   * @param calendarData Calendar data to check cache for
   * @param constraints Optimization constraints
   * @returns Cached AI optimizations or null
   */
  getCachedAIOptimizations(calendarData: Availability[], constraints: any): any | null {
    const baseKey = this.generateCacheKey(calendarData, 'ai-optimization');
    const constraintsHash = this.simpleStringHash(JSON.stringify(constraints));
    const cacheKey = `${baseKey}-c${constraintsHash}`;
    
    if (this.isCacheValid(cacheKey, this.aiOptimizationCache)) {
      return this.aiOptimizationCache.get(cacheKey)!.data;
    }
    return null;
  }

  /**
   * Caches AI pattern analysis results
   * @param calendarData Calendar data used for pattern analysis
   * @param patterns AI pattern analysis result
   */
  cacheAIPatterns(calendarData: Availability[], patterns: any): void {
    const cacheKey = this.generateCacheKey(calendarData, 'ai-patterns');
    this.aiPatternCache.set(cacheKey, {
      data: patterns,
      timestamp: Date.now()
    });
    this.cleanupCache(this.aiPatternCache);
  }

  /**
   * Gets cached AI pattern analysis results
   * @param calendarData Calendar data to check cache for
   * @returns Cached AI patterns or null
   */
  getCachedAIPatterns(calendarData: Availability[]): any | null {
    const cacheKey = this.generateCacheKey(calendarData, 'ai-patterns');
    if (this.isCacheValid(cacheKey, this.aiPatternCache)) {
      return this.aiPatternCache.get(cacheKey)!.data;
    }
    return null;
  }

  /**
   * Caches AI conflict analysis results
   * @param calendarData Calendar data used for conflict analysis
   * @param conflicts AI conflict analysis result
   */
  cacheAIConflicts(calendarData: Availability[], conflicts: any): void {
    const cacheKey = this.generateCacheKey(calendarData, 'ai-conflicts');
    this.aiAnalysisCache.set(cacheKey, {
      data: conflicts,
      timestamp: Date.now()
    });
    this.cleanupCache(this.aiAnalysisCache);
  }

  /**
   * Gets cached AI conflict analysis results
   * @param calendarData Calendar data to check cache for
   * @returns Cached AI conflicts or null
   */
  getCachedAIConflicts(calendarData: Availability[]): any | null {
    const cacheKey = this.generateCacheKey(calendarData, 'ai-conflicts');
    if (this.isCacheValid(cacheKey, this.aiAnalysisCache)) {
      return this.aiAnalysisCache.get(cacheKey)!.data;
    }
    return null;
  }

  /**
   * Clears all AI-related caches
   */
  clearAICaches(): void {
    this.aiAnalysisCache.clear();
    this.aiOptimizationCache.clear();
    this.aiPatternCache.clear();
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
      },
      aiAnalysis: {
        size: this.aiAnalysisCache.size,
        entries: Array.from(this.aiAnalysisCache.keys())
      },
      aiOptimization: {
        size: this.aiOptimizationCache.size,
        entries: Array.from(this.aiOptimizationCache.keys())
      },
      aiPatterns: {
        size: this.aiPatternCache.size,
        entries: Array.from(this.aiPatternCache.keys())
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