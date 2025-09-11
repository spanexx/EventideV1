import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { EventClickArg } from '@fullcalendar/core';
import { take } from 'rxjs/operators';
import * as AvailabilityActions from '../../store-availability/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventHandlingService {
  private performanceLoggingEnabled = true;

  constructor(private store: Store) {}

  /**
   * Handle event click for editing availability slots
   * @param clickInfo The event click information
   * @param availability$ Observable of availability data
   * @param selectedSlot The currently selected slot
   * @returns The selected slot or null if not found
   */
  handleEventClick(
    clickInfo: EventClickArg, 
    availability$: Observable<Availability[]>,
    selectedSlot: Availability | null
  ): Observable<Availability | null> {
    return new Observable(observer => {
      // Use take(1) to automatically unsubscribe after the first emission
      availability$.pipe(take(1)).subscribe(availability => {
        const slot = availability.find(a => a.id === clickInfo.event.id);
        if (slot) {
          // Prevent event propagation
          clickInfo.jsEvent.preventDefault();
          clickInfo.jsEvent.stopPropagation();
          
          observer.next(slot);
        } else {
          observer.next(null);
        }
        observer.complete();
      });
    });
  }

  /**
   * Handle event resize operations
   * @param resizeInfo The resize information
   * @param availability$ Observable of availability data
   * @param calculateDuration Function to calculate duration in minutes
   */
  handleEventResize(
    resizeInfo: any,
    availability$: Observable<Availability[]>,
    calculateDuration: (start: Date, end: Date) => number
  ): void {
    // Log performance metrics
    const startTime = performance.now();
    
    if (this.performanceLoggingEnabled) {
      console.log('[Performance] Starting event resize operation', {
        eventId: resizeInfo.event.id,
        startTime: resizeInfo.event.start,
        endTime: resizeInfo.event.end
      });
    }
    
    // Use take(1) to automatically unsubscribe after the first emission
    availability$.pipe(take(1)).subscribe(availability => {
      const slot = availability.find(a => a.id === resizeInfo.event.id);
      if (slot) {
        // Create updated slot with new times
        const updatedSlot = {
          ...slot,
          startTime: resizeInfo.event.start,
          endTime: resizeInfo.event.end,
          duration: calculateDuration(resizeInfo.event.start, resizeInfo.event.end)
        };
        
        // Log performance metrics
        if (this.performanceLoggingEnabled) {
          const endTime = performance.now();
          console.log(`[Performance] Event resize operation took ${endTime - startTime} milliseconds`, {
            eventId: resizeInfo.event.id,
            updatedSlot
          });
        }
        
        // Update the slot
        this.store.dispatch(AvailabilityActions.updateAvailability({ availability: updatedSlot }));
      }
    });
  }

  /**
   * Handle event drop operations
   * @param dropInfo The drop information
   * @param availability$ Observable of availability data
   */
  handleEventDrop(dropInfo: any, availability$: Observable<Availability[]>): void {
    // Log performance metrics
    const startTime = performance.now();
    
    if (this.performanceLoggingEnabled) {
      console.log('[Performance] Starting event drop operation', {
        eventId: dropInfo.event.id,
        startTime: dropInfo.event.start,
        endTime: dropInfo.event.end
      });
    }
    
    // Use take(1) to automatically unsubscribe after the first emission
    availability$.pipe(take(1)).subscribe(availability => {
      const slot = availability.find(a => a.id === dropInfo.event.id);
      if (slot) {
        // Create updated slot with new times
        const updatedSlot = {
          ...slot,
          startTime: dropInfo.event.start,
          endTime: dropInfo.event.end,
          date: dropInfo.event.start
        };
        
        // Log performance metrics
        if (this.performanceLoggingEnabled) {
          const endTime = performance.now();
          console.log(`[Performance] Event drop operation took ${endTime - startTime} milliseconds`, {
            eventId: dropInfo.event.id,
            updatedSlot
          });
        }
        
        // Update the slot
        this.store.dispatch(AvailabilityActions.updateAvailability({ availability: updatedSlot }));
      }
    });
  }
}