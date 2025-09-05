import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { HttpClientModule } from '@angular/common/http';

// Components
import { DashboardGuestComponent } from './dashboard-guest.component';
import { GuestHeaderComponent } from './components/header/header.component';
import { GuestSidebarComponent } from './components/sidebar/sidebar.component';

// Routing
import { DashboardGuestRoutingModule } from './dashboard-guest-routing.module';

// Store
import { guestDashboardReducer } from './store/reducers/guest-dashboard.reducer';
import { GuestDashboardEffects } from './store/effects/guest-dashboard.effects';

@NgModule({
  declarations: [
    DashboardGuestComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    HttpClientModule,
    DashboardGuestRoutingModule,
    StoreModule.forFeature('guestDashboard', guestDashboardReducer),
    EffectsModule.forFeature([GuestDashboardEffects]),
    DashboardGuestComponent,
    GuestHeaderComponent,
    GuestSidebarComponent
  ]
})
export class DashboardGuestModule { }