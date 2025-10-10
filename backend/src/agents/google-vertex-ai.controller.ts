import { Controller, Post, Get, Body, UseGuards, Logger } from '@nestjs/common';
import { GoogleVertexAIService } from './google-vertex-ai.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/modules/users/user.schema';

@Controller('agents/google-vertex')
export class GoogleVertexAIController {
  private readonly logger = new Logger(GoogleVertexAIController.name);

  constructor(private readonly googleVertexAIService: GoogleVertexAIService) {}

  @Post('generate-content')
  @UseGuards(JwtAuthGuard)
  async generateContent(
    @Body() body: { prompt: string; options?: any },
    @CurrentUser() user: User,
  ) {
    this.logger.log(`User ${user.email} requested content generation`);
    
    try {
      const { prompt, options } = body;
      const result = await this.googleVertexAIService.generateContent(prompt, options);
      return result;
    } catch (error) {
      // Handle billing-related errors with clear guidance
      if (error.message && error.message.includes('billing')) {
        return {
          success: false,
          error: 'BILLING_REQUIRED',
          message: 'Google Cloud billing is not enabled for this project. ' +
                   'Please enable billing at https://console.cloud.google.com/billing/enable?project=eventide-474521 ' +
                   'and wait a few minutes for the changes to propagate.',
          details: error.message
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  @Post('chat-completion')
  @UseGuards(JwtAuthGuard)
  async generateChatCompletion(
    @Body() body: { history: Array<{ role: string; content: string }>; message: string; options?: any },
    @CurrentUser() user: User,
  ) {
    this.logger.log(`User ${user.email} requested chat completion with history`);
    
    try {
      const { history, message, options } = body;
      const result = await this.googleVertexAIService.generateChatCompletion(history || [], message, options);
      return result;
    } catch (error) {
      // Handle billing-related errors with clear guidance
      if (error.message && error.message.includes('billing')) {
        return {
          success: false,
          error: 'BILLING_REQUIRED',
          message: 'Google Cloud billing is not enabled for this project. ' +
                   'Please enable billing at https://console.cloud.google.com/billing/enable?project=eventide-474521 ' +
                   'and wait a few minutes for the changes to propagate.',
          details: error.message
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  @Post('function-call')
  @UseGuards(JwtAuthGuard)
  async generateFunctionCall(
    @Body() body: { 
      prompt: string; 
      functions: Array<{
        name: string;
        description: string;
        parameters: object;
      }>;
      options?: any;
    },
    @CurrentUser() user: User,
  ) {
    this.logger.log(`User ${user.email} requested function call`);
    
    try {
      const { prompt, functions, options } = body;
      const result = await this.googleVertexAIService.generateFunctionCall(prompt, functions, options);
      return result;
    } catch (error) {
      // Handle billing-related errors with clear guidance
      if (error.message && error.message.includes('billing')) {
        return {
          success: false,
          error: 'BILLING_REQUIRED',
          message: 'Google Cloud billing is not enabled for this project. ' +
                   'Please enable billing at https://console.cloud.google.com/billing/enable?project=eventide-474521 ' +
                   'and wait a few minutes for the changes to propagate.',
          details: error.message
        };
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  @Get('models')
  @UseGuards(JwtAuthGuard)
  async listModels(@CurrentUser() user: User) {
    this.logger.log(`User ${user.email} requested list of models`);
    
    return await this.googleVertexAIService.listModels();
  }
}