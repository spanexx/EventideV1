import { Injectable, Logger } from '@nestjs/common';
import { AiChatSessionService, ChatMessage } from './ai-chat-session.service';
import { NlpAnalyzerService } from './nlp-analyzer.service';
import { AiAvailabilityService } from './ai-availability.service';

interface AnalysisResult {
  action: string;
  message?: string;
  availabilityData?: any;
  bookingData?: any;
  productData?: any;
  deleteData?: any;
  getidData?: any;
  query?: string;
}

@Injectable()
export class AiChatMessageService {
  private readonly logger = new Logger(AiChatMessageService.name);

  constructor(
    private readonly chatSessionService: AiChatSessionService,
    private readonly nlpAnalyzer: NlpAnalyzerService,
    private readonly aiAvailability: AiAvailabilityService
  ) {}



  async handleMessage(sessionId: string, message: string): Promise<ChatMessage> {
    // Get session context
    const context = await this.chatSessionService.getSessionContext(sessionId);
    if (!context) {
      throw new Error(`No context found for session ${sessionId}`);
    }

    // Add user message to session
    const userMessage = await this.chatSessionService.addMessage(sessionId, {
      userId: context.userId,
      content: message,
      type: 'user'
    });

    try {
      // Analyze the message
      const analysis = await this.nlpAnalyzer.analyzeQuery(message, context);
      
      let responseContent = '';
      let metadata = {};

      switch (analysis.action) {
        case 'check_availability': {
          const availableSlots = await this.aiAvailability.checkAvailability(
            analysis.availabilityData.date,
            analysis.availabilityData.time,
            context
          );
          responseContent = this.formatAvailabilityResponse(availableSlots);
          metadata = { 
            action: 'check_availability',
            availabilityData: availableSlots
          };
          break;
        }
        case 'book_slot': {
          const booking = await this.aiAvailability.bookSlot(
            analysis.bookingData.date,
            analysis.bookingData.time,
            context
          );
          responseContent = this.formatBookingResponse(booking);
          metadata = {
            action: 'book_slot',
            bookingData: booking
          };
          break;
        }
        case 'suggest_availability':
        case 'suggest_booking':
          responseContent = typeof analysis === 'object' && 'message' in analysis && analysis.message
            ? analysis.message
            : 'Could you provide more details about when you\'d like to book?';
          metadata = { action: analysis.action };
          break;
        default:
          responseContent = "I'm sorry, I didn't understand that request. Could you please rephrase it?";
          metadata = { action: 'unknown' };
      }

      // Add AI response to session
      const assistantMessage = await this.chatSessionService.addMessage(sessionId, {
        userId: context.userId,
        content: responseContent,
        type: 'assistant',
        metadata
      });

      // Update session context
      await this.chatSessionService.updateContext(sessionId, {
        lastAction: analysis.action,
        lastTimestamp: new Date()
      });

      return assistantMessage;

    } catch (error) {
      this.logger.error(`Error processing message: ${error.message}`, error.stack);
      
      // Add error response to session
      return await this.chatSessionService.addMessage(sessionId, {
        userId: context.userId,
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        type: 'assistant',
        metadata: { action: 'error', context: { error: error.message } }
      });
    }
  }

  private formatAvailabilityResponse(slots: any[]): string {
    if (!slots || slots.length === 0) {
      return "I'm sorry, I couldn't find any available slots for that time.";
    }

    const slotList = slots
      .slice(0, 5)
      .map(slot => `- ${new Date(slot.startTime).toLocaleTimeString()} (${slot.duration} minutes)`)
      .join('\n');

    return `I found ${slots.length} available slots. Here are the first 5:\n${slotList}${
      slots.length > 5 ? '\n\nThere are more slots available. Would you like to see them?' : ''
    }`;
  }

  private formatBookingResponse(booking: any): string {
    if (!booking || booking.error) {
      return `I'm sorry, I couldn't book that slot. ${booking?.error || 'Please try a different time.'}`;
    }

    return `Great! I've booked your appointment for ${new Date(booking.startTime).toLocaleString()}. 
The duration is ${booking.duration} minutes. Your booking reference is ${booking.id}.`;
  }
}
