import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { DateSelectArg } from '@fullcalendar/core';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CalendarOperationsService {
  constructor(private store: Store) {}

  /**
   * Check if a date is in the past
   * @param date The date to check
   * @returns True if the date is in the past, false otherwise
   */
  isDateInPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  /**
   * Check if there's existing availability for a given date
   * @param availability$ Observable of availability data
   * @param date The date to check
   * @returns Observable that emits true if there's existing availability, false otherwise
   */
  hasExistingAvailability(availability$: Observable<Availability[]>, date: Date): Observable<boolean> {
    return new Observable(observer => {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      availability$.subscribe(availability => {
        const hasAvailability = availability.some(slot => {
          if (!slot.date && slot.startTime) {
            // For slots with only startTime, check if it's on the same date
            const slotDate = new Date(slot.startTime);
            slotDate.setHours(0, 0, 0, 0);
            return slotDate.getTime() === selectedDate.getTime();
          } else if (slot.date) {
            // For slots with a date field, check if it matches
            const slotDate = new Date(slot.date);
            slotDate.setHours(0, 0, 0, 0);
            return slotDate.getTime() === selectedDate.getTime();
          }
          return false;
        });
        observer.next(hasAvailability);
        observer.complete();
      });
    });
  }

  /**
   * Refresh availability data
   * @param userId The user ID to refresh availability for
   */
  refreshAvailability(userId: string): void {
    const today = new Date();
    this.store.dispatch(AvailabilityActions.loadAvailability({ 
      providerId: userId, 
      date: today
    }));
  }
}