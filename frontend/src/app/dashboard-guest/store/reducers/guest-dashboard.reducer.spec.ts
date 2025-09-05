import { guestDashboardReducer, initialGuestDashboardState } from './guest-dashboard.reducer';
import * as GuestDashboardActions from '../actions/guest-dashboard.actions';
import { BookingStatus } from '../../models/booking.models';

describe('GuestDashboardReducer', () => {
  it('should return the initial state', () => {
    const state = guestDashboardReducer(undefined, { type: 'UNKNOWN_ACTION' });
    expect(state).toEqual(initialGuestDashboardState);
  });

  it('should handle loadBookings action', () => {
    const action = GuestDashboardActions.loadBookings();
    const state = guestDashboardReducer(initialGuestDashboardState, action);
    
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should handle loadBookingsSuccess action', () => {
    const mockBookings: any = [
      {
        id: '1',
        providerId: 'provider-1',
        providerName: 'Hair Salon',
        service: 'Haircut',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(),
        duration: 60,
        status: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const action = GuestDashboardActions.loadBookingsSuccess({ bookings: mockBookings });
    const state = guestDashboardReducer(initialGuestDashboardState, action);
    
    expect(state.bookings.all).toEqual(mockBookings);
    expect(state.bookings.loading).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('should handle loadBookingsFailure action', () => {
    const error = 'Failed to load bookings';
    const action = GuestDashboardActions.loadBookingsFailure({ error });
    const state = guestDashboardReducer(initialGuestDashboardState, action);
    
    expect(state.loading).toBe(false);
    expect(state.error).toBe(error);
  });

  it('should handle cancelBookingSuccess action', () => {
    const initialState = {
      ...initialGuestDashboardState,
      bookings: {
        ...initialGuestDashboardState.bookings,
        all: [
          {
            id: '1',
            providerId: 'provider-1',
            providerName: 'Hair Salon',
            service: 'Haircut',
            date: new Date(),
            startTime: new Date(),
            endTime: new Date(),
            duration: 60,
            status: BookingStatus.CONFIRMED,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ] as any,
        current: {
          id: '1',
          providerId: 'provider-1',
          providerName: 'Hair Salon',
          service: 'Haircut',
          date: new Date(),
          startTime: new Date(),
          endTime: new Date(),
          duration: 60,
          status: BookingStatus.CONFIRMED,
          createdAt: new Date(),
          updatedAt: new Date()
        } as any
      }
    };
    
    const action = GuestDashboardActions.cancelBookingSuccess({ id: '1' });
    const state = guestDashboardReducer(initialState, action);
    
    expect(state.bookings.all[0].status).toBe(BookingStatus.CANCELLED);
    expect(state.bookings.current?.status).toBe(BookingStatus.CANCELLED);
  });
});