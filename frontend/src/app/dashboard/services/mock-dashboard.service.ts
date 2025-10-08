import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DashboardStats, Activity } from '../models/dashboard.models';
import { Booking, BookingStatus } from '../../shared/models/booking.models';
import { Availability } from '../models/availability.models';

@Injectable({
  providedIn: 'root'
})
export class MockDashboardService {
  constructor() { }

  getStats(): Observable<DashboardStats> {
    const mockStats: DashboardStats = {
      totalBookings: 24,
      revenue: 1240,
      upcomingBookings: 8,
      occupancy: 65,
      bookingChange: '+12%',
      revenueChange: '+8%',
      upcomingChange: '+3',
      occupancyChange: '+5%'
    };
    
    return of(mockStats).pipe(delay(500));
  }

  getRecentActivity(): Observable<Activity[]> {
    const mockActivity: Activity[] = [
      {
        id: '1',
        description: 'John Doe booked a 30-minute session',
        time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'booking'
      },
      {
        id: '2',
        description: 'Jane Smith cancelled their appointment',
        time: new Date(Date.now() - 5 * 60 * 60 * 1000),
        type: 'cancellation'
      },
      {
        id: '3',
        description: 'You updated your availability for next week',
        time: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: 'update'
      }
    ];
    
    return of(mockActivity).pipe(delay(500));
  }

  getBookings(params: any): Observable<Booking[]> {
    const mockBookings: Booking[] = [
      {
        id: '1',
        providerId: 'provider-123',
        availabilityId: 'avail-1',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '+1234567890',
        duration: 30,
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
        status: BookingStatus.CONFIRMED,
        notes: 'Consultation appointment',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        providerId: 'provider-123',
        availabilityId: 'avail-2',
        guestName: 'Jane Smith',
        guestEmail: 'jane@example.com',
        guestPhone: '+0987654321',
        duration: 60,
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        status: BookingStatus.CONFIRMED,
        notes: 'Follow-up appointment',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    return of(mockBookings).pipe(delay(500));
  }

  getAvailability(providerId: string, date: Date): Observable<Availability[]> {
    const mockAvailability: Availability[] = [
      {
        id: '1',
        providerId: providerId,
        type: 'one_off',
        date: new Date(),
        startTime: new Date(new Date().setHours(9, 0, 0, 0)),
        endTime: new Date(new Date().setHours(10, 0, 0, 0)),
        isBooked: false,
        duration: 60
      },
      {
        id: '2',
        providerId: providerId,
        type: 'one_off',
        date: new Date(),
        startTime: new Date(new Date().setHours(11, 0, 0, 0)),
        endTime: new Date(new Date().setHours(11, 30, 0, 0)),
        isBooked: true,
        bookingId: 'booking-123',
        duration: 30
      },
      {
        id: '3',
        providerId: providerId,
        type: 'recurring',
        date: new Date(),
        startTime: new Date(new Date().setHours(14, 0, 0, 0)),
        endTime: new Date(new Date().setHours(15, 0, 0, 0)),
        isBooked: false,
        duration: 60
      }
    ];
    
    return of(mockAvailability).pipe(delay(500));
  }
}