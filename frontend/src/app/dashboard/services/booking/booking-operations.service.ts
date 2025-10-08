import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { BookingApiService } from './booking-api.service';
import { BookingStateService } from './booking-state.service';
import { 
  Booking, 
  CreateBookingDto, 
  UpdateBookingDto, 
  GetBookingsDto,
  BookingStatus 
} from '../../models/booking.models';

/**
 * Business logic service for booking operations
 * Coordinates between API and state management
 */
@Injectable({
  providedIn: 'root'
})
export class BookingOperationsService {
  constructor(
    private bookingApi: BookingApiService,
    private bookingState: BookingStateService
  ) {}

  /**
   * Create a new booking
   */
  createBooking(bookingData: CreateBookingDto): Observable<Booking | Booking[]> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.createBooking(bookingData).pipe(
      tap(result => {
        // Handle both single booking and array of bookings
        if (Array.isArray(result)) {
          this.bookingState.addBookings(result);
        } else {
          this.bookingState.addBooking(result);
        }
        this.bookingState.setLoading(false);
      }),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to create booking');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get booking by ID
   */
  getBookingById(id: string): Observable<Booking> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.getBookingById(id).pipe(
      tap(booking => {
        this.bookingState.setSelectedBooking(booking);
        this.bookingState.setLoading(false);
      }),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to fetch booking');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update a booking
   */
  updateBooking(id: string, updateData: UpdateBookingDto): Observable<Booking> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.updateBooking(id, updateData).pipe(
      tap(updatedBooking => {
        this.bookingState.updateBooking(updatedBooking);
        this.bookingState.setLoading(false);
      }),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to update booking');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel a booking (requires guest email for verification)
   */
  cancelBooking(id: string, guestEmail: string): Observable<Booking> {
    return this.updateBooking(id, {
      status: BookingStatus.CANCELLED,
      guestEmail
    });
  }

  /**
   * Confirm a booking
   */
  confirmBooking(id: string): Observable<Booking> {
    return this.updateBooking(id, {
      status: BookingStatus.CONFIRMED
    });
  }

  /**
   * Mark booking as completed
   */
  completeBooking(id: string): Observable<Booking> {
    return this.updateBooking(id, {
      status: BookingStatus.COMPLETED
    });
  }

  /**
   * Get all provider bookings
   */
  getProviderBookings(query?: GetBookingsDto): Observable<Booking[]> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.getProviderBookings(query).pipe(
      tap(bookings => {
        this.bookingState.setBookings(bookings);
        this.bookingState.setLoading(false);
      }),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to fetch provider bookings');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get guest bookings by email
   */
  getGuestBookings(email: string, verificationToken: string): Observable<Booking[]> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.getGuestBookings(email, verificationToken).pipe(
      tap(bookings => {
        this.bookingState.setBookings(bookings);
        this.bookingState.setLoading(false);
      }),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to fetch guest bookings');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify booking by serial key
   */
  verifyBooking(serialKey: string): Observable<Booking> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.verifyBookingBySerialKey(serialKey).pipe(
      tap(booking => {
        this.bookingState.setSelectedBooking(booking);
        this.bookingState.setLoading(false);
      }),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to verify booking');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get booking QR code
   */
  getBookingQRCode(serialKey: string): Observable<string> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.getBookingQRCode(serialKey).pipe(
      map(response => response.qrCode),
      tap(() => this.bookingState.setLoading(false)),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to fetch QR code');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh provider bookings
   */
  refreshProviderBookings(query?: GetBookingsDto): Observable<Booking[]> {
    return this.getProviderBookings(query);
  }

  /**
   * Clear all bookings from state
   */
  clearBookings(): void {
    this.bookingState.clearBookings();
  }

  /**
   * Reset booking state
   */
  resetState(): void {
    this.bookingState.reset();
  }

  /**
   * Request cancellation - sends verification code to email
   */
  requestCancellation(bookingId: string, guestEmail: string, serialKey?: string): Observable<{ message: string }> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.requestCancellation(bookingId, guestEmail, serialKey).pipe(
      tap(() => this.bookingState.setLoading(false)),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to request cancellation');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify cancellation code and cancel booking
   */
  verifyCancellation(bookingId: string, guestEmail: string, verificationCode: string): Observable<{ message: string; booking: Booking }> {
    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.verifyCancellation(bookingId, guestEmail, verificationCode).pipe(
      tap(response => {
        // Update the booking in state
        this.bookingState.updateBooking(response.booking);
        this.bookingState.setLoading(false);
      }),
      catchError(error => {
        this.bookingState.setError(error.error?.message || 'Failed to verify cancellation');
        this.bookingState.setLoading(false);
        return throwError(() => error);
      })
    );
  }
}
