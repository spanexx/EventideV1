import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType } from '../availability.schema';
import { CachingService } from '../../../core/cache/caching.service';
import { IAvailability } from '../interfaces/availability.interface';

@Injectable()
export class AvailabilityCacheService {
  private readonly logger = new Logger(AvailabilityCacheService.name);

  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly cacheService: CachingService,
  ) {}

  /**
   * Get cached availability or fetch from database
   */
  async getCachedAvailability(
    providerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IAvailability[]> {
    const cacheKey = `availability:${providerId}`;

    try {
      // Try to get the result from the cache first
      const cachedAvailabilities = await this.cacheService.get<IAvailability[]>(cacheKey);
      if (cachedAvailabilities) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        
        // If we have date filters, filter the cached results
        if (startDate && endDate) {
          return this.filterAvailabilityByDateRange(cachedAvailabilities, startDate, endDate);
        }
        
        return cachedAvailabilities;
      }

      this.logger.debug(`Cache MISS for key: ${cacheKey}. Fetching from DB.`);

      // If cache miss, fetch from the database
      const result = await this.availabilityModel.find({ providerId });

      // Store the database result in the cache for future requests
      await this.cacheService.set(cacheKey, result);

      // If we have date filters, filter the results
      if (startDate && endDate) {
        return this.filterAvailabilityByDateRange(result, startDate, endDate);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve cached availability: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Filter availability by date range, handling both recurring and one-off slots
   */
  private filterAvailabilityByDateRange(
    slots: IAvailability[],
    startDate: Date,
    endDate: Date,
  ): IAvailability[] {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    this.logger.debug(`Filtering availability from ${start.toISOString()} to ${end.toISOString()}`);

    const filteredSlots: IAvailability[] = [];

    for (const slot of slots) {
      // Handle ONE-OFF slots
      if (slot.type === AvailabilityType.ONE_OFF && slot.date) {
        const slotDate = new Date(slot.date);
        slotDate.setHours(0, 0, 0, 0);
        
        if (slotDate >= start && slotDate <= end) {
          filteredSlots.push(slot);
          this.logger.debug(`Including ONE-OFF slot: ${slot.id} on ${slotDate.toISOString()}`);
        }
      }
      
      // Handle RECURRING slots - generate instances for matching days
      else if (slot.type === AvailabilityType.RECURRING && slot.dayOfWeek !== undefined) {
        const instances = this.generateRecurringInstances(slot, start, end);
        filteredSlots.push(...instances);
        
        if (instances.length > 0) {
          this.logger.debug(
            `Generated ${instances.length} instances from RECURRING template (dayOfWeek: ${slot.dayOfWeek})`
          );
        }
      }
    }

    this.logger.debug(`Filtered result: ${filteredSlots.length} slots`);
    return filteredSlots;
  }

  /**
   * Generate specific instances from a recurring template for a date range
   */
  private generateRecurringInstances(
    template: IAvailability,
    startDate: Date,
    endDate: Date,
  ): IAvailability[] {
    const instances: IAvailability[] = [];
    const current = new Date(startDate);
    
    // Iterate through each day in the range
    while (current <= endDate) {
      // Check if this day matches the template's dayOfWeek
      if (current.getDay() === template.dayOfWeek) {
        // Create an instance for this specific date
        const instance = this.createInstanceFromTemplate(template, current);
        instances.push(instance);
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
    
    return instances;
  }

  /**
   * Create a specific instance from a recurring template for a given date
   */
  private createInstanceFromTemplate(
    template: IAvailability,
    date: Date,
  ): IAvailability {
    // Get the time components from the template
    const templateStart = new Date(template.startTime);
    const templateEnd = new Date(template.endTime);
    
    // Create new date-times for the specific date
    const instanceStart = new Date(date);
    instanceStart.setHours(
      templateStart.getHours(),
      templateStart.getMinutes(),
      templateStart.getSeconds(),
      0
    );
    
    const instanceEnd = new Date(date);
    instanceEnd.setHours(
      templateEnd.getHours(),
      templateEnd.getMinutes(),
      templateEnd.getSeconds(),
      0
    );
    
    // Create the instance with the same properties as the template
    // but with specific date and times
    const instance: IAvailability = {
      id: `${template.id}_${date.toISOString().split('T')[0]}`, // Unique ID for this instance
      providerId: template.providerId, // Preserve provider ID
      type: AvailabilityType.ONE_OFF, // Instances are treated as one-off
      status: template.status,
      maxBookings: template.maxBookings,
      date: new Date(date),
      startTime: instanceStart,
      endTime: instanceEnd,
      duration: template.duration, // Preserve duration
      isBooked: false, // New instances are not booked
      dayOfWeek: undefined, // Remove dayOfWeek from instances
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    } as IAvailability;
    
    return instance;
  }

  /**
   * Clear cache for a provider
   */
  async clearProviderCache(providerId: string): Promise<void> {
    await this.cacheService.del(`availability:${providerId}`);
  }

  /**
   * Set cache for idempotency key
   */
  async setIdempotencyCache(key: string, data: any, ttlMinutes = 10): Promise<void> {
    const cacheKey = `idem:availability:${key}`;
    await this.cacheService.set(cacheKey, data, ttlMinutes * 60);
  }

  /**
   * Get cached idempotency result
   */
  async getIdempotencyCache<T>(key: string): Promise<T | null> {
    const cacheKey = `idem:availability:${key}`;
    const result = await this.cacheService.get<T>(cacheKey);
    return result ?? null; this.cacheService.get<T>(cacheKey);
  }
}
