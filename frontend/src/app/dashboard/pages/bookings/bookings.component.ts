import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as DashboardActions from '../../store/actions/dashboard.actions';
import * as DashboardSelectors from '../../store/selectors/dashboard.selectors';
import { Booking, BookingStatus } from '../../models/booking.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent implements OnInit {
  bookings$: Observable<Booking[]>;
  loading$: Observable<boolean>;
  selectedStatus: string = '';

  constructor(private store: Store) {
    this.bookings$ = this.store.select(DashboardSelectors.selectBookings);
    this.loading$ = this.store.select(DashboardSelectors.selectDashboardLoading);
  }

  ngOnInit(): void {
    // Load bookings data
    this.store.dispatch(DashboardActions.loadBookings({ params: {} }));
  }

  refreshBookings(): void {
    this.store.dispatch(DashboardActions.loadBookings({ params: {} }));
  }

  filterBookings(): void {
    const params: any = {};
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }
    this.store.dispatch(DashboardActions.loadBookings({ params }));
  }

  editBooking(booking: Booking): void {
    // Implement edit booking functionality
    console.log('Edit booking:', booking);
  }

  cancelBooking(booking: Booking): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.store.dispatch(DashboardActions.cancelBooking({ bookingId: booking.id }));
    }
  }

  updateBookingStatus(booking: Booking, status: BookingStatus): void {
    this.store.dispatch(DashboardActions.updateBookingStatus({ 
      bookingId: booking.id, 
      status 
    }));
  }
}