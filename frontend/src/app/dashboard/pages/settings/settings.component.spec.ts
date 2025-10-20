import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { SettingsService, UserPreferences } from './settings.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let settingsService: jasmine.SpyObj<SettingsService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let store: jasmine.SpyObj<Store>;

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
        { provide: Store, useValue: storeSpy }
      ]
    }).compileComponents();

    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    store = TestBed.inject(Store) as jasmine.SpyObj<Store>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load preferences on init', () => {
    expect(settingsService.getPreferences).toHaveBeenCalled();
    expect(component.preferences()).toEqual(mockPreferences);
  });

  it('should load user profile from store', () => {
    expect(store.select).toHaveBeenCalled();
    component.userEmail$.subscribe(email => {
      expect(email).toBe(mockUser.email);
    });
  });

  it('should save preferences', () => {
    const updatedPrefs = { ...mockPreferences, theme: 'light' as const };
    component.preferences.set(updatedPrefs);
    component.savePreferences();
    
    expect(settingsService.updatePreferences).toHaveBeenCalledWith(updatedPrefs);
    expect(snackBar.open).toHaveBeenCalledWith('Preferences saved successfully', 'Close', { duration: 3000 });
  });

  it('should reset preferences', () => {
    component.resetToDefaults();
    expect(settingsService.resetPreferences).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Preferences reset to defaults', 'Close', { duration: 3000 });
  });

  it('should show error when preferences load fails', () => {
    settingsService.getPreferences.and.returnValue(throwError(() => new Error('Failed')));
    component.loadPreferences();
    expect(snackBar.open).toHaveBeenCalledWith('Error loading preferences', 'Close', { duration: 3000 });
  });

  it('should update nested preferences', () => {
    // Act
    component.updateNestedPreference('notifications', 'email', false);

    // Assert
    expect(component.preferences().notifications.email).toBe(false);
  });

  it('should update working hours with validation', () => {
    // Valid case
    component.updateWorkingHours('start', '08:00');
    expect(component.preferences().calendar.workingHours.start).toBe('08:00');

    // Invalid time format
    component.updateWorkingHours('start', '25:00');
    expect(component.preferences().calendar.workingHours.start).toBe('08:00');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Please enter a valid time in 24-hour format (HH:mm)',
      'Close',
      { duration: 3000 }
    );

    // End time before start time
    component.updateWorkingHours('end', '07:00');
    expect(component.preferences().calendar.workingHours.end).toBe('17:00');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Working hours start must be before end time',
      'Close',
      { duration: 3000 }
    );
  });

  it('should detect changes in nested preferences', () => {
    // Arrange
    const currentPrefs = component.preferences();
    const updatedPrefs = {
      ...currentPrefs,
      calendar: {
        ...currentPrefs.calendar,
        defaultView: 'month' as const
      }
    };
    settingsService.getCurrentPreferences.and.returnValue(currentPrefs);

    // Act
    component.preferences.set(updatedPrefs);

    // Assert
    expect(component.hasChanges()).toBe(true);
  });

  it('should detect changes in preferences', () => {
    const updatedPrefs = { ...mockPreferences, theme: 'light' as const };
    component.preferences.set(updatedPrefs);
    expect(component.hasChanges()).toBe(true);
  });

  it('should handle save preferences failure', () => {
    const updatedPrefs = { ...mockPreferences, theme: 'light' as const };
    component.preferences.set(updatedPrefs);
    settingsService.updatePreferences.and.returnValue(throwError(() => new Error('Failed')));
    
    component.savePreferences();
    expect(snackBar.open).toHaveBeenCalledWith('Error saving preferences', 'Close', { duration: 3000 });
  });

  it('should handle reset preferences failure', () => {
    settingsService.resetPreferences.and.returnValue(throwError(() => new Error('Failed')));
    
    component.resetToDefaults();
    expect(snackBar.open).toHaveBeenCalledWith('Error resetting preferences', 'Close', { duration: 3000 });
  });
});