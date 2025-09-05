import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GuestDashboardService } from './guest-dashboard.service';
import { environment } from '../../../environments/environment';

describe('GuestDashboardService', () => {
  let service: GuestDashboardService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GuestDashboardService]
    });
    service = TestBed.inject(GuestDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct API URL', () => {
    expect(service['API_URL']).toBe(`${environment.apiUrl}/guest`);
  });

  // Note: Since we're using mock data in the service implementation,
  // these tests would need to be updated when real HTTP calls are implemented
  
  it('should return mock booking history', (done) => {
    service.getBookingHistory().subscribe(bookings => {
      expect(bookings).toBeTruthy();
      expect(bookings.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should return mock booking by ID', (done) => {
    service.getBookingById('1').subscribe(booking => {
      expect(booking).toBeTruthy();
      expect(booking.id).toBe('1');
      done();
    });
  });

  it('should return mock profile', (done) => {
    service.getProfile().subscribe(profile => {
      expect(profile).toBeTruthy();
      expect(profile.email).toBe('john.doe@example.com');
      done();
    });
  });

  it('should return success for cancel booking', (done) => {
    service.cancelBooking('1').subscribe(success => {
      expect(success).toBe(true);
      done();
    });
  });

  it('should return same profile for update profile', (done) => {
    const mockProfile: any = {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    service.updateProfile(mockProfile).subscribe(profile => {
      expect(profile).toEqual(mockProfile);
      done();
    });
  });

  it('should return same preferences for update preferences', (done) => {
    const mockPreferences: any = {
      notifications: {
        email: true,
        sms: false
      },
      timezone: 'UTC'
    };

    service.updatePreferences(mockPreferences).subscribe(preferences => {
      expect(preferences).toEqual(mockPreferences);
      done();
    });
  });
});