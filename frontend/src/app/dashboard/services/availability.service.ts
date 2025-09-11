import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Availability } from '../models/availability.models';
import { EventInput } from '@fullcalendar/core';

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

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private readonly API_URL = `${environment.apiUrl}/availability`;

  constructor(private http: HttpClient) { }

  getAvailability(providerId: string, date: Date): Observable<Availability[]> {
    // Calculate start and end dates for the week
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6); // End of week (Saturday)

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
}