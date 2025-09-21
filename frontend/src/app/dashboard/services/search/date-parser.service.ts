import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateParserService {
  /**
   * Parses specific date patterns like "10/09/2025", "2025-10-09", "Oct 9, 2025"
   */
  parseSpecificDate(query: string): { date: string; originalPhrase: string } | null {
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
  parseMonthReference(query: string): { date: string; originalPhrase: string } | null {
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