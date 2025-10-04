import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsObject, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatToolDefinitionDto {
  @ApiProperty({ description: 'Tool name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tool description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Tool parameters schema' })
  @IsObject()
  parameters: any;
}

export class ConversationContextDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Current page/route' })
  @IsString()
  currentPage: string;

  @ApiProperty({ description: 'Current date context' })
  @IsDate()
  @Type(() => Date)
  currentDate: Date;

  @ApiProperty({ description: 'Recent actions taken', required: false })
  @IsArray()
  @IsOptional()
  recentActions?: string[];
}

export class ChatMessageDto {
  @ApiProperty({ description: 'Message ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Message role', enum: ['user', 'assistant'] })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Message timestamp' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}

export class ProcessChatRequestDto {
  @ApiProperty({ description: 'User message to process' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Conversation context' })
  @IsObject()
  context: ConversationContextDto;

  @ApiProperty({ description: 'Available tools', type: [ChatToolDefinitionDto] })
  @IsArray()
  tools: ChatToolDefinitionDto[];

  @ApiProperty({ description: 'Recent conversation history', type: [ChatMessageDto], required: false })
  @IsArray()
  @IsOptional()
  conversationHistory?: ChatMessageDto[];

  @ApiProperty({ description: 'Conversation ID', required: false })
  @IsString()
  @IsOptional()
  conversationId?: string;
}

export class ToolCallDto {
  @ApiProperty({ description: 'Tool name to execute' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tool parameters' })
  @IsObject()
  parameters: any;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'AI response text' })
  @IsString()
  response: string;

  @ApiProperty({ description: 'Tool calls to execute', type: [ToolCallDto] })
  @IsArray()
  toolCalls: ToolCallDto[];

  @ApiProperty({ description: 'Suggested follow-up actions' })
  @IsArray()
  suggestedActions: string[];

  @ApiProperty({ description: 'Conversation ID' })
  @IsString()
  conversationId: string;

  @ApiProperty({ description: 'Response timestamp' })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}

export class ToolValidationRequestDto {
  @ApiProperty({ description: 'Tool name to validate' })
  @IsString()
  toolName: string;

  @ApiProperty({ description: 'Parameters to validate' })
  @IsObject()
  parameters: any;
}

export class ToolValidationResponseDto {
  @ApiProperty({ description: 'Whether parameters are valid' })
  isValid: boolean;

  @ApiProperty({ description: 'Validation errors' })
  @IsArray()
  errors: string[];

  @ApiProperty({ description: 'Parameter suggestions' })
  @IsArray()
  suggestions: string[];
}