import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';

@Injectable()
export class EmailEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);

  verifyEmail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.verifyEmail),
      tap(({ token }) =>
        console.debug('[EmailEffects] verifyEmail dispatched', {
          token: token.substring(0, 10) + '...',
        }),
      ),
      switchMap(({ token }) =>
        this.authService.verifyEmailWithToken(token).pipe(
          tap(() => console.debug('[EmailEffects] verifyEmail API call succeeded')),
          map((response) =>
            AuthActions.verifyEmailSuccess({
              message: (response as any).message,
            }),
          ),
          catchError((error) => {
            console.error('[EmailEffects] verifyEmail failed', error);
            return of(AuthActions.verifyEmailFailure({ error: error.message }));
          }),
        ),
      ),
    );
  });
}
