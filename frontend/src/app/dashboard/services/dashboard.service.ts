import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { first, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DashboardStats, Activity } from '../models/dashboard.models';
import { Booking } from '../models/booking.models';
import { Availability, DateRange, Metrics } from '../models/availability.models';
import { selectProviderId } from '../../auth/store/auth/selectors/auth.selectors';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient, private store: Store) { }

  getStats(): Observable<DashboardStats> {
    return this.store.select(selectProviderId).pipe(
      first(),
      switchMap(providerId => {
        console.log('📊 [DashboardService] getStats()', { providerId });
        return this.http.get<DashboardStats>(`${this.API_URL}/stats`, {
          params: { providerId }
        });
      })
    );
  }

  getRecentActivity(): Observable<Activity[]> {
    return this.store.select(selectProviderId).pipe(
      first(),
      switchMap(providerId => {
        console.log('📰 [DashboardService] getRecentActivity()', { providerId });
        return this.http.get<Activity[]>(`${this.API_URL}/activity`, {
          params: { providerId }
        });
      })
    );
  }

  getBookings(params: any): Observable<Booking[]> {
    console.log('[DashboardService] getBookings', { params });
    return this.http.get<Booking[]>(`${environment.apiUrl}/bookings/provider`, { params });
  }

  getAvailability(providerId: string, date: Date): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.API_URL}/availability/${providerId}`, {
      params: { date: date.toISOString() }
    });
  }

  getMetrics(period: DateRange): Observable<Metrics> {
    return this.http.post<Metrics>(`${this.API_URL}/metrics`, period);
  }

  approveBooking(bookingId: string): Observable<{ message: string; booking: Booking }> {
    return this.http.patch<{ message: string; booking: Booking }>(`${this.API_URL}/bookings/${bookingId}/approve`, {});
  }

  declineBooking(bookingId: string): Observable<{ message: string; booking: Booking }> {
    return this.http.patch<{ message: string; booking: Booking }>(`${this.API_URL}/bookings/${bookingId}/decline`, {});
  }

  completeBooking(bookingId: string, reason?: string): Observable<{ message: string; booking: Booking }> {
    return this.http.patch<{ message: string; booking: Booking }>(`${this.API_URL}/bookings/${bookingId}/complete`, { reason });
  }

  cancelBooking(bookingId: string): Observable<{ message: string; booking: Booking }> {
    return this.http.patch<{ message: string; booking: Booking }>(`${this.API_URL}/bookings/${bookingId}/cancel`, {});
  }
}