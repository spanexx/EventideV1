import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './services/auth.service';
import { CalendarInitializationService } from './dashboard/services/calendar-initialization.service';
import { AgentChatComponent } from './components/agent-chat/agent-chat.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AgentChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(
    private authService: AuthService,
    private calendarInitializationService: CalendarInitializationService
  ) {}

  ngOnInit(): void {
    // Verify authentication token
    this.authService.verifyToken().subscribe();
    
    // Initialize calendar preferences system
    console.log('[App] Initializing calendar preferences system');
    this.calendarInitializationService.initialize();
  }
}
