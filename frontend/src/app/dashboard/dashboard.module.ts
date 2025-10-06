import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { reducers } from './store-dashboard';
import { DashboardEffects } from './store-dashboard/effects/dashboard.effects';
import { AnalyticsEffects } from '../analytics/store/effects/analytics.effects';
import { SmartCalendarModule } from './components/smart-calendar/smart-calendar.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    DashboardComponent,
    SmartCalendarModule,
    StoreModule.forFeature('dashboard', reducers.dashboard),
    EffectsModule.forFeature([DashboardEffects, AnalyticsEffects])
  ],
  providers: [
  ]
})
export class DashboardModule { }