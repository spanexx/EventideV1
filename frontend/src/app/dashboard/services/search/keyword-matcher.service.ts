import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KeywordMatcherService {
  // Define simple keywords that can be handled without AI
  private simpleKeywords: { [key: string]: any } = {
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
    'lastweek': { dateFilter: { type: 'lastweek' } },
    'last week': { dateFilter: { type: 'lastweek' } },
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

  /**
   * Matches keywords in a query and returns matched criteria
   */
  matchKeywords(query: string): { criteria: any; matchedKeywords: string[] } {
    const queryLower = query.toLowerCase().trim();
    const words = queryLower.split(/\s+/);
    let criteria: any = {};
    let matchedKeywords: string[] = [];
    
    // Check for exact keyword matches
    for (const word of words) {
      if (this.simpleKeywords[word]) {
        criteria = { ...criteria, ...this.simpleKeywords[word] };
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
    if (queryLower.includes('last week')) {
      criteria.dateFilter = { type: 'lastweek' };
      matchedKeywords.push('last week');
    }
    
    return { criteria, matchedKeywords };
  }

  /**
   * Checks if query is too complex for simple keyword matching
   */
  isComplexQuery(query: string): boolean {
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
  isMonthReferenceQuery(query: string): boolean {
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
   * Gets the simple keywords dictionary
   */
  getSimpleKeywords(): { [key: string]: any } {
    return { ...this.simpleKeywords };
  }
}