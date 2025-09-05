import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      if (error.status === 401 && !authReq.url.includes('/auth/refresh')) {
        // Attempt to refresh token
        return authService.refreshToken().pipe(
          switchMap((response) => {
            // Retry the original request with the new token
            const newAuthReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.access_token}`
              }
            });
            return next(newAuthReq);
          }),
          catchError((refreshError) => {
            // If refresh fails, logout the user
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};