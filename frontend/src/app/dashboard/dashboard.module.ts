import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { reducers } from './store';
import { DashboardEffects } from './store/effects/dashboard.effects';
import { MockDashboardService } from './services/mock-dashboard.service';
import { MockBookingService } from './services/mock-booking.service';
import { MockAvailabilityService } from './services/mock-availability.service';
import { AnalyticsEffects } from '../analytics/store/effects/analytics.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    DashboardComponent,
    StoreModule.forFeature('dashboard', reducers.dashboard),
    EffectsModule.forFeature([DashboardEffects, AnalyticsEffects])
  ],
  providers: [
    MockDashboardService,
    MockBookingService,
    MockAvailabilityService
  ]
})
export class DashboardModule { }