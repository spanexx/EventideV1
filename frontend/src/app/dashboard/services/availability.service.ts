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

export interface CreateAllDayAvailabilityDto {
  providerId: string;
  date: Date;
  numberOfSlots: number;
  autoDistribute?: boolean;
  slots?: AllDaySlot[];
  isRecurring?: boolean;
  dayOfWeek?: number;
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
}