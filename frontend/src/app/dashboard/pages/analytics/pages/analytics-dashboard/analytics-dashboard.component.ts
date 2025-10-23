import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, timer } from 'rxjs';
import { first, takeUntil, filter, take, timeout } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import * as AnalyticsActions from '../../store/actions/analytics.actions';
import * as AnalyticsSelectors from '../../store/selectors/analytics.selectors';
import * as AuthSelectors from '../../../../../auth/store/auth/selectors/auth.selectors';
import { SummaryCardComponent } from '../../components/summary-cards/summary-card.component';
import { LineChartComponent } from '../../components/charts/line-chart.component';
import { BarChartComponent } from '../../components/charts/bar-chart.component';


@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatDatepickerModule, 
    MatSelectModule, 
    MatButtonModule, 
    MatIconModule, 
    MatProgressSpinnerModule, 
    MatCardModule,
    SummaryCardComponent,
    LineChartComponent,
    BarChartComponent
  ]
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  startDate = new Date();
  endDate = new Date();
  
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  metrics$!: Observable<any>;
  revenueData$!: Observable<any>;
  occupancyData$!: Observable<any>;
  bookingTrends$!: Observable<any>;
  
  private destroy$ = new Subject<void>();
  
  constructor(private store: Store) {
    this.loading$ = this.store.select(AnalyticsSelectors.selectAnalyticsLoading);
    this.error$ = this.store.select(AnalyticsSelectors.selectAnalyticsError);
    this.metrics$ = this.store.select(AnalyticsSelectors.selectMetrics);
    this.revenueData$ = this.store.select(AnalyticsSelectors.selectRevenueData);
    this.occupancyData$ = this.store.select(AnalyticsSelectors.selectOccupancyData);
    this.bookingTrends$ = this.store.select(AnalyticsSelectors.selectBookingTrends);
    // Set default date range to last 30 days
    this.startDate.setDate(this.endDate.getDate() - 30);
  }
  
  ngOnInit(): void {
    console.log('📈 [AnalyticsDashboardComponent] Initializing analytics dashboard');
    this.loadData();
    
    // Listen for error updates to show notifications
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((error: string | null) => {
      if (error) {
        // In a real implementation, we would show a snackbar notification
        console.error('Analytics error:', error);
        // Log to backend browser logs
        this.logToBackend('error', 'Analytics error:', error);
      }
    });
    
    // Log successful initialization
    console.log('✅ [AnalyticsDashboardComponent] Analytics dashboard initialized successfully');
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(): void {
    console.log('🔄 [AnalyticsDashboardComponent] Loading analytics data', {
      startDate: this.startDate,
      endDate: this.endDate
    });
    
    // Get the current user and load analytics data for that user
    this.store.select(AuthSelectors.selectUserId).pipe(
      filter(userId => userId !== ''), // Wait for a non-empty user ID
      take(1), // Take only the first non-empty user ID
      takeUntil(this.destroy$)
    ).subscribe(userId => {
      console.log('👤 [AnalyticsDashboardComponent] Dispatching load analytics data for user', { userId });
      this.store.dispatch(AnalyticsActions.loadAnalyticsData({
        request: {
          providerId: userId,
          dateRange: {
            startDate: this.startDate,
            endDate: this.endDate
          }
        }
      }));
    });
  }
  
  retryLoad(): void {
    console.log('🔄 [AnalyticsDashboardComponent] Retrying to load analytics data');
    this.logToBackend('info', 'AnalyticsDashboardComponent: Retrying to load analytics data');
    this.loadData();
  }
  
  private logToBackend(level: string, message: string, data?: any): void {
    // In a real implementation, this would send logs to the backend
    // For now, we're just logging to the console which will be captured by browser logs
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component: 'AnalyticsDashboardComponent',
      url: window.location.href
    };
    
    // This will be captured by the browser logs system
    console.log(`[BrowserLog] ${level.toUpperCase()}:`, logEntry);
  }
}