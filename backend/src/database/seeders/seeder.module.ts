import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from '../../modules/users/user.schema';
import { Availability, AvailabilitySchema } from '../../modules/availability/availability.schema';
import { UsersSeeder } from './users.seeder';
import { AvailabilitySeeder } from './availability.seeder';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventide'),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Availability.name, schema: AvailabilitySchema },
    ]),
  ],
  providers: [UsersSeeder, AvailabilitySeeder],
  exports: [UsersSeeder, AvailabilitySeeder],
})
export class SeederModule {}
