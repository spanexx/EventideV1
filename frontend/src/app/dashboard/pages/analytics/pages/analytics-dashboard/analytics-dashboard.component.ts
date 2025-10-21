import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
    this.loadData();
    
    // Listen for error updates to show notifications
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((error: string | null) => {
      if (error) {
        // In a real implementation, we would show a snackbar notification
        console.error('Analytics error:', error);
      }
    });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(): void {
    // Get the current user and load analytics data for that user
    this.store.select(AuthSelectors.selectUserId).subscribe(userId => {
      if (userId) {
        this.store.dispatch(AnalyticsActions.loadAnalyticsData({
          request: {
            providerId: userId,
            dateRange: {
              startDate: this.startDate,
              endDate: this.endDate
            }
          }
        }));
      }
    });
  }
  
  retryLoad(): void {
    this.loadData();
  }
}