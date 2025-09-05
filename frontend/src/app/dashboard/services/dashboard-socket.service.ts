import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import * as DashboardActions from '../store/actions/dashboard.actions';
import * as AuthSelectors from '../../auth/store/auth';

@Injectable({
  providedIn: 'root'
})
export class DashboardSocketService {
  private socket: Socket | null = null;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 3;

  constructor(private store: Store) {
    this.initSocket();
  }

  private initSocket(): void {
    // Only initialize socket if we have a token
    this.store.select(AuthSelectors.selectToken).subscribe(token => {
      if (token && !this.socket && this.connectionAttempts < this.maxConnectionAttempts) {
        try {
          this.socket = io(environment.wsUrl, {
            auth: {
              token
            },
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
          });

          this.setupSocketListeners();
          this.connectionAttempts = 0; // Reset on successful connection
        } catch (error) {
          console.error('Failed to initialize WebSocket connection:', error);
          this.connectionAttempts++;
          
          // Retry connection after a delay
          if (this.connectionAttempts < this.maxConnectionAttempts) {
            setTimeout(() => {
              this.initSocket();
            }, 5000);
          }
        }
      }
    });
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      // Attempt to reconnect if it's not a manual disconnect
      if (reason !== 'io client disconnect') {
        this.socket = null;
        this.initSocket();
      }
    });

    this.socket.on('booking_confirmed', (data: any) => {
      // Handle booking confirmed event
      console.log('Booking confirmed:', data);
      // Dispatch action to update booking state
    });

    this.socket.on('booking_cancelled', (data: any) => {
      // Handle booking cancelled event
      console.log('Booking cancelled:', data);
      // Dispatch action to update booking state
    });

    this.socket.on('availability_updated', (data: any) => {
      // Handle availability updated event
      console.log('Availability updated:', data);
      // Dispatch action to update availability state
    });
  }

  joinProviderRoom(providerId: string): void {
    if (this.socket) {
      this.socket.emit('join_provider_room', { providerId });
    }
  }

  leaveProviderRoom(providerId: string): void {
    if (this.socket) {
      this.socket.emit('leave_provider_room', { providerId });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}