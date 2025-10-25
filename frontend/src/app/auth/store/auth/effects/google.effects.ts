import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';
import { RoutePersistenceService } from '../../../../core/services/route-persistence.service';

@Injectable()
export class GoogleEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private routePersistence = inject(RoutePersistenceService);

  googleLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.googleLogin),
        tap(() => {
          console.info('[GoogleEffects] googleLogin dispatched, initiating Google login');
          this.authService.initiateGoogleLogin();
        }),
      ),
    { dispatch: false },
  );

  googleLoginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.googleLoginSuccess),
        tap(() => {
          console.info('[GoogleEffects] googleLoginSuccess, attempting route restore');
          const last = this.routePersistence.getLastRoute();
          if (last) {
            this.routePersistence.restoreLastRoute();
          } else {
            console.debug('[GoogleEffects] no last route found; leaving current URL as-is');
          }
        }),
      ),
    { dispatch: false },
  );
}
