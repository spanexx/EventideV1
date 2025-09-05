import { createAction, props } from '@ngrx/store';
import { Booking, GuestInfo } from '../../models/booking.models';
import { TimeSlot, AvailableSlotsRequest } from '../../models/availability.models';

// Set duration
export const setDuration = createAction(
  '[Booking] Set Duration',
  props<{ duration: number }>()
);

// Set selected slot
export const setSelectedSlot = createAction(
  '[Booking] Set Selected Slot',
  props<{ slot: TimeSlot }>()
);

// Set guest info
export const setGuestInfo = createAction(
  '[Booking] Set Guest Info',
  props<{ guestInfo: GuestInfo }>()
);

// Create booking
export const createBooking = createAction(
  '[Booking] Create Booking',
  props<{ booking: Partial<Booking> }>()
);

export const createBookingSuccess = createAction(
  '[Booking] Create Booking Success',
  props<{ booking: Booking }>()
);

export const createBookingFailure = createAction(
  '[Booking] Create Booking Failure',
  props<{ error: string }>()
);

// Load available slots
export const loadAvailableSlots = createAction(
  '[Booking] Load Available Slots',
  props<{ request: AvailableSlotsRequest }>()
);

export const loadAvailableSlotsSuccess = createAction(
  '[Booking] Load Available Slots Success',
  props<{ slots: TimeSlot[] }>()
);

export const loadAvailableSlotsFailure = createAction(
  '[Booking] Load Available Slots Failure',
  props<{ error: string }>()
);

// Slot booked (from WebSocket)
export const slotBooked = createAction(
  '[Booking] Slot Booked',
  props<{ slotId: string }>()
);

// Booking confirmed (from WebSocket)
export const bookingConfirmed = createAction(
  '[Booking] Booking Confirmed',
  props<{ booking: Booking }>()
);