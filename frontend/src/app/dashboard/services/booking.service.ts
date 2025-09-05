import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Booking, BookingStatus } from '../models/booking.models';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly API_URL = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) { }

  getBookings(params: any): Observable<Booking[]> {
    return this.http.get<Booking[]>(this.API_URL, { params });
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.API_URL}/${id}`);
  }

  updateBookingStatus(id: string, status: BookingStatus): Observable<Booking> {
    return this.http.patch<Booking>(`${this.API_URL}/${id}/status`, { status });
  }

  cancelBooking(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  updateBooking(id: string, booking: Partial<Booking>): Observable<Booking> {
    return this.http.put<Booking>(`${this.API_URL}/${id}`, booking);
  }

  createBooking(booking: Partial<Booking>): Observable<Booking> {
    return this.http.post<Booking>(this.API_URL, booking);
  }
}