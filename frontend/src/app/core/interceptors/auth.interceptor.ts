import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let authReq = req;
  // Only add auth header for requests to our API
  if (token && req.url.startsWith(environment.apiUrl)) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError(error => {
      // Only handle 401 errors for our API endpoints, not external APIs like OpenRouter
      if (error.status === 401 && 
          req.url.startsWith(environment.apiUrl) && 
          !authReq.url.includes('/auth/refresh')) {
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