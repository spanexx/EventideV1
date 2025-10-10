import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomCacheModule } from '../core/cache/cache.module';
import { SessionModule } from '../core/sessions/session.module';
import { AiModule } from '../core/ai/ai.module';
import { GoogleVertexAiModule } from './google-vertex-ai.module';
import { AssistantAgentModule } from './assistant-agent/assistant-agent.module';
import { KnowledgeBaseModule } from '../modules/knowledge-base/knowledge-base.module';

@Module({
  imports: [
    ConfigModule,
    CustomCacheModule,
    forwardRef(() => SessionModule),
    forwardRef(() => AiModule),
    forwardRef(() => KnowledgeBaseModule), // Import knowledge base module
    GoogleVertexAiModule,
    AssistantAgentModule,
  ],
  providers: [],
  controllers: [],
  exports: [
    GoogleVertexAiModule,
    AssistantAgentModule,
  ],
})
export class AgentsModule {}