import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AvailabilityCreationService } from './availability-creation.service';
import { AvailabilityValidationService } from './availability-validation.service';
import { AvailabilityCacheService } from './availability-cache.service';
import { AvailabilityEventsService } from './availability-events.service';
import { AvailabilitySlotGeneratorService } from './availability-slot-generator.service';
import { Availability, AvailabilityType, DayOfWeek } from '../availability.schema';

describe('AvailabilityCreationService', () => {
  let service: AvailabilityCreationService;
  let mockAvailabilityModel: jest.Mocked<Model<any>>;
  let mockValidationService: jest.Mocked<AvailabilityValidationService>;
  let mockCacheService: jest.Mocked<AvailabilityCacheService>;

  beforeEach(async () => {
    const mockModel = {
      create: jest.fn(),
      insertMany: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      deleteMany: jest.fn(),
    };

    const mockValidation = {
      checkForConflicts: jest.fn(),
      findConflicts: jest.fn(),
    };

    const mockCache = {
      clearProviderCache: jest.fn(),
      setIdempotencyCache: jest.fn(),
      getIdempotencyCache: jest.fn(),
    };

    const mockEvents = {
      emitCreated: jest.fn(),
      emitBulkCreated: jest.fn(),
    };

    const mockSlotGenerator = {
      generateEvenlyDistributedSlots: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityCreationService,
        {
          provide: getModelToken(Availability.name),
          useValue: mockModel,
        },
        {
          provide: AvailabilityValidationService,
          useValue: mockValidation,
        },
        {
          provide: AvailabilityCacheService,
          useValue: mockCache,
        },
        {
          provide: AvailabilityEventsService,
          useValue: mockEvents,
        },
        {
          provide: AvailabilitySlotGeneratorService,
          useValue: mockSlotGenerator,
        },
      ],
    }).compile();

    service = module.get<AvailabilityCreationService>(AvailabilityCreationService);
    mockAvailabilityModel = module.get(getModelToken(Availability.name));
    mockValidationService = module.get(AvailabilityValidationService);
    mockCacheService = module.get(AvailabilityCacheService);
  });

  describe('create', () => {
    it('should create a one-off availability slot', async () => {
      const createDto = {
        providerId: 'provider123',
        type: AvailabilityType.ONE_OFF,
        date: new Date('2025-10-20'),
        startTime: new Date('2025-10-20T09:00:00Z'),
        endTime: new Date('2025-10-20T10:00:00Z'),
        duration: 60,
        isBooked: false,
        maxBookings: 1,
      };

      const mockResult = {
        _id: 'slot123',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockValidationService.checkForConflicts.mockResolvedValue(undefined);
      mockAvailabilityModel.create.mockResolvedValue(mockResult as any);
      mockCacheService.clearProviderCache.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(mockValidationService.checkForConflicts).toHaveBeenCalledWith(createDto);
      expect(mockAvailabilityModel.create).toHaveBeenCalledWith(createDto);
      expect(mockCacheService.clearProviderCache).toHaveBeenCalledWith('provider123');
      expect(result.id).toBe('slot123');
      expect(result.type).toBe(AvailabilityType.ONE_OFF);
    });

    it('should create recurring availability slots for 8 weeks', async () => {
      const createDto = {
        providerId: 'provider123',
        type: AvailabilityType.RECURRING,
        dayOfWeek: DayOfWeek.THURSDAY,
        startTime: new Date('2025-10-17T07:00:00Z'), // Thursday 7 AM
        endTime: new Date('2025-10-17T08:00:00Z'),   // Thursday 8 AM
        duration: 60,
        isBooked: false,
        maxBookings: 1,
      };

      const mockResults = Array.from({ length: 8 }, (_, i) => ({
        _id: `slot${i}`,
        ...createDto,
        date: new Date(2025, 9, 17 + (i * 7)), // Every Thursday
        weekOf: new Date(2025, 9, 13 + (i * 7)), // Week start (Sunday)
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockAvailabilityModel.insertMany.mockResolvedValue(mockResults as any);
      mockCacheService.clearProviderCache.mockResolvedValue(undefined);

      const result = await service.create(createDto);

      expect(mockAvailabilityModel.insertMany).toHaveBeenCalled();
      const insertedSlots = mockAvailabilityModel.insertMany.mock.calls[0][0] as any[];
      
      // Should create 8 weekly slots
      expect(insertedSlots).toHaveLength(8);
      
      // Each slot should be on Thursday
      insertedSlots.forEach((slot: any) => {
        expect(slot.dayOfWeek).toBe(DayOfWeek.THURSDAY);
        expect(slot.type).toBe(AvailabilityType.RECURRING);
        expect(slot.duration).toBe(60);
      });

      expect(mockCacheService.clearProviderCache).toHaveBeenCalledWith('provider123');
      expect(result.id).toBe('slot0');
    });

    it('should handle idempotency for recurring slots', async () => {
      const createDto = {
        providerId: 'provider123',
        type: AvailabilityType.RECURRING,
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: new Date('2025-10-14T10:00:00Z'),
        endTime: new Date('2025-10-14T11:00:00Z'),
        duration: 60,
        isBooked: false,
        maxBookings: 1,
        idempotencyKey: 'test-key-123',
      };

      const cachedResult = {
        id: 'cached-slot',
        providerId: 'provider123',
        type: AvailabilityType.RECURRING,
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: new Date('2025-10-14T10:00:00Z'),
        endTime: new Date('2025-10-14T11:00:00Z'),
        duration: 60,
        isBooked: false,
        maxBookings: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCacheService.getIdempotencyCache.mockResolvedValue(cachedResult);

      const result = await service.create(createDto);

      expect(mockCacheService.getIdempotencyCache).toHaveBeenCalledWith('create:test-key-123');
      expect(mockAvailabilityModel.insertMany).not.toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
    });
  });

  describe('createRecurringSlots', () => {
    it('should generate correct time adjustments for different weeks', async () => {
      const createDto = {
        providerId: 'provider123',
        type: AvailabilityType.RECURRING,
        dayOfWeek: DayOfWeek.FRIDAY,
        startTime: new Date('2025-10-18T14:30:00Z'), // Friday 2:30 PM
        endTime: new Date('2025-10-18T15:30:00Z'),   // Friday 3:30 PM
        duration: 60,
        isBooked: false,
        maxBookings: 1,
      };

      const mockResults = Array.from({ length: 8 }, (_, i) => ({
        _id: `slot${i}`,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockAvailabilityModel.insertMany.mockResolvedValue(mockResults as any);
      mockCacheService.clearProviderCache.mockResolvedValue(undefined);

      await service.create(createDto);

      const insertedSlots = mockAvailabilityModel.insertMany.mock.calls[0][0] as any[];
      
      // Verify time consistency across weeks
      insertedSlots.forEach((slot: any, index: number) => {
        const startTime = new Date(slot.startTime);
        const endTime = new Date(slot.endTime);
        
        // Should maintain same time each week
        expect(startTime.getHours()).toBe(14);
        expect(startTime.getMinutes()).toBe(30);
        expect(endTime.getHours()).toBe(15);
        expect(endTime.getMinutes()).toBe(30);
        
        // Should be Friday (day 5)
        expect(startTime.getDay()).toBe(5);
        expect(endTime.getDay()).toBe(5);
      });
    });
  });
});
