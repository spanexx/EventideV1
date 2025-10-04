import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CachingService } from '../../cache/caching.service';
import { 
  AIAvailabilityService, 
  AIConflictAnalysis, 
  AIOptimizationResult, 
  AIValidationResult, 
  AIPatternAnalysis,
  ScheduleConstraints 
} from '../interfaces/ai-availability.interface';
import { Availability } from '../../../modules/availability/availability.schema';

@Injectable()
export class AiAvailabilityService implements AIAvailabilityService {
  private readonly logger = new Logger(AiAvailabilityService.name);
  private readonly aiApiUrl: string;
  private readonly aiApiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly cachingService: CachingService
  ) {
    this.aiApiUrl = this.configService.get<string>('GEMINI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models');
    this.aiApiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
  }

  /**
   * Analyze availability conflicts using AI
   * Leverages existing caching patterns from CachingService
   */
  async analyzeConflicts(availabilityData: Availability[]): Promise<AIConflictAnalysis> {
    const cacheKey = `ai-conflicts-${this.generateDataHash(availabilityData)}`;
    
    try {
      // Check cache first (leveraging existing CachingService)
      const cached = await this.cachingService.get<AIConflictAnalysis>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached conflict analysis');
        return cached;
      }

      // Analyze conflicts using AI
      const analysis = await this.performConflictAnalysis(availabilityData);
      
      // Cache result with 5-minute TTL (following existing pattern)
      await this.cachingService.set(cacheKey, analysis, 300);
      
      return analysis;
    } catch (error) {
      this.logger.error('Error analyzing conflicts:', error);
      return {
        hasConflicts: false,
        conflicts: [],
        summary: 'Conflict analysis failed - manual review recommended'
      };
    }
  }

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
   * Analyze patterns in availability data
   * Uses existing caching strategy
   */
  async analyzePatterns(availabilityData: Availability[]): Promise<AIPatternAnalysis> {
    const cacheKey = `ai-patterns-${this.generateDataHash(availabilityData)}`;
    
    try {
      // Check cache first
      const cached = await this.cachingService.get<AIPatternAnalysis>(cacheKey);
      if (cached) {
        this.logger.debug('Returning cached pattern analysis');
        return cached;
      }

      // Analyze patterns using AI
      const patterns = await this.performPatternAnalysis(availabilityData);
      
      // Cache result
      await this.cachingService.set(cacheKey, patterns, 300);
      
      return patterns;
    } catch (error) {
      this.logger.error('Error analyzing patterns:', error);
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
  }

  /**
   * Perform conflict analysis using Gemini AI
   * Follows existing AI service patterns from frontend
   */
  private async performConflictAnalysis(availabilityData: Availability[]): Promise<AIConflictAnalysis> {
    if (!this.aiApiKey) {
      throw new Error('AI service not configured');
    }

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

    const response = await this.callGeminiAPI(prompt, {
      temperature: 0.3,
      maxOutputTokens: 800
    });

    return JSON.parse(this.cleanAIResponse(response));
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