import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AiChatService } from '../services/ai-chat.service';
import { AiChatMessageService } from '../services/ai-chat-message.service';
import { AiChatSessionService } from '../services/ai-chat-session.service';
import { ProcessChatRequestDto, ChatResponseDto } from '../dto/ai-chat.dto';

@ApiTags('ai-chat')
@Controller('ai/chat')
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name);

  constructor(
    private readonly aiChatService: AiChatService,
    private readonly chatMessageService: AiChatMessageService,
    private readonly chatSessionService: AiChatSessionService
  ) {}

  /**
   * Process natural language chat message and execute appropriate actions
   */
  @Post('process')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process AI chat message with tool execution',
    description: 'Processes natural language input and executes appropriate CRUD operations on availability data'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat message processed successfully with tool execution results',
    type: ChatResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid request format or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid' })
  @ApiResponse({ status: 500, description: 'Internal server error during processing' })
  @ApiBody({ type: ProcessChatRequestDto })
  async processMessage(
    @Body() request: ProcessChatRequestDto,
  ): Promise<ChatResponseDto> {
    this.logger.log(`Processing AI chat message: ${request.message.substring(0, 100)}...`);
    
    try {
      const result = await this.aiChatService.processMessage(request);
      
      this.logger.log(`AI chat processing completed with ${result.toolCalls?.length || 0} tool calls`);
      
      return result;
    } catch (error) {
      this.logger.error(`AI chat processing failed: ${error.message}`, error.stack);
      
      // Return graceful error response
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your message.',
        toolCalls: [],
        suggestedActions: [
          'Try rephrasing your request',
          'Use more specific date and time information',
          'Break complex requests into smaller parts'
        ],
        conversationId: request.conversationId || '',
        timestamp: new Date()
      };
    }
  }

  /**
   * Get available AI tools and their descriptions
   */
  @Post('tools')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get available AI tools',
    description: 'Returns list of available AI tools that can be called via natural language'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Available tools retrieved successfully'
  })
  async getAvailableTools(): Promise<{
    tools: Array<{
      name: string;
      description: string;
      parameters: any;
      examples: string[];
    }>;
  }> {
    this.logger.log('Retrieving available AI tools');
    
    const tools = await this.aiChatService.getAvailableTools();
    
    return { tools };
  }

  /**
   * Validate tool parameters before execution
   */
  @Post('validate-tool')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate tool parameters',
    description: 'Validates parameters for a specific tool before execution'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tool parameters validated successfully'
  })
  async validateTool(
    @Body() request: { toolName: string; parameters: any },
  ): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
    this.logger.log(`Validating tool parameters for: ${request.toolName}`);
    
    const validation = await this.aiChatService.validateToolParameters(
      request.toolName,
      request.parameters
    );
    
    return validation;
  }

  /**
   * Create a new chat session
   */
  @Post('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create new chat session',
    description: 'Creates a new chat session for the authenticated user'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Chat session created successfully'
  })
  async createSession(
    @Request() req: any
  ) {
    this.logger.log(`Creating chat session for user: ${req.user.id}`);
    return this.chatSessionService.createChatSession(req.user.id);
  }

  /**
   * Get chat session details
   */
  @Get('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get chat session details',
    description: 'Retrieves details of a specific chat session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat session retrieved successfully'
  })
  async getSession(
    @Param('sessionId') sessionId: string
  ) {
    return this.chatSessionService.getChatSession(sessionId);
  }

  /**
   * Get recent messages from a chat session
   */
  @Get('sessions/:sessionId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get chat messages',
    description: 'Retrieves recent messages from a chat session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat messages retrieved successfully'
  })
  async getMessages(
    @Param('sessionId') sessionId: string,
    @Query('limit') limit?: number
  ) {
    return this.chatSessionService.getRecentMessages(sessionId, limit);
  }

  /**
   * Update chat session context
   */
  @Post('sessions/:sessionId/context')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update chat context',
    description: 'Updates the context for a specific chat session'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Chat context updated successfully'
  })
  async updateContext(
    @Param('sessionId') sessionId: string,
    @Body() context: any
  ) {
    return this.chatSessionService.updateContext(sessionId, context);
  }
}