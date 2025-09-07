/*
 * WebSocket Service Example
 * 
 * This is an example of how to use the socket.io-client in the frontend
 * to connect to the backend WebSocket server.
 */

import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket;

  constructor() {
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

    // Listen for availability updates
    this.socket.on('availabilityUpdated', (data) => {
      console.log('Availability updated:', data);
      // Update the UI with the new availability data
      this.handleAvailabilityUpdate(data);
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
    
    // Example: Dispatch an action to update the store
    // this.store.dispatch(availabilityActions.updateAvailability({ data }));
  }

  // Disconnect from the WebSocket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}