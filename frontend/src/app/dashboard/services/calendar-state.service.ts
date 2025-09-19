import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as CalendarActions from '../store-calendar/actions/calendar.actions';
import { CalendarView, DateRange } from '../models/calendar.models';

@Injectable({
  providedIn: 'root'
})
export class CalendarStateService {
  constructor(private store: Store) {}

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
}