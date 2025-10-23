# EventideV1 AI Chatbot Integration Guide: Using OpenAI Agents SDK with Ollama

**Author:** Manus AI  
**Date:** October 8, 2025

This comprehensive guide demonstrates how to integrate an AI-powered chatbot into your EventideV1 application using the OpenAI Agents JS SDK with Ollama as a cost-free local LLM provider. This approach enables natural language interactions for creating availability slots and booking appointments without incurring OpenAI API costs during development.

## Architecture Overview

The integration follows a three-tier architecture that leverages your existing EventideV1 infrastructure:

**Frontend (Angular)** → **Backend Agent Service (NestJS)** → **Local LLM (Ollama)** → **EventideV1 API**

The Angular frontend provides a chat interface where users can interact with an AI agent in natural language. The NestJS backend hosts the OpenAI agent logic, which uses custom tools to interact with your existing EventideV1 API endpoints. Ollama runs locally and provides an OpenAI-compatible API endpoint, eliminating the need for paid API calls during development.

## Part 1: Setting Up Ollama for Local Development

Ollama provides experimental compatibility with the OpenAI API, making it a drop-in replacement for development purposes. This section covers the installation and configuration of Ollama.

### Installation

For **Linux/macOS**, install Ollama using the official installation script:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

For **Windows**, download the installer from [ollama.com](https://ollama.com).

### Downloading Models

After installation, download a suitable model for your chatbot. For development, we recommend starting with a smaller, faster model and upgrading to larger models as needed:

```bash
# Recommended for development - fast and efficient
ollama pull gemma2:2b

# Alternative - more capable but slower
ollama pull llama3.2

# For production - most capable
ollama pull llama3.2:70b
```

### Starting the Ollama Server

The Ollama service typically starts automatically after installation. You can verify it's running by checking the endpoint:

```bash
curl http://localhost:11434/v1/models
```

If the server is not running, start it manually:

```bash
ollama serve
```

### Testing OpenAI Compatibility

Verify that Ollama's OpenAI-compatible endpoint is working correctly:

```bash
curl http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "gemma2:2b",
        "messages": [
            {
                "role": "user",
                "content": "Hello! Can you help me book an appointment?"
            }
        ]
    }'
```

## Part 2: Backend Integration - NestJS Agent Service

This section demonstrates how to create a NestJS service that uses the OpenAI Agents SDK with Ollama to interact with your EventideV1 API.

### Installing Dependencies

Navigate to your `EventideV1/backend` directory and install the required packages:

```bash
cd EventideV1/backend
npm install @openai/agents zod@3 openai axios
```

### Creating Custom Agent Tools

Create a new directory structure for your agent implementation:

```bash
mkdir -p src/agents/tools
```

#### Tool 1: Create Availability Slot

Create `src/agents/tools/availability.tools.ts`:

```typescript
import { tool } from '@openai/agents';
import { z } from 'zod';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

const API_BASE_URL = process.env.EVENTIDE_API_URL || 'http://localhost:3000';

export const createAvailabilitySlotTool = tool(
  z.object({
    providerId: z.string().describe('The ID of the provider creating the availability slot.'),
    startTime: z.string().datetime().describe('Start time in ISO 8601 format (e.g., 2025-10-27T09:00:00Z).'),
    endTime: z.string().datetime().describe('End time in ISO 8601 format (e.g., 2025-10-27T10:00:00Z).'),
    duration: z.number().int().positive().describe('Duration of each slot in minutes.'),
    date: z.string().datetime().optional().describe('Specific date for one-off availability (ISO 8601).'),
    dayOfWeek: z.enum(['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'])
      .optional()
      .describe('Day of week for recurring availability.'),
    maxBookings: z.number().int().positive().optional().default(1)
      .describe('Maximum number of bookings per slot.'),
  }),
  async ({ providerId, startTime, endTime, duration, date, dayOfWeek, maxBookings }) => {
    try {
      const token = process.env.EVENTIDE_AUTH_TOKEN;
      if (!token) {
        return 'Error: Authentication token not configured. Please contact the administrator.';
      }

      const payload = {
        providerId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        maxBookings,
        ...(date && { date: new Date(date), type: 'one-off' }),
        ...(dayOfWeek && { dayOfWeek, type: 'recurring' }),
      };

      const response = await axios.post(`${API_BASE_URL}/availability`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return `✅ Availability slot created successfully! Slot ID: ${response.data._id}. You can now accept bookings for this time slot.`;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      return `❌ Failed to create availability slot: ${errorMessage}. Please check the provided information and try again.`;
    }
  }
);

export const getAvailabilityTool = tool(
  z.object({
    providerId: z.string().describe('The ID of the provider whose availability to retrieve.'),
    startDate: z.string().datetime().optional().describe('Start date for filtering (ISO 8601).'),
    endDate: z.string().datetime().optional().describe('End date for filtering (ISO 8601).'),
  }),
  async ({ providerId, startDate, endDate }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_BASE_URL}/availability/${providerId}?${params.toString()}`
      );

      if (response.data.length === 0) {
        return 'No availability slots found for the specified criteria.';
      }

      const slots = response.data.map((slot: any) => {
        const start = new Date(slot.startTime).toLocaleString();
        const end = new Date(slot.endTime).toLocaleString();
        const booked = slot.isBooked ? '(BOOKED)' : '(AVAILABLE)';
        return `- ${start} to ${end} ${booked} [ID: ${slot._id}]`;
      }).join('\n');

      return `Found ${response.data.length} availability slot(s):\n${slots}`;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      return `❌ Failed to retrieve availability: ${errorMessage}`;
    }
  }
);
```

#### Tool 2: Create Booking

Create `src/agents/tools/booking.tools.ts`:

```typescript
import { tool } from '@openai/agents';
import { z } from 'zod';
import axios from 'axios';

const API_BASE_URL = process.env.EVENTIDE_API_URL || 'http://localhost:3000';

export const createBookingTool = tool(
  z.object({
    guestName: z.string().min(1).describe('Full name of the guest making the booking.'),
    guestEmail: z.string().email().describe('Email address of the guest.'),
    guestPhone: z.string().optional().describe('Phone number in international format (e.g., +1234567890).'),
    providerId: z.string().describe('ID of the provider for this booking.'),
    availabilityId: z.string().describe('ID of the availability slot to book.'),
    startTime: z.string().datetime().describe('Booking start time in ISO 8601 format.'),
    endTime: z.string().datetime().describe('Booking end time in ISO 8601 format.'),
    notes: z.string().optional().describe('Optional notes or special requests for the booking.'),
  }),
  async ({ guestName, guestEmail, guestPhone, providerId, availabilityId, startTime, endTime, notes }) => {
    try {
      const payload = {
        guestName,
        guestEmail,
        guestPhone,
        providerId,
        availabilityId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes,
      };

      const response = await axios.post(`${API_BASE_URL}/bookings`, payload);

      const booking = response.data;
      return `✅ Booking created successfully! 
Booking ID: ${booking._id}
Serial Key: ${booking.serialKey}
Guest: ${guestName}
Time: ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}
A confirmation email has been sent to ${guestEmail}.`;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      return `❌ Failed to create booking: ${errorMessage}. Please verify the availability slot is still open and all information is correct.`;
    }
  }
);

export const getBookingsTool = tool(
  z.object({
    guestEmail: z.string().email().optional().describe('Email address to find bookings for a specific guest.'),
    providerId: z.string().optional().describe('Provider ID to find all bookings for a provider.'),
  }),
  async ({ guestEmail, providerId }) => {
    try {
      let response;
      
      if (guestEmail) {
        // Note: In production, this should require verification
        response = await axios.get(`${API_BASE_URL}/bookings/guest/${guestEmail}`, {
          params: { verificationToken: 'dev-token' } // For development only
        });
      } else if (providerId) {
        const token = process.env.EVENTIDE_AUTH_TOKEN;
        response = await axios.get(`${API_BASE_URL}/bookings/provider`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { providerId }
        });
      } else {
        return 'Please provide either a guest email or provider ID to retrieve bookings.';
      }

      if (response.data.length === 0) {
        return 'No bookings found.';
      }

      const bookings = response.data.map((booking: any) => {
        const start = new Date(booking.startTime).toLocaleString();
        const status = booking.status.toUpperCase();
        return `- ${booking.guestName} | ${start} | Status: ${status} | ID: ${booking._id}`;
      }).join('\n');

      return `Found ${response.data.length} booking(s):\n${bookings}`;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      return `❌ Failed to retrieve bookings: ${errorMessage}`;
    }
  }
);
```

### Creating the Agent Service

Create `src/agents/eventide-agent.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { Agent, run } from '@openai/agents';
import { 
  createAvailabilitySlotTool, 
  getAvailabilityTool 
} from './tools/availability.tools';
import { 
  createBookingTool, 
  getBookingsTool 
} from './tools/booking.tools';

@Injectable()
export class EventideAgentService {
  private readonly logger = new Logger(EventideAgentService.name);
  private readonly openaiClient: OpenAI;
  private readonly eventideAgent: Agent;

  constructor(private configService: ConfigService) {
    // Configure OpenAI client to use local Ollama
    this.openaiClient = new OpenAI({
      baseURL: this.configService.get('OLLAMA_BASE_URL', 'http://localhost:11434/v1/'),
      apiKey: 'ollama', // Required but ignored by Ollama
    });

    // Create the EventideV1 agent with tools
    this.eventideAgent = new Agent({
      name: 'EventideAssistant',
      model: this.configService.get('OLLAMA_MODEL', 'gemma2:2b'),
      instructions: `You are EventideAssistant, an AI assistant for the EventideV1 scheduling platform. 
Your role is to help users manage their availability and bookings through natural conversation.

CAPABILITIES:
- Create availability slots for providers (one-off or recurring)
- View existing availability slots
- Create bookings for guests
- Retrieve booking information

GUIDELINES:
- Always be friendly, professional, and helpful
- Ask for missing information before using tools
- Confirm important details before creating bookings
- Provide clear feedback on successful operations
- Explain errors in user-friendly terms
- For availability creation, you need: providerId, start time, end time, duration, and either a specific date or day of week
- For bookings, you need: guest name, email, provider ID, availability ID, start time, and end time
- Always format dates and times clearly for the user
- When listing availability or bookings, present information in an easy-to-read format`,
      tools: {
        createAvailabilitySlot: createAvailabilitySlotTool,
        getAvailability: getAvailabilityTool,
        createBooking: createBookingTool,
        getBookings: getBookingsTool,
      },
      client: this.openaiClient,
    });
  }

  async processMessage(userMessage: string, conversationHistory?: any[]): Promise<string> {
    this.logger.log(`Processing message: ${userMessage}`);
    
    try {
      const result = await run(
        this.eventideAgent,
        userMessage,
        {
          // You can pass conversation history here if needed
          // messages: conversationHistory,
        }
      );

      this.logger.log(`Agent response generated successfully`);
      return result.finalOutput;
    } catch (error) {
      this.logger.error('Error processing message with agent:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.';
    }
  }
}
```

### Creating the Agent Controller

Create `src/agents/eventide-agent.controller.ts`:

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EventideAgentService } from './eventide-agent.service';

class ChatMessageDto {
  message: string;
  conversationHistory?: any[];
}

@ApiTags('eventide-agent')
@Controller('eventide-agent')
export class EventideAgentController {
  constructor(private readonly eventideAgentService: EventideAgentService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a message to the EventideV1 AI assistant' })
  @ApiResponse({ 
    status: 200, 
    description: 'Agent response',
    schema: {
      type: 'object',
      properties: {
        response: { type: 'string' }
      }
    }
  })
  @ApiBody({ type: ChatMessageDto })
  async chat(@Body() body: ChatMessageDto): Promise<{ response: string }> {
    const response = await this.eventideAgentService.processMessage(
      body.message,
      body.conversationHistory
    );
    return { response };
  }
}
```

### Creating the Agent Module

Create `src/agents/agents.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventideAgentService } from './eventide-agent.service';
import { EventideAgentController } from './eventide-agent.controller';

@Module({
  imports: [ConfigModule],
  providers: [EventideAgentService],
  controllers: [EventideAgentController],
  exports: [EventideAgentService],
})
export class AgentsModule {}
```

### Updating the App Module

Update `src/app.module.ts` to include the new `AgentsModule`:

```typescript
import { Module } from '@nestjs/common';
// ... other imports
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [
    // ... existing modules
    AgentsModule, // Add this line
  ],
  // ... rest of the module configuration
})
export class AppModule {}
```

### Environment Configuration

Add the following environment variables to your `.env` file in the backend directory:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434/v1/
OLLAMA_MODEL=gemma2:2b

# EventideV1 API Configuration
EVENTIDE_API_URL=http://localhost:3000
EVENTIDE_AUTH_TOKEN=your_jwt_token_here
```

## Part 3: Frontend Integration - Angular Chat Component

This section demonstrates how to create an Angular chat component that interacts with the backend agent service.

### Creating the Chat Service

Create `src/app/services/agent-chat.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgentChatService {
  private readonly apiUrl = `${environment.apiUrl}/eventide-agent`;
  private conversationHistory: ChatMessage[] = [];

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, {
      message,
      conversationHistory: this.conversationHistory
    });
  }

  addMessage(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: new Date()
    });
  }

  getConversationHistory(): ChatMessage[] {
    return this.conversationHistory;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}
```

### Creating the Chat Component

Create `src/app/components/agent-chat/agent-chat.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { AgentChatService, ChatMessage } from '../../services/agent-chat.service';

@Component({
  selector: 'app-agent-chat',
  templateUrl: './agent-chat.component.html',
  styleUrls: ['./agent-chat.component.scss']
})
export class AgentChatComponent implements OnInit {
  messages: ChatMessage[] = [];
  userInput: string = '';
  isLoading: boolean = false;
  isOpen: boolean = false;

  constructor(private agentChatService: AgentChatService) {}

  ngOnInit(): void {
    this.messages = this.agentChatService.getConversationHistory();
    
    // Add welcome message if this is a new conversation
    if (this.messages.length === 0) {
      this.addAssistantMessage(
        'Hello! I\'m EventideAssistant. I can help you create availability slots and manage bookings. How can I assist you today?'
      );
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (!this.userInput.trim() || this.isLoading) {
      return;
    }

    const userMessage = this.userInput.trim();
    this.userInput = '';
    this.isLoading = true;

    // Add user message to chat
    this.addUserMessage(userMessage);

    // Send to backend
    this.agentChatService.sendMessage(userMessage).subscribe({
      next: (response) => {
        this.addAssistantMessage(response.response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.addAssistantMessage(
          'I apologize, but I\'m having trouble connecting to the server. Please try again later.'
        );
        this.isLoading = false;
      }
    });
  }

  private addUserMessage(content: string): void {
    this.agentChatService.addMessage('user', content);
    this.messages = this.agentChatService.getConversationHistory();
    this.scrollToBottom();
  }

  private addAssistantMessage(content: string): void {
    this.agentChatService.addMessage('assistant', content);
    this.messages = this.agentChatService.getConversationHistory();
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  clearChat(): void {
    this.agentChatService.clearHistory();
    this.messages = [];
    this.addAssistantMessage(
      'Chat cleared. How can I help you?'
    );
  }
}
```

### Creating the Chat Component Template

Create `src/app/components/agent-chat/agent-chat.component.html`:

```html
<div class="chat-widget" [class.open]="isOpen">
  <!-- Chat Toggle Button -->
  <button class="chat-toggle" (click)="toggleChat()" *ngIf="!isOpen">
    <mat-icon>chat</mat-icon>
    <span>AI Assistant</span>
  </button>

  <!-- Chat Window -->
  <div class="chat-window" *ngIf="isOpen">
    <!-- Header -->
    <div class="chat-header">
      <div class="header-content">
        <mat-icon>smart_toy</mat-icon>
        <h3>EventideAssistant</h3>
      </div>
      <div class="header-actions">
        <button mat-icon-button (click)="clearChat()" matTooltip="Clear chat">
          <mat-icon>delete_outline</mat-icon>
        </button>
        <button mat-icon-button (click)="toggleChat()" matTooltip="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>

    <!-- Messages -->
    <div class="chat-messages">
      <div *ngFor="let message of messages" 
           class="message" 
           [class.user-message]="message.role === 'user'"
           [class.assistant-message]="message.role === 'assistant'">
        <div class="message-avatar">
          <mat-icon>{{ message.role === 'user' ? 'person' : 'smart_toy' }}</mat-icon>
        </div>
        <div class="message-content">
          <div class="message-text">{{ message.content }}</div>
          <div class="message-time">{{ message.timestamp | date:'short' }}</div>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div *ngIf="isLoading" class="message assistant-message">
        <div class="message-avatar">
          <mat-icon>smart_toy</mat-icon>
        </div>
        <div class="message-content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="chat-input">
      <mat-form-field appearance="outline" class="input-field">
        <input matInput 
               [(ngModel)]="userInput" 
               (keyup.enter)="sendMessage()"
               placeholder="Type your message..."
               [disabled]="isLoading">
      </mat-form-field>
      <button mat-fab 
              color="primary" 
              (click)="sendMessage()"
              [disabled]="!userInput.trim() || isLoading">
        <mat-icon>send</mat-icon>
      </button>
    </div>
  </div>
</div>
```

### Creating the Chat Component Styles

Create `src/app/components/agent-chat/agent-chat.component.scss`:

```scss
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;

  .chat-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #1976d2;
    color: white;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;

    &:hover {
      background: #1565c0;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
  }

  .chat-window {
    width: 400px;
    height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #1976d2;
      color: white;

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 500;
        }
      }

      .header-actions {
        display: flex;
        gap: 4px;

        button {
          color: white;
        }
      }
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f5f5f5;

      .message {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        animation: fadeIn 0.3s ease;

        .message-avatar {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e0e0e0;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        .message-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .message-text {
            padding: 12px 16px;
            border-radius: 12px;
            background: white;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            white-space: pre-wrap;
            word-wrap: break-word;
          }

          .message-time {
            font-size: 11px;
            color: #757575;
            padding: 0 4px;
          }
        }

        &.user-message {
          flex-direction: row-reverse;

          .message-avatar {
            background: #1976d2;
            color: white;
          }

          .message-content {
            align-items: flex-end;

            .message-text {
              background: #1976d2;
              color: white;
            }
          }
        }

        &.assistant-message {
          .message-avatar {
            background: #4caf50;
            color: white;
          }
        }
      }

      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

        span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #757575;
          animation: typing 1.4s infinite;

          &:nth-child(2) {
            animation-delay: 0.2s;
          }

          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }

    .chat-input {
      display: flex;
      gap: 8px;
      padding: 16px;
      background: white;
      border-top: 1px solid #e0e0e0;

      .input-field {
        flex: 1;
        margin: 0;

        ::ng-deep .mat-form-field-wrapper {
          padding-bottom: 0;
        }
      }

      button {
        flex-shrink: 0;
      }
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

// Responsive design
@media (max-width: 768px) {
  .chat-widget .chat-window {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
  }
}
```

### Updating the App Module

Update your `src/app/app.module.ts` to include the new component:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AppComponent } from './app.component';
import { AgentChatComponent } from './components/agent-chat/agent-chat.component';

@NgModule({
  declarations: [
    AppComponent,
    AgentChatComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Adding the Chat Component to Your App

Add the chat component to your main app template or any page where you want it to appear. For example, in `src/app/app.component.html`:

```html
<!-- Your existing app content -->
<router-outlet></router-outlet>

<!-- AI Chat Widget -->
<app-agent-chat></app-agent-chat>
```

## Part 4: Testing the Integration

### Starting the Services

Follow these steps to test your integration:

**Step 1: Start Ollama**

```bash
ollama serve
```

**Step 2: Start the Backend**

```bash
cd EventideV1/backend
npm run start:dev
```

**Step 3: Start the Frontend**

```bash
cd EventideV1/frontend
npm start
```

### Example Conversations

Here are some example interactions you can test with your chatbot:

**Creating Availability:**

```
User: I need to create availability slots for provider ID "provider123" on October 27, 2025, from 9 AM to 5 PM with 30-minute slots.




