import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as CalendarActions from '../store-calendar/actions/calendar.actions';
import * as CalendarSelectors from '../store-calendar/selectors/calendar.selectors';
import { CalendarView, DateRange } from '../models/calendar.models';
import { CalendarPreferencesService } from './calendar-preferences.service';
import { CalendarPreferencesSignalService } from './calendar-preferences-signal.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarStateService {
  constructor(
    private store: Store,
    private calendarPreferencesService: CalendarPreferencesService,
    private calendarPreferencesSignalService: CalendarPreferencesSignalService
  ) {}

  /**
   * Set the current calendar view
   * @param view The calendar view to set
   */
  setView(view: CalendarView): void {
    this.store.dispatch(CalendarActions.setCalendarView({ view }));
  }

  /**
   * Set the current date range
   * @param dateRange The date range to set
   */
  setDateRange(dateRange: DateRange): void {
    this.store.dispatch(CalendarActions.setDateRange({ dateRange }));
  }

  /**
   * Navigate the calendar in the specified direction
   * @param direction The direction to navigate
   */
  navigate(direction: 'prev' | 'next' | 'today'): void {
    this.store.dispatch(CalendarActions.navigateCalendar({ direction }));
  }

  /**
   * Refresh the calendar
   */
  refresh(): void {
    this.store.dispatch(CalendarActions.refreshCalendar());
  }

  // Selectors for accessing calendar state
  
  /**
   * Get the current calendar view from state
   */
  getCurrentView$(): Observable<CalendarView> {
    return this.store.select(CalendarSelectors.selectCurrentView);
  }

  /**
   * Get the preferred calendar view from state
   */
  getPreferredView$(): Observable<CalendarView | null> {
    return this.store.select(CalendarSelectors.selectPreferredView);
  }

  /**
   * Get the current date range from state
   */
  getDateRange$(): Observable<DateRange> {
    return this.store.select(CalendarSelectors.selectDateRange);
  }

  /**
   * Get the calendar loading state
   */
  getLoading$(): Observable<boolean> {
    return this.store.select(CalendarSelectors.selectCalendarLoading);
  }

  /**
   * Get the calendar error state
   */
  getError$(): Observable<string | null> {
    return this.store.select(CalendarSelectors.selectCalendarError);
  }

  // Preference management methods

  /**
   * Set the user's preferred view and persist to storage
   * @param view The preferred calendar view
   */
  setPreferredView(view: CalendarView): void {
    console.log('[CalendarStateService] Setting preferred view:', view);
    this.store.dispatch(CalendarActions.setPreferredView({ view }));
  }

  /**
   * Load calendar preferences from storage and apply to state
   */
  loadPreferences(): void {
    console.log('[CalendarStateService] Loading calendar preferences');
    this.store.dispatch(CalendarActions.loadCalendarPreferences());
  }

  /**
   * Get the current preferred view from service (synchronous)
   */
  getPreferredView(): CalendarView {
    return this.calendarPreferencesSignalService.getPreferredView();
  }

  /**
   * Check if the user has a preferred view set
   */
  hasPreferredView(): boolean {
    const preferences = this.calendarPreferencesSignalService.getPreferences();
    return !!preferences.defaultView;
  }

  /**
   * Get the signal-based preferences service for reactive access
   */
  getPreferencesSignals() {
    return {
      preferences: this.calendarPreferencesSignalService.preferences,
      defaultView: this.calendarPreferencesSignalService.defaultView,
      autoSwitchView: this.calendarPreferencesSignalService.autoSwitchView,
      rememberLastView: this.calendarPreferencesSignalService.rememberLastView,
      smartRecommendations: this.calendarPreferencesSignalService.smartRecommendations
    };
  }
}