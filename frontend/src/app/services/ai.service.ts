import { Injectable, inject } from '@angular/core';
import { GeminiAIService } from './gemini-ai.service';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private geminiAI = inject(GeminiAIService);

  constructor() { }

  async summarize(logs: any[]): Promise<string> {
    return this.geminiAI.summarizeLogs(logs);
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
    return this.geminiAI.enhancedSearch(query, availabilityData);
  }

  /**
   * Generates smart search suggestions based on calendar data
   * @param availabilityData Current availability data
   * @returns Array of suggested search queries
   */
  async generateSearchSuggestions(availabilityData: any[]): Promise<string[]> {
    return this.geminiAI.generateSearchSuggestions(availabilityData);
  }

  /**
   * Analyze calendar patterns and provide business insights
   * @param availabilityData Historical availability data
   * @returns Pattern analysis with actionable insights
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
    return this.geminiAI.analyzeCalendarPatterns(availabilityData);
  }

  /**
   * Generate schedule optimization recommendations
   * @param availabilityData Current availability data
   * @param preferences User/business preferences
   * @returns Optimization recommendations
   */
  async generateScheduleRecommendations(availabilityData: any[], preferences?: {
    preferredTimes?: string[];
    bufferTime?: number;
    maxDailyBookings?: number;
    workingHours?: { start: string; end: string };
    priorities?: string[];
  }): Promise<{
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
    const constraints = preferences || {};
    return this.geminiAI.optimizeScheduleSlots(constraints, availabilityData);
  }

  /**
   * Detect and analyze scheduling conflicts
   * @param availabilityData Current availability data
   * @returns Conflict analysis with resolution suggestions
   */
  async detectScheduleConflicts(availabilityData: any[]): Promise<{
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
    return this.geminiAI.analyzeAvailabilityConflicts(availabilityData);
  }

  /**
   * Validate calendar input data with AI assistance
   * @param inputData Data to validate
   * @returns Validation results with suggestions
   */
  async validateCalendarInput(inputData: any): Promise<{
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
    return this.geminiAI.validateAvailabilityInput(inputData);
  }

  /**
   * Generate comprehensive analysis summary for calendar data
   * @param availabilityData Calendar data to analyze
   * @returns Comprehensive analysis summary
   */
  async summarizeAnalysis(availabilityData: any[]): Promise<string> {
    try {
      const [patterns, conflicts] = await Promise.all([
        this.analyzeCalendarPatterns(availabilityData),
        this.detectScheduleConflicts(availabilityData)
      ]);

      const summary = [
        '📊 Calendar Analysis Summary:',
        '',
        `📈 Patterns: ${patterns.patterns.length} identified`,
        `⚠️  Conflicts: ${conflicts.conflicts.length} detected`,
        `📋 Utilization: ${patterns.trends.utilization}`,
        '',
        '🔍 Key Insights:',
        ...patterns.insights.map(insight => `• ${insight}`),
        '',
        conflicts.hasConflicts ? '⚠️  Issues Requiring Attention:' : '✅ No Critical Issues Found',
        ...conflicts.conflicts.map(conflict => `• ${conflict.description}`)
      ];

      return summary.join('\n');
    } catch (error) {
      console.error('Error generating analysis summary:', error);
      return 'Analysis summary generation failed. Please try again or review manually.';
    }
  }
}
