import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardGuestComponent } from './dashboard-guest.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardGuestComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { 
        path: 'overview', 
        loadComponent: () => import('./pages/overview/overview.component').then(m => m.OverviewComponent) 
      },
      { 
        path: 'bookings', 
        loadComponent: () => import('./pages/bookings/bookings.component').then(m => m.BookingsComponent) 
      },
      { 
        path: 'bookings/:id', 
        loadComponent: () => import('./components/booking-details/booking-details.component').then(m => m.BookingDetailsComponent) 
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) 
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardGuestRoutingModule { }