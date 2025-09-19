import { calendarReducer, initialCalendarState } from './reducers/calendar.reducer';
import * as CalendarActions from './actions/calendar.actions';
import { CalendarView } from '../../models/calendar.models';

describe('CalendarReducer', () => {
  it('should return the initial state', () => {
    const state = calendarReducer(undefined, { type: 'INIT' });
    expect(state).toEqual(initialCalendarState);
  });

  it('should handle setCalendarView action', () => {
    const view: CalendarView = 'dayGridMonth';
    const action = CalendarActions.setCalendarView({ view });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle setCalendarViewSuccess action', () => {
    const view: CalendarView = 'dayGridMonth';
    const action = CalendarActions.setCalendarViewSuccess({ view });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.currentView).toBe(view);
    expect(state.loading).toBe(false);
  });

  it('should handle setCalendarViewFailure action', () => {
    const error = 'Failed to set view';
    const action = CalendarActions.setCalendarViewFailure({ error });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.error).toBe(error);
    expect(state.loading).toBe(false);
  });

  it('should handle setDateRange action', () => {
    const action = CalendarActions.setDateRange({ 
      dateRange: { 
        startDate: new Date(), 
        endDate: new Date() 
      } 
    });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle setDateRangeSuccess action', () => {
    const dateRange = { 
      startDate: new Date(), 
      endDate: new Date() 
    };
    const action = CalendarActions.setDateRangeSuccess({ dateRange });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.dateRange).toBe(dateRange);
    expect(state.loading).toBe(false);
  });

  it('should handle setDateRangeFailure action', () => {
    const error = 'Failed to set date range';
    const action = CalendarActions.setDateRangeFailure({ error });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.error).toBe(error);
    expect(state.loading).toBe(false);
  });

  it('should handle navigateCalendar action', () => {
    const action = CalendarActions.navigateCalendar({ direction: 'next' });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle navigateCalendarSuccess action', () => {
    const dateRange = { 
      startDate: new Date(), 
      endDate: new Date() 
    };
    const action = CalendarActions.navigateCalendarSuccess({ dateRange });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.dateRange).toBe(dateRange);
    expect(state.loading).toBe(false);
  });

  it('should handle navigateCalendarFailure action', () => {
    const error = 'Failed to navigate';
    const action = CalendarActions.navigateCalendarFailure({ error });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.error).toBe(error);
    expect(state.loading).toBe(false);
  });

  it('should handle refreshCalendar action', () => {
    const action = CalendarActions.refreshCalendar();
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle refreshCalendarSuccess action', () => {
    const action = CalendarActions.refreshCalendarSuccess();
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.loading).toBe(false);
  });

  it('should handle refreshCalendarFailure action', () => {
    const error = 'Failed to refresh';
    const action = CalendarActions.refreshCalendarFailure({ error });
    const state = calendarReducer(initialCalendarState, action);
    
    expect(state.error).toBe(error);
    expect(state.loading).toBe(false);
  });
});