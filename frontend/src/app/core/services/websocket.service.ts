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

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;

  constructor(private store: Store) {
    // Connect to the WebSocket server
    this.socket = io(environment.apiUrl, {
      transports: ['websocket'],
      withCredentials: true
    });

    // Listen for connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server with ID:', this.socket.id);
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

  // Disconnect from the WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}