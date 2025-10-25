import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { authApi } from './auth/auth.api';
import { tokenUtils } from './auth/token.util';
import { storage } from './auth/storage.util';
import { LoginResponse, RefreshTokenResponse, SignupResponse, User } from './auth/auth.models';
import { normalizeUser } from './auth/user-normalizer.util';
import { EmailAuthService } from './auth/email-auth.service';
import { GoogleAuthService } from './auth/google-auth.service';
import { UserProfileService } from './auth/user-profile.service';
import { handleAuthError } from './auth/auth-error.util';
export type { LoginResponse as AuthLoginResponse, RefreshTokenResponse as AuthRefreshTokenResponse, SignupResponse as AuthSignupResponse, User } from './auth/auth.models';

// Types imported from './auth/auth.models'

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private emailAuthService: EmailAuthService,
    private googleAuthService: GoogleAuthService,
    private userProfileService: UserProfileService
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
        this.setSession(response);
      }),
      catchError(handleAuthError),
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
      .pipe(catchError(handleAuthError));
  }

  /**
   * Logout the user
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Refresh the authentication token
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return authApi.postRefresh(this.http, this.API_URL, refreshToken).pipe(
      tap((response) => {
        this.setSession(response);
      }),
      catchError(handleAuthError),
    );
  }

  /**
   * Verify the current token
   */
  verifyToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return new Observable((observer) => {
        observer.next(false);
        observer.complete();
      });
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      return this.refreshToken().pipe(
        map(() => true),
        catchError(() => {
          this.logout();
          return [false];
        }),
      );
    }

    return authApi.getVerify(this.http, this.API_URL).pipe(
      tap((response) => {
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      }),
      map(() => true),
      catchError((error) => {
        // If token verification fails, try to refresh
        if (error.status === 401) {
          return this.refreshToken().pipe(
            map(() => true),
            catchError(() => {
              this.logout();
              return [false];
            }),
          );
        }

        this.logout();
        return [false];
      }),
    );
  }

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    console.log('AuthService: Checking if user is authenticated');
    const result = this.hasValidToken();
    console.log('AuthService: isAuthenticated result:', result);
    return result;
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.getUserFromStorage();
  }

  /**
   * Fetch current user data
   */
  fetchUserData(): Observable<User> {
    return this.userProfileService.fetchUserData();
  }
  /**
   * Update current user's profile (firstName, lastName, etc.)
   */
  updateCurrentUser(updates: Partial<User>): Observable<User> {
    return this.userProfileService.updateCurrentUser(updates);
  }

  /**
   * Initiate Google OAuth login
   */
  initiateGoogleLogin(): void {
    return this.googleAuthService.initiateGoogleLogin();
  }

  /**
   * Handle Google OAuth callback
   */
  handleGoogleCallback(token: string, userData: string): void {
    return this.googleAuthService.handleGoogleCallback(token, userData);
  }

  /**
   * Verify email address
   */
  verifyEmail(token: string): Observable<void> {
    return this.emailAuthService.verifyEmail(token);
  }

  /**
   * Verify email with token
   */
  verifyEmailWithToken(token: string): Observable<{ message: string }> {
    return this.emailAuthService.verifyEmailWithToken(token);
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(): Observable<void> {
    return this.emailAuthService.resendVerificationEmail();
  }

  /**
   * Request password reset
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.emailAuthService.forgotPassword(email);
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.emailAuthService.resetPassword(token, newPassword);
  }

  // Private methods

  private setSession(response: LoginResponse | RefreshTokenResponse): void {
    storage.set(this.TOKEN_KEY, response.access_token);

    // Store user data if available
    if ('userId' in response && response.userId) {
      const currentUser = this.currentUserSubject.value;
      const normalized = normalizeUser({ ...(currentUser ?? {}), id: response.userId });
      storage.setJSON(this.USER_KEY, normalized);
      this.currentUserSubject.next(normalized);
    }

    // Store refresh token if available
    if (response.refreshToken) {
      storage.set(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }

    this.isAuthenticatedSubject.next(true);
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    return !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    return tokenUtils.isExpired(token);
  }

  private getUserFromStorage(): User | null {
    const raw = storage.getJSON<any>(this.USER_KEY);
    return raw ? normalizeUser(raw) : null;
  }

  
}
