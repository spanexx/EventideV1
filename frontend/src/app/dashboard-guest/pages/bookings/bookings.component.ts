import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Booking } from '../../models/booking.models';
import { GuestBookingListComponent } from '../../components/booking-list/booking-list.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    GuestBookingListComponent
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingsComponent {
  // In a real implementation, this would come from the store
  // upcomingBookings$: Observable<Booking[]> = this.store.select(selectUpcomingBookings);
  // pastBookings$: Observable<Booking[]> = this.store.select(selectPastBookings);
  
  constructor(private store: Store) {}
}