import { Controller, Post, Get, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AssistantAgentService, ChatMessage, RAGOptions } from './assistant-agent.service';

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  options?: {
    temperature?: number;
    maxTokens?: number;
  };
}

@Controller('agents/assistant')
export class AssistantAgentController {
  private readonly logger = new Logger(AssistantAgentController.name);

  constructor(private readonly assistantAgentService: AssistantAgentService) {}

  @Post('chat')
  async chat(
    @Body() body: ChatRequest,
  ) {
    this.logger.log(`Assistant chat requested (public)`);

    try {
      const { message, conversationHistory = [], options = {} } = body;

      // Format the conversation history for the AI
      // Ensure roles are properly formatted as 'user' or 'assistant'
      const formattedHistory: ChatMessage[] = conversationHistory.map(msg => {
        // Ensure the role is one of the valid types
        let validRole: 'user' | 'assistant' | 'system' = 'user';
        if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
          validRole = msg.role;
        }
        
        return {
          role: validRole,
          content: msg.content,
        };
      });

      // Add the current message to the conversation
      formattedHistory.push({ role: 'user', content: message });

      // Enable RAG by default for better responses
      const ragOptions: RAGOptions = {
        enableRAG: true,
        minSimilarity: 0.5,
      };

      const result = await this.assistantAgentService.generateResponse(
        formattedHistory,
        options,
        ragOptions // Enable RAG for better context-aware responses
      );

      return {
        success: true,
        response: result.content,
        model: result.model,
        routeRecommendations: result.routeRecommendations, // Include route recommendations in the response
      };
    } catch (error) {
      this.logger.error(`Error in assistant chat (public)`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error processing your request with the AI assistant',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-content')
  async generateContent(
    @Body() body: { prompt: string; systemPrompt?: string },
  ) {
    this.logger.log(`Content generation requested (public)`);

    try {
      const { prompt, systemPrompt } = body;

      // Enable RAG by default for better responses
      const ragOptions: RAGOptions = {
        enableRAG: true,
        minSimilarity: 0.5,
      };

      const result = await this.assistantAgentService.generateContent(prompt, systemPrompt, ragOptions);

      return {
        success: true,
        content: result.content,
        model: result.model,
        routeRecommendations: result.routeRecommendations, // Include route recommendations in the response
      };
    } catch (error) {
      this.logger.error(`Error in content generation (public)`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error generating content with the AI assistant',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('chat-rag') // New endpoint for RAG-enabled chat
  async chatWithRAG(
    @Body() body: ChatRequest & { ragOptions?: RAGOptions },
  ) {
    this.logger.log(`RAG-enhanced assistant chat requested (public)`);

    try {
      const { message, conversationHistory = [], options = {}, ragOptions } = body;

      // Format the conversation history for the AI
      const formattedHistory: ChatMessage[] = conversationHistory.map(msg => {
        let validRole: 'user' | 'assistant' | 'system' = 'user';
        if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
          validRole = msg.role;
        }
        
        return {
          role: validRole,
          content: msg.content,
        };
      });

      // Add the current message to the conversation
      formattedHistory.push({ role: 'user', content: message });

      const result = await this.assistantAgentService.generateResponse(
        formattedHistory,
        options,
        ragOptions // Pass RAG options
      );

      console.log('[AssistantAgentController] Sending response to frontend:', {
        response: result.content.substring(0, 100) + '...',
        routeRecommendations: result.routeRecommendations,
        sources: result.sources ? result.sources.length : 0
      });

      return {
        success: true,
        response: result.content,
        model: result.model,
        sources: result.sources, // Include sources if available
        routeRecommendations: result.routeRecommendations, // Include route recommendations in the response
      };
    } catch (error) {
      this.logger.error(`Error in RAG-enhanced assistant chat (public)`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Error processing your request with the AI assistant',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async health() {
    this.logger.log('Health check requested for assistant agent');
    
    const result = await this.assistantAgentService.healthCheck();
    return result;
  }
}