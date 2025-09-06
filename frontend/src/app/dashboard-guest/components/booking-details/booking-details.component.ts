import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as GuestDashboardActions from '../../store/actions/guest-dashboard.actions';
import * as GuestDashboardSelectors from '../../store/selectors/guest-dashboard.selectors';
import { Booking, BookingStatus } from '../../models/booking.models';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookingDetailsComponent implements OnInit {
  booking$: Observable<Booking | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.booking$ = this.store.select(GuestDashboardSelectors.selectCurrentBooking);
    this.loading$ = this.store.select(GuestDashboardSelectors.selectBookingsLoading);
    this.error$ = this.store.select(GuestDashboardSelectors.selectBookingsError);
  }

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('id');
    if (bookingId) {
      this.store.dispatch(GuestDashboardActions.loadBookingById({ id: bookingId }));
    }
  }

  cancelBooking(bookingId: string): void {
    this.store.dispatch(GuestDashboardActions.cancelBooking({ id: bookingId }));
  }

  goBack(): void {
    this.router.navigate(['/dashboard-guest/bookings']);
  }

  canCancel(booking: Booking): boolean {
    return booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING;
  }

  canReschedule(booking: Booking): boolean {
    return booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.PENDING;
  }
}