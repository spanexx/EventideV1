import { Injectable, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CalendarView, CalendarPreferences } from '../models/calendar.models';

@Injectable({
  providedIn: 'root'
})
export class CalendarPreferencesSignalService {
  private readonly STORAGE_KEY = 'calendar-preferences';
  
  // Signal for calendar preferences
  private preferencesSignal = signal<CalendarPreferences>({
    defaultView: 'timeGridWeek',
    autoSwitchView: false,
    rememberLastView: true,
    smartRecommendations: true,
    goToDateBehavior: 'temporary-day' // Default behavior: temporary day view without saving preference
  });
  
  // Computed signals for derived values
  readonly preferences = this.preferencesSignal.asReadonly();
  readonly defaultView = computed(() => this.preferencesSignal().defaultView);
  readonly autoSwitchView = computed(() => this.preferencesSignal().autoSwitchView);
  readonly rememberLastView = computed(() => this.preferencesSignal().rememberLastView);
  readonly smartRecommendations = computed(() => this.preferencesSignal().smartRecommendations);

  constructor() {
    // Load preferences synchronously on service creation
    this.loadPreferences();
    console.log('[CalendarPreferencesSignalService] Service initialized with preferences:', this.preferencesSignal());
  }

  /**
   * Get current calendar preferences
   */
  getPreferences(): CalendarPreferences {
    return this.preferencesSignal();
  }

  /**
   * Get the user's preferred default view
   */
  getPreferredView(): CalendarView {
    return this.preferencesSignal().defaultView;
  }

  /**
   * Set the user's preferred default view
   */
  setPreferredView(view: CalendarView): Observable<void> {
    const currentPrefs = this.preferencesSignal();
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
      this.preferencesSignal.set(preferences);
      console.log('[CalendarPreferencesSignalService] Updated preferences:', preferences);
      return of(void 0);
    } catch (error) {
      console.error('[CalendarPreferencesSignalService] Failed to save calendar preferences:', error);
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
        this.preferencesSignal.set(preferences);
        console.log('[CalendarPreferencesSignalService] Loaded preferences from storage:', preferences);
      } else {
        console.log('[CalendarPreferencesSignalService] No saved preferences found, using defaults');
      }
    } catch (error) {
      console.error('[CalendarPreferencesSignalService] Failed to load calendar preferences:', error);
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
    return this.preferencesSignal().autoSwitchView;
  }

  /**
   * Check if remember last view is enabled
   */
  isRememberLastViewEnabled(): boolean {
    return this.preferencesSignal().rememberLastView;
  }

  /**
   * Check if smart recommendations are enabled
   */
  areSmartRecommendationsEnabled(): boolean {
    return this.preferencesSignal().smartRecommendations;
  }

  /**
   * Update a specific preference setting
   */
  updateSetting<K extends keyof CalendarPreferences>(
    key: K, 
    value: CalendarPreferences[K]
  ): Observable<void> {
    const currentPrefs = this.preferencesSignal();
    const updatedPrefs = {
      ...currentPrefs,
      [key]: value
    };
    
    return this.updatePreferences(updatedPrefs);
  }
}