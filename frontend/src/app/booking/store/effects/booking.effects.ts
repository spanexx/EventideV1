import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import * as BookingActions from '../actions/booking.actions';
import { BookingService } from '../../services/booking.service';
import { AvailabilityService } from '../../services/availability.service';
import { BookingSocketService } from '../../services/booking-socket.service';

@Injectable()
export class BookingEffects {
  constructor(
    private actions$: Actions,
    private store: Store,
    private bookingService: BookingService,
    private availabilityService: AvailabilityService,
    private socketService: BookingSocketService
  ) {
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
        this.bookingService.createBooking(booking as any).pipe(
          map(response => {
            if (response.success) {
              return BookingActions.createBookingSuccess({ booking: response.booking });
            } else {
              return BookingActions.createBookingFailure({ error: 'Booking failed' });
            }
          }),
          catchError(error => of(BookingActions.createBookingFailure({ error: error.message })))
        )
      )
    )
  );
  
  loadAvailableSlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BookingActions.loadAvailableSlots),
      mergeMap(({ request }) =>
        this.availabilityService.getAvailableSlots(request).pipe(
          map(slots => BookingActions.loadAvailableSlotsSuccess({ slots })),
          catchError(error => of(BookingActions.loadAvailableSlotsFailure({ error: error.message })))
        )
      )
    )
  );
}