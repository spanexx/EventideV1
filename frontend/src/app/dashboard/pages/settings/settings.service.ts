import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap, distinctUntilChanged, shareReplay, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated } from '../../../auth/store/auth/selectors/auth.selectors';

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
  payment: {
    requirePaymentForBookings: boolean;
    hourlyRate?: number;
    currency: string;
    acceptedPaymentMethods?: string[];
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
  payment: {
    requirePaymentForBookings: false,
    hourlyRate: 5000,
    currency: 'usd',
    acceptedPaymentMethods: ['card'],
  },
  language: 'en',
  timezone: 'UTC',
};

interface StoredPreferences {
  version: number;
  data: UserPreferences;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly STORAGE_KEY = 'user_preferences';
  private readonly VERSION = 1;
  private apiUrl = `${environment.apiUrl}/users/me/preferences`;
  private preferencesSubject = new BehaviorSubject<UserPreferences>(this.loadFromStorage());
  private isAuthenticated = false;
  private preferencesLoadedFromApi = false;
  private preferencesCache$?: Observable<UserPreferences>;

  public preferences$ = this.preferencesSubject.asObservable();

  constructor(private http: HttpClient, private store: Store) {
    this.store
      .select(selectIsAuthenticated)
      .pipe(distinctUntilChanged())
      .subscribe((isAuthenticated) => {
        this.isAuthenticated = isAuthenticated;

        if (isAuthenticated) {
          this.loadInitialPreferences();
        } else {
          this.preferencesLoadedFromApi = false;
          const cached = this.loadFromStorage();
          this.preferencesSubject.next(cached);
        }
      });
  }

  private loadFromStorage(): UserPreferences {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return DEFAULT_PREFERENCES;
      
      const stored: StoredPreferences = JSON.parse(raw);
      if (stored.version !== this.VERSION) {
        localStorage.removeItem(this.STORAGE_KEY);
        return DEFAULT_PREFERENCES;
      }
      return stored.data;
    } catch (e) {
      console.error('Error loading preferences from storage:', e);
      return DEFAULT_PREFERENCES;
    }
  }

  private saveToStorage(preferences: UserPreferences): void {
    try {
      const stored: StoredPreferences = {
        version: this.VERSION,
        data: preferences
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {
      console.error('Error saving preferences to storage:', e);
    }
  }

  private loadInitialPreferences(): void {
    if (this.preferencesLoadedFromApi) {
      return;
    }

    // First load from storage (already done in constructor)
    // Then try to get from API
    this.getPreferences()
      .pipe(
        tap((preferences) => {
          this.preferencesSubject.next(preferences);
          this.saveToStorage(preferences);
          this.preferencesLoadedFromApi = true;
        }),
      )
      .subscribe({
        error: (err) => console.error('Error loading initial preferences:', err),
      });
  }

  public getPreferences(): Observable<UserPreferences> {
    // Don't make API call if not authenticated
    if (!this.isAuthenticated) {
      return of(this.loadFromStorage());
    }

    // Use cached observable if available
    if (!this.preferencesCache$) {
      this.preferencesCache$ = this.http.get<UserPreferences>(this.apiUrl).pipe(
        map((preferences) => {
          // Guard: backend may omit payment in response
          const current = this.preferencesSubject.getValue();
          const merged: UserPreferences = {
            ...preferences,
            payment: (preferences as any).payment ?? current.payment ?? DEFAULT_PREFERENCES.payment,
          } as UserPreferences;

          console.log('[SettingsService] getPreferences response:', JSON.stringify(preferences));
          if (!(preferences as any).payment) {
            console.warn('[SettingsService] payment missing in GET response; preserving current/default payment');
          }
          return merged;
        }),
        tap((preferences) => {
          this.preferencesSubject.next(preferences);
          this.saveToStorage(preferences);
        }),
        catchError((error: HttpErrorResponse) => {
          console.warn('Failed to fetch preferences from API, using cached:', error);
          return of(this.loadFromStorage());
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.preferencesCache$;
  }

  public updatePreferences(preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    // Invalidate cache on update
    this.preferencesCache$ = undefined;
    
    return this.http.patch<UserPreferences>(this.apiUrl, preferences).pipe(
      map((updatedPreferences) => {
        // Guard: if backend response omits payment, preserve current payment to avoid UI flip
        const current = this.preferencesSubject.getValue();
        const merged: UserPreferences = {
          ...updatedPreferences,
          payment: (updatedPreferences as any).payment ?? current.payment,
        } as UserPreferences;

        // Debug logging
        console.log('[SettingsService] updatePreferences response:', JSON.stringify(updatedPreferences));
        if (!(updatedPreferences as any).payment) {
          console.warn('[SettingsService] payment was missing in response; preserving current payment');
        }

        this.preferencesSubject.next(merged);
        this.saveToStorage(merged);
        return merged;
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
