import { Injectable } from '@angular/core';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { EventApi } from '@fullcalendar/core';
import { Availability } from '../../models/availability.models';
import { CalendarService } from '../../pages/availability/calendar/calendar.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityCalendarService {
  constructor(private calendarManager: CalendarService) {}

  /**
   * Handle events update
   * This method is called when events are updated in the calendar
   */
  handleEvents(events: EventApi[]): void {
    // Handle events update
    // This method is called when events are updated in the calendar
    // No specific action needed here as the state is managed by NgRx
    // But we can add any necessary logic here if needed
  }

  /**
   * Refresh the full calendar
   */
  refreshFullCalendar(calendarComponent: FullCalendarComponent, availability: Availability[]): void {
    this.calendarManager.refreshFullCalendar(calendarComponent, availability);
  }

  /**
   * Update a single calendar event
   */
  updateSingleCalendarEvent(calendarComponent: FullCalendarComponent, updatedSlot: Availability): void {
    this.calendarManager.updateSingleCalendarEvent(calendarComponent, updatedSlot);
  }

  /**
   * Show context menu
   */
  showContextMenu(contextMenuTrigger: any, event: MouseEvent): { x: number; y: number } {
    // Prevent the browser's default context menu
    event.preventDefault();
    
    // Set the position for the context menu
    const contextMenuPosition = { x: event.clientX, y: event.clientY };
    
    // Open the context menu at the mouse position
    this.calendarManager.openContextMenuAtPosition(contextMenuTrigger, event);
    
    return contextMenuPosition;
  }

  /**
   * Compare two arrays of availability slots and return the changed events
   */
  getChangedEvents(previous: Availability[], current: Availability[]): Availability[] {
    const changed: Availability[] = [];
    
    // Create a map of previous events for quick lookup
    const previousMap = new Map<string, Availability>();
    previous.forEach(slot => previousMap.set(slot.id, slot));
    
    // Check each current event
    current.forEach(slot => {
      const previousSlot = previousMap.get(slot.id);
      // If there's no previous slot or the slot has changed, add it to changed events
      if (!previousSlot || 
          previousSlot.startTime.getTime() !== slot.startTime.getTime() ||
          previousSlot.endTime.getTime() !== slot.endTime.getTime() ||
          previousSlot.isBooked !== slot.isBooked) {
        changed.push(slot);
      }
    });
    
    console.log('Changed events:', changed);
    return changed;
  }
}