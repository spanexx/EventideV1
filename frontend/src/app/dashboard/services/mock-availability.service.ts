import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Availability } from '../models/availability.models';
import { EventInput } from '@fullcalendar/core';

@Injectable({
  providedIn: 'root'
})
export class MockAvailabilityService {
  private availability: Availability[] = [
    {
      id: '1',
      providerId: 'provider-123',
      date: new Date(),
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 0, 0, 0)),
      isBooked: false,
      isRecurring: false,
      duration: 60
    },
    {
      id: '2',
      providerId: 'provider-123',
      date: new Date(),
      startTime: new Date(new Date().setHours(11, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 30, 0, 0)),
      isBooked: true,
      bookingId: 'booking-123',
      isRecurring: false,
      duration: 30
    },
    {
      id: '3',
      providerId: 'provider-123',
      date: new Date(),
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(15, 0, 0, 0)),
      isBooked: false,
      isRecurring: false,
      duration: 60
    }
  ];

  getAvailability(providerId: string, date: Date): Observable<Availability[]> {
    return of(this.availability).pipe(delay(500));
  }

  setAvailability(slots: Availability[]): Observable<any> {
    this.availability = [...this.availability, ...slots];
    return of({ success: true }).pipe(delay(300));
  }

  updateSlot(slot: Availability): Observable<Availability> {
    const index = this.availability.findIndex(s => s.id === slot.id);
    if (index !== -1) {
      this.availability[index] = slot;
    }
    return of(slot).pipe(delay(300));
  }

  deleteSlot(id: string): Observable<any> {
    this.availability = this.availability.filter(s => s.id !== id);
    return of({ success: true }).pipe(delay(300));
  }

  // Convert Availability objects to Calendar events
  convertToCalendarEvents(availability: Availability[]): EventInput[] {
    return availability.map(slot => ({
      id: slot.id,
      title: slot.isBooked ? 'Booked' : 'Available',
      start: slot.startTime,
      end: slot.endTime,
      backgroundColor: slot.isBooked ? '#f44336' : '#4caf50',
      borderColor: slot.isBooked ? '#d32f2f' : '#388e3c',
      classNames: [slot.isBooked ? 'booked-slot' : 'available-slot']
    }));
  }
}