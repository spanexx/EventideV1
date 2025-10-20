import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import * as AuthActions from '../actions/auth.actions';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  login$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.login),
      tap(({ email }) => console.debug('[AuthEffects] login dispatched', { email })),
      switchMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          tap(() => console.debug('[AuthEffects] login API call succeeded')),
          map((response) =>
            AuthActions.loginSuccess({
              user: response as any, // Type casting may need adjustment based on actual response
              token: response.access_token,
              refreshToken: response.refreshToken
            })
          ),
          catchError((error) => {
            console.error('[AuthEffects] login failed', error);
            return of(AuthActions.loginFailure({ error: error.message }));
          })
        )
      )
    );
  });

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(() => {
        console.info('[AuthEffects] loginSuccess, navigating to /dashboard');
        this.router.navigate(['/dashboard']);
      })
    ),
    { dispatch: false }
  );

  signup$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.signup),
      tap((a) => console.debug('[AuthEffects] signup dispatched', { email: a.email })),
      switchMap(({ email, password, firstName, lastName }) => {
        const userData: any = { email, password };
        if (firstName) userData.firstName = firstName;
        if (lastName) userData.lastName = lastName;
        
        return this.authService.signup(userData).pipe(
          tap(() => console.debug('[AuthEffects] signup API call succeeded')),
          map((response) =>
            AuthActions.signupSuccess({
              user: response as any, // Type casting may need adjustment based on actual response
              email: response.email
            })
          ),
          catchError((error) => {
            console.error('[AuthEffects] signup failed', error);
            return of(AuthActions.signupFailure({ error: error.message }));
          })
        );
      })
    );
  });

  signupSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.signupSuccess),
      tap(({ email }) => {
        console.info('[AuthEffects] signupSuccess, showing verification message and navigating to login');
        // Show success message to user about email verification
        this.notificationService.success(
          `Account created successfully! Please check your email (${email}) for a verification link before logging in.`,
          { duration: 8000 }
        );
        this.router.navigate(['/auth/login'], { 
          queryParams: { 
            message: 'Please verify your email before logging in',
            email: email 
          } 
        });
      })
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.logout),
      tap(() => {
        console.info('[AuthEffects] logout dispatched, calling AuthService.logout');
        this.authService.logout();
        
        // Trigger full app refresh after logout
        console.info('[AuthEffects] Triggering full app refresh after logout');
        window.location.reload();
      }),
      map(() => {
        console.info('[AuthEffects] logoutSuccess dispatched');
        return AuthActions.logoutSuccess();
      })
    );
  });

  verifyToken$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.verifyToken),
      tap(() => console.debug('[AuthEffects] verifyToken dispatched')),
      switchMap(() =>
        this.authService.verifyToken().pipe(
          map((isValid) => {
            console.debug('[AuthEffects] verifyToken result', { isValid });
            if (isValid) {
              const user = this.authService.getCurrentUser();
              const token = this.authService.getToken();
              const refreshToken = this.authService.getRefreshToken();
              
              if (user) {
                // Dispatch login success to restore full auth state
                console.debug('[AuthEffects] verifyToken succeeded, restoring user from storage');
                return AuthActions.loginSuccess({
                  user,
                  token: token || '',
                  refreshToken: refreshToken || undefined
                });
              } else {
                console.warn('[AuthEffects] verifyToken valid but no user data available');
                return AuthActions.verifyTokenFailure({ error: 'No user data available' });
              }
            } else {
              console.warn('[AuthEffects] verifyToken failed');
              return AuthActions.verifyTokenFailure({ error: 'Token verification failed' });
            }
          }),
          catchError((error) => {
            console.error('[AuthEffects] verifyToken error', error);
            return of(AuthActions.verifyTokenFailure({ error: error.message }));
          })
        )
      )
    );
  });

  refreshToken$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.refreshToken),
      tap(() => console.debug('[AuthEffects] refreshToken dispatched')),
      switchMap(() =>
        this.authService.refreshToken().pipe(
          tap(() => console.debug('[AuthEffects] refreshToken API call succeeded')),
          map((response) =>
            AuthActions.refreshTokenSuccess({
              token: response.access_token,
              refreshToken: response.refreshToken
            })
          ),
          catchError((error) => {
            console.error('[AuthEffects] refreshToken failed', error);
            return of(AuthActions.refreshTokenFailure({ error: error.message }));
          })
        )
      )
    );
  });

  googleLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.googleLogin),
      tap(() => {
        console.info('[AuthEffects] googleLogin dispatched, initiating Google login');
        this.authService.initiateGoogleLogin();
      })
    ),
    { dispatch: false }
  );

  // Add effect to navigate to dashboard after Google login success
  googleLoginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.googleLoginSuccess),
      tap(() => {
        console.info('[AuthEffects] googleLoginSuccess, navigating to /dashboard');
        this.router.navigate(['/dashboard']);
      })
    ),
    { dispatch: false }
  );

  loadUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.loadUser),
      tap(() => console.debug('[AuthEffects] loadUser dispatched')),
      map(() => {
        const user = this.authService.getCurrentUser();
        if (user) {
          console.debug('[AuthEffects] loadUser succeeded');
          return AuthActions.loadUserSuccess({ user });
        } else {
          console.warn('[AuthEffects] loadUser found no user');
          return AuthActions.loadUserFailure({ error: 'No user found' });
        }
      })
    );
  });

  forgotPassword$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.forgotPassword),
      tap(({ email }) => console.debug('[AuthEffects] forgotPassword dispatched', { email })),
      switchMap(({ email }) =>
        this.authService.forgotPassword(email).pipe(
          tap(() => console.debug('[AuthEffects] forgotPassword API call succeeded')),
          map((response) =>
            AuthActions.forgotPasswordSuccess({
              message: response.message
            })
          ),
          catchError((error) => {
            console.error('[AuthEffects] forgotPassword failed', error);
            return of(AuthActions.forgotPasswordFailure({ error: error.message }));
          })
        )
      )
    );
  });

  resetPassword$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      tap(() => console.debug('[AuthEffects] resetPassword dispatched')),
      switchMap(({ token, newPassword }) =>
        this.authService.resetPassword(token, newPassword).pipe(
          tap(() => console.debug('[AuthEffects] resetPassword API call succeeded')),
          map((response) =>
            AuthActions.resetPasswordSuccess({
              message: response.message
            })
          ),
          catchError((error) => {
            console.error('[AuthEffects] resetPassword failed', error);
            return of(AuthActions.resetPasswordFailure({ error: error.message }));
          })
        )
      )
    );
  });

  verifyEmail$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.verifyEmail),
      tap(({ token }) => console.debug('[AuthEffects] verifyEmail dispatched', { token: token.substring(0, 10) + '...' })),
      switchMap(({ token }) =>
        this.authService.verifyEmailWithToken(token).pipe(
          tap(() => console.debug('[AuthEffects] verifyEmail API call succeeded')),
          map((response) =>
            AuthActions.verifyEmailSuccess({
              message: response.message
            })
          ),
          catchError((error) => {
            console.error('[AuthEffects] verifyEmail failed', error);
            return of(AuthActions.verifyEmailFailure({ error: error.message }));
          })
        )
      )
    );
  });

  verifyEmailSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verifyEmailSuccess),
      tap(({ message }) => {
        console.info('[AuthEffects] verifyEmailSuccess, navigating to login with success message');
        this.notificationService.success(`${message}. You can now log in to your account.`);
        this.router.navigate(['/auth/login'], { 
          queryParams: { 
            message: 'Email verified successfully! You can now log in.',
            verified: 'true'
          } 
        });
      })
    ),
    { dispatch: false }
  );

  refreshUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.refreshUser),
      tap(() => console.debug('[AuthEffects] refreshUser dispatched - fetching fresh user data')),
      switchMap(() =>
        this.authService.fetchUserData().pipe(
          tap((user) => console.debug('[AuthEffects] refreshUser API call succeeded', user)),
          map((user) => AuthActions.refreshUserSuccess({ user })),
          catchError((error) => {
            console.error('[AuthEffects] refreshUser failed', error);
            return of(AuthActions.refreshUserFailure({ error: error.message }));
          })
        )
      )
    );
  });

  updateUser$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AuthActions.updateUser),
      tap(({ updates }) => console.debug('[AuthEffects] updateUser dispatched', updates)),
      switchMap(({ updates }) =>
        this.authService.updateCurrentUser(updates).pipe(
          tap((user) => console.debug('[AuthEffects] updateUser API call succeeded', user)),
          map((user) => AuthActions.updateUserSuccess({ user })),
          catchError((error) => {
            console.error('[AuthEffects] updateUser failed', error);
            return of(AuthActions.updateUserFailure({ error: error.message }));
          })
        )
      )
    );
  });
}