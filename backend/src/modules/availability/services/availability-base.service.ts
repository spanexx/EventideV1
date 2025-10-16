import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType } from '../availability.schema';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { UpdateDaySlotQuantityDto } from '../dto/update-day-slot-quantity.dto';
import { IAvailability } from '../interfaces/availability.interface';
import { AvailabilityValidationService } from './availability-validation.service';
import { AvailabilityEventsService } from './availability-events.service';
import { AvailabilityCacheService } from './availability-cache.service';
import { AvailabilitySlotGeneratorService } from './availability-slot-generator.service';

@Injectable()
export class AvailabilityBaseService {
  private readonly logger = new Logger(AvailabilityBaseService.name);

  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly cacheService: AvailabilityCacheService,
    private readonly eventsService: AvailabilityEventsService,
    private readonly validationService: AvailabilityValidationService,
    private readonly slotGeneratorService: AvailabilitySlotGeneratorService,
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
    this.eventsService.emitUnbooked(result.providerId, result);
    
    return result;
  }

  /**
   * Find availability slots for a provider within a date range
   */
  async findByProviderAndDateRange(
    providerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IAvailability[]> {
    return this.cacheService.getCachedAvailability(providerId, startDate, endDate);
  }

  /**
   * Find an availability slot by ID
   */
  async findById(id: string): Promise<IAvailability> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid availability ID format');
    }

    const result = await this.availabilityModel.findById(id);
    if (!result) {
      throw new NotFoundException('Availability slot not found');
    }

    return result.toObject();
  }

  /**
   * Update an availability slot
   */
  async update(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<IAvailability> {
    try {
      const startTime = Date.now();
      this.logger.log(`Starting update operation for availability slot with ID ${id}`);
      
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException('Invalid availability ID format');
      }

      // Check for conflicts before updating
      if (
        updateAvailabilityDto.startTime ||
        updateAvailabilityDto.endTime ||
        updateAvailabilityDto.date
      ) {
        await this.validationService.checkForConflicts(updateAvailabilityDto, id);
      }

      const result = await this.availabilityModel.findByIdAndUpdate(
        id,
        updateAvailabilityDto,
        { new: true },
      );

      if (!result) {
        throw new NotFoundException('Availability slot not found');
      }

      const updatedSlot = result.toObject();

      // Clear cache and emit events
      await this.cacheService.clearProviderCache(updatedSlot.providerId);
      this.eventsService.emitUpdated(updatedSlot.providerId, updatedSlot);

      const endTime = Date.now();
      this.logger.log(`Updated availability slot with ID ${id} in ${endTime - startTime}ms`);
      
      return updatedSlot;
    } catch (error) {
      this.logger.error(
        `Failed to update availability slot: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Delete an availability slot
   */
  async delete(id: string): Promise<{ success: boolean }> {
    try {
      // Handle composite IDs (providerId_date format)
      let actualId = id;
      if (id.includes('_')) {
        actualId = id.split('_')[0];
      }
      
      if (!Types.ObjectId.isValid(actualId)) {
        throw new NotFoundException('Invalid availability ID format');
      }

      const result = await this.availabilityModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException('Availability slot not found');
      }

      // Clear cache and emit events
      await this.cacheService.clearProviderCache(result.providerId);
      this.eventsService.emitDeleted(result.providerId, id);

      this.logger.log(`Deleted availability slot with ID ${id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete availability slot: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Remove past one-off availability slots
   */
  async cleanupPastOneOffSlots(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await this.availabilityModel.deleteMany({
      type: AvailabilityType.ONE_OFF,
      date: { $lt: today },
    });

    const count = (result as any)?.deletedCount ?? 0;
    
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} past one-off availability slots`);
    }
    
    return count;
  }

  /**
   * Adjust the number of slots for a specific day
   */
  async adjustDaySlotQuantity(updateDto: UpdateDaySlotQuantityDto): Promise<IAvailability[]> {
    const { providerId, date, numberOfSlots, minutesPerSlot, breakTime, isRecurring } = updateDto;

    const slots = await this.slotGeneratorService.generateEvenlyDistributedSlots(
      providerId,
      date,
      numberOfSlots || 1,
      minutesPerSlot,
      breakTime,
      isRecurring
    );

    await this.availabilityModel.deleteMany({
      providerId,
      type: AvailabilityType.ONE_OFF,
      date: new Date(date)
    });

    const createdSlots = await Promise.all(
      slots.map(slot => this.availabilityModel.create(slot))
    );

    await this.cacheService.clearProviderCache(providerId);
    
    for (const slot of createdSlots) {
      this.eventsService.emitCreated(providerId, slot);
    }

    return createdSlots;
  }

  // Delegate to specialized services
  get validation() {
    return this.validationService;
  }

  get events() {
    return this.eventsService;
  }

  get cache() {
    return this.cacheService;
  }

  get generator() {
    return this.slotGeneratorService;
  }

  get model() {
    return this.availabilityModel;
  }
}
