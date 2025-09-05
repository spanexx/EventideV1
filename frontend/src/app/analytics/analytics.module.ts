import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { analyticsReducer } from './store/reducers/analytics.reducer';
import { AnalyticsEffects } from './store/effects/analytics.effects';

// Components
import { AnalyticsDashboardComponent } from './pages/analytics-dashboard/analytics-dashboard.component';
import { ReportsComponent } from './pages/reports/reports.component';

// Analytics components
import { SummaryCardComponent } from './components/summary-cards/summary-card.component';
import { LineChartComponent } from './components/charts/line-chart.component';
import { BarChartComponent } from './components/charts/bar-chart.component';
import { ChartContainerComponent } from './components/charts/chart-container.component';

// Material modules
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

// Other modules
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Material Datepicker providers
import { provideNativeDateAdapter } from '@angular/material/core';

// Services
// Both AnalyticsService and AnalyticsSocketService are provided at root level, so they're not needed here

  @NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StoreModule.forFeature('analytics', analyticsReducer),
    EffectsModule.forFeature([AnalyticsEffects]),
    MatDatepickerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    FormsModule,
    RouterModule,
    AnalyticsDashboardComponent,
    ReportsComponent,
    SummaryCardComponent,
    LineChartComponent,
    BarChartComponent,
    ChartContainerComponent
  ],
  providers: [
    provideNativeDateAdapter()
    // AnalyticsService and AnalyticsSocketService are provided at root level
  ]
})
export class AnalyticsModule { }