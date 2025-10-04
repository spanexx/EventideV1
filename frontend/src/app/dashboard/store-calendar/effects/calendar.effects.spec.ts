import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { CalendarEffects } from './effects/calendar.effects';
import * as CalendarActions from './actions/calendar.actions';
import { SnackbarService } from '../../../shared/services/snackbar.service';

describe('CalendarEffects', () => {
  let actions$: Observable<any>;
  let effects: CalendarEffects;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {
    const snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showError']);

    TestBed.configureTestingModule({
      providers: [
        CalendarEffects,
        provideMockActions(() => actions$),
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });

    effects = TestBed.inject(CalendarEffects);
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  describe('setCalendarView$', () => {
    it('should return setCalendarViewSuccess action on success', () => {
      const view = 'dayGridMonth';
      const action = CalendarActions.setCalendarView({ view });
      const completion = CalendarActions.setCalendarViewSuccess({ view });

      actions$ = of(action);

      effects.setCalendarView$.subscribe(result => {
        expect(result).toEqual(completion);
      });
    });

    it('should return setCalendarViewFailure action on error', () => {
      const view = 'dayGridMonth';
      const action = CalendarActions.setCalendarView({ view });
      const error = new Error('Failed to set view');
      const completion = CalendarActions.setCalendarViewFailure({ error: error.message });

      actions$ = of(action);

      effects.setCalendarView$.subscribe(result => {
        expect(result).toEqual(completion);
        expect(snackbarService.showError).toHaveBeenCalledWith('Failed to set calendar view: ' + error.message);
      });
    });
  });

  describe('setDateRange$', () => {
    it('should return setDateRangeSuccess action on success', () => {
      const dateRange = { 
        startDate: new Date(), 
        endDate: new Date() 
      };
      const action = CalendarActions.setDateRange({ dateRange });
      const completion = CalendarActions.setDateRangeSuccess({ dateRange });

      actions$ = of(action);

      effects.setDateRange$.subscribe(result => {
        expect(result).toEqual(completion);
      });
    });

    it('should return setDateRangeFailure action on error', () => {
      const dateRange = { 
        startDate: new Date(), 
        endDate: new Date() 
      };
      const action = CalendarActions.setDateRange({ dateRange });
      const error = new Error('Failed to set date range');
      const completion = CalendarActions.setDateRangeFailure({ error: error.message });

      actions$ = of(action);

      effects.setDateRange$.subscribe(result => {
        expect(result).toEqual(completion);
        expect(snackbarService.showError).toHaveBeenCalledWith('Failed to set date range: ' + error.message);
      });
    });
  });

  describe('navigateCalendar$', () => {
    it('should return navigateCalendarSuccess action on success', () => {
      const direction = 'next';
      const action = CalendarActions.navigateCalendar({ direction });
      const completion = CalendarActions.navigateCalendarSuccess({ 
        dateRange: {
          startDate: jasmine.any(Date),
          endDate: jasmine.any(Date)
        }
      });

      actions$ = of(action);

      effects.navigateCalendar$.subscribe(result => {
        expect(result.type).toEqual(completion.type);
        expect(result.dateRange.startDate).toEqual(jasmine.any(Date));
        expect(result.dateRange.endDate).toEqual(jasmine.any(Date));
      });
    });

    it('should return navigateCalendarFailure action on error', () => {
      const direction = 'next';
      const action = CalendarActions.navigateCalendar({ direction });
      const error = new Error('Failed to navigate');
      const completion = CalendarActions.navigateCalendarFailure({ error: error.message });

      actions$ = of(action);

      effects.navigateCalendar$.subscribe(result => {
        expect(result).toEqual(completion);
        expect(snackbarService.showError).toHaveBeenCalledWith('Failed to navigate calendar: ' + error.message);
      });
    });
  });

  describe('refreshCalendar$', () => {
    it('should return refreshCalendarSuccess action on success', () => {
      const action = CalendarActions.refreshCalendar();
      const completion = CalendarActions.refreshCalendarSuccess();

      actions$ = of(action);

      effects.refreshCalendar$.subscribe(result => {
        expect(result).toEqual(completion);
      });
    });

    it('should return refreshCalendarFailure action on error', () => {
      const action = CalendarActions.refreshCalendar();
      const error = new Error('Failed to refresh');
      const completion = CalendarActions.refreshCalendarFailure({ error: error.message });

      actions$ = of(action);

      effects.refreshCalendar$.subscribe(result => {
        expect(result).toEqual(completion);
        expect(snackbarService.showError).toHaveBeenCalledWith('Failed to refresh calendar: ' + error.message);
      });
    });
  });
});