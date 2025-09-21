import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CalendarView, DensityLevel } from './smart-calendar-manager.service';
import { Availability } from '../models/availability.models';
import { SmartCalendarLoggerService } from './smart-calendar-logger.service';
import { AIService } from '../../services/ai.service';

export interface ContentAnalysisResult {
  viewOptimization: ViewOptimizationSuggestionsResult;
  contentInsights: CalendarInsightsResult;
  userRecommendations: SmartRecommendationsResult;
}

export interface ViewOptimizationSuggestionsResult {
  recommendedView: CalendarView;
  densityAdjustment: DensityLevel;
  filterSuggestions: FilterOptions[];
}

export interface CalendarInsightsResult {
  totalSlots: number;
  bookedSlots: number;
  conflictingSlots: number;
  occupancyRate: number;
  peakHours: any[];
  optimalBookingWindows: any[];
  [key: string]: any;
}

export interface SmartRecommendationsResult {
  conflicts?: string | null;
  peakHours?: string | null;
  optimalWindows?: string | null;
  [key: string]: any;
}

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
  // Add cache for analysis results
  private analysisCache: Map<string, ContentAnalysisResult> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(
    private logger: SmartCalendarLoggerService,
    private aiService: AIService = inject(AIService)
  ) { }

  /**
   * Analyzes calendar content to provide intelligent insights and recommendations
   */
  analyzeContent(calendarData: Availability[]): Observable<ContentAnalysisResult> {
    // Create a cache key based on the data
    const cacheKey = this.generateCacheKey(calendarData);
    
    // Check if we have a valid cached result
    if (this.isCacheValid(cacheKey)) {
      this.logger.debug('SmartContentAnalyzerService', 'Returning cached analysis result', { cacheKey });
      return of(this.analysisCache.get(cacheKey)!);
    }
    
    // Only log when we have meaningful data
    if (Array.isArray(calendarData) && calendarData.length > 0) {
      this.logger.debug('SmartContentAnalyzerService', 'Starting content analysis', { dataLength: calendarData.length });
    }
    
    // If calendarData is an array of Availability objects
    let totalSlots = 0;
    let bookedSlots = 0;
    let conflictingSlots = 0;
    
    if (Array.isArray(calendarData)) {
      totalSlots = calendarData.length;
      bookedSlots = calendarData.filter((slot: Availability) => slot.isBooked).length;
      
      // Detect conflicts
      const conflicts = this.detectConflicts(calendarData);
      conflictingSlots = conflicts.length;
      
      // Only log when we have data
      if (totalSlots > 0) {
        this.logger.debug('SmartContentAnalyzerService', 'Analyzed slots', { totalSlots, bookedSlots, conflictingSlots });
      }
    } else if (calendarData) {
      // Only log warning for non-null, non-array data
      this.logger.warn('SmartContentAnalyzerService', 'Calendar data is not an array', { dataType: typeof calendarData });
    }
    
    // Create a metrics object to pass to determineBestView
    const metrics = {
      totalSlots: totalSlots,
      bookedSlots: bookedSlots,
      expiredSlots: 0,
      upcomingSlots: 0,
      conflictingSlots: conflictingSlots,
      occupancyRate: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0
    };
    
    // Determine recommended view based on multiple factors using the SmartCalendarManagerService
    let recommendedView: CalendarView = 'timeGridWeek';
    // We would need to inject the SmartCalendarManagerService to use its determineBestView method
    // For now, we'll implement the logic directly
    
    // If we have a high number of conflicts, recommend day view for better conflict resolution
    if (metrics.conflictingSlots > 5) {
      recommendedView = 'timeGridDay';
    }
    // If we have a high occupancy rate and many slots, recommend month view for overview
    else if (metrics.occupancyRate > 80 && metrics.totalSlots > 30) {
      recommendedView = 'dayGridMonth';
    }
    // If we have peak hours with many bookings, recommend week view for better time grid visualization
    else if (metrics.totalSlots > 20) {
      recommendedView = 'timeGridWeek';
    }
    // Default logic based on slot count
    else if (metrics.totalSlots > 50) {
      recommendedView = 'dayGridMonth';
    } else if (metrics.totalSlots > 10) {
      recommendedView = 'timeGridWeek';
    } else {
      recommendedView = 'timeGridDay';
    }
    
    // Only log when we have data
    if (totalSlots > 0) {
      this.logger.debug('SmartContentAnalyzerService', 'Determined recommended view', { recommendedView, totalSlots });
    }
    
    // Identify peak hours
    const peakHours = this.identifyPeakHours(calendarData);
    
    // Identify optimal booking windows
    const optimalWindows = this.identifyOptimalBookingWindows(calendarData);
    
    // Generate filter suggestions based on analysis
    const filterSuggestions: FilterOptions[] = [];
    
    // Suggest filtering by booked slots if we have many
    if (bookedSlots > totalSlots * 0.5) {
      filterSuggestions.push({ type: 'booked' });
    }
    
    // Suggest filtering by available slots if we have many
    if ((totalSlots - bookedSlots) > totalSlots * 0.5) {
      filterSuggestions.push({ type: 'available' });
    }
    
    // Suggest filtering by peak hours
    if (peakHours.length > 0) {
      // Get the first peak hour
      const peakHour = peakHours[0].hour;
      // Suggest filtering for slots that start at the peak hour
      filterSuggestions.push({ 
        minDuration: 30,
        maxDuration: 120
      });
    }
    
    // Create analysis result
    const analysis: ContentAnalysisResult = {
      viewOptimization: {
        recommendedView: recommendedView,
        densityAdjustment: totalSlots > 30 ? 'high' : 'medium',
        filterSuggestions: filterSuggestions
      },
      contentInsights: {
        totalSlots: totalSlots,
        bookedSlots: bookedSlots,
        conflictingSlots: conflictingSlots,
        occupancyRate: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0,
        peakHours: peakHours,
        optimalBookingWindows: optimalWindows
      },
      userRecommendations: {
        conflicts: conflictingSlots > 0 ? `You have ${conflictingSlots} conflicting slots that need attention.` : null,
        peakHours: peakHours.length > 0 ? `Peak booking hours are ${peakHours.map(h => h.label).join(', ')}.` : null,
        optimalWindows: optimalWindows.length > 0 ? `Optimal booking windows are ${optimalWindows.map(w => w.label).join(', ')}.` : null
      }
    };
    
    // Cache the result
    this.cacheAnalysisResult(cacheKey, analysis);
    
    // Only log when we have data
    if (totalSlots > 0) {
      this.logger.debug('SmartContentAnalyzerService', 'Content analysis completed');
    }
    
    return of(analysis);
  }

  /**
   * Identifies optimal booking windows based on calendar data
   */
  identifyOptimalBookingWindows(calendarData: Availability[]): any[] {
    this.logger.debug('SmartContentAnalyzerService', 'Identifying optimal booking windows');
    
    if (!Array.isArray(calendarData) || calendarData.length === 0) {
      return [];
    }
    
    // Group slots by day of week and hour
    const slotsByDayHour: { [key: string]: number } = {};
    
    calendarData.forEach(slot => {
      const dayOfWeek = slot.startTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = slot.startTime.getHours();
      const key = `${dayOfWeek}-${hour}`;
      slotsByDayHour[key] = (slotsByDayHour[key] || 0) + 1;
    });
    
    // Find the most popular day-hour combinations
    const sortedSlots = Object.entries(slotsByDayHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 optimal booking windows
    
    const optimalWindows = sortedSlots.map(([key, count]) => {
      const [day, hour] = key.split('-').map(Number);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      return {
        dayOfWeek: day,
        dayName: dayNames[day],
        hour: hour,
        count: count,
        label: `${dayNames[day]} at ${hour}:00`
      };
    });
    
    this.logger.debug('SmartContentAnalyzerService', 'Optimal booking windows identified', { optimalWindows });
    return optimalWindows;
  }

  /**
   * Filters calendar data based on provided filter options
   */
  filterCalendarData(calendarData: Availability[], filters: FilterOptions): Availability[] {
    this.logger.debug('SmartContentAnalyzerService', 'Filtering calendar data', { filters });
    
    if (!Array.isArray(calendarData) || calendarData.length === 0) {
      return [];
    }
    
    let filteredData = [...calendarData];
    
    // Filter by type (booked/available)
    if (filters.type && filters.type !== 'all') {
      if (filters.type === 'booked') {
        filteredData = filteredData.filter(slot => slot.isBooked);
      } else if (filters.type === 'available') {
        filteredData = filteredData.filter(slot => !slot.isBooked);
      }
    }
    
    // Filter by date range
    if (filters.dateRange) {
      filteredData = filteredData.filter(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        return slotStart >= filters.dateRange!.start && slotEnd <= filters.dateRange!.end;
      });
    }
    
    // Filter by minimum duration
    if (filters.minDuration !== undefined) {
      filteredData = filteredData.filter(slot => {
        const duration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60); // in minutes
        return duration >= filters.minDuration!;
      });
    }
    
    // Filter by maximum duration
    if (filters.maxDuration !== undefined) {
      filteredData = filteredData.filter(slot => {
        const duration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60); // in minutes
        return duration <= filters.maxDuration!;
      });
    }
    
    this.logger.debug('SmartContentAnalyzerService', 'Filtering completed', { 
      originalCount: calendarData.length, 
      filteredCount: filteredData.length 
    });
    
    return filteredData;
  }
  
  /**
   * Searches calendar data using natural language processing
   */
  searchWithNLP(query: string, calendarData: Availability[]): Availability[] {
    this.logger.debug('SmartContentAnalyzerService', 'Performing NLP search', { query });
    
    if (!query || !Array.isArray(calendarData) || calendarData.length === 0) {
      return [];
    }
    
    // Convert query to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();
    
    // Simple NLP-based search implementation
    let filteredData = [...calendarData];
    
    // Handle common search patterns
    if (lowerQuery.includes('booked') || lowerQuery.includes('reserved')) {
      filteredData = filteredData.filter(slot => slot.isBooked);
    }
    
    if (lowerQuery.includes('available') || lowerQuery.includes('free')) {
      filteredData = filteredData.filter(slot => !slot.isBooked);
    }
    
    // Handle time-based searches
    if (lowerQuery.includes('morning')) {
      filteredData = filteredData.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 6 && hour < 12;
      });
    }
    
    if (lowerQuery.includes('afternoon')) {
      filteredData = filteredData.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 12 && hour < 18;
      });
    }
    
    if (lowerQuery.includes('evening')) {
      filteredData = filteredData.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 18 && hour < 22;
      });
    }
    
    if (lowerQuery.includes('night')) {
      filteredData = filteredData.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 22 || hour < 6;
      });
    }
    
    // Handle duration-based searches
    if (lowerQuery.includes('long') || lowerQuery.includes('extended')) {
      filteredData = filteredData.filter(slot => {
        const duration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60); // in minutes
        return duration > 60;
      });
    }
    
    if (lowerQuery.includes('short') || lowerQuery.includes('quick')) {
      filteredData = filteredData.filter(slot => {
        const duration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60); // in minutes
        return duration <= 30;
      });
    }
    
    // Handle date-based searches (simple pattern matching)
    if (lowerQuery.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filteredData = filteredData.filter(slot => {
        const slotDate = new Date(slot.startTime);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() === today.getTime();
      });
    }
    
    if (lowerQuery.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      filteredData = filteredData.filter(slot => {
        const slotDate = new Date(slot.startTime);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() === tomorrow.getTime();
      });
    }
    
    this.logger.debug('SmartContentAnalyzerService', 'NLP search completed', { 
      query, 
      resultCount: filteredData.length 
    });
    
    return filteredData;
  }
  
  /**
   * Detects conflicts in the calendar data
   */
  detectConflicts(calendarData: Availability[]): any[] {
    this.logger.debug('SmartContentAnalyzerService', 'Detecting conflicts');
    
    if (!Array.isArray(calendarData) || calendarData.length === 0) {
      return [];
    }
    
    const conflicts: any[] = [];
    const sortedData = [...calendarData].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
    
    // Check for overlapping slots
    for (let i = 0; i < sortedData.length - 1; i++) {
      const current = sortedData[i];
      const next = sortedData[i + 1];
      
      // Check if current slot overlaps with next slot
      if (current.endTime > next.startTime) {
        conflicts.push({
          type: 'time_overlap',
          slots: [current, next],
          message: `Time conflict between ${current.startTime.toLocaleTimeString()} - ${current.endTime.toLocaleTimeString()} and ${next.startTime.toLocaleTimeString()} - ${next.endTime.toLocaleTimeString()}`
        });
      }
    }
    
    this.logger.debug('SmartContentAnalyzerService', 'Conflict detection completed', { conflictCount: conflicts.length });
    return conflicts;
  }
  
  /**
   * Identifies peak hours based on calendar data
   */
  identifyPeakHours(calendarData: Availability[]): any[] {
    this.logger.debug('SmartContentAnalyzerService', 'Identifying peak hours');
    
    if (!Array.isArray(calendarData) || calendarData.length === 0) {
      return [];
    }
    
    // Group slots by hour
    const hourlySlots: { [key: number]: number } = {};
    
    calendarData.forEach(slot => {
      const startHour = slot.startTime.getHours();
      hourlySlots[startHour] = (hourlySlots[startHour] || 0) + 1;
    });
    
    // Find peak hours (hours with most slots)
    const sortedHours = Object.entries(hourlySlots)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3); // Top 3 peak hours
    
    const peakHours = sortedHours.map(([hour, count]) => ({
      hour: parseInt(hour),
      count: count,
      label: `${hour}:00 - ${hour}:59`
    }));
    
    this.logger.debug('SmartContentAnalyzerService', 'Peak hour identification completed', { peakHours });
    return peakHours;
  }
  
  /**
   * Generates a cache key based on calendar data
   */
  private generateCacheKey(calendarData: Availability[]): string {
    if (!Array.isArray(calendarData) || calendarData.length === 0) {
      return 'empty';
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
    
    return `analysis-${hash}`;
  }
  
  /**
   * Checks if a cached result is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    if (!this.analysisCache.has(cacheKey)) {
      return false;
    }
    
    const timestamp = this.cacheTimestamps.get(cacheKey);
    if (!timestamp) {
      return false;
    }
    
    const now = Date.now();
    return (now - timestamp) < this.cacheTimeout;
  }
  
  /**
   * Caches an analysis result
   */
  private cacheAnalysisResult(cacheKey: string, result: ContentAnalysisResult): void {
    this.analysisCache.set(cacheKey, result);
    this.cacheTimestamps.set(cacheKey, Date.now());
    
    // Clean up old cache entries
    this.cleanupCache();
  }
  
  /**
   * Cleans up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if ((now - timestamp) >= this.cacheTimeout) {
        this.analysisCache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }
}