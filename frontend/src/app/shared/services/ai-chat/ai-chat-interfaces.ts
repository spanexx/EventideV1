import { AIConversationContext } from './ai-tool-definitions';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    toolCalls?: Array<{
      toolName: string;
      parameters: any;
      result: any;
    }>;
    context?: Partial<AIConversationContext>;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AIProcessingResult {
  response: string;
  toolCalls: Array<{
    toolName: string;
    parameters: any;
    result: any;
  }>;
  suggestedActions: string[];
}

export interface IntentDetectionResult {
  action: string | null;
  confidence: number;
  response: string;
}

export interface ExtractedEntities {
  dates?: any;
  times?: any;
  duration?: any;
  context?: any;
}