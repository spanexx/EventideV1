import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { authApi } from './auth.api';
import { handleAuthError } from './auth-error.util';

@Injectable({
  providedIn: 'root',
})
export class EmailAuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Verify email address
   */
  verifyEmail(token: string): Observable<void> {
    console.log('[EmailAuthService] verifyEmail called with token:', token.substring(0, 20) + '...');
    return authApi.verifyEmail(this.http, this.API_URL, token).pipe(catchError(handleAuthError));
  }

  /**
   * Verify email with token (direct API call)
   */
  verifyEmailWithToken(token: string): Observable<{ message: string }> {
    console.log('[EmailAuthService] verifyEmailWithToken called with token:', token.substring(0, 20) + '...');
    return this.http
      .post<{ message: string }>(`${this.API_URL}/verify-email`, { token })
      .pipe(catchError(handleAuthError));
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(): Observable<void> {
    console.log('[EmailAuthService] resendVerificationEmail called');
    return authApi.resendVerification(this.http, this.API_URL).pipe(catchError(handleAuthError));
  }

  /**
   * Request password reset
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    console.log('[EmailAuthService] forgotPassword called for email:', email);
    return authApi.forgotPassword(this.http, this.API_URL, email).pipe(catchError(handleAuthError));
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    console.log('[EmailAuthService] resetPassword called with token:', token.substring(0, 20) + '...');
    return authApi.resetPassword(this.http, this.API_URL, token, newPassword).pipe(catchError(handleAuthError));
  }

}
