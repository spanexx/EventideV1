import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityStatus } from '../availability.schema';

@Injectable()
export class AvailabilityMigrationService {
  private readonly logger = new Logger(AvailabilityMigrationService.name);

  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
  ) {}

  async migrateExistingRecords(): Promise<void> {
    this.logger.log('Starting availability records migration...');

    try {
      // Update all records that don't have maxBookings or status
      const result = await this.availabilityModel.updateMany(
        {
          $or: [
            { maxBookings: { $exists: false } },
            { status: { $exists: false } }
          ]
        },
        {
          $set: {
            maxBookings: 1,
            status: AvailabilityStatus.ACTIVE
          }
        }
      );

      this.logger.log(`Migration completed. Updated ${result.modifiedCount} records.`);
    } catch (error) {
      this.logger.error('Error during migration:', error);
      throw error;
    }
  }
}
