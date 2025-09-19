import * as CalendarActions from './calendar.actions';
import { CalendarView } from '../../models/calendar.models';

describe('CalendarActions', () => {
  it('should create setCalendarView action', () => {
    const view: CalendarView = 'dayGridMonth';
    const action = CalendarActions.setCalendarView({ view });
    
    expect(action.type).toBe('[Calendar] Set View');
    expect(action.view).toBe(view);
  });

  it('should create setCalendarViewSuccess action', () => {
    const view: CalendarView = 'dayGridMonth';
    const action = CalendarActions.setCalendarViewSuccess({ view });
    
    expect(action.type).toBe('[Calendar] Set View Success');
    expect(action.view).toBe(view);
  });

  it('should create setCalendarViewFailure action', () => {
    const error = 'Failed to set view';
    const action = CalendarActions.setCalendarViewFailure({ error });
    
    expect(action.type).toBe('[Calendar] Set View Failure');
    expect(action.error).toBe(error);
  });

  it('should create setDateRange action', () => {
    const dateRange = { 
      startDate: new Date(), 
      endDate: new Date() 
    };
    const action = CalendarActions.setDateRange({ dateRange });
    
    expect(action.type).toBe('[Calendar] Set Date Range');
    expect(action.dateRange).toBe(dateRange);
  });

  it('should create setDateRangeSuccess action', () => {
    const dateRange = { 
      startDate: new Date(), 
      endDate: new Date() 
    };
    const action = CalendarActions.setDateRangeSuccess({ dateRange });
    
    expect(action.type).toBe('[Calendar] Set Date Range Success');
    expect(action.dateRange).toBe(dateRange);
  });

  it('should create setDateRangeFailure action', () => {
    const error = 'Failed to set date range';
    const action = CalendarActions.setDateRangeFailure({ error });
    
    expect(action.type).toBe('[Calendar] Set Date Range Failure');
    expect(action.error).toBe(error);
  });

  it('should create navigateCalendar action', () => {
    const direction: 'prev' | 'next' | 'today' = 'next';
    const action = CalendarActions.navigateCalendar({ direction });
    
    expect(action.type).toBe('[Calendar] Navigate');
    expect(action.direction).toBe(direction);
  });

  it('should create navigateCalendarSuccess action', () => {
    const dateRange = { 
      startDate: new Date(), 
      endDate: new Date() 
    };
    const action = CalendarActions.navigateCalendarSuccess({ dateRange });
    
    expect(action.type).toBe('[Calendar] Navigate Success');
    expect(action.dateRange).toBe(dateRange);
  });

  it('should create navigateCalendarFailure action', () => {
    const error = 'Failed to navigate';
    const action = CalendarActions.navigateCalendarFailure({ error });
    
    expect(action.type).toBe('[Calendar] Navigate Failure');
    expect(action.error).toBe(error);
  });

  it('should create refreshCalendar action', () => {
    const action = CalendarActions.refreshCalendar();
    
    expect(action.type).toBe('[Calendar] Refresh');
  });

  it('should create refreshCalendarSuccess action', () => {
    const action = CalendarActions.refreshCalendarSuccess();
    
    expect(action.type).toBe('[Calendar] Refresh Success');
  });

  it('should create refreshCalendarFailure action', () => {
    const error = 'Failed to refresh';
    const action = CalendarActions.refreshCalendarFailure({ error });
    
    expect(action.type).toBe('[Calendar] Refresh Failure');
    expect(action.error).toBe(error);
  });
});