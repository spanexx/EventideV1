import { Test, TestingModule } from '@nestjs/testing';
import { NlpAnalyzerService } from './nlp-analyzer.service';
import { LlmService } from './llm.service';

describe('NlpAnalyzerService', () => {
  let service: NlpAnalyzerService;
  let llmService: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NlpAnalyzerService,
        {
          provide: LlmService,
          useValue: {
            understandQuery: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NlpAnalyzerService>(NlpAnalyzerService);
    llmService = module.get<LlmService>(LlmService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeQuery', () => {
    it('should use LLM for analysis when available', async () => {
      const mockLlmResult = {
        action: 'check_availability',
        availabilityData: {
          date: '2025-10-04',
          time: '14:00'
        }
      };

      jest.spyOn(llmService, 'understandQuery').mockResolvedValue(mockLlmResult);

      const result = await service.analyzeQuery(
        'check availability for October 4th at 2pm'
      );

      expect(result).toEqual(mockLlmResult);
      expect(llmService.understandQuery).toHaveBeenCalled();
    });

    it('should fall back to rule-based analysis on LLM error', async () => {
      jest.spyOn(llmService, 'understandQuery').mockRejectedValue(new Error('LLM failed'));

      const result = await service.analyzeQuery(
        'check availability for October 4th at 2pm'
      );

      expect(result.action).toBe('check_availability');
      expect(result.availabilityData).toBeDefined();
      expect(llmService.understandQuery).toHaveBeenCalled();
    });
  });

  describe('analyzeQueryRuleBased', () => {
    it('should handle availability check queries', async () => {
      const result = await service.analyzeQuery(
        'show me available slots for 10/04/2025 at 2:00 pm'
      );

      expect(result.action).toBe('check_availability');
      expect(result.availabilityData).toEqual({
        date: '10/04/2025',
        time: '2:00 pm',
        context: undefined
      });
    });

    it('should handle booking requests', async () => {
      const result = await service.analyzeQuery(
        'book an appointment for 10/04/2025 at 2:00 pm'
      );

      expect(result.action).toBe('book_slot');
      expect(result.bookingData).toEqual({
        date: '10/04/2025',
        time: '2:00 pm',
        context: undefined
      });
    });

    it('should suggest format for availability check without date/time', async () => {
      const result = await service.analyzeQuery('show me available slots');

      expect(result.action).toBe('suggest_availability');
      expect(result.message).toBeDefined();
    });

    it('should suggest format for booking without date/time', async () => {
      const result = await service.analyzeQuery('book an appointment');

      expect(result.action).toBe('suggest_booking');
      expect(result.message).toBeDefined();
    });
  });
});
