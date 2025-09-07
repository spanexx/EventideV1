import { createReducer, on } from '@ngrx/store';
import { DashboardStats, Activity } from '../../models/dashboard.models';
import { Booking, BookingStatus } from '../../models/booking.models';
import * as DashboardActions from '../actions/dashboard.actions';

export interface DashboardState {
  stats: DashboardStats | null;
  activity: Activity[];
  bookings: Booking[];
  loading: boolean;
  error: string | null;
}

export const initialDashboardState: DashboardState = {
  stats: null,
  activity: [],
  bookings: [],
  loading: false,
  error: null
};

export const dashboardReducer = createReducer(
  initialDashboardState,
  
  // Load Dashboard Stats
  on(DashboardActions.loadDashboardStats, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(DashboardActions.loadDashboardStatsSuccess, (state, { stats }) => ({
    ...state,
    stats,
    loading: false
  })),
  
  on(DashboardActions.loadDashboardStatsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load Recent Activity
  on(DashboardActions.loadRecentActivity, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(DashboardActions.loadRecentActivitySuccess, (state, { activity }) => ({
    ...state,
    activity,
    loading: false
  })),
  
  on(DashboardActions.loadRecentActivityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load Bookings
  on(DashboardActions.loadBookings, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(DashboardActions.loadBookingsSuccess, (state, { bookings }) => ({
    ...state,
    bookings,
    loading: false
  })),
  
  on(DashboardActions.loadBookingsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Booking Status
  on(DashboardActions.updateBookingStatus, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(DashboardActions.updateBookingStatusSuccess, (state, { booking }) => ({
    ...state,
    bookings: state.bookings.map(b => b.id === booking.id ? booking : b),
    loading: false
  })),
  
  on(DashboardActions.updateBookingStatusFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Cancel Booking
  on(DashboardActions.cancelBooking, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(DashboardActions.cancelBookingSuccess, (state, { bookingId }) => ({
    ...state,
    bookings: state.bookings.map(booking => 
      booking.id === bookingId ? { ...booking, status: BookingStatus.CANCELLED } : booking
    ),
    loading: false
  })),
  
  on(DashboardActions.cancelBookingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Create Booking
  on(DashboardActions.createBooking, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(DashboardActions.createBookingSuccess, (state, { booking }) => ({
    ...state,
    bookings: [...state.bookings, booking],
    loading: false
  })),
  
  on(DashboardActions.createBookingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Booking
  on(DashboardActions.updateBooking, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(DashboardActions.updateBookingSuccess, (state, { booking }) => ({
    ...state,
    bookings: state.bookings.map(b => b.id === booking.id ? booking : b),
    loading: false
  })),
  
  on(DashboardActions.updateBookingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);