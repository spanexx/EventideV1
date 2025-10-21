import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AnalyticsState } from '../reducers/analytics.reducer';

// Feature selector with null check
// NOTE: We handle undefined state to prevent errors when the feature is not yet loaded
export const selectAnalyticsState = createFeatureSelector<AnalyticsState>('analytics');

// Analytics data selectors
export const selectAnalyticsData = createSelector(
  selectAnalyticsState,
  (state: AnalyticsState | undefined) => state ? state.data : null
);

export const selectMetrics = createSelector(
  selectAnalyticsData,
  (data) => data?.metrics
);

export const selectRevenueData = createSelector(
  selectAnalyticsData,
  (data) => data?.revenueData
);

export const selectOccupancyData = createSelector(
  selectAnalyticsData,
  (data) => data?.occupancyData
);

export const selectBookingTrends = createSelector(
  selectAnalyticsData,
  (data) => data?.bookingTrends
);

// Report selectors
export const selectReport = createSelector(
  selectAnalyticsState,
  (state: AnalyticsState | undefined) => state ? state.report : null
);

// Loading and error selectors
export const selectAnalyticsLoading = createSelector(
  selectAnalyticsState,
  (state: AnalyticsState | undefined) => state ? state.loading : false
);

export const selectAnalyticsError = createSelector(
  selectAnalyticsState,
  (state: AnalyticsState | undefined) => state ? state.error : null
);