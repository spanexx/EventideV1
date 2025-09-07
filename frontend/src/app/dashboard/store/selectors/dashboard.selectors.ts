import { createSelector, createFeatureSelector } from '@ngrx/store';
import { DashboardState } from '../reducers/dashboard.reducer';

export const selectDashboardState = createFeatureSelector<DashboardState>('dashboard');

// Dashboard stats selectors
export const selectDashboardStats = createSelector(
  selectDashboardState,
  (state: DashboardState) => state.stats
);

// Recent activity selectors
export const selectRecentActivity = createSelector(
  selectDashboardState,
  (state: DashboardState) => state.activity
);

// Bookings selectors
export const selectBookings = createSelector(
  selectDashboardState,
  (state: DashboardState) => state.bookings
);

// Loading and error selectors
export const selectDashboardLoading = createSelector(
  selectDashboardState,
  (state: DashboardState) => state.loading
);

export const selectDashboardError = createSelector(
  selectDashboardState,
  (state: DashboardState) => state.error
);