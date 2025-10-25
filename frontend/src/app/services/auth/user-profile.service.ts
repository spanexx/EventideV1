import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { authApi } from './auth.api';
import { storage } from './storage.util';
import { User } from './auth.models';
import { normalizeUser } from './user-normalizer.util';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly USER_KEY = 'auth_user';

  constructor(private http: HttpClient) {}

  /**
   * Fetch current user data
   */
  fetchUserData(): Observable<User> {
    console.log('[UserProfileService] fetchUserData called');
    return authApi.getMe(this.http, environment.apiUrl).pipe(
      map((response: any) => normalizeUser(response?.user ?? response)),
      tap((user) => {
        console.log('[UserProfileService] user fetched:', user);
        storage.setJSON(this.USER_KEY, user);
      }),
      catchError((error) => {
        if (error.status === 404) {
          console.warn('[UserProfileService] /users/me returned 404; treating as unauthenticated');
          return this.handleError(error);
        }
        return this.handleError(error);
      }),
    );
  }

  /**
   * Update current user's profile
   */
  updateCurrentUser(updates: Partial<User>): Observable<User> {
    console.log('[UserProfileService] updateCurrentUser called with updates:', Object.keys(updates));
    // Check if business-related fields are being updated
    const businessFields = [
      'businessName',
      'bio',
      'contactPhone',
      'services',
      'categories',
      'customCategories',
      'availableDurations',
      'locationDetails',
    ];
    const hasBusinessFields = businessFields.some((field) => updates.hasOwnProperty(field));

    // For business settings, use the /me endpoint which authenticates via token
    if (hasBusinessFields) {
      return authApi.patchMeBusiness(this.http, environment.apiUrl, updates).pipe(
        map((user) => normalizeUser(user)),
        tap((user) => {
          console.log('[UserProfileService] business profile updated');
          storage.setJSON(this.USER_KEY, user);
        }),
        catchError(this.handleError),
      );
    } else {
      // For regular user updates, we need the user ID
      const current = JSON.parse(localStorage.getItem(this.USER_KEY) || 'null');
      if (!current || !current.id) {
        // Return an observable error instead of throwing synchronously - caller can subscribe
        return this.handleError(new Error('No current user available to update'));
      }

      const id = current.id;
      return authApi.patchUser(this.http, environment.apiUrl, id, updates).pipe(
        map((user) => normalizeUser(user)),
        tap((user) => {
          console.log('[UserProfileService] profile updated for user:', id);
          storage.setJSON(this.USER_KEY, user);
        }),
        catchError(this.handleError),
      );
    }
  }

  private handleError = (error: any): Observable<never> => {
    console.error('[UserProfileService] An error occurred:', error);
    throw error;
  };
}
