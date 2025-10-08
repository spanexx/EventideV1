import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, catchError, switchMap, withLatestFrom, filter } from 'rxjs/operators';
import * as ProvidersActions from './providers.actions';
import * as ProvidersSelectors from './providers.selectors';
import { ProviderService } from '../../provider-search/services/provider.service';

@Injectable()
export class ProvidersEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private providerService = inject(ProviderService);

  /**
   * Load providers only if cache is invalid
   */
  loadProviders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProvidersActions.loadProviders),
      withLatestFrom(this.store.select(ProvidersSelectors.selectIsCacheValid)),
      filter(([_, isCacheValid]) => {
        if (isCacheValid) {
          console.log('📦 Using cached providers (cache is valid)');
          return false; // Don't fetch if cache is valid
        }
        return true;
      }),
      switchMap(() =>
        this.providerService.getProviders(true).pipe(
          map(providers => ProvidersActions.loadProvidersSuccess({ providers })),
          catchError(error => {
            console.error('❌ Failed to load providers:', error);
            return of(ProvidersActions.loadProvidersFailure({ 
              error: 'Failed to load providers. Please try again.' 
            }));
          })
        )
      )
    )
  );

  /**
   * Refresh providers (force fetch)
   */
  refreshProviders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProvidersActions.refreshProviders),
      switchMap(() =>
        this.providerService.getProviders(true).pipe(
          map(providers => ProvidersActions.loadProvidersSuccess({ providers })),
          catchError(error => {
            console.error('❌ Failed to refresh providers:', error);
            return of(ProvidersActions.loadProvidersFailure({ 
              error: 'Failed to refresh providers. Please try again.' 
            }));
          })
        )
      )
    )
  );
}
