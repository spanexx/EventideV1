import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { User } from '../../../services/auth.service';
import * as AuthActions from '../../../auth/store/auth';
import * as AuthSelectors from '../../../auth/store/auth';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { WebsocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatMenuModule, MatButtonModule, MatBadgeModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class DashboardHeaderComponent implements OnInit, OnDestroy {
  @Output() toggleSidebar = new EventEmitter<void>();

  user$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;
  unreadCount = 0;
  private destroy$ = new Subject<void>();
  
  constructor(
    private store: Store, 
    private router: Router,
    private websocketService: WebsocketService
  ) {
    this.user$ = this.store.select(AuthSelectors.selectUser);
    this.isAuthenticated$ = this.store.select(AuthSelectors.selectIsAuthenticated);
  }

  ngOnInit(): void {
    // Subscribe to WebSocket notifications
    this.websocketService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.unreadCount = notifications.length;
      });

    // Join user-specific WS room when authenticated
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        const userId = (user as any)?.id || (user as any)?._id || (user as any)?.userId;
        if (userId) {
          this.websocketService.ensureJoinedUserRoom(userId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  logout(): void {
    // Leave WS room on logout
    this.user$.pipe().subscribe((user) => {
      const userId = (user as any)?.id || (user as any)?._id || (user as any)?.userId;
      if (userId) {
        this.websocketService.leaveUserRoom(userId);
      }
    }).unsubscribe?.();

    this.store.dispatch(AuthActions.logout());
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }
}
