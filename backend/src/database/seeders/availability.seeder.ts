import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Availability } from '../../modules/availability/availability.schema';
import { User } from '../../modules/users/user.schema';

@Injectable()
export class AvailabilitySeeder {
  constructor(
    @InjectModel(Availability.name) private availabilityModel: Model<Availability>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async seed() {
    console.log('🌱 Seeding availability...');

    // Check if availability already exists
    const existingAvailability = await this.availabilityModel.countDocuments();
    if (existingAvailability > 0) {
      console.log('⚠️  Availability already exists. Skipping seeding.');
      return;
    }

    // Get all provider users
    const providers = await this.userModel.find({ role: 'provider' }).exec();
    
    if (providers.length === 0) {
      console.log('⚠️  No providers found. Please seed users first.');
      return;
    }

    const availabilitySchedules: any[] = [];
    const daysOfWeek = [
      { name: 'monday', value: 1 },
      { name: 'tuesday', value: 2 },
      { name: 'wednesday', value: 3 },
      { name: 'thursday', value: 4 },
      { name: 'friday', value: 5 },
    ];

    // Helper function to create time Date object
    const createTime = (hours: number, minutes: number = 0) => {
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    // Create recurring availability for each provider (Monday-Friday)
    for (const provider of providers) {
      for (const day of daysOfWeek) {
        // Morning shift: 9:00 AM - 12:00 PM (3 hours = 180 minutes)
        availabilitySchedules.push({
          providerId: provider._id.toString(),
          type: 'recurring',
          dayOfWeek: day.value,
          startTime: createTime(9, 0),
          endTime: createTime(12, 0),
          duration: 180,
          status: 'active',
          maxBookings: 1,
          isBooked: false,
          isTemplate: false,
          isInstantiated: false,
        });

        // Afternoon shift: 1:00 PM - 5:00 PM (4 hours = 240 minutes)
        availabilitySchedules.push({
          providerId: provider._id.toString(),
          type: 'recurring',
          dayOfWeek: day.value,
          startTime: createTime(13, 0),
          endTime: createTime(17, 0),
          duration: 240,
          status: 'active',
          maxBookings: 1,
          isBooked: false,
          isTemplate: false,
          isInstantiated: false,
        });
      }

      // Add some evening availability for select days (Tuesday and Thursday)
      [2, 4].forEach(dayValue => {
        availabilitySchedules.push({
          providerId: provider._id.toString(),
          type: 'recurring',
          dayOfWeek: dayValue,
          startTime: createTime(18, 0),
          endTime: createTime(20, 0),
          duration: 120,
          status: 'active',
          maxBookings: 1,
          isBooked: false,
          isTemplate: false,
          isInstantiated: false,
        });
      });
    }

    const createdAvailability = await this.availabilityModel.insertMany(availabilitySchedules);
    console.log(`✅ Created ${createdAvailability.length} availability slots for ${providers.length} providers`);
    console.log(`📅 Each provider has recurring availability Monday-Friday (9am-12pm, 1pm-5pm)`);
    console.log(`🌙 Evening slots (6pm-8pm) on Tuesday and Thursday`);
    
    return createdAvailability;
  }

  async clear() {
    console.log('🗑️  Clearing availability...');
    await this.availabilityModel.deleteMany({});
    console.log('✅ Availability cleared');
  }
}
