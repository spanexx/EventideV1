import { Injectable, Logger } from '@nestjs/common';
import { GetBookingsDto } from '../dto/get-bookings.dto';
import { BookingBaseService } from './booking-base.service';
import { IBooking } from '../interfaces/booking.interface';

@Injectable()
export class BookingSearchService {
  private readonly logger = new Logger(BookingSearchService.name);

  constructor(
    private readonly baseService: BookingBaseService
  ) {}

  async findByFilter(getBookingsDto: GetBookingsDto): Promise<IBooking[]> {
    const query: any = {};

    if (getBookingsDto.providerId) {
      query.providerId = getBookingsDto.providerId;
    }

    if (getBookingsDto.startDate || getBookingsDto.endDate) {
      query.startTime = {};
      if (getBookingsDto.startDate) {
        query.startTime.$gte = getBookingsDto.startDate;
      }
      if (getBookingsDto.endDate) {
        query.startTime.$lte = getBookingsDto.endDate;
      }
    }

    if (getBookingsDto.status) {
      query.status = getBookingsDto.status;
    }

    // Free-text search across guestName, guestEmail, serialKey
    if (getBookingsDto.search) {
      const term = getBookingsDto.search.trim();
      if (term.length > 0) {
        const regex = new RegExp(term, 'i');
        query.$or = [
          { guestName: regex },
          { guestEmail: regex },
          { serialKey: regex },
        ];
      }
    }

    // Debug logs
    this.logger.log(`[BookingSearch] findByFilter params: ${JSON.stringify({ ...getBookingsDto, startDate: getBookingsDto.startDate?.toISOString?.(), endDate: getBookingsDto.endDate?.toISOString?.() })}`);
    this.logger.log(`[BookingSearch] built query: ${JSON.stringify(query)}`);

    return await this.baseService.find(query);
  }

  async findBookingsByEmail(email: string): Promise<IBooking[]> {
    return await this.baseService.find({ guestEmail: email });
  }

  async findBookingsByProviderId(providerId: string): Promise<IBooking[]> {
    return await this.baseService.find({ providerId });
  }

  async findBookingsByDateRange(startDate: Date, endDate: Date): Promise<IBooking[]> {
    return await this.baseService.find({
      startTime: { $gte: startDate, $lte: endDate }
    });
  }

  async findByGuestEmail(email: string): Promise<IBooking[]> {
    return await this.baseService.find({ guestEmail: email });
  }

  async findBySerialKey(serialKey: string): Promise<IBooking | null> {
    const bookings = await this.baseService.find({ serialKey });
    return bookings[0] || null;
  }
}
