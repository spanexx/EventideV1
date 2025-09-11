import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType } from './availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateAllDayAvailabilityDto } from './dto/create-all-day-availability.dto';
import { IAvailability } from './interfaces/availability.interface';
import { CachingService } from '../../core/cache/caching.service';
import { WebsocketsService } from '../../core/websockets';

@Injectable()
export class AvailabilityService {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
    private readonly cacheService: CachingService,
    private readonly websocketsService: WebsocketsService,
  ) {}

  /**
   * Create a new availability slot
   * @param createAvailabilityDto - Data for creating availability slot
   * @returns The created availability slot
   */
  async create(
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<IAvailability> {
    try {
      // Check for conflicts before creating
      await this.checkForConflicts(createAvailabilityDto);

      const result = await this.availabilityModel.create(createAvailabilityDto);

      // Clear cache for this provider
      await this.cacheService.del(
        `availability:${createAvailabilityDto.providerId}`,
      );

      // Emit WebSocket event for real-time updates
      this.websocketsService.emitToRoom(
        `provider-${createAvailabilityDto.providerId}`,
        'availabilityCreated',
        result,
      );
      this.websocketsService.emitToAll('availabilityUpdated', {
        providerId: createAvailabilityDto.providerId,
        action: 'created',
        data: result,
      });

      this.logger.log(
        `Created availability slot for provider ${createAvailabilityDto.providerId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create availability slot: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find availability slots for a provider within a date range
   * @param providerId - The provider's ID
   * @param startDate - Start date for the query
   * @param endDate - End date for the query
   * @returns Array of availability slots
   */
  async findByProviderAndDateRange(
    providerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IAvailability[]> {
    try {
      // Ensure dates are proper Date objects
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      
      // Check cache first
      const cacheKey = `availability:${providerId}:${start?.toISOString()}:${end?.toISOString()}`;
      const cached = await this.cacheService.get<IAvailability[]>(cacheKey);
      if (cached) {
        this.logger.log(
          `Retrieved availability from cache for provider ${providerId}`,
        );
        return cached;
      }

      // Build query
      const query: any = { providerId };

      // For recurring slots, we don't filter by date
      // For one-off slots, we filter by date range
      const dateConditions: any[] = [];

      // Add condition for one-off slots within date range
      if (start || end) {
        const oneOffCondition: any = { type: 'one_off' };
        if (start) {
          oneOffCondition.date = { ...oneOffCondition.date, $gte: start };
        }
        if (end) {
          oneOffCondition.date = { ...oneOffCondition.date, $lte: end };
        }
        dateConditions.push(oneOffCondition);
      } else {
        // If no date range specified, get all one-off slots
        dateConditions.push({ type: 'one_off' });
      }

      // Add condition for recurring slots (no date filtering)
      dateConditions.push({ type: 'recurring' });

      query.$or = dateConditions;

      const result = await this.availabilityModel.find(query);

      // Cache the result
      await this.cacheService.set(cacheKey, result, 300); // 5 minutes

      this.logger.log(
        `Retrieved ${result.length} availability slots for provider ${providerId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve availability slots: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find an availability slot by ID
   * @param id - The availability slot ID
   * @returns The availability slot
   */
  async findById(id: string): Promise<IAvailability> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException('Invalid availability ID');
      }

      const result = await this.availabilityModel.findById(id);
      if (!result) {
        throw new NotFoundException(
          `Availability slot with ID ${id} not found`,
        );
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve availability slot: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Update an availability slot
   * @param id - The availability slot ID
   * @param updateAvailabilityDto - Data for updating the availability slot
   * @returns The updated availability slot
   */
  async update(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<IAvailability> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException('Invalid availability ID');
      }

      // Check for conflicts before updating
      if (
        updateAvailabilityDto.startTime ||
        updateAvailabilityDto.endTime ||
        updateAvailabilityDto.date
      ) {
        const existing = await this.findById(id);
        const conflictCheckDto = {
          ...existing.toObject(),
          ...updateAvailabilityDto,
        };
        await this.checkForConflicts(conflictCheckDto, id);
      }

      const result = await this.availabilityModel.findByIdAndUpdate(
        id,
        updateAvailabilityDto,
        { new: true },
      );

      if (!result) {
        throw new NotFoundException(
          `Availability slot with ID ${id} not found`,
        );
      }

      // Clear cache for this provider
      await this.cacheService.del(`availability:${result.providerId}`);

      // Emit WebSocket event for real-time updates
      this.websocketsService.emitToRoom(
        `provider-${result.providerId}`,
        'availabilityUpdated',
        result,
      );
      this.websocketsService.emitToAll('availabilityUpdated', {
        providerId: result.providerId,
        action: 'updated',
        data: result,
      });

      this.logger.log(`Updated availability slot with ID ${id}`);
      return result;
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
   * @param id - The availability slot ID
   * @returns Success confirmation
   */
  async delete(id: string): Promise<{ success: boolean }> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException('Invalid availability ID');
      }

      const result = await this.availabilityModel.findByIdAndDelete(id);
      if (!result) {
        throw new NotFoundException(
          `Availability slot with ID ${id} not found`,
        );
      }

      // Clear cache for this provider
      await this.cacheService.del(`availability:${result.providerId}`);

      // Emit WebSocket event for real-time updates
      this.websocketsService.emitToRoom(
        `provider-${result.providerId}`,
        'availabilityDeleted',
        { id },
      );
      this.websocketsService.emitToAll('availabilityUpdated', {
        providerId: result.providerId,
        action: 'deleted',
        data: { id },
      });

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
   * Check for conflicts with existing availability slots
   * @param availabilityDto - Availability data to check
   * @param excludeId - ID to exclude from conflict check (for updates)
   * @returns Promise that resolves if no conflicts, rejects if conflicts found
   */
  private async checkForConflicts(
    availabilityDto: CreateAvailabilityDto | UpdateAvailabilityDto,
    excludeId?: string,
  ): Promise<void> {
    const { providerId, startTime, endTime, date } = availabilityDto;

    // Build conflict query
    const query: any = {
      providerId,
      $or: [
        // Check for overlapping time ranges
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime },
        },
      ],
    };

    // Add date condition if it's a one-off slot
    if (date) {
      query.date = date;
    }

    // Exclude the current slot if updating
    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    const conflictingSlots = await this.availabilityModel.find(query);

    if (conflictingSlots.length > 0) {
      throw new ConflictException(
        'This availability slot conflicts with an existing slot',
      );
    }
  }

  /**
   * Create multiple availability slots for an all-day period
   * @param createAllDayAvailabilityDto - Data for creating all-day availability slots
   * @returns Array of created availability slots
   */
  async createAllDaySlots(
    createAllDayAvailabilityDto: CreateAllDayAvailabilityDto,
  ): Promise<IAvailability[]> {
    try {
      const { 
        providerId, 
        date, 
        numberOfSlots, 
        autoDistribute = true, 
        slots = [],
        isRecurring = false,
        dayOfWeek
      } = createAllDayAvailabilityDto;

      // Generate slots based on configuration
      let slotsToCreate: CreateAvailabilityDto[] = [];

      if (autoDistribute) {
        // Auto-distribute slots evenly throughout the working day (8 AM to 8 PM)
        slotsToCreate = this.generateEvenlyDistributedSlots(
          providerId,
          date,
          numberOfSlots || 1, // Provide default value of 1 if numberOfSlots is undefined
          isRecurring,
          dayOfWeek
        );
      } else {
        // Use provided slot configurations
        slotsToCreate = slots.map(slot => ({
          providerId,
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          dayOfWeek: isRecurring ? dayOfWeek : undefined,
          isBooked: false
        }));
      }

      // Check for conflicts for each slot
      const createdSlots: IAvailability[] = [];
      for (const slotDto of slotsToCreate) {
        try {
          await this.checkForConflicts(slotDto);
          
          // Create the slot
          const result = await this.availabilityModel.create(slotDto);
          createdSlots.push(result);
        } catch (error) {
          this.logger.error(
            `Failed to create all-day slot: ${error.message}`,
            error.stack,
          );
          // Continue with other slots even if one fails
        }
      }

      // Clear cache for this provider
      await this.cacheService.del(`availability:${providerId}`);

      // Emit WebSocket events for real-time updates
      for (const slot of createdSlots) {
        this.websocketsService.emitToRoom(
          `provider-${providerId}`,
          'availabilityCreated',
          slot,
        );
      }
      
      this.websocketsService.emitToAll('availabilityUpdated', {
        providerId,
        action: 'created',
        data: createdSlots,
      });

      this.logger.log(
        `Created ${createdSlots.length} all-day availability slots for provider ${providerId}`,
      );
      return createdSlots;
    } catch (error) {
      this.logger.error(
        `Failed to create all-day availability slots: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate evenly distributed slots throughout a working day
   * @param providerId - The provider ID
   * @param date - The date for the slots
   * @param numberOfSlots - Number of slots to create
   * @param isRecurring - Whether this is for recurring availability
   * @param dayOfWeek - Day of week for recurring slots
   * @returns Array of CreateAvailabilityDto objects
   */
  private generateEvenlyDistributedSlots(
    providerId: string,
    date: Date,
    numberOfSlots: number,
    isRecurring: boolean = false,
    dayOfWeek?: number
  ): CreateAvailabilityDto[] {
    const slots: CreateAvailabilityDto[] = [];
    
    // Working hours: 8 AM to 8 PM (12 hours = 720 minutes)
    const workingStart = new Date(date);
    workingStart.setHours(8, 0, 0, 0);
    
    const workingEnd = new Date(date);
    workingEnd.setHours(20, 0, 0, 0);
    
    const workingMinutes = 720; // 12 hours in minutes
    const breakTime = 15; // 15 minutes break between slots
    
    // Calculate time per slot including breaks
    // Total time = (slots * slot_time) + ((slots - 1) * break_time)
    // slot_time = (workingMinutes - ((numberOfSlots - 1) * breakTime)) / numberOfSlots
    const totalTimeForBreaks = (numberOfSlots - 1) * breakTime;
    const timePerSlot = (workingMinutes - totalTimeForBreaks) / numberOfSlots;
    
    // Ensure we have a reasonable slot duration (at least 15 minutes)
    if (timePerSlot < 15) {
      // Adjust the number of slots to fit within working hours
      const adjustedNumberOfSlots = Math.floor((workingMinutes + breakTime) / (15 + breakTime));
      numberOfSlots = adjustedNumberOfSlots > 0 ? adjustedNumberOfSlots : 1;
    }
    
    // Distribute slots
    let currentTime = new Date(workingStart);
    
    for (let i = 0; i < numberOfSlots; i++) {
      const startTime = new Date(currentTime);
      const endTime = new Date(currentTime.getTime() + timePerSlot * 60000);
      
      const slot: CreateAvailabilityDto = {
        providerId,
        date,
        startTime,
        endTime,
        duration: Math.round(timePerSlot),
        type: isRecurring ? AvailabilityType.RECURRING : AvailabilityType.ONE_OFF,
        dayOfWeek: isRecurring ? dayOfWeek : undefined,
        isBooked: false
      };
      
      slots.push(slot);
      
      // Add break time for next slot (except for the last slot)
      if (i < numberOfSlots - 1) {
        currentTime = new Date(endTime.getTime() + breakTime * 60000);
      }
    }
    
    return slots;
  }
}
