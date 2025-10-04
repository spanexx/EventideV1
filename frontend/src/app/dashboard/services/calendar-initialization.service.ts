import { Injectable } from '@angular/core';
import { CalendarStateService } from './calendar-state.service';
import { CalendarPreferencesSignalService } from './calendar-preferences-signal.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarInitializationService {
  constructor(
    private calendarStateService: CalendarStateService,
    private calendarPreferencesSignalService: CalendarPreferencesSignalService
  ) {}

  /**
   * Initialize calendar preferences and state on app startup
   */
  initialize(): void {
    console.log('[CalendarInitializationService] Initializing calendar system');
    
    // Load preferences from storage (this happens automatically in the constructor)
    // But we can trigger the state to be updated
    this.calendarStateService.loadPreferences();
    
    console.log('[CalendarInitializationService] Calendar system initialization complete');
  }

  /**
   * Check if the calendar system is properly initialized
   */
  isInitialized(): boolean {
    try {
      const preferences = this.calendarPreferencesSignalService.getPreferences();
      return !!preferences;
    } catch (error) {
      console.error('[CalendarInitializationService] Failed to check initialization status:', error);
      return false;
    }
  }

  /**
   * Reset the calendar system to defaults
   */
  reset(): void {
    console.log('[CalendarInitializationService] Resetting calendar system to defaults');
    this.calendarPreferencesSignalService.resetPreferences().subscribe({
      next: () => {
        console.log('[CalendarInitializationService] Calendar system reset complete');
        this.initialize(); // Re-initialize after reset
      },
      error: (error) => {
        console.error('[CalendarInitializationService] Failed to reset calendar system:', error);
      }
    });
  }
}