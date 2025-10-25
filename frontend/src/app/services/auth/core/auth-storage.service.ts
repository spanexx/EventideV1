import { Injectable } from '@angular/core';
import { LoginResponse, RefreshTokenResponse } from '../../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Persist tokens from login/refresh responses
  setSession(response: LoginResponse | RefreshTokenResponse): void {
    console.log('[AuthStorageService] setSession called');
    if (response.access_token) {
      localStorage.setItem(this.TOKEN_KEY, response.access_token);
    }
    if ('refreshToken' in response && response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
  }

  clearSession(): void {
    console.log('[AuthStorageService] clearSession called');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
}
