import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateBookingDto } from '../../dto/create-booking.dto';
import { IBooking } from '../../interfaces/booking.interface';
import { IAvailability } from '../../../availability/interfaces/availability.interface';
import { BookingBaseService } from '../booking-base.service';

@Injectable()
export class BookingValidationProvider {
  private readonly logger = new Logger(BookingValidationProvider.name);

  constructor(
    private readonly baseService: BookingBaseService,
  ) {}

  /**
   * Validate time slot matches
   */
  validateTimeSlot(createBookingDto: CreateBookingDto, availability: IAvailability): void {
    const requestedStart = new Date(createBookingDto.startTime).getTime();
    const requestedEnd = new Date(createBookingDto.endTime).getTime();
    const slotStart = new Date(availability.startTime).getTime();
    const slotEnd = new Date(availability.endTime).getTime();

    if (requestedStart !== slotStart || requestedEnd !== slotEnd) {
      throw new BadRequestException('Booking times do not match availability slot');
    }
  }

  /**
   * Validate no booking conflicts exist for the given time slots
   */
  async validateNoConflicts(
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
}
