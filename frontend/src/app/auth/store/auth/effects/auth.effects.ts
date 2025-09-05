import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as AuthActions from '../actions/auth.actions';
import { AuthService } from '../../../../services/auth.service';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);

  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          map((response) =>
            AuthActions.loginSuccess({
              user: response as any, // Type casting may need adjustment based on actual response
              token: response.access_token,
              refreshToken: response.refreshToken
            })
          ),
          catchError((error) => of(AuthActions.loginFailure({ error: error.message })))
        )
      )
    );
  });

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => {
        this.router.navigate(['/dashboard']);
      })
    ),
    { dispatch: false }
  );

  signup$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signup),
      switchMap(({ email, password, firstName, lastName }) => {
        const userData: any = { email, password };
        if (firstName) userData.firstName = firstName;
        if (lastName) userData.lastName = lastName;
        
        return this.authService.signup(userData).pipe(
          map((response) =>
            AuthActions.signupSuccess({
              user: response as any, // Type casting may need adjustment based on actual response
              email: response.email
            })
          ),
          catchError((error) => of(AuthActions.signupFailure({ error: error.message })))
        );
      })
    );
  });

  logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        this.authService.logout();
      }),
      map(() => AuthActions.logoutSuccess())
    );
  });

  verifyToken$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.verifyToken),
      switchMap(() =>
        this.authService.verifyToken().pipe(
          map((isValid) => {
            if (isValid) {
              const user = this.authService.getCurrentUser();
              const token = this.authService.getToken();
              const refreshToken = this.authService.getRefreshToken();
              
              if (user) {
                // Dispatch login success to restore full auth state
                return AuthActions.loginSuccess({
                  user,
                  token: token || '',
                  refreshToken: refreshToken || undefined
                });
              } else {
                return AuthActions.verifyTokenFailure({ error: 'No user data available' });
              }
            } else {
              return AuthActions.verifyTokenFailure({ error: 'Token verification failed' });
            }
          }),
          catchError((error) => of(AuthActions.verifyTokenFailure({ error: error.message })))
        )
      )
    );
  });

  refreshToken$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      switchMap(() =>
        this.authService.refreshToken().pipe(
          map((response) =>
            AuthActions.refreshTokenSuccess({
              token: response.access_token,
              refreshToken: response.refreshToken
            })
          ),
          catchError((error) => of(AuthActions.refreshTokenFailure({ error: error.message })))
        )
      )
    );
  });

  googleLogin$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.googleLogin),
      tap(() => {
        this.authService.initiateGoogleLogin();
      }),
      // Note: Google login success/failure will be handled through a callback mechanism
      // This effect just initiates the login flow
      map(() => AuthActions.googleLogin())
    );
  });

  // Add effect to navigate to dashboard after Google login success
  googleLoginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.googleLoginSuccess),
      tap(() => {
        this.router.navigate(['/dashboard']);
      })
    ),
    { dispatch: false }
  );

  loadUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loadUser),
      map(() => {
        const user = this.authService.getCurrentUser();
        if (user) {
          return AuthActions.loadUserSuccess({ user });
        } else {
          return AuthActions.loadUserFailure({ error: 'No user found' });
        }
      })
    );
  });

  forgotPassword$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.forgotPassword),
      switchMap(({ email }) =>
        this.authService.forgotPassword(email).pipe(
          map((response) =>
            AuthActions.forgotPasswordSuccess({
              message: response.message
            })
          ),
          catchError((error) => of(AuthActions.forgotPasswordFailure({ error: error.message })))
        )
      )
    );
  });

  resetPassword$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      switchMap(({ token, newPassword }) =>
        this.authService.resetPassword(token, newPassword).pipe(
          map((response) =>
            AuthActions.resetPasswordSuccess({
              message: response.message
            })
          ),
          catchError((error) => of(AuthActions.resetPasswordFailure({ error: error.message })))
        )
      )
    );
  });
}