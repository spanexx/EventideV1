import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PreferencesService, UserPreferencesDto } from './preferences.service';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PreferencesService]
    });

    service = TestBed.inject(PreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const mockPreferences: UserPreferencesDto = {
    timezone: 'America/New_York',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    calendar: {
      defaultView: 'month',
      autoSwitchView: true
    }
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPreferences', () => {
    it('should fetch user preferences', () => {
      service.getPreferences().subscribe(prefs => {
        expect(prefs).toEqual(mockPreferences);
      });

      const req = httpMock.expectOne('/api/users/me/preferences');
      expect(req.request.method).toBe('GET');
      req.flush(mockPreferences);
    });

    it('should handle error responses', () => {
      service.getPreferences().subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne('/api/users/me/preferences');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', () => {
      const update = { timezone: 'Europe/London' };
      
      service.updatePreferences(update).subscribe(prefs => {
        expect(prefs).toEqual({ ...mockPreferences, ...update });
      });

      const req = httpMock.expectOne('/api/users/me/preferences');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(update);
      req.flush({ ...mockPreferences, ...update });
    });
  });

  describe('resetPreferences', () => {
    it('should reset preferences to defaults', () => {
      service.resetPreferences().subscribe(prefs => {
        expect(prefs).toEqual(mockPreferences);
      });

      const req = httpMock.expectOne('/api/users/me/preferences/reset');
      expect(req.request.method).toBe('POST');
      req.flush(mockPreferences);
    });
  });
});