import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../../booking/booking.schema';

export interface TimeSeriesDataPoint {
  date: Date;
  amount: number;
}

@Injectable()
export class RevenueCalculatorService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
  ) {}

  async getRevenueData(providerId: string, startDate: Date, endDate: Date) {
    const bookings = await this.bookingModel.find({
      providerId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      paymentStatus: 'paid',
      startTime: { $gte: startDate, $lte: endDate },
    }).lean();

    return {
      daily: this.calculateDailyRevenue(bookings),
      weekly: this.calculateWeeklyRevenue(bookings),
      monthly: this.calculateMonthlyRevenue(bookings),
    };
  }

  async computeTotalRevenue(providerId: string, startDate: Date, endDate: Date): Promise<number> {
    const bookings = await this.bookingModel.find({
      providerId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      paymentStatus: 'paid',
      startTime: { $gte: startDate, $lte: endDate },
    }).select('totalAmount').lean();
    
    return bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0) / 100; // Convert cents to dollars
  }

  private calculateDailyRevenue(bookings: any[]): TimeSeriesDataPoint[] {
    const dailyMap: { [key: string]: number } = {};
    
    bookings.forEach(booking => {
      const dateKey = new Date(booking.startTime).toDateString();
      const revenue = (booking.totalAmount || 0) / 100; // Convert cents to dollars
      dailyMap[dateKey] = (dailyMap[dateKey] || 0) + revenue;
    });

    return Object.entries(dailyMap).map(([dateStr, amount]) => ({
      date: new Date(dateStr),
      amount,
    }));
  }

  private calculateWeeklyRevenue(bookings: any[]): TimeSeriesDataPoint[] {
    const weeklyMap: { [key: string]: number } = {};
    
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.startTime);
      const weekStart = new Date(bookingDate);
      weekStart.setDate(bookingDate.getDate() - bookingDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toDateString();
      const revenue = (booking.totalAmount || 0) / 100;
      weeklyMap[weekKey] = (weeklyMap[weekKey] || 0) + revenue;
    });

    return Object.entries(weeklyMap).map(([dateStr, amount]) => ({
      date: new Date(dateStr),
      amount,
    }));
  }

  private calculateMonthlyRevenue(bookings: any[]): TimeSeriesDataPoint[] {
    const monthlyMap: { [key: string]: number } = {};
    
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.startTime);
      const monthStart = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), 1);
      const monthKey = monthStart.toDateString();
      const revenue = (booking.totalAmount || 0) / 100;
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + revenue;
    });

    return Object.entries(monthlyMap).map(([dateStr, amount]) => ({
      date: new Date(dateStr),
      amount,
    }));
  }
}
