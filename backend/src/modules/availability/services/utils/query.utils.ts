import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument } from '../../availability.schema';
import { IAvailability } from '../../interfaces/availability.interface';
import { AvailabilityCacheService } from '../availability-cache.service';

@Injectable()
export class QueryUtils {
  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly cacheService: AvailabilityCacheService,
  ) {}

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

    const availability = await this.availabilityModel.findById(id).exec();
    if (!availability) {
      throw new NotFoundException(`Availability slot with ID ${id} not found`);
    }
    return availability.toObject();
  }
}
