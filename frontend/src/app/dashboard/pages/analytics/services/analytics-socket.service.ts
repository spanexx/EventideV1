import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AnalyticsData } from '../models/analytics.models';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsSocketService {
  private socket: Socket;
  private analyticsUpdateSubject = new Subject<AnalyticsData>();

  public analyticsUpdate$ = this.analyticsUpdateSubject.asObservable();

  constructor() {
    this.socket = io(environment.apiUrl);
    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    this.socket.on('analytics_update', (data: AnalyticsData) => {
      this.analyticsUpdateSubject.next(data);
    });
  }

  joinProviderRoom(providerId: string): void {
    this.socket.emit('join_analytics_room', { providerId });
  }

  leaveProviderRoom(providerId: string): void {
    this.socket.emit('leave_analytics_room', { providerId });
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
