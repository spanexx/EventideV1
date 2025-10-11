import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { IBooking } from '../interfaces/booking.interface';
import { IAvailability, IAvailabilityDocument } from '../../availability/interfaces/availability.interface';
import { AvailabilityService } from '../../availability/availability.service';
import { BookingSerialKeyService } from './booking-serial-key.service';
import { BookingBaseService } from './booking-base.service';
import { BookingCacheService } from './booking-cache.service';
import { BookingEventsService } from './booking-events.service';
import { NotificationService } from '../../../core/notifications/notification.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class BookingCreationService {
  private readonly logger = new Logger(BookingCreationService.name);

  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly usersService: UsersService,
    private readonly baseService: BookingBaseService,
    private readonly cacheService: BookingCacheService,
    private readonly eventsService: BookingEventsService,
    private readonly serialKeyService: BookingSerialKeyService,
    private readonly notificationService: NotificationService,
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
      // For recurring bookings, use the template directly without day validation
      // since we'll generate instances for multiple dates
      this.logger.log('[BookingCreation] Creating recurring bookings (multiple dates)');
      return this._createRecurringBookings(template, createBookingDto, session);
    }

    // For single bookings on recurring slots, create a specific instance for the requested date
    let availability = template;
    
    // Check if this is an instantiated recurring slot (ID format: templateId_YYYY-MM-DD)
    const isInstantiatedSlot = createBookingDto.availabilityId.includes('_') && 
                                createBookingDto.availabilityId.match(/_\d{4}-\d{2}-\d{2}$/);
    
    if (template.type === 'recurring' && !isInstantiatedSlot) {
      // Only validate day match if booking directly on a template (not an instance)
      this.logger.log('[BookingCreation] Single booking on recurring template - validating day match');
      availability = await this._handleRecurringSlot(template, createBookingDto, session);
    } else if (template.type === 'recurring' && isInstantiatedSlot) {
      // This is an instantiated slot - skip day validation, just create the instance
      this.logger.log('[BookingCreation] Single booking on instantiated recurring slot - skipping day validation');
      availability = await this._handleRecurringSlot(template, createBookingDto, session);
    } else {
      this.logger.log(`[BookingCreation] Single booking on ${template.type} slot - no day validation needed`);
    }

    // Validate time slot matches
    this._validateTimeSlot(createBookingDto, availability);

    return this._createSingleBooking(createBookingDto, availability, session);
  }

  /**
   * Handle recurring slot creation for single bookings
   */
  private async _handleRecurringSlot(
    template: IAvailability, 
    createBookingDto: CreateBookingDto, 
    session: any
  ): Promise<IAvailability> {
    const requestedDate = new Date(createBookingDto.startTime);
    const templateStartDate = new Date(template.startTime);
    
    // Get provider timezone for proper day comparison
    const provider = await this.usersService.findById(template.providerId);
    const providerTimezone = provider?.preferences?.timezone || 'UTC';
    
    // Check if this is an instantiated slot (ID has date suffix)
    const isInstantiatedSlot = createBookingDto.availabilityId.includes('_') && 
                                createBookingDto.availabilityId.match(/_\d{4}-\d{2}-\d{2}$/);
    
    // Only validate day match for non-instantiated slots
    if (!isInstantiatedSlot) {
      // Compare times in provider's timezone, not UTC
      const requestedTimeStr = requestedDate.toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: providerTimezone 
      });
      const templateTimeStr = templateStartDate.toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: providerTimezone 
      });
      
      // Get day of week in provider's timezone
      // Convert to provider timezone and get day of week
      const requestedInProviderTZ = new Date(requestedDate.toLocaleString('en-US', { timeZone: providerTimezone }));
      const templateInProviderTZ = new Date(templateStartDate.toLocaleString('en-US', { timeZone: providerTimezone }));
      const requestedDayOfWeek = requestedInProviderTZ.getDay();
      const actualTemplateDayOfWeek = templateInProviderTZ.getDay();

      // Map day numbers to names for better error messages
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      // Validate day of week matches in provider's timezone
      if (actualTemplateDayOfWeek !== requestedDayOfWeek) {
        const requestedDayName = dayNames[requestedDayOfWeek];
        const templateDayName = dayNames[actualTemplateDayOfWeek];
        const requestedDateStr = requestedDate.toLocaleDateString('en-US', { timeZone: providerTimezone });
        
        throw new BadRequestException(
          `Day mismatch: You're trying to book ${requestedDayName} (${requestedDateStr}), ` +
          `but this recurring slot is for ${templateDayName}s at ${templateTimeStr} (${providerTimezone}). ` +
          `Please select a ${templateDayName} or choose a different availability slot.`
        );
      }
    } else {
      this.logger.log(`[BookingCreation] Skipping day validation for instantiated slot: ${createBookingDto.availabilityId}`);
    }

    // Keep the date from the booking request but use hours from the template
    const templateStart = new Date(template.startTime);
    const templateEnd = new Date(template.endTime);
    
    const instanceStartTime = new Date(requestedDate);
    instanceStartTime.setUTCHours(templateStart.getUTCHours(), templateStart.getUTCMinutes(), 0, 0);
    
    const instanceEndTime = new Date(requestedDate);
    instanceEndTime.setUTCHours(templateEnd.getUTCHours(), templateEnd.getUTCMinutes(), 0, 0);

    // Create a specific instance from the recurring template
    return await this.availabilityService.createInstanceFromRecurring(
      template,
      requestedDate,
      instanceStartTime,
      instanceEndTime,
      session
    );
  }

  /**
   * Validate time slot matches
   */
  private _validateTimeSlot(createBookingDto: CreateBookingDto, availability: IAvailability): void {
    const requestedStart = new Date(createBookingDto.startTime).getTime();
    const requestedEnd = new Date(createBookingDto.endTime).getTime();
    const slotStart = new Date(availability.startTime).getTime();
    const slotEnd = new Date(availability.endTime).getTime();

    if (requestedStart !== slotStart || requestedEnd !== slotEnd) {
      throw new BadRequestException('Booking times do not match availability slot');
    }
  }

  /**
   * Create recurring bookings
   */
  private async _createRecurringBookings(
    template: IAvailability,
    baseBooking: CreateBookingDto,
    session: any
  ): Promise<IBooking[]> {
    const bookings = await this._generateRecurringBookings(template, baseBooking);
    const createdBookings = await this.baseService.createMany(bookings, session);
    await this._handleRecurringBookingSummary(template, createdBookings, session);
    return createdBookings;
  }

  /**
   * Generate recurring booking instances
   */
  private async _generateRecurringBookings(
    template: IAvailability,
    baseBooking: CreateBookingDto
  ): Promise<Array<CreateBookingDto & { serialKey: string; duration: number }>> {
    const bookings: Array<CreateBookingDto & { serialKey: string; duration: number; status?: string }> = [];
    // Determine provider approval mode for initial status
    const provider = await this.usersService.findById(template.providerId);
    const approvalMode = provider?.preferences?.bookingApprovalMode || 'auto';
    const initialStatus = approvalMode === 'manual' ? 'pending' : 'confirmed';
    const { startDate, endDate } = this._calculateRecurringDates(baseBooking);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const instanceStart = new Date(currentDate);
      const instanceEnd = new Date(currentDate);
      instanceEnd.setHours(instanceEnd.getHours() + template.duration / 60);

      const booking = {
        ...baseBooking,
        startTime: instanceStart,
        endTime: instanceEnd,
        serialKey: this.serialKeyService.generateBookingSerialKey(instanceStart),
        guestId: baseBooking.guestId || `guest_${this.serialKeyService.generateBookingSerialKey(new Date())}`,
        duration: template.duration,
        status: initialStatus
      };
      bookings.push(booking);

      if (baseBooking.recurring?.frequency === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 7); // default to weekly
      }
    }

    // Check for conflicts with existing bookings
    await this._validateNoConflicts(bookings, template.providerId);

    return bookings;
  }

  /**
   * Calculate start and end dates for recurring bookings
   */
  private _calculateRecurringDates(baseBooking: CreateBookingDto): { startDate: Date; endDate: Date } {
    const startDate = new Date(baseBooking.startTime);
    let endDate: Date;

    if (baseBooking.recurring?.endDate) {
      endDate = new Date(baseBooking.recurring.endDate);
    } else if (baseBooking.recurring?.occurrences) {
      endDate = new Date(startDate);
      const days = baseBooking.recurring.frequency === 'daily' 
        ? baseBooking.recurring.occurrences 
        : baseBooking.recurring.occurrences * 7;
      endDate.setDate(endDate.getDate() + days);
    } else {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (4 * 7)); // Default to 4 weeks
    }

    return { startDate, endDate };
  }

  /**
   * Validate no booking conflicts exist for the given time slots
   */
  private async _validateNoConflicts(
    bookings: Array<{ startTime: Date; endTime: Date; providerId: string }>,
    providerId: string
  ): Promise<void> {
    // Check each time slot for existing bookings
    const conflictChecks = bookings.map(async (booking) => {
      const existing = await this.baseService.findByFilter({
        providerId,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: { $in: ['confirmed', 'in_progress'] }
      });
      
      if (existing.length > 0) {
        const conflictDate = new Date(booking.startTime).toISOString();
        return { hasConflict: true, date: conflictDate, booking: existing[0] };
      }
      return { hasConflict: false };
    });

    const results = await Promise.all(conflictChecks);
    const conflicts = results.filter(r => r.hasConflict);

    if (conflicts.length > 0) {
      const conflictDates = conflicts.map(c => c.date).join(', ');
      throw new ConflictException(
        `Cannot create recurring booking. ${conflicts.length} time slot(s) already booked: ${conflictDates}`
      );
    }
  }

  /**
   * Handle summary notifications for recurring bookings
   */
  private async _handleRecurringBookingSummary(
    template: IAvailability,
    createdBookings: IBooking[],
    session: any
  ): Promise<void> {
    if (createdBookings.length === 0) return;

    const provider = await this.usersService.findById(template.providerId);
    
    // Create availability instances for all bookings in parallel
    const instancePromises = createdBookings.map(booking =>
      this.availabilityService.createInstanceFromRecurring(
        template,
        new Date(booking.startTime),
        new Date(booking.startTime),
        new Date(booking.endTime),
        session
      )
    );
    const instances = await Promise.all(instancePromises);

    // Mark all instances as booked in parallel
    const markBookedPromises = instances.map((instance, index) =>
      this.availabilityService.markAsBooked(
        instance._id?.toString() || instance.id || '',
        createdBookings[index]._id.toString(),
        session
      )
    );
    await Promise.all(markBookedPromises);

    // Send summary email (2 emails total: guest + provider)
    await this.notificationService.sendRecurringSummary(
      createdBookings[0].guestEmail,
      createdBookings[0].guestName,
      provider?.email || null,
      createdBookings
    );

    // Emit events for all bookings
    const eventPromises = createdBookings.flatMap(booking => [
      this.eventsService.emitBookingCreated(booking),
      this.eventsService.emitAvailabilityStatusChange(booking, 'booked')
    ]);
    await Promise.allSettled(eventPromises);
  }

  /**
   * Create a single booking
   */
  private async _createSingleBooking(
    createBookingDto: CreateBookingDto,
    availability: IAvailability,
    session: any
  ): Promise<IBooking> {
    // Check for conflicts with existing bookings
    const existing = await this.baseService.findByFilter({
      providerId: availability.providerId,
      startTime: createBookingDto.startTime,
      endTime: createBookingDto.endTime,
      status: { $in: ['confirmed', 'in_progress'] }
    });

    if (existing.length > 0) {
      throw new ConflictException(
        `This time slot is already booked. Booking ID: ${existing[0].serialKey}`
      );
    }

    const serialKey = this.serialKeyService.generateBookingSerialKey(createBookingDto.startTime);
    const guestId = createBookingDto.guestId || `guest_${this.serialKeyService.generateBookingSerialKey(new Date())}`;

    // Determine initial status from provider preference
    const providerPref = await this.usersService.findById(availability.providerId);
    const approvalMode = providerPref?.preferences?.bookingApprovalMode || 'auto';
    const initialStatus = approvalMode === 'manual' ? 'pending' : 'confirmed';

    const bookingData = {
      ...createBookingDto,
      guestId,
      serialKey,
      duration: (new Date(createBookingDto.endTime).getTime() - new Date(createBookingDto.startTime).getTime()) / 60000,
      status: initialStatus
    } as any;
    
    const newBooking = await this.baseService.create(bookingData, session);
    const provider = await this.usersService.findById(availability.providerId);

    const availabilityId = availability._id?.toString() || availability.id || '';
    await this._handleBookingNotifications(newBooking, provider, availabilityId, session);
    await this._handleBookingCache(createBookingDto, newBooking);

    return newBooking;
  }

  /**
   * Handle notifications and events for a booking
   */
  private async _handleBookingNotifications(
    booking: IBooking,
    provider: any,
    availabilityId: string,
    session: any
  ): Promise<void> {
    await this.availabilityService.markAsBooked(
      availabilityId,
      booking._id.toString(),
      session
    );

    // Send notifications
    // Always notify provider of new booking
    if (provider?.email) {
      await this.notificationService.sendProviderBookingConfirmation(booking, provider.email);
    }
    // Only send guest confirmation if booking is confirmed, not pending
    if (booking.guestEmail && (booking as any).status !== 'pending') {
      await this.notificationService.sendGuestBookingConfirmation(booking, booking.guestEmail);
    }

    await this.eventsService.emitBookingCreated(booking);
    await this.eventsService.emitAvailabilityStatusChange(booking, 'booked');
  }

  /**
   * Handle booking cache
   */
  private async _handleBookingCache(createBookingDto: CreateBookingDto, newBooking: IBooking): Promise<void> {
    if (createBookingDto.idempotencyKey) {
      await this.cacheService.cacheBooking(
        createBookingDto.idempotencyKey,
        newBooking
      );
    }
  }
}
