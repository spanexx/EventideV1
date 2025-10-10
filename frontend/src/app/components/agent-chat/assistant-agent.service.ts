import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AssistantChatOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface AssistantRagOptions {
  enableRAG?: boolean;
  ragCategory?: string;
  minSimilarity?: number;
  maxContextLength?: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequestBody {
  message: string;
  conversationHistory?: ConversationMessage[];
  options?: AssistantChatOptions;
}

export interface ChatRagRequestBody extends ChatRequestBody {
  ragOptions?: AssistantRagOptions;
}

export interface RouteRecommendation {
  text: string;
  route: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  model: string;
  sources?: any[];
  routeRecommendations?: RouteRecommendation[];
}

export interface GenerateContentRequestBody {
  prompt: string;
  systemPrompt?: string;
}

export interface GenerateContentResponse {
  success: boolean;
  content: string;
  model: string;
}

export interface AssistantHealth {
  status: 'healthy' | 'unhealthy';
  availableModels?: number;
  model?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AssistantAgentService {
  private readonly baseUrl = `${environment.apiUrl}/agents/assistant`;

  constructor(private http: HttpClient) {}

  chat(body: ChatRequestBody): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, body);
  }

  chatRag(body: ChatRagRequestBody): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat-rag`, body);
  }

  generateContent(body: GenerateContentRequestBody): Observable<GenerateContentResponse> {
    return this.http.post<GenerateContentResponse>(`${this.baseUrl}/generate-content`, body);
  }

  health(): Observable<AssistantHealth> {
    return this.http.get<AssistantHealth>(`${this.baseUrl}/health`);
  }
}
