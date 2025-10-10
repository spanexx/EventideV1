import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssistantAgentService } from './assistant-agent.service';
import { AssistantAgentController } from './assistant-agent.controller';
import { KnowledgeBaseModule } from '../../modules/knowledge-base/knowledge-base.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => KnowledgeBaseModule), // Import knowledge base module with forward reference
  ],
  providers: [
    AssistantAgentService,
  ],
  controllers: [
    AssistantAgentController,
  ],
  exports: [
    AssistantAgentService,
  ],
})
export class AssistantAgentModule {}