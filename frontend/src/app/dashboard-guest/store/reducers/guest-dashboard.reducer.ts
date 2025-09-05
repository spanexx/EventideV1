import { createReducer, on } from '@ngrx/store';
import * as GuestDashboardActions from '../actions/guest-dashboard.actions';
import { Booking, BookingStatus } from '../../models/booking.models';
import { GuestInfo, GuestPreferences } from '../../models/guest.models';

export interface GuestBookingState {
  all: Booking[];
  current: Booking | null;
  loading: boolean;
  error: string | null;
}

export interface GuestProfileState {
  info: GuestInfo | null;
  preferences: GuestPreferences | null;
  loading: boolean;
  error: string | null;
}

export interface GuestDashboardState {
  bookings: GuestBookingState;
  profile: GuestProfileState;
  loading: boolean;
  error: string | null;
}

export const initialGuestBookingState: GuestBookingState = {
  all: [],
  current: null,
  loading: false,
  error: null
};

export const initialGuestProfileState: GuestProfileState = {
  info: null,
  preferences: null,
  loading: false,
  error: null
};

export const initialGuestDashboardState: GuestDashboardState = {
  bookings: initialGuestBookingState,
  profile: initialGuestProfileState,
  loading: false,
  error: null
};

export const guestDashboardReducer = createReducer(
  initialGuestDashboardState,
  
  // Load bookings
  on(GuestDashboardActions.loadBookings, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(GuestDashboardActions.loadBookingsSuccess, (state, { bookings }) => ({
    ...state,
    bookings: {
      ...state.bookings,
      all: bookings,
      loading: false
    },
    loading: false
  })),
  
  on(GuestDashboardActions.loadBookingsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load booking by ID
  on(GuestDashboardActions.loadBookingById, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(GuestDashboardActions.loadBookingByIdSuccess, (state, { booking }) => ({
    ...state,
    bookings: {
      ...state.bookings,
      current: booking,
      loading: false
    },
    loading: false
  })),
  
  on(GuestDashboardActions.loadBookingByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Cancel booking
  on(GuestDashboardActions.cancelBooking, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(GuestDashboardActions.cancelBookingSuccess, (state, { id }) => ({
    ...state,
    bookings: {
      ...state.bookings,
      all: state.bookings.all.map(booking => 
        booking.id === id ? { ...booking, status: BookingStatus.CANCELLED } : booking
      ),
      current: state.bookings.current?.id === id ? 
        { ...state.bookings.current, status: BookingStatus.CANCELLED } : 
        state.bookings.current,
      loading: false
    },
    loading: false
  })),
  
  on(GuestDashboardActions.cancelBookingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load profile
  on(GuestDashboardActions.loadProfile, (state) => ({
    ...state,
    profile: {
      ...state.profile,
      loading: true,
      error: null
    }
  })),
  
  on(GuestDashboardActions.loadProfileSuccess, (state, { profile }) => ({
    ...state,
    profile: {
      ...state.profile,
      info: profile,
      loading: false
    }
  })),
  
  on(GuestDashboardActions.loadProfileFailure, (state, { error }) => ({
    ...state,
    profile: {
      ...state.profile,
      loading: false,
      error
    }
  })),
  
  // Update profile
  on(GuestDashboardActions.updateProfile, (state) => ({
    ...state,
    profile: {
      ...state.profile,
      loading: true,
      error: null
    }
  })),
  
  on(GuestDashboardActions.updateProfileSuccess, (state, { profile }) => ({
    ...state,
    profile: {
      ...state.profile,
      info: profile,
      loading: false
    }
  })),
  
  on(GuestDashboardActions.updateProfileFailure, (state, { error }) => ({
    ...state,
    profile: {
      ...state.profile,
      loading: false,
      error
    }
  }))
);

export default guestDashboardReducer;