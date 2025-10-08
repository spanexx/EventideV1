import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProvidersState } from './providers.state';

export const selectProvidersState = createFeatureSelector<ProvidersState>('providers');

export const selectAllProviders = createSelector(
  selectProvidersState,
  (state) => state.allProviders
);

export const selectProvidersLoading = createSelector(
  selectProvidersState,
  (state) => state.loading
);

export const selectProvidersError = createSelector(
  selectProvidersState,
  (state) => state.error
);

export const selectLastFetched = createSelector(
  selectProvidersState,
  (state) => state.lastFetched
);

export const selectCacheAge = createSelector(
  selectLastFetched,
  (lastFetched) => {
    if (lastFetched === 0) return null;
    return Math.floor((Date.now() - lastFetched) / 1000);
  }
);

export const selectIsCacheValid = createSelector(
  selectLastFetched,
  selectAllProviders,
  (lastFetched, providers) => {
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    return (now - lastFetched) < CACHE_DURATION && providers.length > 0;
  }
);
