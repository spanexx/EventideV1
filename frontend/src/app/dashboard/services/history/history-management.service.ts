import { Injectable } from '@angular/core';
import { Availability } from '../../models/availability.models';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { AvailabilityService } from '../availability.service';

@Injectable({
  providedIn: 'root'
})
export class HistoryManagementService {
  private history: Availability[][] = [];
  private historyIndex = -1;
  private readonly MAX_HISTORY = 50;
  
  // Throttling for history updates
  private lastSaveTime = 0;
  readonly SAVE_THROTTLE = 1000; // 1 second

  /**
   * Get the last save time
   * @returns The last save time
   */
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }

  /**
   * Save the current state to history with throttling
   * @param availability The current availability state
   */
  saveToHistory(availability: Availability[]): void {
    const currentTime = Date.now();
    // Only save to history if enough time has passed since the last save
    if (currentTime - this.lastSaveTime > this.SAVE_THROTTLE) {
      // If we're not at the end of the history, remove future states
      if (this.historyIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.historyIndex + 1);
      }
      
      // Add the current state to history
      this.history.push([...availability]);
      this.historyIndex++;
      
      // Limit history size
      if (this.history.length > this.MAX_HISTORY) {
        this.history.shift();
        this.historyIndex--;
      }
      
      // Update last save time
      this.lastSaveTime = currentTime;
    }
  }

  /**
   * Get the previous state from history
   * @returns The previous state or null if there is no previous state
   */
  getPreviousState(): Availability[] | null {
    if (this.canUndo()) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return null;
  }

  /**
   * Get the next state from history
   * @returns The next state or null if there is no next state
   */
  getNextState(): Availability[] | null {
    if (this.canRedo()) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }
    return null;
  }

  /**
   * Check if we can undo (go back in history)
   * @returns True if we can undo, false otherwise
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * Check if we can redo (go forward in history)
   * @returns True if we can redo, false otherwise
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * Clear the history
   */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
  }

  /**
   * Undo the last action
   * @param calendarComponent The calendar component
   * @param availabilityService The availability service
   */
  undo(calendarComponent: FullCalendarComponent, availabilityService: AvailabilityService): void {
    const prevState = this.getPreviousState();
    if (prevState) {
      // Update the calendar with the previous state
      if (calendarComponent) {
        const calendarApi = calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          const events = availabilityService.convertToCalendarEvents(prevState);
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(events);
        }
      }
    }
  }

  /**
   * Redo the last undone action
   * @param calendarComponent The calendar component
   * @param availabilityService The availability service
   */
  redo(calendarComponent: FullCalendarComponent, availabilityService: AvailabilityService): void {
    const nextState = this.getNextState();
    if (nextState) {
      // Update the calendar with the next state
      if (calendarComponent) {
        const calendarApi = calendarComponent.getApi();
        // Check if calendarApi is available before using it
        if (calendarApi) {
          const events = availabilityService.convertToCalendarEvents(nextState);
          calendarApi.removeAllEvents();
          calendarApi.addEventSource(events);
        }
      }
    }
  }
}