import { Injectable, Logger } from '@nestjs/common';
import { SessionService } from '../../sessions/session.service';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'assistant';
  metadata?: {
    action?: string;
    context?: any;
    availabilityData?: any;
    bookingData?: any;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context: {
    userId: string;
    currentPage?: string;
    lastAction?: string;
    lastTimestamp?: Date;
    preferences?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AiChatSessionService {
  private readonly logger = new Logger(AiChatSessionService.name);
  private readonly chatSessions = new Map<string, ChatSession>();

  constructor(private readonly sessionService: SessionService) {}

  async createChatSession(userId: string): Promise<ChatSession> {
    const session = await this.sessionService.createSession(userId);
    const chatSession: ChatSession = {
      id: session.id,
      userId,
      messages: [],
      context: { userId },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chatSessions.set(session.id, chatSession);
    this.logger.log(`Created chat session ${session.id} for user ${userId}`);
    return chatSession;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const session = this.chatSessions.get(sessionId);
    if (!session) {
      return null;
    }
    // Verify the base session is still valid
    const baseSession = await this.sessionService.getSession(sessionId);
    if (!baseSession) {
      this.chatSessions.delete(sessionId);
      return null;
    }
    return session;
  }

  async addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'sessionId' | 'timestamp'>): Promise<ChatMessage> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error(`Chat session ${sessionId} not found`);
    }

    const chatMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 15),
      sessionId,
      timestamp: new Date(),
      ...message
    };

    session.messages.push(chatMessage);
    session.updatedAt = new Date();
    this.chatSessions.set(sessionId, session);

    return chatMessage;
  }

  async updateContext(sessionId: string, context: Partial<ChatSession['context']>): Promise<void> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      throw new Error(`Chat session ${sessionId} not found`);
    }

    session.context = {
      ...session.context,
      ...context
    };
    session.updatedAt = new Date();
    this.chatSessions.set(sessionId, session);
  }

  async getSessionContext(sessionId: string): Promise<ChatSession['context'] | null> {
    const session = await this.getChatSession(sessionId);
    return session?.context || null;
  }

  async getRecentMessages(sessionId: string, limit: number = 10): Promise<ChatMessage[]> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      return [];
    }
    return session.messages.slice(-limit);
  }

  async destroyChatSession(sessionId: string): Promise<boolean> {
    const session = await this.getChatSession(sessionId);
    if (!session) {
      return false;
    }
    this.chatSessions.delete(sessionId);
    await this.sessionService.destroySession(sessionId);
    return true;
  }
}
