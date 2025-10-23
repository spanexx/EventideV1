import { Test, TestingModule } from '@nestjs/testing';
import { BookingCreationService } from './booking-creation.service';
import { AvailabilityService } from '../../availability/availability.service';
import { UsersService } from '../../users/users.service';
import { BookingBaseService } from './booking-base.service';
import { BookingCacheService } from './booking-cache.service';
import { BookingEventsService } from './booking-events.service';
import { BookingSerialKeyService } from './booking-serial-key.service';
import { NotificationService } from '../../../core/notifications/notification.service';

// Minimal fakes
const availabilityServiceMock = {
  findByIdAndLock: jest.fn(),
  markAsBooked: jest.fn(),
  createInstanceFromRecurring: jest.fn(),
};

const usersServiceMock = {
  findById: jest.fn(),
};

const baseServiceMock = {
  create: jest.fn(),
  createMany: jest.fn(),
  findByFilter: jest.fn(),
};

const cacheServiceMock = {
  getCachedBooking: jest.fn(),
  cacheBooking: jest.fn(),
};

const eventsServiceMock = {
  emitBookingCreated: jest.fn(),
  emitAvailabilityStatusChange: jest.fn(),
};

const serialKeyServiceMock = {
  generateBookingSerialKey: jest.fn().mockReturnValue('SER123'),
};

const notificationServiceMock = {
  sendProviderBookingConfirmation: jest.fn(),
  sendGuestBookingConfirmation: jest.fn(),
  sendRecurringSummary: jest.fn(),
};


describe('BookingCreationService (pending/manual approval)', () => {
  let service: BookingCreationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingCreationService,
        { provide: AvailabilityService, useValue: availabilityServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: BookingBaseService, useValue: baseServiceMock },
        { provide: BookingCacheService, useValue: cacheServiceMock },
        { provide: BookingEventsService, useValue: eventsServiceMock },
        { provide: BookingSerialKeyService, useValue: serialKeyServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    service = module.get<BookingCreationService>(BookingCreationService);

    jest.clearAllMocks();
  });

  it('sets status to pending when provider preference is manual (single booking)', async () => {
    const availability = {
      _id: 'avail1',
      id: 'avail1',
      providerId: 'prov1',
      type: 'single',
      isBooked: false,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60000).toISOString(),
      duration: 60,
    } as any;

    availabilityServiceMock.findByIdAndLock.mockResolvedValue(availability);
    baseServiceMock.findByFilter.mockResolvedValue([]);
    usersServiceMock.findById.mockResolvedValue({ preferences: { bookingApprovalMode: 'manual' } });
    baseServiceMock.create.mockImplementation(async (data: any) => ({ _id: 'b1', ...data }));

    const dto = {
      availabilityId: 'avail1',
      providerId: 'prov1',
      guestName: 'John',
      guestEmail: 'john@example.com',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60000).toISOString(),
    } as any;

    const result = await (service as any)._createSingleBooking(dto, availability, null);

    expect(baseServiceMock.create).toHaveBeenCalled();
    expect(result.status).toBe('pending');
    // Should notify provider but not guest when pending
    expect(notificationServiceMock.sendProviderBookingConfirmation).toHaveBeenCalled();
    expect(notificationServiceMock.sendGuestBookingConfirmation).not.toHaveBeenCalled();
  });
});
