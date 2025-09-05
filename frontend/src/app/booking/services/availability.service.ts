import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TimeSlot, AvailableSlotsRequest, SlotAvailabilityRequest } from '../models/availability.models';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  // In a real implementation, these methods would make HTTP requests to the backend API
  
  getAvailableSlots(request: AvailableSlotsRequest): Observable<TimeSlot[]> {
    // Simulate API call
    const slots: TimeSlot[] = [
      {
        id: '1',
        providerId: request.providerId,
        date: request.date,
        startTime: new Date(request.date.setHours(9, 0, 0, 0)),
        endTime: new Date(request.date.setHours(9, request.duration, 0, 0)),
        duration: request.duration,
        isBooked: false
      },
      {
        id: '2',
        providerId: request.providerId,
        date: request.date,
        startTime: new Date(request.date.setHours(10, 0, 0, 0)),
        endTime: new Date(request.date.setHours(10, request.duration, 0, 0)),
        duration: request.duration,
        isBooked: false
      },
      {
        id: '3',
        providerId: request.providerId,
        date: request.date,
        startTime: new Date(request.date.setHours(11, 0, 0, 0)),
        endTime: new Date(request.date.setHours(11, request.duration, 0, 0)),
        duration: request.duration,
        isBooked: false
      }
    ];
    
    return of(slots);
  }
  
  checkSlotAvailability(request: SlotAvailabilityRequest): Observable<boolean> {
    // Simulate API call
    return of(true);
  }
}