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
}
