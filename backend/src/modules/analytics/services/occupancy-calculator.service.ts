import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument } from '../../availability/availability.schema';

export interface OccupancyDataPoint {
  date: Date;
  rate: number;
}

@Injectable()
export class OccupancyCalculatorService {
  constructor(
    @InjectModel(Availability.name) private readonly availabilityModel: Model<AvailabilityDocument>,
  ) {}

  async getOccupancyData(providerId: string, startDate: Date, endDate: Date) {
    const allAvailability = await this.availabilityModel.find({
      providerId,
      startTime: { $gte: startDate, $lte: endDate },
    }).lean();

    return {
      daily: this.calculateDailyOccupancy(allAvailability, startDate, endDate),
      weekly: this.calculateWeeklyOccupancy(allAvailability, startDate, endDate),
      monthly: this.calculateMonthlyOccupancy(allAvailability, startDate, endDate),
    };
  }

  async computeOccupancyRate(providerId: string, startDate: Date, endDate: Date): Promise<number> {
    const [totalSlots, bookedSlots] = await Promise.all([
      this.availabilityModel.countDocuments({
        providerId,
        startTime: { $gte: startDate, $lte: endDate },
      }),
      this.availabilityModel.countDocuments({
        providerId,
        startTime: { $gte: startDate, $lte: endDate },
        isBooked: true,
      }),
    ]);
    
    if (totalSlots === 0) return 0;
    return Math.round((bookedSlots / totalSlots) * 100);
  }

  private calculateDailyOccupancy(allAvailability: any[], startDate: Date, endDate: Date): OccupancyDataPoint[] {
    const occupancyData: OccupancyDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);
      
      const dayAvailability = allAvailability.filter(slot => 
        slot.startTime >= currentDate && slot.startTime < nextDay
      );
      
      const totalSlots = dayAvailability.length;
      const bookedSlots = dayAvailability.filter(slot => slot.isBooked).length;
      const rate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
      
      occupancyData.push({
        date: new Date(currentDate),
        rate,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return occupancyData;
  }

  private calculateWeeklyOccupancy(allAvailability: any[], startDate: Date, endDate: Date): OccupancyDataPoint[] {
    const occupancyData: OccupancyDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    
    while (currentDate <= endDate) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() + 7);
      
      const weekAvailability = allAvailability.filter(slot => 
        slot.startTime >= currentDate && slot.startTime < weekEnd
      );
      
      const totalSlots = weekAvailability.length;
      const bookedSlots = weekAvailability.filter(slot => slot.isBooked).length;
      const rate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
      
      occupancyData.push({
        date: new Date(currentDate),
        rate,
      });
      
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return occupancyData;
  }

  private calculateMonthlyOccupancy(allAvailability: any[], startDate: Date, endDate: Date): OccupancyDataPoint[] {
    const occupancyData: OccupancyDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    currentDate.setDate(1);
    
    while (currentDate <= endDate) {
      const monthEnd = new Date(currentDate);
      monthEnd.setMonth(currentDate.getMonth() + 1);
      
      const monthAvailability = allAvailability.filter(slot => 
        slot.startTime >= currentDate && slot.startTime < monthEnd
      );
      
      const totalSlots = monthAvailability.length;
      const bookedSlots = monthAvailability.filter(slot => slot.isBooked).length;
      const rate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
      
      occupancyData.push({
        date: new Date(currentDate),
        rate,
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return occupancyData;
  }
}
