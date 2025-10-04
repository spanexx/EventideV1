import { Injectable } from '@angular/core';
import { IntentDetectionResult } from './ai-chat-interfaces';
import { AIToolService } from './ai-tool.service';

@Injectable({
  providedIn: 'root'
})
export class AIChatIntentDetectionService {

  constructor(private toolService: AIToolService) {}

  detectIntentAdvanced(message: string): IntentDetectionResult {
    console.log('[AIChatIntentDetectionService] Advanced intent detection for:', message);
    
    // Multi-layered intent detection approach
    const normalizedMessage = this.preprocessMessage(message);
    
    // Layer 1: Advanced pattern matching with context awareness
    const patternMatch = this.advancedPatternMatching(normalizedMessage);
    
    // Layer 2: Semantic analysis with NLP techniques
    const semanticMatch = this.performAdvancedSemanticAnalysis(normalizedMessage);
    
    // Layer 3: Contextual analysis
    const contextualMatch = this.performContextualAnalysis(normalizedMessage);
    
    // Combine results with weighted scoring
    const combinedResult = this.combineIntentResults([patternMatch, semanticMatch, contextualMatch]);
    
    console.log('[AIChatIntentDetectionService] Combined intent result:', combinedResult);
    return combinedResult;
  }

  private preprocessMessage(message: string): string {
    // Advanced message preprocessing for better NLP
    return message
      .toLowerCase()
      .replace(/['']/g, "'")  // Normalize apostrophes
      .replace(/[""]/g, '"')  // Normalize quotes
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim();
  }

  private advancedPatternMatching(message: string): IntentDetectionResult {
    // Enhanced intent patterns with more sophisticated natural language understanding
    const intentPatterns = [
      {
        action: 'get_availability_data',
        patterns: [
          // Natural question patterns
          /(?:what|how many|how much|tell me|let me know)(?:\s+\w+)*?\s*(?:availability|slots?|appointments?|schedule|time|free|busy|calendar|meetings?)/i,
          /(?:show|display|list|view|see|check|find|get|retrieve|pull up|bring up)(?:\s+\w+)*?\s*(?:my|our|the|all)?(?:\s+\w+)*?\s*(?:availability|slots?|schedule|calendar|appointments?|time|meetings?|bookings?)/i,
          
          // Conversational patterns
          /(?:do i have|am i|is there|are there|have i got|have we got)(?:\s+\w+)*?\s*(?:any|time|slots?|availability|appointments?|free|busy|meetings?)/i,
          /(?:when am i|when are we|what time am i|what time are we)(?:\s+\w+)*?\s*(?:free|available|busy|booked)/i,
          
          // Time-specific queries
          /(?:availability|schedule|calendar|free time|busy time)(?:\s+\w+)*?\s*(?:for|on|this|next|today|tomorrow|during|between|in|at)/i,
          /(?:free|available|busy|occupied)(?:\s+\w+)*?\s*(?:time|when|today|tomorrow|this|next|week|day|morning|afternoon|evening)/i,
          
          // Question word patterns
          /(?:when|what time)(?:\s+\w+)*?\s*(?:can|could|am|are|is)(?:\s+\w+)*?\s*(?:i|we|you|available|free|book|schedule|meet)/i,
          
          // Implicit availability requests
          /(?:can|could)(?:\s+\w+)*?\s*(?:i|we|you)(?:\s+\w+)*?\s*(?:book|schedule|meet|see|appointment|slot)/i,
          /(?:morning|afternoon|evening|tonight|today|tomorrow|weekend)(?:\s+\w+)*?\s*(?:availability|free|busy|schedule|slots?|meetings?)/i,
          
          // Day-specific patterns
          /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+\w+)*?\s*(?:availability|free|busy|schedule|slots?|appointments?|meetings?)/i,
          
          // Count/quantity patterns
          /(?:how many|count|number of)(?:\s+\w+)*?\s*(?:slots?|appointments?|times?|hours?|meetings?|bookings?)/i
        ],
        response: 'I\'ll retrieve your availability data'
      },
      {
        action: 'create_availability_slot',
        patterns: [
          // Creation with intent
          /(?:create|add|make|new|book|schedule|set up|setup|establish|generate|put in)(?:\s+\w+)*?\s*(?:slot|availability|appointment|time|meeting|session|booking)/i,
          /(?:i want to|i need to|i\'d like to|let me|help me|can you|please)(?:\s+\w+)*?\s*(?:add|create|make|book|schedule|set up|put in)(?:\s+\w+)*?\s*(?:slot|time|availability|appointment|meeting|session)/i,
          
          // Time blocking
          /(?:block|reserve|allocate|assign|mark)(?:\s+\w+)*?\s*(?:time|slot|calendar|schedule|period)/i,
          /(?:mark me as|set me as|make me)(?:\s+\w+)*?\s*(?:available|free|busy)/i,
          
          // Temporal creation patterns
          /(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+\w+)*?\s*(?:create|add|make|book|schedule|at|from|available|free)/i,
          /(?:at|from|between)(?:\s+\w+)*?\s*\d+(?:\s+\w+)*?\s*(?:create|add|make|book|available|free|schedule)/i,
          
          // Duration-based patterns
          /(?:for|during)(?:\s+\w+)*?\s*\d+(?:\s+\w+)*?\s*(?:hour|hours|minute|minutes)(?:\s+\w+)*?\s*(?:create|add|available|free)/i
        ],
        response: 'I\'ll help you create a new availability slot'
      },
      {
        action: 'delete_availability_slot',
        patterns: [
          // Deletion verbs with context
          /(?:delete|remove|cancel|clear|eliminate|erase|drop|take away|get rid of)(?:\s+\w+)*?\s*(?:slot|availability|appointment|time|meeting|session|booking)/i,
          /(?:free up|open up|unblock|unschedule|clear out)(?:\s+\w+)*?\s*(?:time|slot|schedule|calendar|period)/i,
          
          // Cancellation context
          /(?:cancel|cancelled|cancellation)(?:\s+\w+)*?\s*(?:for|on|at|today|tomorrow|this|next|my|the)/i,
          /(?:don\'t|do not|no longer)(?:\s+\w+)*?\s*(?:need|want|require)(?:\s+\w+)*?\s*(?:slot|time|appointment|meeting)/i,
          
          // Temporal deletion
          /(?:remove|delete|cancel)(?:\s+\w+)*?\s*(?:today|tomorrow|this|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
          /(?:not available|unavailable|busy)(?:\s+\w+)*?\s*(?:anymore|now|today|tomorrow)/i
        ],
        response: 'I\'ll help you delete availability slots'
      },
      {
        action: 'update_availability_slot',
        patterns: [
          // Modification verbs with context
          /(?:update|modify|change|move|edit|reschedule|adjust|alter|shift|relocate)(?:\s+\w+)*?\s*(?:slot|availability|appointment|time|meeting|session)/i,
          /(?:move|shift|relocate|transfer|change)(?:\s+\w+)*?\s*(?:slot|time|appointment|meeting)(?:\s+\w+)*?\s*(?:to|from|earlier|later|different)/i,
          
          // Time adjustments
          /(?:make it|change it to|move it to|set it to)(?:\s+\w+)*?\s*(?:earlier|later|different|another)(?:\s+\w+)*?\s*(?:time|slot|appointment)/i,
          /(?:earlier|later|before|after|different time)(?:\s+\w+)*?\s*(?:slot|appointment|meeting|time)/i,
          
          // Duration changes
          /(?:extend|shorten|lengthen|reduce)(?:\s+\w+)*?\s*(?:slot|appointment|meeting|time|session)/i,
          /(?:make|change)(?:\s+\w+)*?\s*(?:longer|shorter|bigger|smaller)(?:\s+\w+)*?\s*(?:slot|appointment|time)/i
        ],
        response: 'I\'ll help you update your availability slots'
      },
      {
        action: 'create_bulk_availability',
        patterns: [
          // Bulk operations
          /(?:bulk|multiple|many|several|batch|all|mass)(?:\s+\w+)*?\s*(?:slots?|appointments?|times?|availability|sessions?|meetings?)/i,
          /(?:every|each|all)(?:\s+\w+)*?\s*(?:day|week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening)/i,
          
          // Recurring patterns
          /(?:recurring|repeated|regular|weekly|daily|monthly|routine)(?:\s+\w+)*?\s*(?:slots?|appointments?|availability|meetings?|sessions?)/i,
          /(?:pattern|routine|schedule|template)(?:\s+\w+)*?\s*(?:slots?|availability|appointments?)/i,
          
          // Range patterns
          /(?:from|between)(?:\s+\w+)*?(?:\d+|monday|tuesday|wednesday|thursday|friday)(?:\s+\w+)*?\s*(?:to|and|until)(?:\s+\w+)*?(?:\d+|monday|tuesday|wednesday|thursday|friday)(?:\s+\w+)*?\s*(?:every|each|all|daily|weekly)/i,
          /(?:all|every)(?:\s+\w+)*?\s*(?:weekday|weekdays|weekend|weekends|morning|afternoon|evening)(?:\s+\w+)*?\s*(?:this|next|every)/i
        ],
        response: 'I\'ll help you create multiple availability slots'
      }
    ];

    let bestMatch: IntentDetectionResult = { action: null, confidence: 0, response: '' };

    for (const intentPattern of intentPatterns) {
      for (const pattern of intentPattern.patterns) {
        if (pattern.test(message)) {
          const confidence = this.calculateAdvancedPatternConfidence(message, pattern, intentPattern.action);
          if (confidence > bestMatch.confidence) {
            bestMatch = {
              action: intentPattern.action,
              confidence,
              response: intentPattern.response
            };
          }
        }
      }
    }

    return bestMatch;
  }

  private calculateAdvancedPatternConfidence(message: string, pattern: RegExp, action: string): number {
    const matches = message.match(pattern);
    if (!matches) return 0;
    
    // Advanced confidence calculation with multiple factors
    let confidence = 0.7;
    
    // Factor 1: Keyword density and relevance
    const actionKeywords = {
      'get_availability_data': ['show', 'display', 'view', 'see', 'check', 'list', 'get', 'retrieve', 'availability', 'schedule', 'calendar', 'free', 'busy'],
      'create_availability_slot': ['create', 'add', 'make', 'new', 'book', 'schedule', 'set', 'availability', 'slot', 'appointment'],
      'delete_availability_slot': ['delete', 'remove', 'cancel', 'clear', 'eliminate', 'erase', 'unbook'],
      'update_availability_slot': ['update', 'modify', 'change', 'edit', 'reschedule', 'move', 'shift', 'adjust'],
      'create_bulk_availability': ['bulk', 'multiple', 'many', 'several', 'batch', 'all', 'recurring', 'repeated']
    };
    
    const relevantKeywords = actionKeywords[action as keyof typeof actionKeywords] || [];
    const foundKeywords = relevantKeywords.filter(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
    confidence += (foundKeywords.length / relevantKeywords.length) * 0.2;
    
    // Factor 2: Natural language indicators
    const nlIndicators = [
      /\b(what|how|when|where|why|which)\b/i,
      /\b(show me|tell me|help me|can you|please|i want|i need|i'd like)\b/i,
      /\b(today|tomorrow|this week|next week|morning|afternoon|evening)\b/i
    ];
    
    for (const indicator of nlIndicators) {
      if (indicator.test(message)) {
        confidence += 0.1;
      }
    }
    
    // Factor 3: Message structure and completeness
    const wordCount = message.split(/\s+/).length;
    if (wordCount >= 3 && wordCount <= 15) {
      confidence += 0.05; // Optimal length
    }
    
    // Factor 4: Temporal context
    const temporalWords = /\b(at|on|from|to|until|between|during|before|after)\b/i;
    if (temporalWords.test(message)) {
      confidence += 0.08;
    }
    
    return Math.min(confidence, 0.95); // Cap at 0.95 to leave room for improvement
  }

  private performAdvancedSemanticAnalysis(message: string): IntentDetectionResult {
    const lowerMessage = message.toLowerCase();
    
    // Semantic keyword analysis for intent detection
    const semanticScores = {
      get_availability_data: 0,
      create_availability_slot: 0,
      delete_availability_slot: 0,
      update_availability_slot: 0,
      create_bulk_availability: 0
    };
    
    // Analyze semantic indicators
    const semanticIndicators = {
      get_availability_data: [
        'what', 'how many', 'show', 'display', 'list', 'view', 'see', 'check', 'find', 'get',
        'available', 'free', 'busy', 'schedule', 'calendar', 'my', 'availability', 'slots',
        'tell me', 'let me see', 'i want to see', 'i need to know'
      ],
      create_availability_slot: [
        'create', 'add', 'make', 'new', 'book', 'schedule', 'set up', 'setup', 'establish',
        'i want to add', 'i need to create', 'help me make', 'can you add', 'please create'
      ],
      delete_availability_slot: [
        'delete', 'remove', 'cancel', 'clear', 'eliminate', 'erase', 'drop', 'take away',
        'get rid of', 'free up', 'unblock', 'no longer need', 'dont need', 'cancel'
      ],
      update_availability_slot: [
        'update', 'modify', 'change', 'move', 'edit', 'reschedule', 'adjust', 'alter', 'shift',
        'make it different', 'change time', 'move to', 'different time'
      ],
      create_bulk_availability: [
        'bulk', 'multiple', 'many', 'several', 'batch', 'all', 'every', 'each',
        'recurring', 'repeated', 'regular', 'weekly', 'daily', 'pattern', 'routine'
      ]
    };
    
    // Calculate semantic scores
    for (const [action, indicators] of Object.entries(semanticIndicators)) {
      for (const indicator of indicators) {
        if (lowerMessage.includes(indicator)) {
          semanticScores[action as keyof typeof semanticScores] += 0.1;
        }
      }
    }
    
    // Find best semantic match
    const bestAction = Object.entries(semanticScores)
      .reduce((a, b) => semanticScores[a[0] as keyof typeof semanticScores] > semanticScores[b[0] as keyof typeof semanticScores] ? a : b)[0];
    
    const confidence = semanticScores[bestAction as keyof typeof semanticScores];
    
    if (confidence > 0.3) {
      const responses = {
        get_availability_data: 'I\'ll retrieve your availability information',
        create_availability_slot: 'I\'ll help you create availability',
        delete_availability_slot: 'I\'ll help you remove availability',
        update_availability_slot: 'I\'ll help you modify your availability',
        create_bulk_availability: 'I\'ll help you create multiple availability slots'
      };
      
      return {
        action: bestAction,
        confidence: Math.min(confidence, 0.8), // Cap semantic confidence
        response: responses[bestAction as keyof typeof responses]
      };
    }
    
    return { action: null, confidence: 0, response: '' };
  }

  private performContextualAnalysis(message: string): IntentDetectionResult {
    const context = this.toolService.getContext();
    
    // Contextual analysis based on existing context
    if (context && context.recentActions && context.recentActions.length > 0) {
      const contextScore = this.calculateContextualScore(message, context.recentActions);
      
      if (contextScore > 0.5) {
        const action = this.inferActionFromContext(context.recentActions);
        const response = this.generateResponseFromContext(context.recentActions, action);
        
        return {
          action,
          confidence: contextScore,
          response
        };
      }
    }
    
    return { action: null, confidence: 0, response: '' };
  }

  private calculateContextualScore(message: string, recentActions: string[]): number {
    let score = 0;
    
    // Context-specific scoring logic
    // Increase score if message contains keywords related to recent actions
    const actionKeywords = {
      'get_availability_data': ['show', 'display', 'see', 'view', 'check'],
      'create_availability_slot': ['create', 'add', 'make', 'new', 'book'],
      'delete_availability_slot': ['delete', 'remove', 'cancel', 'clear'],
      'update_availability_slot': ['update', 'change', 'modify', 'edit']
    };
    
    for (const action of recentActions) {
      const keywords = actionKeywords[action as keyof typeof actionKeywords] || [];
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          score += 0.2;
        }
      }
    }
    
    return Math.min(score, 1.0);
  }

  private inferActionFromContext(recentActions: string[]): string {
    // Infer action based on recent actions context
    // Use the most recent action as a hint
    const latestAction = recentActions[recentActions.length - 1];
    return latestAction || 'get_availability_data';
  }

  private generateResponseFromContext(recentActions: string[], action: string): string {
    // Generate response based on context and action
    const responseTemplates: Record<string, string> = {
      get_availability_data: 'Based on our conversation, I\'ll get your availability information.',
      create_availability_slot: 'Following up on our discussion, I\'ll create that availability slot.',
      delete_availability_slot: 'As we discussed, I\'ll remove those availability slots.',
      update_availability_slot: 'Continuing from before, I\'ll update your availability.',
      create_bulk_availability: 'As requested earlier, I\'ll create multiple availability slots.'
    };
    
    return responseTemplates[action] || 'I\'ll help you with your request.';
  }

  private combineIntentResults(results: IntentDetectionResult[]): IntentDetectionResult {
    // Combine multiple intent detection results with weighted scoring
    const scores = results.map(result => result.confidence);
    const maxScore = Math.max(...scores);
    const bestResultIndex = scores.indexOf(maxScore);
    
    return results[bestResultIndex];
  }
}