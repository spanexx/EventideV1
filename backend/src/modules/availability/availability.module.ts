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
import { AvailabilitySchedulerService } from './services/availability-scheduler.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilityBasicController } from './controllers/availability-basic.controller';
import { AvailabilityAiController } from './controllers/availability-ai.controller';
import { AvailabilityBulkController } from './controllers/availability-bulk.controller';
import { CustomCacheModule } from '../../core/cache/cache.module';
import { WebsocketsModule } from '../../core/websockets';
import { UsersModule } from '../../modules/users/users.module';
import { AiModule } from '../../core/ai/ai.module';
import { CommandModule } from 'nestjs-command';
// import { AvailabilityCommand } from './commands/availability.command';

// Import modular components
import { BookingProvider } from './services/providers/booking.provider';
import { QueryUtils } from './services/utils/query.utils';
import { ManagementUtils } from './services/utils/management.utils';
import { SlotAdjustmentStrategy } from './services/strategies/slot-adjustment.strategy';
import { CacheProvider } from './services/providers/cache.provider';
import { BookingUtils } from './services/utils/booking.utils';
import { RecurringStrategy } from './services/strategies/recurring.strategy';
import { DateFilterUtils } from './services/utils/date-filter.utils';
import { AvailabilityInstanceProvider } from './services/providers/instance.provider';
import { AvailabilityUpdateHandler } from './services/handlers/update.handler';
import { BulkCreationHandler } from './services/handlers/bulk-creation.handler';

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
    // AvailabilityCommand,
    AvailabilityMigrationService,
    AvailabilitySchedulerService,
    // Modular components
    BookingProvider,
    QueryUtils,
    ManagementUtils,
    SlotAdjustmentStrategy,
    CacheProvider,
    BookingUtils,
    RecurringStrategy,
    DateFilterUtils,
    AvailabilityInstanceProvider,
    AvailabilityUpdateHandler,
    BulkCreationHandler,
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
