import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, shareReplay, catchError } from 'rxjs/operators';
import { AnalyticsData, AnalyticsRequest, ReportData } from '../models/analytics.models';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly API_URL = `${environment.apiUrl}/analytics`;
  private analyticsCache = new Map<string, Observable<AnalyticsData>>();
  private reportCache = new Map<string, Observable<ReportData>>();

  constructor(private http: HttpClient) { }

  getAnalyticsData(request: AnalyticsRequest): Observable<AnalyticsData> {
    const cacheKey = `${request.providerId}-${request.dateRange.startDate.toISOString()}-${request.dateRange.endDate.toISOString()}`;

    if (!this.analyticsCache.has(cacheKey)) {
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

      this.analyticsCache.set(cacheKey,
        this.http.get<AnalyticsData>(this.API_URL, { params }).pipe(
          // Log the response
          tap({
            next: (data) => console.log('✅ [AnalyticsService] Analytics data received', {
              dataLength: JSON.stringify(data).length,
              metrics: data.metrics
            }),
            error: (error) => console.error('❌ [AnalyticsService] Error fetching analytics data', error)
          }),
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(error => {
            console.error('❌ [AnalyticsService] Error fetching analytics data', error);
            // Clear cache on error
            this.analyticsCache.delete(cacheKey);
            throw error;
          })
        )
      );
    }

    return this.analyticsCache.get(cacheKey)!;
  }

  generateReport(request: AnalyticsRequest, type: 'pdf' | 'csv'): Observable<ReportData> {
    const cacheKey = `${request.providerId}-${request.dateRange.startDate.toISOString()}-${request.dateRange.endDate.toISOString()}-${type}`;

    if (!this.reportCache.has(cacheKey)) {
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

      this.reportCache.set(cacheKey,
        this.http.get<ReportData>(`${this.API_URL}/report`, { params }).pipe(
          // Log the response
          tap({
            next: (report) => console.log('✅ [AnalyticsService] Report generated', {
              reportType: report.type,
              dataLength: report.data?.length
            }),
            error: (error) => console.error('❌ [AnalyticsService] Error generating report', error)
          }),
          shareReplay({ bufferSize: 1, refCount: true }),
          catchError(error => {
            console.error('❌ [AnalyticsService] Error generating report', error);
            // Clear cache on error
            this.reportCache.delete(cacheKey);
            throw error;
          })
        )
      );
    }

    return this.reportCache.get(cacheKey)!;
  }

  // Clear caches when data changes
  clearAnalyticsCache(): void {
    this.analyticsCache.clear();
    console.log('🧹 [AnalyticsService] Analytics cache cleared');
  }

  clearReportCache(): void {
    this.reportCache.clear();
    console.log('🧹 [AnalyticsService] Report cache cleared');
  }
  

}