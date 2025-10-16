import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
  Booking, 
  CreateBookingDto, 
  UpdateBookingDto, 
  GetBookingsDto,
  BookingQRCode 
} from '../../models/booking.models';

/**
 * Core API service for booking operations
 * Handles all HTTP requests to the booking endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class BookingApiService {
  private readonly API_URL = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  /**
   * Create a new booking (Public endpoint)
   * @param booking Booking data
   * @returns Created booking or array of bookings
   */
  createBooking(booking: CreateBookingDto): Observable<Booking | Booking[]> {
    return this.http.post<Booking | Booking[]>(this.API_URL, booking);
  }

  /**
   * Get a specific booking by ID (Public endpoint)
   * @param id Booking ID
   * @returns Booking details
   */
  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/${id}`);
  }

  /**
   * Update a booking (Public endpoint with email validation for cancellations)
   * @param id Booking ID
   * @param updateData Update data
   * @returns Updated booking
   */
  updateBooking(id: string, updateData: UpdateBookingDto): Observable<Booking> {
    return this.http.patch<Booking>(`${this.API_URL}/${id}`, updateData);
  }

  /**
   * Get all bookings for a provider (Requires authentication)
   * @param query Query parameters
   * @returns List of bookings
   */
  getProviderBookings(query?: GetBookingsDto): Observable<Booking[]> {
    let params = new HttpParams();
    
    if (query) {
      if (query.status) params = params.set('status', query.status);
      if (query.startDate) params = params.set('startDate', query.startDate);
      if (query.endDate) params = params.set('endDate', query.endDate);
    }

    return this.http.get<Booking[]>(`${this.API_URL}/provider`, { params });
  }

  /**
   * Get bookings for a guest by email (Public endpoint with verification)
   * @param email Guest email
   * @param verificationToken Verification token
   * @returns List of guest bookings
   */
  getGuestBookings(email: string, verificationToken: string): Observable<Booking[]> {
    const params = new HttpParams().set('verificationToken', verificationToken);
    return this.http.get<Booking[]>(`${this.API_URL}/guest/${email}`, { params });
  }

  /**
   * Verify a booking by serial key (Public endpoint)
   * @param serialKey Booking serial key
   * @returns Booking details
   */
  verifyBookingBySerialKey(serialKey: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/verify/${serialKey}`);
  }

  /**
   * Get QR code for a booking (Public endpoint)
   * @param serialKey Booking serial key
   * @returns QR code data URL
   */
  getBookingQRCode(serialKey: string): Observable<BookingQRCode> {
    return this.http.get<BookingQRCode>(`${this.API_URL}/qr/${serialKey}`);
  }

  /**
   * Request booking cancellation - sends verification code to email (Public endpoint)
   * @param bookingId Booking ID
   * @param guestEmail Guest email address
   * @param serialKey Optional serial key for additional verification
   * @returns Success message
   */
  requestCancellation(bookingId: string, guestEmail: string, serialKey?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/cancel/request`, {
      bookingId,
      guestEmail,
      serialKey
    });
  }

  /**
   * Verify cancellation code and cancel booking (Public endpoint)
   * @param bookingId Booking ID
   * @param guestEmail Guest email address
   * @param verificationCode 6-digit verification code
   * @returns Success message and updated booking
   */
  verifyCancellation(
    bookingId: string, 
    guestEmail: string, 
    verificationCode: string
  ): Observable<{ message: string; booking: Booking }> {
    return this.http.post<{ message: string; booking: Booking }>(`${this.API_URL}/cancel/verify`, {
      bookingId,
      guestEmail,
      verificationCode
    });
  }

  /**
   * Provider cancels a booking (Requires authentication, no guest email needed)
   * @param id Booking ID
   * @returns Updated booking
   */
  providerCancelBooking(id: string): Observable<Booking> {
    console.log('[BookingApiService] providerCancelBooking', { id });
    return this.http.patch<Booking>(`${this.API_URL}/provider/${id}/cancel`, {});
  }

  /**
   * Provider approved a pending booking
   */
  providerApproveBooking(id: string): Observable<Booking> {
    console.log('[BookingApiService] providerApproveBooking', { id });
    return this.http.patch<Booking>(`${this.API_URL}/provider/${id}/approve`, {});
  }

  /**
   * Provider declines a pending booking
   */
  providerDeclineBooking(id: string): Observable<Booking> {
    console.log('[BookingApiService] providerDeclineBooking', { id });
    return this.http.patch<Booking>(`${this.API_URL}/provider/${id}/decline`, {});
  }
}
