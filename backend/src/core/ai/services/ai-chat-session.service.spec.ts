import { Test, TestingModule } from '@nestjs/testing';
import { AiChatSessionService, ChatMessage, ChatSession } from './ai-chat-session.service';
import { SessionService, Session } from '../../sessions/session.service';

describe('AiChatSessionService', () => {
  let service: AiChatSessionService;
  let sessionService: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatSessionService,
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn<Promise<Session>, [string]>(),
            getSession: jest.fn<Promise<Session | null>, [string]>(),
            destroySession: jest.fn<Promise<boolean>, [string]>(),
          },
        },
      ],
    }).compile();

    service = module.get<AiChatSessionService>(AiChatSessionService);
    sessionService = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createChatSession', () => {
    it('should create a new chat session', async () => {
      const mockSession: Session = {
        id: 'test-id',
        userId: 'user-1',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      };
      jest.spyOn(sessionService, 'createSession').mockResolvedValue(mockSession);

      const result = await service.createChatSession('user-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('test-id');
      expect(result.userId).toBe('user-1');
      expect(result.messages).toEqual([]);
      expect(sessionService.createSession).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getChatSession', () => {
    it('should return an existing chat session', async () => {
      const mockSession: Session = {
        id: 'test-id',
        userId: 'user-1',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      };
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(mockSession);

      await service.createChatSession('user-1');
      const result = await service.getChatSession('test-id');

      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
      expect(sessionService.getSession).toHaveBeenCalledWith('test-id');
    });

    it('should return null for non-existent session', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(null);

      const result = await service.getChatSession('non-existent');

      expect(result).toBeNull();
      expect(sessionService.getSession).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('addMessage', () => {
    it('should add a message to the session', async () => {
      const mockSession: Session = {
        id: 'test-id',
        userId: 'user-1',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      };
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(mockSession);

      await service.createChatSession('user-1');
      
      const message = await service.addMessage('test-id', {
        userId: 'user-1',
        content: 'test message',
        type: 'user'
      });

      expect(message).toBeDefined();
      expect(message.content).toBe('test message');
      expect(message.type).toBe('user');
      
      const session = await service.getChatSession('test-id');
      expect(session?.messages).toHaveLength(1);
    });

    it('should throw error for non-existent session', async () => {
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(null);

      await expect(
        service.addMessage('non-existent', {
          userId: 'user-1',
          content: 'test',
          type: 'user'
        })
      ).rejects.toThrow();
    });
  });

  describe('updateContext', () => {
    it('should update session context', async () => {
      const mockSession: Session = {
        id: 'test-id',
        userId: 'user-1',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      };
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(mockSession);

      await service.createChatSession('user-1');
      
      await service.updateContext('test-id', {
        currentPage: '/dashboard',
        lastAction: 'test'
      });

      const session = await service.getChatSession('test-id');
      expect(session?.context.currentPage).toBe('/dashboard');
      expect(session?.context.lastAction).toBe('test');
    });
  });

  describe('getRecentMessages', () => {
    it('should return recent messages with limit', async () => {
      const mockSession: Session = {
        id: 'test-id',
        userId: 'user-1',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      };
      jest.spyOn(sessionService, 'getSession').mockResolvedValue(mockSession);

      await service.createChatSession('user-1');
      
      // Add multiple messages
      for (let i = 0; i < 5; i++) {
        await service.addMessage('test-id', {
          userId: 'user-1',
          content: `message ${i}`,
          type: 'user'
        });
      }

      const messages = await service.getRecentMessages('test-id', 3);
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('message 2');
    });
  });
});
