import { Injectable } from '@angular/core';
import { Availability } from '../../models/availability.models';

@Injectable({
  providedIn: 'root'
})
export class SuggestionGeneratorService {
  /**
   * Generates contextual search suggestions based on data and previous search
   */
  generateContextualSuggestions(calendarData: Availability[], matchedKeywords?: string[]): string[] {
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
      
      if (hasAvailableSlots) {
        suggestions.add('free');
        suggestions.add('open');
        suggestions.add('vacant');
      }
      
      if (hasBookedSlots) {
        suggestions.add('booked');
        suggestions.add('busy');
        suggestions.add('reserved');
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
   * Generates simple search suggestions
   */
  generateSimpleSearchSuggestions(calendarData: Availability[]): string[] {
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
   * Generates interpretation for simple searches
   */
  generateSimpleInterpretation(keywords: string[], resultCount: number): string {
    const keywordStr = keywords.join(' and ');
    return `Found ${resultCount} slots matching: ${keywordStr}`;
  }
}