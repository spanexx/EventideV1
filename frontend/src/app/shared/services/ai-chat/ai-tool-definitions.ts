import { Availability } from '../../../dashboard/models/availability.models';

export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      format?: string;
    }>;
    required: string[];
  };
  function: (params: any) => Promise<any>;
}

export interface AIToolResponse {
  success: boolean;
  data?: any;
  message: string;
  error?: string;
}

export interface AIConversationContext {
  userId: string;
  currentPage: string;
  currentDate: Date;
  selectedAvailability?: Availability[];
  recentActions: string[];
}

export const AI_TOOL_DEFINITIONS: AITool[] = [
  {
    name: 'create_availability_slot',
    description: 'Create a single availability slot for a specific date and time',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          format: 'date',
          description: 'Date for the availability slot (YYYY-MM-DD)'
        },
        startTime: {
          type: 'string',
          format: 'time',
          description: 'Start time in HH:MM format (24-hour)'
        },
        endTime: {
          type: 'string',
          format: 'time',
          description: 'End time in HH:MM format (24-hour)'
        },
        duration: {
          type: 'number',
          description: 'Duration in minutes (optional, calculated from start/end if not provided)'
        },
        type: {
          type: 'string',
          enum: ['one_off', 'recurring'],
          description: 'Type of availability slot'
        },
        dayOfWeek: {
          type: 'number',
          description: 'Day of week for recurring slots (0=Sunday, 1=Monday, etc.)'
        }
      },
      required: ['date', 'startTime', 'endTime']
    },
    function: async () => ({}) // Will be implemented by AIToolService
  },
  
  {
    name: 'create_bulk_availability',
    description: 'Create multiple availability slots with various patterns',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          enum: ['daily', 'weekly', 'range', 'custom'],
          description: 'Pattern for creating multiple slots'
        },
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Start date for the pattern'
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'End date for the pattern'
        },
        startTime: {
          type: 'string',
          format: 'time',
          description: 'Daily start time'
        },
        endTime: {
          type: 'string',
          format: 'time',
          description: 'Daily end time'
        },
        duration: {
          type: 'number',
          description: 'Duration per slot in minutes'
        },
        quantity: {
          type: 'number',
          description: 'Number of slots to create per day'
        },
        daysOfWeek: {
          type: 'array',
          description: 'Array of day numbers for weekly patterns'
        },
        breakTime: {
          type: 'number',
          description: 'Break time between slots in minutes'
        }
      },
      required: ['pattern', 'startDate', 'startTime', 'endTime']
    },
    function: async () => ({})
  },

  {
    name: 'update_availability_slot',
    description: 'Update an existing availability slot',
    parameters: {
      type: 'object',
      properties: {
        slotId: {
          type: 'string',
          description: 'ID of the slot to update'
        },
        date: {
          type: 'string',
          format: 'date',
          description: 'New date for the slot'
        },
        startTime: {
          type: 'string',
          format: 'time',
          description: 'New start time'
        },
        endTime: {
          type: 'string',
          format: 'time',
          description: 'New end time'
        },
        duration: {
          type: 'number',
          description: 'New duration in minutes'
        }
      },
      required: ['slotId']
    },
    function: async () => ({})
  },

  {
    name: 'delete_availability_slot',
    description: 'Delete a specific availability slot',
    parameters: {
      type: 'object',
      properties: {
        slotId: {
          type: 'string',
          description: 'ID of the slot to delete'
        }
      },
      required: ['slotId']
    },
    function: async () => ({})
  },

  {
    name: 'delete_bulk_availability',
    description: 'Delete multiple availability slots based on criteria',
    parameters: {
      type: 'object',
      properties: {
        criteria: {
          type: 'string',
          enum: ['expired', 'unbooked', 'date_range', 'day_of_week', 'all'],
          description: 'Criteria for bulk deletion'
        },
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Start date for date range deletion'
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'End date for date range deletion'
        },
        dayOfWeek: {
          type: 'number',
          description: 'Day of week for day-specific deletion'
        },
        confirm: {
          type: 'boolean',
          description: 'Confirmation flag for destructive operations'
        }
      },
      required: ['criteria']
    },
    function: async () => ({})
  },

  {
    name: 'get_availability_data',
    description: 'Retrieve availability data with various filters',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Start date for data retrieval'
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'End date for data retrieval'
        },
        status: {
          type: 'string',
          enum: ['available', 'booked', 'expired', 'all'],
          description: 'Filter by availability status'
        },
        includeAnalysis: {
          type: 'boolean',
          description: 'Include AI analysis with the data'
        }
      },
      required: []
    },
    function: async () => ({})
  },

  {
    name: 'analyze_availability_patterns',
    description: 'Analyze availability patterns and provide insights',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Start date for analysis'
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'End date for analysis'
        },
        analysisType: {
          type: 'string',
          enum: ['utilization', 'conflicts', 'optimization', 'trends', 'all'],
          description: 'Type of analysis to perform'
        }
      },
      required: ['analysisType']
    },
    function: async () => ({})
  },

  {
    name: 'optimize_schedule',
    description: 'Get AI-powered schedule optimization recommendations',
    parameters: {
      type: 'object',
      properties: {
        targetDate: {
          type: 'string',
          format: 'date',
          description: 'Date to optimize'
        },
        optimizationGoal: {
          type: 'string',
          enum: ['maximize_utilization', 'minimize_gaps', 'balance_workload', 'peak_hours'],
          description: 'Optimization objective'
        },
        constraints: {
          type: 'object',
          description: 'Constraints for optimization (working hours, break times, etc.)'
        }
      },
      required: ['optimizationGoal']
    },
    function: async () => ({})
  },

  {
    name: 'navigate_calendar',
    description: 'Navigate to a specific date or view in the calendar',
    parameters: {
      type: 'object',
      properties: {
        targetDate: {
          type: 'string',
          format: 'date',
          description: 'Date to navigate to'
        },
        view: {
          type: 'string',
          enum: ['day', 'week', 'month'],
          description: 'Calendar view to switch to'
        }
      },
      required: []
    },
    function: async () => ({})
  },

  {
    name: 'export_availability_data',
    description: 'Export availability data in various formats',
    parameters: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['csv', 'json', 'pdf', 'excel'],
          description: 'Export format'
        },
        startDate: {
          type: 'string',
          format: 'date',
          description: 'Start date for export'
        },
        endDate: {
          type: 'string',
          format: 'date',
          description: 'End date for export'
        },
        includeAnalysis: {
          type: 'boolean',
          description: 'Include AI analysis in export'
        }
      },
      required: ['format']
    },
    function: async () => ({})
  }
];

export const AI_TOOL_EXAMPLES = {
  create_single: "Create a 1-hour slot tomorrow at 2 PM",
  create_bulk: "Create 8 slots every weekday next week from 9 AM to 5 PM",
  update_slot: "Move the 2 PM slot to 3 PM",
  delete_slot: "Delete the slot at 10 AM today",
  delete_bulk: "Delete all unbooked slots this week",
  get_data: "Show me all availability for next week",
  analyze: "Analyze my utilization patterns for this month",
  optimize: "Optimize my schedule for maximum utilization",
  navigate: "Go to next Monday",
  export: "Export this week's data as CSV"
};