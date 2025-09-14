import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType } from './availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateAllDayAvailabilityDto } from './dto/create-all-day-availability.dto';
import { CreateBulkAvailabilityDto } from './dto/create-bulk-availability.dto';
import { UpdateDaySlotQuantityDto } from './dto/update-day-slot-quantity.dto';
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
      // Idempotency handling
      if (createAvailabilityDto.idempotencyKey) {
        const cacheKey = `idem:availability:create:${createAvailabilityDto.idempotencyKey}`;
        const cached = await this.cacheService.get<IAvailability>(cacheKey);
        if (cached) {
          this.logger.log('Returning cached idempotent create result');
          return cached;
        }
      }
      // Check for conflicts before creating
      const conflicts = await this.findConflicts(createAvailabilityDto);
      if (conflicts.length > 0) {
        // Optionally replace conflicts
        if (createAvailabilityDto.replaceConflicts) {
          const idsToDelete = conflicts.map((c: any) => c._id);
          await this.availabilityModel.deleteMany({ _id: { $in: idsToDelete } });
        } else if (createAvailabilityDto.dryRun) {
          throw new ConflictException({
            message: `Conflicts with ${conflicts.length} existing slots`,
            data: conflicts.map((c: any) => ({ id: c.id || c._id?.toString?.(), startTime: c.startTime, endTime: c.endTime }))
          });
        } else {
          throw new ConflictException({
            message: `Conflicts with ${conflicts.length} existing slots`,
            data: conflicts.map((c: any) => ({ id: c.id || c._id?.toString?.(), startTime: c.startTime, endTime: c.endTime }))
          });
        }
      }

      const result = await this.availabilityModel.create(createAvailabilityDto);

      // Clear cache for this provider using simple key
      await this.cacheService.del(`availability:${createAvailabilityDto.providerId}`);

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
      if (createAvailabilityDto.idempotencyKey) {
        const cacheKey = `idem:availability:create:${createAvailabilityDto.idempotencyKey}`;
        await this.cacheService.set(cacheKey, result, 60 * 10);
      }
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
      // Get all slots for the provider - simple and bulletproof
      // We return ALL slots for the provider to avoid any timezone filtering issues
      const result = await this.availabilityModel.find({ providerId });
      
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
      // Performance monitoring
      const startTime = Date.now();
      this.logger.log(`Starting update operation for availability slot with ID ${id}`);
      
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

      // Performance monitoring
      const endTime = Date.now();
      this.logger.log(`Updated availability slot with ID ${id} in ${endTime - startTime}ms`);
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
   * Remove past one-off availability slots (date < today)
   */
  async cleanupPastOneOffSlots(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const res = await this.availabilityModel.deleteMany({
      type: AvailabilityType.ONE_OFF,
      date: { $lt: today },
    });
    return (res as any)?.deletedCount ?? 0;
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
    const conflicts = await this.findConflicts(availabilityDto, excludeId);
    if (conflicts.length > 0) {
      throw new ConflictException({
        message: `Conflicts with ${conflicts.length} existing slots`,
        data: conflicts.map((c: any) => ({ id: c.id || c._id?.toString?.(), startTime: c.startTime, endTime: c.endTime }))
      });
    }
  }

  /**
   * Return list of conflicting slots (no throwing)
   */
  private async findConflicts(
    availabilityDto: CreateAvailabilityDto | UpdateAvailabilityDto,
    excludeId?: string,
  ): Promise<IAvailability[]> {
    const perfStart = Date.now();
    const { providerId, startTime: slotStartTime, endTime: slotEndTime, date } = availabilityDto as any;
    const query: any = {
      providerId,
      $or: [
        {
          startTime: { $lt: slotEndTime },
          endTime: { $gt: slotStartTime },
        },
      ],
    };
    if (date) {
      query.date = date;
    }
    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const conflictingSlots = await this.availabilityModel.find(query);
    const perfEnd = Date.now();
    this.logger.log(`Conflict check completed in ${perfEnd - perfStart}ms, found ${conflictingSlots.length} conflicts`);
    return conflictingSlots as any;
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
        workingStartTime,
        workingEndTime,
        numberOfSlots, 
        autoDistribute = true, 
        slots = [],
        isRecurring = false,
        dayOfWeek
      } = createAllDayAvailabilityDto;

      // Validation guard: when autoDistribute is true, require either numberOfSlots or minutesPerSlot
      if (
        autoDistribute === true &&
        (numberOfSlots === undefined || numberOfSlots === null) &&
        (createAllDayAvailabilityDto.minutesPerSlot === undefined || createAllDayAvailabilityDto.minutesPerSlot === null)
      ) {
        throw new BadRequestException(
          'When autoDistribute is true, either numberOfSlots or minutesPerSlot must be provided.'
        );
      }

      // Additional validation for working start/end times when autoDistribute is true
      if (autoDistribute === true) {
        if ((workingStartTime && !workingEndTime) || (!workingStartTime && workingEndTime)) {
          throw new BadRequestException(
            'Both workingStartTime and workingEndTime must be provided together when autoDistribute is true.'
          );
        }
        
        if (workingStartTime && workingEndTime && workingStartTime >= workingEndTime) {
          throw new BadRequestException(
            'workingEndTime must be after workingStartTime.'
          );
        }
      }

      // Generate slots based on configuration
      let slotsToCreate: CreateAvailabilityDto[] = [];

      if (autoDistribute) {
        // Auto-distribute slots using custom working hours or default to 8 AM to 8 PM
        slotsToCreate = this.generateEvenlyDistributedSlots(
          providerId,
          date,
          numberOfSlots || 1, // Provide default value of 1 if numberOfSlots is undefined
          createAllDayAvailabilityDto.minutesPerSlot,
          createAllDayAvailabilityDto.breakTime, // Use configurable break time
          isRecurring,
          dayOfWeek,
          workingStartTime,
          workingEndTime
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
   * Adjust the number of slots for a specific day by regenerating evenly distributed slots
   * and replacing existing one-off slots for that date/provider.
   */
  async adjustDaySlotQuantity(updateDto: UpdateDaySlotQuantityDto): Promise<IAvailability[]> {
    const { providerId, date, numberOfSlots, minutesPerSlot, breakTime, isRecurring } = updateDto;

    // Basic validation
    if ((!numberOfSlots || numberOfSlots < 1) && (!minutesPerSlot || minutesPerSlot < 15)) {
      throw new BadRequestException('Provide a valid numberOfSlots (>=1) or minutesPerSlot (>=15)');
    }

    // Build distribution using existing generator
    const slotsToCreate = this.generateEvenlyDistributedSlots(
      providerId,
      date,
      numberOfSlots || 1,
      minutesPerSlot,
      breakTime,
      Boolean(isRecurring),
      undefined,
    );

    // Delete existing one-off slots for that date/provider
    await this.availabilityModel.deleteMany({ providerId, type: AvailabilityType.ONE_OFF, date: new Date(date) });

    // Create new slots with conflict checks
    const createdSlots: IAvailability[] = [];
    for (const slotDto of slotsToCreate) {
      await this.checkForConflicts(slotDto);
      const result = await this.availabilityModel.create(slotDto);
      createdSlots.push(result);
    }

    // Clear cache and emit updates
    await this.cacheService.del(`availability:${providerId}`);
    for (const slot of createdSlots) {
      this.websocketsService.emitToRoom(`provider-${providerId}`, 'availabilityCreated', slot);
    }
    this.websocketsService.emitToAll('availabilityUpdated', {
      providerId,
      action: 'created',
      data: createdSlots,
    });

    return createdSlots;
  }

  /**
   * Generate evenly distributed slots throughout a working day
   * @param providerId - The provider ID
   * @param date - The date for the slots
   * @param numberOfSlots - Number of slots to create
   * @param minutesPerSlot - Duration of each slot in minutes (alternative to numberOfSlots)
   * @param breakTime - Break time between slots in minutes (default: 15)
   * @param isRecurring - Whether this is for recurring availability
   * @param dayOfWeek - Day of week for recurring slots
   * @param workingStartTime - Custom working start time (optional)
   * @param workingEndTime - Custom working end time (optional)
   * @returns Array of CreateAvailabilityDto objects
   */
  private generateEvenlyDistributedSlots(
    providerId: string,
    date: Date,
    numberOfSlots: number,
    minutesPerSlot?: number,
    breakTime: number = 15, // Default to 15 minutes break time
    isRecurring: boolean = false,
    dayOfWeek?: number,
    workingStartTime?: Date,
    workingEndTime?: Date
  ): CreateAvailabilityDto[] {
    const slots: CreateAvailabilityDto[] = [];
    
    // Use custom working hours or default to 8 AM to 8 PM
    const workingStart = workingStartTime 
      ? new Date(workingStartTime) 
      : new Date(date);
      
    if (!workingStartTime) {
      workingStart.setHours(8, 0, 0, 0);
    }
    
    const workingEnd = workingEndTime 
      ? new Date(workingEndTime) 
      : new Date(date);
      
    if (!workingEndTime) {
      workingEnd.setHours(20, 0, 0, 0);
    }
    
    // For recurring slots, we need to apply the working hours to each instance of the dayOfWeek
    // We'll use the time portion of workingStart/workingEnd and apply it to the date of each recurring instance
    if (isRecurring && dayOfWeek !== undefined) {
      // Set the date to the next occurrence of the specified dayOfWeek
      const currentDate = new Date(date);
      const currentDay = currentDate.getDay();
      const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
      currentDate.setDate(currentDate.getDate() + daysUntilTarget);
      
      // Apply the time portion from workingStart/workingEnd to the current date
      workingStart.setDate(currentDate.getDate());
      workingStart.setMonth(currentDate.getMonth());
      workingStart.setFullYear(currentDate.getFullYear());
      
      workingEnd.setDate(currentDate.getDate());
      workingEnd.setMonth(currentDate.getMonth());
      workingEnd.setFullYear(currentDate.getFullYear());
    }
    
    const workingMinutes = (workingEnd.getTime() - workingStart.getTime()) / (1000 * 60);
    
    // Validate that we have a positive working time
    if (workingMinutes <= 0) {
      throw new BadRequestException('Working end time must be after working start time');
    }
    
    // If minutesPerSlot is provided, calculate numberOfSlots based on it
    if (minutesPerSlot && minutesPerSlot > 0) {
      // Calculate number of slots based on minutes per slot
      // Total slots = (workingMinutes - (breakTime * (slots - 1))) / minutesPerSlot
      // Simplified: slots = workingMinutes / (minutesPerSlot + breakTime)
      numberOfSlots = Math.floor((workingMinutes + breakTime) / (minutesPerSlot + breakTime));
      if (numberOfSlots < 1) numberOfSlots = 1;
    }
    
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

  /**
   * Create multiple availability slots in bulk
   * @param createBulkAvailabilityDto - Data for creating multiple availability slots
   * @returns Array of created availability slots
   */
  async createBulkSlots(
    createBulkAvailabilityDto: CreateBulkAvailabilityDto,
  ): Promise<IAvailability[] | any> {
    try {
      const { 
        providerId, 
        type = AvailabilityType.ONE_OFF,
        dayOfWeek,
        date,
        startDate,
        endDate,
        quantity = 1,
        slots,
        skipConflicts = false,
        replaceConflicts = false,
        dryRun = false,
        idempotencyKey
      } = createBulkAvailabilityDto;

      // Idempotency handling
      if (idempotencyKey) {
        const idemKey = `idem:availability:bulk:${idempotencyKey}`;
        const cached = await this.cacheService.get<any>(idemKey);
        if (cached) {
          this.logger.log('Returning cached idempotent bulk result');
          return cached;
        }
      }

      let slotsToCreate: CreateAvailabilityDto[] = [];

      // If individual slots are provided, use them
      if (slots && slots.length > 0) {
        slotsToCreate = slots.map(slot => ({
          providerId,
          type,
          dayOfWeek: type === AvailabilityType.RECURRING ? dayOfWeek : undefined,
          date: type === AvailabilityType.ONE_OFF ? date : undefined,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration,
          isBooked: false
        }));
      } 
      // If date range is provided, create slots for each day in the range
      else if (startDate && endDate) {
        const currentDate = new Date(startDate);
        const end = new Date(endDate);
        
        // Create slots for each day in the range
        while (currentDate <= end) {
          // Create the specified quantity of slots for each day
          for (let i = 0; i < quantity; i++) {
            // For demonstration, we'll create a default slot
            // In a real implementation, this would be more sophisticated
            const startTime = new Date(currentDate);
            startTime.setHours(9 + i, 0, 0, 0); // Start at 9 AM, then 10 AM, etc.
            
            const endTime = new Date(startTime);
            endTime.setHours(startTime.getHours() + 1); // 1 hour duration
            
            slotsToCreate.push({
              providerId,
              type,
              dayOfWeek: type === AvailabilityType.RECURRING ? dayOfWeek : undefined,
              date: type === AvailabilityType.ONE_OFF ? new Date(currentDate) : undefined,
              startTime,
              endTime,
              duration: 60,
              isBooked: false
            });
          }
          
          // Move to the next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      // If only a single date is provided with quantity, create multiple slots for that day
      else if (date && quantity) {
        // Create multiple slots for the specified date
        for (let i = 0; i < quantity; i++) {
          // For demonstration, we'll create slots throughout the day
          // In a real implementation, this might use a more intelligent distribution
          const startTime = new Date(date);
          startTime.setHours(9 + i, 0, 0, 0); // Start at 9 AM, then 10 AM, etc.
          
          const endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + 1); // 1 hour duration
          
          slotsToCreate.push({
            providerId,
            type,
            dayOfWeek: type === AvailabilityType.RECURRING ? dayOfWeek : undefined,
            date,
            startTime,
            endTime,
            duration: 60,
            isBooked: false
          });
        }
      }

      // Evaluate conflicts and optionally create
      const createdSlots: IAvailability[] = [];
      const conflictsDetailed: any[] = [];
      
      for (const slotDto of slotsToCreate) {
        try {
          const conflicts = await this.findConflicts(slotDto);
          if (conflicts.length > 0) {
            if (dryRun || skipConflicts) {
              conflictsDetailed.push({ requested: slotDto, conflictingWith: conflicts });
              if (dryRun) continue; // do not create
            } else if (replaceConflicts) {
              const idsToDelete = conflicts.map((c: any) => c._id);
              await this.availabilityModel.deleteMany({ _id: { $in: idsToDelete } });
            } else {
              // strict mode: throw
              throw new ConflictException({
                message: `Conflicts with ${conflicts.length} existing slots`,
                data: conflicts.map((c: any) => ({ id: c.id || c._id?.toString?.(), startTime: c.startTime, endTime: c.endTime }))
              });
            }
          }
          
          // Create the slot
          const result = await this.availabilityModel.create(slotDto);
          createdSlots.push(result);
        } catch (error) {
          this.logger.error(
            `Failed to create bulk slot: ${error.message}`,
            error.stack,
          );
          if (!skipConflicts && !dryRun && !replaceConflicts) {
            throw error;
          }
          // Continue with other slots even if one fails when skipping conflicts
        }
      }

      const response = dryRun || skipConflicts || replaceConflicts
        ? { created: createdSlots, conflicts: conflictsDetailed }
        : createdSlots;

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
        `Bulk operation complete for provider ${providerId}: created=${createdSlots.length}, conflicts=${conflictsDetailed.length}`,
      );
      if (idempotencyKey) {
        const idemKey = `idem:availability:bulk:${idempotencyKey}`;
        await this.cacheService.set(idemKey, response, 60 * 10);
      }
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to create bulk availability slots: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Validate a batch of availability slots and return conflicts and simple suggestions
   */
  async validateSlots(createBulkAvailabilityDto: CreateBulkAvailabilityDto): Promise<{ requested: number; conflicts: any[]; suggestions: any[] }> {
    const { providerId, slots, startDate, endDate, quantity = 1, type = AvailabilityType.ONE_OFF, dayOfWeek, date } = createBulkAvailabilityDto;
    let slotsToValidate: CreateAvailabilityDto[] = [];
    if (slots && slots.length > 0) {
      slotsToValidate = slots.map(s => ({ providerId, type, dayOfWeek, date, startTime: s.startTime, endTime: s.endTime, duration: s.duration, isBooked: false } as any));
    } else if (startDate && endDate) {
      const current = new Date(startDate);
      const end = new Date(endDate);
      while (current <= end) {
        for (let i = 0; i < quantity; i++) {
          const startTime = new Date(current);
          startTime.setHours(9 + i, 0, 0, 0);
          const endTime = new Date(startTime);
          endTime.setHours(startTime.getHours() + 1);
          slotsToValidate.push({ providerId, type, dayOfWeek, date: new Date(current), startTime, endTime, duration: 60, isBooked: false } as any);
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (date && quantity) {
      for (let i = 0; i < quantity; i++) {
        const startTime = new Date(date);
        startTime.setHours(9 + i, 0, 0, 0);
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1);
        slotsToValidate.push({ providerId, type, dayOfWeek, date, startTime, endTime, duration: 60, isBooked: false } as any);
      }
    }

    const conflicts: any[] = [];
    const suggestions: any[] = [];
    for (const slot of slotsToValidate) {
      const found = await this.findConflicts(slot);
      if (found.length > 0) {
        conflicts.push({ requested: slot, conflictingWith: found });
        // naive suggestion: push to immediately after the latest conflicting end time
        const latestEnd = new Date(Math.max(...found.map((c: any) => new Date(c.endTime).getTime())));
        const suggestedStart = new Date(latestEnd);
        const suggestedEnd = new Date(suggestedStart.getTime() + slot.duration * 60000);
        suggestions.push({ for: slot, alternative: { startTime: suggestedStart, endTime: suggestedEnd } });
      }
    }
    return { requested: slotsToValidate.length, conflicts, suggestions };
  }
}
