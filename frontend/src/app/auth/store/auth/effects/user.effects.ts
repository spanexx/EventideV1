import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';
import { Store } from '@ngrx/store';
import { selectUser } from '../selectors/auth.selectors';
import { NotificationService } from '../../../../core/services/notification.service';

@Injectable()
export class UserEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private store = inject(Store);
  private notificationService = inject(NotificationService);

  loadUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loadUser),
      tap(() => console.debug('[UserEffects] loadUser dispatched')),
      map(() => {
        const user = this.authService.getCurrentUser();
        if (user) {
          console.debug('[UserEffects] loadUser succeeded');
          return AuthActions.loadUserSuccess({ user });
        } else {
          console.warn('[UserEffects] loadUser found no user');
          return AuthActions.loadUserFailure({ error: 'No user found' });
        }
      }),
    );
  });

  refreshUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.refreshUser),
      tap(() => console.debug('[UserEffects] refreshUser dispatched - fetching /users/me')),
      switchMap(() =>
        this.authService.fetchUserData().pipe(
          tap((user) => console.debug('[UserEffects] refreshUser API call succeeded', user)),
          map((user) => AuthActions.refreshUserSuccess({ user })),
          catchError((error) => {
            console.error('[UserEffects] refreshUser failed', error);
            return of(AuthActions.refreshUserFailure({ error: error.message }));
          }),
        ),
      ),
    );
  });

  updateUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.updateUser),
      tap((action) => console.debug('[UserEffects] updateUser dispatched', Object.keys(action.updates))),
      switchMap(({ updates }) =>
        this.authService.updateCurrentUser(updates).pipe(
          tap(() => console.debug('[UserEffects] updateUser API call succeeded')),
          map((user) => AuthActions.updateUserSuccess({ user })),
          catchError((error) => {
            console.error('[UserEffects] updateUser failed', error);
            return of(AuthActions.updateUserFailure({ error: error.message }));
          }),
        ),
      ),
    );
  });

  updateUserSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.updateUserSuccess),
        tap(() => {
          console.info('[UserEffects] updateUserSuccess, profile/business updated');
          this.notificationService.success('Settings updated successfully');
        }),
      ),
    { dispatch: false },
  );
}
