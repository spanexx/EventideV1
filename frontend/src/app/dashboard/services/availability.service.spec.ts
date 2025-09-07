import { TestBed } from '@angular/core/testing';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AvailabilityService } from './availability.service';
import { environment } from '../../../environments/environment';
import { Availability } from '../models/availability.models';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  const mockAvailability: Availability = {
    id: '1',
    providerId: 'provider-1',
    type: 'one_off',
    date: new Date('2023-01-01'),
    startTime: new Date('2023-01-01T09:00:00'),
    endTime: new Date('2023-01-01T10:00:00'),
    duration: 60,
    isBooked: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AvailabilityService]
    });

    service = TestBed.inject(AvailabilityService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createAllDayAvailability', () => {
    it('should send a POST request to create all-day availability slots', () => {
      const allDayDto = {
        providerId: 'provider-1',
        date: new Date('2023-01-01'),
        numberOfSlots: 2,
        autoDistribute: true
      };

      service.createAllDayAvailability(allDayDto).subscribe(slots => {
        expect(slots.length).toBe(1);
        expect(slots[0]).toEqual(mockAvailability);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/availability/all-day`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(allDayDto);
      
      req.flush([mockAvailability]);
    });

    it('should handle manual slot configuration', () => {
      const allDayDto = {
        providerId: 'provider-1',
        date: new Date('2023-01-01'),
        numberOfSlots: 2,
        autoDistribute: false,
        slots: [
          {
            startTime: new Date('2023-01-01T09:00:00'),
            endTime: new Date('2023-01-01T11:00:00'),
            duration: 120
          },
          {
            startTime: new Date('2023-01-01T14:00:00'),
            endTime: new Date('2023-01-01T16:00:00'),
            duration: 120
          }
        ]
      };

      service.createAllDayAvailability(allDayDto).subscribe(slots => {
        expect(slots.length).toBe(1);
        expect(slots[0]).toEqual(mockAvailability);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/availability/all-day`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(allDayDto);
      
      req.flush([mockAvailability]);
    });
  });

  describe('convertToCalendarEvents', () => {
    it('should convert availability slots to calendar events', () => {
      const availability: Availability[] = [
        {
          id: '1',
          providerId: 'provider-1',
          type: 'one_off',
          date: new Date('2023-01-01'),
          startTime: new Date('2023-01-01T09:00:00'),
          endTime: new Date('2023-01-01T10:00:00'),
          duration: 60,
          isBooked: false
        },
        {
          id: '2',
          providerId: 'provider-1',
          type: 'recurring',
          dayOfWeek: 1,
          startTime: new Date('2023-01-01T14:00:00'),
          endTime: new Date('2023-01-01T15:00:00'),
          duration: 60,
          isBooked: true
        }
      ];

      const events = service.convertToCalendarEvents(availability);
      
      expect(events.length).toBe(2);
      expect(events[0].id).toBe('1');
      expect(events[0].title).toBe('Available');
      expect(events[1].id).toBe('2');
      expect(events[1].title).toBe('Booked');
    });
  });
});