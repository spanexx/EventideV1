import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingCancellationService } from './services/booking-cancellation.service';

describe('BookingController (approve/decline)', () => {
  let controller: BookingController;
  let bookingService: jest.Mocked<BookingService>;

  const bookingServiceMock = {
    findOne: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  } as unknown as jest.Mocked<BookingService>;

  const cancellationServiceMock = {
    requestCancellation: jest.fn(),
    verifyCancellation: jest.fn(),
  } as unknown as BookingCancellationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        { provide: BookingService, useValue: bookingServiceMock },
        { provide: BookingCancellationService, useValue: cancellationServiceMock },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    bookingService = module.get(BookingService) as jest.Mocked<BookingService>;

    jest.clearAllMocks();
  });

  it('should approve a pending booking', async () => {
    bookingService.findOne = jest.fn().mockResolvedValue({ _id: 'b1', providerId: 'prov1', status: 'pending' } as any);
    bookingService.update = jest.fn().mockResolvedValue({ _id: 'b1', providerId: 'prov1', status: 'confirmed' } as any);

    const res = await controller.providerApproveBooking('b1', 'prov1');

    expect(bookingService.findOne).toHaveBeenCalledWith('b1');
    expect(bookingService.update).toHaveBeenCalledWith('b1', { status: 'confirmed' as any });
    expect(res.status).toBe('confirmed');
  });

  it('should fail approve if not pending', async () => {
    bookingService.findOne = jest.fn().mockResolvedValue({ _id: 'b1', providerId: 'prov1', status: 'confirmed' } as any);

    await expect(controller.providerApproveBooking('b1', 'prov1')).rejects.toThrow('Only pending bookings can be approved');
  });

  it('should decline a pending booking', async () => {
    bookingService.findOne = jest.fn().mockResolvedValue({ _id: 'b2', providerId: 'prov1', status: 'pending' } as any);
    bookingService.update = jest.fn().mockResolvedValue({ _id: 'b2', providerId: 'prov1', status: 'cancelled' } as any);

    const res = await controller.providerDeclineBooking('b2', 'prov1');

    expect(bookingService.findOne).toHaveBeenCalledWith('b2');
    expect(bookingService.update).toHaveBeenCalledWith('b2', { status: 'cancelled' as any });
    expect(res.status).toBe('cancelled');
  });

  it('should prevent actions on bookings not owned by provider', async () => {
    bookingService.findOne = jest.fn().mockResolvedValue({ _id: 'b3', providerId: 'other', status: 'pending' } as any);

    await expect(controller.providerApproveBooking('b3', 'prov1')).rejects.toThrow('Booking does not belong to this provider');
    await expect(controller.providerDeclineBooking('b3', 'prov1')).rejects.toThrow('Booking does not belong to this provider');
  });
});
