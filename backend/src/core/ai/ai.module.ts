import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomCacheModule } from '../cache/cache.module';
import { AvailabilityModule } from '../../modules/availability/availability.module';
import { AiAvailabilityService } from './services/ai-availability.service';
import { AiChatService } from './services/ai-chat.service';
import { AiChatController } from './controllers/ai-chat.controller';

/**
 * AI Module for calendar enhancement features
 * Leverages existing caching infrastructure and provides AI chat functionality
 */
@Module({
  imports: [
    ConfigModule,
    CustomCacheModule, // Leverage existing caching infrastructure
    forwardRef(() => AvailabilityModule), // Use forwardRef to avoid circular dependency
  ],
  providers: [
    AiAvailabilityService,
    AiChatService,
  ],
  controllers: [
    AiChatController,
  ],
  exports: [
    AiAvailabilityService,
    AiChatService,
  ],
})
export class AiModule {}