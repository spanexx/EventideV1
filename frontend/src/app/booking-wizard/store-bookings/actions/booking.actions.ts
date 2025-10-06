import { createAction, props } from '@ngrx/store';
import { Booking, GuestInfo } from '../../../shared/models/booking.models';
import { TimeSlot, AvailableSlotsRequest } from '../../../shared/models/availability.models';

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

// Get booking by ID
export const getBookingById = createAction(
  '[Booking] Get Booking By ID',
  props<{ id: string }>()
);

export const getBookingByIdSuccess = createAction(
  '[Booking] Get Booking By ID Success',
  props<{ booking: Booking }>()
);

export const getBookingByIdFailure = createAction(
  '[Booking] Get Booking By ID Failure',
  props<{ error: string }>()
);

// Update booking
export const updateBooking = createAction(
  '[Booking] Update Booking',
  props<{ id: string; updates: Partial<Booking> }>()
);

export const updateBookingSuccess = createAction(
  '[Booking] Update Booking Success',
  props<{ booking: Booking }>()
);

export const updateBookingFailure = createAction(
  '[Booking] Update Booking Failure',
  props<{ error: string }>()
);

// Cancel booking
export const cancelBooking = createAction(
  '[Booking] Cancel Booking',
  props<{ id: string; guestEmail: string }>()
);

export const cancelBookingSuccess = createAction(
  '[Booking] Cancel Booking Success',
  props<{ booking: Booking }>()
);

export const cancelBookingFailure = createAction(
  '[Booking] Cancel Booking Failure',
  props<{ error: string }>()
);

// Verify booking by serial key
export const verifyBooking = createAction(
  '[Booking] Verify Booking',
  props<{ serialKey: string }>()
);

export const verifyBookingSuccess = createAction(
  '[Booking] Verify Booking Success',
  props<{ booking: Booking }>()
);

export const verifyBookingFailure = createAction(
  '[Booking] Verify Booking Failure',
  props<{ error: string }>()
);

// Get QR code
export const getQRCode = createAction(
  '[Booking] Get QR Code',
  props<{ serialKey: string }>()
);

export const getQRCodeSuccess = createAction(
  '[Booking] Get QR Code Success',
  props<{ qrCode: string }>()
);

export const getQRCodeFailure = createAction(
  '[Booking] Get QR Code Failure',
  props<{ error: string }>()
);