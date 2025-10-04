import { Injectable } from '@angular/core';
import { ExtractedEntities } from './ai-chat-interfaces';

@Injectable({
  providedIn: 'root'
})
export class AIChatEntityExtractionService {

  extractAdvancedEntities(message: string): ExtractedEntities {
    const entities: ExtractedEntities = {};
    
    // Enhanced date extraction with natural language processing
    entities.dates = this.extractDatesNLP(message);
    entities.times = this.extractTimesNLP(message);
    entities.duration = this.extractDurationNLP(message);
    entities.context = this.extractContextNLP(message);
    
    return entities;
  }

  private extractDatesNLP(message: string): any {
    const dateInfo: any = {};
    
    // Comprehensive date patterns
    const patterns = {
      // Relative dates
      today: /\b(today|now)\b/i,
      tomorrow: /\btomorrow\b/i,
      yesterday: /\byesterday\b/i,
      
      // Week references
      thisWeek: /\bthis week\b/i,
      nextWeek: /\bnext week\b/i,
      lastWeek: /\blast week\b/i,
      
      // Day names with modifiers
      dayNames: /\b(this|next|last)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      
      // Explicit dates
      dateFormat1: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g, // MM/DD or MM/DD/YYYY
      dateFormat2: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, // YYYY-MM-DD
      dateFormat3: /\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b/g, // DD-MM-YYYY
    };
    
    const today = new Date();
    
    // Process relative dates
    if (patterns.today.test(message)) {
      dateInfo.startDate = today.toISOString().split('T')[0];
    }
    
    if (patterns.tomorrow.test(message)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      dateInfo.startDate = tomorrow.toISOString().split('T')[0];
    }
    
    if (patterns.thisWeek.test(message)) {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      dateInfo.startDate = startOfWeek.toISOString().split('T')[0];
      dateInfo.endDate = endOfWeek.toISOString().split('T')[0];
    }
    
    if (patterns.nextWeek.test(message)) {
      const nextWeekStart = new Date(today);
      nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
      dateInfo.startDate = nextWeekStart.toISOString().split('T')[0];
      dateInfo.endDate = nextWeekEnd.toISOString().split('T')[0];
    }
    
    // Process day names
    const dayMatches = message.match(patterns.dayNames);
    if (dayMatches) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      for (const match of dayMatches) {
        const lowerMatch = match.toLowerCase();
        const dayIndex = dayNames.findIndex(day => lowerMatch.includes(day));
        
        if (dayIndex !== -1) {
          const currentDay = today.getDay();
          let daysToAdd;
          
          if (lowerMatch.includes('next')) {
            daysToAdd = (dayIndex - currentDay + 7) % 7;
            if (daysToAdd === 0) daysToAdd = 7;
          } else if (lowerMatch.includes('last')) {
            daysToAdd = (dayIndex - currentDay - 7) % 7;
            if (daysToAdd === 0) daysToAdd = -7;
          } else {
            // 'this' or no modifier - next occurrence
            daysToAdd = (dayIndex - currentDay + 7) % 7;
            if (daysToAdd === 0 && !lowerMatch.includes('this')) daysToAdd = 7;
          }
          
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysToAdd);
          dateInfo.startDate = targetDate.toISOString().split('T')[0];
        }
      }
    }
    
    // Process explicit date formats
    const dateFormats = [
      { pattern: patterns.dateFormat1, format: 'MM/DD/YYYY' },
      { pattern: patterns.dateFormat2, format: 'YYYY-MM-DD' },
      { pattern: patterns.dateFormat3, format: 'DD-MM-YYYY' }
    ];
    
    for (const { pattern, format } of dateFormats) {
      const matches = Array.from(message.matchAll(pattern));
      if (matches.length > 0) {
        const match = matches[0];
        let year, month, day;
        
        if (format === 'MM/DD/YYYY') {
          month = match[1];
          day = match[2];
          year = match[3] || today.getFullYear().toString();
        } else if (format === 'YYYY-MM-DD') {
          year = match[1];
          month = match[2];
          day = match[3];
        } else if (format === 'DD-MM-YYYY') {
          day = match[1];
          month = match[2];
          year = match[3];
        }
        
        if (year && month && day) {
          // Ensure 4-digit year
          if (year.length === 2) {
            year = '20' + year;
          }
          
          const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          dateInfo.startDate = formattedDate;
        }
      }
    }
    
    return dateInfo;
  }

  private extractTimesNLP(message: string): any {
    const timeInfo: any = {};
    
    // Time patterns
    const timePatterns = [
      /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/gi,
      /\b(\d{1,2})\s*(am|pm)\b/gi,
      /\b(morning|afternoon|evening|night)\b/gi,
      /\bat\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/gi
    ];
    
    for (const pattern of timePatterns) {
      const matches = Array.from(message.matchAll(pattern));
      if (matches.length > 0) {
        // Extract and normalize times
        timeInfo.times = matches.map(match => this.normalizeTimeNLP(match[0]));
      }
    }
    
    return timeInfo;
  }

  private extractDurationNLP(message: string): any {
    const durationPatterns = [
      /\b(\d+)\s*hours?\b/gi,
      /\b(\d+)\s*minutes?\b/gi,
      /\b(\d+)\s*hrs?\b/gi,
      /\b(\d+)\s*mins?\b/gi
    ];
    
    for (const pattern of durationPatterns) {
      const match = message.match(pattern);
      if (match) {
        const value = parseInt(match[1]);
        if (pattern.source.includes('hour') || pattern.source.includes('hr')) {
          return { duration: value * 60 }; // Convert to minutes
        } else {
          return { duration: value };
        }
      }
    }
    
    return {};
  }

  private extractContextNLP(message: string): any {
    const context: any = {};
    
    // Status filters
    if (/\b(available|free|open)\b/i.test(message)) {
      context.status = 'available';
    } else if (/\b(booked|busy|taken|occupied)\b/i.test(message)) {
      context.status = 'booked';
    }
    
    // Urgency/priority
    if (/\b(urgent|asap|immediately|now)\b/i.test(message)) {
      context.priority = 'high';
    }
    
    return context;
  }

  private normalizeTimeNLP(timeStr: string): string {
    // Enhanced time normalization
    const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!timeMatch) return timeStr;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3]?.toLowerCase();
    
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  buildEnhancedParameters(entities: ExtractedEntities, action: string, originalMessage: string): any {
    const params: any = {};
    
    // Build parameters based on extracted entities with natural language understanding
    if (entities.dates) {
      Object.assign(params, entities.dates);
    }
    
    if (entities.times && entities.times.times) {
      const times = entities.times.times;
      if (times.length >= 2) {
        params.startTime = times[0];
        params.endTime = times[1];
      } else if (times.length === 1) {
        params.startTime = times[0];
        // Intelligent duration inference
        const inferredDuration = this.inferDurationFromContext(originalMessage);
        const start = new Date(`2024-01-01T${times[0]}`);
        start.setMinutes(start.getMinutes() + inferredDuration);
        params.endTime = start.toTimeString().slice(0, 5);
      }
    }
    
    if (entities.duration && entities.duration.duration) {
      params.duration = entities.duration.duration;
    }
    
    if (entities.context) {
      Object.assign(params, entities.context);
    }
    
    // Enhanced action-specific parameter building
    switch (action) {
      case 'get_availability_data':
        params.includeAnalysis = true;
        params.includeMetrics = this.shouldIncludeMetrics(originalMessage);
        break;
        
      case 'create_availability_slot':
        if (!params.duration && !params.endTime) {
          params.duration = this.inferDurationFromContext(originalMessage);
        }
        params.autoConfirm = this.shouldAutoConfirm(originalMessage);
        break;
        
      case 'create_bulk_availability':
        params.pattern = this.inferRecurrencePattern(originalMessage);
        params.count = this.inferSlotCount(originalMessage);
        break;
        
      case 'delete_availability_slot':
        params.confirmDelete = !this.shouldAutoConfirm(originalMessage);
        params.onlyUnbooked = this.shouldOnlyDeleteUnbooked(originalMessage);
        break;
        
      case 'update_availability_slot':
        params.preserveBookings = true;
        params.notifyChanges = this.shouldNotifyChanges(originalMessage);
        break;
    }
    
    return params;
  }

  private inferDurationFromContext(message: string): number {
    // Intelligent duration inference from natural language
    const lowerMessage = message.toLowerCase();
    
    // Explicit duration mentions
    if (/\b(\d+)\s*hour/i.test(lowerMessage)) {
      const match = lowerMessage.match(/\b(\d+)\s*hour/i);
      return match ? parseInt(match[1]) * 60 : 60;
    }
    
    if (/\b(\d+)\s*min/i.test(lowerMessage)) {
      const match = lowerMessage.match(/\b(\d+)\s*min/i);
      return match ? parseInt(match[1]) : 30;
    }
    
    // Context-based inference
    if (/\b(meeting|consultation|appointment)\b/i.test(lowerMessage)) {
      return 60; // 1 hour for meetings
    }
    
    if (/\b(quick|brief|short)\b/i.test(lowerMessage)) {
      return 30; // 30 minutes for quick items
    }
    
    if (/\b(long|extended|detailed)\b/i.test(lowerMessage)) {
      return 120; // 2 hours for long sessions
    }
    
    return 60; // Default 1 hour
  }

  private shouldIncludeMetrics(message: string): boolean {
    return /\b(analyze|analysis|metrics|statistics|stats|insights|patterns|trends|utilization|performance)\b/i.test(message);
  }

  private shouldAutoConfirm(message: string): boolean {
    return /\b(please|just do it|go ahead|confirm|yes|sure)\b/i.test(message);
  }

  private shouldOnlyDeleteUnbooked(message: string): boolean {
    return /\b(unbooked|empty|unused|free|available)\b/i.test(message);
  }

  private shouldNotifyChanges(message: string): boolean {
    return /\b(notify|inform|tell|alert|email|message)\b/i.test(message);
  }

  private inferRecurrencePattern(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (/\b(daily|every day)\b/i.test(lowerMessage)) return 'daily';
    if (/\b(weekly|every week)\b/i.test(lowerMessage)) return 'weekly';
    if (/\b(monthly|every month)\b/i.test(lowerMessage)) return 'monthly';
    if (/\b(weekdays|monday to friday)\b/i.test(lowerMessage)) return 'weekdays';
    if (/\b(weekends|saturday and sunday)\b/i.test(lowerMessage)) return 'weekends';
    
    return 'weekly'; // Default
  }

  private inferSlotCount(message: string): number {
    const numberMatch = message.match(/\b(\d+)\b/);
    if (numberMatch) {
      return parseInt(numberMatch[1]);
    }
    
    const lowerMessage = message.toLowerCase();
    if (/\b(many|lots|several)\b/i.test(lowerMessage)) return 10;
    if (/\b(few|some)\b/i.test(lowerMessage)) return 5;
    
    return 7; // Default one week
  }
}