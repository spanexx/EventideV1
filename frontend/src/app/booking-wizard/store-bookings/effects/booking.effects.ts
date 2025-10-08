import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import * as BookingActions from '../actions/booking.actions';
import { BookingFacadeService } from '../../../dashboard/services/booking/booking-facade.service';
import { AvailabilityService } from '../../../dashboard/services/availability.service';
import { BookingSocketService } from '../../../dashboard/services/booking/booking-socket.service';

@Injectable()
export class BookingEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private bookingFacade = inject(BookingFacadeService);
  private availabilityService = inject(AvailabilityService);
  private socketService = inject(BookingSocketService);

  constructor() {
    // Subscribe to WebSocket events
    this.socketService.bookingConfirmed$.subscribe(booking => {
      this.store.dispatch(BookingActions.bookingConfirmed({ booking }));
    });
    
    this.socketService.slotBooked$.subscribe(slotId => {
      this.store.dispatch(BookingActions.slotBooked({ slotId }));
    });
  }
  
  createBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookingActions.createBooking),
      mergeMap(({ booking }) =>
        this.bookingFacade.createBooking(booking as any).pipe(
          map(response => {
            // Handle both single booking and array of bookings
            const bookingData = Array.isArray(response) ? response[0] : response;
            return BookingActions.createBookingSuccess({ booking: bookingData as any });
          }),
          catchError(error => {
            const errorMessage = error.error?.message || error.message || 'Booking failed';
            return of(BookingActions.createBookingFailure({ error: errorMessage }));
          })
        )
      )
    )
  );
  
  loadAvailableSlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookingActions.loadAvailableSlots),
      mergeMap(({ request }) =>
        this.availabilityService.getAvailability(request.providerId, request.date).pipe(
          map(availabilities => {
            // Convert Availability to TimeSlot format and filter available slots
            const slots = availabilities
              .filter(avail => !avail.isBooked)
              .map(avail => ({
                id: avail.id,
                providerId: avail.providerId,
                date: avail.date,
                startTime: avail.startTime,
                endTime: avail.endTime,
                duration: request.duration || avail.duration,
                isBooked: avail.isBooked,
                bookingId: avail.bookingId
              }));
            return BookingActions.loadAvailableSlotsSuccess({ slots });
          }),
          catchError(error => {
            const errorMessage = error.error?.message || error.message || 'Failed to load slots';
            return of(BookingActions.loadAvailableSlotsFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  getBookingById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookingActions.getBookingById),
      mergeMap(({ id }) =>
        this.bookingFacade.getBookingById(id).pipe(
          map(booking => BookingActions.getBookingByIdSuccess({ booking: booking as any })),
          catchError(error => {
            const errorMessage = error.error?.message || error.message || 'Failed to get booking';
            return of(BookingActions.getBookingByIdFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  updateBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookingActions.updateBooking),
      mergeMap(({ id, updates }) =>
        this.bookingFacade.updateBooking(id, updates).pipe(
          map(booking => BookingActions.updateBookingSuccess({ booking: booking as any })),
          catchError(error => {
            const errorMessage = error.error?.message || error.message || 'Failed to update booking';
            return of(BookingActions.updateBookingFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  cancelBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookingActions.cancelBooking),
      mergeMap(({ id, guestEmail }) =>
        this.bookingFacade.cancelBooking(id, guestEmail).pipe(
          map(booking => BookingActions.cancelBookingSuccess({ booking: booking as any })),
          catchError(error => {
            const errorMessage = error.error?.message || error.message || 'Failed to cancel booking';
            return of(BookingActions.cancelBookingFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  verifyBooking$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookingActions.verifyBooking),
      mergeMap(({ serialKey }) =>
        this.bookingFacade.verifyBooking(serialKey).pipe(
          map(booking => BookingActions.verifyBookingSuccess({ booking: booking as any })),
          catchError(error => {
            const errorMessage = error.error?.message || error.message || 'Failed to verify booking';
            return of(BookingActions.verifyBookingFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  getQRCode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookingActions.getQRCode),
      mergeMap(({ serialKey }) =>
        this.bookingFacade.getBookingQRCode(serialKey).pipe(
          map(qrCode => BookingActions.getQRCodeSuccess({ qrCode })),
          catchError(error => {
            const errorMessage = error.error?.message || error.message || 'Failed to get QR code';
            return of(BookingActions.getQRCodeFailure({ error: errorMessage }));
          })
        )
      )
    )
  );
}