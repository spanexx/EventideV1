import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AnalyticsData } from './analytics.service';

interface AnalyticsRoomPayload {
  providerId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AnalyticsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(AnalyticsGateway.name);

  afterInit(): void {
    this.logger.log('AnalyticsGateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_analytics_room')
  handleJoinAnalyticsRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AnalyticsRoomPayload,
  ): void {
    const room = this.getRoomName(payload?.providerId);
    if (!room) {
      this.logger.warn(`Rejecting join_analytics_room without providerId from client ${client.id}`);
      return;
    }

    client.join(room);
    this.logger.log(`Client ${client.id} joined analytics room ${room}`);
  }

  @SubscribeMessage('leave_analytics_room')
  handleLeaveAnalyticsRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AnalyticsRoomPayload,
  ): void {
    const room = this.getRoomName(payload?.providerId);
    if (!room) {
      this.logger.warn(`Rejecting leave_analytics_room without providerId from client ${client.id}`);
      return;
    }

    client.leave(room);
    this.logger.log(`Client ${client.id} left analytics room ${room}`);
  }

  emitAnalyticsUpdate(providerId: string, data: AnalyticsData): void {
    const room = this.getRoomName(providerId);
    if (!room) {
      this.logger.warn('emitAnalyticsUpdate called without providerId');
      return;
    }

    if (!this.server) {
      this.logger.warn('emitAnalyticsUpdate called before WebSocket server initialization');
      return;
    }

    this.server.to(room).emit('analytics_update', this.serializeAnalyticsData(data));
    this.logger.log(`analytics_update emitted to room ${room}`);
  }

  private getRoomName(providerId?: string): string | null {
    if (!providerId) {
      return null;
    }

    return `analytics-${providerId}`;
  }

  private serializeAnalyticsData(data: AnalyticsData) {
    return {
      metrics: data.metrics,
      revenueData: {
        daily: data.revenueData.daily.map(({ date, amount }) => ({ date: date.toISOString(), amount })),
        weekly: data.revenueData.weekly.map(({ date, amount }) => ({ date: date.toISOString(), amount })),
        monthly: data.revenueData.monthly.map(({ date, amount }) => ({ date: date.toISOString(), amount })),
      },
      occupancyData: {
        daily: data.occupancyData.daily.map(({ date, rate }) => ({ date: date.toISOString(), rate })),
        weekly: data.occupancyData.weekly.map(({ date, rate }) => ({ date: date.toISOString(), rate })),
        monthly: data.occupancyData.monthly.map(({ date, rate }) => ({ date: date.toISOString(), rate })),
      },
      bookingTrends: data.bookingTrends.map(({ date, count }) => ({ date: date.toISOString(), count })),
    };
  }
}
