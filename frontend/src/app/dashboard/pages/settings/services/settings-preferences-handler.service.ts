import { Injectable, signal, computed } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SettingsService, UserPreferences } from '../settings.service';

/**
 * Handles preferences state and operations
 */
@Injectable()
export class SettingsPreferencesHandler {
  private defaultPreferences: UserPreferences = {
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

  private preferencesState = signal<UserPreferences>(this.defaultPreferences);
  private workingHoursUpdate$ = new Subject<{ type: 'start' | 'end'; value: string }>();

  preferences = computed(() => {
    const prefs = this.preferencesState();
    return {
      ...this.defaultPreferences,
      ...prefs,
      notifications: {
        ...this.defaultPreferences.notifications,
        ...prefs?.notifications,
      },
      calendar: {
        ...this.defaultPreferences.calendar,
        ...prefs?.calendar,
        workingHours: {
          ...this.defaultPreferences.calendar.workingHours,
          ...prefs?.calendar?.workingHours,
        },
      },
      privacy: {
        ...this.defaultPreferences.privacy,
        ...prefs?.privacy,
      },
      booking: {
        ...this.defaultPreferences.booking,
        ...prefs?.booking,
      },
      bookingApprovalMode:
        prefs?.bookingApprovalMode ?? (prefs?.booking?.autoConfirmBookings ? 'auto' : 'manual'),
    };
  });

  private loadingSignal = signal(false);
  private savingPreferencesSignal = signal(false);
  
  loading: Observable<boolean>;
  savingPreferences: Observable<boolean>;

  hasChanges = computed(() => {
    const current = this.settingsService.getCurrentPreferences();
    const signalValue = this.preferences();
    return JSON.stringify(current) !== JSON.stringify(signalValue);
  });

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
  ) {
    // Convert signals to observables
    this.loading = toObservable(this.loadingSignal);
    this.savingPreferences = toObservable(this.savingPreferencesSignal);
    
    // Setup debounced working hours updates
    this.workingHoursUpdate$
      .pipe(debounceTime(300))
      .subscribe(({ type, value }) => {
        this.processWorkingHoursUpdate(type, value);
      });
  }

  setPreferences(prefs: UserPreferences): void {
    this.preferencesState.set(prefs);
  }

  setLoading(value: boolean): void {
    this.loadingSignal.set(value);
  }

  setSavingPreferences(value: boolean): void {
    this.savingPreferencesSignal.set(value);
  }

  updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ): void {
    console.debug('[SettingsPreferencesHandler] Updating preference', key, value);
    
    if (key === 'bookingApprovalMode') {
      const autoConfirm = (value as string) === 'auto';
      this.preferencesState.update((prefs) => ({
        ...prefs,
        bookingApprovalMode: value as 'auto' | 'manual',
        booking: {
          ...(prefs.booking as any),
          autoConfirmBookings: autoConfirm,
        },
      }));
    } else {
      this.preferencesState.update((prefs) => ({
        ...prefs,
        [key]: value,
      }));
    }
  }

  updateNestedPreference<
    K extends keyof UserPreferences,
    NK extends keyof Required<UserPreferences>[K],
  >(key: K, nestedKey: NK, value: Required<UserPreferences>[K][NK]): void {
    console.debug('[SettingsPreferencesHandler] Updating nested preference', key, nestedKey, value);
    
    if (key === 'booking' && (nestedKey as string) === 'autoConfirmBookings') {
      const autoConfirm = !!value as unknown as boolean;
      this.preferencesState.update((prefs) => ({
        ...prefs,
        booking: {
          ...(prefs.booking as any),
          autoConfirmBookings: autoConfirm,
        },
        bookingApprovalMode: autoConfirm ? 'auto' : 'manual',
      }));
      return;
    }

    this.preferencesState.update((prefs) => ({
      ...prefs,
      [key]: {
        ...(prefs[key] as any),
        [nestedKey]: value,
      },
    }));
  }

  updateWorkingHours(type: 'start' | 'end', value: string): void {
    this.workingHoursUpdate$.next({ type, value });
  }

  private processWorkingHoursUpdate(type: 'start' | 'end', value: string): void {
    console.debug('[SettingsPreferencesHandler] Processing working hours update', type, value);
    
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      this.snackBar.open('Please enter a valid time in 24-hour format (HH:mm)', 'Close', {
        duration: 3000,
      });
      return;
    }

    const currentPrefs = this.preferences();
    const start = type === 'start' ? value : currentPrefs.calendar.workingHours.start;
    const end = type === 'end' ? value : currentPrefs.calendar.workingHours.end;

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime >= endTime) {
      this.snackBar.open('Working hours start must be before end time', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.preferencesState.update((prefs) => ({
      ...prefs,
      calendar: {
        ...prefs.calendar,
        workingHours: {
          ...prefs.calendar.workingHours,
          [type]: value,
        },
      },
    }));
  }

  cleanup(): void {
    this.workingHoursUpdate$.complete();
  }
}
