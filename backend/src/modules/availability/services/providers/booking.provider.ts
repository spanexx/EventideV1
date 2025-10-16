import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument } from '../../availability.schema';
import { IAvailability } from '../../interfaces/availability.interface';
import { AvailabilityCacheService } from '../availability-cache.service';
import { AvailabilityEventsService } from '../availability-events.service';

@Injectable()
export class BookingProvider {
  private readonly logger = new Logger(BookingProvider.name);

  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly cacheService: AvailabilityCacheService,
    private readonly eventsService: AvailabilityEventsService,
  ) {}

  /**
   * Find and lock an availability slot by ID for booking
   */
  async findByIdAndLock(
    id: string,
    session: any,
  ): Promise<IAvailability | null> {
    // Check if this is a generated instance ID (contains underscore and date)
    // Format: originalId_YYYY-MM-DD
    let actualId = id;
    if (id.includes('_') && id.match(/_\d{4}-\d{2}-\d{2}$/)) {
      // Extract the original template ID
      actualId = id.split('_')[0];
      this.logger.log(`[findByIdAndLock] Instance ID detected: ${id}, using template ID: ${actualId}`);
    }
    
    const availability = await this.availabilityModel
      .findById(actualId)
      .session(session)
      .exec();
    
    if (!availability) {
      return null;
    }

    return availability.toObject();
  }

  /**
   * Mark an availability slot as booked
   */
  async markAsBooked(
    id: string,
    bookingId: string,
    session: any,
  ): Promise<IAvailability> {
    const availability = await this.availabilityModel
      .findByIdAndUpdate(
        id,
        {
          isBooked: true,
          bookingId: bookingId,
        },
        { new: true, session }
      )
      .exec();

    if (!availability) {
      throw new NotFoundException('Availability slot not found');
    }

    const result = availability.toObject();
    
    // Clear cache and emit events
    await this.cacheService.clearProviderCache(result.providerId);
    this.eventsService.emitBooked(result.providerId, result);
    
    return result;
  }

  /**
   * Mark an availability slot as available (unbooked)
   */
  async markAsAvailable(
    id: string,
    session: any,
  ): Promise<IAvailability> {
    const availability = await this.availabilityModel
      .findByIdAndUpdate(
        id,
        {
          isBooked: false,
          bookingId: null,
        },
        { new: true, session }
      )
      .exec();

    if (!availability) {
      throw new NotFoundException('Availability slot not found');
    }

    const result = availability.toObject();
    
    // Clear cache and emit events
    await this.cacheService.clearProviderCache(result.providerId);
    this.eventsService.emitUpdated(result.providerId, result);
    
    return result;
  }
}
