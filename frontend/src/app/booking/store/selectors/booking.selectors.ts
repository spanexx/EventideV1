import { createSelector, createFeatureSelector } from '@ngrx/store';
import { BookingState } from '../reducers/booking.reducer';

// Feature selector
export const selectBookingState = createFeatureSelector<BookingState>('booking');

// Duration selectors
export const selectDuration = createSelector(
  selectBookingState,
  (state: BookingState) => state.duration
);

// Selected slot selectors
export const selectSelectedSlot = createSelector(
  selectBookingState,
  (state: BookingState) => state.selectedSlot
);

// Guest info selectors
export const selectGuestInfo = createSelector(
  selectBookingState,
  (state: BookingState) => state.guestInfo
);

// Booking selectors
export const selectBooking = createSelector(
  selectBookingState,
  (state: BookingState) => state.booking
);

// Availability selectors
export const selectAvailability = createSelector(
  selectBookingState,
  (state: BookingState) => state.availability
);

// Loading and error selectors
export const selectBookingLoading = createSelector(
  selectBookingState,
  (state: BookingState) => state.loading
);

export const selectBookingError = createSelector(
  selectBookingState,
  (state: BookingState) => state.error
);