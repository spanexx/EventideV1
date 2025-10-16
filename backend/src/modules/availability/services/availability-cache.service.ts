import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType, AvailabilityStatus } from '../availability.schema';
import { IAvailabilityBase } from '../interfaces/availability.interface';

// Import modular components
import { CacheProvider } from './providers/cache.provider';
import { BookingUtils } from './utils/booking.utils';
import { RecurringStrategy } from './strategies/recurring.strategy';
import { DateFilterUtils } from './utils/date-filter.utils';

type AvailabilityData = any; // Simplified for now

@Injectable()
export class AvailabilityCacheService {
  private readonly logger = new Logger(AvailabilityCacheService.name);

  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly cacheProvider: CacheProvider,
    private readonly bookingUtils: BookingUtils,
    private readonly recurringStrategy: RecurringStrategy,
    private readonly dateFilterUtils: DateFilterUtils,
  ) {}

  /**
   * Get cached availability or fetch from database
   */
  async getCachedAvailability(
    providerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IAvailabilityBase[]> {
    // If no date range provided, return all slots
    if (!startDate || !endDate) {
      return await this.availabilityModel.find({ providerId });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const cacheKey = `availability:${providerId}:${start.toISOString()}:${end.toISOString()}`;

    // Use cache provider to get cached result or fetch from database
    return await this.cacheProvider.getCachedAvailability(cacheKey, async () => {
      return await this.fetchAvailabilityFromDatabase(providerId, start, end);
    });
  }

  /**
   * Fetch availability from database (private method extracted)
   */
  private async fetchAvailabilityFromDatabase(
    providerId: string,
    start: Date,
    end: Date,
  ): Promise<IAvailabilityBase[]> {
    // Get one-off slots for the date range
    const oneOffSlots = await this.availabilityModel.find({
      providerId,
      type: AvailabilityType.ONE_OFF,
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    }).lean<AvailabilityData[]>();

    // Get recurring slots for the date range
    const recurringSlots = await this.availabilityModel.find({
      providerId,
      type: AvailabilityType.RECURRING,
      date: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    }).lean<AvailabilityData[]>();

    const bookedSlots = await this.bookingUtils.getBookedSlots(providerId, start, end);

    // Get current time for filtering past slots
    const now = new Date();

    // Filter one-off slots that aren't in the past and convert to IAvailability
    const availableOneOffSlots = oneOffSlots
      .filter(slot => {
        const slotStartTime = new Date(slot.startTime);
        return slotStartTime > now; // Only exclude past slots, keep booked slots visible
      })
      .map(slot => ({
        id: slot._id.toString(),
        providerId: slot.providerId,
        type: slot.type,
        dayOfWeek: slot.dayOfWeek,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        isBooked: slot.isBooked,
        maxBookings: slot.maxBookings,
        status: slot.status as AvailabilityStatus,
        isTemplate: false,
        isInstantiated: false,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt
      }));

    // Create a map of existing one-off slots by date+time to prevent duplicates
    const oneOffSlotMap = new Map<string, boolean>();

    // Add available slots
    availableOneOffSlots.forEach(slot => {
      const key = `${new Date(slot.startTime).toISOString()}_${slot.duration}`;
      oneOffSlotMap.set(key, true);
    });

    // Also add booked one-off slots to prevent recurring instances at same time
    oneOffSlots.forEach(slot => {
      if (slot.isBooked || bookedSlots[slot._id.toString()]) {
        const key = `${new Date(slot.startTime).toISOString()}_${slot.duration}`;
        oneOffSlotMap.set(key, true);
      }
    });

    // Filter recurring slots that aren't in the past
    const availableRecurringSlots = recurringSlots
      .filter(slot => {
        const slotStartTime = new Date(slot.startTime);
        return slotStartTime > now;
      })
      .map(slot => ({
        id: slot._id.toString(),
        providerId: slot.providerId,
        type: slot.type,
        dayOfWeek: slot.dayOfWeek,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        duration: slot.duration,
        isBooked: slot.isBooked,
        maxBookings: slot.maxBookings,
        status: slot.status as AvailabilityStatus,
        weekOf: slot.weekOf,
        createdAt: slot.createdAt,
        updatedAt: slot.updatedAt
      }));

    // Combine and sort all slots (including booked ones)
    const availableSlots: IAvailabilityBase[] = [...availableOneOffSlots, ...availableRecurringSlots].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return availableSlots;
  }

  /**
   * Clear cache for a provider
   */
  async clearProviderCache(providerId: string): Promise<void> {
    return this.cacheProvider.clearProviderCache(providerId);
  }

  /**
   * Set cache for idempotency key
   */
  async setIdempotencyCache(key: string, data: any, ttlMinutes = 10): Promise<void> {
    return this.cacheProvider.setIdempotencyCache(key, data, ttlMinutes);
  }

  /**
   * Get cached idempotency result
   */
  async getIdempotencyCache<T>(key: string): Promise<T | null> {
    return this.cacheProvider.getIdempotencyCache<T>(key);
  }
}
