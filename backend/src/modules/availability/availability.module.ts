import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from '../../core/email/email.module';
import { Availability, AvailabilitySchema } from './availability.schema';
import { Booking, BookingSchema } from '../booking/booking.schema';
import { AvailabilityService } from './availability.service';
import { AvailabilityBaseService } from './services/availability-base.service';
import { AvailabilityCacheService } from './services/availability-cache.service';
import { AvailabilityEventsService } from './services/availability-events.service';
import { AvailabilityValidationService } from './services/availability-validation.service';
import { AvailabilitySlotGeneratorService } from './services/availability-slot-generator.service';
import { AvailabilityCreationService } from './services/availability-creation.service';
import { AvailabilityNotificationService } from './services/availability-notification.service';
import { AvailabilityMigrationService } from './services/availability-migration.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilityBasicController } from './controllers/availability-basic.controller';
import { AvailabilityAiController } from './controllers/availability-ai.controller';
import { AvailabilityBulkController } from './controllers/availability-bulk.controller';
import { CustomCacheModule } from '../../core/cache/cache.module';
import { WebsocketsModule } from '../../core/websockets';
import { UsersModule } from '../../modules/users/users.module';
import { AiModule } from '../../core/ai/ai.module';
import { CommandModule } from 'nestjs-command';
import { AvailabilityCommand } from './commands/availability.command';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Availability.name, schema: AvailabilitySchema },
      { name: Booking.name, schema: BookingSchema }, // Add Booking model
    ]),
    CustomCacheModule,
    WebsocketsModule,
    forwardRef(() => AiModule), // Use forwardRef to avoid circular dependency
    EmailModule,
    CommandModule,
    UsersModule
  ],
  providers: [
    AvailabilityService,
    AvailabilityBaseService,
    AvailabilityCacheService,
    AvailabilityEventsService,
    AvailabilityValidationService,
    AvailabilitySlotGeneratorService,
    AvailabilityCreationService,
    AvailabilityNotificationService,
    AvailabilityCommand,
    AvailabilityMigrationService,
  ],
  controllers: [
    AvailabilityController, // Keep existing controller for backward compatibility
    AvailabilityBasicController, // New modular basic CRUD controller
    AvailabilityAiController, // AI-enhanced controller
    AvailabilityBulkController, // Bulk operations controller
  ],
  exports: [
    AvailabilityService,
    AvailabilityCacheService,
    MongooseModule.forFeature([
      { name: Availability.name, schema: AvailabilitySchema }
    ])
  ],
})
export class AvailabilityModule {}
