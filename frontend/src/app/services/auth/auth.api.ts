import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, LoginResponse, SignupResponse, RefreshTokenResponse } from './auth.models';

export const authApi = {
  postLogin(http: HttpClient, apiUrl: string, email: string, password: string): Observable<LoginResponse> {
    return http.post<LoginResponse>(`${apiUrl}/login`, { email, password });
  },

  postSignup(http: HttpClient, apiUrl: string, userData: { email: string; password: string; firstName?: string; lastName?: string; }): Observable<SignupResponse> {
    return http.post<SignupResponse>(`${apiUrl}/signup`, userData);
  },

  postRefresh(http: HttpClient, apiUrl: string, refreshToken: string): Observable<RefreshTokenResponse> {
    return http.post<RefreshTokenResponse>(`${apiUrl}/refresh`, { refreshToken });
  },

  getVerify(http: HttpClient, apiUrl: string): Observable<{ user: User }> {
    return http.get<{ user: User }>(`${apiUrl}/verify`);
  },

  getMe(http: HttpClient, baseUrl: string): Observable<User | { user: User }> {
    return http.get<User | { user: User }>(`${baseUrl}/users/me`);
  },

  patchMeBusiness(http: HttpClient, baseUrl: string, updates: Partial<User>): Observable<User> {
    return http.patch<User>(`${baseUrl}/users/me/business`, updates);
  },

  patchUser(http: HttpClient, baseUrl: string, id: string, updates: Partial<User>): Observable<User> {
    return http.patch<User>(`${baseUrl}/users/${id}`, updates);
  },

  forgotPassword(http: HttpClient, apiUrl: string, email: string): Observable<{ message: string }> {
    return http.post<{ message: string }>(`${apiUrl}/forgot-password`, { email });
  },

  resetPassword(http: HttpClient, apiUrl: string, token: string, newPassword: string): Observable<{ message: string }> {
    return http.post<{ message: string }>(`${apiUrl}/reset-password`, { token, newPassword });
  },

  verifyEmail(http: HttpClient, apiUrl: string, token: string): Observable<void> {
    return http.post<void>(`${apiUrl}/verify-email`, { token });
  },

  resendVerification(http: HttpClient, apiUrl: string): Observable<void> {
    return http.post<void>(`${apiUrl}/resend-verification`, {});
  },

  googleRedirectUrl(apiUrl: string, redirectUri: string): string {
    return `${apiUrl}/google?redirect=${encodeURIComponent(redirectUri)}`;
  },
};
