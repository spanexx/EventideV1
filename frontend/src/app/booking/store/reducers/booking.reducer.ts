import { createReducer, on } from '@ngrx/store';
import * as BookingActions from '../actions/booking.actions';
import { Booking, GuestInfo } from '../../models/booking.models';
import { TimeSlot } from '../../models/availability.models';

export interface BookingState {
  duration: number | null;
  selectedSlot: TimeSlot | null;
  guestInfo: GuestInfo | null;
  booking: Booking | null;
  availability: TimeSlot[];
  loading: boolean;
  error: string | null;
}

export const initialBookingState: BookingState = {
  duration: null,
  selectedSlot: null,
  guestInfo: null,
  booking: null,
  availability: [],
  loading: false,
  error: null
};

export const bookingReducer = createReducer(
  initialBookingState,
  
  // Set duration
  on(BookingActions.setDuration, (state, { duration }) => ({
    ...state,
    duration
  })),
  
  // Set selected slot
  on(BookingActions.setSelectedSlot, (state, { slot }) => ({
    ...state,
    selectedSlot: slot
  })),
  
  // Set guest info
  on(BookingActions.setGuestInfo, (state, { guestInfo }) => ({
    ...state,
    guestInfo
  })),
  
  // Create booking
  on(BookingActions.createBooking, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(BookingActions.createBookingSuccess, (state, { booking }) => ({
    ...state,
    booking,
    loading: false
  })),
  
  on(BookingActions.createBookingFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load available slots
  on(BookingActions.loadAvailableSlots, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(BookingActions.loadAvailableSlotsSuccess, (state, { slots }) => ({
    ...state,
    availability: slots,
    loading: false
  })),
  
  on(BookingActions.loadAvailableSlotsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Slot booked (from WebSocket)
  on(BookingActions.slotBooked, (state, { slotId }) => ({
    ...state,
    availability: state.availability.map(slot => 
      slot.id === slotId ? { ...slot, isBooked: true } : slot
    )
  })),
  
  // Booking confirmed (from WebSocket)
  on(BookingActions.bookingConfirmed, (state, { booking }) => ({
    ...state,
    booking
  }))
);