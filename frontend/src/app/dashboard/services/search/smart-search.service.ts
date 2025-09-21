import { Injectable, inject } from '@angular/core';
import { Availability } from '../../models/availability.models';
import { SmartCalendarLoggerService } from '../smart-calendar-logger.service';
import { GeminiAIService } from '../../../services/gemini-ai.service';
import { SearchFilterService } from '../';
import { DateParserService } from './date-parser.service';
import { TemporalParserService } from './temporal-parser.service';
import { KeywordMatcherService } from './keyword-matcher.service';
import { SuggestionGeneratorService } from './suggestion-generator.service';

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
  private dateParser = inject(DateParserService);
  private temporalParser = inject(TemporalParserService);
  private keywordMatcher = inject(KeywordMatcherService);
  private suggestionGenerator = inject(SuggestionGeneratorService);

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
        suggestions: this.suggestionGenerator.generateContextualSuggestions(calendarData)
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
    
    // Parse query for keywords
    const { criteria, matchedKeywords } = this.keywordMatcher.matchKeywords(queryLower);
    
    // Handle temporal day references (this/next/last + day)
    const temporalDayMatch = this.temporalParser.parseTemporalDayReference(queryLower);
    if (temporalDayMatch) {
      criteria.dateFilter = { 
        type: 'specific', 
        specificDate: temporalDayMatch.targetDate 
      };
      matchedKeywords.push(temporalDayMatch.originalPhrase);
      console.log('🗓️ SmartSearch: Temporal day reference detected:', temporalDayMatch);
    }
    
    // Handle specific date patterns (e.g., "10/09/2025", "2025-10-09", "Oct 9, 2025")
    const specificDateMatch = this.dateParser.parseSpecificDate(queryLower);
    if (specificDateMatch) {
      criteria.dateFilter = { 
        type: 'specific', 
        specificDate: specificDateMatch.date 
      };
      matchedKeywords.push(specificDateMatch.originalPhrase);
      console.log('📅 SmartSearch: Specific date detected:', specificDateMatch);
    }
    
    // Handle month-based patterns (e.g., "October", "Oct 2025", "October 2025")
    const monthMatch = this.dateParser.parseMonthReference(queryLower);
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
    if (criteria.showAll || (matchedKeywords.includes('all') && matchedKeywords.length <= 2)) {
      return {
        results: calendarData,
        interpretation: `Showing all ${calendarData.length} slots`,
        suggestions: this.suggestionGenerator.generateContextualSuggestions(calendarData)
      };
    }
    
    // If no simple keywords found, or query is complex, use AI
    if (matchedKeywords.length === 0 || this.keywordMatcher.isComplexQuery(queryLower)) {
      return null;
    }
    
    console.log('🚀 SmartSearch: Simple search detected:', { matchedKeywords, criteria });
    
    // Apply the simple criteria using filter service
    const results = this.filterService.applySimpleCriteria(calendarData, criteria);
    
    // Prepare navigation info if a specific date/month was found
    let navigation: { date: string; view?: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth' } | undefined;
    
    // Check if this is a week-related search
    const isWeekSearch = criteria.dateFilter && 
      (criteria.dateFilter.type === 'thisweek' || 
       criteria.dateFilter.type === 'nextweek' || 
       criteria.dateFilter.type === 'lastweek');
    
    if (isWeekSearch) {
      // For week searches, use timeGridWeek view
      // Calculate the correct start date based on the week type
      const now = new Date();
      let startOfWeek: Date;
      
      switch (criteria.dateFilter.type) {
        case 'thisweek':
          startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          break;
        case 'nextweek':
          startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() + 7);
          break;
        case 'lastweek':
          startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay() - 7);
          break;
        default:
          startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
      }
      
      startOfWeek.setHours(0, 0, 0, 0);
      
      navigation = {
        date: startOfWeek.toISOString().split('T')[0],
        view: 'timeGridWeek'
      };
    } else if (criteria.dateFilter && criteria.dateFilter.specificDate) {
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
      interpretation: this.suggestionGenerator.generateSimpleInterpretation(matchedKeywords, results.length),
      suggestions: this.suggestionGenerator.generateContextualSuggestions(calendarData, matchedKeywords),
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
      
      // Check if this is a week-related search from AI response
      const isWeekSearch = aiResponse.searchCriteria?.dateFilter && 
        (aiResponse.searchCriteria.dateFilter.type === 'thisweek' || 
         aiResponse.searchCriteria.dateFilter.type === 'nextweek' || 
         aiResponse.searchCriteria.dateFilter.type === 'lastweek');
      
      if (isWeekSearch) {
        // For week searches, use timeGridWeek view
        // Calculate the correct start date based on the week type
        const now = new Date();
        let startOfWeek: Date;
        
        switch (aiResponse.searchCriteria.dateFilter.type) {
          case 'thisweek':
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            break;
          case 'nextweek':
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + 7);
            break;
          case 'lastweek':
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() - 7);
            break;
          default:
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
        }
        
        startOfWeek.setHours(0, 0, 0, 0);
        
        navigation = {
          date: startOfWeek.toISOString().split('T')[0],
          view: 'timeGridWeek'
        };
      } else if (aiResponse.searchCriteria?.dateFilter?.specificDate) {
        // Determine view based on criteria (if it's a month reference, use month view)
        const isMonthReference = this.keywordMatcher.isMonthReferenceQuery(query) || 
                                aiResponse.searchCriteria.dateFilter.subtype === 'month';
        navigation = {
          date: aiResponse.searchCriteria.dateFilter.specificDate,
          view: isMonthReference ? 'dayGridMonth' : 'timeGridDay'
        };
      } else {
        // Try to parse date from the query directly
        const specificDateMatch = this.dateParser.parseSpecificDate(query.toLowerCase());
        const monthMatch = this.dateParser.parseMonthReference(query.toLowerCase());
        
        // Check if this is a week-related search from direct parsing
        const isDirectWeekSearch = this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()] && 
          this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter && 
          (this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter.type === 'thisweek' || 
           this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter.type === 'nextweek' || 
           this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter.type === 'lastweek');
        
        if (isDirectWeekSearch) {
          // For week searches, use timeGridWeek view
          const now = new Date();
          let startOfWeek: Date;
          
          // Get the week type from the simple keywords
          const weekType = this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter.type;
          
          switch (weekType) {
            case 'thisweek':
              startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay());
              break;
            case 'nextweek':
              startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay() + 7);
              break;
            case 'lastweek':
              startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay() - 7);
              break;
            default:
              startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay());
          }
          
          startOfWeek.setHours(0, 0, 0, 0);
          
          navigation = {
            date: startOfWeek.toISOString().split('T')[0],
            view: 'timeGridWeek'
          };
        } else if (monthMatch) {
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
      const specificDateMatch = this.dateParser.parseSpecificDate(query.toLowerCase());
      const monthMatch = this.dateParser.parseMonthReference(query.toLowerCase());
      
      // Check if this is a week-related search
      const isWeekSearch = this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()] && 
        this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter && 
        (this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter.type === 'thisweek' || 
         this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter.type === 'nextweek' || 
         this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter.type === 'lastweek');
      
      if (isWeekSearch) {
        // For week searches, use timeGridWeek view
        const now = new Date();
        let startOfWeek: Date;
        
        // Get the week type from the simple keywords
        const weekType = this.keywordMatcher.getSimpleKeywords()[query.toLowerCase()].dateFilter.type;
        
        switch (weekType) {
          case 'thisweek':
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            break;
          case 'nextweek':
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + 7);
            break;
          case 'lastweek':
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() - 7);
            break;
          default:
            startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
        }
        
        startOfWeek.setHours(0, 0, 0, 0);
        
        navigation = {
          date: startOfWeek.toISOString().split('T')[0],
          view: 'timeGridWeek'
        };
      } else if (monthMatch) {
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
   * Generate search suggestions using AI or fallback to simple suggestions
   */
  async generateSearchSuggestions(calendarData: Availability[]): Promise<string[]> {
    try {
      return await this.geminiAI.generateSearchSuggestions(calendarData);
    } catch (error) {
      this.logger.error('SmartSearchService', 'Failed to generate AI suggestions', error);
      return this.suggestionGenerator.generateSimpleSearchSuggestions(calendarData);
    }
  }
}
