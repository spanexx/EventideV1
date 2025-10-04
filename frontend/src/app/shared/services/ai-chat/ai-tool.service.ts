import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { AITool, AIToolResponse, AIConversationContext, AI_TOOL_DEFINITIONS } from './ai-tool-definitions';
import { AIToolContextService } from './ai-tool-context.service';
import { AIToolAvailabilityService } from './ai-tool-availability.service';
import { AIToolNavigationService } from './ai-tool-navigation.service';

@Injectable({
  providedIn: 'root'
})
export class AIToolService {

  constructor(
    private contextService: AIToolContextService,
    private availabilityService: AIToolAvailabilityService,
    private navigationService: AIToolNavigationService
  ) {
    console.log('[AIToolService] Constructor called');
    
    this.bindToolFunctions();
    
    console.log('[AIToolService] Initialization complete');
  }

  private bindToolFunctions(): void {
    console.log('[AIToolService] Binding tool functions...');
    
    const toolMap: Record<string, (params: any) => Promise<AIToolResponse>> = {
      create_availability_slot: (params) => this.availabilityService.createAvailabilitySlot(params, this.contextService.getUserId()),
      create_bulk_availability: (params) => this.availabilityService.createBulkAvailability(params, this.contextService.getUserId()),
      update_availability_slot: (params) => this.availabilityService.updateAvailabilitySlot(params, this.contextService.getUserId()),
      delete_availability_slot: (params) => this.availabilityService.deleteAvailabilitySlot(params),
      delete_bulk_availability: (params) => this.availabilityService.deleteBulkAvailability(params, this.contextService.getUserId()),
      get_availability_data: (params) => this.availabilityService.getAvailabilityData(params, this.contextService.getUserId()),
      analyze_availability_patterns: (params) => this.navigationService.analyzeAvailabilityPatterns(params),
      optimize_schedule: (params) => this.navigationService.optimizeSchedule(params),
      navigate_calendar: (params) => this.navigationService.navigateCalendar(params, this.contextService.getCurrentPage()),
      export_availability_data: (params) => this.navigationService.exportAvailabilityData(params)
    };

    AI_TOOL_DEFINITIONS.forEach(tool => {
      if (toolMap[tool.name]) {
        tool.function = toolMap[tool.name];
        console.log('[AIToolService] Bound function for tool:', tool.name);
      } else {
        console.warn('[AIToolService] No function found for tool:', tool.name);
      }
    });
    
    console.log('[AIToolService] Tool functions binding complete. Total tools:', AI_TOOL_DEFINITIONS.length);
  }

  getTools(): AITool[] {
    return AI_TOOL_DEFINITIONS;
  }

  getContext(): AIConversationContext {
    return this.contextService.getContext();
  }

  updateContext(updates: Partial<AIConversationContext>): void {
    this.contextService.updateContext(updates);
  }

  async executeTool(toolName: string, parameters: any): Promise<AIToolResponse> {
    console.log('[AIToolService] executeTool called with:', { toolName, parameters });
    
    const tool = AI_TOOL_DEFINITIONS.find(t => t.name === toolName);
    if (!tool) {
      console.error('[AIToolService] Tool not found:', toolName);
      return {
        success: false,
        error: `Tool '${toolName}' not found`,
        message: `The tool '${toolName}' is not available.`
      };
    }

    console.log('[AIToolService] Found tool definition:', tool.name);

    try {
      console.log('[AIToolService] Executing tool function...');
      const result = await tool.function(parameters);
      console.log('[AIToolService] Tool execution completed:', result);
      
      this.contextService.addToRecentActions(`Executed ${toolName} with result: ${result.message}`);
      return result;
    } catch (error: any) {
      console.error('[AIToolService] Tool execution failed:', error);
      
      return {
        success: false,
        error: error.message,
        message: `Failed to execute ${toolName}: ${error.message}`
      };
    }
  }
}