import { Test, TestingModule } from '@nestjs/testing';
import { AiChatMessageService } from './ai-chat-message.service';
import { AiChatSessionService } from './ai-chat-session.service';
import { NlpAnalyzerService } from './nlp-analyzer.service';
import { AiAvailabilityService } from './ai-availability.service';

describe('AiChatMessageService', () => {
  let service: AiChatMessageService;
  let chatSessionService: AiChatSessionService;
  let nlpAnalyzer: NlpAnalyzerService;
  let aiAvailability: AiAvailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiChatMessageService,
        {
          provide: AiChatSessionService,
          useValue: {
            getSessionContext: jest.fn(),
            addMessage: jest.fn(),
            updateContext: jest.fn(),
          },
        },
        {
          provide: NlpAnalyzerService,
          useValue: {
            analyzeQuery: jest.fn(),
          },
        },
        {
          provide: AiAvailabilityService,
          useValue: {
            checkAvailability: jest.fn(),
            bookSlot: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiChatMessageService>(AiChatMessageService);
    chatSessionService = module.get<AiChatSessionService>(AiChatSessionService);
    nlpAnalyzer = module.get<NlpAnalyzerService>(NlpAnalyzerService);
    aiAvailability = module.get<AiAvailabilityService>(AiAvailabilityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleMessage', () => {
    const mockContext = {
      userId: 'user-1',
      currentPage: '/dashboard'
    };

    const mockUserMessage = {
      id: 'msg-1',
      sessionId: 'session-1',
      userId: 'user-1',
      content: 'Hello',
      type: 'user' as const,
      timestamp: new Date()
    };

    beforeEach(() => {
      jest.spyOn(chatSessionService, 'getSessionContext').mockResolvedValue(mockContext);
      jest.spyOn(chatSessionService, 'addMessage').mockResolvedValue(mockUserMessage);
    });

    it('should handle availability check messages', async () => {
      const availabilityAnalysis = {
        action: 'check_availability',
        availabilityData: {
          date: '2025-10-04',
          time: '14:00'
        }
      };

      const mockSlots = [{
        id: 'slot-1',
        startTime: '2025-10-04T14:00:00Z',
        duration: 30,
        providerId: 'provider-1',
        status: 'available'
      }];

      jest.spyOn(nlpAnalyzer, 'analyzeQuery').mockResolvedValue(availabilityAnalysis);
      jest.spyOn(aiAvailability, 'checkAvailability').mockResolvedValue(mockSlots);

      const result = await service.handleMessage(
        'session-1',
        'check availability for October 4th at 2pm'
      );

      expect(result.type).toBe('assistant');
      expect(result.metadata?.action).toBe('check_availability');
      expect(result.metadata?.availabilityData).toEqual(mockSlots);
    });

    it('should handle booking request messages', async () => {
      const bookingAnalysis = {
        action: 'book_slot',
        bookingData: {
          date: '2025-10-04',
          time: '14:00'
        }
      };

      const mockBooking = {
        id: 'booking-1',
        startTime: '2025-10-04T14:00:00Z',
        duration: 30,
        providerId: 'provider-1',
        userId: 'user-1',
        status: 'booked'
      };

      jest.spyOn(nlpAnalyzer, 'analyzeQuery').mockResolvedValue(bookingAnalysis);
      jest.spyOn(aiAvailability, 'bookSlot').mockResolvedValue(mockBooking);

      const result = await service.handleMessage(
        'session-1',
        'book an appointment for October 4th at 2pm'
      );

      expect(result.type).toBe('assistant');
      expect(result.metadata?.action).toBe('book_slot');
      expect(result.metadata?.bookingData).toEqual(mockBooking);
    });

    it('should handle error gracefully', async () => {
      jest.spyOn(nlpAnalyzer, 'analyzeQuery').mockRejectedValue(new Error('Test error'));

      const result = await service.handleMessage(
        'session-1',
        'invalid message'
      );

      expect(result.type).toBe('assistant');
      expect(result.metadata?.action).toBe('error');
      expect(result.content).toContain('sorry');
    });
  });
});
