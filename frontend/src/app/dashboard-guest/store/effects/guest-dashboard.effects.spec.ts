import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { GuestDashboardEffects } from './guest-dashboard.effects';
import * as GuestDashboardActions from '../actions/guest-dashboard.actions';
import { GuestDashboardService } from '../../services/guest-dashboard.service';
import { Router } from '@angular/router';

describe('GuestDashboardEffects', () => {
  let actions$: Observable<any>;
  let effects: GuestDashboardEffects;
  let mockGuestDashboardService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockGuestDashboardService = {
      getBookingHistory: jasmine.createSpy('getBookingHistory'),
      getBookingById: jasmine.createSpy('getBookingById'),
      cancelBooking: jasmine.createSpy('cancelBooking'),
      getProfile: jasmine.createSpy('getProfile'),
      updateProfile: jasmine.createSpy('updateProfile'),
      updatePreferences: jasmine.createSpy('updatePreferences')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    TestBed.configureTestingModule({
      providers: [
        GuestDashboardEffects,
        provideMockActions(() => actions$),
        { provide: GuestDashboardService, useValue: mockGuestDashboardService },
        { provide: Router, useValue: mockRouter }
      ]
    });

    effects = TestBed.inject(GuestDashboardEffects);
  });

  it('should be created', () => {
    expect(effects).toBeTruthy();
  });

  describe('loadBookings$', () => {
    it('should return loadBookingsSuccess with bookings on success', (done) => {
      const mockBookings: any = [{ id: '1', service: 'Haircut' }];
      mockGuestDashboardService.getBookingHistory.and.returnValue(of(mockBookings));
      
      actions$ = of(GuestDashboardActions.loadBookings());
      
      effects.loadBookings$.subscribe(action => {
        expect(action).toEqual(GuestDashboardActions.loadBookingsSuccess({ bookings: mockBookings }));
        done();
      });
    });

    it('should return loadBookingsFailure on error', (done) => {
      const error = 'Failed to load bookings';
      mockGuestDashboardService.getBookingHistory.and.returnValue(throwError(error));
      
      actions$ = of(GuestDashboardActions.loadBookings());
      
      effects.loadBookings$.subscribe(action => {
        expect(action).toEqual(GuestDashboardActions.loadBookingsFailure({ error }));
        done();
      });
    });
  });

  describe('loadBookingById$', () => {
    it('should return loadBookingByIdSuccess with booking on success', (done) => {
      const mockBooking: any = { id: '1', service: 'Haircut' };
      mockGuestDashboardService.getBookingById.and.returnValue(of(mockBooking));
      
      actions$ = of(GuestDashboardActions.loadBookingById({ id: '1' }));
      
      effects.loadBookingById$.subscribe(action => {
        expect(action).toEqual(GuestDashboardActions.loadBookingByIdSuccess({ booking: mockBooking }));
        done();
      });
    });

    it('should return loadBookingByIdFailure when booking is null', (done) => {
      mockGuestDashboardService.getBookingById.and.returnValue(of(null));
      
      actions$ = of(GuestDashboardActions.loadBookingById({ id: '1' }));
      
      effects.loadBookingById$.subscribe(action => {
        expect(action).toEqual(GuestDashboardActions.loadBookingByIdFailure({ error: 'Booking not found' }));
        done();
      });
    });

    it('should return loadBookingByIdFailure on error', (done) => {
      const error = 'Failed to load booking';
      mockGuestDashboardService.getBookingById.and.returnValue(throwError(error));
      
      actions$ = of(GuestDashboardActions.loadBookingById({ id: '1' }));
      
      effects.loadBookingById$.subscribe(action => {
        expect(action).toEqual(GuestDashboardActions.loadBookingByIdFailure({ error }));
        done();
      });
    });
  });

  describe('cancelBooking$', () => {
    it('should return cancelBookingSuccess on success', (done) => {
      mockGuestDashboardService.cancelBooking.and.returnValue(of(true));
      
      actions$ = of(GuestDashboardActions.cancelBooking({ id: '1' }));
      
      effects.cancelBooking$.subscribe(action => {
        expect(action).toEqual(GuestDashboardActions.cancelBookingSuccess({ id: '1' }));
        done();
      });
    });

    it('should return cancelBookingFailure when cancel fails', (done) => {
      mockGuestDashboardService.cancelBooking.and.returnValue(of(false));
      
      actions$ = of(GuestDashboardActions.cancelBooking({ id: '1' }));
      
      effects.cancelBooking$.subscribe(action => {
        expect(action).toEqual(GuestDashboardActions.cancelBookingFailure({ error: 'Failed to cancel booking' }));
        done();
      });
    });

    it('should return cancelBookingFailure on error', (done) => {
      const error = 'Failed to cancel booking';
      mockGuestDashboardService.cancelBooking.and.returnValue(throwError(error));
      
      actions$ = of(GuestDashboardActions.cancelBooking({ id: '1' }));
      
      effects.cancelBooking$.subscribe(action => {
        expect(action).toEqual(GuestDashboardActions.cancelBookingFailure({ error }));
        done();
      });
    });
  });
});