import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';
import { BookingFacadeService } from '../../services/booking/booking-facade.service';
import * as DashboardActions from '../actions/dashboard.actions';

@Injectable()
export class DashboardEffects {
  private actions$ = inject(Actions);
  private dashboardService = inject(DashboardService);
  private bookingFacade = inject(BookingFacadeService);

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
        this.bookingFacade.updateBooking(bookingId, { status: status as any }).pipe(
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
        this.bookingFacade.providerCancelBooking(bookingId).pipe(
          map(() => {
            console.log('[DashboardEffects] cancelBooking success', { bookingId });
            return DashboardActions.cancelBookingSuccess({ bookingId });
          }),
          catchError(error => {
            console.error('[DashboardEffects] cancelBooking error', error);
            return of(DashboardActions.cancelBookingFailure({ error: error.message }));
          })
        )
      )
    )
  );

  createBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.createBooking),
      switchMap(({ booking }) =>
        this.bookingFacade.createBooking(booking as any).pipe(
          map(newBooking => {
            const result = Array.isArray(newBooking) ? newBooking[0] : newBooking;
            return DashboardActions.createBookingSuccess({ booking: result as any });
          }),
          catchError(error => of(DashboardActions.createBookingFailure({ error: error.message })))
        )
      )
    )
  );

  updateBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.updateBooking),
      switchMap(({ bookingId, booking }) =>
        this.bookingFacade.updateBooking(bookingId, booking as any).pipe(
          map(updatedBooking => DashboardActions.updateBookingSuccess({ booking: updatedBooking as any })),
          catchError(error => of(DashboardActions.updateBookingFailure({ error: error.message })))
        )
      )
    )
  );

  approveBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.approveBooking),
      switchMap(({ bookingId }) =>
        this.bookingFacade.providerApproveBooking(bookingId).pipe(
          map(booking => {
            console.log('[DashboardEffects] approveBooking success', { bookingId });
            return DashboardActions.updateBookingStatusSuccess({ booking: booking as any });
          }),
          catchError(error => {
            console.error('[DashboardEffects] approveBooking error', error);
            return of(DashboardActions.updateBookingStatusFailure({ error: error.message }));
          })
        )
      )
    )
  );

  declineBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.declineBooking),
      switchMap(({ bookingId }) =>
        this.bookingFacade.providerDeclineBooking(bookingId).pipe(
          map(booking => {
            console.log('[DashboardEffects] declineBooking success', { bookingId });
            return DashboardActions.updateBookingStatusSuccess({ booking: booking as any });
          }),
          catchError(error => {
            console.error('[DashboardEffects] declineBooking error', error);
            return of(DashboardActions.updateBookingStatusFailure({ error: error.message }));
          })
        )
      )
    )
  );

  completeBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.completeBooking),
      switchMap(({ bookingId, reason }) =>
        this.bookingFacade.providerCompleteBooking(bookingId, reason).pipe(
          map(booking => {
            console.log('[DashboardEffects] completeBooking success', { bookingId });
            return DashboardActions.updateBookingStatusSuccess({ booking: booking as any });
          }),
          catchError(error => {
            console.error('[DashboardEffects] completeBooking error', error);
            return of(DashboardActions.updateBookingStatusFailure({ error: error.message }));
          })
        )
      )
    )
  );
}