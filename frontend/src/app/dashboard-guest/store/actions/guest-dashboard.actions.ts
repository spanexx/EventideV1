import { createAction, props } from '@ngrx/store';
import { Booking, BookingStatus } from '../../models/booking.models';
import { GuestInfo, GuestPreferences } from '../../models/guest.models';

// Load bookings
export const loadBookings = createAction(
  '[Guest Dashboard] Load Bookings'
);

export const loadBookingsSuccess = createAction(
  '[Guest Dashboard] Load Bookings Success',
  props<{ bookings: Booking[] }>()
);

export const loadBookingsFailure = createAction(
  '[Guest Dashboard] Load Bookings Failure',
  props<{ error: string }>()
);

// Load booking by ID
export const loadBookingById = createAction(
  '[Guest Dashboard] Load Booking By ID',
  props<{ id: string }>()
);

export const loadBookingByIdSuccess = createAction(
  '[Guest Dashboard] Load Booking By ID Success',
  props<{ booking: Booking }>()
);

export const loadBookingByIdFailure = createAction(
  '[Guest Dashboard] Load Booking By ID Failure',
  props<{ error: string }>()
);

// Cancel booking
export const cancelBooking = createAction(
  '[Guest Dashboard] Cancel Booking',
  props<{ id: string }>()
);

export const cancelBookingSuccess = createAction(
  '[Guest Dashboard] Cancel Booking Success',
  props<{ id: string }>()
);

export const cancelBookingFailure = createAction(
  '[Guest Dashboard] Cancel Booking Failure',
  props<{ error: string }>()
);

// Load profile
export const loadProfile = createAction(
  '[Guest Dashboard] Load Profile'
);

export const loadProfileSuccess = createAction(
  '[Guest Dashboard] Load Profile Success',
  props<{ profile: GuestInfo }>()
);

export const loadProfileFailure = createAction(
  '[Guest Dashboard] Load Profile Failure',
  props<{ error: string }>()
);

// Update profile
export const updateProfile = createAction(
  '[Guest Dashboard] Update Profile',
  props<{ profile: GuestInfo }>()
);

export const updateProfileSuccess = createAction(
  '[Guest Dashboard] Update Profile Success',
  props<{ profile: GuestInfo }>()
);

export const updateProfileFailure = createAction(
  '[Guest Dashboard] Update Profile Failure',
  props<{ error: string }>()
);

// Update preferences
export const updatePreferences = createAction(
  '[Guest Dashboard] Update Preferences',
  props<{ preferences: GuestPreferences }>()
);

export const updatePreferencesSuccess = createAction(
  '[Guest Dashboard] Update Preferences Success',
  props<{ preferences: GuestPreferences }>()
);

export const updatePreferencesFailure = createAction(
  '[Guest Dashboard] Update Preferences Failure',
  props<{ error: string }>()
);