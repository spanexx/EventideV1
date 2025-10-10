import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: {
            getStats: jest.fn().mockResolvedValue({}),
            getRecentActivity: jest.fn().mockResolvedValue([]),
            getBookings: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should call service.getStats with providerId', async () => {
    await controller.getStats('prov1');
    expect(service.getStats).toHaveBeenCalledWith('prov1');
  });

  it('should call service.getRecentActivity with providerId', async () => {
    await controller.getRecentActivity('prov1');
    expect(service.getRecentActivity).toHaveBeenCalledWith('prov1');
  });

  it('should call service.getBookings with providerId and query', async () => {
    const query = { page: 2, limit: 5 } as any;
    await controller.getBookings('prov1', query);
    expect(service.getBookings).toHaveBeenCalledWith('prov1', query);
  });
});
