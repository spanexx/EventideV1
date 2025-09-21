import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GeminiContent {
  parts: Array<{
    text: string;
  }>;
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeminiAIService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
  private readonly model = 'gemini-2.0-flash';
  private readonly apiKey = environment.geminiApiKey;

  constructor() { }

  /**
   * Generate content using Gemini AI
   * @param prompt The text prompt to send to Gemini
   * @param options Optional configuration for the request
   * @returns Promise with the generated text response
   */
  async generateContent(
    prompt: string, 
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      systemInstruction?: string;
    }
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-goog-api-key': this.apiKey
    });

    const requestBody: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: options?.systemInstruction ? `${options.systemInstruction}\n\n${prompt}` : prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 1000,
        topK: 40,
        topP: 0.95
      }
    };

    try {
      const response = await lastValueFrom(
        this.http.post<GeminiResponse>(
          `${this.apiUrl}/${this.model}:generateContent`,
          requestBody,
          { headers }
        )
      );

      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          return candidate.content.parts[0].text;
        }
      }

      throw new Error('No valid response from Gemini API');
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced natural language search for calendar availability using Gemini
   * @param query Natural language search query
   * @param availabilityData Current availability data
   * @returns Enhanced search results with AI interpretation
   */
  async enhancedSearch(query: string, availabilityData: any[]): Promise<{
    interpretation: string;
    searchCriteria: any;
    suggestions: string[];
  }> {
    console.log('🤖 GeminiAI enhancedSearch started:', { query, dataLength: availabilityData.length });
    
    if (!this.apiKey) {
      console.warn('⚠️ GeminiAI: API key not configured');
      return {
        interpretation: 'AI service not configured - using basic search',
        searchCriteria: { fallback: true },
        suggestions: []
      };
    }

    const dataContext = this.createDataContext(availabilityData);
    console.log('📊 GeminiAI: Data context created:', dataContext.substring(0, 200) + '...');
    
    const systemInstruction = `You are a calendar search assistant. Analyze the user's natural language query and convert it into structured search criteria.
    
Always respond with valid JSON only, no additional text or formatting.`;

    const prompt = `User Query: "${query}"

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

Examples:
- "free slots tomorrow morning" → timeFilter: "morning", statusFilter: "available", dateFilter: {type: "tomorrow"}
- "meetings this week" → statusFilter: "booked", dateFilter: {type: "thisweek"}
- "long appointments" → durationFilter: {min: 60}`;

    console.log('📝 GeminiAI: Sending prompt to Gemini API...');
    
    try {
      const responseText = await this.generateContent(prompt, {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 500
      });

      console.log('✅ GeminiAI: Raw response received:', responseText);
      
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = responseText.trim().replace(/```json\s*|\s*```/g, '');
      console.log('🧹 GeminiAI: Cleaned response:', cleanedResponse);
      
      const aiResponse = JSON.parse(cleanedResponse);
      console.log('🎯 GeminiAI: Parsed AI response:', aiResponse);
      
      return aiResponse;
    } catch (error) {
      console.error('❌ GeminiAI: Error in enhancedSearch:', error);
      console.error('📋 GeminiAI: Query that failed:', query);
      return {
        interpretation: 'AI search failed - using basic search',
        searchCriteria: { fallback: true },
        suggestions: ['Try simpler terms like "available", "booked", or "today"']
      };
    }
  }

  /**
   * Generate smart search suggestions based on calendar data using Gemini
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

    const dataContext = this.createDataContext(availabilityData);
    const systemInstruction = `You are a calendar assistant. Generate helpful search suggestions based on calendar data.
    
Always respond with valid JSON only, no additional text or formatting.`;

    const prompt = `Based on the following calendar data, generate 5 helpful search suggestions that users might want to try.

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

Make suggestions specific and actionable based on the actual calendar data.`;

    try {
      const responseText = await this.generateContent(prompt, {
        systemInstruction,
        temperature: 0.5,
        maxOutputTokens: 300
      });

      const cleanedResponse = responseText.trim().replace(/```json\s*|\s*```/g, '');
      const suggestions = JSON.parse(cleanedResponse);
      return suggestions.suggestions || [];
    } catch (error) {
      console.error('Error generating search suggestions with Gemini:', error);
      return [
        'Show me available slots today',
        'Find free time this week',
        'What meetings do I have tomorrow?'
      ];
    }
  }

  /**
   * Summarize logs using Gemini AI
   * @param logs Array of log entries
   * @returns Summary of the logs
   */
  async summarizeLogs(logs: any[]): Promise<string> {
    if (!this.apiKey) {
      return 'AI service not configured.';
    }

    const logSummary = logs.map(log => `${log.timestamp} [${log.level}] ${log.message}`).join('\n');
    const systemInstruction = `You are a log summarization assistant. Focus on significant events like errors, failures, and key state changes.
    
If there are no significant events, issues, or concerns, respond with only: "No significant events to report."`;

    const prompt = `Please summarize the following log entries. Provide a brief overview of the main events, errors, and warnings.

The logs are:
---
${logSummary}
---`;

    try {
      return await this.generateContent(prompt, {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 200
      });
    } catch (error) {
      console.error('Error calling Gemini API for log summary:', error);
      return 'Failed to get summary from AI.';
    }
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
    
    return `Total slots: ${totalSlots}
Available slots: ${availableSlots}
Booked slots: ${bookedSlots}
Date range: ${minDate.toDateString()} to ${maxDate.toDateString()}
${timePatterns}`;
  }

  /**
   * Enhanced natural language search that returns filtered availability data
   * @param query Natural language search query
   * @param availabilityData Current availability data
   * @returns Filtered availability data based on AI interpretation
   */
  async enhancedSearchWithResults(query: string, availabilityData: any[]): Promise<any[]> {
    console.log('🔍 GeminiAI enhancedSearchWithResults started:', { query, dataLength: availabilityData.length });
    
    // Log sample data structure
    if (availabilityData.length > 0) {
      console.log('📋 GeminiAI: Sample data item:', availabilityData[0]);
      console.log('📋 GeminiAI: First 3 items:', availabilityData.slice(0, 3));
    }
    
    try {
      // Create a data context for the AI
      const dataContext = availabilityData.map((item, index) => {
        const contextItem = `Date: ${item.date}, Start: ${item.startTime}, End: ${item.endTime}, Service: ${item.service?.name || 'N/A'}, Available: ${item.isAvailable}`;
        if (index < 3) {
          console.log(`📊 GeminiAI: Data item ${index}:`, contextItem);
        }
        return contextItem;
      }).join('\n');
      
      console.log('📊 GeminiAI: Total data context length:', dataContext.length);
      console.log('📊 GeminiAI: Data context preview:', dataContext.substring(0, 300) + '...');

      const prompt = `
Analyze this availability data and return ONLY the items that match the search query: "${query}"

Availability Data:
${dataContext}

Return ONLY a JSON array of objects with these exact fields for matching items:
- date (YYYY-MM-DD format)
- startTime (HH:MM format) 
- endTime (HH:MM format)
- isAvailable (boolean)
- service (object with name property if available)

If no items match, return an empty array [].
Return ONLY valid JSON, no explanations.`;

      console.log('📝 GeminiAI: Sending prompt (first 500 chars):', prompt.substring(0, 500) + '...');

      const response = await this.http.post<any>(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
        {
          contents: [{
            parts: [{ text: prompt }]
          }]
        },
        {
          params: { key: this.apiKey },
          headers: { 'Content-Type': 'application/json' }
        }
      ).toPromise();

      console.log('🌐 GeminiAI: Full API response:', response);
      
      const responseText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      console.log('✅ GeminiAI: Raw response text:', responseText);
      
      // Clean the response to extract JSON
      const cleanedResponse = responseText.replace(/```json\n?|```\n?/g, '').trim();
      console.log('🧹 GeminiAI: Cleaned response:', cleanedResponse);
      
      let result;
      try {
        result = JSON.parse(cleanedResponse);
        console.log('📋 GeminiAI: Successfully parsed result:', result);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.log('🔍 Raw text that failed to parse:', cleanedResponse);
        return [];
      }
      
      console.log('📈 GeminiAI: Result is array:', Array.isArray(result));
      console.log('📈 GeminiAI: Result length:', result?.length || 0);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log('🎯 GeminiAI: First result item:', result[0]);
        result.forEach((item, index) => {
          console.log(`🎯 GeminiAI: Result ${index}:`, {
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            isAvailable: item.isAvailable,
            service: item.service
          });
        });
      }
      
      const finalResult = Array.isArray(result) ? result : [];
      console.log('🏁 GeminiAI: Final result being returned:', finalResult);
      return finalResult;

    } catch (error: any) {
      console.error('❌ GeminiAI enhancedSearchWithResults error:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        status: error?.status,
        statusText: error?.statusText
      });
      return [];
    }
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