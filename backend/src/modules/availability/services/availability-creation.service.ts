import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType, AvailabilityStatus } from '../availability.schema';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { CreateAllDayAvailabilityDto } from '../dto/create-all-day-availability.dto';
import { CreateBulkAvailabilityDto } from '../dto/create-bulk-availability.dto';
import { IAvailabilityBase, IAvailabilityDocument } from '../interfaces/availability.interface';
import { AvailabilityValidationService } from './availability-validation.service';
import { AvailabilityCacheService } from './availability-cache.service';
import { AvailabilityEventsService } from './availability-events.service';
import { AvailabilitySlotGeneratorService } from './availability-slot-generator.service';

/**
 * Type guard to check if a value is an AvailabilityDocument
 * @param value - Value to check
 * @returns True if value is an AvailabilityDocument
 */
export function isAvailabilityDocument(value: any): value is AvailabilityDocument {
  return value?._id instanceof Types.ObjectId && 
         typeof value?.providerId === 'string' &&
         value?.type in AvailabilityType;
}

/**
 * Type guard to check if a value is an IAvailabilityBase
 * @param value - Value to check
 * @returns True if value is an IAvailabilityBase
 */
export function isAvailabilityBase(value: any): value is IAvailabilityBase {
  return typeof value?.id === 'string' &&
         typeof value?.providerId === 'string' &&
         value?.type in AvailabilityType &&
         value?.startTime instanceof Date &&
         value?.endTime instanceof Date;
}

/**
 * Type to represent availability data with optional fields
 */
export type PartialAvailabilityData = Partial<IAvailabilityBase> & {
  providerId: string;
  type: AvailabilityType;
};

/**
 * Convert a Mongoose document to a plain object with proper typing
 * @param doc - Mongoose availability document  
 * @returns Plain object representation with required fields
 */
export function toAvailabilityBase(doc: AvailabilityDocument): IAvailabilityBase {
  return {
    id: doc._id.toString(),
    providerId: doc.providerId,
    type: doc.type,
    dayOfWeek: doc.dayOfWeek,
    date: doc.date,
    startTime: doc.startTime,
    endTime: doc.endTime,
    duration: doc.duration,
    isBooked: doc.isBooked,
    maxBookings: doc.maxBookings,
    status: doc.status as AvailabilityStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    templateId: doc.templateId,
    weekOf: doc.weekOf,
    bookingId: doc.bookingId,
    cancellationReason: doc.cancellationReason
  };
}

@Injectable()
export class AvailabilityCreationService {
  private readonly logger = new Logger(AvailabilityCreationService.name);

  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly validationService: AvailabilityValidationService,
    private readonly cacheService: AvailabilityCacheService,
    private readonly eventsService: AvailabilityEventsService,
    private readonly slotGeneratorService: AvailabilitySlotGeneratorService,
  ) {}

  /**
   * Create a single availability slot
   * @param createAvailabilityDto - DTO containing availability slot data
   * @returns Created availability slot
   * @throws NotFoundException if validation fails
   */
  async create(createAvailabilityDto: CreateAvailabilityDto): Promise<IAvailabilityBase> {
    try {
      // Check idempotency
      if (createAvailabilityDto.idempotencyKey) {
        const cached = await this.cacheService.getIdempotencyCache<IAvailabilityBase>(
          `create:${createAvailabilityDto.idempotencyKey}`
        );
        if (cached) {
          this.logger.log('Returning cached idempotent create result');
          return cached;
        }
      }

      // For recurring slots, generate multiple weeks
      if (createAvailabilityDto.type === AvailabilityType.RECURRING) {
        return this.createRecurringSlots(createAvailabilityDto);
      }

      // Validate conflicts
      await this.validationService.checkForConflicts(createAvailabilityDto);

      // Create availability
      const result = await this.availabilityModel.create(createAvailabilityDto);

      // Clear cache
      await this.cacheService.clearProviderCache(createAvailabilityDto.providerId);

      // Emit events
      this.eventsService.emitCreated(createAvailabilityDto.providerId, result);

      // Cache result if idempotent
      if (createAvailabilityDto.idempotencyKey) {
        await this.cacheService.setIdempotencyCache(
          `create:${createAvailabilityDto.idempotencyKey}`,
          toAvailabilityBase(result)
        );
      }

      return toAvailabilityBase(result);
    } catch (error) {
      this.logger.error(
        `Failed to create availability slot: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create all-day availability slots
   */
  async createAllDaySlots(
    createAllDayAvailabilityDto: CreateAllDayAvailabilityDto
  ): Promise<IAvailabilityBase[]> {
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

    try {
      let slotsToCreate: CreateAvailabilityDto[];

      if (autoDistribute) {
        slotsToCreate = this.slotGeneratorService.generateEvenlyDistributedSlots(
          providerId,
          date,
          numberOfSlots || 1,
          createAllDayAvailabilityDto.minutesPerSlot,
          createAllDayAvailabilityDto.breakTime,
          isRecurring,
          dayOfWeek,
          workingStartTime,
          workingEndTime
        );
      } else {
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

      const results = await this.createBatchSlots(slotsToCreate);
      return results.created;
    } catch (error) {
      this.logger.error(
        `Failed to create all-day availability slots: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create availability slots in bulk
   */
  async createBatchSlots(
    slots: CreateAvailabilityDto[],
    options: {
      skipConflicts?: boolean;
      replaceConflicts?: boolean;
      dryRun?: boolean;
      idempotencyKey?: string;
    } = {}
  ): Promise<{
    created: IAvailabilityBase[];
    conflicts: any[];
  }> {
    try {
      // Check idempotency
      if (options.idempotencyKey) {
        const cached = await this.cacheService.getIdempotencyCache<{
          created: IAvailabilityBase[];
          conflicts: any[];
        }>(`bulk:${options.idempotencyKey}`);
        if (cached) {
          this.logger.log('Returning cached idempotent bulk result');
          return cached;
        }
      }

      const createdSlots: IAvailabilityBase[] = [];
      const conflicts: any[] = [];

      // Validate and create slots
      for (const slot of slots) {
        try {
          const conflictingSlots = await this.validationService.findConflicts(slot);
          
          if (conflictingSlots.length > 0) {
            if (options.dryRun || options.skipConflicts) {
              conflicts.push({ requested: slot, conflictingWith: conflictingSlots });
              if (options.dryRun) continue;
            } else if (options.replaceConflicts) {
              await this.availabilityModel.deleteMany({ 
                _id: { $in: conflictingSlots.map(c => c._id) } 
              });
            }
          }

          const result = await this.availabilityModel.create(slot);
          createdSlots.push(toAvailabilityBase(result));
        } catch (error) {
          this.logger.error(
            `Failed to create slot in batch: ${error.message}`,
            error.stack,
          );
          if (!options.skipConflicts) throw error;
        }
      }

      // Clear cache and emit events
      if (createdSlots.length > 0) {
        const providerId = createdSlots[0].providerId;
        await this.cacheService.clearProviderCache(providerId);
        this.eventsService.emitBulkCreated(providerId, createdSlots);
      }

      const result = { created: createdSlots, conflicts };

      // Cache result if idempotent
      if (options.idempotencyKey) {
        await this.cacheService.setIdempotencyCache(
          `bulk:${options.idempotencyKey}`,
          result
        );
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create batch slots: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create recurring slots for multiple weeks (phone alarm approach)
   */
  private async createRecurringSlots(createAvailabilityDto: CreateAvailabilityDto): Promise<IAvailabilityBase> {
    const weeksToGenerate = 8; // Generate 8 weeks ahead
    const startDate = new Date();
    const slots: any[] = [];

    for (let week = 0; week < weeksToGenerate; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (week * 7));
      
      // Find the target day in this week
      const targetDay = new Date(weekStart);
      const daysToAdd = (createAvailabilityDto.dayOfWeek! - weekStart.getDay() + 7) % 7;
      targetDay.setDate(weekStart.getDate() + daysToAdd);
      
      // Create slot for this week
      const slotData = {
        ...createAvailabilityDto,
        date: targetDay,
        weekOf: weekStart,
        startTime: this.adjustTimeToDate(createAvailabilityDto.startTime, targetDay),
        endTime: this.adjustTimeToDate(createAvailabilityDto.endTime, targetDay)
      };
      
      slots.push(slotData);
    }

    // Create all slots
    const results = await this.availabilityModel.insertMany(slots);
    
    // Clear cache
    await this.cacheService.clearProviderCache(createAvailabilityDto.providerId);
    
    // Return first slot as representative
    const firstResult = results[0] as AvailabilityDocument;
    return toAvailabilityBase(firstResult);
  }

  /**
   * Adjust time to specific date
   */
  private adjustTimeToDate(time: Date, targetDate: Date): Date {
    const result = new Date(targetDate);
    result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
    return result;
  }

  /**
   * Generate additional recurring slots when converting from one-off to recurring
   */
  async generateRecurringSlots(baseSlot: any, dayOfWeek: number): Promise<void> {
    const weeksToGenerate = 7; // Generate 7 more weeks (8 total including existing)
    const startDate = new Date();
    const slots: any[] = [];

    for (let week = 1; week <= weeksToGenerate; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + (week * 7));

      // Find the target day in this week
      const targetDay = new Date(weekStart);
      const daysToAdd = (dayOfWeek - weekStart.getDay() + 7) % 7;
      targetDay.setDate(weekStart.getDate() + daysToAdd);

      // Create slot for this week
      const slotData = {
        providerId: baseSlot.providerId,
        type: 'recurring',
        dayOfWeek,
        date: targetDay,
        weekOf: weekStart,
        startTime: this.adjustTimeToDate(new Date(baseSlot.startTime), targetDay),
        endTime: this.adjustTimeToDate(new Date(baseSlot.endTime), targetDay),
        duration: baseSlot.duration,
        maxBookings: baseSlot.maxBookings,
        isBooked: false,
        status: 'active'
      };

      slots.push(slotData);
    }

    // Create all additional slots
    if (slots.length > 0) {
      await this.availabilityModel.insertMany(slots);
      
      // Clear cache
      await this.cacheService.clearProviderCache(baseSlot.providerId);
    }
  }
}
