import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { MockDashboardService } from '../../services/mock-dashboard.service';
import { MockBookingService } from '../../services/mock-booking.service';
import { MockAvailabilityService } from '../../services/mock-availability.service';
import * as DashboardActions from '../actions/dashboard.actions';
import * as AvailabilityActions from '../actions/availability.actions';

@Injectable()
export class DashboardEffects {
  private actions$ = inject(Actions);
  private mockDashboardService = inject(MockDashboardService);
  private mockBookingService = inject(MockBookingService);
  private mockAvailabilityService = inject(MockAvailabilityService);

  loadDashboardStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadDashboardStats),
      mergeMap(() =>
        this.mockDashboardService.getStats().pipe(
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
        this.mockDashboardService.getRecentActivity().pipe(
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
        this.mockDashboardService.getBookings(params).pipe(
          map(bookings => DashboardActions.loadBookingsSuccess({ bookings })),
          catchError(error => of(DashboardActions.loadBookingsFailure({ error: error.message })))
        )
      )
    )
  );

  loadAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadAvailability),
      mergeMap(({ providerId, date }) =>
        this.mockAvailabilityService.getAvailability(providerId, date).pipe(
          map(availability => DashboardActions.loadAvailabilitySuccess({ availability })),
          catchError(error => of(DashboardActions.loadAvailabilityFailure({ error: error.message })))
        )
      )
    )
  );

  updateBookingStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.updateBookingStatus),
      switchMap(({ bookingId, status }) =>
        this.mockBookingService.updateBookingStatus(bookingId, status as any).pipe(
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
        this.mockBookingService.cancelBooking(bookingId).pipe(
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
        this.mockBookingService.createBooking(booking).pipe(
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
        this.mockBookingService.updateBooking(bookingId, booking).pipe(
          map(updatedBooking => DashboardActions.updateBookingSuccess({ booking: updatedBooking })),
          catchError(error => of(DashboardActions.updateBookingFailure({ error: error.message })))
        )
      )
    )
  );

  createAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.createAvailability),
      switchMap(({ availability }) =>
        this.mockAvailabilityService.setAvailability([availability]).pipe(
          map(() => AvailabilityActions.createAvailabilitySuccess({ availability })),
          catchError(error => of(AvailabilityActions.createAvailabilityFailure({ error: error.message })))
        )
      )
    )
  );

  updateAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.updateAvailability),
      switchMap(({ availability }) =>
        this.mockAvailabilityService.updateSlot(availability).pipe(
          map(updatedAvailability => AvailabilityActions.updateAvailabilitySuccess({ availability: updatedAvailability })),
          catchError(error => of(AvailabilityActions.updateAvailabilityFailure({ error: error.message })))
        )
      )
    )
  );

  deleteAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AvailabilityActions.deleteAvailability),
      switchMap(({ id }) =>
        this.mockAvailabilityService.deleteSlot(id).pipe(
          map(() => AvailabilityActions.deleteAvailabilitySuccess({ id })),
          catchError(error => of(AvailabilityActions.deleteAvailabilityFailure({ error: error.message })))
        )
      )
    )
  );
}