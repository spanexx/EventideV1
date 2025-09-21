import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private http = inject(HttpClient);
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private apiKey = environment.openRouterApiKey;

  constructor() { }

  async summarize(logs: any[]): Promise<string> {
    if (!this.apiKey) {
      return 'API key not configured.';
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    const prompt = this.createLogPrompt(logs);

    const body = {
      model: 'deepseek/deepseek-r1-0528:free',
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    try {
      const response = await lastValueFrom(this.http.post<OpenRouterResponse>(this.apiUrl, body, { headers }));
      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      return 'Failed to get summary from AI.';
    }
  }

  /**
   * Enhanced natural language search for calendar availability
   * @param query Natural language search query
   * @param availabilityData Current availability data
   * @returns Enhanced search results with AI interpretation
   */
  async enhancedSearch(query: string, availabilityData: any[]): Promise<{
    interpretation: string;
    searchCriteria: any;
    suggestions: string[];
  }> {
    if (!this.apiKey) {
      return {
        interpretation: 'AI service not configured - using basic search',
        searchCriteria: { fallback: true },
        suggestions: []
      };
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    const prompt = this.createSearchPrompt(query, availabilityData);

    const body = {
      model: 'deepseek/deepseek-r1-0528:free',
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    try {
      const response = await lastValueFrom(this.http.post<OpenRouterResponse>(this.apiUrl, body, { headers }));
      const aiResponse = JSON.parse(response.choices[0].message.content);
      return aiResponse;
    } catch (error) {
      console.error('Error calling OpenRouter API for search:', error);
      return {
        interpretation: 'AI search failed - using basic search',
        searchCriteria: { fallback: true },
        suggestions: ['Try simpler terms like "available", "booked", or "today"']
      };
    }
  }

  /**
   * Generates smart search suggestions based on calendar data
   * @param availabilityData Current availability data
   * @returns Array of suggested search queries
   */
  async generateSearchSuggestions(availabilityData: any[]): Promise<string[]> {
    if (!this.apiKey || !availabilityData.length) {
      return [
        'Show me available slots today',
        'Find free time this week',
        'What meetings do I have tomorrow?'
      ];
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    const prompt = this.createSuggestionPrompt(availabilityData);

    const body = {
      model: 'deepseek/deepseek-r1-0528:free',
      messages: [
        { role: 'user', content: prompt }
      ]
    };

    try {
      const response = await lastValueFrom(this.http.post<OpenRouterResponse>(this.apiUrl, body, { headers }));
      const suggestions = JSON.parse(response.choices[0].message.content);
      return suggestions.suggestions || [];
    } catch (error) {
      console.error('Error generating search suggestions:', error);
      return [
        'Show me available slots today',
        'Find free time this week',
        'What meetings do I have tomorrow?'
      ];
    }
  }

  private createLogPrompt(logs: any[]): string {
    const logSummary = logs.map(log => `${log.timestamp} [${log.level}] ${log.message}`).join('\n');
    return `
      Please summarize the following log entries. Provide a brief overview of the main events, errors, and warnings.
      The logs are:
      ---\n      ${logSummary}
      ---
    `;
  }

  private createSearchPrompt(query: string, availabilityData: any[]): string {
    const dataContext = this.createDataContext(availabilityData);
    
    return `
      You are a calendar search assistant. Analyze the user's natural language query and convert it into structured search criteria.
      
      User Query: "${query}"
      
      Calendar Context:
      ${dataContext}
      
      Please respond with a JSON object containing:
      {
        "interpretation": "Human-readable interpretation of what the user is looking for",
        "searchCriteria": {
          "timeFilter": "morning|afternoon|evening|night|allday" or null,
          "statusFilter": "available|booked|all" or null,
          "dateFilter": {
            "type": "today|tomorrow|thisweek|nextweek|specific|range",
            "specificDate": "YYYY-MM-DD" or null,
            "startDate": "YYYY-MM-DD" or null,
            "endDate": "YYYY-MM-DD" or null
          } or null,
          "durationFilter": {
            "min": number_in_minutes or null,
            "max": number_in_minutes or null
          } or null,
          "keywords": ["array", "of", "relevant", "keywords"]
        },
        "suggestions": ["array of 3-5 related search suggestions the user might find helpful"]
      }
      
      Examples of queries and expected responses:
      - "free slots tomorrow morning" → timeFilter: "morning", statusFilter: "available", dateFilter: {type: "tomorrow"}
      - "meetings this week" → statusFilter: "booked", dateFilter: {type: "thisweek"}
      - "long appointments" → durationFilter: {min: 60}
      
      Respond only with valid JSON.
    `;
  }

  private createSuggestionPrompt(availabilityData: any[]): string {
    const dataContext = this.createDataContext(availabilityData);
    
    return `
      Based on the following calendar data, generate 5 helpful search suggestions that users might want to try.
      
      Calendar Context:
      ${dataContext}
      
      Generate natural language search queries that would be useful for this calendar. Focus on:
      - Finding available time slots
      - Checking specific dates or time periods
      - Finding meetings or booked slots
      - Duration-based searches
      
      Respond with JSON:
      {
        "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"]
      }
      
      Make suggestions specific and actionable based on the actual calendar data.
    `;
  }

  private createDataContext(availabilityData: any[]): string {
    if (!availabilityData || availabilityData.length === 0) {
      return 'No calendar data available';
    }

    const totalSlots = availabilityData.length;
    const bookedSlots = availabilityData.filter(slot => slot.isBooked).length;
    const availableSlots = totalSlots - bookedSlots;
    
    // Get date range
    const dates = availabilityData.map(slot => new Date(slot.startTime));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Get time patterns
    const timePatterns = this.analyzeTimePatterns(availabilityData);
    
    return `
      Total slots: ${totalSlots}
      Available slots: ${availableSlots}
      Booked slots: ${bookedSlots}
      Date range: ${minDate.toDateString()} to ${maxDate.toDateString()}
      ${timePatterns}
    `;
  }

  private analyzeTimePatterns(availabilityData: any[]): string {
    const timeSlots = {
      morning: 0, // 6-12
      afternoon: 0, // 12-18
      evening: 0, // 18-22
      night: 0 // 22-6
    };

    availabilityData.forEach(slot => {
      const hour = new Date(slot.startTime).getHours();
      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
      else if (hour >= 18 && hour < 22) timeSlots.evening++;
      else timeSlots.night++;
    });

    return `Time distribution: Morning(${timeSlots.morning}), Afternoon(${timeSlots.afternoon}), Evening(${timeSlots.evening}), Night(${timeSlots.night})`;
  }
}
