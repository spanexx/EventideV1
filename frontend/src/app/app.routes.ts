import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-routing.module').then(m => m.AuthRoutingModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./dashboard/dashboard-routing.module').then(m => m.DashboardRoutingModule)
  },
  {
    path: 'booking',
    loadChildren: () => import('./booking/booking-routing.module').then(m => m.BookingRoutingModule)
  },
  
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
];