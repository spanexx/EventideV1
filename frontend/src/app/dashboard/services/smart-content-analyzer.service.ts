import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Availability } from '../models/availability.models';
import { SmartCalendarLoggerService } from './smart-calendar-logger.service';

// Import modular services
import { SmartSearchService, SearchResult } from './search/smart-search.service';
import { CalendarAnalyticsService, CalendarAnalysisResult } from './analytics/calendar-analytics.service';
import { CalendarCacheService } from './cache/calendar-cache.service';

// Re-export types for backward compatibility
export interface ContentAnalysisResult extends CalendarAnalysisResult {}
export interface FilterOptions {
  type?: 'booked' | 'available' | 'all';
  dateRange?: { start: Date; end: Date };
  minDuration?: number;
  maxDuration?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class SmartContentAnalyzerService {
  private logger = inject(SmartCalendarLoggerService);
  private searchService = inject(SmartSearchService);
  private analyticsService = inject(CalendarAnalyticsService);
  private cacheService = inject(CalendarCacheService);

  /**
   * Analyzes calendar content to provide intelligent insights and recommendations
   */
  analyzeContent(calendarData: Availability[]): Observable<ContentAnalysisResult> {
    // Check cache first
    const cacheKey = this.cacheService.generateCacheKey(calendarData, 'analysis');
    const cachedResult = this.cacheService.getCachedAnalysis<ContentAnalysisResult>(cacheKey);
    
    if (cachedResult) {
      this.logger.debug('SmartContentAnalyzerService', 'Returning cached analysis result', { cacheKey });
      return new Observable(observer => {
        observer.next(cachedResult);
        observer.complete();
      });
    }
    
    // Perform fresh analysis
    return this.analyticsService.analyzeCalendarData(calendarData).pipe(
      map(result => {
        // Cache the result
        this.cacheService.cacheAnalysisResult(cacheKey, result);
        return result;
      })
    );
  }

  /**
   * Searches calendar data using enhanced AI-powered natural language processing
   */
  async searchWithEnhancedNLP(query: string, calendarData: Availability[]): Promise<SearchResult> {
    // Check cache first
    const cacheKey = this.cacheService.generateSearchCacheKey(query, calendarData);
    const cachedResult = this.cacheService.getCachedSearchResult<SearchResult>(cacheKey);
    
    if (cachedResult) {
      console.log('🚀 SmartContentAnalyzer: Returning cached search result');
      this.logger.debug('SmartContentAnalyzerService', 'Returning cached search result', { query, cacheKey });
      return cachedResult;
    }
    
    // Perform fresh search
    const result = await this.searchService.search(query, calendarData);
    
    // Cache the result
    this.cacheService.cacheSearchResult(cacheKey, result);
    
    return result;
  }

  /**
   * Searches calendar data using basic natural language processing (legacy method)
   * @deprecated Use searchWithEnhancedNLP instead
   */
  async searchWithNLP(query: string, calendarData: Availability[]): Promise<Availability[]> {
    this.logger.debug('SmartContentAnalyzerService', 'Using legacy NLP search', { query });
    
    if (!query || !Array.isArray(calendarData) || calendarData.length === 0) {
      return [];
    }
    
    // Use the search service for consistent behavior
    try {
      const result = await this.searchService.search(query, calendarData);
      return result.results;
    } catch (error) {
      this.logger.error('SmartContentAnalyzerService', 'Legacy search failed', error);
      return [];
    }
  }

  /**
   * Filters calendar data based on provided filter options
   */
  filterCalendarData(calendarData: Availability[], filters: FilterOptions): Availability[] {
    return this.analyticsService.filterCalendarData(calendarData, filters);
  }

  /**
   * Generate smart search suggestions for the current calendar data
   */
  async generateSearchSuggestions(calendarData: Availability[]): Promise<string[]> {
    return this.searchService.generateSearchSuggestions(calendarData);
  }

  /**
   * Detects conflicts in calendar data
   */
  detectConflicts(calendarData: Availability[]): any[] {
    return this.analyticsService.detectConflicts(calendarData);
  }

  /**
   * Identifies peak hours based on calendar data
   */
  identifyPeakHours(calendarData: Availability[]): any[] {
    return this.analyticsService.identifyPeakHours(calendarData);
  }

  /**
   * Identifies optimal booking windows based on calendar data
   */
  identifyOptimalBookingWindows(calendarData: Availability[]): any[] {
    return this.analyticsService.identifyOptimalBookingWindows(calendarData);
  }

  /**
   * Clears all caches
   */
  clearCaches(): void {
    this.cacheService.clearAllCaches();
    this.logger.debug('SmartContentAnalyzerService', 'All caches cleared');
  }

  /**
   * Gets cache statistics for monitoring
   */
  getCacheStats() {
    return this.cacheService.getCacheStats();
  }
}