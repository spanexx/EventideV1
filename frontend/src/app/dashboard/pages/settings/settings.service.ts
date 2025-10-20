import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UserPreferences {
  bookingApprovalMode: 'auto' | 'manual';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  calendar: {
    defaultView: 'day' | 'week' | 'month';
    firstDayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    workingHours: {
      start: string; // HH:mm format
      end: string; // HH:mm format
    };
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    accessCodeRotation: 'daily' | 'weekly' | 'monthly';
  };
  booking: {
    autoConfirmBookings: boolean;
  };
  language: string;
  timezone: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  bookingApprovalMode: 'auto',
  notifications: {
    email: true,
    sms: false,
    push: true,
  },
  theme: 'system',
  calendar: {
    defaultView: 'week',
    firstDayOfWeek: 1,
    workingHours: {
      start: '09:00',
      end: '17:00',
    },
  },
  privacy: {
    profileVisibility: 'public',
    accessCodeRotation: 'weekly',
  },
  booking: {
    autoConfirmBookings: true,
  },
  language: 'en',
  timezone: 'UTC',
};

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly STORAGE_KEY = 'user_preferences';
  private apiUrl = `${environment.apiUrl}/users/me/preferences`;
  private preferencesSubject = new BehaviorSubject<UserPreferences>(this.loadFromStorage());

  public preferences$ = this.preferencesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialPreferences();
  }

  private loadFromStorage(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    } catch (e) {
      console.error('Error loading preferences from storage:', e);
      return DEFAULT_PREFERENCES;
    }
  }

  private saveToStorage(preferences: UserPreferences): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.error('Error saving preferences to storage:', e);
    }
  }

  private loadInitialPreferences(): void {
    // First load from storage (already done in constructor)
    // Then try to get from API
    this.getPreferences()
      .pipe(
        tap((preferences) => {
          this.preferencesSubject.next(preferences);
          this.saveToStorage(preferences);
        }),
      )
      .subscribe({
        error: (err) => console.error('Error loading initial preferences:', err),
      });
  }

  public getPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.apiUrl).pipe(
      tap((preferences) => {
        this.preferencesSubject.next(preferences);
        this.saveToStorage(preferences);
      }),
      catchError((error: HttpErrorResponse) => {
        // If API fails, use cached preferences
        console.warn('Failed to fetch preferences from API, using cached:', error);
        return of(this.loadFromStorage());
      }),
    );
  }

  public updatePreferences(preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.patch<UserPreferences>(this.apiUrl, preferences).pipe(
      tap((updatedPreferences) => {
        this.preferencesSubject.next(updatedPreferences);
        this.saveToStorage(updatedPreferences);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to update preferences:', error);
        // Don't update storage on error
        throw error;
      }),
    );
  }

  public resetPreferences(): Observable<UserPreferences> {
    return this.http.post<UserPreferences>(`${this.apiUrl}/reset`, {}).pipe(
      tap((defaultPreferences) => {
        this.preferencesSubject.next(defaultPreferences);
        this.saveToStorage(defaultPreferences);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Failed to reset preferences:', error);
        // On reset error, revert to defaults but don't save to storage
        const defaults = { ...DEFAULT_PREFERENCES };
        this.preferencesSubject.next(defaults);
        throw error;
      }),
    );
  }

  // Helper method to get current value synchronously
  public getCurrentPreferences(): UserPreferences {
    return this.preferencesSubject.getValue();
  }

  // Helper method to check if we have cached preferences
  public hasCachedPreferences(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }

  public updateBusinessSettings(businessSettings: any): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/users/me/business`, businessSettings);
  }
}
