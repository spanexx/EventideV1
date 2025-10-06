import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import * as DashboardActions from './store-dashboard/actions/dashboard.actions';
import * as AuthSelectors from '../auth/store/auth';
import { DashboardSocketService } from './services/dashboard-socket.service';
import { DashboardHeaderComponent } from './components/header/header.component';
import { DashboardSidebarComponent } from './components/sidebar/sidebar.component';
import { FloatingAIChatComponent } from '../shared/components/floating-ai-chat/floating-ai-chat.component';
import { AIChatService } from '../shared/services/ai-chat/ai-chat.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    DashboardHeaderComponent,
    DashboardSidebarComponent,
    FloatingAIChatComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(FloatingAIChatComponent) aiChat!: FloatingAIChatComponent;
  
  private destroy$ = new Subject<void>();
  isSidebarOpen = true;
  private currentUserId: string = '';

  constructor(
    private store: Store,
    private socketService: DashboardSocketService,
    private router: Router,
    private aiChatService: AIChatService
  ) { }

  ngOnInit(): void {
    this.store.dispatch(DashboardActions.loadDashboardStats());
    this.store.dispatch(DashboardActions.loadRecentActivity());

    // Set up user context for AI chat
    this.store.select(AuthSelectors.selectUser).pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user && user.id) {
        this.currentUserId = user.id;
        this.socketService.joinProviderRoom(user.id);
        
        // Update AI chat context with user information
        this.aiChatService.updateContext({
          userId: user.id,
          currentPage: this.router.url,
          currentDate: new Date()
        });
      }
    });

    // Track route changes for AI context awareness
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.aiChatService.updateContext({
        userId: this.currentUserId,
        currentPage: event.url,
        currentDate: new Date()
      });
    });
  }

  ngAfterViewInit(): void {
    // Initialize AI chat context after view is ready
    if (this.aiChat && this.currentUserId) {
      this.aiChatService.updateContext({
        userId: this.currentUserId,
        currentPage: this.router.url,
        currentDate: new Date()
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
