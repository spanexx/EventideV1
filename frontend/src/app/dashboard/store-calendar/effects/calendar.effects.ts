import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import * as CalendarActions from '../actions/calendar.actions';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { CalendarPreferencesSignalService } from '../../services/calendar-preferences-signal.service';

@Injectable()
export class CalendarEffects {
  private actions$ = inject(Actions);
  private snackbarService = inject(SnackbarService);
  private calendarPreferencesService = inject(CalendarPreferencesSignalService);

  setCalendarView$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.setCalendarView),
      switchMap(({ view }) =>
        // In a real implementation, this might involve API calls or other async operations
        of(view).pipe(
          map(() => CalendarActions.setCalendarViewSuccess({ view })),
          catchError(error => {
            this.snackbarService.showError('Failed to set calendar view: ' + error.message);
            return of(CalendarActions.setCalendarViewFailure({ error: error.message }));
          })
        )
      )
    )
  );

  setDateRange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.setDateRange),
      switchMap(({ dateRange }) =>
        // In a real implementation, this might involve API calls or other async operations
        of(dateRange).pipe(
          map(() => CalendarActions.setDateRangeSuccess({ dateRange })),
          catchError(error => {
            this.snackbarService.showError('Failed to set date range: ' + error.message);
            return of(CalendarActions.setDateRangeFailure({ error: error.message }));
          })
        )
      )
    )
  );

  navigateCalendar$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.navigateCalendar),
      switchMap(({ direction }) =>
        // In a real implementation, this would calculate the new date range based on direction
        of(direction).pipe(
          map(() => {
            // This is a simplified implementation
            // In a real app, you would calculate the actual new date range
            const today = new Date();
            return CalendarActions.navigateCalendarSuccess({ 
              dateRange: {
                startDate: today,
                endDate: today
              }
            });
          }),
          catchError(error => {
            this.snackbarService.showError('Failed to navigate calendar: ' + error.message);
            return of(CalendarActions.navigateCalendarFailure({ error: error.message }));
          })
        )
      )
    )
  );

  refreshCalendar$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.refreshCalendar),
      switchMap(() =>
        // In a real implementation, this might involve API calls or other async operations
        of(null).pipe(
          map(() => CalendarActions.refreshCalendarSuccess()),
          catchError(error => {
            this.snackbarService.showError('Failed to refresh calendar: ' + error.message);
            return of(CalendarActions.refreshCalendarFailure({ error: error.message }));
          })
        )
      )
    )
  );

  // Set Preferred View Effects
  setPreferredView$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.setPreferredView),
      switchMap(({ view }) =>
        this.calendarPreferencesService.setPreferredView(view).pipe(
          map(() => {
            console.log('[CalendarEffects] Successfully set preferred view:', view);
            return CalendarActions.setPreferredViewSuccess({ view });
          }),
          catchError(error => {
            console.error('[CalendarEffects] Failed to set preferred view:', error);
            this.snackbarService.showError('Failed to set preferred view: ' + error.message);
            return of(CalendarActions.setPreferredViewFailure({ error: error.message }));
          })
        )
      )
    )
  );

  // Load Calendar Preferences Effects
  loadCalendarPreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CalendarActions.loadCalendarPreferences),
      switchMap(() => {
        const preferredView = this.calendarPreferencesService.getPreferredView();
        console.log('[CalendarEffects] Loading calendar preferences, preferred view:', preferredView);
        return of(preferredView).pipe(
          map(view => CalendarActions.loadCalendarPreferencesSuccess({ preferredView: view })),
          catchError(error => {
            console.error('[CalendarEffects] Failed to load calendar preferences:', error);
            this.snackbarService.showError('Failed to load calendar preferences: ' + error.message);
            return of(CalendarActions.loadCalendarPreferencesFailure({ error: error.message }));
          })
        );
      })
    )
  );
}