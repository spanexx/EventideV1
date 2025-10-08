import { createAction, props } from '@ngrx/store';
import { Provider } from '../../provider-search/services/provider.service';

export const loadProviders = createAction(
  '[Providers] Load Providers'
);

export const loadProvidersSuccess = createAction(
  '[Providers] Load Providers Success',
  props<{ providers: Provider[] }>()
);

export const loadProvidersFailure = createAction(
  '[Providers] Load Providers Failure',
  props<{ error: string }>()
);

export const refreshProviders = createAction(
  '[Providers] Refresh Providers'
);

export const clearProvidersCache = createAction(
  '[Providers] Clear Cache'
);
