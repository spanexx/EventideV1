import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CachingService } from '../../cache/caching.service';
import { 
  AIConflictAnalysis,
  AIPatternAnalysis,
  AIOptimizationResult,
  AIValidationResult,
  ScheduleConstraints
} from '../interfaces/ai-availability.interface';
import { Availability } from '../../../modules/availability/availability.schema';

@Injectable()
export class AiAvailabilityService {
  private readonly logger = new Logger(AiAvailabilityService.name);
  private readonly aiApiUrl: string;
  private readonly aiApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly cachingService: CachingService
  ) {
    this.aiApiUrl = this.configService.get<string>('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1');
    this.aiApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
  }

  private verifyConfig() {
    if (!this.aiApiKey) {
      throw new Error('AI service not configured');
    }
  }

  private async makeAIRequest(prompt: string, retry = 0): Promise<any> {
    this.verifyConfig();
    
    try {
      return await axios.post(
        `${this.aiApiUrl}/chat/completions`,
        {
          model: this.configService.get('OPENROUTER_MODEL', 'openai/gpt-4'),
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant specializing in schedule analysis and optimization. Respond with JSON only, no markdown formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
          max_tokens: 1000
        },
        {
          headers: {
            Authorization: `Bearer ${this.aiApiKey}`,
            'HTTP-Referer': this.configService.get('APP_URL'),
            'X-Title': this.configService.get('APP_NAME')
          },
          timeout: 10000 // 10 second timeout
        }
      );
    } catch (error) {
      if (retry < 2 && (error.response?.status === 429 || error.response?.status === 503)) {
        // Wait 2^retry seconds before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retry) * 1000));
        return this.makeAIRequest(prompt, retry + 1);
      }
      throw error;
    }
  }

  // First implementation of analyzeConflicts and analyzePatterns removed to avoid duplication

  private cleanJsonResponse(content: string): string {
    // Remove markdown code blocks and any other non-JSON formatting
    return content
      .replace(/```json\n?/g, '') // Remove ```json
      .replace(/```\n?/g, '')     // Remove closing ```
      .trim();                    // Remove any extra whitespace
  }

  private processAIResponse(response: any, type: 'conflicts' | 'patterns' | 'optimization'): any {
    try {
      if (!response?.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid AI response format');
      }

      const content = this.cleanJsonResponse(response.data.choices[0].message.content);
      const parsed = JSON.parse(content);

      // Validate the parsed response has required fields based on type
      switch (type) {
        case 'conflicts':
          if (!('hasConflicts' in parsed) || !Array.isArray(parsed.conflicts)) {
            throw new Error('Invalid conflicts response structure');
          }
          return parsed;

        case 'patterns':
          if (!Array.isArray(parsed.patterns) || !parsed.trends || !Array.isArray(parsed.insights)) {
            throw new Error('Invalid patterns response structure');
          }
          return parsed;

        case 'optimization':
          if (!Array.isArray(parsed.optimizations) || !parsed.summary) {
            throw new Error('Invalid optimization response structure');
          }
          return parsed;

        default:
          throw new Error(`Unknown response type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Error processing AI response: ${error.message}`);
      
      // Return safe default structures based on type
      if (type === 'conflicts') {
        return {
          hasConflicts: false,
          conflicts: [],
          summary: 'Failed to analyze conflicts. Manual review recommended.'
        };
      }
      if (type === 'patterns') {
        return {
          patterns: [],
          trends: { 
            bookingTrends: 'Analysis unavailable',
            peakHours: [],
            seasonality: 'Analysis unavailable',
            utilization: 'Analysis unavailable'
          },
          insights: ['AI analysis failed'],
          summary: 'Failed to analyze patterns. Manual review recommended.'
        };
      }
      return {
        optimizations: [],
        summary: 'Failed to generate optimization suggestions. Manual review recommended.'
      };
    }
  }
  

  /**
   * Check availability for given date and time
   */
  async checkAvailability(
    date: string | undefined,
    time: string | undefined,
    context: any
  ): Promise<any[]> {
    // TODO: Implement real availability check
    const cacheKey = `availability-${date}-${time}-${context.userId}`;
    
    try {
      const cached = await this.cachingService.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Mock response for now
      const slots = [{
        id: '1',
        startTime: new Date().toISOString(),
        duration: 30,
        providerId: context.userId,
        status: 'available'
      }];

      await this.cachingService.set(cacheKey, slots, 300);
      return slots;
    } catch (error) {
      this.logger.error('Error checking availability:', error);
      return [];
    }
  }

  /**
   * Book a slot for given date and time
   */
  async bookSlot(
    date: string | undefined,
    time: string | undefined,
    context: any
  ): Promise<any> {
    // TODO: Implement real booking logic
    try {
      return {
        id: Math.random().toString(36).substring(2, 15),
        startTime: new Date().toISOString(),
        duration: 30,
        providerId: context.userId,
        userId: context.userId,
        status: 'booked'
      };
    } catch (error) {
      this.logger.error('Error booking slot:', error);
      return { error: 'Failed to book slot' };
    }
  }

  // First implementation removed to avoid duplication

  /**
   * Optimize schedule using AI recommendations
   * Leverages existing error handling patterns
   */
  async optimizeSchedule(constraints: ScheduleConstraints, availabilityData: Availability[]): Promise<AIOptimizationResult> {
    const cacheKey = `ai-optimization-${this.generateDataHash(availabilityData)}-${this.generateConstraintsHash(constraints)}`;
    
    try {
      // Check cache first
      const cached = await this.cachingService.get<AIOptimizationResult>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached optimization result');
        return cached;
      }

      // Generate optimization using AI
      const optimization = await this.performOptimization(constraints, availabilityData);
      
      // Cache result
      await this.cachingService.set(cacheKey, optimization, 300);
      
      return optimization;
    } catch (error) {
      this.logger.error('Error generating optimization:', error);
      return {
        optimizations: [],
        summary: 'Optimization analysis failed - manual review recommended'
      };
    }
  }

  /**
   * Validate input data using AI
   * Follows existing validation patterns
   */
  async validateInput(inputData: any): Promise<AIValidationResult> {
    try {
      const validation = await this.performValidation(inputData);
      return validation;
    } catch (error) {
      this.logger.error('Error validating input:', error);
      return {
        isValid: true,
        errors: [],
        suggestions: [],
        summary: 'AI validation failed - manual validation recommended'
      };
    }
  }

  /**
   * Analyze patterns in schedule data
   * Uses existing caching strategy
   */
  async analyzeSchedulePatterns(availabilityData: Availability[]): Promise<AIPatternAnalysis> {
    if (!availabilityData?.length) {
      return {
        patterns: [],
        trends: {
          bookingTrends: 'No data available for analysis',
          peakHours: [],
          seasonality: 'No seasonal data available',
          utilization: 'No utilization data available'
        },
        insights: ['No availability data to analyze'],
        summary: 'No data available for pattern analysis'
      };
    }

    const cacheKey = `ai-patterns-${this.generateDataHash(availabilityData)}`;
    
    try {
      // Check cache first
      const cached = await this.cachingService.get<AIPatternAnalysis>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached pattern analysis');
        return cached;
      }

      const prompt = `Analyze these availability slots for patterns and trends. Format data as JSON with the following structure:
{
  "patterns": [
    {
      "type": "daily|weekly|monthly|seasonal|behavioral",
      "description": "Pattern description",
      "confidence": 0-100,
      "impact": "Business impact description",
      "recommendation": "Action to take"
    }
  ],
  "trends": {
    "bookingTrends": "Overall booking trend analysis",
    "peakHours": ["Peak hour ranges"],
    "seasonality": "Seasonal pattern description",
    "utilization": "Utilization analysis"
  },
  "insights": ["Key insight 1", "Key insight 2"],
  "summary": "Overall analysis summary"
}

Data to analyze:
${JSON.stringify(availabilityData, null, 2)}`;

      const response = await this.makeAIRequest(prompt);
      const result = this.processAIResponse(response, 'patterns');
      
      // Cache successful results for 5 minutes
      await this.cachingService.set(cacheKey, result, 300);
      
      return result;
    } catch (error) {
      this.logger.error('Error analyzing patterns:', error);
      throw error; // Let the calling code handle the error
    }
  }

  /**
   * Analyze conflicts in schedule data
   * Uses existing caching strategy
   */
  async analyzeScheduleConflicts(availabilityData: Availability[]): Promise<AIConflictAnalysis> {
    if (!this.aiApiKey) {
      throw new Error('AI service not configured');
    }

    try {
      const dataContext = this.createConflictAnalysisContext(availabilityData);
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

      const response = await this.makeAIRequest(prompt);
      
      if (!response?.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid AI response format');
      }

      const result = JSON.parse(response.data.choices[0].message.content);
      
      if (!result.hasConflicts || !Array.isArray(result.conflicts) || !result.summary) {
        throw new Error('Invalid conflict analysis result format');
      }

      return result;
    } catch (error) {
      this.logger.error('Error analyzing conflicts:', error);
      return {
        hasConflicts: false,
        conflicts: [],
        summary: `AI analysis failed: ${error.message}. Manual review recommended.`
      };
    }
  }

  /**
   * Perform optimization using AI
   */
  private async performOptimization(constraints: ScheduleConstraints, availabilityData: Availability[]): Promise<AIOptimizationResult> {
    const dataContext = this.createOptimizationContext(availabilityData, constraints);
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

    const response = await this.callGeminiAPI(prompt, {
      temperature: 0.4,
      maxOutputTokens: 800
    });

    return JSON.parse(this.cleanAIResponse(response));
  }

  /**
   * Perform validation using AI
   */
  private async performValidation(inputData: any): Promise<AIValidationResult> {
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

    const response = await this.callGeminiAPI(prompt, {
      temperature: 0.2,
      maxOutputTokens: 600
    });

    return JSON.parse(this.cleanAIResponse(response));
  }

  /**
   * Perform pattern analysis using AI
   */
  private async performPatternAnalysis(availabilityData: Availability[]): Promise<AIPatternAnalysis> {
    const dataContext = this.createPatternAnalysisContext(availabilityData);
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

    const response = await this.callGeminiAPI(prompt, {
      temperature: 0.4,
      maxOutputTokens: 1000
    });

    return JSON.parse(this.cleanAIResponse(response));
  }

  /**
   * Call Gemini AI API
   * Uses direct axios for HTTP requests
   */
  private async callGeminiAPI(prompt: string, options: { temperature: number; maxOutputTokens: number }): Promise<string> {
    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
        topK: 40,
        topP: 0.95
      }
    };

    const response = await axios.post(
      `${this.aiApiUrl}/gemini-2.0-flash:generateContent?key=${this.aiApiKey}`,
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000 // 30 second timeout
      }
    );

    const responseText = (response.data as any)?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('No valid response from AI service');
    }

    return responseText;
  }

  // Helper methods following existing patterns
  private generateDataHash(data: any[]): string {
    const dataString = JSON.stringify(data.map(item => ({ id: item.id, startTime: item.startTime, endTime: item.endTime, isBooked: item.isBooked })));
    return Buffer.from(dataString).toString('base64').slice(0, 16);
  }

  private generateConstraintsHash(constraints: ScheduleConstraints): string {
    return Buffer.from(JSON.stringify(constraints)).toString('base64').slice(0, 16);
  }

  private cleanAIResponse(response: string): string {
    return response.trim().replace(/```json\s*|\s*```/g, '');
  }

  private createConflictAnalysisContext(availabilityData: Availability[]): string {
    const sortedData = availabilityData.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return sortedData.map((slot, index) => 
      `${index + 1}. ${slot.startTime} - ${slot.endTime} (${slot.isBooked ? 'BOOKED' : 'AVAILABLE'}) Provider: ${slot.providerId}`
    ).join('\n');
  }

  private createOptimizationContext(availabilityData: Availability[], constraints: ScheduleConstraints): string {
    const stats = this.calculateScheduleStats(availabilityData);
    
    return `Current Schedule Stats:
${JSON.stringify(stats, null, 2)}

Constraints:
${JSON.stringify(constraints, null, 2)}

Availability Data (sample):
${availabilityData.slice(0, 10).map(slot => 
      `${slot.startTime} - ${slot.endTime} (${slot.isBooked ? 'BOOKED' : 'AVAILABLE'})`
    ).join('\n')}`;
  }

  private createPatternAnalysisContext(availabilityData: Availability[]): string {
    const stats = this.calculateScheduleStats(availabilityData);
    const timeDistribution = this.analyzeTimeDistribution(availabilityData);
    
    return `Schedule Statistics:
${JSON.stringify(stats, null, 2)}

Time Distribution:
${timeDistribution}

Data Points: ${availabilityData.length} slots`;
  }

  private calculateScheduleStats(availabilityData: Availability[]): any {
    const total = availabilityData.length;
    const booked = availabilityData.filter(slot => slot.isBooked).length;
    const available = total - booked;
    const utilization = total > 0 ? ((booked / total) * 100).toFixed(1) : '0';
    
    const dates = [...new Set(availabilityData.map(slot => slot.startTime.toDateString()))];
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

  private analyzeTimeDistribution(availabilityData: Availability[]): string {
    const timeSlots = {
      morning: 0,   // 6-12
      afternoon: 0, // 12-18
      evening: 0    // 18-22
    };

    availabilityData.forEach(slot => {
      const hours = slot.startTime.getHours();
      if (hours >= 6 && hours < 12) timeSlots.morning++;
      else if (hours >= 12 && hours < 18) timeSlots.afternoon++;
      else if (hours >= 18 && hours < 22) timeSlots.evening++;
    });

    return `Morning (6-12): ${timeSlots.morning}, Afternoon (12-18): ${timeSlots.afternoon}, Evening (18-22): ${timeSlots.evening}`;
  }
}