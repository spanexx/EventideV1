import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomCacheModule } from '../cache/cache.module';
import { AiAvailabilityService } from './services/ai-availability.service';

/**
 * AI Module for calendar enhancement features
 * Leverages existing caching infrastructure
 */
@Module({
  imports: [
    ConfigModule,
    CustomCacheModule, // Leverage existing caching infrastructure
  ],
  providers: [
    AiAvailabilityService,
  ],
  exports: [
    AiAvailabilityService,
  ],
})
export class AiModule {}