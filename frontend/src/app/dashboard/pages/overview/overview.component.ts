import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as DashboardActions from '../../store/actions/dashboard.actions';
import * as DashboardSelectors from '../../store/selectors/dashboard.selectors';
import { DashboardStats } from '../../models/dashboard.models';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './overview.component.html',
  styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit {
  stats$: Observable<DashboardStats | null>;
  loading$: Observable<boolean>;

  constructor(private store: Store) {
    this.stats$ = this.store.select(DashboardSelectors.selectDashboardStats);
    this.loading$ = this.store.select(DashboardSelectors.selectDashboardLoading);
  }

  ngOnInit(): void {
    // Dispatch actions to load dashboard data
    this.store.dispatch(DashboardActions.loadDashboardStats());
    this.store.dispatch(DashboardActions.loadRecentActivity());
  }
}