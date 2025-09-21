import { Injectable, inject } from '@angular/core';
import { Availability } from '../../models/availability.models';
import { SmartCalendarLoggerService } from '../smart-calendar-logger.service';

@Injectable({
  providedIn: 'root'
})
export class SearchFilterService {
  private logger = inject(SmartCalendarLoggerService);

  /**
   * Applies simple search criteria for fast keyword searches
   */
  applySimpleCriteria(calendarData: Availability[], criteria: any): Availability[] {
    let results = [...calendarData];
    
    // Apply status filter
    if (criteria.statusFilter) {
      if (criteria.statusFilter === 'available') {
        results = results.filter(slot => !slot.isBooked);
      } else if (criteria.statusFilter === 'booked') {
        results = results.filter(slot => slot.isBooked);
      }
    }
    
    // Apply time filter
    if (criteria.timeFilter) {
      results = this.applyTimeFilter(results, criteria.timeFilter);
    }
    
    // Apply day of week filter
    if (criteria.dayOfWeek !== undefined) {
      results = results.filter(slot => {
        const slotDay = new Date(slot.startTime).getDay();
        return slotDay === criteria.dayOfWeek;
      });
    }
    
    // Apply date filter
    if (criteria.dateFilter) {
      results = this.applyDateFilter(results, criteria.dateFilter);
    }
    
    return results;
  }

  /**
   * Applies enhanced search criteria from AI interpretation
   */
  applyEnhancedCriteria(calendarData: Availability[], criteria: any): Availability[] {
    console.log('🔍 SearchFilter: Applying enhanced search criteria');
    console.log('📊 Original data length:', calendarData.length);
    console.log('🕵️ Search criteria received:', JSON.stringify(criteria, null, 2));
    
    let filteredData = [...calendarData];
    console.log('📊 Step 0 - Initial data:', filteredData.length);

    // Apply status filter
    if (criteria.statusFilter) {
      console.log('📊 Applying status filter:', criteria.statusFilter);
      const beforeCount = filteredData.length;
      
      switch (criteria.statusFilter) {
        case 'available':
          filteredData = filteredData.filter(slot => !slot.isBooked);
          break;
        case 'booked':
          filteredData = filteredData.filter(slot => slot.isBooked);
          break;
      }
      
      console.log(`📊 Status filter applied: ${beforeCount} → ${filteredData.length}`);
      this.logSampleResult('status filter', filteredData);
    }

    // Apply time filter
    if (criteria.timeFilter) {
      console.log('📊 Applying time filter:', criteria.timeFilter);
      const beforeCount = filteredData.length;
      filteredData = this.applyTimeFilter(filteredData, criteria.timeFilter);
      console.log(`📊 Time filter applied: ${beforeCount} → ${filteredData.length}`);
      this.logSampleResult('time filter', filteredData);
    }

    // Apply date filter
    if (criteria.dateFilter) {
      console.log('📊 Applying date filter:', criteria.dateFilter);
      const beforeCount = filteredData.length;
      filteredData = this.applyDateFilter(filteredData, criteria.dateFilter);
      console.log(`📊 Date filter applied: ${beforeCount} → ${filteredData.length}`);
      this.logSampleResult('date filter', filteredData);
    }

    // Apply duration filter
    if (criteria.durationFilter) {
      console.log('📊 Applying duration filter:', criteria.durationFilter);
      const beforeCount = filteredData.length;
      filteredData = this.applyDurationFilter(filteredData, criteria.durationFilter);
      console.log(`📊 Duration filter applied: ${beforeCount} → ${filteredData.length}`);
      this.logSampleResult('duration filter', filteredData);
    }

    // Apply keyword search
    if (criteria.keywords && criteria.keywords.length > 0) {
      console.log('📊 Applying keyword filter:', criteria.keywords);
      const beforeCount = filteredData.length;
      filteredData = this.applyKeywordFilter(filteredData, criteria.keywords);
      console.log(`📊 Keyword filter applied: ${beforeCount} → ${filteredData.length}`);
      this.logSampleResult('keyword filter', filteredData);
    }

    // Check for fallback scenario
    if (criteria.fallback) {
      console.log('⚠️ SearchFilter: Fallback mode detected - returning original data');
      return calendarData;
    }

    console.log('🏁 SearchFilter: Final filtered result:', {
      originalCount: calendarData.length,
      finalCount: filteredData.length,
      sampleResult: filteredData.length > 0 ? filteredData[0] : 'No results'
    });

    return filteredData;
  }

  /**
   * Applies time-based filtering
   */
  applyTimeFilter(data: Availability[], timeFilter: string): Availability[] {
    console.log('⏰ SearchFilter: Applying time filter:', timeFilter);
    console.log('⏰ Sample data before time filter:', data.length > 0 ? {
      startTime: data[0].startTime,
      hour: new Date(data[0].startTime).getHours()
    } : 'No data');
    
    const result = data.filter(slot => {
      const hour = new Date(slot.startTime).getHours();
      let matches = false;
      
      switch (timeFilter) {
        case 'morning': matches = hour >= 6 && hour < 12; break;
        case 'afternoon': matches = hour >= 12 && hour < 18; break;
        case 'evening': matches = hour >= 18 && hour < 22; break;
        case 'night': matches = hour >= 22 || hour < 6; break;
        case 'allday': matches = true; break;
        default: matches = true; break;
      }
      
      if (data.length <= 5) { // Only log details for small datasets
        console.log(`⏰ Slot at ${hour}:00 ${matches ? 'MATCHES' : 'REJECTED'} filter '${timeFilter}'`);
      }
      
      return matches;
    });
    
    console.log(`⏰ Time filter result: ${data.length} → ${result.length}`);
    return result;
  }

  /**
   * Applies date-based filtering
   */
  applyDateFilter(data: Availability[], dateFilter: any): Availability[] {
    console.log('📅 SearchFilter: Applying date filter:', dateFilter);
    
    const now = new Date();
    console.log('📅 Current date/time:', now.toISOString());
    
    if (data.length > 0) {
      console.log('📅 Sample data dates:', data.slice(0, 3).map(slot => ({
        startTime: slot.startTime,
        startTimeISO: new Date(slot.startTime).toISOString(),
        startTimeLocal: new Date(slot.startTime).toLocaleString()
      })));
    }
    
    let result: Availability[] = [];
    
    switch (dateFilter.type) {
      case 'today':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setDate(endOfToday.getDate() + 1);
        
        console.log('📅 Today range:', { start: today.toISOString(), end: endOfToday.toISOString() });
        
        result = data.filter(slot => {
          const slotDate = new Date(slot.startTime);
          const matches = slotDate >= today && slotDate < endOfToday;
          if (data.length <= 10) {
            console.log(`📅 Slot ${slotDate.toISOString()} ${matches ? 'MATCHES' : 'REJECTED'} today filter`);
          }
          return matches;
        });
        break;
        
      case 'tomorrow':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
        
        console.log('📅 Tomorrow range:', { start: tomorrow.toISOString(), end: endOfTomorrow.toISOString() });
        
        result = data.filter(slot => {
          const slotDate = new Date(slot.startTime);
          const matches = slotDate >= tomorrow && slotDate < endOfTomorrow;
          if (data.length <= 10) {
            console.log(`📅 Slot ${slotDate.toISOString()} ${matches ? 'MATCHES' : 'REJECTED'} tomorrow filter`);
          }
          return matches;
        });
        break;
        
      case 'thisweek':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        
        console.log('📅 This week range:', { start: startOfWeek.toISOString(), end: endOfWeek.toISOString() });
        
        result = data.filter(slot => {
          const slotDate = new Date(slot.startTime);
          const matches = slotDate >= startOfWeek && slotDate < endOfWeek;
          return matches;
        });
        break;
        
      case 'nextweek':
        const startOfNextWeek = new Date(now);
        startOfNextWeek.setDate(now.getDate() - now.getDay() + 7);
        startOfNextWeek.setHours(0, 0, 0, 0);
        const endOfNextWeek = new Date(startOfNextWeek);
        endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);
        
        console.log('📅 Next week range:', { start: startOfNextWeek.toISOString(), end: endOfNextWeek.toISOString() });
        
        result = data.filter(slot => {
          const slotDate = new Date(slot.startTime);
          const matches = slotDate >= startOfNextWeek && slotDate < endOfNextWeek;
          return matches;
        });
        break;
        
      case 'specific':
        if (dateFilter.specificDate) {
          const targetDate = new Date(dateFilter.specificDate);
          
          // Check if this is a month-only search based on the filter subtype
          if (dateFilter.subtype === 'month') {
            // For month searches, filter for the entire month
            const targetYear = targetDate.getFullYear();
            const targetMonth = targetDate.getMonth(); // 0-11
            
            console.log('📅 Month search detected:', { year: targetYear, month: targetMonth });
            
            result = data.filter(slot => {
              const slotDate = new Date(slot.startTime);
              const matches = slotDate.getFullYear() === targetYear && 
                             slotDate.getMonth() === targetMonth;
              if (data.length <= 10) {
                console.log(`📅 Slot ${slotDate.toISOString()} ${matches ? 'MATCHES' : 'REJECTED'} month filter ${targetYear}-${targetMonth}`);
              }
              return matches;
            });
          } else {
            // For specific date searches, filter for that day
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            console.log('📅 Specific date range:', { start: targetDate.toISOString(), end: nextDay.toISOString() });
            
            result = data.filter(slot => {
              const slotDate = new Date(slot.startTime);
              const matches = slotDate >= targetDate && slotDate < nextDay;
              if (data.length <= 10) {
                console.log(`📅 Slot ${slotDate.toISOString()} ${matches ? 'MATCHES' : 'REJECTED'} specific date filter`);
              }
              return matches;
            });
          }
        } else {
          result = data;
        }
        break;
        
      case 'range':
        if (dateFilter.startDate && dateFilter.endDate) {
          const start = new Date(dateFilter.startDate);
          const end = new Date(dateFilter.endDate);
          
          console.log('📅 Date range:', { start: start.toISOString(), end: end.toISOString() });
          
          result = data.filter(slot => {
            const slotDate = new Date(slot.startTime);
            const matches = slotDate >= start && slotDate <= end;
            return matches;
          });
        } else {
          result = data;
        }
        break;
        
      default:
        console.log('📅 Unknown date filter type, returning all data');
        result = data;
    }
    
    console.log(`📅 Date filter result: ${data.length} → ${result.length}`);
    return result;
  }

  /**
   * Applies duration-based filtering
   */
  applyDurationFilter(data: Availability[], durationFilter: any): Availability[] {
    return data.filter(slot => {
      const duration = (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / (1000 * 60);
      
      if (durationFilter.min && duration < durationFilter.min) return false;
      if (durationFilter.max && duration > durationFilter.max) return false;
      
      return true;
    });
  }

  /**
   * Applies keyword-based filtering with enhanced searchable text
   */
  applyKeywordFilter(data: Availability[], keywords: string[]): Availability[] {
    console.log('🔍 SearchFilter: Applying keyword filter:', keywords);
    
    const result = data.filter(slot => {
      // Create comprehensive searchable text including day names and time periods
      const startDate = new Date(slot.startTime);
      const endDate = new Date(slot.endTime);
      
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[startDate.getDay()];
      
      const hour = startDate.getHours();
      let timePeriod = '';
      if (hour >= 6 && hour < 12) timePeriod = 'morning';
      else if (hour >= 12 && hour < 18) timePeriod = 'afternoon';
      else if (hour >= 18 && hour < 22) timePeriod = 'evening';
      else timePeriod = 'night';
      
      const searchableText = `
        ${slot.id} 
        ${slot.isBooked ? 'booked' : 'available'} 
        ${dayOfWeek} 
        ${timePeriod} 
        ${startDate.toLocaleDateString()} 
        ${startDate.toLocaleTimeString()} 
        ${endDate.toLocaleTimeString()}
        slots
      `.toLowerCase();
      
      const matches = keywords.some(keyword => {
        const keywordLower = keyword.toLowerCase();
        const found = searchableText.includes(keywordLower);
        
        if (data.length <= 10) { // Only log for small datasets
          console.log(`🔍 Keyword '${keyword}' ${found ? 'FOUND' : 'NOT FOUND'} in slot ${dayOfWeek} ${timePeriod}`);
        }
        
        return found;
      });
      
      return matches;
    });
    
    console.log(`🔍 Keyword filter result: ${data.length} → ${result.length}`);
    
    // If no results found with keyword matching, return all data (keywords should be supplementary, not restrictive)
    if (result.length === 0 && keywords.length > 0) {
      console.log('⚠️ SearchFilter: No keyword matches found, returning all filtered data (keywords are descriptive, not restrictive)');
      return data;
    }
    
    return result;
  }

  /**
   * Logs sample results for debugging
   */
  private logSampleResult(filterName: string, data: Availability[]): void {
    if (data.length > 0) {
      console.log(`📊 Sample after ${filterName}:`, data[0]);
    }
  }
}