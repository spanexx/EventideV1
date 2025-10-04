import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AIChatResponseGenerationService {

  generateContextualSuggestions(message: string): string[] {
    // Generate intelligent suggestions based on message content
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Time-based suggestions
    if (/\b(today|now|right now)\b/.test(lowerMessage)) {
      suggestions.push('Show my availability for today');
      suggestions.push('Create a slot for today');
    } else if (/\b(tomorrow)\b/.test(lowerMessage)) {
      suggestions.push('Show my availability for tomorrow');
      suggestions.push('Create availability for tomorrow');
    } else if (/\b(week|weekly)\b/.test(lowerMessage)) {
      suggestions.push('Show my availability for this week');
      suggestions.push('Create weekly recurring slots');
      suggestions.push('Analyze this week\'s schedule patterns');
    }
    
    // Action-based suggestions
    if (/\b(help|what|how)\b/.test(lowerMessage)) {
      suggestions.push('Show all my availability');
      suggestions.push('Create a new availability slot');
      suggestions.push('Delete old or unused slots');
      suggestions.push('Update existing availability');
    }
    
    // Default suggestions if none match
    if (suggestions.length === 0) {
      suggestions.push(
        'Show my availability for today',
        'Create a new availability slot', 
        'Delete unbooked slots this week',
        'Analyze my schedule patterns',
        'Optimize my schedule for next week'
      );
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  generateHelpfulResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Generate contextual help based on what the user might be trying to do
    if (/\b(help|confused|don't understand|what)\b/.test(lowerMessage)) {
      return 'I can help you manage your availability using natural language! Try asking me to "show my availability this week" or "create a slot for tomorrow at 2 PM".';
    }
    
    if (/\b(not working|broken|error)\b/.test(lowerMessage)) {
      return 'I\'m sorry you\'re having trouble. Let me help you with your availability management. You can ask me in plain English like "show me my free time today" or "book me for Friday afternoon".';
    }
    
    if (/\b(time|schedule|calendar|available|free|busy)\b/.test(lowerMessage)) {
      return 'I understand you\'re asking about time management. I can help you view, create, update, or delete availability slots using natural language commands.';
    }
    
    return 'I\'m here to help you manage your availability using natural language. You can ask me to show, create, update, or delete availability slots. Just tell me what you need in your own words!';
  }

  generateErrorResponse(error: any, intent?: any): string {
    const baseResponse = intent?.response || 'I encountered an issue while processing your request';
    return `${baseResponse}. However, I encountered an error: ${error.message}. Please try rephrasing your request or contact support if the issue persists.`;
  }

  generateNoIntentResponse(): string {
    return 'I\'m not quite sure what you\'d like me to do. Could you please rephrase your request? For example, you can say "show my availability today" or "create a slot for tomorrow at 2 PM".';
  }

  generateSuccessResponse(action: string, result: any): string {
    const successTemplates: Record<string, string> = {
      get_availability_data: 'Here\'s your availability information:',
      create_availability_slot: 'I\'ve successfully created your availability slot.',
      delete_availability_slot: 'I\'ve successfully deleted the availability slot(s).',
      update_availability_slot: 'I\'ve successfully updated your availability slot.',
      create_bulk_availability: 'I\'ve successfully created multiple availability slots.'
    };
    
    return successTemplates[action] || 'Operation completed successfully.';
  }

  generateConfirmationQuestion(action: string, parameters: any): string {
    const confirmationTemplates: Record<string, (params: any) => string> = {
      delete_availability_slot: (params) => {
        const timeRef = params.startTime ? `at ${params.startTime}` : '';
        const dateRef = params.startDate ? `on ${params.startDate}` : '';
        return `Are you sure you want to delete the availability slot ${timeRef} ${dateRef}?`;
      },
      create_availability_slot: (params) => {
        const timeRef = params.startTime ? `from ${params.startTime}` : '';
        const endTimeRef = params.endTime ? ` to ${params.endTime}` : '';
        const dateRef = params.startDate ? ` on ${params.startDate}` : '';
        return `Should I create an availability slot${timeRef}${endTimeRef}${dateRef}?`;
      },
      update_availability_slot: (params) => {
        return `Should I proceed with updating your availability slot with the new settings?`;
      }
    };
    
    const generator = confirmationTemplates[action];
    return generator ? generator(parameters) : `Should I proceed with this ${action}?`;
  }

  generateProgressUpdate(action: string, step: string): string {
    return `${this.getActionDescription(action)}: ${step}...`;
  }

  private getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      get_availability_data: 'Retrieving availability data',
      create_availability_slot: 'Creating availability slot',
      delete_availability_slot: 'Deleting availability slot',
      update_availability_slot: 'Updating availability slot',
      create_bulk_availability: 'Creating multiple availability slots'
    };
    
    return descriptions[action] || 'Processing request';
  }

  formatEntitySummary(entities: any): string {
    const parts: string[] = [];
    
    if (entities.dates?.startDate) {
      parts.push(`Date: ${entities.dates.startDate}`);
    }
    
    if (entities.times?.times?.length > 0) {
      parts.push(`Time: ${entities.times.times.join(' - ')}`);
    }
    
    if (entities.duration?.duration) {
      parts.push(`Duration: ${entities.duration.duration} minutes`);
    }
    
    if (entities.context?.status) {
      parts.push(`Status: ${entities.context.status}`);
    }
    
    return parts.length > 0 ? `Extracted details: ${parts.join(', ')}` : '';
  }

  formatResultMetrics(result: any): string {
    if (!result || typeof result !== 'object') {
      return '';
    }
    
    const metrics: string[] = [];
    
    if (result.totalSlots !== undefined) {
      metrics.push(`Total slots: ${result.totalSlots}`);
    }
    
    if (result.availableSlots !== undefined) {
      metrics.push(`Available: ${result.availableSlots}`);
    }
    
    if (result.bookedSlots !== undefined) {
      metrics.push(`Booked: ${result.bookedSlots}`);
    }
    
    if (result.nextAvailable) {
      metrics.push(`Next available: ${result.nextAvailable}`);
    }
    
    return metrics.length > 0 ? `📊 ${metrics.join(' • ')}` : '';
  }
}