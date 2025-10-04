import { Injectable } from '@angular/core';
import { AIProcessingResult } from './ai-chat-interfaces';

@Injectable({
  providedIn: 'root'
})
export class AIChatConversationalService {

  async processConversationally(message: string): Promise<AIProcessingResult & { needsClarification?: boolean }> {
    const lowerMessage = message.toLowerCase();
    const today = new Date();
    
    // Analyze message for ambiguities and need for clarification
    const ambiguities = this.detectAmbiguities(message);
    
    if (ambiguities.length > 0) {
      return {
        response: this.generateClarificationQuestion(message, ambiguities),
        toolCalls: [],
        suggestedActions: this.generateClarificationSuggestions(ambiguities),
        needsClarification: true
      };
    }
    
    // Check for incomplete requests that need more information
    const missingInfo = this.detectMissingInformation(message);
    
    if (missingInfo.length > 0) {
      return {
        response: this.generateFollowUpQuestion(message, missingInfo),
        toolCalls: [],
        suggestedActions: this.generateFollowUpSuggestions(message, missingInfo),
        needsClarification: true
      };
    }
    
    // Check for tool availability issues
    const toolIssues = this.detectToolAvailabilityIssues(message);
    
    if (toolIssues.length > 0) {
      return {
        response: this.generateAlternativeSuggestion(message, toolIssues),
        toolCalls: [],
        suggestedActions: this.generateAlternativeActions(toolIssues),
        needsClarification: true
      };
    }
    
    return { response: '', toolCalls: [], suggestedActions: [], needsClarification: false };
  }

  private detectAmbiguities(message: string): Array<{ type: string; details: string; options: string[] }> {
    const ambiguities: Array<{ type: string; details: string; options: string[] }> = [];
    const today = new Date();
    const lowerMessage = message.toLowerCase();
    
    // Date ambiguities
    if (/\b(friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/i.test(message)) {
      const dayMatch = message.match(/\b(friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/i);
      if (dayMatch) {
        const dayName = dayMatch[1].toLowerCase();
        const nextOccurrence = this.getNextDayOccurrence(dayName);
        const lastOccurrence = this.getLastDayOccurrence(dayName);
        
        // Only ambiguous if no clear temporal modifier
        if (!/\b(this|next|last|coming|past)\b/i.test(message)) {
          ambiguities.push({
            type: 'date_ambiguity',
            details: `Which ${dayName} do you mean?`,
            options: [
              `This ${dayName} (${this.formatDate(nextOccurrence)})`,
              `Last ${dayName} (${this.formatDate(lastOccurrence)})`
            ]
          });
        }
      }
    }
    
    // "This week" vs "Next week" ambiguity
    if (/\bweek\b/i.test(message) && !/\b(this|next|last)\s+week\b/i.test(message)) {
      const thisWeekStart = this.getStartOfWeek(today);
      const nextWeekStart = new Date(thisWeekStart);
      nextWeekStart.setDate(thisWeekStart.getDate() + 7);
      
      ambiguities.push({
        type: 'week_ambiguity',
        details: 'Which week are you referring to?',
        options: [
          `This week (${this.formatDate(thisWeekStart)} - ${this.formatDate(new Date(thisWeekStart.getTime() + 6*24*60*60*1000))})`,
          `Next week (${this.formatDate(nextWeekStart)} - ${this.formatDate(new Date(nextWeekStart.getTime() + 6*24*60*60*1000))})`
        ]
      });
    }
    
    // Time ambiguity (AM/PM)
    if (/\b(\d{1,2})\s*(?:o'clock|pm|am)?\b/i.test(message)) {
      const timeMatch = message.match(/\b(\d{1,2})\s*(?:o'clock)?\b/i);
      if (timeMatch && !/\b(am|pm)\b/i.test(message)) {
        const hour = parseInt(timeMatch[1]);
        if (hour >= 1 && hour <= 12) {
          ambiguities.push({
            type: 'time_ambiguity',
            details: `Do you mean ${hour}:00 AM or PM?`,
            options: [
              `${hour}:00 AM`,
              `${hour}:00 PM`
            ]
          });
        }
      }
    }
    
    return ambiguities;
  }

  private detectMissingInformation(message: string): Array<{ type: string; needed: string }> {
    const missing: Array<{ type: string; needed: string }> = [];
    const lowerMessage = message.toLowerCase();
    
    // Creating slots without time information
    if (/\b(create|add|make|new|book|schedule)\b/i.test(message) && /\b(slot|availability|appointment)\b/i.test(message)) {
      if (!/\b(at|from|\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)|morning|afternoon|evening)\b/i.test(message)) {
        missing.push({
          type: 'time_needed',
          needed: 'What time would you like to create the availability slot?'
        });
      }
    }
    
    // Deleting/updating without specifying which slots
    if (/\b(delete|remove|update|modify|change)\b/i.test(message) && /\b(slot|availability)\b/i.test(message)) {
      if (!/\b(all|today|tomorrow|this week|next week|\d{1,2}:\d{2}|morning|afternoon|evening)\b/i.test(message)) {
        missing.push({
          type: 'specification_needed',
          needed: 'Which specific slots would you like to modify? Please specify a time, date, or use "all".'
        });
      }
    }
    
    // Vague time references
    if (/\b(later|soon|sometime|eventually)\b/i.test(message)) {
      missing.push({
        type: 'specific_time_needed',
        needed: 'Could you be more specific about the timing? For example, "tomorrow at 2 PM" or "next week".'
      });
    }
    
    return missing;
  }

  private detectToolAvailabilityIssues(message: string): Array<{ requested: string; alternative: string }> {
    const issues: Array<{ requested: string; alternative: string }> = [];
    const lowerMessage = message.toLowerCase();
    
    // Tools that don't exist but users might expect
    if (/\b(analyze|analysis|insights|patterns|trends|metrics|statistics|stats|report)\b/i.test(message)) {
      issues.push({
        requested: 'schedule analysis',
        alternative: 'I can show you your availability data with basic metrics. Would you like me to retrieve your current schedule?'
      });
    }
    
    if (/\b(optimize|improve|better|suggestions|recommendations)\b/i.test(message)) {
      issues.push({
        requested: 'schedule optimization',
        alternative: 'I can help you view your current availability and suggest manual improvements. Would you like to see your schedule first?'
      });
    }
    
    if (/\b(export|download|save|backup)\b/i.test(message)) {
      issues.push({
        requested: 'data export',
        alternative: 'I can display your availability data for you to copy. Would you like me to show your current schedule?'
      });
    }
    
    return issues;
  }

  private generateClarificationQuestion(message: string, ambiguities: Array<{ type: string; details: string; options: string[] }>): string {
    const primaryAmbiguity = ambiguities[0];
    
    const responses = {
      date_ambiguity: `I understand you're asking about ${message}, but ${primaryAmbiguity.details}`,
      week_ambiguity: `I see you mentioned "week" - ${primaryAmbiguity.details}`,
      time_ambiguity: `I noticed you mentioned a time - ${primaryAmbiguity.details}`
    };
    
    const baseResponse = responses[primaryAmbiguity.type as keyof typeof responses] || `I need clarification: ${primaryAmbiguity.details}`;
    
    return `${baseResponse}\n\nPlease choose:`;
  }

  private generateFollowUpQuestion(message: string, missingInfo: Array<{ type: string; needed: string }>): string {
    const primaryMissing = missingInfo[0];
    
    const intents = {
      time_needed: "I'd be happy to create that availability slot for you!",
      specification_needed: "I can help you with that modification.",
      specific_time_needed: "I understand what you want to do."
    };
    
    const intent = intents[primaryMissing.type as keyof typeof intents] || "I can help you with that.";
    
    return `${intent} ${primaryMissing.needed}`;
  }

  private generateAlternativeSuggestion(message: string, toolIssues: Array<{ requested: string; alternative: string }>): string {
    const primaryIssue = toolIssues[0];
    
    return `I understand you're looking for ${primaryIssue.requested}, but I don't have that specific capability yet. However, ${primaryIssue.alternative}`;
  }

  private generateClarificationSuggestions(ambiguities: Array<{ type: string; details: string; options: string[] }>): string[] {
    const primaryAmbiguity = ambiguities[0];
    return primaryAmbiguity.options;
  }

  private generateFollowUpSuggestions(message: string, missingInfo: Array<{ type: string; needed: string }>): string[] {
    const suggestions: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    if (missingInfo.some(info => info.type === 'time_needed')) {
      suggestions.push(
        'Create slot for tomorrow at 2 PM',
        'Create slot for today at 3 PM',
        'Create slot for Friday morning',
        'Create slot for next week'
      );
    }
    
    if (missingInfo.some(info => info.type === 'specification_needed')) {
      suggestions.push(
        'Delete all slots for today',
        'Update my 2 PM slot',
        'Remove slots for this week',
        'Change tomorrow\'s appointments'
      );
    }
    
    if (missingInfo.some(info => info.type === 'specific_time_needed')) {
      suggestions.push(
        'Show availability for tomorrow',
        'Create slot for next Tuesday',
        'Update slot for Friday at 3 PM'
      );
    }
    
    return suggestions.slice(0, 4);
  }

  private generateAlternativeActions(toolIssues: Array<{ requested: string; alternative: string }>): string[] {
    const alternatives: string[] = [];
    
    for (const issue of toolIssues) {
      if (issue.requested.includes('analysis')) {
        alternatives.push(
          'Show my availability this week',
          'Show my availability for today',
          'Count my total slots'
        );
      }
      
      if (issue.requested.includes('optimization')) {
        alternatives.push(
          'Show my current schedule',
          'Find gaps in my availability',
          'Show busiest days this week'
        );
      }
      
      if (issue.requested.includes('export')) {
        alternatives.push(
          'Display all my slots',
          'Show this week\'s schedule',
          'List availability by day'
        );
      }
    }
    
    return alternatives.slice(0, 3);
  }

  private getNextDayOccurrence(dayName: string): Date {
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());
    const currentDay = today.getDay();
    
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    const nextOccurrence = new Date(today);
    nextOccurrence.setDate(today.getDate() + daysToAdd);
    return nextOccurrence;
  }

  private getLastDayOccurrence(dayName: string): Date {
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());
    const currentDay = today.getDay();
    
    let daysToSubtract = currentDay - targetDay;
    if (daysToSubtract <= 0) {
      daysToSubtract += 7;
    }
    
    const lastOccurrence = new Date(today);
    lastOccurrence.setDate(today.getDate() - daysToSubtract);
    return lastOccurrence;
  }

  private getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}