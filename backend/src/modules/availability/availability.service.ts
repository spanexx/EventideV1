import { ConflictException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument } from './availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateAllDayAvailabilityDto } from './dto/create-all-day-availability.dto';
import { CreateBulkAvailabilityDto } from './dto/create-bulk-availability.dto';
import { UpdateDaySlotQuantityDto } from './dto/update-day-slot-quantity.dto';
import { IAvailability } from './interfaces/availability.interface';
import { AvailabilityBaseService } from './services/availability-base.service';
import { AvailabilityCacheService } from './services/availability-cache.service';
import { AvailabilityEventsService } from './services/availability-events.service';
import { AvailabilityValidationService } from './services/availability-validation.service';
import { AvailabilitySlotGeneratorService } from './services/availability-slot-generator.service';
import { AvailabilityCreationService } from './services/availability-creation.service';
import { AvailabilityNotificationService } from './services/availability-notification.service';
import { UsersService } from '../../modules/users/users.service';
import { AvailabilityMigrationService } from './services/availability-migration.service';

@Injectable()
export class AvailabilityService implements OnModuleInit {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
    private readonly baseService: AvailabilityBaseService,
    private readonly cacheService: AvailabilityCacheService,
    private readonly eventsService: AvailabilityEventsService,
    private readonly validationService: AvailabilityValidationService,
    private readonly slotGeneratorService: AvailabilitySlotGeneratorService,
    private readonly creationService: AvailabilityCreationService,
    private readonly notificationService: AvailabilityNotificationService,
    private readonly migrationService: AvailabilityMigrationService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    try {
      await this.migrationService.migrateExistingRecords();
    } catch (error) {
      this.logger.error('Failed to run availability migration:', error);
    }
  }

  /**
   * Find and lock an availability slot by ID for booking
   */
  async findByIdAndLock(
    id: string,
    session: any,
  ): Promise<IAvailability | null> {
    return this.baseService.findByIdAndLock(id, session);
  }

  async findAllInstances(providerId: string, startDate: Date, endDate: Date): Promise<IAvailability[]> {
    return this.availabilityModel.find({
      providerId,
      type: 'one_off',
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).exec();
  }

  async findExistingInstance(
    providerId: string,
    date: Date,
    startTime: Date,
    session?: any
  ): Promise<IAvailability | null> {
    const query = this.availabilityModel.findOne({
      providerId,
      type: 'one_off',
      date,
      startTime
    });
    
    if (session) {
      query.session(session);
    }
    
    return query.exec();
  }

  /**
   * Create a specific instance from a recurring availability template
   */
  async createInstanceFromRecurring(
    template: IAvailability,
    date: Date,
    startTime: Date,
    endTime: Date,
    session: any,
  ): Promise<IAvailability> {
    // Reset any existing instances for this date (development only)
    await this.availabilityModel.deleteMany({
      providerId: template.providerId,
      type: 'one_off',
      date: new Date(date.getTime())
    }).session(session);
    
    // Debug log
    console.log('Creating instance with:', {
      requestedDate: date.toISOString(),
      requestedStart: startTime.toISOString(),
      requestedEnd: endTime.toISOString(),
      templateStart: template.startTime,
      templateEnd: template.endTime
    });
    
    // Start fresh with dates to ensure proper UTC handling
    const requestedDate = new Date(date.getTime());
    requestedDate.setUTCHours(0, 0, 0, 0);
    
    // Create the start and end times
    const instanceStartTime = new Date(requestedDate.getTime());
    instanceStartTime.setUTCHours(
      startTime.getUTCHours(),
      startTime.getUTCMinutes(),
      0,
      0
    );
    
    const instanceEndTime = new Date(requestedDate.getTime());
    instanceEndTime.setUTCHours(
      endTime.getUTCHours(),
      endTime.getUTCMinutes(),
      0,
      0
    );

    console.log('After date processing:', {
      requestedDate: requestedDate.toISOString(),
      instanceStart: instanceStartTime.toISOString(),
      instanceEnd: instanceEndTime.toISOString()
    });

    // First check if an instance already exists for this date and time
    const existingInstance = await this.availabilityModel.findOne({
      providerId: template.providerId,
      type: 'one_off',
      date: requestedDate,
      startTime: instanceStartTime
    }).session(session);

    console.log('Existing instance check:', existingInstance);

    if (existingInstance) {
      // If instance exists and isn't booked, return it
      if (!existingInstance.isBooked) {
        return existingInstance;
      }
      throw new ConflictException('This time slot is already booked');
    }

        // Create new availability instance for the specific date
    const instanceData = {
      providerId: template.providerId,
      type: 'one_off' as const,
      startTime,
      endTime,
      date,
      duration: template.duration,
      maxBookings: template.maxBookings,
      status: template.status,
      isBooked: false
    };

    // Create the instance first
    const instance = await this.availabilityModel.create([instanceData], { session });
    
    // Important: Do not mark the template as booked
    if (template.type === 'recurring') {
      // Remove any incorrect booking status from template
      await this.availabilityModel
        .updateOne(
          { _id: template._id },
          { $set: { isBooked: false }, $unset: { bookingId: "" } },
          { session }
        );
    }

    return instance[0];
  }

  /**
   * Mark an availability slot as booked
   */
  async markAsBooked(
    id: string,
    bookingId: string,
    session: any,
  ): Promise<IAvailability> {
    return this.baseService.markAsBooked(id, bookingId, session);
  }

  /**
   * Mark an availability slot as available (unbooked)
   */
  async markAsAvailable(
    id: string,
    session: any,
  ): Promise<IAvailability> {
    return this.baseService.markAsAvailable(id, session);
  }

  /**
   * Create a new availability slot
   */
  async create(
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<IAvailability> {
    return this.creationService.create(createAvailabilityDto);
  }

  /**
   * Find availability slots for a provider within a date range
   */
  async findByProviderAndDateRange(
    providerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IAvailability[]> {
    return this.baseService.findByProviderAndDateRange(providerId, startDate, endDate);
  }

  /**
   * Find an availability slot by ID
   */
  async findById(id: string): Promise<IAvailability> {
    return this.baseService.findById(id);
  }

  /**
   * Update an availability slot
   */
  async update(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<IAvailability> {
    const original = await this.baseService.findById(id);
    if (!original) {
      throw new NotFoundException(`Availability slot with ID ${id} not found`);
    }

    const updated = await this.baseService.update(id, updateAvailabilityDto);
    
    // Send appropriate notification based on the update type
    const provider = await this.usersService.findById(original.providerId);
    if (provider && provider.email) {
      if (updated.status === 'cancelled' && updated.status !== original.status) {
        await this.notificationService.notifyCancellation(updated, provider.email);
      } else if (updated.status === 'override' && updated.status !== original.status) {
        await this.notificationService.notifyOverride(original, updated, provider.email);
      } else {
        await this.notificationService.notifyUpdate(original, updated, provider.email);
      }
    }

    return updated;
  }

  /**
   * Delete an availability slot
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return this.baseService.delete(id);
  }

  /**
   * Remove past one-off availability slots
   */
  async cleanupPastOneOffSlots(): Promise<number> {
    return this.baseService.cleanupPastOneOffSlots();
  }

  /**
   * Create multiple availability slots for an all-day period
   */
  async createAllDaySlots(
    createAllDayAvailabilityDto: CreateAllDayAvailabilityDto,
  ): Promise<IAvailability[]> {
    return this.creationService.createAllDaySlots(createAllDayAvailabilityDto);
  }

  /**
   * Adjust the number of slots for a specific day
   */
  async adjustDaySlotQuantity(updateDto: UpdateDaySlotQuantityDto): Promise<IAvailability[]> {
    return this.baseService.adjustDaySlotQuantity(updateDto);
  }

  /**
   * Create multiple availability slots in bulk
   */
  async createBulkSlots(
    createBulkAvailabilityDto: CreateBulkAvailabilityDto,
  ): Promise<{ created: IAvailability[]; conflicts: any[] }> {
    // Convert BulkSlotConfig[] to CreateAvailabilityDto[]
    const slots = createBulkAvailabilityDto.slots?.map(slot => ({
      ...slot,
      providerId: createBulkAvailabilityDto.providerId
    }));

    const result = await this.creationService.createBatchSlots(slots || [], {
      skipConflicts: createBulkAvailabilityDto.skipConflicts,
      replaceConflicts: createBulkAvailabilityDto.replaceConflicts,
      dryRun: createBulkAvailabilityDto.dryRun,
      idempotencyKey: createBulkAvailabilityDto.idempotencyKey,
    });

    // Send notification for bulk creation if slots were created
    if (!createBulkAvailabilityDto.dryRun && result.created.length > 0) {
      const provider = await this.usersService.findById(createBulkAvailabilityDto.providerId);
      if (provider && provider.email) {
        const dates = result.created.map(slot => slot.startTime);
        await this.notificationService.notifyBulkUpdate(
          createBulkAvailabilityDto.providerId,
          dates,
          provider.email
        );
      }
    }

    return result;
  }

  /**
   * Validate a batch of availability slots
   */
  async validateSlots(createBulkAvailabilityDto: CreateBulkAvailabilityDto): Promise<{
    requested: number;
    conflicts: any[];
    suggestions: any[];
  }> {
    // Generate slots from bulk DTO and ensure each slot has a providerId
    let slots = createBulkAvailabilityDto.slots?.map(slot => ({
      ...slot,
      providerId: createBulkAvailabilityDto.providerId
    })) || this.slotGeneratorService.generateSlotsFromBulkDto(createBulkAvailabilityDto);

    const conflicts: any[] = [];
    const suggestions: any[] = [];

    for (const slot of slots) {
      const validationSlot = {
        ...slot,
        providerId: createBulkAvailabilityDto.providerId
      };

      const slotConflicts = await this.validationService.findConflicts(validationSlot);
      if (slotConflicts.length > 0) {
        conflicts.push({
          requested: validationSlot,
          conflictingWith: slotConflicts,
        });

        // Generate suggestions for conflicting slots
        const suggestedSlot = await this.slotGeneratorService.generateAlternativeSlot(
          validationSlot,
          slotConflicts
        );
        if (suggestedSlot) {
          suggestions.push({
            original: validationSlot,
            suggested: suggestedSlot,
          });
        }
      }
    }

    return {
      requested: slots.length,
      conflicts,
      suggestions,
    };
  }
}
