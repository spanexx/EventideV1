import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument } from './availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateAllDayAvailabilityDto } from './dto/create-all-day-availability.dto';
import { CreateBulkAvailabilityDto } from './dto/create-bulk-availability.dto';
import { UpdateDaySlotQuantityDto } from './dto/update-day-slot-quantity.dto';
import { IAvailabilityBase } from './interfaces/availability.interface';

// Import existing services
import { AvailabilityBaseService } from './services/availability-base.service';
import { AvailabilityCreationService } from './services/availability-creation.service';
import { AvailabilityMigrationService } from './services/availability-migration.service';

// Import new modular components
import { AvailabilityInstanceProvider } from './services/providers/instance.provider';
import { AvailabilityUpdateHandler } from './services/handlers/update.handler';
import { BulkCreationHandler } from './services/handlers/bulk-creation.handler';

@Injectable()
export class AvailabilityService implements OnModuleInit {
  private readonly logger = new Logger(AvailabilityService.name);

  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
    private readonly baseService: AvailabilityBaseService,
    private readonly creationService: AvailabilityCreationService,
    private readonly migrationService: AvailabilityMigrationService,
    private readonly instanceProvider: AvailabilityInstanceProvider,
    private readonly updateHandler: AvailabilityUpdateHandler,
    private readonly bulkCreationHandler: BulkCreationHandler,
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
  ): Promise<IAvailabilityBase | null> {
    return this.baseService.findByIdAndLock(id, session);
  }

  async findAllInstances(providerId: string, startDate: Date, endDate: Date): Promise<IAvailabilityBase[]> {
    return this.instanceProvider.findAllInstances(providerId, startDate, endDate);
  }

  async findExistingInstance(
    providerId: string,
    date: Date,
    startTime: Date,
    session?: any
  ): Promise<IAvailabilityBase | null> {
    return this.instanceProvider.findExistingInstance(providerId, date, startTime, session);
  }

  /**
   * Create a specific instance from a recurring availability template
   */
  async createInstanceFromRecurring(
    template: IAvailabilityBase,
    date: Date,
    startTime: Date,
    endTime: Date,
    session: any,
  ): Promise<IAvailabilityBase> {
    return this.instanceProvider.createInstanceFromRecurring(template, date, startTime, endTime, session);
  }

  /**
   * Mark an availability slot as booked
   */
  async markAsBooked(
    id: string,
    bookingId: string,
    session: any,
  ): Promise<IAvailabilityBase> {
    return this.baseService.markAsBooked(id, bookingId, session);
  }

  /**
   * Mark an availability slot as available (unbooked)
   */
  async markAsAvailable(
    id: string,
    session: any,
  ): Promise<IAvailabilityBase> {
    return this.baseService.markAsAvailable(id, session);
  }

  /**
   * Create a new availability slot
   */
  async create(
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<IAvailabilityBase> {
    return this.creationService.create(createAvailabilityDto);
  }

  /**
   * Find availability slots for a provider within a date range
   */
  async findByProviderAndDateRange(
    providerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<IAvailabilityBase[]> {
    return this.baseService.findByProviderAndDateRange(providerId, startDate, endDate);
  }

  /**
   * Find an availability slot by ID
   */
  async findById(id: string): Promise<IAvailabilityBase> {
    return this.baseService.findById(id);
  }

  /**
   * Update an availability slot
   */
  async update(
    id: string,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<IAvailabilityBase> {
    return this.updateHandler.update(id, updateAvailabilityDto);
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
  ): Promise<IAvailabilityBase[]> {
    return this.creationService.createAllDaySlots(createAllDayAvailabilityDto);
  }

  /**
   * Adjust the number of slots for a specific day
   */
  async adjustDaySlotQuantity(updateDto: UpdateDaySlotQuantityDto): Promise<IAvailabilityBase[]> {
    return this.baseService.adjustDaySlotQuantity(updateDto);
  }

  /**
   * Create multiple availability slots in bulk
   */
  async createBulkSlots(
    createBulkAvailabilityDto: CreateBulkAvailabilityDto,
  ): Promise<{ created: IAvailabilityBase[]; conflicts: any[] }> {
    return this.bulkCreationHandler.createBulkSlots(createBulkAvailabilityDto);
  }

  /**
   * Validate a batch of availability slots
   */
  async validateSlots(createBulkAvailabilityDto: CreateBulkAvailabilityDto): Promise<{
    requested: number;
    conflicts: any[];
    suggestions: any[];
  }> {
    return this.bulkCreationHandler.validateSlots(createBulkAvailabilityDto);
  }
}
