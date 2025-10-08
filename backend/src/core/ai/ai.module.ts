import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomCacheModule } from '../cache/cache.module';
import { SessionModule } from '../sessions/session.module';
import { AvailabilityModule } from '../../modules/availability/availability.module';
import { AiAvailabilityService } from './services/ai-availability.service';
import { AiChatService } from './services/ai-chat.service';
import { AiChatController } from './controllers/ai-chat.controller';
import { AiChatSessionService } from './services/ai-chat-session.service';
import { AiChatMessageService } from './services/ai-chat-message.service';
import { NlpAnalyzerService } from './services/nlp-analyzer.service';
import { LlmService } from './services/llm.service';

/**
 * AI Module for calendar enhancement features
 * Leverages existing caching infrastructure and provides AI chat functionality
 */
@Module({
  imports: [
    ConfigModule,
    CustomCacheModule, // Leverage existing caching infrastructure
    forwardRef(() => AvailabilityModule), // Use forwardRef to avoid circular dependency
    forwardRef(() => SessionModule), // Import SessionModule for chat session management
  ],
  providers: [
    AiAvailabilityService,
    AiChatService,
    AiChatSessionService,
    AiChatMessageService,
    NlpAnalyzerService,
    LlmService,
  ],
  controllers: [
    AiChatController,
  ],
  exports: [
    AiAvailabilityService,
    AiChatService,
    AiChatSessionService,
    AiChatMessageService,
    NlpAnalyzerService,
  ],
})
export class AiModule {}