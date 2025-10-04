import { createSelector } from '@ngrx/store';
import * as fromCalendar from './calendar.selectors';
import { CalendarState } from '../../models/calendar.models';

describe('CalendarSelectors', () => {
  const initialState: CalendarState = {
    currentView: 'timeGridWeek',
    dateRange: {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-07')
    },
    loading: false,
    error: null
  };

  it('should select the calendar state', () => {
    const result = fromCalendar.selectCalendarState.projector(initialState);
    expect(result).toEqual(initialState);
  });

  it('should select the current view', () => {
    const result = fromCalendar.selectCurrentView.projector(initialState);
    expect(result).toBe('timeGridWeek');
  });

  it('should select the date range', () => {
    const result = fromCalendar.selectDateRange.projector(initialState);
    expect(result).toEqual({
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-07')
    });
  });

  it('should select the loading state', () => {
    const result = fromCalendar.selectCalendarLoading.projector(initialState);
    expect(result).toBe(false);
  });

  it('should select the error state', () => {
    const result = fromCalendar.selectCalendarError.projector(initialState);
    expect(result).toBeNull();
  });
});