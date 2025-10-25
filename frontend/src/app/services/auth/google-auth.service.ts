import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { authApi } from './auth.api';

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor() {}

  /**
   * Initiate Google OAuth login
   */
  initiateGoogleLogin(): void {
    console.log('[GoogleAuthService] initiateGoogleLogin called');
    // Redirect to Google OAuth endpoint
    const redirectUri = `${environment.frontendUrl}/auth/google/callback`;
    window.location.href = authApi.googleRedirectUrl(this.API_URL, redirectUri);
  }

  /**
   * Handle Google OAuth callback
   */
  handleGoogleCallback(token: string, userData: string): void {
    console.log('[GoogleAuthService] handleGoogleCallback called');
    try {
      // Decode user data from base64
      const decodedUserData = JSON.parse(atob(userData));

      // Set session with token and user data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(decodedUserData));

      console.log('[GoogleAuthService] Google auth completed successfully');
    } catch (error) {
      console.error('[GoogleAuthService] Error handling Google callback:', error);
      this.logout();
    }
  }

  private logout(): void {
    console.log('[GoogleAuthService] Clearing session on error');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
}
