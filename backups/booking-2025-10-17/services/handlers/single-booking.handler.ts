import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { CreateBookingDto } from '../../dto/create-booking.dto';
import { IBooking } from '../../interfaces/booking.interface';
import { IAvailability } from '../../../availability/interfaces/availability.interface';
import { BookingSerialKeyService } from '../booking-serial-key.service';
import { BookingBaseService } from '../booking-base.service';
import { BookingCacheService } from '../booking-cache.service';
import { UsersService } from '../../../users/users.service';
import { BookingNotificationHandler } from './booking-notification.handler';

@Injectable()
export class SingleBookingHandler {
  private readonly logger = new Logger(SingleBookingHandler.name);

  constructor(
    private readonly baseService: BookingBaseService,
    private readonly cacheService: BookingCacheService,
    private readonly serialKeyService: BookingSerialKeyService,
    private readonly usersService: UsersService,
    private readonly notificationHandler: BookingNotificationHandler,
  ) {}

  /**
   * Create a single booking
   */
  async createSingleBooking(
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

    // Get provider to check auto-confirm preference
    const provider = await this.usersService.findById(availability.providerId);
    const autoConfirm = provider?.preferences?.booking?.autoConfirmBookings ?? true;
    
    this.logger.log(`[SingleBookingHandler] Provider ${availability.providerId} auto-confirm: ${autoConfirm}`);

    const serialKey = this.serialKeyService.generateBookingSerialKey(createBookingDto.startTime);
    const guestId = createBookingDto.guestId || `guest_${this.serialKeyService.generateBookingSerialKey(new Date())}`;
    
    const bookingData = {
      ...createBookingDto,
      guestId,
      serialKey,
      status: autoConfirm ? 'confirmed' : 'pending',
      duration: (new Date(createBookingDto.endTime).getTime() - new Date(createBookingDto.startTime).getTime()) / 60000
    };
    
    const newBooking = await this.baseService.create(bookingData, session);
    
    const availabilityId = availability._id?.toString() || availability.id || '';
    await this.notificationHandler.handleBookingNotifications(newBooking, provider, availabilityId, session);
    await this.handleBookingCache(createBookingDto, newBooking);

    return newBooking;
  }

  /**
   * Handle booking cache
   */
  private async handleBookingCache(createBookingDto: CreateBookingDto, newBooking: IBooking): Promise<void> {
    if (createBookingDto.idempotencyKey) {
      await this.cacheService.cacheBooking(
        createBookingDto.idempotencyKey,
        newBooking
      );
    }
  }
}
