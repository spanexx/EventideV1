import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Router } from '@angular/router';
import { User } from '../../../../services/auth/auth.models';

@Injectable()
export class SignupEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  signup$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signup),
      tap((a) => console.debug('[SignupEffects] signup dispatched', { email: a.email })),
      switchMap(({ email, password, firstName, lastName }) => {
        const userData: any = { email, password };
        if (firstName) userData.firstName = firstName;
        if (lastName) userData.lastName = lastName;

        return this.authService.signup(userData).pipe(
          tap(() => console.debug('[SignupEffects] signup API call succeeded')),
          map((response) =>
            AuthActions.signupSuccess({
              user: (response as unknown as User),
              email: (response as any).email,
            }),
          ),
          catchError((error) => {
            console.error('[SignupEffects] signup failed', error);
            return of(AuthActions.signupFailure({ error: error.message }));
          }),
        );
      }),
    );
  });

  signupSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signupSuccess),
        tap(({ email }) => {
          console.info('[SignupEffects] signupSuccess, showing verification message and navigating to login');
          this.notificationService.success(
            `Account created successfully! Please check your email (${email}) for a verification link before logging in.`,
            { duration: 8000 },
          );
          this.router.navigate(['/auth/login'], {
            queryParams: {
              message: 'Please verify your email before logging in',
              email: email,
            },
          });
        }),
      ),
    { dispatch: false },
  );
}
