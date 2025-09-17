import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DashboardGuard } from './guards/dashboard.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [DashboardGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { 
        path: 'overview', 
        loadComponent: () => import('./pages/overview/overview.component').then(m => m.OverviewComponent) 
      },
      { 
        path: 'availability', 
        loadComponent: () => import('./pages/availability/availability.component').then(m => m.AvailabilityComponent) 
      },
      // { 
      //   path: 'availability-improved', 
      //   loadComponent: () => import('./pages/availability/availability-improved.component').then(m => m.AvailabilityImprovedComponent) 
      // },
      { 
        path: 'bookings', 
        loadComponent: () => import('./pages/bookings/bookings.component').then(m => m.BookingsComponent) 
      },
      { 
        path: 'analytics/dashboard', 
        loadComponent: () => import('../analytics/pages/analytics-dashboard/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent) 
      },
      { 
        path: 'analytics/reports', 
        loadComponent: () => import('../analytics/pages/reports/reports.component').then(m => m.ReportsComponent) 
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) 
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }