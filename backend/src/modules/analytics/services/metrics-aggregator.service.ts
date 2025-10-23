import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../../booking/booking.schema';
import { RevenueCalculatorService } from './revenue-calculator.service';
import { OccupancyCalculatorService } from './occupancy-calculator.service';

export interface AnalyticsMetrics {
  totalBookings: number;
  revenue: number;
  cancellations: number;
  occupancyRate: number;
}

@Injectable()
export class MetricsAggregatorService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    private readonly revenueCalculator: RevenueCalculatorService,
    private readonly occupancyCalculator: OccupancyCalculatorService,
  ) {}

  async getMetrics(providerId: string, startDate: Date, endDate: Date): Promise<AnalyticsMetrics> {
    const [totalBookings, revenue, cancellations, occupancyRate] = await Promise.all([
      this.bookingModel.countDocuments({
        providerId,
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      this.revenueCalculator.computeTotalRevenue(providerId, startDate, endDate),
      this.bookingModel.countDocuments({
        providerId,
        status: BookingStatus.CANCELLED,
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      this.occupancyCalculator.computeOccupancyRate(providerId, startDate, endDate),
    ]);

    return {
      totalBookings,
      revenue,
      cancellations,
      occupancyRate,
    };
  }
}
