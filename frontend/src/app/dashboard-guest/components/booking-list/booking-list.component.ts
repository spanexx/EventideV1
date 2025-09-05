import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import * as GuestDashboardActions from '../../store/actions/guest-dashboard.actions';
import { Booking } from '../../models/booking.models';

@Component({
  selector: 'app-guest-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GuestBookingListComponent implements OnInit {
  upcomingBookings$: Observable<Booking[]>;
  pastBookings$: Observable<Booking[]>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private store: Store) {
    // These would be properly selected from the store in a real implementation
    this.upcomingBookings$ = new Observable();
    this.pastBookings$ = new Observable();
    this.loading$ = new Observable();
    this.error$ = new Observable();
  }

  ngOnInit(): void {
    this.store.dispatch(GuestDashboardActions.loadBookings());
  }

  cancelBooking(bookingId: string): void {
    this.store.dispatch(GuestDashboardActions.cancelBooking({ id: bookingId }));
  }
}