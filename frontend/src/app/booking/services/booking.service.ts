import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Booking, CreateBookingRequest, BookingResponse, BookingStatus } from '../models/booking.models';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  // In a real implementation, these methods would make HTTP requests to the backend API
  
  createBooking(booking: CreateBookingRequest): Observable<BookingResponse> {
    // Simulate API call
    const newBooking: Booking = {
      id: '1',
      providerId: booking.providerId,
      customerId: booking.customerId,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      service: booking.service,
      duration: booking.duration,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: BookingStatus.Confirmed,
      notes: booking.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return of({
      booking: newBooking,
      success: true
    });
  }
  
  getBookingById(id: string): Observable<Booking> {
    // Simulate API call
    const booking: Booking = {
      id: '1',
      providerId: 'provider-123',
      customerId: 'customer-456',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '123-456-7890',
      service: 'Consultation',
      duration: 30,
      startTime: new Date(),
      endTime: new Date(),
      status: BookingStatus.Confirmed,
      notes: 'Please bring your documents',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return of(booking);
  }
}