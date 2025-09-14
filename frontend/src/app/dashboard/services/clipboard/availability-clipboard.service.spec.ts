import { TestBed } from '@angular/core/testing';
import { AvailabilityClipboardService } from './availability-clipboard.service';
import { Availability } from '../../models/availability.models';

describe('AvailabilityClipboardService', () => {
  let service: AvailabilityClipboardService;
  let mockSlot: Availability;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AvailabilityClipboardService]
    });
    service = TestBed.inject(AvailabilityClipboardService);
    
    mockSlot = {
      id: '1',
      providerId: 'provider1',
      type: 'one_off',
      startTime: new Date('2023-01-01T09:00:00'),
      endTime: new Date('2023-01-01T10:00:00'),
      duration: 60,
      isBooked: false
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should copy and retrieve a slot', () => {
    service.copySlots([mockSlot]);
    const retrievedSlots = JSON.parse(localStorage.getItem('eventide_availability_clipboard') || '[]');
    
    expect(retrievedSlots).toBeTruthy();
    expect(retrievedSlots.length).toBe(1);
    expect(new Date(retrievedSlots[0].startTime).getTime()).toEqual(mockSlot.startTime.getTime());
    expect(new Date(retrievedSlots[0].endTime).getTime()).toEqual(mockSlot.endTime.getTime());
    expect(retrievedSlots[0].duration).toEqual(mockSlot.duration);
    expect(retrievedSlots[0].isBooked).toEqual(mockSlot.isBooked);
    expect(retrievedSlots[0].type).toEqual(mockSlot.type);
  });
});
