import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';

@Injectable()
export class PasswordEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);

  forgotPassword$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.forgotPassword),
      tap(({ email }) => console.debug('[PasswordEffects] forgotPassword dispatched', { email })),
      switchMap(({ email }) =>
        this.authService.forgotPassword(email).pipe(
          tap(() => console.debug('[PasswordEffects] forgotPassword API call succeeded')),
          map((response) =>
            AuthActions.forgotPasswordSuccess({
              message: (response as any).message,
            }),
          ),
          catchError((error) => {
            console.error('[PasswordEffects] forgotPassword failed', error);
            return of(AuthActions.forgotPasswordFailure({ error: error.message }));
          }),
        ),
      ),
    );
  });

  resetPassword$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      tap(() => console.debug('[PasswordEffects] resetPassword dispatched')),
      switchMap(({ token, newPassword }) =>
        this.authService.resetPassword(token, newPassword).pipe(
          tap(() => console.debug('[PasswordEffects] resetPassword API call succeeded')),
          map((response) =>
            AuthActions.resetPasswordSuccess({
              message: (response as any).message,
            }),
          ),
          catchError((error) => {
            console.error('[PasswordEffects] resetPassword failed', error);
            return of(AuthActions.resetPasswordFailure({ error: error.message }));
          }),
        ),
      ),
    );
  });
}
