import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';
import { BookingService } from '../../services/booking.service';
import * as DashboardActions from '../actions/dashboard.actions';

@Injectable()
export class DashboardEffects {
  private actions$ = inject(Actions);
  private dashboardService = inject(DashboardService);
  private bookingService = inject(BookingService);

  loadDashboardStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadDashboardStats),
      mergeMap(() =>
        this.dashboardService.getStats().pipe(
          map(stats => DashboardActions.loadDashboardStatsSuccess({ stats })),
          catchError(error => of(DashboardActions.loadDashboardStatsFailure({ error: error.message })))
        )
      )
    )
  );

  loadRecentActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadRecentActivity),
      mergeMap(() =>
        this.dashboardService.getRecentActivity().pipe(
          map(activity => DashboardActions.loadRecentActivitySuccess({ activity })),
          catchError(error => of(DashboardActions.loadRecentActivityFailure({ error: error.message })))
        )
      )
    )
  );

  loadBookings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadBookings),
      mergeMap(({ params }) =>
        this.dashboardService.getBookings(params).pipe(
          map(bookings => DashboardActions.loadBookingsSuccess({ bookings })),
          catchError(error => of(DashboardActions.loadBookingsFailure({ error: error.message })))
        )
      )
    )
  );

  updateBookingStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.updateBookingStatus),
      switchMap(({ bookingId, status }) =>
        this.bookingService.updateBookingStatus(bookingId, status as any).pipe(
          map(booking => DashboardActions.updateBookingStatusSuccess({ booking })),
          catchError(error => of(DashboardActions.updateBookingStatusFailure({ error: error.message })))
        )
      )
    )
  );

  cancelBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.cancelBooking),
      switchMap(({ bookingId }) =>
        this.bookingService.cancelBooking(bookingId).pipe(
          map(() => DashboardActions.cancelBookingSuccess({ bookingId })),
          catchError(error => of(DashboardActions.cancelBookingFailure({ error: error.message })))
        )
      )
    )
  );

  createBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.createBooking),
      switchMap(({ booking }) =>
        this.bookingService.createBooking(booking).pipe(
          map(newBooking => DashboardActions.createBookingSuccess({ booking: newBooking })),
          catchError(error => of(DashboardActions.createBookingFailure({ error: error.message })))
        )
      )
    )
  );

  updateBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.updateBooking),
      switchMap(({ bookingId, booking }) =>
        this.bookingService.updateBooking(bookingId, booking).pipe(
          map(updatedBooking => DashboardActions.updateBookingSuccess({ booking: updatedBooking })),
          catchError(error => of(DashboardActions.updateBookingFailure({ error: error.message })))
        )
      )
    )
  );
}