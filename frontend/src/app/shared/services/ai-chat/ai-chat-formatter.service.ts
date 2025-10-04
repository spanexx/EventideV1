import { Injectable } from '@angular/core';
import { AIProcessingResult, IntentDetectionResult, ExtractedEntities } from './ai-chat-interfaces';

@Injectable({
  providedIn: 'root'
})
export class AIChatFormatterService {

  constructor() {}

  enhanceResponseWithToolResults(
    baseResponse: string,
    toolCallResults: Array<{ toolName: string; parameters: any; result: any }>
  ): string {
    if (toolCallResults.length === 0) {
      return baseResponse;
    }

    console.log('[AIChatFormatterService] Enhancing response with tool results...');
    
    let enhancedResponse = baseResponse;
    const successfulResults = toolCallResults.filter(tc => tc.result.success);
    const failedResults = toolCallResults.filter(tc => !tc.result.success);
    
    if (successfulResults.length > 0) {
      enhancedResponse += '\n\nResults:';
      successfulResults.forEach(tc => {
        if (tc.result.success && 'data' in tc.result && tc.result.data) {
          enhancedResponse += `\n\n📊 **${tc.toolName} completed:**`;
          enhancedResponse += this.formatToolSpecificData(tc.toolName, tc.result.data);
        } else {
          enhancedResponse += `\n\n✅ ${tc.result.message}`;
        }
      });
    }
    
    if (failedResults.length > 0) {
      enhancedResponse += '\n\nIssues:';
      failedResults.forEach(tc => {
        enhancedResponse += `\n❌ ${tc.result.message}`;
      });
    }

    return enhancedResponse;
  }

  private formatToolSpecificData(toolName: string, data: any): string {
    let formattedData = '';

    switch (toolName) {
      case 'get_availability_data':
        if (data.slots) {
          const { slots, summary } = data;
          formattedData += `\n• Found ${slots.length} availability slots`;
          if (summary) {
            formattedData += `\n• Available: ${summary.available}, Booked: ${summary.booked}, Total: ${summary.total}`;
          }
          if (slots.length > 0) {
            const availableSlots = slots.filter((s: any) => !s.isBooked);
            if (availableSlots.length > 0) {
              const nextAvailable = availableSlots[0];
              formattedData += `\n• Next available: ${new Date(nextAvailable.startTime).toLocaleString()}`;
            } else {
              formattedData += `\n• No available slots in this time period`;
            }
          }
        }
        break;
      
      case 'create_availability_slot':
      case 'update_availability_slot':
      case 'delete_availability_slot':
        // Generic handling for CRUD operations
        formattedData += `\n• Operation completed successfully`;
        break;
      
      default:
        formattedData += `\n• ${toolName} completed`;
        break;
    }

    return formattedData;
  }

  formatLocalProcessingResult(
    intent: IntentDetectionResult,
    result: any,
    parameters: any
  ): AIProcessingResult {
    let enhancedResponse = intent.response;
    
    if (result.success && 'data' in result && result.data) {
      enhancedResponse += '\n\nResults:';
      enhancedResponse += `\n\n📊 **${intent.action} completed:**`;
      enhancedResponse += this.formatToolSpecificData(intent.action!, result.data);
    } else if (result.success) {
      enhancedResponse += `\n\n✅ ${result.message}`;
    }
    
    return {
      response: result.success ? enhancedResponse : `${intent.response} However, ${result.message}`,
      toolCalls: [{
        toolName: intent.action!,
        parameters,
        result
      }],
      suggestedActions: []
    };
  }

  getSuggestedActionsForTool(toolName: string): string[] {
    const suggestions: Record<string, string[]> = {
      create_availability_slot: [
        'Create a 1-hour slot tomorrow at 2 PM',
        'Add availability for Monday 9 AM to 5 PM',
        'Create slot for 2024-01-15 from 10:00 to 11:00'
      ],
      delete_availability_slot: [
        'Delete the slot at 2 PM today',
        'Remove all unbooked slots this week',
        'Cancel my availability for tomorrow'
      ],
      get_availability_data: [
        'Show my schedule for this week',
        'List all available slots for tomorrow',
        'Display booked appointments for today'
      ]
    };
    
    return suggestions[toolName] || [];
  }
}