import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Booking, BookingStatus } from '../../models/booking.models';

/**
 * State management service for bookings
 * Manages booking state and provides reactive updates
 */
@Injectable({
  providedIn: 'root'
})
export class BookingStateService {
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  private selectedBookingSubject = new BehaviorSubject<Booking | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public readonly bookings$ = this.bookingsSubject.asObservable();
  public readonly selectedBooking$ = this.selectedBookingSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  constructor() {}

  /**
   * Set the list of bookings
   */
  setBookings(bookings: Booking[]): void {
    this.bookingsSubject.next(bookings);
  }

  /**
   * Get current bookings value
   */
  getBookings(): Booking[] {
    return this.bookingsSubject.value;
  }

  /**
   * Add a new booking to the list
   */
  addBooking(booking: Booking): void {
    const currentBookings = this.bookingsSubject.value;
    this.bookingsSubject.next([...currentBookings, booking]);
  }

  /**
   * Add multiple bookings to the list
   */
  addBookings(bookings: Booking[]): void {
    const currentBookings = this.bookingsSubject.value;
    this.bookingsSubject.next([...currentBookings, ...bookings]);
  }

  /**
   * Update a booking in the list
   */
  updateBooking(updatedBooking: Booking): void {
    const currentBookings = this.bookingsSubject.value;
    const index = currentBookings.findIndex(b => 
      (b._id && b._id === updatedBooking._id) || (b.id && b.id === updatedBooking.id)
    );
    
    if (index !== -1) {
      const newBookings = [...currentBookings];
      newBookings[index] = updatedBooking;
      this.bookingsSubject.next(newBookings);
    }
  }

  /**
   * Remove a booking from the list
   */
  removeBooking(bookingId: string): void {
    const currentBookings = this.bookingsSubject.value;
    this.bookingsSubject.next(
      currentBookings.filter(b => b._id !== bookingId && b.id !== bookingId)
    );
  }

  /**
   * Set the selected booking
   */
  setSelectedBooking(booking: Booking | null): void {
    this.selectedBookingSubject.next(booking);
  }

  /**
   * Get current selected booking value
   */
  getSelectedBooking(): Booking | null {
    return this.selectedBookingSubject.value;
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Clear all bookings
   */
  clearBookings(): void {
    this.bookingsSubject.next([]);
  }

  /**
   * Filter bookings by status
   */
  filterByStatus(status: BookingStatus): Booking[] {
    return this.bookingsSubject.value.filter(b => b.status === status);
  }

  /**
   * Get bookings count by status
   */
  getCountByStatus(status: BookingStatus): number {
    return this.filterByStatus(status).length;
  }

  /**
   * Get total bookings count
   */
  getTotalCount(): number {
    return this.bookingsSubject.value.length;
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.bookingsSubject.next([]);
    this.selectedBookingSubject.next(null);
    this.loadingSubject.next(false);
    this.errorSubject.next(null);
  }
}
