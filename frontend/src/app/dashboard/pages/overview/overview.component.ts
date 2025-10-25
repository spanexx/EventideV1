import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import * as DashboardActions from '../../store-dashboard/actions/dashboard.actions';
import * as DashboardSelectors from '../../store-dashboard/selectors/dashboard.selectors';
import { selectProviderId } from '../../../auth/store/auth/selectors/auth.selectors';
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
export class OverviewComponent implements OnInit, OnDestroy {
  stats$: Observable<DashboardStats | null>;
  loading$: Observable<boolean>;
  activity$: Observable<any[]>;
  error$: Observable<string | null>;
  
  private destroy$ = new Subject<void>();

  constructor(private store: Store) {
    this.stats$ = this.store.select(DashboardSelectors.selectDashboardStats);
    this.loading$ = this.store.select(DashboardSelectors.selectDashboardLoading);
    this.activity$ = this.store.select(DashboardSelectors.selectRecentActivity);
    this.error$ = this.store.select(DashboardSelectors.selectDashboardError);
  }

  ngOnInit(): void {
    console.log('[OverviewComponent] initializing: waiting for providerId before dispatching dashboard loads');
    
    // Gate dashboard loads on providerId availability
    this.store.select(selectProviderId).pipe(
      filter(providerId => {
        console.log('[OverviewComponent] providerId check:', { providerId, hasValue: !!providerId });
        return !!providerId;
      }),
      tap(providerId => {
        console.log('[OverviewComponent] providerId available, dispatching dashboard loads:', { providerId });
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.store.dispatch(DashboardActions.loadDashboardStats());
      this.store.dispatch(DashboardActions.loadRecentActivity());
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}