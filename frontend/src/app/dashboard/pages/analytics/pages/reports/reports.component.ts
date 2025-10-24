import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import * as AnalyticsActions from '../../store/actions/analytics.actions';
import * as AnalyticsSelectors from '../../store/selectors/analytics.selectors';
import * as AuthSelectors from '../../../../../auth/store/auth/selectors/auth.selectors';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule
  ]
})
export class ReportsComponent implements OnInit, OnDestroy {
  reportType: 'pdf' | 'csv' = 'pdf';
  startDate = new Date();
  endDate = new Date();
  
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  report$!: Observable<any>;
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private store: Store,
    private analyticsService: AnalyticsService
  ) {
    // Set default date range to last 30 days
    this.startDate.setDate(this.endDate.getDate() - 30);
    
    // Initialize observables after store is injected
    this.loading$ = this.store.select(AnalyticsSelectors.selectAnalyticsLoading);
    this.error$ = this.store.select(AnalyticsSelectors.selectAnalyticsError);
    this.report$ = this.store.select(AnalyticsSelectors.selectReport);
  }
  
  ngOnInit(): void {
    console.log('📈 [ReportsComponent] Initializing reports component');
    
    // Listen for error updates to show notifications
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((error: string | null) => {
      if (error) {
        // In a real implementation, we would show a snackbar notification
        console.error('Report generation error:', error);
        // Log to backend browser logs
        this.logToBackend('error', 'Report generation error:', error);
      }
    });
    
    console.log('✅ [ReportsComponent] Reports component initialized successfully');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  generateReport(): void {
    console.log('🔄 [ReportsComponent] Generating report', {
      reportType: this.reportType,
      startDate: this.startDate,
      endDate: this.endDate
    });

    // Clear report cache when generating new report to ensure fresh data
    this.analyticsService.clearReportCache();

    // Get the current user and generate report for that user
    console.log('🔍 [ReportsComponent] Subscribing to userId selector');
    this.store.select(AuthSelectors.selectUserId).pipe(
      filter(userId => {
        console.log('🔍 [ReportsComponent] UserId from store:', userId, 'Type:', typeof userId);
        return !!userId && userId !== '';
      }),
      take(1),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (userId) => {
        console.log('👤 [ReportsComponent] Dispatching generate report for user', { userId, reportType: this.reportType });
        this.logToBackend('info', 'ReportsComponent: Generating report', {
          userId,
          reportType: this.reportType,
          startDate: this.startDate,
          endDate: this.endDate
        });
        
        this.store.dispatch(AnalyticsActions.generateReport({
          request: {
            providerId: userId,
            dateRange: {
              startDate: this.startDate,
              endDate: this.endDate
            }
          },
          reportType: this.reportType
        }));
      },
      error: (error) => {
        console.error('❌ [ReportsComponent] Error getting userId', error);
        this.logToBackend('error', 'Failed to get userId', error);
      }
    });
  }
  
  retryGenerate(): void {
    console.log('🔄 [ReportsComponent] Retrying to generate report');
    this.logToBackend('info', 'ReportsComponent: Retrying to generate report');
    this.generateReport();
  }
  
  downloadReport(): void {
    console.log('📥 [ReportsComponent] Downloading report');
    this.logToBackend('info', 'ReportsComponent: Downloading report');
    
    // In a real implementation, this would trigger a file download
    this.report$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((report: any) => {
      if (report) {
        console.log('📄 [ReportsComponent] Report data received, initiating download', {
          reportType: report.reportType,
          dataLength: report.data?.length
        });
        this.logToBackend('info', 'ReportsComponent: Report data received, initiating download', {
          reportType: report.reportType,
          dataLength: report.data?.length
        });
        this.downloadFile(report.data, `analytics-report.${report.reportType}`);
      } else {
        console.warn('⚠️ [ReportsComponent] No report data available for download');
        this.logToBackend('warn', 'ReportsComponent: No report data available for download');
      }
    });
  }
  
  private downloadFile(data: any, filename: string): void {
    // Create a blob from the data
    const blob = new Blob([data], { type: 'application/octet-stream' });
    
    // Create a download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  
  private logToBackend(level: string, message: string, data?: any): void {
    // In a real implementation, this would send logs to the backend
    // For now, we're just logging to the console which will be captured by browser logs
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component: 'ReportsComponent',
      url: window.location.href
    };
    
    // This will be captured by the browser logs system
    console.log(`[BrowserLog] ${level.toUpperCase()}:`, logEntry);
  }
}