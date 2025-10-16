import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument } from '../../availability.schema';
import { IAvailabilityBase } from '../../interfaces/availability.interface';

@Injectable()
export class AvailabilityInstanceProvider {
  private readonly logger = new Logger(AvailabilityInstanceProvider.name);

  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
  ) {}

  /**
   * Find all instances for a provider within a date range
   */
  async findAllInstances(providerId: string, startDate: Date, endDate: Date): Promise<IAvailabilityBase[]> {
    return this.availabilityModel.find({
      providerId,
      type: 'one_off',
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).exec();
  }

  /**
   * Find an existing instance
   */
  async findExistingInstance(
    providerId: string,
    date: Date,
    startTime: Date,
    session?: any
  ): Promise<IAvailabilityBase | null> {
    const query = this.availabilityModel.findOne({
      providerId,
      type: 'one_off',
      date,
      startTime
    });

    if (session) {
      query.session(session);
    }

    return query.exec();
  }

  /**
   * Create a specific instance from a recurring availability template
   */
  async createInstanceFromRecurring(
    template: IAvailabilityBase,
    date: Date,
    startTime: Date,
    endTime: Date,
    session: any,
  ): Promise<IAvailabilityBase> {
    this.logger.log(`[createInstanceFromRecurring] Looking for existing recurring instance for template ${template._id}`);

    // Start fresh with dates to ensure proper UTC handling
    const requestedDate = new Date(date.getTime());
    requestedDate.setUTCHours(0, 0, 0, 0);

    // Create the start and end times
    const instanceStartTime = new Date(requestedDate.getTime());
    instanceStartTime.setUTCHours(
      startTime.getUTCHours(),
      startTime.getUTCMinutes(),
      0,
      0
    );

    const instanceEndTime = new Date(requestedDate.getTime());
    instanceEndTime.setUTCHours(
      endTime.getUTCHours(),
      endTime.getUTCMinutes(),
      0,
      0
    );

    // FIXED: Check for existing RECURRING instance that matches the date/time
    // Recurring instances are pre-generated with type='recurring', not 'one_off'
    const existingRecurringInstance = await this.availabilityModel.findOne({
      providerId: template.providerId,
      type: 'recurring',
      startTime: instanceStartTime,
      endTime: instanceEndTime
    }).session(session);

    if (existingRecurringInstance) {
      this.logger.log(`[createInstanceFromRecurring] Found existing recurring instance ${existingRecurringInstance._id}`);
      if (existingRecurringInstance.isBooked) {
        throw new ConflictException('This time slot is already booked');
      }
      return existingRecurringInstance;
    }

    // If no recurring instance exists, create one-off instance
    this.logger.log(`[createInstanceFromRecurring] No recurring instance found, creating one-off instance`);

    // Check if one-off instance already exists
    const existingOneOff = await this.availabilityModel.findOne({
      providerId: template.providerId,
      type: 'one_off',
      date: requestedDate,
      startTime: instanceStartTime
    }).session(session);

    if (existingOneOff) {
      this.logger.log(`[createInstanceFromRecurring] Found existing one-off instance ${existingOneOff._id}`);
      if (existingOneOff.isBooked) {
        throw new ConflictException('This time slot is already booked');
      }
      return existingOneOff;
    }

    // Create new one-off instance only if no existing instance found
    const instanceData = {
      providerId: template.providerId,
      type: 'one_off' as const,
      startTime,
      endTime,
      date,
      duration: template.duration,
      maxBookings: template.maxBookings,
      status: template.status,
      isBooked: false
    };

    const instance = await this.availabilityModel.create([instanceData], { session });
    this.logger.log(`[createInstanceFromRecurring] Created new one-off instance ${instance[0]._id}`);

    // Important: Do not mark the template as booked
    if (template.type === 'recurring') {
      await this.availabilityModel
        .updateOne(
          { _id: template._id },
          { $set: { isBooked: false }, $unset: { bookingId: "" } },
          { session }
        );
    }

    return instance[0];
  }
}
