import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { IBooking } from '../interfaces/booking.interface';
import { IAvailability } from '../../availability/interfaces/availability.interface';
import { AvailabilityService } from '../../availability/availability.service';
import { BookingCacheService } from './booking-cache.service';

// Modular components
import { RecurringBookingStrategy } from './strategies/recurring-booking.strategy';
import { BookingNotificationHandler } from './handlers/booking-notification.handler';
import { BookingInstanceUtils } from './utils/booking-instance.utils';
import { BookingBaseService } from './booking-base.service';
import { BookingSerialKeyService } from './booking-serial-key.service';
import { UsersService } from '../../users/users.service';
import { BookingQueueService } from '../../../core/queue/booking-queue.service';
import { BookingValidationService } from './booking-validation.service';

@Injectable()
export class BookingCreationService {
  private readonly logger = new Logger(BookingCreationService.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly cacheService: BookingCacheService,
    private readonly recurringStrategy: RecurringBookingStrategy,
    private readonly notificationHandler: BookingNotificationHandler,
    private readonly instanceUtils: BookingInstanceUtils,
    private readonly baseService: BookingBaseService,
    private readonly serialKeyService: BookingSerialKeyService,
    private readonly usersService: UsersService,
    private readonly validationService: BookingValidationService,
    private readonly bookingQueueService: BookingQueueService,
  ) {}

  /**
   * Main entry point for creating bookings
   */
  async createBooking(createBookingDto: CreateBookingDto, session: any): Promise<IBooking | IBooking[]> {
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 [BookingCreationService] createBooking() START');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 [BookingCreationService] Input booking data:', {
      providerId: createBookingDto.providerId,
      availabilityId: createBookingDto.availabilityId,
      guestName: createBookingDto.guestName,
      guestEmail: createBookingDto.guestEmail,
      startTime: createBookingDto.startTime,
      endTime: createBookingDto.endTime,
      notes: createBookingDto.notes
    });

    return this._createBookingLogic(createBookingDto, session);
  }

  private async _createBookingLogic(createBookingDto: CreateBookingDto, session: any): Promise<IBooking | IBooking[]> {
    console.log('🔄 [BookingCreationService] Starting booking creation logic');

    // Idempotency
    if ((createBookingDto as any).idempotencyKey) {
      console.log(`[BookingCreationService] Checking idempotency key: ${(createBookingDto as any).idempotencyKey}`);
      const cached = await this.cacheService.getCachedBooking((createBookingDto as any).idempotencyKey);
      if (cached) {
        console.log('[BookingCreationService] ✅ Idempotent result found - returning cached booking');
        return cached;
      }
    }

    // Validate base DTO
    console.log('[BookingCreationService] Validating create booking DTO');
    this.validationService.validateCreateBookingDto(createBookingDto);

    // Load availability (and lock)
    const template = await this.availabilityService.findByIdAndLock(
      (createBookingDto as any).availabilityId,
      session || null
    );
    if (!template) throw new NotFoundException('Availability slot not found');

    this.logger.log(`[BookingCreation] Availability type: ${template.type}, ID: ${template._id}, isBooked: ${template.isBooked}`);
    if ((template as any).isBooked) throw new ConflictException('This slot is already booked');

    // Recurring
    if ((createBookingDto as any).recurring) {
      this.logger.log('[BookingCreation] Creating recurring bookings (multiple dates)');
      return this._createRecurringBookings(template, createBookingDto, session);
    }

    // For single bookings on recurring slots, create a specific instance for the requested date
    let availability = template;

    // Check if this is an instantiated recurring slot (ID format: templateId_YYYY-MM-DD)
    const isInstantiatedSlot = String((createBookingDto as any).availabilityId).includes('_') &&
      String((createBookingDto as any).availabilityId).match(/_\d{4}-\d{2}-\d{2}$/);

    if ((template as any).type === 'recurring') {
      this.logger.log(`[BookingCreation] Single booking on ${isInstantiatedSlot ? 'instantiated' : 'template'} recurring slot`);
      availability = await this.instanceUtils.handleRecurringSlot(template, createBookingDto, session);
    }

    // Validate time slot matches
    this.validateTimeSlot(createBookingDto, availability);

    // Create single booking
    return this.createSingleBooking(createBookingDto, availability, session);
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
    // Schedule auto-completion for each created booking after it ends
    try {
      await this.bookingQueueService.scheduleAutoCompleteMany(createdBookings);
      this.logger.log(`[BookingCreation] Scheduled auto-completion for ${createdBookings.length} bookings`);
    } catch (err) {
      this.logger.error(`[BookingCreation] Failed to schedule auto-completion for recurring bookings: ${(err as any)?.message}`);
    }
    await this.notificationHandler.handleRecurringBookingSummary(template, createdBookings, session);
    return createdBookings;
  }

  /**
   * Ensure requested times match availability slot exactly.
   */
  private validateTimeSlot(createBookingDto: CreateBookingDto, availability: IAvailability): void {
    const requestedStart = new Date(createBookingDto.startTime).getTime();
    const requestedEnd = new Date(createBookingDto.endTime).getTime();
    const slotStart = new Date(availability.startTime).getTime();
    const slotEnd = new Date(availability.endTime).getTime();

    if (requestedStart !== slotStart || requestedEnd !== slotEnd) {
      this.logger.warn(`[BookingCreation] Time mismatch: requested ${requestedStart}-${requestedEnd} vs slot ${slotStart}-${slotEnd}`);
      throw new BadRequestException('Booking times do not match availability slot');
    }
  }

  /**
   * Create a single booking with conflict checks, serial key, notifications and cache.
   */
  private async createSingleBooking(
    createBookingDto: CreateBookingDto,
    availability: IAvailability,
    session: any
  ): Promise<IBooking> {
    // Conflict check
    const existing = await this.baseService.findByFilter({
      providerId: availability.providerId,
      startTime: createBookingDto.startTime,
      endTime: createBookingDto.endTime,
      status: { $in: ['confirmed', 'in_progress'] },
    });
    if (existing.length > 0) {
      this.logger.warn(`[BookingCreation] Conflict found for provider ${availability.providerId} at ${createBookingDto.startTime}`);
      throw new ConflictException(`This time slot is already booked.`);
    }

    // Provider auto-confirm preference
    const provider = await this.usersService.findById(availability.providerId);
    const autoConfirm = provider?.preferences?.booking?.autoConfirmBookings ?? true;
    this.logger.log(`[BookingCreation] Provider ${availability.providerId} auto-confirm: ${autoConfirm}`);

    // Check payment requirements
    const requirePayment = provider?.preferences?.payment?.requirePaymentForBookings ?? false;
    const hourlyRate = provider?.preferences?.payment?.hourlyRate ?? 5000;
    const currency = provider?.preferences?.payment?.currency ?? 'usd';
    const duration = (new Date(createBookingDto.endTime).getTime() - new Date(createBookingDto.startTime).getTime()) / 60000;
    
    // Calculate amount based on provider's hourly rate
    let totalAmount = 0;
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' = 'pending';
    
    if (requirePayment) {
      // Calculate based on hourly rate and duration
      const hours = duration / 60;
      totalAmount = Math.round(hourlyRate * hours);
      paymentStatus = 'pending';
      this.logger.log(`[BookingCreation] Payment required: ${totalAmount} ${currency} (${hours}h @ ${hourlyRate}/h)`);
    } else {
      // Free booking
      totalAmount = 0;
      paymentStatus = 'paid'; // Mark as paid since no payment needed
      this.logger.log(`[BookingCreation] Free booking - no payment required`);
    }

    const serialKey = this.serialKeyService.generateBookingSerialKey(createBookingDto.startTime as any);
    const guestId = (createBookingDto as any).guestId || `guest_${this.serialKeyService.generateBookingSerialKey(new Date() as any)}`;

    const bookingData = {
      ...createBookingDto,
      guestId,
      serialKey,
      status: autoConfirm ? 'confirmed' : 'pending',
      duration,
      totalAmount: (createBookingDto as any).totalAmount || totalAmount,
      currency: (createBookingDto as any).currency || currency,
      paymentStatus,
    } as any;
    const newBooking = await this.baseService.create(bookingData, session);

    const availabilityId = (availability as any)._id?.toString() || (availability as any).id || '';
    await this.notificationHandler.handleBookingNotifications(newBooking, provider, availabilityId, session);

    await this.handleBookingCache(createBookingDto, newBooking);

    // Schedule auto-completion after booking ends
    try {
      const bookingId = (newBooking as any)._id || (newBooking as any).id;
      await this.bookingQueueService.scheduleAutoComplete(bookingId, new Date(newBooking.endTime));
      this.logger.log(`[BookingCreation] Scheduled auto-completion for booking ${bookingId}`);
    } catch (err) {
      this.logger.error(`[BookingCreation] Failed to schedule auto-completion: ${(err as any)?.message}`);
    }

    return newBooking;
  }

  private async handleBookingCache(createBookingDto: CreateBookingDto, newBooking: IBooking): Promise<void> {
    const idem = (createBookingDto as any).idempotencyKey;
    if (idem) {
      this.logger.log('[BookingCreation] Caching idempotent result');
      await this.cacheService.cacheBooking(idem, newBooking);
    }
  }
}