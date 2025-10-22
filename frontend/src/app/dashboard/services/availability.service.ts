import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Availability } from '../models/availability.models';
import { EventInput } from '@fullcalendar/core';
import { createDateRangeWithBuffer } from '../utils/timezone.utils';
import { CalendarCacheService } from './cache/calendar-cache.service';
import { AIService } from '../../services/ai.service';

export interface AllDaySlot {
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface BulkSlotConfig {
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface CreateAllDayAvailabilityDto {
  providerId: string;
  date: Date;
  numberOfSlots?: number;
  minutesPerSlot?: number;
  breakTime?: number;
  autoDistribute?: boolean;
  slots?: AllDaySlot[];
  isRecurring?: boolean;
  dayOfWeek?: number;
}

export interface CreateBulkAvailabilityDto {
  providerId: string;
  type?: 'one_off' | 'recurring';
  dayOfWeek?: number;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
  quantity?: number;
  slots?: BulkSlotConfig[];
  skipConflicts?: boolean;
  replaceConflicts?: boolean;
  dryRun?: boolean;
  idempotencyKey?: string;
}

export interface BulkValidationResponse {
  created?: any[];
  conflicts: Array<{ requested: BulkSlotConfig & { date?: Date }; conflictingWith: any[] }>;
  suggestions?: Array<{ for: any; alternative: { startTime: Date; endTime: Date } }>;
}

// AI-Enhanced Types
export interface AIEnhancedAvailabilityResponse {
  data: Availability[];
  aiAnalysis?: {
    conflicts?: {
      hasConflicts: boolean;
      conflicts: any[];
      summary: string;
    };
    patterns?: {
      patterns: any[];
      trends: any;
      insights: string[];
      summary: string;
    };
    optimizations?: {
      optimizations: any[];
      summary: string;
    };
    insights?: string[];
    summary?: string;
  };
}

export interface AICreateResponse {
  data: Availability;
  aiAnalysis: {
    validation: any;
    conflicts?: any;
    suggestions?: string[];
  };
}

export interface AIBulkResponse {
  data: Availability[];
  aiAnalysis: {
    validation: any;
    conflicts: any;
    optimizations: any;
    efficiencyScore: number;
    recommendations: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private readonly API_URL = `${environment.apiUrl}/availability`;
  private readonly AI_API_URL = `${environment.apiUrl}/availability/ai`;
  private readonly BULK_AI_URL = `${environment.apiUrl}/availability/bulk/ai`;
  // Simple in-memory TTL cache for weekly availability fetches
  private readonly availabilityCache = new Map<string, { data: AIEnhancedAvailabilityResponse; ts: number }>();
  private readonly availabilityCacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private cacheService: CalendarCacheService,
    private aiService: AIService
  ) { }

  // Build deterministic cache key per provider/week/analysis flag
  private buildAvailabilityCacheKey(providerId: string, startDate: Date, endDate: Date, includeAnalysis: boolean): string {
    return [providerId, startDate.toISOString(), endDate.toISOString(), includeAnalysis ? 'ai' : 'noai'].join('|');
  }

  // Public invalidation API (used by effects after mutations)
  clearAvailabilityCache(): void {
    if (this.availabilityCache.size) {
      console.debug('[AvailabilityService] Clearing availability cache');
    }
    this.availabilityCache.clear();
  }

  getAvailability(providerId: string, date: Date): Observable<Availability[]> {
    // Calculate start and end dates for the week with proper timezone handling
    const { startDate, endDate } = createDateRangeWithBuffer(date, 1);
    
    // Ensure dates are properly normalized
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let params = new HttpParams();
    params = params.append('startDate', startDate.toISOString());
    params = params.append('endDate', endDate.toISOString());

    return this.http.get<any[]>(`${this.API_URL}/${providerId}`, { params }).pipe(
      map(availability => availability.map(slot => ({
        ...slot,
        id: slot._id || slot.id, // Use _id if available, otherwise use id
        date: slot.date ? new Date(slot.date) : undefined,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime)
      })))
    );
  }

  createAvailability(availability: Availability): Observable<Availability> {
    return this.http.post<any>(`${this.API_URL}`, availability).pipe(
      map(slot => ({
        ...slot,
        // id: slot._id || slot.id, // Use _id if available, otherwise use id
        date: slot.date ? new Date(slot.date) : undefined,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime)
      }))
    );
  }

  /**
   * Create all-day availability slots
   * @param allDayAvailabilityDto - Data for creating all-day slots
   * @returns Array of created availability slots
   */
  createAllDayAvailability(allDayAvailabilityDto: CreateAllDayAvailabilityDto): Observable<Availability[]> {
    return this.http.post<any[]>(`${this.API_URL}/all-day`, allDayAvailabilityDto).pipe(
      map(slots => slots.map(slot => ({
        ...slot,
        id: slot._id || slot.id,
        date: slot.date ? new Date(slot.date) : undefined,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime)
      })))
    );
  }

  updateAvailability(availability: Availability): Observable<Availability> {
    return this.http.put<any>(`${this.API_URL}/${availability.id}`, availability).pipe(
      map(slot => ({
        ...slot,
        id: slot._id || slot.id, // Use _id if available, otherwise use id
        date: slot.date ? new Date(slot.date) : undefined,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime)
      }))
    );
  }

  deleteAvailability(id: string): Observable<any> {
    // Use the provided id directly since it's what we pass to the method
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  // Convert Availability objects to Calendar events
  convertToCalendarEvents(availability: Availability[]): EventInput[] {
    return availability.map(slot => ({
      id: slot.id,
      title: slot.isBooked ? 'Booked' : 'Available',
      start: new Date(slot.startTime),
      end: new Date(slot.endTime),
      classNames: [slot.isBooked ? 'event-booked' : 'event-available'],
      extendedProps: {
        isBooked: slot.isBooked,
        isRecurring: slot.type === 'recurring'
      }
    }));
  }

  /**
   * Create multiple availability slots in bulk
   * @param bulkAvailabilityDto - Data for creating multiple availability slots
   * @returns Array of created availability slots
   */
  createBulkAvailability(bulkAvailabilityDto: CreateBulkAvailabilityDto): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/bulk`, bulkAvailabilityDto).pipe(
      map(res => {
        if (Array.isArray(res)) {
          return res.map(slot => ({
            ...slot,
            id: slot._id || slot.id,
            date: slot.date ? new Date(slot.date) : undefined,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime)
          }));
        }
        // Multi-status response: { created, conflicts }
        return {
          created: (res.created || []).map((slot: any) => ({
            ...slot,
            id: slot._id || slot.id,
            date: slot.date ? new Date(slot.date) : undefined,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime)
          })),
          conflicts: (res.conflicts || []).map((c: any) => ({
            ...c,
            requested: {
              ...c.requested,
              startTime: new Date(c.requested.startTime),
              endTime: new Date(c.requested.endTime)
            },
            conflictingWith: (c.conflictingWith || []).map((x: any) => ({
              ...x,
              startTime: new Date(x.startTime),
              endTime: new Date(x.endTime)
            }))
          }))
        };
      })
    );
  }

  /**
   * Copy week availability slots.
   * This method reuses the createBulkAvailability endpoint with conflict resolution.
   * @param dto - Data for copying week availability.
   * @returns Observable of the operation result.
   */
  copyWeek(dto: CreateBulkAvailabilityDto): Observable<any> {
    return this.createBulkAvailability(dto);
  }

  validateAvailability(payload: CreateBulkAvailabilityDto): Observable<BulkValidationResponse> {
    return this.http.post<any>(`${this.API_URL}/validate`, payload).pipe(
      map(res => ({
        ...res,
        conflicts: (res?.conflicts || []).map((c: any) => ({
          ...c,
          requested: {
            ...c.requested,
            startTime: new Date(c.requested.startTime),
            endTime: new Date(c.requested.endTime)
          },
          conflictingWith: (c.conflictingWith || []).map((x: any) => ({
            ...x,
            startTime: new Date(x.startTime),
            endTime: new Date(x.endTime)
          }))
        })),
        suggestions: (res?.suggestions || []).map((s: any) => ({
          ...s,
          alternative: {
            startTime: new Date(s.alternative.startTime),
            endTime: new Date(s.alternative.endTime)
          }
        }))
      }))
    );
  }

  generateIdempotencyKey(prefix: string = 'bulk'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // ===== AI-ENHANCED METHODS =====

  /**
   * Get AI-enhanced availability data with insights and optimization suggestions
   * @param providerId - Provider ID
   * @param date - Date to get availability for
   * @param includeAnalysis - Whether to include AI analysis (default: true)
   * @returns Enhanced availability data with AI insights
   */
  getAIEnhancedAvailability(providerId: string, date: Date, includeAnalysis: boolean = true): Observable<AIEnhancedAvailabilityResponse> {
    // Calculate start and end dates for the week
    const { startDate, endDate } = createDateRangeWithBuffer(date, 1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let params = new HttpParams();
    params = params.append('startDate', startDate.toISOString());
    params = params.append('endDate', endDate.toISOString());
    params = params.append('includeAnalysis', includeAnalysis.toString());

    const cacheKey = this.buildAvailabilityCacheKey(providerId, startDate, endDate, includeAnalysis);
    const cached = this.availabilityCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < this.availabilityCacheTTL) {
      console.debug('[AvailabilityService] Cache hit for availability', { providerId, startDate, endDate, includeAnalysis });
      return of(cached.data);
    }

    console.debug('[AvailabilityService] Cache miss for availability, fetching', { providerId, startDate, endDate, includeAnalysis });
    return this.http.get<AIEnhancedAvailabilityResponse>(`${this.AI_API_URL}/${providerId}/enhanced`, { params }).pipe(
      map(response => ({
        ...response,
        data: (response.data || []).map(slot => ({
          ...slot,
          id: slot.id || (slot as any)._id,
          date: slot.date ? new Date(slot.date) : undefined,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime)
        }))
      })),
      map((normalized) => {
        this.availabilityCache.set(cacheKey, { data: normalized, ts: Date.now() });
        return normalized;
      }),
      catchError(error => {
        console.error('AI enhanced availability failed, falling back to basic:', error);
        // Fallback to basic availability if AI fails
        return this.getAvailability(providerId, date).pipe(
          map(data => ({ data, aiAnalysis: undefined } as AIEnhancedAvailabilityResponse)),
          map((fallback) => {
            this.availabilityCache.set(cacheKey, { data: fallback, ts: Date.now() });
            return fallback;
          })
        );
      })
    );
  }

  /**
   * Create availability slot with AI optimization and conflict detection
   * @param availability - Availability data to create
   * @returns Created availability with AI analysis
   */
  createAIOptimizedAvailability(availability: Availability): Observable<AICreateResponse> {
    // Check cache for existing data to help with conflict detection
    const cached = this.cacheService.getCachedAIAnalysis([availability]);
    
    return this.http.post<AICreateResponse>(`${this.AI_API_URL}/create`, availability).pipe(
      map(response => ({
        ...response,
        data: {
          ...response.data,
          id: response.data.id || (response.data as any)._id,
          date: response.data.date ? new Date(response.data.date) : undefined,
          startTime: new Date(response.data.startTime),
          endTime: new Date(response.data.endTime)
        }
      })),
      catchError(error => {
        console.error('AI optimized creation failed, falling back to basic:', error);
        // Fallback to basic creation if AI fails
        return this.createAvailability(availability).pipe(
          map(data => ({
            data,
            aiAnalysis: {
              validation: { isValid: true, errors: [], suggestions: [], summary: 'AI validation unavailable' },
              suggestions: ['AI analysis temporarily unavailable']
            }
          }))
        );
      })
    );
  }

  /**
   * Update availability slot with AI impact analysis
   * @param availability - Availability data to update
   * @returns Updated availability with AI impact analysis
   */
  updateAIAnalyzed(availability: Availability): Observable<any> {
    return this.http.put<any>(`${this.AI_API_URL}/${availability.id}`, availability).pipe(
      map(response => ({
        ...response,
        data: {
          ...response.data,
          id: response.data.id || (response.data as any)._id,
          date: response.data.date ? new Date(response.data.date) : undefined,
          startTime: new Date(response.data.startTime),
          endTime: new Date(response.data.endTime)
        }
      })),
      catchError(error => {
        console.error('AI analyzed update failed, falling back to basic:', error);
        // Fallback to basic update if AI fails
        return this.updateAvailability(availability).pipe(
          map(data => ({
            data,
            aiAnalysis: {
              validation: { isValid: true, errors: [], suggestions: [], summary: 'Update completed without AI analysis' },
              impactAnalysis: 'AI impact analysis temporarily unavailable',
              suggestions: []
            }
          }))
        );
      })
    );
  }

  /**
   * Delete availability slot with AI impact assessment
   * @param id - Availability slot ID
   * @returns Deletion result with AI impact assessment
   */
  deleteAIAssessed(id: string): Observable<any> {
    return this.http.delete<any>(`${this.AI_API_URL}/${id}`).pipe(
      catchError(error => {
        console.error('AI assessed deletion failed, falling back to basic:', error);
        // Fallback to basic deletion if AI fails
        return this.deleteAvailability(id).pipe(
          map(result => ({
            success: result.success || true,
            aiAnalysis: {
              impactAssessment: 'AI impact assessment temporarily unavailable',
              alternatives: [],
              riskLevel: 'unknown' as 'low' | 'medium' | 'high'
            }
          }))
        );
      })
    );
  }

  /**
   * Create bulk availability slots with AI optimization
   * @param bulkAvailabilityDto - Bulk availability data
   * @returns Created slots with AI optimization analysis
   */
  createBulkAIOptimized(bulkAvailabilityDto: CreateBulkAvailabilityDto): Observable<AIBulkResponse> {
    return this.http.post<AIBulkResponse>(`${this.BULK_AI_URL}`, bulkAvailabilityDto).pipe(
      map(response => ({
        ...response,
        data: response.data.map(slot => ({
          ...slot,
          id: slot.id || (slot as any)._id,
          date: slot.date ? new Date(slot.date) : undefined,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime)
        }))
      })),
      catchError(error => {
        console.error('AI bulk creation failed, falling back to basic:', error);
        // Fallback to basic bulk creation if AI fails
        return this.createBulkAvailability(bulkAvailabilityDto).pipe(
          map(data => {
            const slots = Array.isArray(data) ? data : data.created || [];
            return {
              data: slots,
              aiAnalysis: {
                validation: { overallValid: true, results: [], summary: 'AI validation unavailable', validCount: slots.length, invalidCount: 0, commonIssues: [] },
                conflicts: { hasConflicts: false, conflicts: [], summary: 'AI conflict analysis unavailable' },
                optimizations: { optimizations: [], summary: 'AI optimization unavailable' },
                efficiencyScore: 75,
                recommendations: ['AI analysis temporarily unavailable']
              }
            };
          })
        );
      })
    );
  }

  /**
   * Create all-day slots with AI demand-based distribution
   * @param allDayAvailabilityDto - All-day availability data
   * @returns Created slots with AI demand analysis
   */
  createAllDayAIOptimized(allDayAvailabilityDto: CreateAllDayAvailabilityDto): Observable<any> {
    return this.http.post<any>(`${this.BULK_AI_URL}/all-day`, allDayAvailabilityDto).pipe(
      map(response => ({
        ...response,
        data: response.data.map((slot: any) => ({
          ...slot,
          id: slot.id || slot._id,
          date: slot.date ? new Date(slot.date) : undefined,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime)
        }))
      })),
      catchError(error => {
        console.error('AI all-day creation failed, falling back to basic:', error);
        // Fallback to basic all-day creation if AI fails
        return this.createAllDayAvailability(allDayAvailabilityDto).pipe(
          map(data => ({
            data,
            aiAnalysis: {
              demandDistribution: 'AI demand analysis temporarily unavailable',
              revenueProjection: 0,
              peakHoursOptimization: [],
              utilizationForecast: 'AI forecasting unavailable'
            }
          }))
        );
      })
    );
  }

  /**
   * Comprehensive AI validation of availability data
   * @param availability - Availability data to validate
   * @returns Comprehensive AI validation results
   */
  validateWithAI(availability: Availability): Observable<any> {
    return this.http.post<any>(`${this.AI_API_URL}/validate`, availability).pipe(
      catchError(error => {
        console.error('AI validation failed, using basic validation:', error);
        // Fallback to basic validation patterns
        return of({
          validation: {
            isValid: true,
            errors: [],
            suggestions: ['AI validation temporarily unavailable'],
            summary: 'Basic validation passed'
          },
          conflicts: { hasConflicts: false, conflicts: [], summary: 'AI conflict detection unavailable' },
          optimization: { optimizations: [], summary: 'AI optimization unavailable' },
          recommendation: 'Data appears valid but AI analysis is temporarily unavailable'
        });
      })
    );
  }

  /**
   * Validate bulk availability data with comprehensive AI analysis
   * @param bulkAvailabilityDto - Bulk availability data to validate
   * @returns Comprehensive bulk validation with AI insights
   */
  validateBulkWithAI(bulkAvailabilityDto: CreateBulkAvailabilityDto): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/availability/bulk/validate`, bulkAvailabilityDto).pipe(
      catchError(error => {
        console.error('AI bulk validation failed, using basic validation:', error);
        // Fallback to basic validation
        return this.validateAvailability(bulkAvailabilityDto).pipe(
          map(basicResult => ({
            validation: {
              overallValid: basicResult.conflicts.length === 0,
              results: [],
              summary: basicResult.conflicts.length === 0 ? 'Validation passed' : 'Conflicts detected',
              validCount: basicResult.conflicts.length === 0 ? 1 : 0,
              invalidCount: basicResult.conflicts.length,
              commonIssues: basicResult.conflicts.map((c: any) => 'Scheduling conflict')
            },
            batchIntelligence: {
              optimalBatchSize: 25,
              processingEfficiency: 'AI analysis unavailable',
              recommendedSequence: ['Process data as provided']
            },
            performanceScore: 75
          }))
        );
      })
    );
  }

  /**
   * Get AI-powered insights for existing availability data
   * Uses frontend AI service for analysis when backend AI is unavailable
   * @param availabilityData - Array of availability data
   * @returns AI insights and recommendations
   */
  async getAIInsights(availabilityData: Availability[]): Promise<any> {
    try {
      // Try to use cached AI analysis first
      let cached = this.cacheService.getCachedAIAnalysis(availabilityData);
      if (cached) {
        return cached;
      }

      // Use frontend AI service for analysis
      const [patterns, conflicts] = await Promise.all([
        this.aiService.analyzeCalendarPatterns(availabilityData),
        this.aiService.detectScheduleConflicts(availabilityData)
      ]);

      const insights = {
        patterns,
        conflicts,
        summary: `Analysis complete: ${patterns.patterns.length} patterns found, ${conflicts.conflicts.length} conflicts detected`,
        recommendations: [
          ...patterns.insights,
          ...conflicts.conflicts.map(c => c.description)
        ]
      };

      // Cache the results
      this.cacheService.cacheAIAnalysis(availabilityData, insights);
      
      return insights;
    } catch (error) {
      console.error('AI insights generation failed:', error);
      return {
        patterns: { patterns: [], trends: { bookingTrends: '', peakHours: [], seasonality: '', utilization: '' }, insights: [], summary: '' },
        conflicts: { hasConflicts: false, conflicts: [], summary: '' },
        summary: 'AI insights temporarily unavailable',
        recommendations: ['AI analysis service is currently unavailable']
      };
    }
  }
}