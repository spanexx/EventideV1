import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Metrics, DateRange } from '../models/availability.models';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly API_URL = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) { }

  getMetrics(period: DateRange): Observable<Metrics> {
    return this.http.post<Metrics>(`${this.API_URL}/metrics`, period);
  }

  getRevenueReport(period: DateRange): Observable<any> {
    return this.http.post(`${this.API_URL}/revenue`, period);
  }

  getBookingTrends(period: DateRange): Observable<any> {
    return this.http.post(`${this.API_URL}/trends`, period);
  }
}