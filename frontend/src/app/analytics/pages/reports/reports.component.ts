import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as AnalyticsActions from '../../store/actions/analytics.actions';
import * as AnalyticsSelectors from '../../store/selectors/analytics.selectors';
import * as AuthSelectors from '../../../auth/store/auth/selectors/auth.selectors';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
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
  
  constructor(private store: Store) {
    // Set default date range to last 30 days
    this.startDate.setDate(this.endDate.getDate() - 30);
    
    // Initialize observables after store is injected
    this.loading$ = this.store.select(AnalyticsSelectors.selectAnalyticsLoading);
    this.error$ = this.store.select(AnalyticsSelectors.selectAnalyticsError);
    this.report$ = this.store.select(AnalyticsSelectors.selectReport);
  }
  
  ngOnInit(): void {
    // Listen for error updates to show notifications
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((error: string | null) => {
      if (error) {
        // In a real implementation, we would show a snackbar notification
        console.error('Report generation error:', error);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  generateReport(): void {
    // Get the current user and generate report for that user
    this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
      if (userId) {
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
      }
    });
  }
  
  retryGenerate(): void {
    this.generateReport();
  }
  
  downloadReport(): void {
    // In a real implementation, this would trigger a file download
    this.report$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((report: any) => {
      if (report) {
        this.downloadFile(report.data, `analytics-report.${report.reportType}`);
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
}