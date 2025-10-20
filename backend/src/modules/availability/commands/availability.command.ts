import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability, AvailabilityDocument, AvailabilityStatus } from '../availability.schema';

@Injectable()
export class AvailabilityCommand {
  constructor(
    @InjectModel(Availability.name)
    private availabilityModel: Model<AvailabilityDocument>,
  ) {}

  @Command({
    command: 'availability:migrate',
    describe: 'Migrate availability records to include status and maxBookings',
  })
  async migrate() {
    console.log('Starting availability migration...');

    try {
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

      console.log(`Migration completed. Updated ${result.modifiedCount} records.`);
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}
