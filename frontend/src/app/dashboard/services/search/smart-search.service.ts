import { Injectable, inject } from '@angular/core';
import { Availability } from '../../models/availability.models';
import { SmartCalendarLoggerService } from '../smart-calendar-logger.service';
import { GeminiAIService } from '../../../services/gemini-ai.service';
import { SearchFilterService } from '../';

export interface SearchResult {
  results: Availability[];
  interpretation: string;
  suggestions: string[];
  // Add navigation information for date-based searches
  navigation?: {
    date: string; // YYYY-MM-DD format
    view?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth';
  };
}

@Injectable({
  providedIn: 'root'
})
export class SmartSearchService {
  private logger = inject(SmartCalendarLoggerService);
  private geminiAI = inject(GeminiAIService);
  private filterService = inject(SearchFilterService);

  /**
   * Main search method that decides between simple keyword search and AI-powered search
   */
  async search(query: string, calendarData: Availability[]): Promise<SearchResult> {
    console.log('🔍 SmartSearch: Starting search:', { query, dataLength: calendarData.length });
    
    if (!Array.isArray(calendarData) || calendarData.length === 0) {
      console.log('⚠️ SmartSearch: No calendar data provided');
      return {
        results: [],
        interpretation: 'No data available to search',
        suggestions: ['Please add some availability slots first']
      };
    }

    // If query is empty, return all slots
    if (!query || query.trim() === '') {
      console.log('📋 SmartSearch: Empty query - returning all slots');
      return {
        results: calendarData,
        interpretation: `Showing all ${calendarData.length} slots`,
        suggestions: this.generateContextualSuggestions(calendarData)
      };
    }

    console.log('📋 SmartSearch: Sample calendar data:', calendarData.slice(0, 2));
    
    // Try simple keyword search first
    const simpleSearchResult = this.trySimpleKeywordSearch(query, calendarData);
    if (simpleSearchResult) {
      console.log('🚀 SmartSearch: Using fast keyword search (no AI needed)');
      return simpleSearchResult;
    }
    
    // Use AI for complex queries
    return this.performAISearch(query, calendarData);
  }

  /**
   * Tries to handle simple keyword searches without AI
   */
  private trySimpleKeywordSearch(query: string, calendarData: Availability[]): SearchResult | null {
    const queryLower = query.toLowerCase().trim();
    
    // Define simple keywords that can be handled without AI
    const simpleKeywords: { [key: string]: any } = {
      // Time periods
      'morning': { timeFilter: 'morning' },
      'afternoon': { timeFilter: 'afternoon' },
      'evening': { timeFilter: 'evening' },
      'night': { timeFilter: 'night' },
      'am': { timeFilter: 'morning' },
      'pm': { timeFilter: 'afternoon' },
      
      // Days of week
      'monday': { dayOfWeek: 1 },
      'tuesday': { dayOfWeek: 2 },
      'wednesday': { dayOfWeek: 3 },
      'thursday': { dayOfWeek: 4 },
      'friday': { dayOfWeek: 5 },
      'saturday': { dayOfWeek: 6 },
      'sunday': { dayOfWeek: 0 },
      'mon': { dayOfWeek: 1 },
      'tue': { dayOfWeek: 2 },
      'wed': { dayOfWeek: 3 },
      'thu': { dayOfWeek: 4 },
      'fri': { dayOfWeek: 5 },
      'sat': { dayOfWeek: 6 },
      'sun': { dayOfWeek: 0 },
      
      // Status filters
      'available': { statusFilter: 'available' },
      'booked': { statusFilter: 'booked' },
      'free': { statusFilter: 'available' },
      'busy': { statusFilter: 'booked' },
      'reserved': { statusFilter: 'booked' },
      'open': { statusFilter: 'available' },
      'occupied': { statusFilter: 'booked' },
      'taken': { statusFilter: 'booked' },
      'empty': { statusFilter: 'available' },
      'vacant': { statusFilter: 'available' },
      
      // Date filters
      'today': { dateFilter: { type: 'today' } },
      'tomorrow': { dateFilter: { type: 'tomorrow' } },
      'thisweek': { dateFilter: { type: 'thisweek' } },
      'this week': { dateFilter: { type: 'thisweek' } },
      'nextweek': { dateFilter: { type: 'nextweek' } },
      'next week': { dateFilter: { type: 'nextweek' } },
      'week': { dateFilter: { type: 'thisweek' } },
      
      // General keywords
      'all': { showAll: true },
      'slots': { general: true },
      'appointments': { general: true },
      'meetings': { general: true },
      'bookings': { general: true },
      'schedule': { general: true },
      'calendar': { general: true }
    };
    
    // Parse query for keywords
    const words = queryLower.split(/\s+/);
    let criteria: any = {};
    let matchedKeywords: string[] = [];
    
    // Check for exact keyword matches
    for (const word of words) {
      if (simpleKeywords[word]) {
        criteria = { ...criteria, ...simpleKeywords[word] };
        matchedKeywords.push(word);
      }
    }
    
    // Check for multi-word phrases and day + time combinations
    if (queryLower.includes('this week')) {
      criteria.dateFilter = { type: 'thisweek' };
      matchedKeywords.push('this week');
    }
    if (queryLower.includes('next week')) {
      criteria.dateFilter = { type: 'nextweek' };
      matchedKeywords.push('next week');
    }
    
    // Handle temporal day references (this/next/last + day)
    const temporalDayMatch = this.parseTemporalDayReference(queryLower);
    if (temporalDayMatch) {
      criteria.dateFilter = { 
        type: 'specific', 
        specificDate: temporalDayMatch.targetDate 
      };
      matchedKeywords.push(temporalDayMatch.originalPhrase);
      console.log('🗓️ SmartSearch: Temporal day reference detected:', temporalDayMatch);
    }
    
    // Handle specific date patterns (e.g., "10/09/2025", "2025-10-09", "Oct 9, 2025")
    const specificDateMatch = this.parseSpecificDate(queryLower);
    if (specificDateMatch) {
      criteria.dateFilter = { 
        type: 'specific', 
        specificDate: specificDateMatch.date 
      };
      matchedKeywords.push(specificDateMatch.originalPhrase);
      console.log('📅 SmartSearch: Specific date detected:', specificDateMatch);
    }
    
    // Handle month-based patterns (e.g., "October", "Oct 2025", "October 2025")
    const monthMatch = this.parseMonthReference(queryLower);
    if (monthMatch) {
      criteria.dateFilter = { 
        type: 'specific', 
        subtype: 'month', // Indicate this is a month search
        specificDate: monthMatch.date 
      };
      matchedKeywords.push(monthMatch.originalPhrase);
      console.log('📅 SmartSearch: Month reference detected:', monthMatch);
    }
    
    // Handle special case for "all" - show everything if requested
    if (criteria.showAll || (matchedKeywords.includes('all') && words.length <= 2)) {
      return {
        results: calendarData,
        interpretation: `Showing all ${calendarData.length} slots`,
        suggestions: this.generateContextualSuggestions(calendarData)
      };
    }
    
    // If no simple keywords found, or query is complex, use AI
    if (matchedKeywords.length === 0 || this.isComplexQuery(queryLower)) {
      return null;
    }
    
    console.log('🚀 SmartSearch: Simple search detected:', { matchedKeywords, criteria });
    
    // Apply the simple criteria using filter service
    const results = this.filterService.applySimpleCriteria(calendarData, criteria);
    
    // Prepare navigation info if a specific date/month was found
    let navigation: { date: string; view?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' } | undefined;
    if (criteria.dateFilter && criteria.dateFilter.specificDate) {
      // Determine appropriate view based on what was matched
      if (monthMatch || criteria.dateFilter.subtype === 'month') {
        // For month references, use month view
        navigation = {
          date: criteria.dateFilter.specificDate,
          view: 'dayGridMonth'
        };
      } else {
        // For specific dates, use day view
        navigation = {
          date: criteria.dateFilter.specificDate,
          view: 'timeGridDay'
        };
      }
    } else if (temporalDayMatch) {
      navigation = {
        date: temporalDayMatch.targetDate,
        view: 'timeGridDay'
      };
    } else if (specificDateMatch) {
      navigation = {
        date: specificDateMatch.date,
        view: 'timeGridDay'
      };
    } else if (monthMatch) {
      navigation = {
        date: monthMatch.date,
        view: 'dayGridMonth'
      };
    }
    
    return {
      results,
      interpretation: this.generateSimpleInterpretation(matchedKeywords, results.length),
      suggestions: this.generateContextualSuggestions(calendarData, matchedKeywords),
      navigation
    };
  }

  /**
   * Performs AI-powered search for complex queries
   */
  private async performAISearch(query: string, calendarData: Availability[]): Promise<SearchResult> {
    try {
      console.log('🤖 SmartSearch: Using AI for complex search...');
      
      const aiResponse = await this.geminiAI.enhancedSearch(query, calendarData);
      console.log('✅ SmartSearch: AI response received:', aiResponse);
      
      const results = this.filterService.applyEnhancedCriteria(calendarData, aiResponse.searchCriteria);
      console.log('🎯 SmartSearch: Search results after filtering:', { resultCount: results.length });
      
      this.logger.debug('SmartSearchService', 'AI search completed', { 
        query, 
        resultCount: results.length,
        interpretation: aiResponse.interpretation
      });
      
      // Check if the query contains date information for navigation
      let navigation: { date: string; view?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' } | undefined;
      
      // Extract date from AI response if available
      if (aiResponse.searchCriteria?.dateFilter?.specificDate) {
        // Determine view based on criteria (if it's a month reference, use month view)
        const isMonthReference = this.isMonthReferenceQuery(query) || 
                                aiResponse.searchCriteria.dateFilter.subtype === 'month';
        navigation = {
          date: aiResponse.searchCriteria.dateFilter.specificDate,
          view: isMonthReference ? 'dayGridMonth' : 'timeGridDay'
        };
      } else {
        // Try to parse date from the query directly
        const specificDateMatch = this.parseSpecificDate(query.toLowerCase());
        const monthMatch = this.parseMonthReference(query.toLowerCase());
        
        if (monthMatch) {
          navigation = {
            date: monthMatch.date,
            view: 'dayGridMonth'
          };
        } else if (specificDateMatch) {
          navigation = {
            date: specificDateMatch.date,
            view: 'timeGridDay'
          };
        }
      }
      
      return {
        results,
        interpretation: aiResponse.interpretation,
        suggestions: aiResponse.suggestions,
        navigation
      };
    } catch (error) {
      console.error('❌ SmartSearch: AI search failed:', error);
      this.logger.error('SmartSearchService', 'AI search failed, falling back to basic search', error);
      
      // Fallback to basic NLP search
      const basicResults = this.performBasicNLPSearch(query, calendarData);
      
      // Try to parse date for navigation even in fallback
      let navigation: { date: string; view?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' } | undefined;
      const specificDateMatch = this.parseSpecificDate(query.toLowerCase());
      const monthMatch = this.parseMonthReference(query.toLowerCase());
      
      if (monthMatch) {
        navigation = {
          date: monthMatch.date,
          view: 'dayGridMonth'
        };
      } else if (specificDateMatch) {
        navigation = {
          date: specificDateMatch.date,
          view: 'timeGridDay'
        };
      }
      
      return {
        results: basicResults,
        interpretation: `Searched for: "${query}" (basic mode)`,
        suggestions: ['Try more specific terms', 'Use dates like "today" or "tomorrow"', 'Specify status like "available" or "booked"'],
        navigation
      };
    }
  }

  /**
   * Basic NLP search as fallback
   */
  private performBasicNLPSearch(query: string, calendarData: Availability[]): Availability[] {
    const lowerQuery = query.toLowerCase();
    let filteredData = [...calendarData];
    
    // Apply basic NLP patterns
    if (lowerQuery.includes('booked') || lowerQuery.includes('reserved')) {
      filteredData = filteredData.filter(slot => slot.isBooked);
    }
    
    if (lowerQuery.includes('available') || lowerQuery.includes('free')) {
      filteredData = filteredData.filter(slot => !slot.isBooked);
    }
    
    // Time-based filters
    if (lowerQuery.includes('morning')) {
      filteredData = filteredData.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 6 && hour < 12;
      });
    }
    
    if (lowerQuery.includes('afternoon')) {
      filteredData = filteredData.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 12 && hour < 18;
      });
    }
    
    if (lowerQuery.includes('evening')) {
      filteredData = filteredData.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 18 && hour < 22;
      });
    }
    
    // Date-based filters
    if (lowerQuery.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      filteredData = filteredData.filter(slot => {
        const slotDate = new Date(slot.startTime);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() === today.getTime();
      });
    }
    
    if (lowerQuery.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      filteredData = filteredData.filter(slot => {
        const slotDate = new Date(slot.startTime);
        slotDate.setHours(0, 0, 0, 0);
        return slotDate.getTime() === tomorrow.getTime();
      });
    }
    
    this.logger.debug('SmartSearchService', 'Basic NLP search completed', { 
      query, 
      resultCount: filteredData.length 
    });
    
    return filteredData;
  }

  /**
   * Checks if query is too complex for simple keyword matching
   */
  private isComplexQuery(query: string): boolean {
    const complexPatterns = [
      /\b(find|show|get|give me|what|when|how|where)\b/,
      /\b(between|from|to|until|after|before)\b/,
      /\d+\s*(hour|minute|am|pm)/,
      /\b(long|short|duration|lasting)\b/,
      /\b(conflict|overlap|double.?book)\b/,
      /[?!]/, // Questions or exclamations
      /\b(and|or|but|not|except)\b/ // Logical operators
    ];
    
    return complexPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Determines if a query refers to a month (rather than a specific date)
   */
  private isMonthReferenceQuery(query: string): boolean {
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const monthAbbreviations = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    
    const queryLower = query.toLowerCase();
    
    // Check for month name + year patterns
    for (const month of monthNames) {
      if (new RegExp(`\\b${month}\\s+\\d{4}\\b`, 'i').test(queryLower)) {
        return true;
      }
    }
    
    // Check for month abbreviation + year patterns
    for (const abbrev of monthAbbreviations) {
      if (new RegExp(`\\b${abbrev}\\s+\\d{4}\\b`, 'i').test(queryLower)) {
        return true;
      }
    }
    
    // Check for just month names or abbreviations (without day numbers)
    const dayNumberPattern = /\b\d{1,2}(st|nd|rd|th)?\b/;
    if (!dayNumberPattern.test(queryLower)) {
      for (const month of monthNames) {
        if (new RegExp(`\\b${month}\\b`, 'i').test(queryLower)) {
          return true;
        }
      }
      for (const abbrev of monthAbbreviations) {
        if (new RegExp(`\\b${abbrev}\\b`, 'i').test(queryLower)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Parses temporal day references like "this friday", "next monday", "last tuesday"
   * Week starts from Sunday (0) to Saturday (6)
   */
  private parseTemporalDayReference(query: string): { targetDate: string; originalPhrase: string } | null {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayAbbreviations = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    // Patterns to match temporal references
    const patterns = [
      // "this friday", "this mon", etc.
      /\b(this)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\b/,
      // "next friday", "next mon", etc.
      /\b(next)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\b/,
      // "last friday", "last mon", etc.
      /\b(last)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)\b/
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        const temporal = match[1]; // 'this', 'next', or 'last'
        const dayStr = match[2]; // day name or abbreviation
        const originalPhrase = match[0]; // full matched phrase
        
        // Convert abbreviation to full name if needed
        let targetDayName = dayStr;
        const abbrevIndex = dayAbbreviations.indexOf(dayStr);
        if (abbrevIndex !== -1) {
          targetDayName = dayNames[abbrevIndex];
        }
        
        const targetDayIndex = dayNames.indexOf(targetDayName);
        if (targetDayIndex === -1) continue;
        
        // Calculate the target date
        const targetDate = this.calculateTemporalDate(temporal, targetDayIndex);
        
        return {
          targetDate: targetDate.toISOString().split('T')[0], // YYYY-MM-DD format
          originalPhrase
        };
      }
    }
    
    return null;
  }
  
  /**
   * Calculates the actual date for temporal references
   * @param temporal 'this', 'next', or 'last'
   * @param targetDayIndex 0-6 (Sunday to Saturday)
   */
  private calculateTemporalDate(temporal: string, targetDayIndex: number): Date {
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 = Sunday, 6 = Saturday
    
    switch (temporal) {
      case 'this':
        // Find the target day in the current week
        const daysUntilTarget = targetDayIndex - currentDayIndex;
        const thisWeekDate = new Date(today);
        thisWeekDate.setDate(today.getDate() + daysUntilTarget);
        return thisWeekDate;
        
      case 'next':
        // Find the target day in the next week
        const daysUntilNextTarget = (7 - currentDayIndex) + targetDayIndex;
        const nextWeekDate = new Date(today);
        nextWeekDate.setDate(today.getDate() + daysUntilNextTarget);
        return nextWeekDate;
        
      case 'last':
        // Find the target day in the previous week
        const daysSinceLastTarget = currentDayIndex + (7 - targetDayIndex);
        const lastWeekDate = new Date(today);
        lastWeekDate.setDate(today.getDate() - daysSinceLastTarget);
        return lastWeekDate;
        
      default:
        return today;
    }
  }

  /**
   * Generates interpretation for simple searches
   */
  private generateSimpleInterpretation(keywords: string[], resultCount: number): string {
    const keywordStr = keywords.join(' and ');
    return `Found ${resultCount} slots matching: ${keywordStr}`;
  }

  /**
   * Generates smart suggestions for simple searches
   */
  private generateSimpleSearchSuggestions(calendarData: Availability[]): string[] {
    const suggestions = [];
    
    // Time-based suggestions
    suggestions.push('morning', 'afternoon', 'evening');
    
    // Day-based suggestions
    const today = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    suggestions.push('today', 'tomorrow', dayNames[today]);
    
    // Status suggestions
    const hasBooked = calendarData.some(slot => slot.isBooked);
    const hasAvailable = calendarData.some(slot => !slot.isBooked);
    
    if (hasAvailable) suggestions.push('available');
    if (hasBooked) suggestions.push('booked');
    
    // Week suggestions
    suggestions.push('this week', 'next week');
    
    return suggestions.slice(0, 8); // Return top 8 suggestions
  }

  /**
   * Generate search suggestions using AI or fallback to simple suggestions
   */
  async generateSearchSuggestions(calendarData: Availability[]): Promise<string[]> {
    try {
      return await this.geminiAI.generateSearchSuggestions(calendarData);
    } catch (error) {
      this.logger.error('SmartSearchService', 'Failed to generate AI suggestions', error);
      return this.generateSimpleSearchSuggestions(calendarData);
    }
  }

  /**
   * Generates contextual search suggestions based on data and previous search
   */
  private generateContextualSuggestions(calendarData: Availability[], matchedKeywords?: string[]): string[] {
    const suggestions = new Set<string>();
    
    // Get today's day name for context
    const today = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[today];
    const tomorrow = dayNames[(today + 1) % 7];
    
    // Base suggestions
    suggestions.add('all slots');
    suggestions.add('available');
    suggestions.add('today');
    suggestions.add('tomorrow');
    
    // Time period suggestions
    suggestions.add('morning');
    suggestions.add('afternoon');
    suggestions.add('evening');
    
    // Day + time combinations (popular searches)
    suggestions.add('friday morning');
    suggestions.add('monday morning');
    suggestions.add('tomorrow morning');
    suggestions.add('today afternoon');
    suggestions.add(`${currentDay} afternoon`);
    suggestions.add(`${tomorrow} morning`);
    
    // Temporal day references
    suggestions.add('this friday');
    suggestions.add('next monday');
    suggestions.add('this saturday');
    suggestions.add('next week');
    suggestions.add(`this ${currentDay}`);
    suggestions.add(`next ${tomorrow}`);
    
    // Week-based suggestions
    suggestions.add('this week');
    suggestions.add('next week');
    
    // Status + time combinations
    suggestions.add('available morning');
    suggestions.add('free afternoon');
    suggestions.add('open today');
    suggestions.add('busy friday');
    
    // Contextual suggestions based on data
    if (calendarData.length > 0) {
      const hasBookedSlots = calendarData.some(slot => slot.isBooked);
      const hasAvailableSlots = calendarData.some(slot => !slot.isBooked);
      
      if (hasBookedSlots) {
        suggestions.add('booked');
        suggestions.add('busy');
        suggestions.add('reserved');
      }
      
      if (hasAvailableSlots) {
        suggestions.add('free');
        suggestions.add('open');
        suggestions.add('vacant');
      }
      
      // Check for weekend/weekday patterns
      const weekendSlots = calendarData.filter(slot => {
        const day = new Date(slot.startTime).getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
      
      if (weekendSlots.length > 0) {
        suggestions.add('weekend');
        suggestions.add('saturday');
        suggestions.add('sunday');
      }
      
      // Popular day combinations
      suggestions.add('weekdays');
      suggestions.add('work days');
    }
    
    // Add contextual suggestions based on what was already searched
    if (matchedKeywords && matchedKeywords.length > 0) {
      const lastKeyword = matchedKeywords[matchedKeywords.length - 1];
      
      // If they searched for a day, suggest time periods and temporal references for that day
      if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(lastKeyword)) {
        suggestions.add(`${lastKeyword} morning`);
        suggestions.add(`${lastKeyword} afternoon`);
        suggestions.add(`${lastKeyword} evening`);
        suggestions.add(`this ${lastKeyword}`);
        suggestions.add(`next ${lastKeyword}`);
      }
      
      // If they searched for a time, suggest days and temporal references for that time
      if (['morning', 'afternoon', 'evening'].includes(lastKeyword)) {
        suggestions.add(`today ${lastKeyword}`);
        suggestions.add(`tomorrow ${lastKeyword}`);
        suggestions.add(`friday ${lastKeyword}`);
        suggestions.add(`monday ${lastKeyword}`);
        suggestions.add(`this friday ${lastKeyword}`);
        suggestions.add(`next monday ${lastKeyword}`);
      }
      
      // If they searched for temporal references, suggest other temporal patterns
      if (lastKeyword.includes('this ') || lastKeyword.includes('next ') || lastKeyword.includes('last ')) {
        const dayPart = lastKeyword.split(' ')[1];
        if (dayPart && ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dayPart)) {
          suggestions.add(`${lastKeyword} morning`);
          suggestions.add(`${lastKeyword} afternoon`);
          suggestions.add(`this ${dayPart}`);
          suggestions.add(`next ${dayPart}`);
          suggestions.add(`last ${dayPart}`);
        }
      }
      
      // If they searched for availability, suggest time contexts
      if (['available', 'free', 'open'].includes(lastKeyword)) {
        suggestions.add(`${lastKeyword} today`);
        suggestions.add(`${lastKeyword} morning`);
        suggestions.add(`${lastKeyword} this week`);
        suggestions.add(`${lastKeyword} this friday`);
        suggestions.add(`${lastKeyword} next monday`);
      }
    }
    
    // Convert to array and return top suggestions
    return Array.from(suggestions).slice(0, 12);
  }

  /**
   * Parses specific date patterns like "10/09/2025", "2025-10-09", "Oct 9, 2025"
   */
  private parseSpecificDate(query: string): { date: string; originalPhrase: string } | null {
    // Pattern 1: MM/DD/YYYY or M/D/YYYY
    const mmddyyyyPattern = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](\d{4})\b/;
    const mmddyyyyMatch = query.match(mmddyyyyPattern);
    if (mmddyyyyMatch) {
      const month = parseInt(mmddyyyyMatch[1]);
      const day = parseInt(mmddyyyyMatch[2]);
      const year = parseInt(mmddyyyyMatch[3]);
      
      // Validate date
      if (this.isValidDate(year, month - 1, day)) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return {
          date: dateStr,
          originalPhrase: mmddyyyyMatch[0]
        };
      }
    }
    
    // Pattern 2: YYYY-MM-DD (ISO format)
    const isoPattern = /\b(\d{4})-(0?[1-9]|1[0-2])-(0?[1-9]|[12][0-9]|3[01])\b/;
    const isoMatch = query.match(isoPattern);
    if (isoMatch) {
      const year = parseInt(isoMatch[1]);
      const month = parseInt(isoMatch[2]);
      const day = parseInt(isoMatch[3]);
      
      // Validate date
      if (this.isValidDate(year, month - 1, day)) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return {
          date: dateStr,
          originalPhrase: isoMatch[0]
        };
      }
    }
    
    // Pattern 3: Month DD, YYYY (e.g., "October 9, 2025")
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const monthNamePattern = new RegExp(
      `\\b(${monthNames.join('|')})\\s+(\\d{1,2})(st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'i'
    );
    const monthNameMatch = query.match(monthNamePattern);
    if (monthNameMatch) {
      const monthName = monthNameMatch[1].toLowerCase();
      const day = parseInt(monthNameMatch[2]);
      const year = parseInt(monthNameMatch[4]);
      
      const monthIndex = monthNames.indexOf(monthName);
      if (monthIndex !== -1 && this.isValidDate(year, monthIndex, day)) {
        const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return {
          date: dateStr,
          originalPhrase: monthNameMatch[0]
        };
      }
    }
    
    // Pattern 4: DD Month YYYY (e.g., "9 October 2025")
    const dayMonthPattern = new RegExp(
      `\\b(\\d{1,2})(st|nd|rd|th)?\\s+(${monthNames.join('|')})\\s+(\\d{4})\\b`, 'i'
    );
    const dayMonthMatch = query.match(dayMonthPattern);
    if (dayMonthMatch) {
      const day = parseInt(dayMonthMatch[1]);
      const monthName = dayMonthMatch[3].toLowerCase();
      const year = parseInt(dayMonthMatch[4]);
      
      const monthIndex = monthNames.indexOf(monthName);
      if (monthIndex !== -1 && this.isValidDate(year, monthIndex, day)) {
        const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return {
          date: dateStr,
          originalPhrase: dayMonthMatch[0]
        };
      }
    }
    
    return null;
  }
  
  /**
   * Parses month references like "October", "Oct 2025", "October 2025"
   */
  private parseMonthReference(query: string): { date: string; originalPhrase: string } | null {
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const monthAbbreviations = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];
    
    // Pattern 1: Full month name with year (e.g., "October 2025")
    const fullMonthYearPattern = new RegExp(
      `\\b(${monthNames.join('|')})\\s+(\\d{4})\\b`, 'i'
    );
    const fullMonthYearMatch = query.match(fullMonthYearPattern);
    if (fullMonthYearMatch) {
      const monthName = fullMonthYearMatch[1].toLowerCase();
      const year = parseInt(fullMonthYearMatch[2]);
      
      const monthIndex = monthNames.indexOf(monthName);
      if (monthIndex !== -1) {
        // First day of the month
        const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-01`;
        return {
          date: dateStr,
          originalPhrase: fullMonthYearMatch[0]
        };
      }
    }
    
    // Pattern 2: Month abbreviation with year (e.g., "Oct 2025")
    const abbrevMonthYearPattern = new RegExp(
      `\\b(${monthAbbreviations.join('|')})\\s+(\\d{4})\\b`, 'i'
    );
    const abbrevMonthYearMatch = query.match(abbrevMonthYearPattern);
    if (abbrevMonthYearMatch) {
      const monthAbbrev = abbrevMonthYearMatch[1].toLowerCase();
      const year = parseInt(abbrevMonthYearMatch[2]);
      
      const monthIndex = monthAbbreviations.indexOf(monthAbbrev);
      if (monthIndex !== -1) {
        // First day of the month
        const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-01`;
        return {
          date: dateStr,
          originalPhrase: abbrevMonthYearMatch[0]
        };
      }
    }
    
    // Pattern 3: Just full month name (e.g., "October")
    const fullMonthPattern = new RegExp(`\\b(${monthNames.join('|')})\\b`, 'i');
    const fullMonthMatch = query.match(fullMonthPattern);
    if (fullMonthMatch) {
      const monthName = fullMonthMatch[1].toLowerCase();
      const monthIndex = monthNames.indexOf(monthName);
      
      if (monthIndex !== -1) {
        const now = new Date();
        const year = now.getFullYear();
        // First day of the month
        const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-01`;
        return {
          date: dateStr,
          originalPhrase: fullMonthMatch[0]
        };
      }
    }
    
    // Pattern 4: Just month abbreviation (e.g., "Oct")
    const abbrevMonthPattern = new RegExp(`\\b(${monthAbbreviations.join('|')})\\b`, 'i');
    const abbrevMonthMatch = query.match(abbrevMonthPattern);
    if (abbrevMonthMatch) {
      const monthAbbrev = abbrevMonthMatch[1].toLowerCase();
      const monthIndex = monthAbbreviations.indexOf(monthAbbrev);
      
      if (monthIndex !== -1) {
        const now = new Date();
        const year = now.getFullYear();
        // First day of the month
        const dateStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-01`;
        return {
          date: dateStr,
          originalPhrase: abbrevMonthMatch[0]
        };
      }
    }
    
    return null;
  }
  
  /**
   * Validates if a date is valid
   */
  private isValidDate(year: number, month: number, day: number): boolean {
    const date = new Date(year, month, day);
    return date.getFullYear() === year && 
           date.getMonth() === month && 
           date.getDate() === day;
  }

}