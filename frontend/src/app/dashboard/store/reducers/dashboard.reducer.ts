import { createReducer, on } from '@ngrx/store';
import { DashboardStats, Activity } from '../../models/dashboard.models';
import { Booking, BookingStatus } from '../../models/booking.models';
import { Availability } from '../../models/availability.models';
import * as DashboardActions from '../actions/dashboard.actions';
import * as AvailabilityActions from '../actions/availability.actions';

export interface DashboardState {
  stats: DashboardStats | null;
  activity: Activity[];
  bookings: Booking[];
  availability: Availability[];
  loading: boolean;
  error: string | null;
}

export const initialDashboardState: DashboardState = {
  stats: null,
  activity: [],
  bookings: [],
  availability: [],
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
  
  // Load Availability
  on(DashboardActions.loadAvailability, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(DashboardActions.loadAvailabilitySuccess, (state, { availability }) => ({
    ...state,
    availability,
    loading: false
  })),
  
  on(DashboardActions.loadAvailabilityFailure, (state, { error }) => ({
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
  })),
  
  // Create Availability
  on(AvailabilityActions.createAvailability, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AvailabilityActions.createAvailabilitySuccess, (state, { availability }) => ({
    ...state,
    availability: [...state.availability, availability],
    loading: false
  })),
  
  on(AvailabilityActions.createAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Update Availability
  on(AvailabilityActions.updateAvailability, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AvailabilityActions.updateAvailabilitySuccess, (state, { availability }) => ({
    ...state,
    availability: state.availability.map(a => a.id === availability.id ? availability : a),
    loading: false
  })),
  
  on(AvailabilityActions.updateAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Delete Availability
  on(AvailabilityActions.deleteAvailability, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AvailabilityActions.deleteAvailabilitySuccess, (state, { id }) => ({
    ...state,
    availability: state.availability.filter(a => a.id !== id),
    loading: false
  })),
  
  on(AvailabilityActions.deleteAvailabilityFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);