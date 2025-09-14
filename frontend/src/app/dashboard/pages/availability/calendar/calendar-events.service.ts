import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import * as AvailabilityActions from '../../../store-availability/actions/availability.actions';
import { Availability } from '../../../models/availability.models';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CalendarEventsService {
  private performanceLoggingEnabled = environment.performanceLogging?.enabled === true;
  private performanceLoggingSampleRate = typeof environment.performanceLogging?.sampleRate === 'number'
    ? Math.max(0, Math.min(1, environment.performanceLogging.sampleRate))
    : 0.1;

  constructor(private store: Store) {}

  /**
   * Handle event click for editing availability slots
   * @param clickInfo The event click information
   * @param availability$ Observable of availability data
   * @returns Observable that emits the selected slot or null
   */
  handleEventClick(
    clickInfo: any, 
    availability$: Observable<Availability[]>
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
    this.logPerformanceMetrics('resize', resizeInfo);
    
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
        this.logPerformanceMetrics('resize', resizeInfo, updatedSlot);
        
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
    this.logPerformanceMetrics('drop', dropInfo);
    
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
        this.logPerformanceMetrics('drop', dropInfo, updatedSlot);
        
        // Update the slot
        this.store.dispatch(AvailabilityActions.updateAvailability({ availability: updatedSlot }));
      }
    });
  }

  /**
   * Handle calendar events with logging
   * @param eventType Type of event (resize, drop, etc.)
   * @param eventInfo Event information
   * @param handler Function to handle the event
   */
  handleCalendarEvent(
    eventType: string, 
    eventInfo: any, 
    handler: (info: any) => void
  ): void {
    // Log performance metrics
    this.logPerformanceMetrics(eventType, eventInfo);
    
    // Handle the event
    handler(eventInfo);
  }

  /**
   * Log performance metrics for calendar events
   * @param eventType Type of event (resize, drop, etc.)
   * @param eventInfo Event information
   * @param updatedSlot Optional updated slot information
   */
  private logPerformanceMetrics(
    eventType: string, 
    eventInfo: any, 
    updatedSlot?: Availability
  ): void {
    if (this.performanceLoggingEnabled && Math.random() < this.performanceLoggingSampleRate) {
      const logData: any = {
        eventId: eventInfo.event.id,
        start: eventInfo.event.start,
        end: eventInfo.event.end
      };
      
      if (updatedSlot) {
        logData.updatedSlot = updatedSlot;
      }
      
      console.log(`[Performance] Handling event ${eventType} in CalendarEventsService`, logData);
    }
  }
}