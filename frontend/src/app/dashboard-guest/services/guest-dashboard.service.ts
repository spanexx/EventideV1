import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Booking, BookingStatus } from '../models/booking.models';
import { GuestInfo, GuestPreferences } from '../models/guest.models';

@Injectable({
  providedIn: 'root'
})
export class GuestDashboardService {
  private readonly API_URL = `${environment.apiUrl}/guest`;

  constructor(private http: HttpClient) {}

  /**
   * Get booking history for the authenticated guest
   */
  getBookingHistory(): Observable<Booking[]> {
    // In a real implementation, this would make an HTTP request
    // return this.http.get<Booking[]>(`${this.API_URL}/bookings`);
    
    // For now, returning mock data
    return of([
      {
        id: '1',
        providerId: 'provider-1',
        providerName: 'Hair Salon',
        service: 'Haircut',
        date: new Date(),
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 3600000), // 1 hour later
        duration: 60,
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        providerId: 'provider-2',
        providerName: 'Spa Center',
        service: 'Massage',
        date: new Date(Date.now() + 86400000), // 1 day later
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 86400000 + 3600000), // 1 hour later
        duration: 60,
        status: BookingStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]).pipe(
      catchError(this.handleError<Booking[]>('getBookingHistory', []))
    );
  }

  /**
   * Get a specific booking by ID
   */
  getBookingById(id: string): Observable<Booking | null> {
    // In a real implementation, this would make an HTTP request
    // return this.http.get<Booking>(`${this.API_URL}/bookings/${id}`);
    
    // For now, returning mock data
    return of({
      id: id,
      providerId: 'provider-1',
      providerName: 'Hair Salon',
      service: 'Haircut',
      date: new Date(),
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 3600000), // 1 hour later
      duration: 60,
      status: BookingStatus.CONFIRMED,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Booking).pipe(
      catchError(this.handleError<Booking | null>('getBookingById', null))
    );
  }

  /**
   * Cancel a booking
   */
  cancelBooking(id: string): Observable<boolean> {
    // In a real implementation, this would make an HTTP request
    // return this.http.post<boolean>(`${this.API_URL}/bookings/${id}/cancel`, {});
    
    // For now, returning mock success
    return of(true).pipe(
      catchError(this.handleError<boolean>('cancelBooking', false))
    );
  }

  /**
   * Get guest profile information
   */
  getProfile(): Observable<GuestInfo | null> {
    // In a real implementation, this would make an HTTP request
    // return this.http.get<GuestInfo>(`${this.API_URL}/profile`);
    
    // For now, returning mock data
    return of({
      id: 'guest-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    }).pipe(
      catchError(this.handleError<GuestInfo | null>('getProfile', null))
    );
  }

  /**
   * Update guest profile information
   */
  updateProfile(profile: GuestInfo): Observable<GuestInfo> {
    // In a real implementation, this would make an HTTP request
    // return this.http.put<GuestInfo>(`${this.API_URL}/profile`, profile);
    
    // For now, returning the same profile
    return of(profile).pipe(
      catchError(this.handleError<GuestInfo>('updateProfile'))
    );
  }

  /**
   * Update guest preferences
   */
  updatePreferences(preferences: GuestPreferences): Observable<GuestPreferences> {
    // In a real implementation, this would make an HTTP request
    // return this.http.put<GuestPreferences>(`${this.API_URL}/preferences`, preferences);
    
    // For now, returning the same preferences
    return of(preferences).pipe(
      catchError(this.handleError<GuestPreferences>('updatePreferences'))
    );
  }

  /**
   * Handle HTTP operation that failed
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      
      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);
      
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}