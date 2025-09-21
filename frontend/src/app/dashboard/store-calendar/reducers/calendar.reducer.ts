import { createReducer, on } from '@ngrx/store';
import * as CalendarActions from '../actions/calendar.actions';
import { CalendarState } from '../../models/calendar.models';

export const initialCalendarState: CalendarState = {
  currentView: 'timeGridWeek',
  preferredView: null, // Will be set from user preferences
  dateRange: {
    startDate: new Date(),
    endDate: new Date()
  },
  loading: false,
  error: null
};

export const calendarReducer = createReducer(
  initialCalendarState,
  
  // Set Calendar View
  on(CalendarActions.setCalendarView, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CalendarActions.setCalendarViewSuccess, (state, { view }) => ({
    ...state,
    currentView: view,
    loading: false
  })),
  
  on(CalendarActions.setCalendarViewFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Set Date Range
  on(CalendarActions.setDateRange, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CalendarActions.setDateRangeSuccess, (state, { dateRange }) => ({
    ...state,
    dateRange,
    loading: false
  })),
  
  on(CalendarActions.setDateRangeFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Navigate Calendar
  on(CalendarActions.navigateCalendar, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CalendarActions.navigateCalendarSuccess, (state, { dateRange }) => ({
    ...state,
    dateRange,
    loading: false
  })),
  
  on(CalendarActions.navigateCalendarFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Refresh Calendar
  on(CalendarActions.refreshCalendar, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CalendarActions.refreshCalendarSuccess, (state) => ({
    ...state,
    loading: false
  })),
  
  on(CalendarActions.refreshCalendarFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Set Preferred View
  on(CalendarActions.setPreferredView, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CalendarActions.setPreferredViewSuccess, (state, { view }) => ({
    ...state,
    preferredView: view,
    loading: false
  })),
  
  on(CalendarActions.setPreferredViewFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load Calendar Preferences
  on(CalendarActions.loadCalendarPreferences, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(CalendarActions.loadCalendarPreferencesSuccess, (state, { preferredView }) => ({
    ...state,
    preferredView,
    currentView: preferredView || state.currentView, // Use preferred view if available
    loading: false
  })),
  
  on(CalendarActions.loadCalendarPreferencesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);