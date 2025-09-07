import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { reducers } from './store';
import { DashboardEffects } from './store/effects/dashboard.effects';
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
  ]
})
export class DashboardModule { }