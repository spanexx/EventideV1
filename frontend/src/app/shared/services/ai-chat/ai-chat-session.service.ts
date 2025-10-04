import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ChatMessage, ChatSession } from './ai-chat-interfaces';

@Injectable({
  providedIn: 'root'
})
export class AIChatSessionService {
  private currentSessionSubject = new BehaviorSubject<ChatSession | null>(null);
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  
  public currentSession$ = this.currentSessionSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

  constructor() {
    console.log('[AIChatSessionService] Constructor called');
    this.initializeSession();
  }

  initializeSession(): void {
    console.log('[AIChatSessionService] Initializing session...');
    
    const session: ChatSession = {
      id: this.generateSessionId(),
      userId: '', // Will be set when user context is available
      title: 'AI Assistant',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    console.log('[AIChatSessionService] Created session:', session.id);
    
    this.currentSessionSubject.next(session);
    this.messagesSubject.next([]);
    
    console.log('[AIChatSessionService] Session initialized successfully');
  }

  addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = [...currentMessages, message];
    this.messagesSubject.next(updatedMessages);
    
    // Update session
    const currentSession = this.currentSessionSubject.value;
    if (currentSession) {
      currentSession.messages = updatedMessages;
      currentSession.updatedAt = new Date();
      this.currentSessionSubject.next(currentSession);
    }
  }

  getRecentMessages(count: number): ChatMessage[] {
    const messages = this.messagesSubject.value;
    return messages.slice(-count);
  }

  clearChat(): void {
    this.messagesSubject.next([]);
    const currentSession = this.currentSessionSubject.value;
    if (currentSession) {
      currentSession.messages = [];
      currentSession.updatedAt = new Date();
      this.currentSessionSubject.next(currentSession);
    }
  }

  newSession(): void {
    this.initializeSession();
  }

  getSessionHistory(): ChatSession[] {
    // This would retrieve from storage/backend in a real implementation
    const currentSession = this.currentSessionSubject.value;
    return currentSession ? [currentSession] : [];
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}