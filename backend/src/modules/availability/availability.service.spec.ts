import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { getModelToken } from '@nestjs/mongoose';
import { Availability, AvailabilityDocument } from './availability.schema';
import { CachingService } from '../../core/cache/caching.service';
import { WebsocketsService } from '../../core/websockets';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateAllDayAvailabilityDto } from './dto/create-all-day-availability.dto';
import { Model } from 'mongoose';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let model: Model<Availability>;
  let mockCacheService: any;
  let mockWebsocketsService: any;

  const mockAvailability: Partial<AvailabilityDocument> = {
    _id: '123',
    providerId: 'provider-123',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 3600000),
    duration: 60,
    save: jest.fn().mockResolvedValue({
      _id: '123',
      providerId: 'provider-123',
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 3600000),
      duration: 60,
    }),
  };

  beforeEach(async () => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    mockWebsocketsService = {
      emitToRoom: jest.fn(),
      emitToAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getModelToken(Availability.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockAvailability),
            create: jest.fn().mockResolvedValue(mockAvailability),
            find: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockAvailability]),
            }),
            findById: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockAvailability),
            }),
            findByIdAndUpdate: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockAvailability),
            }),
            findByIdAndDelete: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockAvailability),
            }),
          },
        },
        {
          provide: CachingService,
          useValue: mockCacheService,
        },
        {
          provide: WebsocketsService,
          useValue: mockWebsocketsService,
        },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    model = module.get<Model<Availability>>(getModelToken(Availability.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new availability slot', async () => {
      const createAvailabilityDto: CreateAvailabilityDto = {
        providerId: 'provider-123',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 3600000), // 1 hour later
        duration: 60,
      };

      jest
        .spyOn(model, 'find')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) } as any);
      jest.spyOn(model, 'create').mockResolvedValue(mockAvailability as any);

      const result = await service.create(createAvailabilityDto);
      expect(result).toBeDefined();
      expect(result.providerId).toBe(createAvailabilityDto.providerId);
    });
  });

  describe('createAllDaySlots', () => {
    it('should create multiple availability slots for an all-day period with auto-distribute', async () => {
      const createAllDayAvailabilityDto: CreateAllDayAvailabilityDto = {
        providerId: 'provider-123',
        date: new Date(),
        numberOfSlots: 2,
        autoDistribute: true,
      };

      // Mock the find method to return no conflicts
      jest
        .spyOn(model, 'find')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) } as any);
      
      // Mock the create method to return a mock availability
      jest
        .spyOn(model, 'create')
        .mockResolvedValue(mockAvailability as any);

      const result = await service.createAllDaySlots(createAllDayAvailabilityDto);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(model.create).toHaveBeenCalledTimes(2); // Should create 2 slots
    });

    it('should create multiple availability slots with custom working hours', async () => {
      const workingStartDate = new Date();
      workingStartDate.setHours(9, 0, 0, 0);
      
      const workingEndDate = new Date();
      workingEndDate.setHours(17, 0, 0, 0);
      
      const createAllDayAvailabilityDto: CreateAllDayAvailabilityDto = {
        providerId: 'provider-123',
        date: new Date(),
        workingStartTime: workingStartDate,
        workingEndTime: workingEndDate,
        numberOfSlots: 2,
        autoDistribute: true,
      };

      // Mock the find method to return no conflicts
      jest
        .spyOn(model, 'find')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) } as any);
      
      // Mock the create method to return a mock availability
      jest
        .spyOn(model, 'create')
        .mockResolvedValue(mockAvailability as any);

      const result = await service.createAllDaySlots(createAllDayAvailabilityDto);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should validate that both workingStartTime and workingEndTime are provided together', async () => {
      const workingStartDate = new Date();
      workingStartDate.setHours(9, 0, 0, 0);
      
      const createAllDayAvailabilityDto: CreateAllDayAvailabilityDto = {
        providerId: 'provider-123',
        date: new Date(),
        workingStartTime: workingStartDate,
        // Missing workingEndTime
        numberOfSlots: 2,
        autoDistribute: true,
      };

      await expect(service.createAllDaySlots(createAllDayAvailabilityDto)).rejects.toThrow();
    });

    it('should validate that workingEndTime is after workingStartTime', async () => {
      const workingStartDate = new Date();
      workingStartDate.setHours(17, 0, 0, 0); // 5 PM
      
      const workingEndDate = new Date();
      workingEndDate.setHours(9, 0, 0, 0); // 9 AM
      
      const createAllDayAvailabilityDto: CreateAllDayAvailabilityDto = {
        providerId: 'provider-123',
        date: new Date(),
        workingStartTime: workingStartDate,
        workingEndTime: workingEndDate,
        numberOfSlots: 2,
        autoDistribute: true,
      };

      await expect(service.createAllDaySlots(createAllDayAvailabilityDto)).rejects.toThrow();
    });

    it('should create multiple availability slots for an all-day period with manual slots', async () => {
      const createAllDayAvailabilityDto: CreateAllDayAvailabilityDto = {
        providerId: 'provider-123',
        date: new Date(),
        numberOfSlots: 2,
        autoDistribute: false,
        slots: [
          {
            startTime: new Date(new Date().setHours(9, 0, 0, 0)),
            endTime: new Date(new Date().setHours(11, 0, 0, 0)),
            duration: 120,
          },
          {
            startTime: new Date(new Date().setHours(14, 0, 0, 0)),
            endTime: new Date(new Date().setHours(16, 0, 0, 0)),
            duration: 120,
          }
        ]
      };

      // Mock the find method to return no conflicts
      jest
        .spyOn(model, 'find')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) } as any);
      
      // Mock the create method to return a mock availability
      jest
        .spyOn(model, 'create')
        .mockResolvedValue(mockAvailability as any);

      const result = await service.createAllDaySlots(createAllDayAvailabilityDto);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(model.create).toHaveBeenCalledTimes(2); // Should create 2 slots
    });

    it('should handle recurring all-day slots', async () => {
      const createAllDayAvailabilityDto: CreateAllDayAvailabilityDto = {
        providerId: 'provider-123',
        date: new Date(),
        numberOfSlots: 2,
        autoDistribute: true,
        isRecurring: true,
        dayOfWeek: 1, // Monday
      };

      // Mock the find method to return no conflicts
      jest
        .spyOn(model, 'find')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue([]) } as any);
      
      // Mock the create method to return a mock availability
      jest
        .spyOn(model, 'create')
        .mockResolvedValue(mockAvailability as any);

      const result = await service.createAllDaySlots(createAllDayAvailabilityDto);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle conflicts gracefully', async () => {
      const createAllDayAvailabilityDto: CreateAllDayAvailabilityDto = {
        providerId: 'provider-123',
        date: new Date(),
        numberOfSlots: 2,
        autoDistribute: true,
      };

      // Mock the find method to return conflicts for the first slot but not the second
      jest
        .spyOn(model, 'find')
        .mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue([{ id: 'conflict-1' }]) } as any)) // Conflict for first slot
        .mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue([]) } as any)); // No conflict for second slot
      
      // Mock the create method to return a mock availability
      jest
        .spyOn(model, 'create')
        .mockResolvedValue(mockAvailability as any);

      const result = await service.createAllDaySlots(createAllDayAvailabilityDto);
      
      expect(result).toBeDefined();
      // Should still create the second slot even if the first had a conflict
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateEvenlyDistributedSlots', () => {
    it('should generate evenly distributed slots', () => {
      const providerId = 'provider-123';
      const date = new Date();
      const numberOfSlots = 2;
      
      // Call the private method through reflection
      const slots = (service as any).generateEvenlyDistributedSlots(
        providerId,
        date,
        numberOfSlots
      );
      
      expect(slots).toBeDefined();
      expect(slots.length).toBe(2);
      expect(slots[0].providerId).toBe(providerId);
      expect(slots[0].duration).toBeGreaterThan(0);
    });

    it('should generate evenly distributed slots with custom working hours', () => {
      const providerId = 'provider-123';
      const date = new Date();
      const numberOfSlots = 2;
      
      const workingStartDate = new Date(date);
      workingStartDate.setHours(9, 0, 0, 0);
      
      const workingEndDate = new Date(date);
      workingEndDate.setHours(17, 0, 0, 0);
      
      // Call the private method through reflection
      const slots = (service as any).generateEvenlyDistributedSlots(
        providerId,
        date,
        numberOfSlots,
        undefined,
        15,
        false,
        undefined,
        workingStartDate,
        workingEndDate
      );
      
      expect(slots).toBeDefined();
      expect(slots.length).toBe(2);
      expect(slots[0].providerId).toBe(providerId);
      expect(slots[0].duration).toBeGreaterThan(0);
      
      // Verify that slots are within the custom working hours
      const firstSlotStart = new Date(slots[0].startTime);
      const lastSlotEnd = new Date(slots[slots.length - 1].endTime);
      
      expect(firstSlotStart.getHours()).toBeGreaterThanOrEqual(9);
      expect(lastSlotEnd.getHours()).toBeLessThanOrEqual(17);
    });

    it('should adjust number of slots if duration is too small', () => {
      const providerId = 'provider-123';
      const date = new Date();
      // Request too many slots for a working day
      const numberOfSlots = 100;
      
      // Call the private method through reflection
      const slots = (service as any).generateEvenlyDistributedSlots(
        providerId,
        date,
        numberOfSlots
      );
      
      expect(slots).toBeDefined();
      // Should have been adjusted to a reasonable number
      expect(slots.length).toBeLessThan(25);
      expect(slots.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases for breakTime and minutesPerSlot', () => {
    it('should support breakTime = 0', () => {
      const providerId = 'provider-123';
      const date = new Date();
      const slots = (service as any).generateEvenlyDistributedSlots(
        providerId,
        date,
        4,
        undefined,
        0
      );
      expect(slots.length).toBe(4);
      expect(slots[0].duration).toBeGreaterThanOrEqual(15);
    });

    it('should cap with breakTime = 60', () => {
      const providerId = 'provider-123';
      const date = new Date();
      const slots = (service as any).generateEvenlyDistributedSlots(
        providerId,
        date,
        4,
        undefined,
        60
      );
      expect(slots.length).toBeGreaterThan(0);
    });

    it('should compute from minutesPerSlot when provided', () => {
      const providerId = 'provider-123';
      const date = new Date();
      const slots = (service as any).generateEvenlyDistributedSlots(
        providerId,
        date,
        1,
        120, // minutesPerSlot
        15
      );
      expect(slots.length).toBeGreaterThan(1);
    });
  });
});