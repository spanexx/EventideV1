import { Injectable, Logger, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { RAGService } from '../../modules/knowledge-base/services/rag.service';
import { KnowledgeBaseService } from '../../modules/knowledge-base/knowledge-base.service';
import { RouteRecommendationService } from '../../modules/knowledge-base/services/route-recommendation.service';
import axios from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RAGOptions {
  enableRAG?: boolean;
  ragCategory?: string;
  minSimilarity?: number;
  maxContextLength?: number;
}

export interface AssistantResponse {
  success: boolean;
  content: string;
  model: string;
  totalDuration?: number;
  sources?: any[];
  routeRecommendations?: { text: string; route: string }[];
}

@Injectable()
export class AssistantAgentService {
  private readonly logger = new Logger(AssistantAgentService.name);
  private ollamaClient: Ollama;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => RAGService))
    private readonly ragService: RAGService,
    private readonly routeRecommendationService: RouteRecommendationService,
  ) {
    // Initialize Ollama client
    this.ollamaClient = new Ollama({
      host: this.configService.get<string>('OLLAMA_HOST', 'http://localhost:11434'),
    });
    
    // Use the model from config, default to gemma2:2b
    this.model = this.configService.get<string>('OLLAMA_MODEL', 'gemma2:2b');
    
    this.logger.log(`Assistant Agent Service initialized with model: ${this.model}`);
  }

  // Compose provider-agnostic messages
  private toPlainText(messages: ChatMessage[]): string {
    return messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
  }

  private getActiveModelLabel(): string {
    const gem = this.configService.get<string>('GEMINI_API_KEY');
    const orKey = this.configService.get<string>('OPENROUTER_API_KEY');
    if (gem) return 'gemini-2.5-flash';
    if (orKey) return 'openrouter:gpt-4o-mini';
    return this.model;
  }

  private async generateWithFallback(messages: ChatMessage[], opts: { temperature: number; maxTokens: number; }): Promise<string> {
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    const openrouterKey = this.configService.get<string>('OPENROUTER_API_KEY');

    // Try Gemini (API key via Google AI Studio REST)
    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
        const payload = {
          contents: [
            {
              parts: [{ text: this.toPlainText(messages) }]
            }
          ],
          generationConfig: {
            temperature: opts.temperature,
            maxOutputTokens: opts.maxTokens
          }
        };
        const res = await axios.post(url, payload, { timeout: 20000 });
        const data: any = res.data as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && typeof text === 'string') return text;
        this.logger.warn('Gemini returned no text, falling back...');
      } catch (e) {
        this.logger.warn(`Gemini failed: ${e?.message || e}`, e);
      }
    }

    // Try OpenRouter (OpenAI-compatible chat)
    if (openrouterKey) {
      try {
        const url = 'https://openrouter.ai/api/v1/chat/completions';
        const payload = {
          model: 'mistralai/mistral-small-3.2-24b-instruct:free',
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: opts.temperature,
          max_tokens: opts.maxTokens
        };
        const res = await axios.post(url, payload, {
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000,
        });
        const data: any = res.data as any;
        const text = data?.choices?.[0]?.message?.content;
        if (text && typeof text === 'string') return text;
        this.logger.warn('OpenRouter returned no text, falling back...');
      } catch (e) {
        this.logger.warn(`OpenRouter failed: ${e?.message || e}`, e);
      }
    }

    // Fallback: Ollama
    const response = await this.ollamaClient.chat({
      model: this.model,
      messages,
      options: {
        temperature: opts.temperature,
        num_predict: Math.min(opts.maxTokens, 256),
      },
    });
    return response.message.content;
  }

  async generateResponse(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {},
    ragOptions?: RAGOptions
  ): Promise<AssistantResponse> {
    try {
      this.logger.log(`Generating response with ${messages.length} messages`);
      this.logger.log(`RAG options:`, ragOptions);

      // Create a system message that includes the current page context if available
      let systemMessageContent = 'You are EventideV1’s in‑app assistant. Keep replies short and friendly (≤80 words). Use only EventideV1 internal knowledge. If unsure, briefly say you’re not certain, ask ONE short clarifying question, and suggest up to 3 internal routes formatted as [Text](/route). Do not invent features. Only use internal routes such as /auth/login, /auth/signup, /dashboard/overview, /dashboard/bookings. Never output external URLs.';      
      if (ragOptions?.ragCategory) {
        systemMessageContent += ` The user is currently on the "${ragOptions.ragCategory}" page. Provide specific help related to this page's functionality whenever possible.`;
      }

      const systemMessage: ChatMessage = {
        role: 'system',
        content: systemMessageContent
      };

      let processedMessages = messages;
      let sources: any[] = [];

      // If RAG is enabled, enhance the last user message with relevant context
      if (ragOptions?.enableRAG) {
        const ragResult = await this.enhanceMessagesWithRAG(messages, ragOptions);
        processedMessages = ragResult.processedMessages;
        sources = ragResult.sources;
      }

      // Provider fallback: Gemini -> OpenRouter -> Ollama
      const content = await this.generateWithFallback([systemMessage, ...processedMessages], {
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 1024,
      });

      this.logger.log('Response generated successfully');
      
      // Process route recommendations from the response
      const { processedText, recommendations } = this.routeRecommendationService.extractRouteRecommendations(content);
      
      console.log('[AssistantAgentService] Route processing result:', { processedText: processedText.substring(0, 200) + '...', recommendations });
      
      return {
        success: true,
        content: processedText,
        model: this.getActiveModelLabel(),
        sources,
        routeRecommendations: recommendations, // Include route recommendations in the response
      };
    } catch (error) {
      this.logger.error('Error generating response with Ollama', error);
      throw new HttpException(
        `Error communicating with Ollama: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async generateContent(prompt: string, systemPrompt?: string, ragOptions?: RAGOptions): Promise<AssistantResponse> {
    try {
      this.logger.log(`Generating content with prompt: ${prompt.substring(0, 100)}...`);
      this.logger.log(`RAG options:`, ragOptions);
      
      // Create a system message that includes the current page context if available
      let systemMessageContent = 'You are a helpful assistant for the EventideV1 application. Your goal is to answer user questions accurately based on the provided context. If the context does not contain the answer, inform the user that you do not have that information. While you should not make up information, you can synthesize and summarize the information from the context to provide a comprehensive and user-friendly answer. When suggesting navigation options, reference only internal routes found in the knowledge base. Format any suggested links as [Link Text](route) where route is the internal navigation path that starts with "/". ABSOLUTELY NO external URLs, absolute paths, or full domain URLs (like https://domain.com/path) should be generated. Use ONLY the internal routes provided in the knowledge base, such as /auth/login, /auth/signup, /dashboard/overview, etc.';
      
      if (ragOptions?.ragCategory) {
        systemMessageContent += ` The user is currently on the "${ragOptions.ragCategory}" page. Provide specific help related to this page's functionality whenever possible.`;
      }

      const systemMessage: ChatMessage = {
        role: 'system',
        content: systemMessageContent
      };

      let messages: ChatMessage[] = [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt }
      ];

      let sources: any[] = [];
      // If RAG is enabled, enhance the prompt with relevant context
      if (ragOptions?.enableRAG) {
        const ragResult = await this.enhanceMessagesWithRAG(messages, ragOptions);
        messages = ragResult.processedMessages;
        sources = ragResult.sources;
      }

      const content = await this.generateWithFallback([systemMessage, ...messages], {
        temperature: 0.7,
        maxTokens: 1024,
      });

      this.logger.log('Content generated successfully');
      
      // Process route recommendations from the response
      const { processedText, recommendations } = this.routeRecommendationService.extractRouteRecommendations(content);
      
      return {
        success: true,
        content: processedText,
        model: this.getActiveModelLabel(),
        sources,
        routeRecommendations: recommendations, // Include route recommendations in the response
      };
    } catch (error) {
      this.logger.error('Error generating content with Ollama', error);
      throw new HttpException(
        `Error communicating with Ollama: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async enhanceMessagesWithRAG(
    messages: ChatMessage[],
    ragOptions: RAGOptions
  ): Promise<{processedMessages: ChatMessage[], sources: any[]}> {
    this.logger.log('Enhancing messages with RAG');
    this.logger.log(`RAG Options - Category: ${ragOptions.ragCategory}, Min Similarity: ${ragOptions.minSimilarity}`);
    try {
      // Find the last user message to enhance with context
      let lastUserMessageIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMessageIndex = i;
          break;
        }
      }

      if (lastUserMessageIndex === -1) {
        this.logger.log('No user message to enhance');
        return { processedMessages: messages, sources: [] }; // No user message to enhance
      }

      const userMessage = messages[lastUserMessageIndex].content;
      this.logger.log(`User message to enhance: ${userMessage}`);
      
      // Get relevant context from knowledge base
      const { context, sources } = await this.ragService.getRelevantContext(
        userMessage,
        5, // limit
        ragOptions.ragCategory,
        ragOptions.minSimilarity || 0.7
      );
      this.logger.log(`Context found: ${!!context}, Sources found: ${sources.length}`);

      if (context && context.trim()) {
        // Construct enhanced prompt with retrieved context
        let enhancedContent = `
You are a helpful assistant for the EventideV1 application. A user is asking about the capabilities of the system. Based on the following context, provide a clear and concise summary of what the user can do with the EventideV1 application. Even if the context is technical, extract the user-facing functionalities and present them in an easy-to-understand way.

CONTEXT:
${context}

USER QUESTION:
${userMessage}
        `.trim();
        
        // If we have a specific page context, make the prompt more targeted
        if (ragOptions.ragCategory) {
          enhancedContent = `
You are a helpful assistant for the EventideV1 application. The user is currently on the "${ragOptions.ragCategory}" page. Provide specific help related to this page's functionality. Based on the following context, answer the user's question with focus on how it relates to the current page.

CONTEXT:
${context}

USER QUESTION:
${userMessage}
          `.trim();
        }

        // Update the last user message with the enhanced content
        messages[lastUserMessageIndex] = {
          ...messages[lastUserMessageIndex],
          content: enhancedContent
        };

        this.logger.log(`Enhanced user message with RAG context from ${sources.length} documents`);
      }

      return { processedMessages: messages, sources };
    } catch (error) {
      this.logger.error('Error in enhanceMessagesWithRAG', error);
      return { processedMessages: messages, sources: [] }; // Return original messages on error
    }
  }



  async healthCheck() {
    try {
      // Try to list models as a simple health check
      const response = await this.ollamaClient.list();
      return {
        status: 'healthy',
        availableModels: response.models?.length || 0,
        model: this.model,
      };
    } catch (error) {
      this.logger.error('Ollama health check failed', error);
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}