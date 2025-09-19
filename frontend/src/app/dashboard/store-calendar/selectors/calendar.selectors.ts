import { createSelector, createFeatureSelector } from '@ngrx/store';
import { CalendarState } from '../../models/calendar.models';

export const selectCalendarState = createFeatureSelector<CalendarState>('calendar');

// Calendar selectors
export const selectCurrentView = createSelector(
  selectCalendarState,
  (state: CalendarState) => state.currentView
);

export const selectDateRange = createSelector(
  selectCalendarState,
  (state: CalendarState) => state.dateRange
);

// Loading and error selectors
export const selectCalendarLoading = createSelector(
  selectCalendarState,
  (state: CalendarState) => state.loading
);

export const selectCalendarError = createSelector(
  selectCalendarState,
  (state: CalendarState) => state.error
);