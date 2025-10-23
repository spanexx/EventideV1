import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityType } from '../availability.schema';
import { AvailabilityCacheService } from './availability-cache.service';

@Injectable()
export class AvailabilitySchedulerService {
  private readonly logger = new Logger(AvailabilitySchedulerService.name);

  constructor(
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    private readonly cacheService: AvailabilityCacheService,
  ) {}

  /**
   * Weekly job to extend recurring slots
   * Runs every Sunday at 2 AM
   */
  public async extendRecurringSlots(): Promise<void> {
    this.logger.log('Starting weekly recurring slot extension job');
    try {
      const recurringPatterns = await this.availabilityModel.aggregate([
        { $match: { type: AvailabilityType.RECURRING, status: 'active' } },
        { $group: {
          _id: {
            providerId: '$providerId',
            dayOfWeek: '$dayOfWeek',
            startTime: '$startTime',
            endTime: '$endTime',
            duration: '$duration',
            maxBookings: '$maxBookings'
          },
          latestWeek: { $max: '$weekOf' },
          count: { $sum: 1 }
        } }
      ]);
      this.logger.log(`Found ${recurringPatterns.length} recurring patterns to extend`);
      const now = new Date();
      const weeksToGenerate = 4;
      for (const pattern of recurringPatterns) {
        const { providerId, dayOfWeek, startTime, endTime, duration, maxBookings } = pattern._id;
        const latestWeek = new Date(pattern.latestWeek);
        const slotsToCreate: any[] = [];
        for (let week = 1; week <= weeksToGenerate; week++) {
          const nextWeekStart = new Date(latestWeek);
          nextWeekStart.setDate(latestWeek.getDate() + week * 7);
          const targetDay = new Date(nextWeekStart);
          const daysToAdd = (dayOfWeek - nextWeekStart.getDay() + 7) % 7;
          targetDay.setDate(nextWeekStart.getDate() + daysToAdd);
          if (targetDay <= now) continue;
          const slotData = {
            providerId,
            type: AvailabilityType.RECURRING,
            dayOfWeek,
            date: targetDay,
            weekOf: nextWeekStart,
            startTime: this.adjustTimeToDate(new Date(startTime), targetDay),
            endTime: this.adjustTimeToDate(new Date(endTime), targetDay),
            duration,
            maxBookings,
            isBooked: false,
            status: 'active' as const,
          };
          slotsToCreate.push(slotData);
        }
        if (slotsToCreate.length > 0) {
          await this.availabilityModel.insertMany(slotsToCreate);
          this.logger.log(`Extended ${slotsToCreate.length} slots for provider ${providerId}, dayOfWeek ${dayOfWeek}`);
          await this.cacheService.clearProviderCache(providerId);
        }
      }
      this.logger.log('Completed weekly recurring slot extension job');
    } catch (error) {
      this.logger.error('Failed to extend recurring slots:', (error as any).message, (error as any).stack);
    }
  }

  /**
   * Daily cleanup job to remove old past slots
   * Runs every day at 3 AM
   */
  public async cleanupPastSlots(): Promise<void> {
    this.logger.log('Starting daily cleanup of past slots');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const result = await this.availabilityModel.deleteMany({
        endTime: { $lt: thirtyDaysAgo },
        isBooked: false,
        status: { $ne: 'active' },
      });
      this.logger.log(`Cleaned up ${result.deletedCount} old past slots`);
    } catch (error) {
      this.logger.error('Failed to cleanup past slots:', (error as any).message, (error as any).stack);
    }
  }

  /**
   * Adjust time to specific date
   */
  private adjustTimeToDate(time: Date, targetDate: Date): Date {
    const result = new Date(targetDate);
    result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
    return result;
  }
}
