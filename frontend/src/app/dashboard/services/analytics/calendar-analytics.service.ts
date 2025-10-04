import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Availability } from '../../models/availability.models';
import { CalendarView, DensityLevel } from '../smart-calendar-manager.service';
import { SmartCalendarLoggerService } from '../smart-calendar-logger.service';

export interface CalendarAnalysisResult {
  viewOptimization: ViewOptimizationResult;
  contentInsights: CalendarInsightsResult;
  userRecommendations: RecommendationsResult;
}

export interface ViewOptimizationResult {
  recommendedView: CalendarView;
  densityAdjustment: DensityLevel;
  filterSuggestions: FilterSuggestion[];
}

export interface CalendarInsightsResult {
  totalSlots: number;
  bookedSlots: number;
  conflictingSlots: number;
  occupancyRate: number;
  peakHours: PeakHour[];
  optimalBookingWindows: BookingWindow[];
  [key: string]: any;
}

export interface RecommendationsResult {
  conflicts?: string | null;
  peakHours?: string | null;
  optimalWindows?: string | null;
  [key: string]: any;
}

export interface FilterSuggestion {
  type?: 'booked' | 'available' | 'all';
  dateRange?: { start: Date; end: Date };
  minDuration?: number;
  maxDuration?: number;
  [key: string]: any;
}

export interface PeakHour {
  hour: number;
  count: number;
  label: string;
}

export interface BookingWindow {
  dayOfWeek: number;
  dayName: string;
  hour: number;
  count: number;
  label: string;
}

export interface ConflictInfo {
  type: string;
  slots: Availability[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarAnalyticsService {
  private logger = inject(SmartCalendarLoggerService);

  /**
   * Analyzes calendar data to provide insights and recommendations
   */
  analyzeCalendarData(calendarData: Availability[]): Observable<CalendarAnalysisResult> {
    // Only log when we have meaningful data
    if (Array.isArray(calendarData) && calendarData.length > 0) {
      this.logger.debug('CalendarAnalyticsService', 'Starting calendar analysis', { dataLength: calendarData.length });
    }
    
    const metrics = this.calculateMetrics(calendarData);
    const conflicts = this.detectConflicts(calendarData);
    const peakHours = this.identifyPeakHours(calendarData);
    const optimalWindows = this.identifyOptimalBookingWindows(calendarData);
    
    const analysis: CalendarAnalysisResult = {
      viewOptimization: {
        recommendedView: this.determineRecommendedView(metrics),
        densityAdjustment: metrics.totalSlots > 30 ? 'high' : 'medium',
        filterSuggestions: this.generateFilterSuggestions(metrics, peakHours)
      },
      contentInsights: {
        totalSlots: metrics.totalSlots,
        bookedSlots: metrics.bookedSlots,
        conflictingSlots: conflicts.length,
        occupancyRate: metrics.occupancyRate,
        peakHours: peakHours,
        optimalBookingWindows: optimalWindows
      },
      userRecommendations: {
        conflicts: conflicts.length > 0 ? `You have ${conflicts.length} conflicting slots that need attention.` : null,
        peakHours: peakHours.length > 0 ? `Peak booking hours are ${peakHours.map(h => h.label).join(', ')}.` : null,
        optimalWindows: optimalWindows.length > 0 ? `Optimal booking windows are ${optimalWindows.map(w => w.label).join(', ')}.` : null
      }
    };
    
    // Only log when we have data
    if (metrics.totalSlots > 0) {
      this.logger.debug('CalendarAnalyticsService', 'Calendar analysis completed', {
        totalSlots: metrics.totalSlots,
        conflicts: conflicts.length,
        peakHours: peakHours.length
      });
    }
    
    return of(analysis);
  }

  /**
   * Calculates basic metrics from calendar data
   */
  private calculateMetrics(calendarData: Availability[]) {
    if (!Array.isArray(calendarData)) {
      return {
        totalSlots: 0,
        bookedSlots: 0,
        expiredSlots: 0,
        upcomingSlots: 0,
        conflictingSlots: 0,
        occupancyRate: 0
      };
    }

    const totalSlots = calendarData.length;
    const bookedSlots = calendarData.filter(slot => slot.isBooked).length;
    
    return {
      totalSlots,
      bookedSlots,
      expiredSlots: 0,
      upcomingSlots: 0,
      conflictingSlots: 0,
      occupancyRate: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0
    };
  }

  /**
   * Determines the recommended calendar view based on metrics
   */
  private determineRecommendedView(metrics: any): CalendarView {
    // If we have a high number of conflicts, recommend day view for better conflict resolution
    if (metrics.conflictingSlots > 5) {
      return 'timeGridDay';
    }
    // If we have a high occupancy rate and many slots, recommend month view for overview
    else if (metrics.occupancyRate > 80 && metrics.totalSlots > 30) {
      return 'dayGridMonth';
    }
    // If we have peak hours with many bookings, recommend week view for better time grid visualization
    else if (metrics.totalSlots > 20) {
      return 'timeGridWeek';
    }
    // Default logic based on slot count
    else if (metrics.totalSlots > 50) {
      return 'dayGridMonth';
    } else if (metrics.totalSlots > 10) {
      return 'timeGridWeek';
    } else {
      return 'timeGridDay';
    }
  }

  /**
   * Generates filter suggestions based on analysis
   */
  private generateFilterSuggestions(metrics: any, peakHours: PeakHour[]): FilterSuggestion[] {
    const suggestions: FilterSuggestion[] = [];
    
    // Suggest filtering by booked slots if we have many
    if (metrics.bookedSlots > metrics.totalSlots * 0.5) {
      suggestions.push({ type: 'booked' });
    }
    
    // Suggest filtering by available slots if we have many
    if ((metrics.totalSlots - metrics.bookedSlots) > metrics.totalSlots * 0.5) {
      suggestions.push({ type: 'available' });
    }
    
    // Suggest filtering by peak hours
    if (peakHours.length > 0) {
      suggestions.push({ 
        minDuration: 30,
        maxDuration: 120
      });
    }
    
    return suggestions;
  }

  /**
   * Detects conflicts in calendar data
   */
  detectConflicts(calendarData: Availability[]): ConflictInfo[] {
    this.logger.debug('CalendarAnalyticsService', 'Detecting conflicts');
    
    if (!Array.isArray(calendarData) || calendarData.length === 0) {
      return [];
    }
    
    const conflicts: ConflictInfo[] = [];
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
    
    this.logger.debug('CalendarAnalyticsService', 'Conflict detection completed', { conflictCount: conflicts.length });
    return conflicts;
  }

  /**
   * Identifies peak hours based on calendar data
   */
  identifyPeakHours(calendarData: Availability[]): PeakHour[] {
    this.logger.debug('CalendarAnalyticsService', 'Identifying peak hours');
    
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
    
    this.logger.debug('CalendarAnalyticsService', 'Peak hour identification completed', { peakHours });
    return peakHours;
  }

  /**
   * Identifies optimal booking windows based on calendar data
   */
  identifyOptimalBookingWindows(calendarData: Availability[]): BookingWindow[] {
    this.logger.debug('CalendarAnalyticsService', 'Identifying optimal booking windows');
    
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
    
    this.logger.debug('CalendarAnalyticsService', 'Optimal booking windows identified', { optimalWindows });
    return optimalWindows;
  }

  /**
   * Filters calendar data based on provided filter options
   */
  filterCalendarData(calendarData: Availability[], filters: FilterSuggestion): Availability[] {
    this.logger.debug('CalendarAnalyticsService', 'Filtering calendar data', { filters });
    
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
    
    this.logger.debug('CalendarAnalyticsService', 'Filtering completed', { 
      originalCount: calendarData.length, 
      filteredCount: filteredData.length 
    });
    
    return filteredData;
  }
}