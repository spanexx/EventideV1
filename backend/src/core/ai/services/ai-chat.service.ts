import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ProcessChatRequestDto, ChatResponseDto, ToolCallDto } from '../dto/ai-chat.dto';
import { AiAvailabilityService } from './ai-availability.service';
import { AvailabilityService } from '../../../modules/availability/availability.service';
import { Availability } from '../../../modules/availability/availability.schema';

interface AITool {
  name: string;
  description: string;
  parameters: any;
  examples: string[];
  handler: (params: any, context: any) => Promise<any>;
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private tools: Map<string, AITool> = new Map();

  constructor(
    private readonly aiAvailabilityService: AiAvailabilityService,
    @Inject(forwardRef(() => AvailabilityService))
    private readonly availabilityService: AvailabilityService,
  ) {
    this.initializeTools();
  }

  private initializeTools(): void {
    // Register all available tools
    const tools: AITool[] = [
      {
        name: 'create_availability_slot',
        description: 'Create a single availability slot for a specific date and time',
        parameters: {
          type: 'object',
          properties: {
            providerId: { type: 'string', description: 'Provider ID' },
            date: { type: 'string', format: 'date', description: 'Date for the slot (YYYY-MM-DD)' },
            startTime: { type: 'string', format: 'time', description: 'Start time (HH:MM)' },
            endTime: { type: 'string', format: 'time', description: 'End time (HH:MM)' },
            duration: { type: 'number', description: 'Duration in minutes' },
            type: { type: 'string', enum: ['one_off', 'recurring'], description: 'Slot type' }
          },
          required: ['providerId', 'date', 'startTime', 'endTime']
        },
        examples: [
          'Create a slot tomorrow at 2 PM for 1 hour',
          'Add availability on Monday from 9 AM to 10 AM',
          'Create a 30-minute slot on 2024-01-15 at 14:30'
        ],
        handler: this.handleCreateSlot.bind(this)
      },
      {
        name: 'create_bulk_availability',
        description: 'Create multiple availability slots with patterns',
        parameters: {
          type: 'object',
          properties: {
            providerId: { type: 'string', description: 'Provider ID' },
            pattern: { type: 'string', enum: ['daily', 'weekly', 'range'], description: 'Creation pattern' },
            startDate: { type: 'string', format: 'date', description: 'Start date' },
            endDate: { type: 'string', format: 'date', description: 'End date' },
            startTime: { type: 'string', format: 'time', description: 'Daily start time' },
            endTime: { type: 'string', format: 'time', description: 'Daily end time' },
            duration: { type: 'number', description: 'Slot duration in minutes' },
            quantity: { type: 'number', description: 'Number of slots per day' },
            daysOfWeek: { type: 'array', description: 'Days of week for weekly pattern' }
          },
          required: ['providerId', 'pattern', 'startDate', 'startTime', 'endTime']
        },
        examples: [
          'Create 8 slots every weekday next week from 9 AM to 5 PM',
          'Add daily availability for the next month, 2-hour slots',
          'Create weekly recurring slots on Monday and Friday'
        ],
        handler: this.handleCreateBulkSlots.bind(this)
      },
      {
        name: 'update_availability_slot',
        description: 'Update an existing availability slot',
        parameters: {
          type: 'object',
          properties: {
            slotId: { type: 'string', description: 'ID of the slot to update' },
            date: { type: 'string', format: 'date', description: 'New date' },
            startTime: { type: 'string', format: 'time', description: 'New start time' },
            endTime: { type: 'string', format: 'time', description: 'New end time' },
            duration: { type: 'number', description: 'New duration' }
          },
          required: ['slotId']
        },
        examples: [
          'Move the 2 PM slot to 3 PM',
          'Change the slot duration to 2 hours',
          'Update the Monday morning slot to start at 8 AM'
        ],
        handler: this.handleUpdateSlot.bind(this)
      },
      {
        name: 'delete_availability_slot',
        description: 'Delete a specific availability slot',
        parameters: {
          type: 'object',
          properties: {
            slotId: { type: 'string', description: 'ID of the slot to delete' }
          },
          required: ['slotId']
        },
        examples: [
          'Delete the slot at 2 PM today',
          'Remove the Monday morning appointment',
          'Cancel the 3 PM slot tomorrow'
        ],
        handler: this.handleDeleteSlot.bind(this)
      },
      {
        name: 'delete_bulk_availability',
        description: 'Delete multiple slots based on criteria',
        parameters: {
          type: 'object',
          properties: {
            providerId: { type: 'string', description: 'Provider ID' },
            criteria: { type: 'string', enum: ['expired', 'unbooked', 'date_range', 'all'], description: 'Deletion criteria' },
            startDate: { type: 'string', format: 'date', description: 'Start date for range deletion' },
            endDate: { type: 'string', format: 'date', description: 'End date for range deletion' },
            confirm: { type: 'boolean', description: 'Confirmation for destructive operations' }
          },
          required: ['providerId', 'criteria']
        },
        examples: [
          'Delete all unbooked slots this week',
          'Remove expired appointments',
          'Clear all availability for next month'
        ],
        handler: this.handleDeleteBulkSlots.bind(this)
      },
      {
        name: 'get_availability_data',
        description: 'Retrieve availability data with filters',
        parameters: {
          type: 'object',
          properties: {
            providerId: { type: 'string', description: 'Provider ID' },
            startDate: { type: 'string', format: 'date', description: 'Start date' },
            endDate: { type: 'string', format: 'date', description: 'End date' },
            status: { type: 'string', enum: ['available', 'booked', 'expired', 'all'], description: 'Filter by status' },
            includeAnalysis: { type: 'boolean', description: 'Include AI analysis' }
          },
          required: ['providerId']
        },
        examples: [
          'Show my availability for this week',
          'List all booked appointments tomorrow',
          'Display available slots for next month'
        ],
        handler: this.handleGetAvailability.bind(this)
      },
      {
        name: 'analyze_patterns',
        description: 'Analyze availability patterns and trends',
        parameters: {
          type: 'object',
          properties: {
            providerId: { type: 'string', description: 'Provider ID' },
            startDate: { type: 'string', format: 'date', description: 'Analysis start date' },
            endDate: { type: 'string', format: 'date', description: 'Analysis end date' },
            analysisType: { type: 'string', enum: ['utilization', 'conflicts', 'trends', 'all'], description: 'Analysis type' }
          },
          required: ['providerId', 'analysisType']
        },
        examples: [
          'Analyze my schedule patterns for this month',
          'Show utilization trends for the last quarter',
          'Find scheduling conflicts in my calendar'
        ],
        handler: this.handleAnalyzePatterns.bind(this)
      }
    ];

    tools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });

    this.logger.log(`Initialized ${tools.length} AI tools`);
  }

  async processMessage(request: ProcessChatRequestDto): Promise<ChatResponseDto> {
    this.logger.log(`Processing message: "${request.message}"`);
    
    // Simple pattern matching for now - in production this would use a proper NLP service
    const intent = this.extractIntent(request.message);
    const entities = this.extractEntities(request.message, request.context);
    
    this.logger.log(`Detected intent: ${intent}, entities: ${JSON.stringify(entities)}`);

    // Generate response and tool calls
    const toolCalls = await this.generateToolCalls(intent, entities, request.context);
    
    // Execute tool calls
    const results: any[] = [];
    for (const toolCall of toolCalls) {
      const tool = this.tools.get(toolCall.name);
      if (tool) {
        try {
          const result = await tool.handler(toolCall.parameters, request.context);
          results.push(result);
        } catch (error) {
          this.logger.error(`Failed to execute tool ${toolCall.name}:`, error);
        }
      }
    }
    
    const response = results.length > 0 
      ? `I've completed your request. ${this.generateResponse(intent, toolCalls, entities)}`
      : this.generateResponse(intent, toolCalls, entities);
    const suggestedActions = this.generateSuggestedActions(intent, request.context);

    return {
      response,
      toolCalls,
      suggestedActions,
      conversationId: request.conversationId || this.generateConversationId(),
      timestamp: new Date()
    };
  }

  async getAvailableTools(): Promise<Array<{
    name: string;
    description: string;
    parameters: any;
    examples: string[];
  }>> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      examples: tool.examples
    }));
  }

  async validateToolParameters(toolName: string, parameters: any): Promise<{
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  }> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        isValid: false,
        errors: [`Tool '${toolName}' not found`],
        suggestions: [`Available tools: ${Array.from(this.tools.keys()).join(', ')}`]
      };
    }

    const errors: string[] = [];
    const suggestions: string[] = [];

    // Validate required parameters
    const required = tool.parameters.required || [];
    for (const param of required) {
      if (!parameters.hasOwnProperty(param) || parameters[param] === undefined || parameters[param] === null) {
        errors.push(`Missing required parameter: ${param}`);
        suggestions.push(`Please provide ${param} parameter`);
      }
    }

    // Validate parameter types (basic validation)
    const properties = tool.parameters.properties || {};
    for (const [key, value] of Object.entries(parameters)) {
      if (properties[key]) {
        const propDef = properties[key] as any;
        if (propDef.type === 'string' && typeof value !== 'string') {
          errors.push(`Parameter '${key}' must be a string`);
        } else if (propDef.type === 'number' && typeof value !== 'number') {
          errors.push(`Parameter '${key}' must be a number`);
        } else if (propDef.enum && !propDef.enum.includes(value)) {
          errors.push(`Parameter '${key}' must be one of: ${propDef.enum.join(', ')}`);
          suggestions.push(`Valid values for ${key}: ${propDef.enum.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  // Tool handlers

  private async handleCreateSlot(params: any, context: any): Promise<any> {
    const createDto = {
      providerId: params.providerId || context.userId,
      startTime: new Date(`${params.date}T${params.startTime}`),
      endTime: new Date(`${params.date}T${params.endTime}`),
      duration: params.duration || this.calculateDuration(params.startTime, params.endTime),
      type: params.type || 'one_off',
      isBooked: false,
      date: new Date(params.date)
    };

    return await this.availabilityService.create(createDto);
  }

  private async handleCreateBulkSlots(params: any, context: any): Promise<any> {
    const isRecurring = params.pattern === 'weekly';
    
    // Map weekday names to DayOfWeek enum values
    const weekdayMap: { [key: string]: number } = {
      'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0
    };

    // For recurring slots, we need to create one slot per day of week
    if (isRecurring && params.daysOfWeek && params.daysOfWeek.length > 0) {
      const results: any[] = [];
      for (const day of params.daysOfWeek) {
        const bulkDto = {
          providerId: params.providerId || context.userId,
          type: 'recurring',
          dayOfWeek: weekdayMap[day.toLowerCase()],
          slots: [{
            startTime: new Date(`2024-01-01T${params.startTime}`),
            endTime: new Date(`2024-01-01T${params.endTime}`),
            duration: params.duration || this.calculateDuration(params.startTime, params.endTime)
          }]
        };
        try {
          const result = await this.availabilityService.createBulkSlots(bulkDto as any);
          results.push(result);
        } catch (error) {
          // Log error but continue with other days
          this.logger.error(`Failed to create recurring slot for ${day}: ${error.message}`);
        }
      }
      return results.flat();
    }

    // For one-off slots, create them within the date range
    const bulkDto = {
      providerId: params.providerId || context.userId,
      type: 'one_off',
      startDate: new Date(params.startDate),
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      quantity: params.quantity || 1,
      slots: [{
        startTime: new Date(`2024-01-01T${params.startTime}`),
        endTime: new Date(`2024-01-01T${params.endTime}`),
        duration: params.duration || this.calculateDuration(params.startTime, params.endTime)
      }]
    };

    return await this.availabilityService.createBulkSlots(bulkDto as any);
  }

  private async handleUpdateSlot(params: any, context: any): Promise<any> {
    const updateDto = {
      ...(params.date && { date: new Date(params.date) }),
      ...(params.startTime && { startTime: new Date(`${params.date || '2024-01-01'}T${params.startTime}`) }),
      ...(params.endTime && { endTime: new Date(`${params.date || '2024-01-01'}T${params.endTime}`) }),
      ...(params.duration && { duration: params.duration })
    };

    return await this.availabilityService.update(params.slotId, updateDto);
  }

  private async handleDeleteSlot(params: any, context: any): Promise<any> {
    return await this.availabilityService.delete(params.slotId);
  }

  private async handleDeleteBulkSlots(params: any, context: any): Promise<any> {
    // Implementation would depend on having a bulk delete method
    // For now, return a placeholder
    return { deletedCount: 0, message: 'Bulk delete not implemented yet' };
  }

  private async handleGetAvailability(params: any, context: any): Promise<any> {
    return await this.availabilityService.findByProviderAndDateRange(
      params.providerId || context.userId,
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined
    );
  }

  private async handleAnalyzePatterns(params: any, context: any): Promise<any> {
    const data = await this.availabilityService.findByProviderAndDateRange(
      params.providerId || context.userId,
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined
    );

    // Cast to Availability[] for the AI service
    return await this.aiAvailabilityService.analyzeSchedulePatterns(data as Availability[]);
  }

  // Helper methods

  private extractIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new')) {
      if (lowerMessage.includes('multiple') || lowerMessage.includes('bulk') || lowerMessage.includes('all day') || 
          (lowerMessage.includes('monday') && lowerMessage.includes('friday')) || 
          lowerMessage.includes('next week') ||
          lowerMessage.includes('every')) {
        return 'create_bulk';
      }
      return 'create_single';
    }
    
    if (lowerMessage.includes('update') || lowerMessage.includes('modify') || lowerMessage.includes('change') || lowerMessage.includes('move')) {
      return 'update_slot';
    }
    
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove') || lowerMessage.includes('cancel')) {
      if (lowerMessage.includes('all') || lowerMessage.includes('bulk') || lowerMessage.includes('multiple')) {
        return 'delete_bulk_slots';
      }
      return 'delete_slot';
    }
    
    if (lowerMessage.includes('show') || lowerMessage.includes('display') || lowerMessage.includes('get') || lowerMessage.includes('list')) {
      return 'get_data';
    }
    
    if (lowerMessage.includes('analyze') || lowerMessage.includes('analysis') || lowerMessage.includes('pattern') || lowerMessage.includes('trend')) {
      return 'analyze';
    }
    
    return 'unknown';
  }

  private extractEntities(message: string, context: any): any {
    const entities: any = {
      providerId: context.userId
    };

    // Extract dates and date ranges
    const dateRegex = /(\d{4}-\d{2}-\d{2})|tomorrow|today|next week|this week/gi;
    const dateMatch = message.match(dateRegex);
    if (dateMatch) {
      if (dateMatch[0].includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        entities.date = tomorrow.toISOString().split('T')[0];
      } else if (dateMatch[0].includes('today')) {
        entities.date = new Date().toISOString().split('T')[0];
      } else if (dateMatch[0].includes('next week')) {
        const nextMonday = new Date();
        nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()));
        const nextFriday = new Date(nextMonday);
        nextFriday.setDate(nextFriday.getDate() + 4);
        entities.startDate = nextMonday.toISOString().split('T')[0];
        entities.endDate = nextFriday.toISOString().split('T')[0];
      } else if (dateMatch[0].match(/\d{4}-\d{2}-\d{2}/)) {
        entities.date = dateMatch[0];
      }
    }

    // Extract days of week
    const weekdayRegex = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
    const weekdayMatches = message.match(weekdayRegex);
    if (weekdayMatches) {
      entities.daysOfWeek = weekdayMatches.map(day => day.toLowerCase());
    }

    // Extract times
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi;
    const timeMatches = message.match(timeRegex);
    if (timeMatches && timeMatches.length >= 2) {
      entities.startTime = this.normalizeTime(timeMatches[0]);
      entities.endTime = this.normalizeTime(timeMatches[1]);
    } else if (timeMatches && timeMatches.length === 1) {
      entities.startTime = this.normalizeTime(timeMatches[0]);
      // Default to 1 hour duration
      const start = new Date(`2024-01-01T${entities.startTime}`);
      start.setHours(start.getHours() + 1);
      entities.endTime = start.toTimeString().slice(0, 5);
    }

    // Extract duration
    const durationRegex = /(\d+)\s*(hour|hr|minute|min)/gi;
    const durationMatch = message.match(durationRegex);
    if (durationMatch) {
      const match = durationMatch[0].match(/(\d+)\s*(hour|hr|minute|min)/i);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        entities.duration = unit.includes('hour') || unit.includes('hr') ? value * 60 : value;
      }
    }

    return entities;
  }

  private async generateToolCalls(intent: string, entities: any, context: any): Promise<ToolCallDto[]> {
    const toolCalls: ToolCallDto[] = [];

    switch (intent) {
      case 'create_single':
        if (entities.date && entities.startTime && entities.endTime) {
          toolCalls.push({
            name: 'create_availability_slot',
            parameters: {
              providerId: entities.providerId,
              date: entities.date,
              startTime: entities.startTime,
              endTime: entities.endTime,
              duration: entities.duration
            }
          });
        }
        break;
        
      case 'create_bulk':
        if ((entities.startDate || entities.date) && entities.startTime && entities.endTime) {
          const startDate = entities.startDate || entities.date;
          const endDate = entities.endDate || startDate;
          const duration = entities.duration || 60; // Default 1-hour slots
          
          toolCalls.push({
            name: 'create_bulk_availability',
            parameters: {
              providerId: entities.providerId,
              pattern: entities.daysOfWeek ? 'weekly' : 'daily',
              startDate: startDate,
              endDate: endDate,
              startTime: entities.startTime,
              endTime: entities.endTime,
              duration: duration,
              quantity: Math.floor((new Date(`2024-01-01T${entities.endTime}`).getTime() - 
                                  new Date(`2024-01-01T${entities.startTime}`).getTime()) / 
                                  (duration * 60 * 1000)),
              daysOfWeek: entities.daysOfWeek || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            }
          });
        }
        break;

      case 'update_slot':
        if (context.slotId && entities.startTime) {
          toolCalls.push({
            name: 'update_availability_slot',
            parameters: {
              slotId: context.slotId,
              startTime: entities.startTime,
              endTime: entities.endTime || undefined,
              date: entities.date || undefined
            }
          });
        }
        break;
        
      case 'get_data':
        toolCalls.push({
          name: 'get_availability_data',
          parameters: {
            providerId: entities.providerId,
            startDate: entities.date,
            includeAnalysis: true
          }
        });
        break;
        
      case 'analyze':
        toolCalls.push({
          name: 'analyze_patterns',
          parameters: {
            providerId: entities.providerId,
            analysisType: 'all',
            startDate: entities.date
          }
        });
        break;

      case 'delete_slot':
        if (context.slotId) {
          toolCalls.push({
            name: 'delete_availability_slot',
            parameters: {
              slotId: context.slotId
            }
          });
        }
        break;

      case 'delete_bulk_slots':
        if (entities.date) {
          toolCalls.push({
            name: 'delete_bulk_availability',
            parameters: {
              providerId: entities.providerId,
              criteria: 'date_range',
              startDate: entities.date,
              endDate: entities.date,
              confirm: true
            }
          });
        }
        break;
    }

    return toolCalls;
  }

  private generateResponse(intent: string, toolCalls: ToolCallDto[], entities: any): string {
    if (toolCalls.length === 0) {
      return "I understand you want to manage your availability, but I need more information. Could you provide specific dates, times, or slot details?";
    }

    switch (intent) {
      case 'create_single':
        return `I'll create an availability slot for ${entities.date} from ${entities.startTime} to ${entities.endTime}.`;
      case 'create_bulk':
        return `I'll create multiple availability slots starting from ${entities.date}.`;
      case 'get_data':
        return `I'll retrieve your availability data${entities.date ? ` for ${entities.date}` : ''}.`;
      case 'analyze':
        return `I'll analyze your availability patterns and provide insights.`;
      default:
        return `I'll help you with your availability management request.`;
    }
  }

  private generateSuggestedActions(intent: string, context: any): string[] {
    const baseActions = [
      'Create a new availability slot',
      'Show my schedule for this week',
      'Analyze my booking patterns'
    ];

    switch (intent) {
      case 'create_single':
      case 'create_bulk':
        return [
          'Create more slots for the same day',
          'Set up recurring weekly slots',
          'Optimize slot timing based on demand'
        ];
      case 'get_data':
        return [
          'Analyze patterns in this data',
          'Export this data',
          'Create similar slots'
        ];
      default:
        return baseActions;
    }
  }

  private normalizeTime(timeStr: string): string {
    const match = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!match) return timeStr;
    
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3]?.toLowerCase();
    
    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`2024-01-01T${startTime}`);
    const end = new Date(`2024-01-01T${endTime}`);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}