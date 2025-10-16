import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType } from '../../availability.schema';
import { UpdateAvailabilityDto } from '../../dto/update-availability.dto';
import { IAvailability } from '../../interfaces/availability.interface';
import { AvailabilityCacheService } from '../availability-cache.service';
import { AvailabilityEventsService } from '../availability-events.service';
import { AvailabilityValidationService } from '../availability-validation.service';

@Injectable()
export class ManagementUtils {
  private readonly logger = new Logger(ManagementUtils.name);

  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly cacheService: AvailabilityCacheService,
    private readonly eventsService: AvailabilityEventsService,
    private readonly validationService: AvailabilityValidationService,
  ) {}

  /**
   * Update an availability slot
   */
  async update(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<IAvailability> {
    try {
      const startTime = Date.now();
      
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
        throw new NotFoundException(`Availability slot with ID ${id} not found`);
      }

      const availability = result.toObject();
      
      // Clear cache and emit events
      await this.cacheService.clearProviderCache(availability.providerId);
      this.eventsService.emitUpdated(availability.providerId, availability);

      const duration = Date.now() - startTime;
      this.logger.log(`Updated availability slot ${id} in ${duration}ms`);

      return availability;
    } catch (error) {
      this.logger.error(`Failed to update availability slot ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an availability slot
   */
  async delete(id: string): Promise<{ success: boolean }> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException('Invalid availability ID format');
      }

      const availability = await this.availabilityModel.findById(id);
      if (!availability) {
        throw new NotFoundException(`Availability slot with ID ${id} not found`);
      }

      const availabilityObj = availability.toObject();
      await this.availabilityModel.findByIdAndDelete(id);
      
      // Clear cache and emit events
      await this.cacheService.clearProviderCache(availabilityObj.providerId);
      this.eventsService.emitDeleted(availabilityObj.providerId, availabilityObj.id);

      this.logger.log(`Deleted availability slot ${id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete availability slot ${id}:`, error);
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

    this.logger.log(`Cleaned up ${result.deletedCount} past one-off slots`);
    return result.deletedCount;
  }
}
