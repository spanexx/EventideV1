import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as GuestDashboardActions from '../../store/actions/guest-dashboard.actions';
import { Booking } from '../../models/booking.models';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
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
    // These would be properly selected from the store in a real implementation
    this.upcomingBookings$ = new Observable();
    this.totalBookings$ = new Observable();
    this.loading$ = new Observable();
    this.error$ = new Observable();
  }

  ngOnInit(): void {
    this.store.dispatch(GuestDashboardActions.loadBookings());
  }
}