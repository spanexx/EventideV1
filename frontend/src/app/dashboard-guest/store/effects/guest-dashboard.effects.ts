import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as GuestDashboardActions from '../actions/guest-dashboard.actions';
import { GuestDashboardService } from '../../services/guest-dashboard.service';

@Injectable()
export class GuestDashboardEffects {
  constructor(
    private actions$: Actions,
    private guestDashboardService: GuestDashboardService,
    private router: Router
  ) {}

  loadBookings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GuestDashboardActions.loadBookings),
      mergeMap(() =>
        this.guestDashboardService.getBookingHistory().pipe(
          map(bookings => GuestDashboardActions.loadBookingsSuccess({ bookings })),
          catchError(error => of(GuestDashboardActions.loadBookingsFailure({ error: error.message })))
        )
      )
    )
  );

  loadBookingById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GuestDashboardActions.loadBookingById),
      mergeMap(({ id }) =>
        this.guestDashboardService.getBookingById(id).pipe(
          map(booking => 
            booking 
              ? GuestDashboardActions.loadBookingByIdSuccess({ booking }) 
              : GuestDashboardActions.loadBookingByIdFailure({ error: 'Booking not found' })
          ),
          catchError(error => of(GuestDashboardActions.loadBookingByIdFailure({ error: error.message })))
        )
      )
    )
  );

  cancelBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GuestDashboardActions.cancelBooking),
      mergeMap(({ id }) =>
        this.guestDashboardService.cancelBooking(id).pipe(
          map(success => 
            success 
              ? GuestDashboardActions.cancelBookingSuccess({ id }) 
              : GuestDashboardActions.cancelBookingFailure({ error: 'Failed to cancel booking' })
          ),
          catchError(error => of(GuestDashboardActions.cancelBookingFailure({ error: error.message })))
        )
      )
    )
  );

  loadProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GuestDashboardActions.loadProfile),
      mergeMap(() =>
        this.guestDashboardService.getProfile().pipe(
          map(profile => 
            profile 
              ? GuestDashboardActions.loadProfileSuccess({ profile }) 
              : GuestDashboardActions.loadProfileFailure({ error: 'Profile not found' })
          ),
          catchError(error => of(GuestDashboardActions.loadProfileFailure({ error: error.message })))
        )
      )
    )
  );

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GuestDashboardActions.updateProfile),
      mergeMap(({ profile }) =>
        this.guestDashboardService.updateProfile(profile).pipe(
          map(updatedProfile => GuestDashboardActions.updateProfileSuccess({ profile: updatedProfile })),
          catchError(error => of(GuestDashboardActions.updateProfileFailure({ error: error.message })))
        )
      )
    )
  );

  updatePreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GuestDashboardActions.updatePreferences),
      mergeMap(({ preferences }) =>
        this.guestDashboardService.updatePreferences(preferences).pipe(
          map(updatedPreferences => GuestDashboardActions.updatePreferencesSuccess({ preferences: updatedPreferences })),
          catchError(error => of(GuestDashboardActions.updatePreferencesFailure({ error: error.message })))
        )
      )
    )
  );
}