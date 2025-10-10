import { Component, OnInit, HostListener } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { AssistantAgentService, ConversationMessage, ChatRagRequestBody } from './assistant-agent.service';
import { MarkdownRenderService } from '../../shared/services/markdown-render.service';
import { finalize, take } from 'rxjs';
import { TextFieldModule } from '@angular/cdk/text-field';
import { PageContextService } from '../../services/page-context.service';
import { ChatHistoryService, ChatMessage } from '../../shared/services/chat-history.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agent-chat',
  templateUrl: './agent-chat.component.html',
  styleUrls: ['./agent-chat.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    DatePipe,
    TextFieldModule
  ]
})
export class AgentChatComponent implements OnInit {
  userInput: string = '';
  isLoading: boolean = false;
  isOpen: boolean = false;
  currentPage: string = '';

  constructor(
    private assistantService: AssistantAgentService,
    private md: MarkdownRenderService,
    private pageContextService: PageContextService,
    public chatHistoryService: ChatHistoryService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Subscribe to page context changes
    this.pageContextService.currentPage$.subscribe(page => {
      this.currentPage = page;
      console.log('[AgentChat] Current page context:', page);
    });

    // Subscribe to chat history updates to handle auto-scroll
    this.chatHistoryService.messages$.subscribe(messages => {
      // Scroll to bottom when messages change
      setTimeout(() => {
        this.scrollToBottom();
      }, 0);
    });
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  onEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.shiftKey) {
      // allow newline
      return;
    }
    e.preventDefault();
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isLoading) {
      return;
    }

    const userMessage = this.userInput.trim();
    this.userInput = '';
    this.isLoading = true;
    console.log('[AgentChat] sendMessage userInput=', userMessage);
    console.log('[AgentChat] Current page context:', this.currentPage);

    // Add user message to chat
    this.chatHistoryService.addUserMessage(userMessage);

    // Build conversation history for backend (role/content only)
    const history: ConversationMessage[] = this.chatHistoryService.getMessages().map(m => ({ role: m.role, content: m.content }));

    // Send to backend via AssistantAgentService using RAG-enabled endpoint with page context
    const reqBody: ChatRagRequestBody = {
      message: userMessage,
      conversationHistory: history,
      ragOptions: {
        enableRAG: true,
        ragCategory: this.currentPage,  // Using page context as RAG category
        minSimilarity: 0.5
      }
    };
    console.log('[AgentChat] POST /chat-rag body=', reqBody);
    this.assistantService
      .chatRag(reqBody)
      .pipe(finalize(() => console.log('[AgentChat] chatRag finalize')))
      .subscribe({
        next: (response) => {
          console.log('[AgentChat] chatRag response=', response);
          const text = response?.response;
          if (text && typeof text === 'string' && text.trim().length > 0) {
            // Add a new assistant message instead of updating the last one
            this.chatHistoryService.addAssistantMessage(text);
            
            // Debug: Log the rendered HTML after a short delay
            setTimeout(() => {
              const chatMessages = document.querySelector('.chat-messages');
              if (chatMessages) {
                console.log('[AgentChat] Rendered chat HTML:', chatMessages.innerHTML.substring(0, 500) + '...');
                
                // Check if there are any route-link elements
                const routeLinks = chatMessages.querySelectorAll('.clickable-route');
                console.log('[AgentChat] Found route-link elements:', routeLinks.length);
                routeLinks.forEach((link, index) => {
                  console.log(`[AgentChat] Route-link ${index}:`, {
                    text: link.textContent,
                    route: link.getAttribute('data-route'),
                    className: link.className
                  });
                });
              }
            }, 100);
          } else {
            this.chatHistoryService.addAssistantMessage('Received empty response from assistant. Debug: ' + JSON.stringify(response)?.slice(0, 500));
          }
          // Need to wait a bit for the DOM to update before scrolling
          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[AgentChat] chatRag error=', error);
          this.chatHistoryService.addAssistantMessage(
            'I apologize, but I\'m having trouble connecting to the server. Please try again later.'
          );
          // Need to wait a bit for the DOM to update before scrolling
          setTimeout(() => {
            this.scrollToBottom();
          }, 0);
          this.isLoading = false;
        }
      });
  }

  private addUserMessage(content: string): void {
    this.chatHistoryService.addUserMessage(content);
  }

  private addAssistantMessage(content: string): void {
    console.log('[AgentChat] addAssistantMessage content=', content);
    this.chatHistoryService.addAssistantMessage(content);
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages') as HTMLElement | null;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  clearChat(): void {
    this.chatHistoryService.clearChat();
  }
  
  trackByFn(index: number, item: ChatMessage): any {
    return item.timestamp ? item.timestamp.getTime() : index;
  }

  // Delegate template click to existing document-level handler
  onMessageClick(event: Event): void {
    this.handleRouteLinkClick(event);
  }

  @HostListener('document:click', ['$event'])
  handleRouteLinkClick(event: Event): void {
    if (event.target instanceof HTMLElement) {
      const target = event.target;
      
      // Check if the clicked element is a route-link or inside a route-link
      // Look for elements with the specific route-link class
      const routeLinkElement = target.closest('.clickable-route') as HTMLElement | null;
      if (routeLinkElement) {
        event.preventDefault();
        event.stopPropagation();
        
        const route = routeLinkElement.getAttribute('data-route');
        // Only navigate if it's a valid internal route starting with /
        if (route && route.startsWith('/')) {
          // Additional validation to ensure it's a known route pattern
          const validRoutePatterns = [
            /^\/auth\//,
            /^\/dashboard\//,
            /^\/booking/,
            /^\/providers/,
            /^\/provider\//,
            /^\/home/,
            /^\/notifications/,
            /^\/booking-lookup/,
            /^\/booking-cancel\//
          ];
          
          const isValidRoute = validRoutePatterns.some(pattern => pattern.test(route));
          
          if (isValidRoute) {
            // Navigate to the route
            this.router.navigateByUrl(route);
            // Close the chat if it's open
            this.isOpen = false;
          } else {
            console.warn('Blocked navigation to potentially invalid route:', route);
          }
        } else {
          console.warn('Invalid route attempted (missing leading slash):', route);
        }
      }
    }
  }
  
  renderMarkdown(text: string): SafeHtml {
    return this.md.render(text);
  }
}
  



