import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from './llm.service';

@Injectable()
export class NlpAnalyzerService {
  private readonly logger = new Logger(NlpAnalyzerService.name);

  constructor(private readonly llmService: LlmService) {}

  async analyzeQuery(query: string, context?: any) {
    try {
      this.logger.log(`Enhancing query with LLM: "${query}"`, { context });
      const llmResult = await this.llmService.understandQuery(query, context);
      if (llmResult && typeof llmResult === 'object' && (llmResult as any).action) {
        const action = String((llmResult as any).action).toLowerCase();
        switch (action) {
          case 'create':
            return { action: 'create', productData: (llmResult as any).productData };
          case 'delete':
            return { action: 'delete', deleteData: (llmResult as any).deleteData };
          case 'get_id':
          case 'getid':
          case 'get_id':
            return { action: 'getid', getidData: (llmResult as any).getidData };
          case 'check_availability':
            return { 
              action: 'check_availability', 
              availabilityData: (llmResult as any).availabilityData
            };
          case 'book_slot':
            return {
              action: 'book_slot',
              bookingData: (llmResult as any).bookingData
            };
          case 'search':
          default:
            return { action: 'search', query: (llmResult as any).query || query };
        }
      }
    } catch (err: any) {
      this.logger.warn('LLM analysis failed, falling back to rule-based parser: ' + (err?.message || err));
    }

    return this.analyzeQueryRuleBased(query, context);
  }

  private analyzeQueryRuleBased(query: string, context?: any) {
    const lowerQuery = query.toLowerCase();
    
    // availability check
    if (lowerQuery.includes('available') || lowerQuery.includes('free') || lowerQuery.includes('book') || lowerQuery.includes('slot') || lowerQuery.includes('appointment')) {
      const dateRegex = /(?:on|for|at)?\s*(\d{1,2}(?:\/|-)\d{1,2}(?:\/|-)\d{2,4}|\d{4}-\d{2}-\d{2})/i;
      const timeRegex = /(?:at)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i;
      
      const dateMatch = query.match(dateRegex);
      const timeMatch = query.match(timeRegex);
      
      if (dateMatch || timeMatch) {
        return {
          action: 'check_availability',
          availabilityData: {
            date: dateMatch ? dateMatch[1] : undefined,
            time: timeMatch ? timeMatch[1] : undefined,
            context
          }
        };
      }
      
      return { 
        action: 'suggest_availability', 
        message: "Please specify a date and/or time for availability check" 
      };
    }

    // booking request
    if (lowerQuery.includes('book') || lowerQuery.includes('schedule') || lowerQuery.includes('reserve')) {
      const dateTimeMatch = query.match(/(?:on|for|at)?\s*(\d{1,2}(?:\/|-)\d{1,2}(?:\/|-)\d{2,4}|\d{4}-\d{2}-\d{2})\s*(?:at)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      
      if (dateTimeMatch) {
        return {
          action: 'book_slot',
          bookingData: {
            date: dateTimeMatch[1],
            time: dateTimeMatch[2],
            context
          }
        };
      }
      
      return { 
        action: 'suggest_booking', 
        message: "Please specify both date and time for booking" 
      };
    }
    
    // creation
    if (lowerQuery.includes('add') || lowerQuery.includes('create') || lowerQuery.includes('new') || lowerQuery.includes('make')) {
      const priceRegex = /(\d+(?:\.\d+)?)/;
      const priceMatch = query.match(priceRegex);
      if (priceMatch) {
        let nameMatch = lowerQuery.match(/(?:add|create|make)\s+(?:me\s+|the\s+|a\s+|an\s+)?(.+?)\s+(\d+(?:\.\d+))\s+(.+)/i);
        if (!nameMatch) {
          nameMatch = lowerQuery.match(/(?:add|create|new|make)\s+(?:product\s+)?(.+?)\s+(\d+(?:\.\d+))\s+(.+)/i);
        }
        if (nameMatch) {
          return { action: 'create', productData: { name: nameMatch[1].trim(), price: nameMatch[2], description: nameMatch[3].trim() } };
        }
      } else {
        const createMatch = lowerQuery.match(/(?:add|create|make|new)\s+(?:a\s+|an\s+|the\s+|me\s+)?(.+?)$/i);
        if (createMatch) {
          return { action: 'create', productData: { name: createMatch[1].trim(), price: '0', description: 'No description provided' } };
        }
      }
      return { action: 'suggest_create', message: "To add use: 'add Name 9.99 description'" };
    }

    // deletion
    if (lowerQuery.includes('delete') || lowerQuery.includes('remove') || lowerQuery.includes('erase')) {
      const idMatch = lowerQuery.match(/id\s*(\d+)/i);
      if (idMatch) {
        return { action: 'delete', deleteData: { id: idMatch[1], name: null } };
      }
      return { action: 'suggest_delete', message: "Use: 'delete id 5' or specify a name" };
    }

    // get id
    if (lowerQuery.includes('get id') || lowerQuery.includes('show id') || lowerQuery.match(/(product|item)\s+(?:number|no|id)\s+\d+/i)) {
      const idMatch = lowerQuery.match(/(?:id|number|no)\s*(\d+)|(\d+)\s*(?:id|number|no)?/i);
      if (idMatch) {
        const id = idMatch[1] || idMatch[2];
        return { action: 'getid', getidData: { id } };
      }
      return { action: 'suggest_getid', message: "Use: 'get id 5'" };
    }

    return { action: 'search', query };
  }
}
