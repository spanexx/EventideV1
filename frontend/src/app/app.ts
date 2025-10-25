import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadAppearancePreferences } from './store/appearance';

import { AuthService } from './services/auth.service';
import { CalendarInitializationService } from './dashboard/services/calendar-initialization.service';
import { AgentChatComponent } from './components/agent-chat/agent-chat.component';
import { ThemeService } from './core/services/theme.service';
import { RoutePersistenceService } from './core/services/route-persistence.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AgentChatComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  constructor(
    private authService: AuthService,
    private calendarInitializationService: CalendarInitializationService,
    private store: Store,
    private themeService: ThemeService,
    private routePersistence: RoutePersistenceService,
  ) {}

  ngOnInit(): void {
    // Start tracking route navigation for persistence
    console.log('[App] Starting route persistence tracking');
    this.routePersistence.startTracking();
    // Persist current URL right away (helps on hard refresh)
    this.routePersistence.captureCurrentUrl();

    // Verify authentication token
    this.authService.verifyToken().subscribe();

    // Initialize calendar preferences system
    console.log('[App] Initializing calendar preferences system');
    this.calendarInitializationService.initialize();

    // Initialize appearance preferences
    console.log('[App] Loading appearance preferences');
    this.store.dispatch(loadAppearancePreferences());

    // Initialize theme watching for system theme changes
    this.themeService.watchSystemThemeChanges();
  }
}
