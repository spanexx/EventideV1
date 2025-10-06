import { Injectable } from '@angular/core';
import { ExtractedEntities } from './ai-chat-interfaces';

export type { ExtractedEntities };
export type { DurationEntity, TimeInfo, TimeRangeEntity, WeekdayPatternEntity, SchedulePatternAnalysis };

interface DurationEntity {
  duration: number;
}

interface TimeInfo {
  times?: string[];
  startTime?: string;
  endTime?: string;
}

interface TimeRangeEntity {
  startTime: string;
  endTime: string;
}

interface WeekdayPatternEntity {
  pattern: 'daily' | 'weekly' | 'range';
  daysOfWeek: number[];
}

interface SchedulePatternAnalysis {
  period: string;
  frequency: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIChatEntityExtractionService {
  extractEntities(message: string): ExtractedEntities {
    return {
      dates: this.extractDatesNLP(message),
      times: this.extractTimesNLP(message),
      duration: this.extractDurationNLP(message),
      context: this.extractContextNLP(message),
      ...(this.extractWeekdayPatternNLP(message) || {})
    };
  }

  extractAdvancedEntities(message: string): ExtractedEntities {
    // Combine basic and advanced extraction
    const basicEntities = this.extractEntities(message);
    const advancedEntities = this.extractAdvancedPatterns(message);
    
    return {
      ...basicEntities,
      ...advancedEntities
    };
  }

  private extractAdvancedPatterns(message: string): Partial<ExtractedEntities> {
    return {};
  }


  private extractDurationNLP(message: string): DurationEntity {
    const durationPatterns = [
      /\b(\d+)\s*hours?\b/gi,
      /\b(\d+)\s*minutes?\b/gi,
      /\b(\d+)\s*hrs?\b/gi,
      /\b(\d+)\s*mins?\b/gi
    ];
    
    for (const pattern of durationPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1]);
        if (pattern.source.includes('hour') || pattern.source.includes('hr')) {
          return { duration: value * 60 }; // Convert to minutes
        } else {
          return { duration: value };
        }
      }
    }
    
    return { duration: 60 }; // Default 1-hour duration
  }

  private extractWeekdayPatternNLP(message: string): WeekdayPatternEntity | null {
    const weekdayPatterns = [
      {
        regex: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:through|to|until|and)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        type: 'range'
      },
      {
        regex: /\b(?:every|each)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s*,\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday))*\b/i,
        type: 'list'
      },
      {
        regex: /\b(?:weekdays|monday\s+(?:through|to|until)\s+friday)\b/i,
        type: 'weekdays'
      },
      {
        regex: /\b(?:weekends|saturday\s+(?:and|through|to|until)\s+sunday)\b/i,
        type: 'weekends'
      }
    ];

    const dayMap: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };

    for (const { regex, type } of weekdayPatterns) {
      const match = message.match(regex);
      if (match) {
        let daysOfWeek: number[] = [];

        switch (type) {
          case 'range': {
            const startDay = dayMap[match[1].toLowerCase()];
            const endDay = dayMap[match[2].toLowerCase()];
            const dayCount = (endDay - startDay + 7) % 7 + 1;
            for (let i = 0; i < dayCount; i++) {
              daysOfWeek.push((startDay + i) % 7);
            }
            break;
          }
          case 'list': {
            const days = match[0].toLowerCase().match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/g);
            if (days) {
              daysOfWeek = days.map(day => dayMap[day]);
            }
            break;
          }
          case 'weekdays':
            daysOfWeek = [1, 2, 3, 4, 5]; // Monday to Friday
            break;
          case 'weekends':
            daysOfWeek = [6, 0]; // Saturday and Sunday
            break;
        }

        return {
          pattern: 'weekly',
          daysOfWeek: [...new Set(daysOfWeek)].sort((a, b) => a - b)
        };
      }
    }

    return null;
  }

  private extractTimesNLP(message: string): TimeInfo {
    const timeInfo: TimeInfo = {};
    
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
        timeInfo.times = matches.map(match => this.normalizeTimeNLP(match[0]));
      }
    }
    
    return timeInfo;
  }

  private extractDatesNLP(message: string): ExtractedEntities['dates'] {
    const dateInfo: ExtractedEntities['dates'] = {};
    
    // Date patterns
    const patterns = {
      today: /\b(today|now)\b/i,
      tomorrow: /\btomorrow\b/i,
      yesterday: /\byesterday\b/i,
      thisWeek: /\bthis week\b/i,
      nextWeek: /\bnext week\b/i,
      lastWeek: /\blast week\b/i,
      dayNames: /\b(this|next|last)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      dateFormat1: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g,
      dateFormat2: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g,
      dateFormat3: /\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b/g,
    };
    
    const today = new Date();
    
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
    
    return dateInfo;
  }

  private extractContextNLP(message: string): Required<ExtractedEntities>['context'] {
    const context: Required<ExtractedEntities>['context'] = {};
    
    // Status filters
    if (/\b(available|free|open)\b/i.test(message)) {
      context.status = 'available';
    } else if (/\b(booked|busy|taken|occupied)\b/i.test(message)) {
      context.status = 'booked';
    }
    
    // Urgency/priority
    if (/\b(urgent|asap|immediately|now)\b/i.test(message)) {
      context['priority'] = 'high';
    }
    
    return context;
  }

  private analyzeTimePattern(message: string): SchedulePatternAnalysis | null {
    const periodPatterns = {
      morning: /\b(morning|early|dawn|breakfast)\b/i,
      afternoon: /\b(afternoon|lunch|midday)\b/i,
      evening: /\b(evening|night|dinner|late)\b/i
    };

    const frequencyPatterns = {
      daily: /\b(daily|everyday|each day)\b/i,
      weekly: /\b(weekly|each week|once a week)\b/i,
      monthly: /\b(monthly|each month|once a month)\b/i,
      biweekly: /\b(biweekly|every other week|twice a month)\b/i
    };

    let period = null;
    for (const [key, pattern] of Object.entries(periodPatterns)) {
      if (pattern.test(message)) {
        period = key;
        break;
      }
    }

    let frequency = null;
    for (const [key, pattern] of Object.entries(frequencyPatterns)) {
      if (pattern.test(message)) {
        frequency = key;
        break;
      }
    }

    if (period || frequency) {
      return {
        period: period || 'any',
        frequency: frequency || 'any'
      };
    }

    return null;
  }

  private normalizeTimeNLP(timeStr: string): string {
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

  buildEnhancedParameters(entities: ExtractedEntities, action: string, originalMessage: string): Record<string, unknown> {
    const params: Record<string, unknown> = {};
    
    // Add analysis flags for schedule-related queries
    const isAnalysisQuery = /\b(analyze|pattern|insight|statistic|trend)\b/i.test(originalMessage);
    const isOptimizeQuery = /\b(optimize|improve|suggest|recommend)\b/i.test(originalMessage);
    
    // Build parameters based on extracted entities
    if (entities.dates) {
      Object.assign(params, entities.dates);
    }

    const timeInfo = entities.times;
    if (timeInfo?.times) {
      const times = timeInfo.times;
      if (times.length >= 2) {
        params['startTime'] = times[0];
        params['endTime'] = times[1];
      } else if (times.length === 1) {
        params['startTime'] = times[0];
        // Intelligent duration inference
        const inferredDuration = this.inferDurationFromContext(originalMessage);
        const start = new Date(`2024-01-01T${times[0]}`);
        start.setMinutes(start.getMinutes() + inferredDuration);
        params['endTime'] = start.toTimeString().slice(0, 5);
      }
    }
    
    if (entities.duration && entities.duration.duration) {
      params['duration'] = entities.duration.duration;
    }
    
    if (entities.context) {
      Object.assign(params, entities.context);
    }

    // Add pattern analysis if requested
    const timePattern = this.analyzeTimePattern(originalMessage);
    if (timePattern) {
      params['preferredPeriod'] = timePattern.period;
      params['preferredFrequency'] = timePattern.frequency;
    }
    
    // Enhanced action-specific parameter building
    switch (action) {
      case 'get_availability_data':
        params['includeAnalysis'] = true;
        params['includeMetrics'] = this.shouldIncludeMetrics(originalMessage) || isAnalysisQuery;
        params['includeOptimization'] = isOptimizeQuery;
        params['includePatterns'] = isAnalysisQuery;
        break;
        
      case 'create_availability_slot':
        if (!params['duration'] && !params['endTime']) {
          params['duration'] = this.inferDurationFromContext(originalMessage);
        }
        params['autoConfirm'] = this.shouldAutoConfirm(originalMessage);
        break;
        
      case 'create_bulk_availability':
        params['pattern'] = this.inferRecurrencePattern(originalMessage);
        params['count'] = this.inferSlotCount(originalMessage);
        break;
        
      case 'delete_availability_slot':
        params['confirmDelete'] = !this.shouldAutoConfirm(originalMessage);
        params['onlyUnbooked'] = this.shouldOnlyDeleteUnbooked(originalMessage);
        break;
        
      case 'update_availability_slot':
        params['preserveBookings'] = true;
        params['notifyChanges'] = this.shouldNotifyChanges(originalMessage);
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
