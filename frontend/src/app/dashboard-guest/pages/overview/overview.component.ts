import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as GuestDashboardActions from '../../store/actions/guest-dashboard.actions';
import * as GuestDashboardSelectors from '../../store/selectors/guest-dashboard.selectors';
import { Booking } from '../../models/booking.models';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverviewComponent implements OnInit {
  upcomingBookings$: Observable<Booking[]>;
  totalBookings$: Observable<number>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private store: Store) {
    this.upcomingBookings$ = this.store.select(GuestDashboardSelectors.selectUpcomingBookings);
    this.totalBookings$ = this.store.select(GuestDashboardSelectors.selectTotalBookings);
    this.loading$ = this.store.select(GuestDashboardSelectors.selectGuestDashboardLoading);
    this.error$ = this.store.select(GuestDashboardSelectors.selectGuestDashboardError);
  }

  ngOnInit(): void {
    this.store.dispatch(GuestDashboardActions.loadBookings());
  }
}