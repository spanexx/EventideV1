import { Component, OnInit, signal, computed, effect } from '@angular/core';
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
import { Observable } from 'rxjs';
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
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-settings',
  standalone: true,
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
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
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

  // Computed signal that ensures all nested objects exist
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
      // Derive bookingApprovalMode from booking.autoConfirmBookings when not explicitly set
      bookingApprovalMode:
        prefs?.bookingApprovalMode ?? (prefs?.booking?.autoConfirmBookings ? 'auto' : 'manual'),
    };
  });
  loading = signal(false);

  // Computed signals for derived state
  hasChanges = computed(() => {
    const current = this.settingsService.getCurrentPreferences();
    const signalValue = this.preferences();
    return JSON.stringify(current) !== JSON.stringify(signalValue);
  });

  user$!: Observable<any>;
  userEmail$!: Observable<string>;
  userFullName$!: Observable<string>;
  // Local editable fields for profile
  firstName = signal<string>('');
  lastName = signal<string>('');
  savingProfile = signal(false);

  // Business settings fields
  businessName = signal<string>('');
  bio = signal<string>('');
  contactPhone = signal<string>('');
  services = signal<string[]>([]);
  categories = signal<string[]>([]);
  customCategories = signal<string[]>([]);
  availableDurations = signal<number[]>([30, 60, 90]);
  locationCountry = signal<string>('');
  locationCity = signal<string>('');
  locationAddress = signal<string>('');
  savingBusinessSettings = signal(false);

  // Bridge properties for [(ngModel)] - ngModel needs property accessors
  get firstNameModel(): string {
    return this.firstName();
  }
  set firstNameModel(v: string) {
    this.firstName.set(v);
  }

  get lastNameModel(): string {
    return this.lastName();
  }
  set lastNameModel(v: string) {
    this.lastName.set(v);
  }

  get businessNameModel(): string {
    return this.businessName();
  }
  set businessNameModel(v: string) {
    this.businessName.set(v);
  }

  get bioModel(): string {
    return this.bio();
  }
  set bioModel(v: string) {
    this.bio.set(v);
  }

  get contactPhoneModel(): string {
    return this.contactPhone();
  }
  set contactPhoneModel(v: string) {
    this.contactPhone.set(v);
  }

  get locationCountryModel(): string {
    return this.locationCountry();
  }
  set locationCountryModel(v: string) {
    this.locationCountry.set(v);
  }

  get locationCityModel(): string {
    return this.locationCity();
  }
  set locationCityModel(v: string) {
    this.locationCity.set(v);
  }

  get locationAddressModel(): string {
    return this.locationAddress();
  }
  set locationAddressModel(v: string) {
    this.locationAddress.set(v);
  }

  // Industry categories from backend
  industryCategories = [
    // Business & Consulting
    'Business Consulting',
    'Management Consulting',
    'Strategy Consulting',
    // Technology
    'Software Development',
    'Web Development',
    'Mobile Development',
    'IT Consulting',
    'Cybersecurity',
    'Data Analytics',
    'Cloud Services',
    // Marketing & Design
    'Digital Marketing',
    'Graphic Design',
    'Branding',
    'Content Creation',
    'Social Media',
    'SEO/SEM',
    // Finance & Legal
    'Financial Services',
    'Accounting',
    'Legal Services',
    'Tax Consulting',
    // Health & Wellness
    'Health & Wellness',
    'Life Coaching',
    'Career Coaching',
    'Fitness',
    // Creative Services
    'Photography',
    'Videography',
    'Writing',
    'Translation',
    // Real Estate & Property
    'Real Estate',
    'Property Management',
    // Events & Hospitality
    'Event Planning',
    'Hospitality',
    'Catering',
    // Logistics & Operations
    'Logistics',
    'Supply Chain',
    'Transportation',
    // Human Resources
    'HR Consulting',
    'Recruitment',
    'Training & Development',
    // Sales & Business Development
    'Sales Training',
    'Business Development',
    // Other
    'Other',
  ];

  // Common services suggestions
  commonServices = [
    'Project Consultation',
    'Strategic Planning',
    'Market Research',
    'Financial Analysis',
    'Software Development',
    'Web Design',
    'Mobile App Development',
    'Content Creation',
    'Social Media Management',
    'Brand Development',
    'SEO Optimization',
    'PPC Management',
    'Legal Consultation',
    'Tax Preparation',
    'Accounting Services',
    'Coaching Session',
    'Training Workshop',
    'Personal Training',
    'Photography Session',
    'Video Production',
    'Writing & Editing',
    'Real Estate Consulting',
    'Property Management',
    'Event Planning',
    'Logistics Coordination',
    'Supply Chain Analysis',
    'HR Consulting',
    'Recruitment Services',
    'Sales Training',
    'Business Development',
  ];

  // Common durations
  commonDurations = [15, 30, 45, 60, 90, 120];

  // Chip input properties
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  // Computed arrays for chip display
  servicesArray = computed(() => this.services());
  categoriesArray = computed(() => this.categories());
  durationsArray = computed(() => this.availableDurations().map((d) => d.toString()));

  constructor(
    private settingsService: SettingsService,
    private snackBar: MatSnackBar,
    private store: Store,
    private authService: AuthService,
  ) {
    // Effect to sync service updates with local signal
    effect(() => {
      this.settingsService.preferences$.subscribe((prefs) => {
        this.preferencesState.set(prefs);
      });
    });

    // Effect to sync appearance preferences from NgRx store with local signal
    effect(() => {
      this.store.select(selectTheme).subscribe((theme) => {
        this.preferencesState.update((prefs) => ({
          ...prefs,
          theme,
        }));
      });
    });

    effect(() => {
      this.store.select(selectLanguage).subscribe((language) => {
        this.preferencesState.update((prefs) => ({
          ...prefs,
          language,
        }));
      });
    });

    effect(() => {
      this.store.select(selectTimezone).subscribe((timezone) => {
        this.preferencesState.update((prefs) => ({
          ...prefs,
          timezone,
        }));
      });
    });

    // Subscribe to current user to populate editable fields
    this.authService.currentUser$.subscribe((u) => {
      const user = u as AuthUser | null;
      this.firstName.set(user?.firstName ?? '');
      this.lastName.set(user?.lastName ?? '');
      this.businessName.set(user?.businessName ?? '');
      this.bio.set(user?.bio ?? '');
      this.contactPhone.set(user?.contactPhone ?? '');
      this.services.set(user?.services ?? []);
      this.categories.set(user?.categories ?? []);
      this.availableDurations.set(user?.availableDurations ?? [30, 60, 90]);

      if (user?.locationDetails) {
        this.locationCountry.set(user.locationDetails.country ?? '');
        this.locationCity.set(user.locationDetails.city ?? '');
        this.locationAddress.set(user.locationDetails.address ?? '');
      }
    });
  }

  ngOnInit(): void {
    // Load appearance preferences from NgRx store first
    this.store.dispatch(loadAppearancePreferences());

    this.loadPreferences();

    // Initialize user data from store
    this.user$ = this.store.select(selectUser);
    this.userEmail$ = this.store.select(selectUserEmail);
    this.userFullName$ = this.store.select(selectUserFullName);
    this.userEmail$ = this.store.select(selectUserEmail);
    this.user$ = this.authService.currentUser$;
  }

  public saveProfile(): void {
    const f = this.firstName();
    const l = this.lastName();
    const updates: Partial<AuthUser> = { firstName: f, lastName: l };
    this.savingProfile.set(true);
    this.authService.updateCurrentUser(updates).subscribe({
      next: (user) => {
        this.snackBar.open('Profile updated', 'Close', { duration: 2000 });
        this.savingProfile.set(false);
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
        this.savingProfile.set(false);
      },
    });
  }

  public saveBusinessSettings(): void {
    this.savingBusinessSettings.set(true);

    const businessSettings = {
      businessName: this.businessName(),
      bio: this.bio(),
      contactPhone: this.contactPhone(),
      services: this.services(),
      categories: this.categories(),
      customCategories: this.customCategories(),
      availableDurations: this.availableDurations().map((d) => parseInt(d.toString())),
      locationDetails: {
        country: this.locationCountry(),
        city: this.locationCity(),
        address: this.locationAddress(),
      },
    };

    this.authService.updateCurrentUser(businessSettings).subscribe({
      next: (user) => {
        this.snackBar.open('Business settings updated', 'Close', { duration: 2000 });
        this.savingBusinessSettings.set(false);
      },
      error: (err) => {
        console.error('Failed to update business settings', err);
        this.snackBar.open('Failed to update business settings', 'Close', { duration: 3000 });
        this.savingBusinessSettings.set(false);
      },
    });
  }

  // Chip input methods
  addService(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.services().includes(value)) {
      this.services.update((services) => [...services, value]);
    }
    event.chipInput!.clear();
  }

  removeService(service: string): void {
    this.services.update((services) => services.filter((s) => s !== service));
  }

  addCategory(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.categories().includes(value)) {
      this.categories.update((categories) => [...categories, value]);
    }
    event.chipInput!.clear();
  }

  removeCategory(category: string): void {
    this.categories.update((categories) => categories.filter((c) => c !== category));
  }

  addDuration(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const duration = parseInt(value);
      if (!isNaN(duration) && duration > 0 && !this.availableDurations().includes(duration)) {
        this.availableDurations.update((durations) => [...durations, duration]);
      } else if (isNaN(duration) || duration <= 0) {
        this.snackBar.open('Duration must be a valid positive number', 'Close', { duration: 3000 });
      }
    }
    event.chipInput!.clear();
  }

  removeDuration(duration: string): void {
    const durationNum = parseInt(duration);
    this.availableDurations.update((durations) => durations.filter((d) => d !== durationNum));
  }

  // Handle category selection from autocomplete
  onCategorySelected(event: any): void {
    const value = event.option.value.trim();
    if (value && !this.categories().includes(value)) {
      this.categories.update((categories) => [...categories, value]);
    }
  }

  // Handle service selection from autocomplete
  onServiceSelected(event: any): void {
    const value = event.option.value.trim();
    if (value && !this.services().includes(value)) {
      this.services.update((services) => [...services, value]);
    }
  }

  // Handle duration selection from autocomplete
  onDurationSelected(event: any): void {
    const duration = parseInt(event.option.value);
    if (!isNaN(duration) && duration > 0 && !this.availableDurations().includes(duration)) {
      this.availableDurations.update((durations) => [...durations, duration]);
    }
  }

  public loadPreferences(): void {
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

  public updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ): void {
    // For appearance-related preferences, dispatch to NgRx store
    if (key === 'theme') {
      this.store.dispatch(updateTheme({ theme: value as 'light' | 'dark' | 'system' }));
    } else if (key === 'language') {
      this.store.dispatch(updateLanguage({ language: value as string }));
    } else if (key === 'timezone') {
      this.store.dispatch(updateTimezone({ timezone: value as string }));
    } else if (key === 'bookingApprovalMode') {
      // Keep bookingApprovalMode and booking.autoConfirmBookings in sync
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
      // For other preferences, update local signal
      this.preferencesState.update((prefs) => ({
        ...prefs,
        [key]: value,
      }));
    }
  }

  public updateNestedPreference<
    K extends keyof UserPreferences,
    NK extends keyof Required<UserPreferences>[K],
  >(key: K, nestedKey: NK, value: Required<UserPreferences>[K][NK]): void {
    // If updating booking.autoConfirmBookings, also update bookingApprovalMode
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

  public updateWorkingHours(type: 'start' | 'end', value: string): void {
    // Validate time format (HH:mm)
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      this.snackBar.open('Please enter a valid time in 24-hour format (HH:mm)', 'Close', {
        duration: 3000,
      });
      return;
    }

    const currentPrefs = this.preferences();
    const start = type === 'start' ? value : currentPrefs.calendar.workingHours.start;
    const end = type === 'end' ? value : currentPrefs.calendar.workingHours.end;

    // Validate start is before end
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

  // Helper method to validate time strings
  private validateTimeFormat(time: string): boolean {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  public savePreferences(): void {
    this.loading.set(true);

    // Get current preferences
    const currentPrefs = this.preferences();

    // Update appearance preferences via NgRx store
    this.store.dispatch(
      updateAppearancePreferences({
        preferences: {
          theme: currentPrefs.theme,
          language: currentPrefs.language,
          timezone: currentPrefs.timezone,
        },
      }),
    );

    // Update non-appearance preferences via the existing service
    const nonAppearancePrefs = {
      bookingApprovalMode: currentPrefs.bookingApprovalMode,
      notifications: currentPrefs.notifications,
      calendar: currentPrefs.calendar,
      privacy: currentPrefs.privacy,
      booking: currentPrefs.booking,
    };

    this.settingsService.updatePreferences(nonAppearancePrefs).subscribe({
      next: (updated: UserPreferences) => {
        this.snackBar.open('Preferences saved successfully', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.snackBar.open('Error saving preferences', 'Close', { duration: 3000 });
        this.loading.set(false);
      },
    });
  }

  public resetToDefaults(): void {
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
