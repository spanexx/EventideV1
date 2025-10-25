import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../services/auth/auth.models';

@Injectable()
export class TokenEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);

  verifyToken$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.verifyToken),
      tap(() => console.debug('[TokenEffects] verifyToken dispatched')),
      switchMap(() =>
        this.authService.verifyToken().pipe(
          map((isValid) => {
            console.debug('[TokenEffects] verifyToken result', { isValid });
            if (isValid) {
              const user = this.authService.getCurrentUser();
              const token = this.authService.getToken();
              const refreshToken = this.authService.getRefreshToken();

              if (user) {
                console.debug('[TokenEffects] verifyToken succeeded, restoring user from storage');
                return AuthActions.verifyTokenSuccess({
                  user: user as unknown as User,
                  token: token || '',
                  refreshToken: refreshToken || undefined,
                });
              } else {
                console.warn('[TokenEffects] verifyToken valid but no user data available');
                return AuthActions.verifyTokenFailure({ error: 'No user data available' });
              }
            } else {
              console.warn('[TokenEffects] verifyToken failed');
              return AuthActions.verifyTokenFailure({ error: 'Token verification failed' });
            }
          }),
          catchError((error) => {
            console.error('[TokenEffects] verifyToken error', error);
            return of(AuthActions.verifyTokenFailure({ error: error.message }));
          }),
        ),
      ),
    );
  });

  refreshToken$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      tap(() => console.debug('[TokenEffects] refreshToken dispatched')),
      switchMap(() =>
        this.authService.refreshToken().pipe(
          tap(() => console.debug('[TokenEffects] refreshToken API call succeeded')),
          map((response) =>
            AuthActions.refreshTokenSuccess({
              token: (response as any).access_token,
              refreshToken: (response as any).refreshToken,
            }),
          ),
          catchError((error) => {
            console.error('[TokenEffects] refreshToken failed', error);
            return of(AuthActions.refreshTokenFailure({ error: error.message }));
          }),
        ),
      ),
    );
  });
}
