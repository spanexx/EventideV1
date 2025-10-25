import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { RoutePersistenceService } from '../../../../core/services/route-persistence.service';
import { User } from '../../../../services/auth/auth.models';

@Injectable()
export class LoginEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private routePersistence = inject(RoutePersistenceService);
  // Transient flag to ensure post-login navigation occurs only once
  private postLoginNavPending = false;

  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      tap(({ email }) => console.debug('[LoginEffects] login dispatched', { email })),
      switchMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          tap(() => console.debug('[LoginEffects] login API call succeeded')),
          map((response) =>
            AuthActions.loginSuccess({
              user: (response as unknown as User),
              token: (response as any).access_token,
              refreshToken: (response as any).refreshToken,
            }),
          ),
          catchError((error) => {
            console.error('[LoginEffects] login failed', error);
            return of(AuthActions.loginFailure({ error: error.message }));
          }),
        ),
      ),
    );
  });

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => {
        console.info('[LoginEffects] loginSuccess, dispatching refreshUser to load full user data');
        this.postLoginNavPending = true;
      }),
      map(() => AuthActions.refreshUser())
    )
  );

  refreshUserAfterLogin$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.refreshUserSuccess),
        tap(() => {
          if (!this.postLoginNavPending) {
            // Not a post-login refresh; do not navigate
            return;
          }
          this.postLoginNavPending = false;
          console.info('[LoginEffects] post-login refreshUserSuccess, attempting route restore');
          const last = this.routePersistence.getLastRoute();
          if (last) {
            console.debug('[LoginEffects] restoring last route:', last);
            this.routePersistence.restoreLastRoute();
          } else {
            console.debug('[LoginEffects] no last route found; navigating to dashboard');
            this.router.navigate(['/dashboard']);
          }
        }),
      ),
    { dispatch: false },
  );
}
