import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { authApi } from '../../auth/auth.api';
import { tokenUtils } from '../../auth/token.util';
import { LoginResponse, RefreshTokenResponse, SignupResponse, User } from '../../auth/auth.models';
import { AuthStorageService } from './auth-storage.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthCoreService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authStorage: AuthStorageService
  ) {}

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return authApi.postLogin(this.http, this.API_URL, email, password).pipe(
      tap((response) => {
        console.log('response', response);
        console.log('email', email);
        console.log('password', password);
        this.authStorage.setSession(response);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError(this.handleError),
    );
  }

  /**
   * Signup a new user
   */
  signup(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Observable<SignupResponse> {
    return this.http
      .post<SignupResponse>(`${this.API_URL}/signup`, userData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Logout the user
   */
  logout(): void {
    this.authStorage.clearSession();
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return this.authStorage.getToken();
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): string | null {
    return this.authStorage.getRefreshToken();
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    console.log('AuthCoreService: Checking if user is authenticated');
    const result = this.hasValidToken();
    console.log('AuthCoreService: isAuthenticated result:', result);
    return result;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    return tokenUtils.isExpired(token);
  }

  private handleError = (error: any): Observable<never> => {
    console.error('AuthCoreService: An error occurred:', error);

    // Handle specific error cases
    if (error.status === 401) {
      this.logout();
      return throwError(
        () => new Error('Invalid credentials. Please check your email and password.'),
      );
    }

    if (error.status === 409) {
      return throwError(() => new Error('An account with this email already exists.'));
    }

    if (error.status === 429) {
      return throwError(() => new Error('Too many requests. Please try again later.'));
    }

    // Generic error message
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  };
}
