import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleVertexAIService } from './google-vertex-ai.service';
import { GoogleVertexAIController } from './google-vertex-ai.controller';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    GoogleVertexAIService,
  ],
  controllers: [
    GoogleVertexAIController,
  ],
  exports: [
    GoogleVertexAIService,
  ],
})
export class GoogleVertexAiModule {}