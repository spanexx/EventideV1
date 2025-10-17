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
    this.logger.log(`[BookingSearch] findByFilter called with: ${JSON.stringify({
      providerId: getBookingsDto.providerId,
      status: getBookingsDto.status,
      search: getBookingsDto.search,
      startDate: getBookingsDto.startDate?.toISOString(),
      endDate: getBookingsDto.endDate?.toISOString()
    })}`);

    const query: any = {};

    if (getBookingsDto.providerId) {
      query.providerId = getBookingsDto.providerId;
      this.logger.log(`[BookingSearch] Added providerId filter: ${getBookingsDto.providerId}`);
    }

    if (getBookingsDto.startDate || getBookingsDto.endDate) {
      query.startTime = {};
      if (getBookingsDto.startDate) {
        query.startTime.$gte = getBookingsDto.startDate;
        this.logger.log(`[BookingSearch] Added startDate filter: ${getBookingsDto.startDate}`);
      }
      if (getBookingsDto.endDate) {
        query.startTime.$lte = getBookingsDto.endDate;
        this.logger.log(`[BookingSearch] Added endDate filter: ${getBookingsDto.endDate}`);
      }
    }

    if (getBookingsDto.status) {
      query.status = getBookingsDto.status;
      this.logger.log(`[BookingSearch] Added status filter: ${getBookingsDto.status}`);
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
        this.logger.log(`[BookingSearch] Added search filter: "${term}" across guestName, guestEmail, serialKey`);
      }
    }

    this.logger.log(`[BookingSearch] Executing MongoDB query: ${JSON.stringify(query)}`);
    const results = await this.baseService.find(query);
    this.logger.log(`[BookingSearch] Query returned ${results.length} results`);

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
