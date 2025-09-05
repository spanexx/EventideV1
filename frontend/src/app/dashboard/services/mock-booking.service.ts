import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Booking, BookingStatus } from '../models/booking.models';

@Injectable({
  providedIn: 'root'
})
export class MockBookingService {
  private bookings: Booking[] = [
    {
      id: '1',
      providerId: 'provider-123',
      customerId: 'customer-1',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      service: 'Consultation',
      duration: 30,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      providerId: 'provider-123',
      customerId: 'customer-2',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      service: 'Follow-up',
      duration: 60,
      startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      providerId: 'provider-123',
      customerId: 'customer-3',
      customerName: 'Bob Johnson',
      customerEmail: 'bob@example.com',
      service: 'Initial Assessment',
      duration: 90,
      startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      status: BookingStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  getBookings(): Observable<Booking[]> {
    return of(this.bookings).pipe(delay(500));
  }

  getBookingById(id: string): Observable<Booking | undefined> {
    const booking = this.bookings.find(b => b.id === id);
    return of(booking).pipe(delay(300));
  }

  updateBookingStatus(id: string, status: BookingStatus): Observable<Booking> {
    const bookingIndex = this.bookings.findIndex(b => b.id === id);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].status = status;
      this.bookings[bookingIndex].updatedAt = new Date();
      return of(this.bookings[bookingIndex]).pipe(delay(300));
    }
    throw new Error('Booking not found');
  }

  cancelBooking(id: string): Observable<boolean> {
    const bookingIndex = this.bookings.findIndex(b => b.id === id);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex].status = BookingStatus.CANCELLED;
      this.bookings[bookingIndex].updatedAt = new Date();
      return of(true).pipe(delay(300));
    }
    return of(false).pipe(delay(300));
  }

  createBooking(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Observable<Booking> {
    const newBooking: Booking = {
      ...booking,
      id: `${this.bookings.length + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.bookings.push(newBooking);
    return of(newBooking).pipe(delay(500));
  }

  updateBooking(id: string, booking: Partial<Booking>): Observable<Booking> {
    const bookingIndex = this.bookings.findIndex(b => b.id === id);
    if (bookingIndex !== -1) {
      this.bookings[bookingIndex] = {
        ...this.bookings[bookingIndex],
        ...booking,
        updatedAt: new Date()
      };
      return of(this.bookings[bookingIndex]).pipe(delay(300));
    }
    throw new Error('Booking not found');
  }
}