import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
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
  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private bookingApi: BookingApiService,
    private bookingState: BookingStateService
  ) {}

  /**
   * Create a new booking
   */
  createBooking(bookingData: CreateBookingDto): Observable<Booking | Booking[]> {
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 [BookingOperationsService] createBooking() called');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 [BookingOperationsService] Booking data received:', {
      providerId: bookingData.providerId,
      availabilityId: bookingData.availabilityId,
      guestName: bookingData.guestName,
      guestEmail: bookingData.guestEmail,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      notes: bookingData.notes
    });

    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.createBooking(bookingData).pipe(
      tap(result => {
        console.log('🔄 [BookingOperationsService] API response received:', result);

        // Handle both single booking and array of bookings
        if (Array.isArray(result)) {
          console.log(`📦 [BookingOperationsService] Multiple bookings created (${result.length} bookings)`);
          result.forEach((booking, index) => {
            console.log(`   Booking ${index + 1}:`, {
              id: booking.id,
              status: booking.status,
              serialKey: booking.serialKey
            });
          });
          this.bookingState.addBookings(result);
        } else {
          console.log('📦 [BookingOperationsService] Single booking created:', {
            id: result.id,
            status: result.status,
            serialKey: result.serialKey,
            providerId: result.providerId
          });
          this.bookingState.addBooking(result);
        }
        this.bookingState.setLoading(false);
        console.log('✅ [BookingOperationsService] Booking creation completed successfully');
      }),
      catchError(error => {
        console.error('❌ [BookingOperationsService] Booking creation failed:', {
          error: error.error,
          status: error.status,
          message: error.message,
          url: error.url
        });
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
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 [BookingOperationsService] getProviderBookings() called');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 [BookingOperationsService] Query parameters:', query);

    this.bookingState.setLoading(true);
    this.bookingState.clearError();

    return this.bookingApi.getProviderBookings(query).pipe(
      tap(bookings => {
        console.log(`📦 [BookingOperationsService] Retrieved ${bookings.length} bookings`);
        console.log('📈 [BookingOperationsService] Booking statuses:', bookings.reduce((acc, booking) => {
          acc[booking.status] = (acc[booking.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>));
        this.bookingState.setBookings(bookings);
        this.bookingState.setLoading(false);
      }),
      catchError(error => {
        console.error('❌ [BookingOperationsService] Failed to fetch provider bookings:', {
          error: error.error,
          status: error.status,
          message: error.message,
          url: error.url
        });
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

  providerApproveBooking(bookingId: string): Observable<Booking> {
    return this.http.patch<{ message: string; booking: Booking }>(`${this.API_URL}/dashboard/bookings/${bookingId}/approve`, {}).pipe(
      map(response => response.booking),
      tap(booking => this.bookingState.updateBooking(booking))
    );
  }

  providerDeclineBooking(bookingId: string): Observable<Booking> {
    return this.http.patch<{ message: string; booking: Booking }>(`${this.API_URL}/dashboard/bookings/${bookingId}/decline`, {}).pipe(
      map(response => response.booking),
      tap(booking => this.bookingState.updateBooking(booking))
    );
  }

  providerCompleteBooking(bookingId: string, reason?: string): Observable<Booking> {
    console.error(`🔍 [BookingOperationsService] providerCompleteBooking called: bookingId=${bookingId}, reason=${reason}`);
    console.error(`🔍 [BookingOperationsService] API URL: ${this.API_URL}/dashboard/bookings/${bookingId}/complete`);
    
    return this.http.patch<{ message: string; booking: Booking }>(`${this.API_URL}/dashboard/bookings/${bookingId}/complete`, { reason }).pipe(
      tap(response => {
        console.error(`✅ [BookingOperationsService] providerCompleteBooking SUCCESS:`, response);
      }),
      map(response => response.booking),
      tap(booking => {
        console.error(`📋 [BookingOperationsService] updating booking state:`, booking);
        this.bookingState.updateBooking(booking);
      }),
      catchError(error => {
        console.error(`❌ [BookingOperationsService] providerCompleteBooking ERROR:`, {
          bookingId,
          reason,
          error: error.error,
          status: error.status,
          url: error.url
        });
        return throwError(() => error);
      })
    );
  }

  providerCancelBooking(bookingId: string): Observable<Booking> {
    return this.http.patch<{ message: string; booking: Booking }>(`${this.API_URL}/dashboard/bookings/${bookingId}/cancel`, {}).pipe(
      map(response => response.booking),
      tap(booking => this.bookingState.updateBooking(booking))
    );
  }
}
