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
      providerId: 'provider-123', // This will be updated when creating actual availability
      type: 'one_off',
      date: new Date(),
      startTime: new Date(new Date().setHours(9, 0, 0, 0)),
      endTime: new Date(new Date().setHours(10, 0, 0, 0)),
      isBooked: false,
      duration: 60
    },
    {
      id: '2',
      providerId: 'provider-123', // This will be updated when creating actual availability
      type: 'one_off',
      date: new Date(),
      startTime: new Date(new Date().setHours(11, 0, 0, 0)),
      endTime: new Date(new Date().setHours(11, 30, 0, 0)),
      isBooked: true,
      bookingId: 'booking-123',
      duration: 30
    },
    {
      id: '3',
      providerId: 'provider-123', // This will be updated when creating actual availability
      type: 'recurring',
      date: new Date(),
      startTime: new Date(new Date().setHours(14, 0, 0, 0)),
      endTime: new Date(new Date().setHours(15, 0, 0, 0)),
      isBooked: false,
      duration: 60
    }
  ];

  // Simple ID generator
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  getAvailability(providerId: string, date: Date): Observable<Availability[]> {
    const availabilityWithIds = this.availability.map(slot => ({
      ...slot,
      id: (slot as any)._id || slot.id, // Use _id if available, otherwise use id
      date: slot.date ? new Date(slot.date) : undefined,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime)
    }));
    return of(availabilityWithIds).pipe(delay(500));
  }

  setAvailability(slots: Availability[]): Observable<any> {
    const slotsWithIds = slots.map(slot => ({
      ...slot,
      id: (slot as any)._id || slot.id || this.generateId(), // Use _id if available, otherwise use id, or generate new
      date: slot.date ? new Date(slot.date) : undefined,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime)
    }));
    this.availability = [...this.availability, ...slotsWithIds];
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

  // Check for conflicts with existing slots
  hasConflicts(newSlot: Availability): boolean {
    return this.availability.some(slot => {
      // Skip checking against itself
      if (slot.id === newSlot.id) return false;
      
      // Check if the slots overlap
      return (
        newSlot.startTime < slot.endTime &&
        newSlot.endTime > slot.startTime
      );
    });
  }

  // Convert Availability objects to Calendar events
  convertToCalendarEvents(availability: Availability[]): EventInput[] {
    return availability.map(slot => {
      // For recurring slots, we might want to show them differently
      const isRecurring = slot.type === 'recurring';
      const title = isRecurring ? 
        `${slot.isBooked ? 'Booked' : 'Available'} (Recurring)` : 
        (slot.isBooked ? 'Booked' : 'Available');
      
      return {
        id: slot.id,
        title: title,
        start: slot.startTime,
        end: slot.endTime,
        backgroundColor: slot.isBooked ? '#f44336' : '#4caf50',
        borderColor: slot.isBooked ? '#d32f2f' : '#388e3c',
        classNames: [
          slot.isBooked ? 'booked-slot' : 'available-slot',
          isRecurring ? 'recurring-slot' : ''
        ],
        extendedProps: {
          isRecurring: isRecurring,
          isBooked: slot.isBooked,
          duration: slot.duration
        }
      };
    });
  }
}