import { Injectable } from '@angular/core';
import { AIProcessingResult, IntentDetectionResult, ExtractedEntities } from './ai-chat-interfaces';
import { AIToolService } from './ai-tool.service';
import { AIChatFormatterService } from './ai-chat-formatter.service';
import { AIChatConversationalService } from './ai-chat-conversational.service';
import { AIChatIntentDetectionService } from './ai-chat-intent-detection.service';
import { AIChatEntityExtractionService } from './ai-chat-entity-extraction.service';
import { AIChatResponseGenerationService } from './ai-chat-response-generation.service';

@Injectable({
  providedIn: 'root'
})
export class AIChatProcessorService {

  constructor(
    private toolService: AIToolService,
    private formatterService: AIChatFormatterService,
    private conversationalService: AIChatConversationalService,
    private intentDetectionService: AIChatIntentDetectionService,
    private entityExtractionService: AIChatEntityExtractionService,
    private responseGenerationService: AIChatResponseGenerationService
  ) {}

  async processLocallyWithPatterns(message: string): Promise<AIProcessingResult> {
    console.log('[AIChatProcessorService] processLocallyWithPatterns called with message:', message);
    
    const context = this.toolService.getContext();
    console.log('[AIChatProcessorService] Processing locally, context:', context);
    
    // Enhanced conversational AI with clarification and reasoning
    const conversationalResult = await this.conversationalService.processConversationally(message);
    
    // If we have a clarification or suggestion, return it immediately
    if (conversationalResult.needsClarification) {
      console.log('[AIChatProcessorService] Returning conversational clarification');
      return conversationalResult;
    }
    
    // Otherwise, proceed with enhanced intent detection
    const intent = this.intentDetectionService.detectIntentAdvanced(message);
    const entities = this.entityExtractionService.extractAdvancedEntities(message);
    
    console.log('[AIChatProcessorService] Detected intent:', intent);
    console.log('[AIChatProcessorService] Extracted entities:', entities);
    
    if (intent.action && intent.confidence > 0.4) {
      const parameters = this.entityExtractionService.buildEnhancedParameters(entities, intent.action, message);
      console.log('[AIChatProcessorService] Built parameters:', parameters);
      
      try {
        const result = await this.toolService.executeTool(intent.action, parameters);
        console.log('[AIChatProcessorService] Local tool execution result:', result);
        
        return this.formatterService.formatLocalProcessingResult(intent, result, parameters);
      } catch (error: any) {
        console.error('[AIChatProcessorService] Local tool execution failed:', error);
        
        return {
          response: this.responseGenerationService.generateErrorResponse(error, intent),
          toolCalls: [],
          suggestedActions: this.responseGenerationService.generateContextualSuggestions(message)
        };
      }
    }

    console.log('[AIChatProcessorService] No clear intent detected, providing intelligent suggestions');
    
    // Enhanced default response with context-aware suggestions
    const suggestions = this.responseGenerationService.generateContextualSuggestions(message);
    return {
      response: this.responseGenerationService.generateHelpfulResponse(message),
      toolCalls: [],
      suggestedActions: suggestions
    };
  }
}