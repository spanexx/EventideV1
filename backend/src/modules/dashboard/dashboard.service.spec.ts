import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { Booking, BookingStatus } from '../booking/booking.schema';
import { Availability } from '../availability/availability.schema';

function createQueryChainMock(returnValue: any) {
  return {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(returnValue),
  } as any;
}

describe('DashboardService', () => {
  let service: DashboardService;
  let bookingModel: any;
  let availabilityModel: any;

  beforeEach(async () => {
    bookingModel = {
      countDocuments: jest.fn().mockResolvedValue(5),
      find: jest.fn().mockReturnValue(createQueryChainMock([])),
    };

    availabilityModel = {
      countDocuments: jest.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(4),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getModelToken(Booking.name), useValue: bookingModel },
        { provide: getModelToken(Availability.name), useValue: availabilityModel },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should compute stats', async () => {
    const stats = await service.getStats('prov1');
    expect(bookingModel.countDocuments).toHaveBeenCalled();
    expect(availabilityModel.countDocuments).toHaveBeenCalled();
    expect(stats).toHaveProperty('totalBookings');
    expect(stats).toHaveProperty('upcomingBookings');
    expect(stats).toHaveProperty('occupancy');
    expect(typeof stats.occupancy).toBe('number');
  });

  it('should return recent activity mapped from bookings', async () => {
    const now = new Date();
    const chain = createQueryChainMock([
      { _id: '1', guestName: 'John', startTime: now, endTime: now, updatedAt: now, status: BookingStatus.CONFIRMED },
    ]);
    bookingModel.find.mockReturnValue(chain);

    const activity = await service.getRecentActivity('prov1');
    expect(bookingModel.find).toHaveBeenCalledWith({ providerId: 'prov1' });
    expect(activity[0]).toHaveProperty('description');
  });

  it('should paginate bookings', async () => {
    const chain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ id: 'b1' }]),
    } as any;
    bookingModel.find.mockReturnValue(chain);
    bookingModel.countDocuments.mockResolvedValue(1);

    const res = await service.getBookings('prov1', { page: 1, limit: 10, order: 'desc', sortBy: 'startTime' } as any);
    expect(res.items.length).toBe(1);
    expect(res.total).toBe(1);
  });
});
