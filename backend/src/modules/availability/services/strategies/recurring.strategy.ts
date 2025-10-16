import { Injectable, Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import { AvailabilityType } from '../../availability.schema';
import { IAvailabilityBase } from '../../interfaces/availability.interface';

type AvailabilityData = any; // Simplified type for now

@Injectable()
export class RecurringStrategy {
  private readonly logger = new Logger(RecurringStrategy.name);

  /**
   * Generate specific instances from a recurring template for a date range
   */
  generateRecurringInstances(
    template: AvailabilityData,
    startDate: Date,
    endDate: Date,
  ): IAvailabilityBase[] {
    const instances: IAvailabilityBase[] = [];
    const current = new Date(startDate);

    // Calculate days until first match of dayOfWeek
    const daysUntilFirst = (template.dayOfWeek! - current.getDay() + 7) % 7;
    current.setDate(current.getDate() + daysUntilFirst);

    // Now we're at first matching day, generate instances weekly
    while (current <= endDate) {
      // Only create instance if we haven't passed end date
      if (current <= endDate) {
        const instance = this.createInstanceFromTemplate(template, new Date(current));
        instances.push(instance);

        this.logger.debug(`Generated instance for template ${template._id}:
          date: ${current.toISOString()}
          dayOfWeek: ${current.getDay()}
          startTime: ${instance.startTime}
          endTime: ${instance.endTime}`
        );
      }

      // Jump to next week
      current.setDate(current.getDate() + 7);
    }

    return instances;
  }

  /**
   * Create a specific instance from a recurring template for a given date
   */
  private createInstanceFromTemplate(
    template: AvailabilityData,
    date: Date,
  ): IAvailabilityBase {
    // Get the time components from the template
    const templateStart = new Date(template.startTime);
    const templateEnd = new Date(template.endTime);

    // Create new date-times for the specific date
    const instanceStart = new Date(date);
    instanceStart.setHours(
      templateStart.getHours(),
      templateStart.getMinutes(),
      templateStart.getSeconds(),
      0
    );

    const instanceEnd = new Date(date);
    instanceEnd.setHours(
      templateEnd.getHours(),
      templateEnd.getMinutes(),
      templateEnd.getSeconds(),
      0
    );

    // Create the instance with the same properties as the template
    // but with specific date and times
    const instance: IAvailabilityBase = {
      id: `${template._id.toString()}_${date.toISOString().split('T')[0]}`, // Unique ID for this instance
      providerId: template.providerId, // Preserve provider ID
      type: AvailabilityType.ONE_OFF, // Instances are treated as one-off
      status: template.status,
      maxBookings: template.maxBookings,
      date: new Date(date),
      startTime: instanceStart,
      endTime: instanceEnd,
      duration: template.duration, // Preserve duration
      isBooked: false, // New instances are not booked
      dayOfWeek: undefined, // Remove dayOfWeek from instances
      isTemplate: false,
      isInstantiated: true,
      templateId: template._id.toString(),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    };

    return instance;
  }
}
