import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRippleModule } from '@angular/material/core';
import { WebsocketService } from '../core/services/websocket.service';
import { NotificationService } from '../core/services/notification.service';
import { Subject, takeUntil } from 'rxjs';
import { Router } from '@angular/router';

export interface Notification {
  id: string;
  type: 'booking' | 'availability' | 'system' | 'payment';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatBadgeModule,
    MatTooltipModule,
    MatRippleModule
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private websocketService: WebsocketService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.setupWebSocketListeners();
    this.loadNotifications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  private setupWebSocketListeners() {
    // Subscribe to the WebsocketService's notifications stream
    this.websocketService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        // Convert WebSocketNotification to our Notification format
        // Preserve read flag and timestamp if provided by the backend
        const updatedNotifications = notifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: n.emittedAt ? new Date(n.emittedAt) : (n.timestamp ? new Date(n.timestamp) : new Date()),
          read: typeof n.read === 'boolean' ? n.read : false,
          data: n.data
        }));

        // Only update if the notifications have actually changed
        if (JSON.stringify(this.notifications) !== JSON.stringify(updatedNotifications)) {
          this.notifications = updatedNotifications;
          // Only persist to localStorage, skip websocket service update to prevent recursion
          localStorage.setItem('websocket_notifications', JSON.stringify(this.notifications));
        }
      });
  }

  private loadNotifications() {
    // Prefer loading current notifications from the WebsocketService
    const currentNotifications = this.websocketService.getNotifications();
    if (currentNotifications && currentNotifications.length > 0) {
      this.notifications = currentNotifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: n.emittedAt ? new Date(n.emittedAt) : (n.timestamp ? new Date(n.timestamp) : new Date()),
        read: typeof n.read === 'boolean' ? n.read : false,
        data: n.data,
        source: n.source
      }));
      return;
    }

    // Fallback: read persisted notifications from service-local storage key
    const stored = localStorage.getItem('websocket_notifications') || localStorage.getItem('notifications');
    if (stored) {
      this.notifications = JSON.parse(stored).map((n: any) => ({
        ...n,
        timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        read: typeof n.read === 'boolean' ? n.read : false,
        source: 'storage'
      }));
      // Sync into service
      this.websocketService.updateNotifications(this.notifications, 'storage');
    }
  }

  trackByNotification(index: number, notification: Notification): string {
    return notification.id;
  }

  getIcon(type: string): string {
    switch (type) {
      case 'booking': return 'event';
      case 'availability': return 'schedule';
      case 'system': return 'info';
      case 'payment': return 'payment';
      default: return 'notifications';
    }
  }

  getIconClass(type: string): string {
    return `${type}-icon`;
  }

  formatTimestamp(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString();
  }

  markAsRead(notification: Notification) {
    if (!notification.read) {
      // Update local notification
  console.debug('markAsRead called for', notification.id);
  notification.read = true;
      
      // Find and update in notifications array
      const index = this.notifications.findIndex(n => n.id === notification.id);
      if (index !== -1) {
        this.notifications[index] = { ...notification };
      }
      
      // Save to localStorage
      this.saveNotifications();
      
      // Update in WebSocket service
      // Update websocket service via public API
      const wsNotifications = this.websocketService.getNotifications();
      const updatedWsNotifications = wsNotifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      );
      this.websocketService.updateNotifications(updatedWsNotifications);
      
      // Show success message
      this.notificationService.success('Notification marked as read');
    }
  }

  markAllAsRead() {
    if (this.unreadCount === 0) return;
    
    // Update all notifications
    this.notifications = this.notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    // Save to localStorage
    this.saveNotifications();
    
    // Update all in WebSocket service
    const wsNotifications = this.websocketService.getNotifications();
    const updatedWsNotifications = wsNotifications.map(n => ({
      ...n,
      read: true
    }));
    this.websocketService.updateNotifications(updatedWsNotifications);
    
    // Show success message
    this.notificationService.success('All notifications marked as read');
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notificationService.success('All notifications cleared');
  }

  private saveNotifications(source: 'ui' | 'storage' = 'ui') {
    try {
      // Store current notifications from service for comparison
      const currentServiceNotifications = this.websocketService.getNotifications();
      const currentJson = JSON.stringify(currentServiceNotifications);
      const newJson = JSON.stringify(this.notifications);
      
      // Only update if notifications have changed and they're not from websocket
      if (currentJson !== newJson) {
        this.websocketService.updateNotifications(this.notifications as any, source);
      }
    } catch (err) {
      console.error('Failed to save notifications', err);
      // Fallback to local storage only
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }
  }



  // Method to add new notifications (called by WebSocket service)
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
  this.saveNotifications();

    // Show toast notification
    this.notificationService.info(notification.title, { duration: 5000 });
  }

  navigateToBookings() {
    this.router.navigate(['/dashboard/bookings']);
  }

  goHome() {
    this.router.navigate(['/home']);
  }

  goBack() {
    if (window.history.length > 1) { 
      window.history.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
