import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AnalyticsData, AnalyticsRequest, ReportData } from '../models/analytics.models';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly API_URL = `${environment.apiUrl}/analytics`;
  
  constructor(private http: HttpClient) { }
  
  getAnalyticsData(request: AnalyticsRequest): Observable<AnalyticsData> {
    console.log('🌐 [AnalyticsService] Making GET request to analytics endpoint', {
      url: this.API_URL,
      params: {
        startDate: request.dateRange.startDate.toISOString(),
        endDate: request.dateRange.endDate.toISOString()
      }
    });
    
    // Convert dates to ISO strings for the API
    const params = {
      startDate: request.dateRange.startDate.toISOString(),
      endDate: request.dateRange.endDate.toISOString()
    };
    
    return this.http.get<AnalyticsData>(this.API_URL, { params }).pipe(
      // Log the response
      tap({
        next: (data) => console.log('✅ [AnalyticsService] Analytics data received', { 
          dataLength: JSON.stringify(data).length,
          metrics: data.metrics
        }),
        error: (error) => console.error('❌ [AnalyticsService] Error fetching analytics data', error)
      })
    );
  }
  
  generateReport(request: AnalyticsRequest, type: 'pdf' | 'csv'): Observable<ReportData> {
    console.log('🌐 [AnalyticsService] Making GET request to report endpoint', {
      url: `${this.API_URL}/report`,
      params: {
        startDate: request.dateRange.startDate.toISOString(),
        endDate: request.dateRange.endDate.toISOString(),
        reportType: type
      }
    });
    
    // Convert dates to ISO strings for the API
    const params = {
      startDate: request.dateRange.startDate.toISOString(),
      endDate: request.dateRange.endDate.toISOString(),
      reportType: type
    };
    
    return this.http.get<ReportData>(`${this.API_URL}/report`, { params }).pipe(
      // Log the response
      tap({
        next: (report) => console.log('✅ [AnalyticsService] Report generated', { 
          reportType: report.type,
          dataLength: report.data?.length
        }),
        error: (error) => console.error('❌ [AnalyticsService] Error generating report', error)
      })
    );
  }
  

}