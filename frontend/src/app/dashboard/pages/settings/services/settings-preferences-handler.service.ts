import { Injectable, signal, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { SettingsService, UserPreferences } from '../settings.service';
import { updateAppearancePreferences } from '../../../../store/appearance';

/**
 * Handles user preferences state and operations
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsPreferencesHandlerService {
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
    payment: {
      requirePaymentForBookings: false,
      hourlyRate: 5000,
      currency: 'usd',
      acceptedPaymentMethods: ['card'],
    },
    language: 'en',
    timezone: 'UTC',
  };

  private preferencesState = signal<UserPreferences>(this.defaultPreferences);
  loading = signal(false);
  loading$ = computed(() => this.loading());

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
      payment: {
        ...this.defaultPreferences.payment,
        ...prefs?.payment,
      },
      bookingApprovalMode:
        prefs?.bookingApprovalMode ?? (prefs?.booking?.autoConfirmBookings ? 'auto' : 'manual'),
    };
  });

  hasChanges = computed(() => {
    const current = this.settingsService.getCurrentPreferences();
    const signalValue = this.preferences();
    return JSON.stringify(current) !== JSON.stringify(signalValue);
  });

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
    private store: Store,
  ) {}

  setPreferences(prefs: UserPreferences): void {
    this.preferencesState.set(prefs);
  }

  updatePreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    if (key === 'theme') {
      this.preferencesState.update((prefs) => ({
        ...prefs,
        theme: value as 'light' | 'dark' | 'system',
      }));
    } else if (key === 'language') {
      this.preferencesState.update((prefs) => ({
        ...prefs,
        language: value as string,
      }));
    } else if (key === 'timezone') {
      this.preferencesState.update((prefs) => ({
        ...prefs,
        timezone: value as string,
      }));
    } else if (key === 'bookingApprovalMode') {
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

  private savePreferencesCommon(
    sectionName: string,
    updateSection: Partial<UserPreferences>,
  ): void {
    console.log(`📤 [SettingsPreferencesHandler] savePreferencesCommon called for: ${sectionName}`);
    console.log('📤 [SettingsPreferencesHandler] Update section:', JSON.stringify(updateSection, null, 2));
    
    this.loading.set(true);

    const currentPrefs = this.preferences();
    const allPrefs = {
      bookingApprovalMode: currentPrefs.bookingApprovalMode,
      notifications: currentPrefs.notifications,
      calendar: currentPrefs.calendar,
      privacy: currentPrefs.privacy,
      booking: currentPrefs.booking,
      payment: currentPrefs.payment,
      theme: currentPrefs.theme,
      language: currentPrefs.language,
      timezone: currentPrefs.timezone,
      ...updateSection,
    };

    console.log('📤 [SettingsPreferencesHandler] Full preferences being sent to backend:', JSON.stringify(allPrefs, null, 2));
    console.log('📤 [SettingsPreferencesHandler] Payment in full prefs:', JSON.stringify(allPrefs.payment, null, 2));

    this.settingsService.updatePreferences(allPrefs).subscribe({
      next: (updated: UserPreferences) => {
        console.log('📥 [SettingsPreferencesHandler] Received response from backend:', JSON.stringify(updated, null, 2));
        console.log('📥 [SettingsPreferencesHandler] Payment in response:', JSON.stringify(updated.payment, null, 2));
        
        // Guard: if backend response omits payment, preserve current payment
        const current = this.preferences();
        const merged: UserPreferences = {
          ...updated,
          payment: (updated as any).payment ?? current.payment,
        } as UserPreferences;
        if (!(updated as any).payment) {
          console.warn('[SettingsPreferencesHandler] payment missing in response; preserved current payment');
        }

        this.preferencesState.set(merged);
        console.log('✅ [SettingsPreferencesHandler] State updated with response');
        
        this.store.dispatch(
          updateAppearancePreferences({
            preferences: {
              theme: merged.theme,
              language: merged.language,
              timezone: merged.timezone,
            },
          }),
        );
        this.snackBar.open(`${sectionName} saved`, 'Close', { duration: 3000 });
        this.loading.set(false);
      },
      error: (err: Error) => {
        console.error('❌ [SettingsPreferencesHandler] Error saving preferences:', err);
        this.snackBar.open(`Error saving ${sectionName}`, 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  saveNotificationSettings(): void {
    this.savePreferencesCommon('Notification settings', {
      notifications: this.preferences().notifications,
    });
  }

  saveAppearanceSettings(): void {
    const currentPrefs = this.preferences();
    this.savePreferencesCommon('Appearance settings', {
      theme: currentPrefs.theme,
      language: currentPrefs.language,
      timezone: currentPrefs.timezone,
    });
  }

  saveCalendarSettings(): void {
    this.savePreferencesCommon('Calendar settings', {
      calendar: this.preferences().calendar,
    });
  }

  savePrivacySettings(): void {
    this.savePreferencesCommon('Privacy settings', {
      privacy: this.preferences().privacy,
    });
  }

  saveBookingSettings(): void {
    const bookingPrefs = this.preferences().booking;
    const paymentPrefs = this.preferences().payment;
    console.log('💾 [SettingsPreferencesHandler] saveBookingSettings called');
    console.log('💾 [SettingsPreferencesHandler] Booking preferences:', JSON.stringify(bookingPrefs, null, 2));
    console.log('💾 [SettingsPreferencesHandler] Payment preferences:', JSON.stringify(paymentPrefs, null, 2));
    
    this.savePreferencesCommon('Booking settings', {
      booking: bookingPrefs,
      payment: paymentPrefs,
    });
  }

  saveLocalizationSettings(): void {
    const currentPrefs = this.preferences();
    this.savePreferencesCommon('Localization settings', {
      language: currentPrefs.language,
      timezone: currentPrefs.timezone,
    });
  }

  updateWorkingHours(type: 'start' | 'end', value: string): void {
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

  loadPreferences(): void {
    this.loading.set(true);
    this.settingsService.getPreferences().subscribe({
      next: (prefs: UserPreferences) => {
        this.preferencesState.set(prefs);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.snackBar.open('Error loading preferences', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  savePreferences(): void {
    this.loading.set(true);
    const currentPrefs = this.preferences();

    this.store.dispatch(
      updateAppearancePreferences({
        preferences: {
          theme: currentPrefs.theme,
          language: currentPrefs.language,
          timezone: currentPrefs.timezone,
        },
      }),
    );

    const allPrefs = {
      bookingApprovalMode: currentPrefs.bookingApprovalMode,
      notifications: currentPrefs.notifications,
      calendar: currentPrefs.calendar,
      privacy: currentPrefs.privacy,
      booking: currentPrefs.booking,
      payment: currentPrefs.payment,
      theme: currentPrefs.theme,
      language: currentPrefs.language,
      timezone: currentPrefs.timezone,
    };

    this.settingsService.updatePreferences(allPrefs).subscribe({
      next: (updated: UserPreferences) => {
        // Guard: if backend response omits payment, preserve current payment
        const current = this.preferences();
        const merged: UserPreferences = {
          ...updated,
          payment: (updated as any).payment ?? current.payment,
        } as UserPreferences;
        if (!(updated as any).payment) {
          console.warn('[SettingsPreferencesHandler] payment missing in response; preserved current payment');
        }
        this.preferencesState.set(merged);
        this.snackBar.open('Preferences saved successfully', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.snackBar.open('Error saving preferences', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  resetToDefaults(): void {
    this.loading.set(true);
    this.settingsService.resetPreferences().subscribe({
      next: (defaults: UserPreferences) => {
        this.preferencesState.set(defaults);
        this.snackBar.open('Preferences reset to defaults', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.snackBar.open('Error resetting preferences', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }
}
