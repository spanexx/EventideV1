import { createSelector, createFeatureSelector } from '@ngrx/store';
import { 
  GuestDashboardState, 
  GuestBookingState, 
  GuestProfileState,
  initialGuestDashboardState
} from '../reducers/guest-dashboard.reducer';
import { Booking, BookingStatus } from '../../models/booking.models';

// Feature selector
export const selectGuestDashboardState = createFeatureSelector<GuestDashboardState>('guestDashboard');

// Safe selectors that handle undefined state
export const selectSafeGuestDashboardState = createSelector(
  selectGuestDashboardState,
  (state: GuestDashboardState | undefined) => state || initialGuestDashboardState
);

// Booking selectors
export const selectBookingsState = createSelector(
  selectSafeGuestDashboardState,
  (state: GuestDashboardState) => state.bookings
);

export const selectAllBookings = createSelector(
  selectBookingsState,
  (state: GuestBookingState) => state.all
);

export const selectCurrentBooking = createSelector(
  selectBookingsState,
  (state: GuestBookingState) => state.current
);

export const selectBookingsLoading = createSelector(
  selectBookingsState,
  (state: GuestBookingState) => state.loading
);

export const selectBookingsError = createSelector(
  selectBookingsState,
  (state: GuestBookingState) => state.error
);

// Derived booking selectors
export const selectUpcomingBookings = createSelector(
  selectAllBookings,
  (bookings: Booking[]) => {
    const now = new Date();
    return bookings.filter(booking => 
      new Date(booking.date) > now && 
      (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING)
    );
  }
);

export const selectPastBookings = createSelector(
  selectAllBookings,
  (bookings: Booking[]) => {
    const now = new Date();
    return bookings.filter(booking => 
      new Date(booking.date) < now || 
      booking.status === BookingStatus.COMPLETED || 
      booking.status === BookingStatus.CANCELLED
    );
  }
);

export const selectTotalBookings = createSelector(
  selectAllBookings,
  (bookings: Booking[]) => bookings.length
);

// Profile selectors
export const selectProfileState = createSelector(
  selectSafeGuestDashboardState,
  (state: GuestDashboardState) => state.profile
);

export const selectProfileInfo = createSelector(
  selectProfileState,
  (state: GuestProfileState) => state.info
);

export const selectProfilePreferences = createSelector(
  selectProfileState,
  (state: GuestProfileState) => state.preferences
);

export const selectProfileLoading = createSelector(
  selectProfileState,
  (state: GuestProfileState) => state.loading
);

export const selectProfileError = createSelector(
  selectProfileState,
  (state: GuestProfileState) => state.error
);

// Overall selectors
export const selectGuestDashboardLoading = createSelector(
  selectSafeGuestDashboardState,
  (state: GuestDashboardState) => state.loading
);

export const selectGuestDashboardError = createSelector(
  selectSafeGuestDashboardState,
  (state: GuestDashboardState) => state.error
);