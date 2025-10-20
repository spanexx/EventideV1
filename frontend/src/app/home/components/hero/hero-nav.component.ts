import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { selectIsAuthenticated } from '../../../auth/store/auth/selectors/auth.selectors';
import * as AuthActions from '../../../auth/store/auth/actions/auth.actions';
import { WebsocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-hero-nav',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatMenuModule, MatDividerModule, MatBadgeModule],
  template: `
    <div class="hero-nav">
      <div class="logo-container">
        <img src="/logo.png" alt="Eventide" class="logo">
      </div>
      <div class="auth-buttons">
        <button mat-icon-button class="nav-icon-btn track-booking-btn" (click)="navigateToBookingLookup()" 
                matTooltip="Track your booking" matTooltipPosition="below">
          <mat-icon>search</mat-icon>
        </button>
        
        <!-- Logged out state -->
        <ng-container *ngIf="!(isLoggedIn$ | async)">
          <button mat-icon-button class="nav-icon-btn login-btn" (click)="navigateToLogin()" 
                  matTooltip="Sign in to your account" matTooltipPosition="below">
            <mat-icon>login</mat-icon>
          </button>
          <button mat-icon-button class="nav-icon-btn signup-btn primary" (click)="navigateToSignup()" 
                  matTooltip="Create new account" matTooltipPosition="below">
            <mat-icon>person_add</mat-icon>
          </button>
        </ng-container>
        
        <!-- Logged in state -->
        <ng-container *ngIf="isLoggedIn$ | async">
          <button mat-icon-button class="nav-icon-btn notifications-btn" (click)="navigateToNotifications()"
                  matTooltip="View notifications" matTooltipPosition="below"
                  [matBadge]="unreadCount"
                  matBadgeColor="warn"
                  [matBadgeHidden]="unreadCount === 0">
            <mat-icon>notifications</mat-icon>
          </button>
          <button mat-icon-button class="nav-icon-btn profile-btn primary" [matMenuTriggerFor]="profileMenu"
                  matTooltip="Your profile" matTooltipPosition="below">
            <mat-icon>account_circle</mat-icon>
          </button>
          
          <mat-menu #profileMenu="matMenu" class="profile-menu">
            <button mat-menu-item (click)="navigateToProfile()">
              <mat-icon>person</mat-icon>
              <span>My Profile</span>
            </button>
            <button mat-menu-item (click)="navigateToBookings()">
              <mat-icon>event</mat-icon>
              <span>My Bookings</span>
            </button>
            <button mat-menu-item (click)="navigateToSettings()">
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </mat-menu>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .hero-nav { 
      position: relative; 
      z-index: 10; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 24px 48px; 
      animation: fadeInDown 0.8s ease-out; 
    }
    .logo-container .logo { 
      height: 48px; 
      width: auto; 
      filter: brightness(0) invert(1); 
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      cursor: pointer;
    }
    .logo-container .logo:hover { 
      transform: scale(1.05) rotate(1deg); 
    }
    .auth-buttons { 
      display: flex; 
      gap: 8px; 
      align-items: center; 
    }
    .nav-icon-btn {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .nav-icon-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.6s;
    }
    .nav-icon-btn:hover::before {
      left: 100%;
    }
    .nav-icon-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    .nav-icon-btn:active {
      transform: translateY(0) scale(0.95);
    }
    .nav-icon-btn.primary {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
      border-color: rgba(102, 126, 234, 0.3);
    }
    .nav-icon-btn.primary:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }
    .nav-icon-btn mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      transition: transform 0.2s ease;
    }
    .nav-icon-btn:hover mat-icon {
      transform: scale(1.1);
    }
    
    /* Notification badge styling */
    .notifications-btn {
      position: relative !important;
      overflow: visible !important;
    }
    .notifications-btn ::ng-deep .mat-badge-content {
      position: absolute !important;
      background: #ff4757 !important;
      color: white !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      width: 20px !important;
      height: 20px !important;
      line-height: 20px !important;
      border-radius: 10px !important;
      border: 2px solid rgba(255, 255, 255, 0.9) !important;
      top: 4px !important;
      right: 4px !important;
      transform: none !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
    }
    
    @keyframes fadeInDown { 
      from { 
        opacity: 0; 
        transform: translateY(-20px); 
      } 
      to { 
        opacity: 1; 
        transform: translateY(0); 
      } 
    }
    @media (max-width: 768px) {
      .hero-nav {
        padding: 16px 20px;
      }
      .nav-icon-btn {
        width: 44px;
        height: 44px;
      }
      .nav-icon-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class HeroNavComponent implements OnInit, OnDestroy {
  isLoggedIn$: Observable<boolean>;
  unreadCount = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private store: Store,
    private websocketService: WebsocketService
  ) {
    this.isLoggedIn$ = this.store.select(selectIsAuthenticated);
  }

  ngOnInit(): void {
    // Subscribe to WebSocket notifications
    this.websocketService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.unreadCount = notifications.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  navigateToSignup() {
    this.router.navigate(['/auth/signup']);
  }

  navigateToBookingLookup() {
    this.router.navigate(['/booking-lookup']);
  }

  navigateToNotifications() {
    this.router.navigate(['/notifications']);
  }

  navigateToProfile() {
    this.router.navigate(['/dashboard']);
  }

  navigateToBookings() {
    this.router.navigate(['/dashboard/bookings']);
  }

  navigateToSettings() {
    this.router.navigate(['/dashboard/settings']);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
    this.router.navigate(['/']);
  }
}
