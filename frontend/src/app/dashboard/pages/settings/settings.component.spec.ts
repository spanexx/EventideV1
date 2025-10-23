import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { SettingsService, UserPreferences } from './settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { SettingsProfileService } from './services/settings-profile.service';
import { SettingsBusinessService } from './services/settings-business.service';
import { SettingsPreferencesHandlerService } from './services/settings-preferences-handler.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let store: jasmine.SpyObj<Store>;
  let profileService: jasmine.SpyObj<SettingsProfileService>;
  let businessService: jasmine.SpyObj<SettingsBusinessService>;
  let preferencesHandler: jasmine.SpyObj<SettingsPreferencesHandlerService>;

    const mockPreferences: UserPreferences = {
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

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe'
  };

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('SettingsService', [
      'getPreferences',
      'updatePreferences',
      'resetPreferences',
      'getCurrentPreferences'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const storeSpy = jasmine.createSpyObj('Store', ['select']);
    const profileServiceSpy = jasmine.createSpyObj('SettingsProfileService', ['saveProfile']);
    const businessServiceSpy = jasmine.createSpyObj('SettingsBusinessService', ['saveBusinessSettings']);
    const preferencesHandlerSpy = jasmine.createSpyObj('SettingsPreferencesHandlerService', [
      'saveNotificationSettings',
      'saveAppearanceSettings',
      'saveCalendarSettings',
      'savePrivacySettings',
      'saveBookingSettings',
      'saveLocalizationSettings',
      'savePreferences',
      'resetToDefaults',
      'loadPreferences'
    ]);

    serviceSpy.getPreferences.and.returnValue(of(mockPreferences));
    serviceSpy.updatePreferences.and.returnValue(of(mockPreferences));
    serviceSpy.resetPreferences.and.returnValue(of(mockPreferences));
    serviceSpy.getCurrentPreferences.and.returnValue(mockPreferences);
    storeSpy.select.and.returnValue(of(mockUser.email));

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        SettingsComponent
      ],
      providers: [
        { provide: SettingsService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Store, useValue: storeSpy },
        { provide: SettingsProfileService, useValue: profileServiceSpy },
        { provide: SettingsBusinessService, useValue: businessServiceSpy },
        { provide: SettingsPreferencesHandlerService, useValue: preferencesHandlerSpy }
      ]
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
    profileService = TestBed.inject(SettingsProfileService) as jasmine.SpyObj<SettingsProfileService>;
    businessService = TestBed.inject(SettingsBusinessService) as jasmine.SpyObj<SettingsBusinessService>;
    preferencesHandler = TestBed.inject(SettingsPreferencesHandlerService) as jasmine.SpyObj<SettingsPreferencesHandlerService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save profile through profile service', () => {
    component.saveProfile();
    expect(profileService.saveProfile).toHaveBeenCalled();
  });

  it('should save business settings through business service', () => {
    component.saveBusinessSettings();
    expect(businessService.saveBusinessSettings).toHaveBeenCalled();
  });

  it('should save notification settings through preferences handler', () => {
    component.saveNotificationSettings();
    expect(preferencesHandler.saveNotificationSettings).toHaveBeenCalled();
  });

  it('should save appearance settings through preferences handler', () => {
    component.saveAppearanceSettings();
    expect(preferencesHandler.saveAppearanceSettings).toHaveBeenCalled();
  });

  it('should save calendar settings through preferences handler', () => {
    component.saveCalendarSettings();
    expect(preferencesHandler.saveCalendarSettings).toHaveBeenCalled();
  });

  it('should save privacy settings through preferences handler', () => {
    component.savePrivacySettings();
    expect(preferencesHandler.savePrivacySettings).toHaveBeenCalled();
  });

  it('should save booking settings through preferences handler', () => {
    component.saveBookingSettings();
    expect(preferencesHandler.saveBookingSettings).toHaveBeenCalled();
  });

  it('should save localization settings through preferences handler', () => {
    component.saveLocalizationSettings();
    expect(preferencesHandler.saveLocalizationSettings).toHaveBeenCalled();
  });

  it('should save preferences through preferences handler', () => {
    component.savePreferences();
    expect(preferencesHandler.savePreferences).toHaveBeenCalled();
  });

  it('should reset to defaults through preferences handler', () => {
    component.resetToDefaults();
    expect(preferencesHandler.resetToDefaults).toHaveBeenCalled();
  });
});