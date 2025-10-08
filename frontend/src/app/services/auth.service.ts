import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  access_token: string;
  refreshToken?: string;
  userId: string;
  expiresIn: string;
}

export interface SignupResponse {
  userId: string;
  email: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refreshToken?: string;
  userId: string;
  expiresIn: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
}

@Injectable({
  providedIn: 'root'
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

  constructor(private http: HttpClient) {}

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Signup a new user
   */
  signup(userData: { email: string; password: string; firstName?: string; lastName?: string }): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.API_URL}/signup`, userData)
      .pipe(
        catchError(this.handleError)
      );
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

    return this.http.post<RefreshTokenResponse>(`${this.API_URL}/refresh`, { refreshToken })
      .pipe(
        tap(response => {
          this.setSession(response);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Verify the current token
   */
  verifyToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return new Observable(observer => {
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
        })
      );
    }

    return this.http.get<{ user: User }>(`${this.API_URL}/verify`)
      .pipe(
        tap(response => {
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
              })
            );
          }
          
          this.logout();
          return [false];
        })
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
   * Handle Google OAuth callback
   */
  fetchUserData(): Observable<User> {
    return this.http.get<{ user: User }>(`${this.API_URL}/me`)
      .pipe(
        map(response => response.user),
        tap(user => {
          // Update user data in localStorage
          localStorage.setItem(this.USER_KEY, JSON.stringify(user));
          this.currentUserSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }
  handleGoogleCallback(token: string, userData: string): void {
    try {
      // Decode user data from base64
      const decodedUserData = JSON.parse(atob(userData));
      
      // Set session with token and user data
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(decodedUserData));
      
      this.currentUserSubject.next(decodedUserData);
      this.isAuthenticatedSubject.next(true);
    } catch (error) {
      console.error('Error handling Google callback:', error);
      this.logout();
    }
  }

  /**
   * Initiate Google OAuth login
   */
  initiateGoogleLogin(): void {
    // Redirect to Google OAuth endpoint
    const redirectUri = `${environment.frontendUrl}/auth/google/callback`;
    window.location.href = `${this.API_URL}/google?redirect=${encodeURIComponent(redirectUri)}`;
  }

  /**
   * Request password reset
   */
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, { email })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/reset-password`, { token, newPassword })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Verify email address
   */
  verifyEmail(token: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/verify-email`, { token })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Resend verification email
   */
  resendVerificationEmail(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/resend-verification`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Private methods

  private setSession(response: LoginResponse | RefreshTokenResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    
    // Store user data if available
    if ('userId' in response && response.userId) {
      const currentUser = this.currentUserSubject.value;
      let updatedUser: User;
      
      if (currentUser) {
        // Update existing user data
        updatedUser = { ...currentUser, id: response.userId };
      } else {
        // Create new user data from available information
        updatedUser = {
          id: response.userId,
          email: '', // Email will be updated when we get full user info
          firstName: '',
          lastName: '',
          picture: ''
        };
      }
      
      localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
    
    // Store refresh token if available
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    
    this.isAuthenticatedSubject.next(true);
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    return !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      return Math.floor(new Date().getTime() / 1000) >= expiry;
    } catch {
      return true;
    }
  }

  private getUserFromStorage(): User | null {
    const userString = localStorage.getItem(this.USER_KEY);
    return userString ? JSON.parse(userString) : null;
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    
    // Handle specific error cases
    if (error.status === 401) {
      this.logout();
      return throwError(() => new Error('Invalid credentials. Please check your email and password.'));
    }
    
    if (error.status === 409) {
      return throwError(() => new Error('An account with this email already exists.'));
    }
    
    if (error.status === 429) {
      return throwError(() => new Error('Too many requests. Please try again later.'));
    }
    
    // Generic error message
    return throwError(() => new Error('Something went wrong. Please try again later.'));
  }
}