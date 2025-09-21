import { createAction, props } from '@ngrx/store';
import { CalendarView, DateRange } from '../../models/calendar.models';

// Set Calendar View
export const setCalendarView = createAction(
  '[Calendar] Set View',
  props<{ view: CalendarView }>()
);

export const setCalendarViewSuccess = createAction(
  '[Calendar] Set View Success',
  props<{ view: CalendarView }>()
);

export const setCalendarViewFailure = createAction(
  '[Calendar] Set View Failure',
  props<{ error: string }>()
);

// Set Date Range
export const setDateRange = createAction(
  '[Calendar] Set Date Range',
  props<{ dateRange: DateRange }>()
);

export const setDateRangeSuccess = createAction(
  '[Calendar] Set Date Range Success',
  props<{ dateRange: DateRange }>()
);

export const setDateRangeFailure = createAction(
  '[Calendar] Set Date Range Failure',
  props<{ error: string }>()
);

// Navigate Calendar
export const navigateCalendar = createAction(
  '[Calendar] Navigate',
  props<{ direction: 'prev' | 'next' | 'today' }>()
);

export const navigateCalendarSuccess = createAction(
  '[Calendar] Navigate Success',
  props<{ dateRange: DateRange }>()
);

export const navigateCalendarFailure = createAction(
  '[Calendar] Navigate Failure',
  props<{ error: string }>()
);

// Refresh Calendar
export const refreshCalendar = createAction('[Calendar] Refresh');

export const refreshCalendarSuccess = createAction('[Calendar] Refresh Success');

export const refreshCalendarFailure = createAction(
  '[Calendar] Refresh Failure',
  props<{ error: string }>()
);

// Set Preferred View
export const setPreferredView = createAction(
  '[Calendar] Set Preferred View',
  props<{ view: CalendarView }>()
);

export const setPreferredViewSuccess = createAction(
  '[Calendar] Set Preferred View Success',
  props<{ view: CalendarView }>()
);

export const setPreferredViewFailure = createAction(
  '[Calendar] Set Preferred View Failure',
  props<{ error: string }>()
);

// Load User Preferences
export const loadCalendarPreferences = createAction('[Calendar] Load Preferences');

export const loadCalendarPreferencesSuccess = createAction(
  '[Calendar] Load Preferences Success',
  props<{ preferredView: CalendarView | null }>()
);

export const loadCalendarPreferencesFailure = createAction(
  '[Calendar] Load Preferences Failure',
  props<{ error: string }>()
);