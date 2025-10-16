import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { IBooking } from '../interfaces/booking.interface';
import { IAvailability } from '../../availability/interfaces/availability.interface';
import { AvailabilityService } from '../../availability/availability.service';
import { BookingCacheService } from './booking-cache.service';

// Import modular components
import { BookingValidationProvider } from './providers/booking-validation.provider';
import { RecurringBookingStrategy } from './strategies/recurring-booking.strategy';
import { BookingNotificationHandler } from './handlers/booking-notification.handler';
import { BookingInstanceUtils } from './utils/booking-instance.utils';
import { SingleBookingHandler } from './handlers/single-booking.handler';

@Injectable()
export class BookingCreationService {
  private readonly logger = new Logger(BookingCreationService.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly cacheService: BookingCacheService,
    private readonly validationProvider: BookingValidationProvider,
    private readonly recurringStrategy: RecurringBookingStrategy,
    private readonly notificationHandler: BookingNotificationHandler,
    private readonly instanceUtils: BookingInstanceUtils,
    private readonly singleBookingHandler: SingleBookingHandler,
  ) {}

  /**
   * Main entry point for creating bookings
   */
  async createBooking(createBookingDto: CreateBookingDto, session: any): Promise<IBooking | IBooking[]> {
    return this._createBookingLogic(createBookingDto, session);
  }

  /**
   * Core booking creation logic
   */
  private async _createBookingLogic(createBookingDto: CreateBookingDto, session: any): Promise<IBooking | IBooking[]> {
    // Check cache for idempotency
    if (createBookingDto.idempotencyKey) {
      const cached = await this.cacheService.getCachedBooking(createBookingDto.idempotencyKey);
      if (cached) {
        this.logger.log('Returning cached idempotent booking result');
        return cached;
      }
    }

    // Verify and get the availability slot
    const template = await this.availabilityService.findByIdAndLock(
      createBookingDto.availabilityId,
      session || null
    );

    if (!template) {
      throw new NotFoundException('Availability slot not found');
    }

    this.logger.log(`[BookingCreation] Availability type: ${template.type}, ID: ${template._id}, isBooked: ${template.isBooked}`);

    if (template.isBooked) {
      throw new ConflictException('This slot is already booked');
    }

    // Create booking(s)
    if (createBookingDto.recurring) {
      this.logger.log('[BookingCreation] Creating recurring bookings (multiple dates)');
      return this._createRecurringBookings(template, createBookingDto, session);
    }

    // For single bookings on recurring slots, create a specific instance for the requested date
    let availability = template;
    
    // Check if this is an instantiated recurring slot (ID format: templateId_YYYY-MM-DD)
    const isInstantiatedSlot = createBookingDto.availabilityId.includes('_') && 
                                createBookingDto.availabilityId.match(/_\d{4}-\d{2}-\d{2}$/);
    
    if (template.type === 'recurring' && !isInstantiatedSlot) {
      this.logger.log('[BookingCreation] Single booking on recurring template - validating day match');
      availability = await this.instanceUtils.handleRecurringSlot(template, createBookingDto, session);
    } else if (template.type === 'recurring' && isInstantiatedSlot) {
      this.logger.log('[BookingCreation] Single booking on instantiated recurring slot - skipping day validation');
      availability = await this.instanceUtils.handleRecurringSlot(template, createBookingDto, session);
    } else {
      this.logger.log(`[BookingCreation] Single booking on ${template.type} slot - no day validation needed`);
    }

    // Validate time slot matches
    this.validationProvider.validateTimeSlot(createBookingDto, availability);

    return this.singleBookingHandler.createSingleBooking(createBookingDto, availability, session);
  }

  /**
   * Create recurring bookings
   */
  private async _createRecurringBookings(
    template: IAvailability,
    baseBooking: CreateBookingDto,
    session: any
  ): Promise<IBooking[]> {
    const createdBookings = await this.recurringStrategy.createRecurringBookings(template, baseBooking, session);
    await this.notificationHandler.handleRecurringBookingSummary(template, createdBookings, session);
    return createdBookings;
  }
}
