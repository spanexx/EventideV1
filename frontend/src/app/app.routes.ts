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
    loadChildren: () => import('./booking-wizard/booking-routing.module').then(m => m.BookingRoutingModule)
  },
  {
    path: 'booking-lookup',
    loadComponent: () => import('./booking-lookup').then(m => m.BookingLookupComponent)
  },
  {
    path: 'booking-lookup/:serialKey',
    loadComponent: () => import('./booking-lookup').then(m => m.BookingLookupComponent)
  },
  {
    path: 'booking-cancel/:id',
    loadComponent: () => import('./booking-cancellation/booking-cancellation.component').then(m => m.BookingCancellationComponent)
  },
  {
    path: 'providers',
    loadComponent: () => import('./provider-search/provider-search.component').then(m => m.ProviderSearchComponent)
  },
  {
    path: 'provider/:id',
    loadComponent: () => import('./provider-profile/provider-profile.component').then(m => m.ProviderProfileComponent)
  },
  {
    path: 'provider/:id/:accessCode',
    loadComponent: () => import('./provider-profile/provider-profile.component').then(m => m.ProviderProfileComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  
  { path: '', redirectTo: '/home', pathMatch: 'full' }
];