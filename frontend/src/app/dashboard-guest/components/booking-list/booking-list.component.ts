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
import * as GuestDashboardSelectors from '../../store/selectors/guest-dashboard.selectors';
import { Booking } from '../../models/booking.models';

@Component({
  selector: 'app-guest-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
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
    this.upcomingBookings$ = this.store.select(GuestDashboardSelectors.selectUpcomingBookings);
    this.pastBookings$ = this.store.select(GuestDashboardSelectors.selectPastBookings);
    this.loading$ = this.store.select(GuestDashboardSelectors.selectBookingsLoading);
    this.error$ = this.store.select(GuestDashboardSelectors.selectBookingsError);
  }

  ngOnInit(): void {
    this.store.dispatch(GuestDashboardActions.loadBookings());
  }

  cancelBooking(bookingId: string): void {
    this.store.dispatch(GuestDashboardActions.cancelBooking({ id: bookingId }));
  }
}