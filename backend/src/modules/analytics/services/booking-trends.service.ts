import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../../booking/booking.schema';

export interface BookingTrendDataPoint {
  date: Date;
  count: number;
}

@Injectable()
export class BookingTrendsService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
  ) {}

  async getBookingTrends(providerId: string, startDate: Date, endDate: Date): Promise<BookingTrendDataPoint[]> {
    const bookings = await this.bookingModel.find({
      providerId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const dailyMap: { [key: string]: number } = {};
    
    bookings.forEach(booking => {
      const dateKey = new Date(booking.createdAt).toDateString();
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + 1;
    });

    return Object.entries(dailyMap).map(([dateStr, count]) => ({
      date: new Date(dateStr),
      count,
    }));
  }
}
