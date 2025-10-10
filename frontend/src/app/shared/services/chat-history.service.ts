import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatHistoryService {
  private readonly STORAGE_KEY = 'eventide_chat_history';
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor() {
    // Load chat history from localStorage on service initialization
    this.loadChatHistory();
  }

  private loadChatHistory(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert string dates back to Date objects
        const messages: ChatMessage[] = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        this.messagesSubject.next(messages);
      } else {
        // Start empty; the UI can trigger a welcome if desired
        this.messagesSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading chat history from localStorage:', error);
      this.messagesSubject.next([]);
    }
  }

  private saveChatHistory(): void {
    try {
      const messages = this.messagesSubject.value;
      // Convert Date objects to strings for JSON serialization
      const serializableMessages = messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializableMessages));
    } catch (error) {
      console.error('Error saving chat history to localStorage:', error);
    }
  }

  addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = [...currentMessages, message];
    this.messagesSubject.next(updatedMessages);
    this.saveChatHistory();
  }

  addUserMessage(content: string): void {
    const message: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date()
    };
    this.addMessage(message);
  }

  addAssistantMessage(content: string): void {
    const message: ChatMessage = {
      role: 'assistant',
      content,
      timestamp: new Date()
    };
    this.addMessage(message);
  }

  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  clearChat(): void {
    this.messagesSubject.next([]);
    try { localStorage.removeItem(this.STORAGE_KEY); } catch {}
  }

  updateLastAssistantMessage(content: string): void {
    const currentMessages = this.messagesSubject.value;
    if (currentMessages.length > 0) {
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        const updatedMessages = [...currentMessages];
        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          content
        };
        this.messagesSubject.next(updatedMessages);
        this.saveChatHistory();
      }
    }
  }
}