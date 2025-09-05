import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats, Activity } from '../models/dashboard.models';
import { Booking } from '../models/booking.models';
import { Availability, DateRange, Metrics } from '../models/availability.models';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.API_URL}/stats`);
  }

  getRecentActivity(): Observable<Activity[]> {
    return this.http.get<Activity[]>(`${this.API_URL}/activity`);
  }

  getBookings(params: any): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.API_URL}/bookings`, { params });
  }

  getAvailability(providerId: string, date: Date): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.API_URL}/availability/${providerId}`, {
      params: { date: date.toISOString() }
    });
  }

  getMetrics(period: DateRange): Observable<Metrics> {
    return this.http.post<Metrics>(`${this.API_URL}/metrics`, period);
  }
}