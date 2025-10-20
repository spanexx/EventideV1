/*
 * WebSocket Service Example
 * 
 * This is an example of how to use the socket.io-client in the frontend
 * to connect to the backend WebSocket server.
 */

import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

export interface WebSocketNotification {
  id: string;
  type: 'booking' | 'availability' | 'system' | 'payment';
  title: string;
  message: string;
  data?: any;
  source?: 'websocket' | 'ui' | 'storage';
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;
  private notificationsSubject = new BehaviorSubject<WebSocketNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private joinedUserId?: string;

  constructor(private store: Store) {
    // Load any persisted notifications
    const storedNotifications = localStorage.getItem('websocket_notifications');
    if (storedNotifications) {
      this.notificationsSubject.next(JSON.parse(storedNotifications));
    }

    // Build a proper WS base URL. Many apps set apiUrl like http://host:3000/api, but socket.io should connect to http://host:3000
    const wsBase = environment.wsUrl
      ? environment.wsUrl
      : (environment.apiUrl ? environment.apiUrl.replace(/\/?api\/?$/, '') : '');

    // Connect to the WebSocket server with retry options
    this.socket = io(wsBase || window.location.origin, {
      transports: ['websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    // Listen for connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server with ID:', this.socket.id);
      // Re-join user room after reconnect if needed
      if (this.joinedUserId) {
        this.joinUserRoom(this.joinedUserId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Listen for availability updates (batched)
    this.socket.on('availabilityUpdated', (payload) => {
      console.log('Availability updated:', payload);
      this.handleAvailabilityUpdate(payload);
    });

    // Listen for granular availability events
    this.socket.on('availabilityCreated', (slot) => {
      this.store.dispatch({ type: '[Availability] Create Availability Success', availability: this.normalizeSlot(slot) } as any);
    });
    this.socket.on('availabilityDeleted', ({ id }) => {
      this.store.dispatch({ type: '[Availability] Delete Availability Success', id } as any);
    });
    this.socket.on('availabilityUpdatedSingle', (slot) => {
      this.store.dispatch({ type: '[Availability] Update Availability Success', availability: this.normalizeSlot(slot) } as any);
    });

    // Listen for room-specific events
    this.socket.on('joinedRoom', (room) => {
      console.log('Joined room:', room);
    });

    this.socket.on('leftRoom', (room) => {
      console.log('Left room:', room);
    });

    // Listen for notification events
    this.socket.on('notification', (notification: WebSocketNotification) => {
      console.log('Received notification:', notification);
      this.handleNotification(notification);
    });

    // Listen for connection events for debugging
    this.socket.on('connect', () => {
      console.log('WebSocket connected with ID:', this.socket.id);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        this.socket.connect();
      }
    });

    this.socket.on('bookingNotification', (data: any) => {
      this.handleNotification({
        id: Date.now().toString(),
        type: 'booking',
        title: 'Booking Update',
        message: data.message || 'You have a booking update',
        data
      });
    });

    this.socket.on('paymentNotification', (data: any) => {
      this.handleNotification({
        id: Date.now().toString(),
        type: 'payment',
        title: 'Payment Update',
        message: data.message || 'Payment status updated',
        data
      });
    });
  }

  // Join a provider's room to receive real-time updates
  joinProviderRoom(providerId: string): void {
    this.socket.emit('joinRoom', `provider-${providerId}`);
  }

  // Leave a provider's room
  leaveProviderRoom(providerId: string): void {
    this.socket.emit('leaveRoom', `provider-${providerId}`);
  }

  // Handle availability updates
  private handleAvailabilityUpdate(data: any): void {
    // This is where you would update your application state
    // For example, using NgRx store or Angular signals
    console.log('Processing availability update for provider:', data.providerId);
    
    // If payload is an array of slots, we could dispatch load success
    if (Array.isArray(data?.data)) {
      const normalized = data.data.map((s: any) => this.normalizeSlot(s));
      this.store.dispatch({ type: '[Availability] Load Availability Success', availability: normalized } as any);
    }
  }

  private normalizeSlot(slot: any) {
    return {
      ...slot,
      id: slot._id || slot.id,
      date: slot.date ? new Date(slot.date) : undefined,
      startTime: slot.startTime ? new Date(slot.startTime) : undefined,
      endTime: slot.endTime ? new Date(slot.endTime) : undefined,
    };
  }

  // Handle incoming notifications
  private handleNotification(notification: WebSocketNotification): void {
    const currentNotifications = this.notificationsSubject.value;
    // Add source to the notification
    const notificationWithSource = {
      ...notification,
      source: 'websocket' as const
    };
    
    // Check if notification already exists to prevent duplicates
    if (!currentNotifications.some(n => n.id === notification.id)) {
      const updatedNotifications = [notificationWithSource, ...currentNotifications];
      this.notificationsSubject.next(updatedNotifications);
      // Persist to localStorage for backup
      localStorage.setItem('websocket_notifications', JSON.stringify(updatedNotifications));
      console.debug('New notification received:', notificationWithSource);
    }
  }

  // Join user-specific room for notifications
  joinUserRoom(userId: string): void {
    if (!userId) return;
    console.log('Attempting to join room for user:', userId);
    this.socket.emit('joinRoom', `user-${userId}`);
    this.joinedUserId = userId;
    
    // Setup reconnection handler for this room
    this.socket.on('connect', () => {
      if (this.joinedUserId) {
        console.log('Reconnected, rejoining room for user:', this.joinedUserId);
        this.socket.emit('joinRoom', `user-${this.joinedUserId}`);
      }
    });
  }

  // Leave user-specific room
  leaveUserRoom(userId: string): void {
    if (!userId) return;
    this.socket.emit('leaveRoom', `user-${userId}`);
    if (this.joinedUserId === userId) {
      this.joinedUserId = undefined;
    }
  }

  // Convenience: ensure we are joined to the given user room (idempotent behavior on reconnect)
  ensureJoinedUserRoom(userId?: string | null) {
    if (!userId) return;
    if (this.joinedUserId !== userId) {
      this.joinUserRoom(userId);
    }
  }

  // Get current notifications
  getNotifications(): WebSocketNotification[] {
    return this.notificationsSubject.value;
  }

  // Public API to update notifications array and persist it.
  // Accepts any object shape so UI can add `read`/`timestamp` fields.
  updateNotifications(notifications: WebSocketNotification[] | any[], source: 'ui' | 'storage' = 'ui'): void {
    try {
      // Add source to notifications if not already present
      const notificationsWithSource = notifications.map(n => ({
        ...n,
        source: n.source || source
      }));
      
      this.notificationsSubject.next(notificationsWithSource as WebSocketNotification[]);
      localStorage.setItem('websocket_notifications', JSON.stringify(notificationsWithSource));
      console.debug('WebsocketService: notifications updated', notificationsWithSource);
    } catch (err) {
      console.error('WebsocketService:updateNotifications failed', err);
    }
  }

  // Clear all notifications
  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  // Disconnect from the WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}