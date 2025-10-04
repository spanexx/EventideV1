import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AIChatService, ChatMessage, ChatSession } from '../../services/ai-chat/ai-chat.service';
import { AIConversationContext } from '../../services/ai-chat/ai-tool-definitions';

export interface FloatingChatState {
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isDragging: boolean;
  isResizing: boolean;
}

@Component({
  selector: 'app-floating-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './floating-ai-chat.component.html',
  styleUrls: ['./floating-ai-chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FloatingAIChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;
  @ViewChild('messagesContainer', { static: false }) messagesContainer!: ElementRef;
  @ViewChild('messageInput', { static: false }) messageInput!: ElementRef;

  private destroy$ = new Subject<void>();

  // Observables
  messages$: Observable<ChatMessage[]>;
  isProcessing$: Observable<boolean>;
  isConnected$: Observable<boolean>;
  currentSession$: Observable<ChatSession | null>;

  // Component state
  state: FloatingChatState = {
    isOpen: false,
    isMinimized: false,
    position: { x: window.innerWidth - 420, y: window.innerHeight - 600 },
    size: { width: 400, height: 580 },
    isDragging: false,
    isResizing: false
  };

  currentMessage = '';
  dragStart = { x: 0, y: 0 };
  resizeStart = { x: 0, y: 0, width: 0, height: 0 };

  // Chat features
  showSuggestions = false;
  suggestions: string[] = [
    'Create a slot tomorrow at 2 PM',
    'Show my availability this week',
    'Delete all unbooked slots',
    'Analyze my schedule patterns',
    'Optimize my schedule'
  ];

  constructor(private aiChatService: AIChatService) {
    console.log('[FloatingAIChatComponent] Constructor called');
    
    this.messages$ = this.aiChatService.messages$;
    this.isProcessing$ = this.aiChatService.isProcessing$;
    this.isConnected$ = this.aiChatService.isConnected$;
    this.currentSession$ = this.aiChatService.currentSession$;
    
    console.log('[FloatingAIChatComponent] Observables initialized');
  }

  ngOnInit(): void {
    console.log('[FloatingAIChatComponent] ngOnInit called');
    
    this.loadChatState();

    // Auto-scroll messages when new ones arrive
    this.messages$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((messages) => {
      console.log('[FloatingAIChatComponent] Messages updated:', messages);
      setTimeout(() => this.scrollToBottom(), 100);
    });
    
    // Debug: Log processing state changes
    this.isProcessing$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isProcessing) => {
      console.log('[FloatingAIChatComponent] Processing state changed:', isProcessing);
    });
    
    // Debug: Log connection state changes
    this.isConnected$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((isConnected) => {
      console.log('[FloatingAIChatComponent] Connection state changed:', isConnected);
    });
  }

  ngOnDestroy(): void {
    this.saveChatState();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Chat state management
  toggleChat(): void {
    this.state.isOpen = !this.state.isOpen;
    if (this.state.isOpen) {
      this.state.isMinimized = false;
      setTimeout(() => this.focusInput(), 100);
    }
    this.saveChatState();
  }

  minimizeChat(): void {
    this.state.isMinimized = !this.state.isMinimized;
    this.saveChatState();
  }

  closeChat(): void {
    this.state.isOpen = false;
    this.state.isMinimized = false;
    this.saveChatState();
  }

  // Message handling
  async sendMessage(): Promise<void> {
    console.log('[FloatingAIChatComponent] sendMessage called with message:', this.currentMessage);
    
    if (!this.currentMessage.trim()) {
      console.log('[FloatingAIChatComponent] Empty message, returning');
      return;
    }

    const message = this.currentMessage.trim();
    this.currentMessage = '';
    
    console.log('[FloatingAIChatComponent] Sending message to AI service:', message);
    await this.aiChatService.sendMessage(message);
    
    console.log('[FloatingAIChatComponent] Message sent, focusing input');
    this.focusInput();
  }

  @HostListener('keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    // Global keyboard shortcut to toggle chat (Ctrl+/)
    if (event.ctrlKey && event.key === '/') {
      event.preventDefault();
      this.toggleChat();
    }
  }

  onTextareaKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Allow shift+enter for new line
        return;
      }
      
      event.preventDefault();
      this.sendMessage();
    }
  }

  selectSuggestion(suggestion: string): void {
    this.currentMessage = suggestion;
    this.showSuggestions = false;
    this.sendMessage();
  }

  toggleSuggestions(): void {
    this.showSuggestions = !this.showSuggestions;
  }

  clearChat(): void {
    this.aiChatService.clearChat();
  }

  newSession(): void {
    this.aiChatService.newSession();
  }

  // Drag functionality
  onDragStart(event: MouseEvent): void {
    if (event.target && (event.target as HTMLElement).closest('.chat-content, .message-input-container')) {
      return; // Don't drag when clicking on content areas
    }

    this.state.isDragging = true;
    this.dragStart.x = event.clientX - this.state.position.x;
    this.dragStart.y = event.clientY - this.state.position.y;
    
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onDragMove(event: MouseEvent): void {
    if (!this.state.isDragging && !this.state.isResizing) return;

    if (this.state.isDragging) {
      this.state.position.x = Math.max(0, Math.min(
        window.innerWidth - this.state.size.width,
        event.clientX - this.dragStart.x
      ));
      this.state.position.y = Math.max(0, Math.min(
        window.innerHeight - this.state.size.height,
        event.clientY - this.dragStart.y
      ));
    }

    if (this.state.isResizing) {
      const deltaX = event.clientX - this.resizeStart.x;
      const deltaY = event.clientY - this.resizeStart.y;
      
      this.state.size.width = Math.max(300, Math.min(800, this.resizeStart.width + deltaX));
      this.state.size.height = Math.max(400, Math.min(800, this.resizeStart.height + deltaY));
    }
  }

  @HostListener('document:mouseup')
  onDragEnd(): void {
    if (this.state.isDragging || this.state.isResizing) {
      this.state.isDragging = false;
      this.state.isResizing = false;
      this.saveChatState();
    }
  }

  // Resize functionality
  onResizeStart(event: MouseEvent): void {
    this.state.isResizing = true;
    this.resizeStart.x = event.clientX;
    this.resizeStart.y = event.clientY;
    this.resizeStart.width = this.state.size.width;
    this.resizeStart.height = this.state.size.height;
    
    event.preventDefault();
    event.stopPropagation();
  }

  // Window resize handling
  @HostListener('window:resize')
  onWindowResize(): void {
    // Keep chat within window bounds
    this.state.position.x = Math.min(this.state.position.x, window.innerWidth - this.state.size.width);
    this.state.position.y = Math.min(this.state.position.y, window.innerHeight - this.state.size.height);
    this.saveChatState();
  }

  // Utility methods
  private focusInput(): void {
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  private setupKeyboardShortcuts(): void {
    // Keyboard shortcuts are now handled by @HostListener
  }

  private loadChatState(): void {
    const saved = localStorage.getItem('floatingChatState');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        this.state = { ...this.state, ...parsedState };
        
        // Ensure position is within current window bounds
        this.state.position.x = Math.min(this.state.position.x, window.innerWidth - this.state.size.width);
        this.state.position.y = Math.min(this.state.position.y, window.innerHeight - this.state.size.height);
      } catch (error) {
        console.warn('Failed to load chat state:', error);
      }
    }
  }

  private saveChatState(): void {
    const stateToSave = {
      isOpen: this.state.isOpen,
      isMinimized: this.state.isMinimized,
      position: this.state.position,
      size: this.state.size
    };
    localStorage.setItem('floatingChatState', JSON.stringify(stateToSave));
  }

  // Getters for template
  get chatStyle(): any {
    return {
      position: 'fixed',
      left: `${this.state.position.x}px`,
      top: `${this.state.position.y}px`,
      width: `${this.state.size.width}px`,
      height: this.state.isMinimized ? '60px' : `${this.state.size.height}px`,
      'z-index': 9999,
      transition: this.state.isDragging || this.state.isResizing ? 'none' : 'all 0.3s ease',
      cursor: this.state.isDragging ? 'grabbing' : 'default'
    };
  }

  get fabStyle(): any {
    return {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      'z-index': 9998
    };
  }

  // Message formatting helpers
  formatTimestamp(timestamp: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(timestamp));
  }

  formatMessageContent(content: string): string {
    // Simple formatting for now - could be enhanced with markdown support
    return content.replace(/\n/g, '<br>');
  }

  getMessageIcon(message: ChatMessage): string {
    return message.role === 'user' ? 'person' : 'smart_toy';
  }

  hasToolCalls(message: ChatMessage): boolean {
    return !!message.metadata?.toolCalls && message.metadata.toolCalls.length > 0;
  }

  getToolCallSummary(message: ChatMessage): string {
    if (!message.metadata?.toolCalls) return '';
    
    const tools = message.metadata.toolCalls.map((tc: any) => tc.toolName).join(', ');
    return `Executed: ${tools}`;
  }

  trackMessage(index: number, message: ChatMessage): string {
    return message.id;
  }

  adjustTextareaHeight(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
}