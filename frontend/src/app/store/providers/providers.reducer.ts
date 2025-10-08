import { createReducer, on } from '@ngrx/store';
import { initialProvidersState } from './providers.state';
import * as ProvidersActions from './providers.actions';

export const providersReducer = createReducer(
  initialProvidersState,
  on(ProvidersActions.loadProviders, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ProvidersActions.loadProvidersSuccess, (state, { providers }) => ({
    ...state,
    allProviders: providers,
    loading: false,
    error: null,
    lastFetched: Date.now()
  })),
  on(ProvidersActions.loadProvidersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(ProvidersActions.refreshProviders, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(ProvidersActions.clearProvidersCache, () => ({
    ...initialProvidersState
  }))
);
