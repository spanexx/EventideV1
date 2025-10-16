import { Injectable, Logger } from '@nestjs/common';
import { CreateBookingDto } from '../../dto/create-booking.dto';
import { IBooking } from '../../interfaces/booking.interface';
import { IAvailability } from '../../../availability/interfaces/availability.interface';
import { BookingSerialKeyService } from '../booking-serial-key.service';
import { BookingBaseService } from '../booking-base.service';
import { UsersService } from '../../../users/users.service';

@Injectable()
export class RecurringBookingStrategy {
  private readonly logger = new Logger(RecurringBookingStrategy.name);

  constructor(
    private readonly baseService: BookingBaseService,
    private readonly serialKeyService: BookingSerialKeyService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Create recurring bookings
   */
  async createRecurringBookings(
    template: IAvailability,
    baseBooking: CreateBookingDto,
    session: any
  ): Promise<IBooking[]> {
    const bookings = await this.generateRecurringBookings(template, baseBooking);
    const createdBookings = await this.baseService.createMany(bookings, session);
    return createdBookings;
  }

  /**
   * Generate recurring booking instances
   */
  async generateRecurringBookings(
    template: IAvailability,
    baseBooking: CreateBookingDto
  ): Promise<Array<CreateBookingDto & { serialKey: string; duration: number; status?: string }>> {
    // Get provider to check auto-confirm preference
    const provider = await this.usersService.findById(template.providerId);
    const autoConfirm = provider?.preferences?.booking?.autoConfirmBookings ?? true;
    
    this.logger.log(`[RecurringBookingStrategy] Provider ${template.providerId} auto-confirm: ${autoConfirm}`);

    const bookings: Array<CreateBookingDto & { serialKey: string; duration: number; status?: string }> = [];
    const { startDate, endDate } = this.calculateRecurringDates(baseBooking);
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
        status: autoConfirm ? 'confirmed' : 'pending'
      };
      bookings.push(booking);

      if (baseBooking.recurring?.frequency === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 7); // default to weekly
      }
    }

    // Check for conflicts with existing bookings
    await this.validateNoConflicts(bookings, template.providerId);

    return bookings;
  }

  /**
   * Calculate start and end dates for recurring bookings
   */
  private calculateRecurringDates(baseBooking: CreateBookingDto): { startDate: Date; endDate: Date } {
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
  private async validateNoConflicts(
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
      throw new Error(
        `Cannot create recurring booking. ${conflicts.length} time slot(s) already booked: ${conflictDates}`
      );
    }
  }
}
