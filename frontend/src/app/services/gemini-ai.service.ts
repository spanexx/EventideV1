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
    const timePatterns = this.analyzeTimeDistribution(availabilityData);
    
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

  /**
   * Analyze availability conflicts using AI
   * @param availabilityData Array of availability slots
   * @returns Conflict analysis with suggestions
   */
  async analyzeAvailabilityConflicts(availabilityData: any[]): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      affectedSlots: any[];
      suggestions: string[];
    }>;
    summary: string;
  }> {
    if (!this.apiKey || !availabilityData.length) {
      return {
        hasConflicts: false,
        conflicts: [],
        summary: 'AI service not available for conflict analysis'
      };
    }

    const dataContext = this.createConflictAnalysisContext(availabilityData);
    const systemInstruction = `You are a calendar conflict detection specialist. Analyze availability data for conflicts, overlaps, and scheduling issues.
    
Always respond with valid JSON only, no additional text or formatting.`;

    const prompt = `Analyze the following availability data for conflicts and scheduling issues:

${dataContext}

Look for:
- Overlapping time slots
- Back-to-back bookings without buffer time
- Unusual patterns or gaps
- Resource conflicts
- Capacity issues

Respond with JSON:
{
  "hasConflicts": boolean,
  "conflicts": [
    {
      "type": "overlap|buffer|capacity|pattern",
      "severity": "low|medium|high",
      "description": "Clear description of the conflict",
      "affectedSlots": ["array of affected slot identifiers"],
      "suggestions": ["array of suggestions to resolve"]
    }
  ],
  "summary": "Overall summary of conflict analysis"
}`;

    try {
      const responseText = await this.generateContent(prompt, {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 800
      });

      const cleanedResponse = responseText.trim().replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error analyzing conflicts with AI:', error);
      return {
        hasConflicts: false,
        conflicts: [],
        summary: 'Conflict analysis failed - manual review recommended'
      };
    }
  }

  /**
   * Generate optimized scheduling suggestions using AI
   * @param constraints Scheduling constraints and preferences
   * @param availabilityData Current availability data
   * @returns Optimization suggestions
   */
  async optimizeScheduleSlots(constraints: {
    preferredTimes?: string[];
    bufferTime?: number;
    maxDailyBookings?: number;
    workingHours?: { start: string; end: string };
    priorities?: string[];
  }, availabilityData: any[]): Promise<{
    optimizations: Array<{
      type: string;
      impact: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
      estimatedImprovement: string;
    }>;
    suggestedSchedule?: any[];
    summary: string;
  }> {
    if (!this.apiKey) {
      return {
        optimizations: [],
        summary: 'AI optimization service not available'
      };
    }

    const dataContext = this.createOptimizationContext(availabilityData, constraints);
    const systemInstruction = `You are a scheduling optimization expert. Analyze availability data and constraints to suggest optimal scheduling strategies.
    
Always respond with valid JSON only, no additional text or formatting.`;

    const prompt = `Analyze the scheduling data and suggest optimizations:

${dataContext}

Consider:
- Efficient time utilization
- Buffer time management
- Peak hours optimization
- Resource allocation
- Customer satisfaction
- Revenue optimization

Respond with JSON:
{
  "optimizations": [
    {
      "type": "time|buffer|capacity|revenue|efficiency",
      "impact": "low|medium|high",
      "description": "What optimization is suggested",
      "recommendation": "Specific action to take",
      "estimatedImprovement": "Expected benefit (e.g., '15% more bookings')"
    }
  ],
  "summary": "Overall optimization strategy summary"
}`;

    try {
      const responseText = await this.generateContent(prompt, {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 800
      });

      const cleanedResponse = responseText.trim().replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      return {
        optimizations: [],
        summary: 'Optimization analysis failed - manual review recommended'
      };
    }
  }

  /**
   * Validate availability input data using AI
   * @param inputData Availability data to validate
   * @returns Validation results with suggestions
   */
  async validateAvailabilityInput(inputData: any): Promise<{
    isValid: boolean;
    errors: Array<{
      field: string;
      type: string;
      message: string;
      severity: 'error' | 'warning' | 'info';
    }>;
    suggestions: string[];
    summary: string;
  }> {
    if (!this.apiKey) {
      return {
        isValid: true,
        errors: [],
        suggestions: [],
        summary: 'AI validation service not available'
      };
    }

    const systemInstruction = `You are a data validation specialist for calendar availability systems. Validate input data for correctness, consistency, and best practices.
    
Always respond with valid JSON only, no additional text or formatting.`;

    const prompt = `Validate the following availability input data:

${JSON.stringify(inputData, null, 2)}

Check for:
- Required field presence
- Data type correctness
- Logical consistency (e.g., start time before end time)
- Date/time format validity
- Business rule compliance
- Potential issues or improvements

Respond with JSON:
{
  "isValid": boolean,
  "errors": [
    {
      "field": "field name or path",
      "type": "required|format|logic|range|business",
      "message": "Clear error description",
      "severity": "error|warning|info"
    }
  ],
  "suggestions": ["array of improvement suggestions"],
  "summary": "Overall validation summary"
}`;

    try {
      const responseText = await this.generateContent(prompt, {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 600
      });

      const cleanedResponse = responseText.trim().replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error validating input with AI:', error);
      return {
        isValid: true,
        errors: [],
        suggestions: [],
        summary: 'AI validation failed - manual validation recommended'
      };
    }
  }

  /**
   * Analyze calendar patterns and trends using AI
   * @param availabilityData Historical availability data
   * @returns Pattern analysis with insights
   */
  async analyzeCalendarPatterns(availabilityData: any[]): Promise<{
    patterns: Array<{
      type: string;
      description: string;
      confidence: number;
      impact: string;
      recommendation: string;
    }>;
    trends: {
      bookingTrends: string;
      peakHours: string[];
      seasonality: string;
      utilization: string;
    };
    insights: string[];
    summary: string;
  }> {
    if (!this.apiKey || !availabilityData.length) {
      return {
        patterns: [],
        trends: {
          bookingTrends: 'Insufficient data for analysis',
          peakHours: [],
          seasonality: 'No seasonal patterns detected',
          utilization: 'Unable to calculate utilization'
        },
        insights: [],
        summary: 'AI pattern analysis not available'
      };
    }

    try {
      // Validate data format before processing
      this.validateAvailabilityData(availabilityData);
      
      const dataContext = this.createPatternAnalysisContext(availabilityData);
      const systemInstruction = `You are a calendar analytics expert. Analyze availability patterns, trends, and booking behaviors to provide actionable insights.
    
Always respond with valid JSON only, no additional text or formatting.`;

      const prompt = `Analyze the following calendar data for patterns and trends:

${dataContext}

Identify:
- Recurring patterns in bookings
- Peak and low-demand periods
- Seasonal trends
- Utilization patterns
- Opportunity areas
- Customer behavior insights

Respond with JSON:
{
  "patterns": [
    {
      "type": "daily|weekly|monthly|seasonal|behavioral",
      "description": "Pattern description",
      "confidence": number_0_to_100,
      "impact": "business impact description",
      "recommendation": "actionable recommendation"
    }
  ],
  "trends": {
    "bookingTrends": "trending up/down/stable with details",
    "peakHours": ["array of peak hour ranges"],
    "seasonality": "seasonal pattern description",
    "utilization": "utilization rate and insights"
  },
  "insights": ["array of key business insights"],
  "summary": "Executive summary of pattern analysis"
}`;

    try {
      const responseText = await this.generateContent(prompt, {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 1000
      });

      const cleanedResponse = responseText.trim().replace(/```json\s*|\s*```/g, '');
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error analyzing calendar patterns:', error);
      return {
        patterns: [],
        trends: {
          bookingTrends: 'Pattern analysis failed',
          peakHours: [],
          seasonality: 'Unable to detect seasonal patterns',
          utilization: 'Utilization analysis failed'
        },
        insights: [],
        summary: 'Pattern analysis failed - manual review recommended'
      };
    }
  } catch (error) {
    console.error('AI pattern analysis failed:', error);
    return {
      patterns: [],
      trends: {
        bookingTrends: 'Analysis failed - validation error',
        peakHours: [],
        seasonality: 'Analysis failed',
        utilization: 'Analysis failed'
      },
      insights: ['AI analysis temporarily unavailable'],
      summary: 'Pattern analysis failed due to data validation error'
    };
  }
}

  private createConflictAnalysisContext(availabilityData: any[]): string {
    try {
      // Validate input data
      if (!Array.isArray(availabilityData) || availabilityData.length === 0) {
        return 'No availability data provided for conflict analysis';
      }

      // Create a copy of the array to avoid mutating the original read-only data
      const sortedData = [...availabilityData].sort((a, b) => {
        // Handle both Date objects and string formats
        const timeA = a.startTime instanceof Date ? a.startTime.getTime() : new Date(a.date + ' ' + a.startTime).getTime();
        const timeB = b.startTime instanceof Date ? b.startTime.getTime() : new Date(b.date + ' ' + b.startTime).getTime();
        return timeA - timeB;
      });

    return sortedData.map((slot, index) => {
      // Format dates and times consistently
      let dateStr, startTimeStr, endTimeStr;
      
      if (slot.startTime instanceof Date) {
        dateStr = slot.startTime.toLocaleDateString();
        startTimeStr = slot.startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        endTimeStr = slot.endTime instanceof Date ? slot.endTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : slot.endTime;
      } else {
        dateStr = slot.date;
        startTimeStr = slot.startTime;
        endTimeStr = slot.endTime;
      }
      
      return `${index + 1}. ${dateStr} ${startTimeStr}-${endTimeStr} (${slot.isBooked ? 'BOOKED' : 'AVAILABLE'}) ${slot.service?.name || ''}`;
    }).join('\n');
    } catch (error) {
      console.error('Error creating conflict analysis context:', error);
      return 'Error processing availability data for conflict analysis';
    }
  }

  private createOptimizationContext(availabilityData: any[], constraints: any): string {
    const stats = this.calculateScheduleStats(availabilityData);
    
    return `Current Schedule Stats:
${JSON.stringify(stats, null, 2)}

Constraints:
${JSON.stringify(constraints, null, 2)}

Availability Data (sample):
${availabilityData.slice(0, 10).map(slot => {
      // Format dates and times consistently
      let dateStr, startTimeStr, endTimeStr;
      
      if (slot.startTime instanceof Date) {
        dateStr = slot.startTime.toLocaleDateString();
        startTimeStr = slot.startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        endTimeStr = slot.endTime instanceof Date ? slot.endTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : slot.endTime;
      } else {
        dateStr = slot.date;
        startTimeStr = slot.startTime;
        endTimeStr = slot.endTime;
      }
      
      return `${dateStr} ${startTimeStr}-${endTimeStr} (${slot.isBooked ? 'BOOKED' : 'AVAILABLE'})`;
    }).join('\n')}`;
  }

  private createPatternAnalysisContext(availabilityData: any[]): string {
    const stats = this.calculateScheduleStats(availabilityData);
    const timeDistribution = this.analyzeTimeDistribution(availabilityData);
    
    return `Schedule Statistics:
${JSON.stringify(stats, null, 2)}

Time Distribution:
${timeDistribution}

Data Points: ${availabilityData.length} slots`;
  }

  private calculateScheduleStats(availabilityData: any[]): any {
    const total = availabilityData.length;
    const booked = availabilityData.filter(slot => slot.isBooked).length;
    const available = total - booked;
    const utilization = total > 0 ? ((booked / total) * 100).toFixed(1) : '0';
    
    // Extract unique dates, handling both Date objects and string formats
    const dateStrings = availabilityData.map(slot => {
      if (slot.startTime instanceof Date) {
        return slot.startTime.toLocaleDateString();
      } else if (slot.date) {
        return slot.date;
      } else {
        // Fallback to extracting date from startTime if it's a string
        return slot.startTime ? slot.startTime.split(' ')[0] : 'unknown';
      }
    });
    const dates = [...new Set(dateStrings)];
    const averageSlotsPerDay = dates.length > 0 ? (total / dates.length).toFixed(1) : '0';
    
    return {
      totalSlots: total,
      bookedSlots: booked,
      availableSlots: available,
      utilizationRate: `${utilization}%`,
      uniqueDates: dates.length,
      averageSlotsPerDay
    };
  }

  private analyzeTimeDistribution(availabilityData: any[]): string {
    const timeSlots = {
      morning: 0,   // 6-12
      afternoon: 0, // 12-18
      evening: 0    // 18-22
    };

    availabilityData.forEach(slot => {
      // Handle both Date objects and string timestamps
      let hours: number;
      if (slot.startTime instanceof Date) {
        hours = slot.startTime.getHours();
      } else if (typeof slot.startTime === 'string') {
        const [hoursStr] = slot.startTime.split(':');
        hours = parseInt(hoursStr, 10);
      } else {
        console.warn('Invalid startTime format:', slot.startTime);
        return;
      }
      
      if (hours >= 6 && hours < 12) timeSlots.morning++;
      else if (hours >= 12 && hours < 18) timeSlots.afternoon++;
      else if (hours >= 18 && hours < 22) timeSlots.evening++;
    });

    return `Morning (6-12): ${timeSlots.morning}, Afternoon (12-18): ${timeSlots.afternoon}, Evening (18-22): ${timeSlots.evening}`;
  }

  /**
   * Validate availability data format to prevent runtime errors
   */
  private validateAvailabilityData(availabilityData: any[]): void {
    if (!Array.isArray(availabilityData)) {
      throw new Error('Availability data must be an array');
    }

    availabilityData.forEach((slot, index) => {
      if (!slot) {
        throw new Error(`Slot at index ${index} is null or undefined`);
      }
      
      if (!slot.startTime) {
        throw new Error(`Slot at index ${index} missing startTime`);
      }
      
      if (!slot.endTime) {
        throw new Error(`Slot at index ${index} missing endTime`);
      }

      // Validate that startTime and endTime are either Date objects or valid strings
      if (!(slot.startTime instanceof Date) && typeof slot.startTime !== 'string') {
        throw new Error(`Slot at index ${index} has invalid startTime format: ${typeof slot.startTime}`);
      }
      
      if (!(slot.endTime instanceof Date) && typeof slot.endTime !== 'string') {
        throw new Error(`Slot at index ${index} has invalid endTime format: ${typeof slot.endTime}`);
      }
    });
  }
}