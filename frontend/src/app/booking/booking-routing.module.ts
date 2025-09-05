import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookingComponent } from './booking.component';

const routes: Routes = [
  {
    path: '',
    component: BookingComponent,
    children: [
      { path: '', redirectTo: 'duration', pathMatch: 'full' },
      { 
        path: 'duration', 
        loadComponent: () => import('./components/duration-selection/duration-selection.component').then(m => m.DurationSelectionComponent) 
      },
      { 
        path: 'availability', 
        loadComponent: () => import('./components/availability-slots/availability-slots.component').then(m => m.AvailabilitySlotsComponent) 
      },
      { 
        path: 'information', 
        loadComponent: () => import('./components/guest-information/guest-information.component').then(m => m.GuestInformationComponent) 
      },
      { 
        path: 'confirmation', 
        loadComponent: () => import('./components/booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent) 
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingRoutingModule { }