import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../../environments/environment';
import { Booking } from '../../../shared/models/booking.models';
import { TimeSlot } from '../../../shared/models/availability.models';

@Injectable({
  providedIn: 'root'
})
export class BookingSocketService {
  private socket: Socket | null = null;
  private bookingConfirmedSubject = new Subject<Booking>();
  private slotBookedSubject = new Subject<string>();
  
  public bookingConfirmed$ = this.bookingConfirmedSubject.asObservable();
  public slotBooked$ = this.slotBookedSubject.asObservable();

  constructor() {
    this.initSocket();
  }

  private initSocket(): void {
    try {
      this.socket = io(environment.wsUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      this.setupSocketListeners();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Booking WebSocket connected successfully');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Booking WebSocket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Booking WebSocket disconnected:', reason);
    });

    this.socket.on('booking_confirmed', (booking: Booking) => {
      this.bookingConfirmedSubject.next(booking);
    });
    
    this.socket.on('slot_booked', (slotId: string) => {
      this.slotBookedSubject.next(slotId);
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