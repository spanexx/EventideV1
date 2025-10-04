import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AIToolService } from './ai-tool.service';
import { AITool, AIToolResponse, AIConversationContext } from './ai-tool-definitions';
import { AIChatSessionService } from './ai-chat-session.service';
import { AIChatProcessorService } from './ai-chat-processor.service';
import { AIChatFormatterService } from './ai-chat-formatter.service';
import { ChatMessage, ChatSession, AIProcessingResult } from './ai-chat-interfaces';

// Re-export interfaces for external components
export type { ChatMessage, ChatSession, AIProcessingResult } from './ai-chat-interfaces';

@Injectable({
  providedIn: 'root'
})
export class AIChatService {
  private readonly API_URL = `${environment.apiUrl}/ai/chat`;
  
  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  
  public currentSession$: Observable<ChatSession | null>;
  public messages$: Observable<ChatMessage[]>;
  public isProcessing$ = this.isProcessingSubject.asObservable();
  public isConnected$ = this.isConnectedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private toolService: AIToolService,
    private sessionService: AIChatSessionService,
    private processorService: AIChatProcessorService,
    private formatterService: AIChatFormatterService
  ) {
    console.log('[AIChatService] Constructor called');
    console.log('[AIChatService] API_URL:', this.API_URL);
    
    // Initialize observables after sessionService is available
    this.currentSession$ = this.sessionService.currentSession$;
    this.messages$ = this.sessionService.messages$;
    
    this.isConnectedSubject.next(true);
  }

  async sendMessage(content: string): Promise<void> {
    console.log('[AIChatService] sendMessage called with content:', content);
    
    if (!content.trim()) {
      console.log('[AIChatService] Empty content, returning early');
      return;
    }

    console.log('[AIChatService] Setting processing to true');
    this.isProcessingSubject.next(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: this.sessionService.generateMessageId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      metadata: {
        context: this.toolService.getContext()
      }
    };

    console.log('[AIChatService] Adding user message:', userMessage);
    this.sessionService.addMessage(userMessage);

    try {
      console.log('[AIChatService] Starting AI processing...');
      // Process the message with AI
      const result = await this.processWithAI(content);
      console.log('[AIChatService] AI processing completed:', result);
      
      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: this.sessionService.generateMessageId(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        metadata: {
          toolCalls: result.toolCalls,
          context: this.toolService.getContext()
        }
      };

      console.log('[AIChatService] Adding assistant message:', assistantMessage);
      this.sessionService.addMessage(assistantMessage);

    } catch (error: any) {
      console.error('[AIChatService] Error during AI processing:', error);
      // Add error message
      const errorMessage: ChatMessage = {
        id: this.sessionService.generateMessageId(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${error.message}. Please try again or rephrase your request.`,
        timestamp: new Date()
      };

      console.log('[AIChatService] Adding error message:', errorMessage);
      this.sessionService.addMessage(errorMessage);
    } finally {
      console.log('[AIChatService] Setting processing to false');
      this.isProcessingSubject.next(false);
    }
  }

  private async processWithAI(message: string): Promise<AIProcessingResult> {
    console.log('[AIChatService] processWithAI called with message:', message);
    
    const context = this.toolService.getContext();
    const tools = this.toolService.getTools();
    
    console.log('[AIChatService] Current context:', context);
    console.log('[AIChatService] Available tools count:', tools.length);
    
    const payload = {
      message,
      context,
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      })),
      conversationHistory: this.sessionService.getRecentMessages(5)
    };

    console.log('[AIChatService] Payload for backend:', payload);

    try {
      console.log('[AIChatService] Calling backend AI service at:', `${this.API_URL}/process`);
      
      // Call backend AI service
      const response = await this.http.post<{
        response: string;
        toolCalls: Array<{
          name: string;
          parameters: any;
        }>;
        suggestedActions: string[];
      }>(`${this.API_URL}/process`, payload).toPromise();

      console.log('[AIChatService] Backend response:', response);

      // Execute tool calls
      const toolCallResults = [];
      
      if (response!.toolCalls && response!.toolCalls.length > 0) {
        console.log('[AIChatService] Executing', response!.toolCalls.length, 'tool calls');
        
        for (const toolCall of response!.toolCalls) {
          console.log('[AIChatService] Executing tool:', toolCall.name, 'with params:', toolCall.parameters);
          
          try {
            const result = await this.toolService.executeTool(
              toolCall.name, 
              toolCall.parameters
            );
            
            console.log('[AIChatService] Tool execution result:', result);
            
            toolCallResults.push({
              toolName: toolCall.name,
              parameters: toolCall.parameters,
              result
            });
          } catch (error: any) {
            console.error('[AIChatService] Tool execution failed:', error);
            
            toolCallResults.push({
              toolName: toolCall.name,
              parameters: toolCall.parameters,
              result: {
                success: false,
                error: error.message,
                message: `Failed to execute ${toolCall.name}: ${error.message}`
              }
            });
          }
        }
      } else {
        console.log('[AIChatService] No tool calls in response');
      }

      // Enhance response with tool results
      const enhancedResponse = this.formatterService.enhanceResponseWithToolResults(
        response!.response,
        toolCallResults
      );

      const result = {
        response: enhancedResponse,
        toolCalls: toolCallResults,
        suggestedActions: response!.suggestedActions || []
      };
      
      console.log('[AIChatService] Final processing result with enhanced response:', result);
      return result;

    } catch (error: any) {
      console.error('[AIChatService] Backend call failed, falling back to local processing:', error);
      
      // Fallback to local processing if backend fails
      return await this.processorService.processLocallyWithPatterns(message);
    }
  }

  // Public methods for UI

  clearChat(): void {
    this.sessionService.clearChat();
  }

  newSession(): void {
    this.sessionService.newSession();
  }

  getSessionHistory(): ChatSession[] {
    return this.sessionService.getSessionHistory();
  }

  getCurrentContext(): AIConversationContext {
    return this.toolService.getContext();
  }

  updateContext(updates: Partial<AIConversationContext>): void {
    this.toolService.updateContext(updates);
  }

  getAvailableTools(): AITool[] {
    return this.toolService.getTools();
  }
}