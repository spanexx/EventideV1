// Existing services
export * from './analytics.service';
export * from './availability-dialog.facade';
export * from './availability-generation.service';
export * from './availability.service';
export * from './booking.service';
export * from './dashboard-socket.service';
export * from './dashboard.service';
export * from './mock-availability.service';
export * from './mock-booking.service';
export * from './mock-dashboard.service';

// Smart calendar services
export * from './smart-calendar-manager.service';
export { SmartContentAnalyzerService } from './smart-content-analyzer.service';
export type { ContentAnalysisResult, FilterOptions } from './smart-content-analyzer.service';

// Modular search and analytics services
export { SmartSearchService } from './search/smart-search.service';
export type { SearchResult } from './search/smart-search.service';
export { SearchFilterService } from './search/search-filter.service';
export { DateParserService } from './search/date-parser.service';
export { TemporalParserService } from './search/temporal-parser.service';
export { KeywordMatcherService } from './search/keyword-matcher.service';
export { SuggestionGeneratorService } from './search/suggestion-generator.service';
export { CalendarAnalyticsService } from './analytics/calendar-analytics.service';
export type { CalendarAnalysisResult } from './analytics/calendar-analytics.service';
export { CalendarCacheService } from './cache/calendar-cache.service';