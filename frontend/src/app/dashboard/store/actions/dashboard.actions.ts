import { createAction, props } from '@ngrx/store';
import { DashboardStats, Activity } from '../../models/dashboard.models';
import { Booking } from '../../models/booking.models';

// Load Dashboard Stats
export const loadDashboardStats = createAction('[Dashboard] Load Dashboard Stats');

export const loadDashboardStatsSuccess = createAction(
  '[Dashboard] Load Dashboard Stats Success',
  props<{ stats: DashboardStats }>()
);

export const loadDashboardStatsFailure = createAction(
  '[Dashboard] Load Dashboard Stats Failure',
  props<{ error: string }>()
);

// Load Recent Activity
export const loadRecentActivity = createAction('[Dashboard] Load Recent Activity');

export const loadRecentActivitySuccess = createAction(
  '[Dashboard] Load Recent Activity Success',
  props<{ activity: Activity[] }>()
);

export const loadRecentActivityFailure = createAction(
  '[Dashboard] Load Recent Activity Failure',
  props<{ error: string }>()
);

// Load Bookings
export const loadBookings = createAction(
  '[Dashboard] Load Bookings',
  props<{ params: any }>()
);

export const loadBookingsSuccess = createAction(
  '[Dashboard] Load Bookings Success',
  props<{ bookings: Booking[] }>()
);

export const loadBookingsFailure = createAction(
  '[Dashboard] Load Bookings Failure',
  props<{ error: string }>()
);

// Update Booking Status
export const updateBookingStatus = createAction(
  '[Dashboard] Update Booking Status',
  props<{ bookingId: string; status: string }>()
);

export const updateBookingStatusSuccess = createAction(
  '[Dashboard] Update Booking Status Success',
  props<{ booking: Booking }>()
);

export const updateBookingStatusFailure = createAction(
  '[Dashboard] Update Booking Status Failure',
  props<{ error: string }>()
);

// Cancel Booking
export const cancelBooking = createAction(
  '[Dashboard] Cancel Booking',
  props<{ bookingId: string }>()
);

export const cancelBookingSuccess = createAction(
  '[Dashboard] Cancel Booking Success',
  props<{ bookingId: string }>()
);

export const cancelBookingFailure = createAction(
  '[Dashboard] Cancel Booking Failure',
  props<{ error: string }>()
);

// Create Booking
export const createBooking = createAction(
  '[Dashboard] Create Booking',
  props<{ booking: any }>()
);

export const createBookingSuccess = createAction(
  '[Dashboard] Create Booking Success',
  props<{ booking: Booking }>()
);

export const createBookingFailure = createAction(
  '[Dashboard] Create Booking Failure',
  props<{ error: string }>()
);

// Update Booking
export const updateBooking = createAction(
  '[Dashboard] Update Booking',
  props<{ bookingId: string; booking: any }>()
);

export const updateBookingSuccess = createAction(
  '[Dashboard] Update Booking Success',
  props<{ booking: Booking }>()
);

export const updateBookingFailure = createAction(
  '[Dashboard] Update Booking Failure',
  props<{ error: string }>()
);