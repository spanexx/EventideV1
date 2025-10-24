import { Component, OnInit, effect, inject, DestroyRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { SettingsService, UserPreferences } from './settings.service';
import { AuthService, User as AuthUser } from '../../../services/auth.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  selectUser,
  selectUserEmail,
  selectUserFullName,
} from '../../../auth/store/auth/selectors/auth.selectors';
import { Observable, Subject } from 'rxjs';
import {
  selectTheme,
  selectLanguage,
  selectTimezone,
  loadAppearancePreferences,
  updateTheme,
  updateLanguage,
  updateTimezone,
  updateAppearancePreferences,
} from '../../../store/appearance';
import * as AuthActions from '../../../auth/store/auth/actions/auth.actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Import the new components
import { ProfileSettingsComponent } from './components/profile-settings/profile-settings.component';
import { NotificationSettingsComponent } from './components/notification-settings/notification-settings.component';
import { AppearanceSettingsComponent } from './components/appearance-settings/appearance-settings.component';
import { CalendarSettingsComponent } from './components/calendar-settings/calendar-settings.component';
import { PrivacySettingsComponent } from './components/privacy-settings/privacy-settings.component';
import { BookingSettingsComponent } from './components/booking-settings/booking-settings.component';
import { LocalizationSettingsComponent } from './components/localization-settings/localization-settings.component';
import { BusinessSettingsComponent } from './components/business-settings/business-settings.component';

// Import services
import { SettingsProfileService } from './services/settings-profile.service';
import { SettingsBusinessService } from './services/settings-business.service';
import { SettingsPreferencesHandlerService } from './services/settings-preferences-handler.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatSnackBarModule,
    MatSelectModule,
    MatRadioModule,
    MatTabsModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    // Import the new components
    ProfileSettingsComponent,
    NotificationSettingsComponent,
    AppearanceSettingsComponent,
    CalendarSettingsComponent,
    PrivacySettingsComponent,
    BookingSettingsComponent,
    LocalizationSettingsComponent,
    BusinessSettingsComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  user$!: Observable<any>;
  userEmail$!: Observable<string>;
  userFullName$!: Observable<string>;

  // Destroy subject for memory leak prevention
  private destroy$ = new Subject<void>();

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
    private store: Store,
    private authService: AuthService,
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
    public profileService: SettingsProfileService,
    public businessService: SettingsBusinessService,
    public preferencesHandler: SettingsPreferencesHandlerService,
  ) {
    // Effect to sync service updates with local signal
    effect(() => {
      this.settingsService.preferences$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((prefs) => {
          this.preferencesHandler.setPreferences(prefs);
          // Ensure OnPush components update when preferences change (e.g., preserved payment)
          this.cdr.markForCheck();
        });
    });

    // Effect to sync appearance preferences from NgRx store with local signal
    effect(() => {
      this.store
        .select(selectTheme)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((theme) => {
          this.preferencesHandler.updatePreference('theme', theme as 'light' | 'dark' | 'system');
        });
    });

    effect(() => {
      this.store
        .select(selectLanguage)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((language) => {
          this.preferencesHandler.updatePreference('language', language as string);
        });
    });

    effect(() => {
      this.store
        .select(selectTimezone)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((timezone) => {
          this.preferencesHandler.updatePreference('timezone', timezone as string);
        });
    });
  }

  ngOnInit(): void {
    // Load appearance preferences from NgRx store first
    this.store.dispatch(loadAppearancePreferences());

    // Refresh user data from the API to ensure we have the latest business data
    this.store.dispatch(AuthActions.refreshUser());

    this.preferencesHandler.loadPreferences();

    // Initialize user data from store
    this.user$ = this.store.select(selectUser);
    this.userEmail$ = this.store.select(selectUserEmail);
    this.userFullName$ = this.store.select(selectUserFullName);
    this.user$ = this.authService.currentUser$;

    // Initialize business settings from current user
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        if (user) {
          this.businessService.updateFromUser(user);
        }
      });
  }

  public updateNestedPreference(key: string, nestedKey: string, value: any): void {
    // Bypass generics to avoid type issues
    (this.preferencesHandler.updateNestedPreference as any)(key, nestedKey, value);
  }

  public updatePreference(key: string, value: any): void {
    this.preferencesHandler.updatePreference(key as keyof UserPreferences, value);
  }

  public updateWorkingHours(type: string, value: string): void {
    this.preferencesHandler.updateWorkingHours(type as 'start' | 'end', value);
  }

  public addPaymentMethod(method: string): void {
    const currentPrefs = this.preferencesHandler.preferences();
    const existing = currentPrefs.payment.acceptedPaymentMethods || [];
    const updated = [...existing, method];
    this.preferencesHandler.updateNestedPreference('payment', 'acceptedPaymentMethods' as any, updated as any);
  }

  public removePaymentMethod(method: string): void {
    const currentPrefs = this.preferencesHandler.preferences();
    const existing = currentPrefs.payment.acceptedPaymentMethods || [];
    const updated = existing.filter((m) => m !== method);
    this.preferencesHandler.updateNestedPreference('payment', 'acceptedPaymentMethods' as any, updated as any);
  }

  // Helper methods for template event handling
  public handleNestedPreferenceChange(key: string, value: any): void {
    const nestedKey = Object.keys(value)[0];
    const nestedValue = Object.values(value)[0];
    this.updateNestedPreference(key, nestedKey, nestedValue);
  }

  public handleSimplePreferenceChange(key: string, value: any): void {
    this.updatePreference(key, value);
  }

  public handleWorkingHoursChange(type: string, value: string): void {
    this.updateWorkingHours(type, value);
  }

  public saveProfile(): void {
    this.profileService.saveProfile();
  }

  public saveBusinessSettings(): void {
    this.businessService.saveBusinessSettings();
  }

  public saveNotificationSettings(): void {
    this.preferencesHandler.saveNotificationSettings();
  }

  public saveAppearanceSettings(): void {
    this.preferencesHandler.saveAppearanceSettings();
  }

  public saveCalendarSettings(): void {
    this.preferencesHandler.saveCalendarSettings();
  }

  public savePrivacySettings(): void {
    this.preferencesHandler.savePrivacySettings();
  }

  public saveBookingSettings(): void {
    this.preferencesHandler.saveBookingSettings();
  }

  public saveLocalizationSettings(): void {
    this.preferencesHandler.saveLocalizationSettings();
  }

  public savePreferences(): void {
    this.preferencesHandler.savePreferences();
  }

  public resetToDefaults(): void {
    this.preferencesHandler.resetToDefaults();
  }
}
