import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BookingOperationsService } from './booking-operations.service';
import { BookingStateService } from './booking-state.service';
import { 
  Booking, 
  CreateBookingDto, 
  UpdateBookingDto, 
  GetBookingsDto,
  BookingStatus 
} from '../../models/booking.models';

/**
 * Facade service that provides a simplified API for booking operations
 * This is the main service that components should inject
 */
@Injectable({
  providedIn: 'root'
})
export class BookingFacadeService {
  // Expose state observables
  public readonly bookings$: Observable<Booking[]>;
  public readonly selectedBooking$: Observable<Booking | null>;
  public readonly loading$: Observable<boolean>;
  public readonly error$: Observable<string | null>;

  constructor(
    private bookingOperations: BookingOperationsService,
    private bookingState: BookingStateService
  ) {
    this.bookings$ = this.bookingState.bookings$;
    this.selectedBooking$ = this.bookingState.selectedBooking$;
    this.loading$ = this.bookingState.loading$;
    this.error$ = this.bookingState.error$;
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a new booking
   */
  createBooking(bookingData: CreateBookingDto): Observable<Booking | Booking[]> {
    return this.bookingOperations.createBooking(bookingData);
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Get booking by ID
   */
  getBookingById(id: string): Observable<Booking> {
    return this.bookingOperations.getBookingById(id);
  }

  /**
   * Get all provider bookings
   */
  getProviderBookings(query?: GetBookingsDto): Observable<Booking[]> {
    return this.bookingOperations.getProviderBookings(query);
  }

  /**
   * Get guest bookings by email
   */
  getGuestBookings(email: string, verificationToken: string): Observable<Booking[]> {
    return this.bookingOperations.getGuestBookings(email, verificationToken);
  }

  /**
   * Verify booking by serial key
   */
  verifyBooking(serialKey: string): Observable<Booking> {
    return this.bookingOperations.verifyBooking(serialKey);
  }

  /**
   * Get booking QR code
   */
  getBookingQRCode(serialKey: string): Observable<string> {
    return this.bookingOperations.getBookingQRCode(serialKey);
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update a booking
   */
  updateBooking(id: string, updateData: UpdateBookingDto): Observable<Booking> {
    return this.bookingOperations.updateBooking(id, updateData);
  }

  /**
   * Cancel a booking
   */
  cancelBooking(id: string, guestEmail: string): Observable<Booking> {
    return this.bookingOperations.cancelBooking(id, guestEmail);
  }

  /**
   * Confirm a booking
   */
  confirmBooking(id: string): Observable<Booking> {
    return this.bookingOperations.confirmBooking(id);
  }

  /**
   * Mark booking as completed
   */
  completeBooking(id: string): Observable<Booking> {
    return this.bookingOperations.completeBooking(id);
  }

  // ==================== STATE MANAGEMENT ====================

  /**
   * Get current bookings from state
   */
  getCurrentBookings(): Booking[] {
    return this.bookingState.getBookings();
  }

  /**
   * Get selected booking from state
   */
  getSelectedBooking(): Booking | null {
    return this.bookingState.getSelectedBooking();
  }

  /**
   * Set selected booking
   */
  setSelectedBooking(booking: Booking | null): void {
    this.bookingState.setSelectedBooking(booking);
  }

  /**
   * Filter bookings by status
   */
  filterByStatus(status: BookingStatus): Booking[] {
    return this.bookingState.filterByStatus(status);
  }

  /**
   * Get bookings count by status
   */
  getCountByStatus(status: BookingStatus): number {
    return this.bookingState.getCountByStatus(status);
  }

  /**
   * Get total bookings count
   */
  getTotalCount(): number {
    return this.bookingState.getTotalCount();
  }

  /**
   * Refresh provider bookings
   */
  refreshProviderBookings(query?: GetBookingsDto): Observable<Booking[]> {
    return this.bookingOperations.refreshProviderBookings(query);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.bookingState.clearError();
  }

  /**
   * Clear all bookings
   */
  clearBookings(): void {
    this.bookingOperations.clearBookings();
  }

  /**
   * Reset all booking state
   */
  resetState(): void {
    this.bookingOperations.resetState();
  }

  // ==================== CANCELLATION OPERATIONS ====================

  /**
   * Request cancellation - sends verification code to email
   */
  requestCancellation(bookingId: string, guestEmail: string, serialKey?: string): Observable<{ message: string }> {
    return this.bookingOperations.requestCancellation(bookingId, guestEmail, serialKey);
  }

  /**
   * Verify cancellation code and cancel booking
   */
  verifyCancellation(bookingId: string, guestEmail: string, verificationCode: string): Observable<{ message: string; booking: Booking }> {
    return this.bookingOperations.verifyCancellation(bookingId, guestEmail, verificationCode);
  }
}
