import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SettingsService, UserPreferences } from './settings.service';
import { environment } from '../../../../environments/environment';

describe('SettingsService', () => {
  let service: SettingsService;
  let httpMock: HttpTestingController;
  const STORAGE_KEY = 'user_preferences';
  const API_URL = `${environment.apiUrl}/users/me/preferences`;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SettingsService]
    });

    service = TestBed.inject(SettingsService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear local storage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load preferences from local storage on initialization', () => {
    // Arrange
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPreferences));

    // Act
    const newService = TestBed.inject(SettingsService);

    // Assert
    expect(newService.getCurrentPreferences()).toEqual(mockPreferences);
  });

  it('should get preferences from API and update local storage', () => {
    // Act
    let result: UserPreferences | undefined;
    service.getPreferences().subscribe(prefs => {
      result = prefs;
    });

    // Respond with mock data
    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockPreferences);

    // Assert
    expect(result).toEqual(mockPreferences);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(mockPreferences);
    expect(service.getCurrentPreferences()).toEqual(mockPreferences);
  });

  it('should use cached preferences when API fails', () => {
    // Arrange
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockPreferences));

    // Act
    let result: UserPreferences | undefined;
    service.getPreferences().subscribe(prefs => {
      result = prefs;
    });

    // Simulate API error
    const req = httpMock.expectOne(API_URL);
    req.error(new ErrorEvent('Network error'));

    // Assert
    expect(result).toEqual(mockPreferences);
    expect(service.getCurrentPreferences()).toEqual(mockPreferences);
  });

  it('should update preferences in API and local storage', () => {
    // Arrange
    const updatedPrefs: UserPreferences = {
      ...mockPreferences,
      theme: 'light'
    };

    // Act
    let result: UserPreferences | undefined;
    service.updatePreferences(updatedPrefs).subscribe(prefs => {
      result = prefs;
    });

    // Respond with mock data
    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('PATCH');
    req.flush(updatedPrefs);

    // Assert
    expect(result).toEqual(updatedPrefs);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(updatedPrefs);
    expect(service.getCurrentPreferences()).toEqual(updatedPrefs);
  });

  it('should reset preferences to defaults', () => {
    // Act
    let result: UserPreferences | undefined;
    service.resetPreferences().subscribe(prefs => {
      result = prefs;
    });

    // Respond with mock data
    const req = httpMock.expectOne(`${API_URL}/reset`);
    expect(req.request.method).toBe('POST');
    req.flush(mockPreferences);

    // Assert
    expect(result).toEqual(mockPreferences);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(mockPreferences);
    expect(service.getCurrentPreferences()).toEqual(mockPreferences);
  });
});