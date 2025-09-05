import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Availability } from '../models/availability.models';
import { EventInput } from '@fullcalendar/core';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private readonly API_URL = `${environment.apiUrl}/availability`;

  constructor(private http: HttpClient) { }

  getAvailability(providerId: string, date: Date): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.API_URL}/${providerId}`, {
      params: { date: date.toISOString() }
    });
  }

  setAvailability(slots: Availability[]): Observable<any> {
    return this.http.post(`${this.API_URL}`, { slots });
  }

  updateSlot(slot: Availability): Observable<Availability> {
    return this.http.put<Availability>(`${this.API_URL}/${slot.id}`, slot);
  }

  deleteSlot(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  // Convert Availability objects to Calendar events
  convertToCalendarEvents(availability: Availability[]): EventInput[] {
    return availability.map(slot => ({
      id: slot.id,
      title: slot.isBooked ? 'Booked' : 'Available',
      start: slot.startTime,
      end: slot.endTime,
      classNames: [slot.isBooked ? 'event-booked' : 'event-available']
    }));
  }
}