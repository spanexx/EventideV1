import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AvailabilityType } from '../../availability.schema';
import { Booking, BookingDocument } from '../../../booking/booking.schema';

@Injectable()
export class BookingUtils {
  private readonly logger = new Logger(BookingUtils.name);

  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {}

  /**
   * Get all booked slots for a provider in a date range
   */
  async getBookedSlots(providerId: string, startDate: Date, endDate: Date): Promise<{ [key: string]: boolean }> {
    this.logger.debug(`Checking booked slots for provider ${providerId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Get all bookings and booked availabilities in parallel
    const [bookings, bookedAvailabilities] = await Promise.all([
      this.bookingModel.find({
        providerId,
        startTime: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }).select('availabilityId startTime serialKey').lean(),

      // This would need to be implemented based on the actual availability model
      // For now, returning empty array
      []
    ]);

    this.logger.debug(`Found ${bookings.length} bookings and ${bookedAvailabilities.length} booked availabilities`);

    const bookedSlots: { [key: string]: boolean } = {};

    // Process bookings
    bookings.forEach(booking => {
      if (booking.availabilityId) {
        // For one-off slots
        bookedSlots[booking.availabilityId] = true;

        // For recurring slots, also mark the date-specific instance
        if (booking.startTime && booking.serialKey) {
          const dateKey = `${booking.availabilityId}_${booking.startTime.toISOString().split('T')[0]}`;
          bookedSlots[dateKey] = true;
        }
      }
    });

    // Process booked availabilities
    bookedAvailabilities.forEach((availability: any) => {
      if (availability && availability._id) {
        bookedSlots[availability._id.toString()] = true;
      }
    });

    return bookedSlots;
  }

  /**
   * Filter slots by booking status
   */
  filterBookedSlots(
    slots: any[],
    bookedSlots: { [key: string]: boolean }
  ): any[] {
    return slots.filter(slot => {
      // Exclude if booked
      if (slot.id && bookedSlots[slot.id]) {
        this.logger.debug(`Excluding booked slot: ${slot.id}`);
        return false;
      }
      return true;
    });
  }
}
