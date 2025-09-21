import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemporalParserService {
  /**
   * Parses temporal day references like "this friday", "next monday", "last tuesday"
   * Week starts from Sunday (0) to Saturday (6)
   */
  parseTemporalDayReference(query: string): { targetDate: string; originalPhrase: string } | null {
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
}