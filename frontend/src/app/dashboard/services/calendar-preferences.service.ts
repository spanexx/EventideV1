import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CalendarView, CalendarPreferences } from '../models/calendar.models';

@Injectable({
  providedIn: 'root'
})
export class CalendarPreferencesService {
  private readonly STORAGE_KEY = 'calendar-preferences';
  
  private preferencesSubject = new BehaviorSubject<CalendarPreferences>({
    defaultView: 'timeGridWeek',
    autoSwitchView: false,
    rememberLastView: true,
    smartRecommendations: true,
    goToDateBehavior: 'temporary-day'
  });
  
  preferences$ = this.preferencesSubject.asObservable();

  constructor() {
    this.loadPreferences();
  }

  /**
   * Get current calendar preferences
   */
  getPreferences(): CalendarPreferences {
    return this.preferencesSubject.value;
  }

  /**
   * Get the user's preferred default view
   */
  getPreferredView(): CalendarView {
    return this.getPreferences().defaultView;
  }

  /**
   * Set the user's preferred default view
   */
  setPreferredView(view: CalendarView): Observable<void> {
    const currentPrefs = this.getPreferences();
    const updatedPrefs: CalendarPreferences = {
      ...currentPrefs,
      defaultView: view
    };
    
    return this.updatePreferences(updatedPrefs);
  }

  /**
   * Update calendar preferences
   */
  updatePreferences(preferences: CalendarPreferences): Observable<void> {
    // Save to localStorage
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
      this.preferencesSubject.next(preferences);
      return of(void 0);
    } catch (error) {
      console.error('Failed to save calendar preferences:', error);
      throw error;
    }
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const preferences = JSON.parse(saved) as CalendarPreferences;
        this.preferencesSubject.next(preferences);
      }
    } catch (error) {
      console.error('Failed to load calendar preferences:', error);
      // Keep default preferences on error
    }
  }

  /**
   * Reset preferences to default
   */
  resetPreferences(): Observable<void> {
    const defaultPrefs: CalendarPreferences = {
      defaultView: 'timeGridWeek',
      autoSwitchView: false,
      rememberLastView: true,
      smartRecommendations: true,
      goToDateBehavior: 'temporary-day'
    };
    
    return this.updatePreferences(defaultPrefs);
  }

  /**
   * Check if auto-switch view is enabled
   */
  isAutoSwitchEnabled(): boolean {
    return this.getPreferences().autoSwitchView;
  }

  /**
   * Check if remember last view is enabled
   */
  isRememberLastViewEnabled(): boolean {
    return this.getPreferences().rememberLastView;
  }

  /**
   * Check if smart recommendations are enabled
   */
  isSmartRecommendationsEnabled(): boolean {
    return this.getPreferences().smartRecommendations;
  }
}