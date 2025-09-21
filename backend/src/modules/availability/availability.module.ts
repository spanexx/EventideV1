import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Availability, AvailabilitySchema } from './availability.schema';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { AvailabilityBasicController } from './controllers/availability-basic.controller';
import { AvailabilityAiController } from './controllers/availability-ai.controller';
import { AvailabilityBulkController } from './controllers/availability-bulk.controller';
import { CustomCacheModule } from '../../core/cache/cache.module';
import { WebsocketsModule } from '../../core/websockets';
import { AiModule } from '../../core/ai/ai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Availability.name, schema: AvailabilitySchema },
    ]),
    CustomCacheModule,
    WebsocketsModule,
    AiModule, // Import AI module for enhanced controllers
  ],
  providers: [AvailabilityService],
  controllers: [
    AvailabilityController, // Keep existing controller for backward compatibility
    AvailabilityBasicController, // New modular basic CRUD controller
    AvailabilityAiController, // AI-enhanced controller
    AvailabilityBulkController, // Bulk operations controller
  ],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
